
import { FixedExpense } from '@/types/finance';
import { getUpdatedBudgetForFixedExpense, propagateFixedItemsToFutureMonths } from '@/contexts/finance/financeUtils';
import { v4 as uuidv4 } from 'uuid';

export const useFixedExpense = (setState: React.Dispatch<React.SetStateAction<any>>) => {
  const updateFixedExpense = (expense: FixedExpense, currentMonth: number, currentYear: number) => {
    const budgetKey = `${currentMonth}-${currentYear}`;
    
    setState(prev => {
      const currentBudget = prev.budgets[budgetKey];
      const oldExpense = currentBudget.fixedExpenses.find(e => e.id === expense.id);
      
      let updatedExpenses = currentBudget.fixedExpenses;
      if (oldExpense) {
        updatedExpenses = updatedExpenses.map(e => e.id === expense.id ? expense : e);
      } else {
        updatedExpenses = [...updatedExpenses, expense];
      }
      
      const updatedBudget = getUpdatedBudgetForFixedExpense(
        currentBudget, 
        expense, 
        oldExpense
      );
      
      // Mise à jour du budget courant
      const newState = {
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: {
            ...updatedBudget,
            fixedExpenses: updatedExpenses
          }
        }
      };
      
      // Si on ajoute une nouvelle dépense ou on change le nom/montant (pas juste l'état payé),
      // propager aux mois futurs
      if (!oldExpense || oldExpense.name !== expense.name || oldExpense.amount !== expense.amount) {
        const updateFutureExpense = (futureKey: string, itemToUpdate: FixedExpense) => {
          const futureBudget = newState.budgets[futureKey];
          
          if (!futureBudget) return; // Skip if budget doesn't exist
          
          const existingIndex = futureBudget.fixedExpenses.findIndex(e => e.id === itemToUpdate.id);
          let updatedFutureExpenses;
          
          if (existingIndex >= 0) {
            // Update existing expense in future month
            updatedFutureExpenses = [...futureBudget.fixedExpenses];
            updatedFutureExpenses[existingIndex] = { 
              ...itemToUpdate,
              isPaid: false // Reset paid status for future months
            };
          } else {
            // Add expense to future month
            updatedFutureExpenses = [...futureBudget.fixedExpenses, { 
              ...itemToUpdate, 
              isPaid: false // Reset paid status for future months
            }];
          }
          
          // Mettre à jour le solde restant du mois futur
          const updatedFutureBudget = getUpdatedBudgetForFixedExpense(
            futureBudget,
            { ...itemToUpdate, isPaid: false },
            existingIndex >= 0 ? futureBudget.fixedExpenses[existingIndex] : undefined
          );
          
          newState.budgets[futureKey] = {
            ...updatedFutureBudget,
            fixedExpenses: updatedFutureExpenses
          };
        };
        
        // Propager aux mois futurs
        propagateFixedItemsToFutureMonths(
          newState, 
          currentMonth, 
          currentYear, 
          updateFutureExpense, 
          { ...expense, isPaid: false }
        );
      }
      
      return newState;
    });
  };

  const addFixedExpense = (name: string, amount: number, currentMonth: number, currentYear: number) => {
    const newExpense: FixedExpense = {
      id: uuidv4(),
      name,
      amount,
      isPaid: false
    };
    
    updateFixedExpense(newExpense, currentMonth, currentYear);
  };

  const removeFixedExpense = (id: string, currentMonth: number, currentYear: number) => {
    const budgetKey = `${currentMonth}-${currentYear}`;
    
    setState(prev => {
      const currentBudget = prev.budgets[budgetKey];
      const expenseToRemove = currentBudget.fixedExpenses.find(e => e.id === id);
      
      if (!expenseToRemove) return prev;
      
      // Create a reversed effect expense (zero amount) to update the budget
      const reversedExpense = {
        ...expenseToRemove,
        amount: 0
      };
      
      const updatedBudget = getUpdatedBudgetForFixedExpense(
        currentBudget, 
        reversedExpense, 
        expenseToRemove
      );
      
      const newState = {
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: {
            ...updatedBudget,
            fixedExpenses: currentBudget.fixedExpenses.filter(e => e.id !== id)
          }
        }
      };
      
      // Supprimer cette dépense de tous les mois futurs
      const removeFutureExpense = (futureKey: string, itemToRemove: FixedExpense) => {
        const futureBudget = newState.budgets[futureKey];
        
        if (!futureBudget) return; // Skip if budget doesn't exist
        
        // Trouve l'élément à supprimer pour mettre à jour le solde
        const futureExpenseToRemove = futureBudget.fixedExpenses.find(e => e.id === itemToRemove.id);
        
        if (futureExpenseToRemove) {
          // Mettre à jour le solde restant du mois futur avant de supprimer l'élément
          const updatedFutureBudget = getUpdatedBudgetForFixedExpense(
            futureBudget,
            { ...futureExpenseToRemove, amount: 0 },
            futureExpenseToRemove
          );
          
          // Remove the expense from future months
          newState.budgets[futureKey] = {
            ...updatedFutureBudget,
            fixedExpenses: futureBudget.fixedExpenses.filter(e => e.id !== itemToRemove.id)
          };
        }
      };
      
      propagateFixedItemsToFutureMonths(
        newState, 
        currentMonth, 
        currentYear, 
        removeFutureExpense, 
        expenseToRemove, 
        true
      );
      
      return newState;
    });
  };

  return { 
    updateFixedExpense,
    addFixedExpense,
    removeFixedExpense
  };
};
