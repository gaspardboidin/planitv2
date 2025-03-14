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
import { useAuth } from "@/hooks/use-auth";

export function useFinanceState() {
  // 1) Initialiser le state de finance (incluant budgets, comptes, etc.)
  const [state, setState] = useInitializeState();

  // 2) État de chargement global
  const [isLoading, setIsLoading] = useState(true);

  // 3) Récupérer l'utilisateur connecté depuis useAuth
  const { user } = useAuth();

  // 4) Dès que l'utilisateur est disponible, mettre à jour state.userId
  useEffect(() => {
    if (user && user.id && user.id !== state.userId) {
      setState(prev => ({
        ...prev,
        userId: user.id,
      }));
    }
  }, [user, state.userId, setState]);

  // 5) Synchroniser le state dans le localStorage (et Supabase) à chaque modification
  useLocalStoragePersistence(state);

  // 6) Récupérer les fonctions liées au budget
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

  // 7) Charger les budgets depuis Supabase dès que userId est défini
  useEffect(() => {
    async function loadInitialData() {
      if (!state.userId) {
        // Si l'userId n'est pas défini, on ne charge rien et on arrête le chargement
        setIsLoading(false);
        return;
      }
      try {
        console.log("Début du chargement initial des budgets pour l'utilisateur:", state.userId);
        const { data: budgetsData, error: budgetsError } = await supabase
          .from("monthly_budgets")
          .select("*")
          .eq("user_id", state.userId);

        if (budgetsError) {
          console.error("Erreur lors du chargement des budgets:", budgetsError);
        } else if (budgetsData) {
          // Transformer les données récupérées en un objet de type Record<string, MonthlyBudget>
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
              fixedIncomes: [],   // Vous pouvez charger ces données si nécessaire
              fixedExpenses: [],  // Vous pouvez charger ces données si nécessaire
              transactions: [],   // Vous pouvez charger ces données si nécessaire
            };
          });
          // Fusionner avec les budgets déjà présents dans le state
          setState(prev => ({
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
        console.log("Chargement initial terminé, isLoading =", false);
      }
    }
    loadInitialData();
  }, [state.userId, setState]);

  // 8) Fonction pour obtenir tous les budgets mensuels sous forme de tableau
  const getMonthlyBudgets = (): MonthlyBudget[] => Object.values(state.budgets);

  // 9) Calcul des totaux via useFinanceTotals (les fonctions de totaux se basent sur getCurrentBudget)
  const {
    getTotalFixedIncomes,
    getTotalFixedExpenses,
    getTotalTransactions,
  } = useFinanceTotals(getCurrentBudget);

  // 10) Fonctions de gestion des transactions
  const {
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactionState(state, setState);

  // 11) Fonctions de gestion des revenus fixes
  const {
    updateFixedIncome,
    addFixedIncome,
    removeFixedIncome,
    updateCurrentMonthIncome,
  } = useFixedIncomeState(state, setState);

  // 12) Fonctions de gestion des dépenses fixes
  const {
    updateFixedExpense,
    addFixedExpense,
    removeFixedExpense,
    updateCurrentMonthExpense,
  } = useFixedExpenseState(state, setState);

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
