import { FinanceState, MonthlyBudget } from "@/types/finance";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUserSession, loadUserAccounts, loadUserCategories, saveUserAccounts, saveUserCategories } from "./api";
import { getAllBudgets, saveBudget, createInitialBudget } from "./budgets";
// ↓↓↓ Vérifie que ces fonctions existent vraiment ↓↓↓
// Si elles n'existent plus, supprime l'import
import { getFixedIncomes, saveFixedIncomes, addDefaultFixedIncome } from "./fixedIncomes"; 
import { getFixedExpenses, saveFixedExpenses, addDefaultFixedExpenses } from "./fixedExpenses";
import { getTransactions, saveTransactions, getExistingTransactionIds } from "./transactions";

// Add missing export function that's referenced in other files
export const loadFinanceData = async (): Promise<FinanceState | null> => {
  return await fetchFinanceData();
};

// Add missing export function that's referenced in other files
export const syncFinanceData = async (state: FinanceState): Promise<boolean> => {
  return await saveFinanceData(state);
};

// Récupérer les données financières d'un utilisateur
export const fetchFinanceData = async (): Promise<FinanceState | null> => {
  try {
    const user = await getCurrentUserSession();
    const userId = user.id;

    // Récupérer les budgets mensuels
    const budgetsData = await getAllBudgets(userId);

    // Créer les objets de budget pour chaque mois
    const budgets: Record<string, MonthlyBudget> = {};
    const budgetMap = new Map();

    for (const budget of budgetsData) {
      const key = `${budget.month}-${budget.year}`;
      budgets[key] = {
        month: budget.month,
        year: budget.year,
        initialBalance: budget.initial_balance,
        remainingBalance: budget.remaining_balance,
        monthlySavings: budget.monthly_savings,
        isSavingsSetAside: budget.is_savings_set_aside,
        isSavingsTransferred: budget.is_savings_transferred || false,
        fixedIncomes: [],
        fixedExpenses: [],
        transactions: []
      };
      
      budgetMap.set(budget.id, { month: budget.month, year: budget.year });
    }

    // Pour chaque budget, récupérer les revenus, dépenses et transactions
    for (const budget of budgetsData) {
      const key = `${budget.month}-${budget.year}`;
      
      // Récupérer les revenus fixes (vérifie que getFixedIncomes existe)
      const incomesData = await getFixedIncomes(budget.id);
      if (incomesData.length > 0) {
        budgets[key].fixedIncomes = incomesData.map(income => ({
          id: income.id,
          name: income.name,
          amount: income.amount,
          isReceived: income.isReceived
        }));
      }
      
      // Récupérer les dépenses fixes
      const expensesData = await getFixedExpenses(budget.id);
      if (expensesData.length > 0) {
        budgets[key].fixedExpenses = expensesData.map(expense => ({
          id: expense.id,
          name: expense.name,
          amount: expense.amount,
          isPaid: expense.is_paid
        }));
      }
      
      // Récupérer les transactions
      const transactionsData = await getTransactions(budget.id);
      if (transactionsData.length > 0) {
        budgets[key].transactions = transactionsData.map(transaction => ({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          date: new Date(transaction.date),
          category: transaction.category,
          account: transaction.account,
          type: transaction.type as 'income' | 'expense'
        }));
      }
    }

    // Get accounts and categories
    const accounts = await loadUserAccounts(userId);
    const categories = await loadUserCategories(userId);

    // Créer l'objet FinanceState final
    const financeState: FinanceState = {
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      budgets: budgets,
      accounts: accounts,
      categories: categories
    };

    return financeState;
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des données financières:", error);
    
    // Si tu veux un message plus précis :
    const errMsg = error instanceof Error ? error.message : String(error);

    toast({
      title: "Erreur",
      description: "Impossible de récupérer vos données financières: " + (errMsg || "Erreur inconnue"),
      variant: "destructive"
    });
    return null;
  }
};

// Sauvegarder les données financières d'un utilisateur
export const saveFinanceData = async (state: FinanceState): Promise<boolean> => {
  try {
    const user = await getCurrentUserSession();
    const userId = user.id;

    // Pour chaque budget dans l'état
    for (const [key, budget] of Object.entries(state.budgets)) {
      const [month, year] = key.split('-').map(Number);
      
      // Save the budget and get the budget ID
      const budgetId = await saveBudget(
        {
          month,
          year,
          initialBalance: budget.initialBalance,
          remainingBalance: budget.remainingBalance,
          monthlySavings: budget.monthlySavings,
          isSavingsSetAside: budget.isSavingsSetAside,
          isSavingsTransferred: budget.isSavingsTransferred
        }, 
        userId
      );
      
      if (!budgetId) continue;
      
      // Save fixed incomes
      await saveFixedIncomes(budgetId, userId, budget.fixedIncomes);
      
      // Save fixed expenses
      await saveFixedExpenses(budgetId, userId, budget.fixedExpenses);
      
      // Save transactions
      const existingTransactionIds = await getExistingTransactionIds(budgetId);
      await saveTransactions(budgetId, userId, budget.transactions, existingTransactionIds);
    }

    // Update accounts and categories
    await saveUserAccounts(userId, state.accounts);
    await saveUserCategories(userId, state.categories);

    return true;
  } catch (error: unknown) {
    console.error("Erreur lors de la sauvegarde des données financières:", error);
    const errMsg = error instanceof Error ? error.message : String(error);

    toast({
      title: "Erreur",
      description: "Impossible de sauvegarder vos données financières: " + (errMsg || "Erreur inconnue"),
      variant: "destructive"
    });
    return false;
  }
};

// Initialiser les données financières pour un nouvel utilisateur
export const initializeFinanceData = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUserSession();
    const userId = user.id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Créer le budget initial
    const budgetId = await createInitialBudget(userId, currentMonth, currentYear);
    
    if (!budgetId) {
      throw new Error("Impossible de créer le budget initial");
    }

    // Si tu as vraiment besoin de addDefaultFixedIncome, 
    // assure-toi qu'il est exporté par fixedIncomes.ts
    // Sinon, supprime l'appel :
    // await addDefaultFixedIncome(budgetId, userId);

    // Ajouter des dépenses fixes par défaut
    await addDefaultFixedExpenses(budgetId, userId);

    // Sauvegarder comptes et catégories par défaut
    await saveUserAccounts(userId, ['Courant', 'Espèces', 'Carte bancaire']);
    await saveUserCategories(userId, ['Alimentation', 'Transport', 'Loisirs', 'Santé', 'Logement', 'Habillement', 'Autres']);

    return true;
  } catch (error: unknown) {
    console.error("Erreur lors de l'initialisation des données financières:", error);
    const errMsg = error instanceof Error ? error.message : String(error);

    toast({
      title: "Erreur",
      description: "Impossible d'initialiser vos données financières: " + (errMsg || "Erreur inconnue"),
      variant: "destructive"
    });
    return false;
  }
};
