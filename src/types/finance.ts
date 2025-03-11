

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  account: string;
  type: 'income' | 'expense';
  isYearlyRecurring?: boolean;
  fromSavingsAccount?: boolean;
  savingsAccountId?: string; // Add this field to track which savings account is the source
}

export interface MonthlyBudget {
  month: number;
  year: number;
  initialBalance: number;
  remainingBalance: number;
  monthlySavings: number;
  isSavingsSetAside: boolean;
  isSavingsTransferred: boolean;
  fixedIncomes: FixedIncome[];
  fixedExpenses: FixedExpense[];
  transactions: Transaction[];
}

export interface FinanceState {
  userId: string;
  currentMonth: number;
  currentYear: number;
  budgets: Record<string, MonthlyBudget>;
  accounts: string[];
  categories: string[];
}

export interface FixedIncome {
  id: string;
  name: string;
  amount: number;
  isReceived: boolean;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  isPaid: boolean;
}

export interface SavingsAccount {
  id: string;
  name: string;
  accountType: string;
  interestRate: number;
  interestFrequency: "monthly" | "annually";
  interestType: "fixed" | "variable";
  isLiquid: boolean;
  maxDepositLimit: number | null;
  currentBalance: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SavingsTransaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  transactionDate: Date;
  transactionType: 'deposit' | 'withdrawal' | 'interest';
}

