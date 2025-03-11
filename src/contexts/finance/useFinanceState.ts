
import { FinanceState, Transaction, FixedIncome, FixedExpense, MonthlyBudget } from '@/types/finance';
import { useInitializeState } from './state/useInitializeState';
import { useLocalStoragePersistence } from './state/useLocalStoragePersistence';
import { useTransactionState } from './state/useTransactionState';
import { useFixedIncomeState } from './state/useFixedIncomeState';
import { useFixedExpenseState } from './state/useFixedExpenseState';
import { useBudget } from '@/hooks/finance/useBudget';
import { useFinanceTotals } from '@/hooks/finance/useFinanceTotals';

export const useFinanceState = () => {
  // Destructure the tuple correctly to get state and setState separately
  const [state, setState] = useInitializeState();
  
  // Setup persistence to localStorage
  useLocalStoragePersistence(state);

  const { 
    setCurrentMonth, 
    setCurrentYear, 
    getCurrentBudget, 
    updateInitialBalance,
    updateMonthlySavings,
    toggleSavingsSetAside,
    markSavingsAsTransferred,
    resetAllData
  } = useBudget(state, setState);

  // Function to get all monthly budgets as an array
  const getMonthlyBudgets = (): MonthlyBudget[] => {
    return Object.values(state.budgets);
  };

  const { 
    getTotalFixedIncomes, 
    getTotalFixedExpenses, 
    getTotalTransactions 
  } = useFinanceTotals(getCurrentBudget);

  const {
    addTransaction,
    updateTransaction,
    deleteTransaction
  } = useTransactionState(state, setState);

  const {
    updateFixedIncome,
    addFixedIncome,
    removeFixedIncome,
    updateCurrentMonthIncome
  } = useFixedIncomeState(state, setState);
  
  const {
    updateFixedExpense,
    addFixedExpense,
    removeFixedExpense,
    updateCurrentMonthExpense
  } = useFixedExpenseState(state, setState);
  
  return {
    state,
    setCurrentMonth,
    setCurrentYear,
    getCurrentBudget,
    getMonthlyBudgets,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateFixedIncome,
    addFixedIncome,
    removeFixedIncome,
    updateFixedExpense,
    addFixedExpense,
    removeFixedExpense,
    updateInitialBalance,
    updateMonthlySavings,
    toggleSavingsSetAside,
    markSavingsAsTransferred,
    getTotalFixedIncomes,
    getTotalFixedExpenses,
    getTotalTransactions,
    resetAllData,
    updateCurrentMonthIncome,
    updateCurrentMonthExpense
  };
};
