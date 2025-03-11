import { FixedExpense } from '@/types/finance';
import { useFixedExpense } from '@/hooks/finance/useFixedExpense';
import { getUpdatedBudgetForFixedExpense } from './financeStateUtils';

export const useFixedExpenseState = (state: any, setState: React.Dispatch<React.SetStateAction<any>>) => {
  const { 
    updateFixedExpense: updateFE,
    addFixedExpense: addFE,
    removeFixedExpense: removeFE
  } = useFixedExpense(setState);

  const updateFixedExpense = (expense: FixedExpense) => {
    updateFE(expense, state.currentMonth, state.currentYear);
  };

  const addFixedExpense = (name: string, amount: number) => {
    addFE(name, amount, state.currentMonth, state.currentYear);
  };

  const removeFixedExpense = (id: string) => {
    removeFE(id, state.currentMonth, state.currentYear);
  };

  // Function to update only the current month's expense
  const updateCurrentMonthExpense = (expense: FixedExpense) => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;
    
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
      
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: {
            ...updatedBudget,
            fixedExpenses: updatedExpenses
          }
        }
      };
    });
  };

  return {
    updateFixedExpense,
    addFixedExpense,
    removeFixedExpense,
    updateCurrentMonthExpense
  };
};
