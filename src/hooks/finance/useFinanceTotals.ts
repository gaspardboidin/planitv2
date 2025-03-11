
import { MonthlyBudget } from '@/types/finance';
import { 
  getTotalFixedIncomesUtil, 
  getTotalFixedExpensesUtil, 
  getTotalTransactionsUtil 
} from '@/contexts/finance/financeUtils';

export const useFinanceTotals = (getCurrentBudget: () => MonthlyBudget) => {
  const getTotalFixedIncomes = (excludeReceived?: boolean): number => {
    const currentBudget = getCurrentBudget();
    return getTotalFixedIncomesUtil(currentBudget, excludeReceived);
  };

  const getTotalFixedExpenses = (excludePaid?: boolean): number => {
    const currentBudget = getCurrentBudget();
    return getTotalFixedExpensesUtil(currentBudget, excludePaid);
  };

  const getTotalTransactions = (): number => {
    const currentBudget = getCurrentBudget();
    return getTotalTransactionsUtil(currentBudget);
  };

  return {
    getTotalFixedIncomes,
    getTotalFixedExpenses,
    getTotalTransactions
  };
};
