import { FixedIncome } from '@/types/finance';
import { useFixedIncome } from '@/hooks/finance/useFixedIncome';
import { getUpdatedBudgetForFixedIncome } from './financeStateUtils';

export const useFixedIncomeState = (state: any, setState: React.Dispatch<React.SetStateAction<any>>) => {
  const { 
    updateFixedIncome: updateFI,
    addFixedIncome: addFI,
    removeFixedIncome: removeFI
  } = useFixedIncome(setState);

  const updateFixedIncome = (income: FixedIncome) => {
    updateFI(income, state.currentMonth, state.currentYear);
  };

  const addFixedIncome = (name: string, amount: number) => {
    addFI(name, amount, state.currentMonth, state.currentYear);
  };

  const removeFixedIncome = (id: string) => {
    removeFI(id, state.currentMonth, state.currentYear);
  };

  // Function to update only the current month's income
  const updateCurrentMonthIncome = (income: FixedIncome) => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;
    
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
      
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: {
            ...updatedBudget,
            fixedIncomes: updatedIncomes
          }
        }
      };
    });
  };

  return {
    updateFixedIncome,
    addFixedIncome,
    removeFixedIncome,
    updateCurrentMonthIncome
  };
};
