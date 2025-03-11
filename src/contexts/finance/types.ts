
import { FinanceState, MonthlyBudget, Transaction, FixedIncome, FixedExpense } from '@/types/finance';

export interface FinanceContextType {
  state: FinanceState;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  getCurrentBudget: () => MonthlyBudget;
  getMonthlyBudgets: () => MonthlyBudget[]; // Added missing method
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateFixedIncome: (income: FixedIncome) => void;
  addFixedIncome: (name: string, amount: number) => void;
  removeFixedIncome: (id: string) => void;
  updateFixedExpense: (expense: FixedExpense) => void;
  addFixedExpense: (name: string, amount: number) => void;
  removeFixedExpense: (id: string) => void;
  updateInitialBalance: (amount: number) => void;
  updateMonthlySavings: (amount: number, currentMonthOnly?: boolean) => void;
  toggleSavingsSetAside: () => void;
  markSavingsAsTransferred: () => void;
  getTotalFixedIncomes: (excludeReceived?: boolean) => number;
  getTotalFixedExpenses: (excludePaid?: boolean) => number;
  getTotalTransactions: () => number;
  resetAllData: () => void;
  updateCurrentMonthIncome: (income: FixedIncome) => void;
  updateCurrentMonthExpense: (expense: FixedExpense) => void;
}
