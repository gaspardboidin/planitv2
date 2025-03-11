import { FinanceState as BaseFinanceState, MonthlyBudget } from "@/types/finance";
import { initialState } from "@/contexts/finance/initialData";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
interface FinanceState extends BaseFinanceState {
  userId: string;
}

export const useBudget = (
  state: FinanceState,
  setState: React.Dispatch<React.SetStateAction<FinanceState>>
) => {
  const setCurrentMonth = (month: number) => {
    setState((prev) => ({ ...prev, currentMonth: month }));
  };

  const setCurrentYear = (year: number) => {
    setState((prev) => ({ ...prev, currentYear: year }));
  };

  // getCurrentBudget se contente de lire l'état sans modifier celui-ci pendant le rendu
  const getCurrentBudget = (): MonthlyBudget => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;
    return state.budgets[budgetKey] ?? {
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
  };

  // useEffect pour initialiser le budget si nécessaire (hors du rendu)
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

      setState((prev) => ({
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: newBudget,
        },
      }));
    }
  }, [state.currentMonth, state.currentYear, state.budgets, setState]);

  const updateInitialBalance = (amount: number) => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;

    setState((prev) => {
      const currentBudget = prev.budgets[budgetKey];
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: {
            ...currentBudget,
            initialBalance: amount,
            remainingBalance: amount - (currentBudget.remainingBalance - currentBudget.initialBalance),
          },
        },
      };
    });
  };

  const updateMonthlySavings = async (amount: number, currentMonthOnly = false) => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;

    // Mise à jour locale (UI)
    setState((prev) => ({
      ...prev,
      budgets: {
        ...prev.budgets,
        [budgetKey]: {
          ...prev.budgets[budgetKey],
          monthlySavings: amount,
        },
      },
    }));

    // Mise à jour Supabase
    const { data, error } = await supabase
      .from("monthly_budgets")
      .update({ monthly_savings: amount })
      .eq("user_id", state.userId) // Assure-toi que state.userId est défini et cohérent
      .eq("month", state.currentMonth)
      .eq("year", state.currentYear);

    if (error) {
      console.error("Erreur lors de la mise à jour de l'épargne dans Supabase :", error);
    } else {
      console.log("Épargne mise à jour dans Supabase :", data);
    }
  };

  const toggleSavingsSetAside = () => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;
    setState((prev) => {
      const currentBudget = prev.budgets[budgetKey];
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: {
            ...currentBudget,
            isSavingsSetAside: !currentBudget.isSavingsSetAside,
          },
        },
      };
    });
  };

  const markSavingsAsTransferred = () => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;
    setState((prev) => {
      const currentBudget = prev.budgets[budgetKey];
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: {
            ...currentBudget,
            isSavingsTransferred: true,
          },
        },
      };
    });
  };

  const resetAllData = () => {
    setState(initialState);
  };

  return {
    setCurrentMonth,
    setCurrentYear,
    getCurrentBudget,
    updateInitialBalance,
    updateMonthlySavings,
    toggleSavingsSetAside,
    markSavingsAsTransferred,
    resetAllData,
  };
};
