import { useEffect, useState } from "react";
import { FinanceState, Transaction, FixedIncome, FixedExpense, MonthlyBudget } from "@/types/finance";
import { useInitializeState } from "./state/useInitializeState";
import { useLocalStoragePersistence } from "./state/useLocalStoragePersistence";
import { useTransactionState } from "./state/useTransactionState";
import { useFixedIncomeState } from "./state/useFixedIncomeState";
import { useFixedExpenseState } from "./state/useFixedExpenseState";
import { useBudget } from "@/hooks/finance/useBudget";
import { supabase } from "@/integrations/supabase/client";
import { useFinanceTotals } from "@/hooks/finance/useFinanceTotals";
// import { useAuth } from "@/hooks/use-auth"; // <-- si besoin pour userId

/**
 * useFinanceState : Hook principal qui gère l'état global Finance.
 */
export function useFinanceState() {
  // 1) Récupérer le state initial (avec userId, etc.)
  const [state, setState] = useInitializeState();

  // 2) Ajouter l'état isLoading (true par défaut)
  const [isLoading, setIsLoading] = useState(true);

  // 3) Synchroniser le state vers localStorage (et Supabase) quand il change
  useLocalStoragePersistence(state);

  // 4) (Optionnel) Mettre à jour le userId depuis un hook useAuth
  // const { user } = useAuth();
  // useEffect(() => {
  //   if (user && user.id && user.id !== state.userId) {
  //     setState((prev) => ({
  //       ...prev,
  //       userId: user.id,
  //     }));
  //   }
  // }, [user, state.userId, setState]);

  // 5) Récupérer les fonctions du hook useBudget
  const {
    setCurrentMonth,
    setCurrentYear,
    getCurrentBudget,
    updateInitialBalance,
    updateMonthlySavings,
    toggleSavingsSetAside,
    markSavingsAsTransferred,
    resetAllData,
  } = useBudget(state, setState);

  // 6) Création "à la demande" du budget du mois courant
  useEffect(() => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;
    if (!state.budgets[budgetKey]) {
      const newBudget: MonthlyBudget = {
        month: state.currentMonth,
        year: state.currentYear,
        initialBalance: 0,
        remainingBalance: 0,
        monthlySavings: 0,
        isSavingsSetAside: false,
        isSavingsTransferred: false,
        fixedIncomes: [],
        fixedExpenses: [],
        transactions: [],
      };

      const previousKeys = Object.keys(state.budgets)
        .map((key) => {
          const [m, y] = key.split("-").map(Number);
          return { key, date: new Date(y, m, 1) };
        })
        .filter((item) => {
          const currentDate = new Date(state.currentYear, state.currentMonth, 1);
          return item.date < currentDate;
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      if (previousKeys.length > 0) {
        const mostRecentKey = previousKeys[0].key;
        const mostRecentBudget = state.budgets[mostRecentKey];
        newBudget.monthlySavings = mostRecentBudget.monthlySavings;
        newBudget.fixedIncomes = mostRecentBudget.fixedIncomes.map((inc) => ({
          ...inc,
          isReceived: false,
        }));
        newBudget.fixedExpenses = mostRecentBudget.fixedExpenses.map((exp) => ({
          ...exp,
          isPaid: false,
        }));
      }

      setState((prev) => ({
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: newBudget,
        },
      }));
    }
  }, [state.currentMonth, state.currentYear, state.budgets, setState]);

  // 7) useEffect pour charger les données initiales depuis Supabase
  useEffect(() => {
    async function loadInitialData() {
      try {
        console.log("Début du chargement initial des données...");

        // Vérifier que le userId est non vide
        if (!state.userId || state.userId.length === 0) {
          console.log("Aucun userId => on ne fait pas la requête Supabase");
          setIsLoading(false);
          return;
        }

        // Requête Supabase
        const { data: budgetsData, error: budgetsError } = await supabase
          .from("monthly_budgets")
          .select("*")
          .eq("user_id", state.userId);

        if (budgetsError) {
          console.error("Erreur lors du chargement des budgets:", budgetsError);
        } else if (budgetsData) {
          const budgetsRecord: Record<string, MonthlyBudget> = {};
          budgetsData.forEach((budget: any) => {
            const key = `${budget.month}-${budget.year}`;
            budgetsRecord[key] = {
              month: budget.month,
              year: budget.year,
              initialBalance: budget.initial_balance,
              remainingBalance: budget.remaining_balance,
              monthlySavings: budget.monthly_savings,
              isSavingsSetAside: budget.is_savings_set_aside,
              isSavingsTransferred: budget.is_savings_transferred || false,
              fixedIncomes: [],
              fixedExpenses: [],
              transactions: [],
            };
          });
          setState((prev) => ({
            ...prev,
            budgets: {
              ...prev.budgets,
              ...budgetsRecord,
            },
          }));
        }
      } catch (error) {
        console.error("Erreur inattendue lors du chargement initial:", error);
      } finally {
        setIsLoading(false);
        console.log("Chargement initial terminé, isLoading = false");
      }
    }
    loadInitialData();
  }, [state.userId, setState]);

  // 8) getMonthlyBudgets
  function getMonthlyBudgets(): MonthlyBudget[] {
    return Object.values(state.budgets);
  }

  // 9) Totaux (incomes, expenses, transactions)
  const {
    getTotalFixedIncomes,
    getTotalFixedExpenses,
    getTotalTransactions,
  } = useFinanceTotals(getCurrentBudget);

  // 10) Fonctions de gestion de transactions
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactionState(state, setState);

  // 11) Fonctions de gestion de revenus fixes
  const { updateFixedIncome, addFixedIncome, removeFixedIncome, updateCurrentMonthIncome } = useFixedIncomeState(state, setState);

  // 12) Fonctions de gestion de dépenses fixes
  const { updateFixedExpense, addFixedExpense, removeFixedExpense, updateCurrentMonthExpense } = useFixedExpenseState(state, setState);

  // 13) Retourner tout, y compris isLoading
  return {
    state,
    isLoading,
    setCurrentMonth,
    setCurrentYear,
    getCurrentBudget,
    getMonthlyBudgets,
    updateInitialBalance,
    updateMonthlySavings,
    toggleSavingsSetAside,
    markSavingsAsTransferred,
    resetAllData,
    getTotalFixedIncomes,
    getTotalFixedExpenses,
    getTotalTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateFixedIncome,
    addFixedIncome,
    removeFixedIncome,
    updateCurrentMonthIncome,
    updateFixedExpense,
    addFixedExpense,
    removeFixedExpense,
    updateCurrentMonthExpense,
  };
}
