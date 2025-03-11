
import { FixedIncome } from '@/types/finance';
import { getUpdatedBudgetForFixedIncome, propagateFixedItemsToFutureMonths } from '@/contexts/finance/financeUtils';
import { v4 as uuidv4 } from 'uuid';

export const useFixedIncome = (setState: React.Dispatch<React.SetStateAction<any>>) => {
  const updateFixedIncome = (income: FixedIncome, currentMonth: number, currentYear: number) => {
    const budgetKey = `${currentMonth}-${currentYear}`;
    
    setState(prev => {
      const currentBudget = prev.budgets[budgetKey];
      const oldIncome = currentBudget.fixedIncomes.find(i => i.id === income.id);
      
      let updatedIncomes = currentBudget.fixedIncomes;
      if (oldIncome) {
        updatedIncomes = updatedIncomes.map(i => i.id === income.id ? income : i);
      } else {
        updatedIncomes = [...updatedIncomes, income];
      }
      
      const updatedBudget = getUpdatedBudgetForFixedIncome(
        currentBudget, 
        income, 
        oldIncome
      );
      
      // Mise à jour du budget courant
      const newState = {
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: {
            ...updatedBudget,
            fixedIncomes: updatedIncomes
          }
        }
      };
      
      // Si on ajoute un nouveau revenu ou on change le nom/montant (pas juste l'état reçu),
      // propager aux mois futurs
      if (!oldIncome || oldIncome.name !== income.name || oldIncome.amount !== income.amount) {
        const updateFutureIncome = (futureKey: string, itemToUpdate: FixedIncome) => {
          const futureBudget = newState.budgets[futureKey];
          
          if (!futureBudget) return; // Skip if budget doesn't exist
          
          const existingIndex = futureBudget.fixedIncomes.findIndex(i => i.id === itemToUpdate.id);
          let updatedFutureIncomes;
          
          if (existingIndex >= 0) {
            // Update existing income in future month
            updatedFutureIncomes = [...futureBudget.fixedIncomes];
            updatedFutureIncomes[existingIndex] = { 
              ...itemToUpdate,
              isReceived: false // Reset received status for future months
            };
          } else {
            // Add income to future month
            updatedFutureIncomes = [...futureBudget.fixedIncomes, { 
              ...itemToUpdate, 
              isReceived: false // Reset received status for future months
            }];
          }
          
          // Mettre à jour le solde restant du mois futur
          const updatedFutureBudget = getUpdatedBudgetForFixedIncome(
            futureBudget,
            { ...itemToUpdate, isReceived: false },
            existingIndex >= 0 ? futureBudget.fixedIncomes[existingIndex] : undefined
          );
          
          newState.budgets[futureKey] = {
            ...updatedFutureBudget,
            fixedIncomes: updatedFutureIncomes
          };
        };
        
        // Propager aux mois futurs seulement si on n'est pas en train de modifier l'état "reçu"
        // ou pour un nouvel ajout
        propagateFixedItemsToFutureMonths(
          newState, 
          currentMonth, 
          currentYear, 
          updateFutureIncome, 
          { ...income, isReceived: false }
        );
      }
      
      return newState;
    });
  };

  const addFixedIncome = (name: string, amount: number, currentMonth: number, currentYear: number) => {
    console.log("=== addFixedIncome called ===", {
      name,
      amount,
      currentMonth,
      currentYear
    });
    
    const newIncome: FixedIncome = {
      id: uuidv4(),
      name,
      amount,
      isReceived: false
    };
    
    updateFixedIncome(newIncome, currentMonth, currentYear);
  };

  const removeFixedIncome = (id: string, currentMonth: number, currentYear: number) => {
    const budgetKey = `${currentMonth}-${currentYear}`;
    
    setState(prev => {
      const currentBudget = prev.budgets[budgetKey];
      const incomeToRemove = currentBudget.fixedIncomes.find(i => i.id === id);
      
      if (!incomeToRemove) return prev;
      
      // Create a reversed effect income (negative amount) to update the budget
      const reversedIncome = {
        ...incomeToRemove,
        amount: 0
      };
      
      const updatedBudget = getUpdatedBudgetForFixedIncome(
        currentBudget, 
        reversedIncome, 
        incomeToRemove
      );
      
      const newState = {
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: {
            ...updatedBudget,
            fixedIncomes: currentBudget.fixedIncomes.filter(i => i.id !== id)
          }
        }
      };
      
      // Supprimer ce revenu de tous les mois futurs
      const removeFutureIncome = (futureKey: string, itemToRemove: FixedIncome) => {
        const futureBudget = newState.budgets[futureKey];
        
        if (!futureBudget) return; // Skip if budget doesn't exist
        
        // Trouve l'élément à supprimer pour mettre à jour le solde
        const futureIncomeToRemove = futureBudget.fixedIncomes.find(i => i.id === itemToRemove.id);
        
        if (futureIncomeToRemove) {
          // Mettre à jour le solde restant du mois futur avant de supprimer l'élément
          const updatedFutureBudget = getUpdatedBudgetForFixedIncome(
            futureBudget,
            { ...futureIncomeToRemove, amount: 0 },
            futureIncomeToRemove
          );
          
          // Remove the income from future months
          newState.budgets[futureKey] = {
            ...updatedFutureBudget,
            fixedIncomes: futureBudget.fixedIncomes.filter(i => i.id !== itemToRemove.id)
          };
        }
      };
      
      propagateFixedItemsToFutureMonths(
        newState, 
        currentMonth, 
        currentYear, 
        removeFutureIncome, 
        incomeToRemove, 
        true
      );
      
      return newState;
    });
  };

  return { 
    updateFixedIncome,
    addFixedIncome,
    removeFixedIncome
  };
};
