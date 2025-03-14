import { FinanceState as BaseFinanceState, MonthlyBudget } from "@/types/finance";
import { initialState } from "@/contexts/finance/initialData";
import { supabase } from "@/integrations/supabase/client";

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

  /**
   * getCurrentBudget : Renvoie simplement le budget du mois courant **sans** modifier le state.
   * Si le budget existe, il est renvoyé ; sinon, un objet par défaut est retourné.
   */
  const getCurrentBudget = (): MonthlyBudget => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;
    if (state.budgets[budgetKey]) {
      return state.budgets[budgetKey];
    }
    return {
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

  const updateInitialBalance = (amount: number) => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;
    setState((prev) => {
      const currentBudget = prev.budgets[budgetKey] || getCurrentBudget();
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: {
            ...currentBudget,
            initialBalance: amount,
            remainingBalance:
              amount - (currentBudget.remainingBalance - currentBudget.initialBalance),
          },
        },
      };
    });
  };

  /**
   * updateMonthlySavings :
   * - Met à jour localement la valeur monthlySavings du mois courant.
   * - Met à jour Supabase pour le mois courant.
   * - Si currentMonthOnly est false, propage cette valeur aux mois futurs.
   *   Si aucun budget futur n'existe, il crée d'abord les budgets pour les 3 mois suivants.
   */
  const updateMonthlySavings = async (amount: number, currentMonthOnly = false) => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;

    // 1) Mise à jour locale du mois courant
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

    // 2) Mise à jour Supabase pour le mois courant
    const { data, error } = await supabase
      .from("monthly_budgets")
      .update({ monthly_savings: amount })
      .eq("user_id", state.userId)
      .eq("month", state.currentMonth)
      .eq("year", state.currentYear);

    if (error) {
      console.error("Erreur lors de la mise à jour de l'épargne dans Supabase :", error);
    } else {
      console.log("Épargne mise à jour dans Supabase pour le mois courant :", data);
    }

    // 3) Propagation aux mois futurs si demandé
    if (!currentMonthOnly) {
      const currentDate = new Date(state.currentYear, state.currentMonth, 1);
      let futureKeys = Object.keys(state.budgets).filter((key) => {
        const [m, y] = key.split("-").map(Number);
        const date = new Date(y, m, 1);
        return date > currentDate;
      });

      // Si aucun budget futur n'existe, créer les budgets pour les 3 prochains mois
      if (futureKeys.length === 0) {
        const newBudgets: Record<string, MonthlyBudget> = {};
        for (let i = 1; i <= 3; i++) {
          const nextDate = new Date(state.currentYear, state.currentMonth + i, 1);
          const nextMonth = nextDate.getMonth();
          const nextYear = nextDate.getFullYear();
          const nextBudgetKey = `${nextMonth}-${nextYear}`;
          if (!state.budgets[nextBudgetKey]) {
            newBudgets[nextBudgetKey] = {
              month: nextMonth,
              year: nextYear,
              initialBalance: 0,
              remainingBalance: 0,
              monthlySavings: amount,
              isSavingsSetAside: false,
              isSavingsTransferred: false,
              fixedIncomes: [],
              fixedExpenses: [],
              transactions: [],
            };
            // Optionnel : insérer le nouveau budget dans Supabase
            await supabase.from("monthly_budgets").insert({
              user_id: state.userId,
              month: nextMonth,
              year: nextYear,
              monthly_savings: amount,
              initial_balance: 0,
              remaining_balance: 0,
              is_savings_set_aside: false,
              is_savings_transferred: false,
            });
          }
        }
        // Mettre à jour le state avec les nouveaux budgets
        setState((prev) => ({
          ...prev,
          budgets: { ...prev.budgets, ...newBudgets },
        }));
        // Recalculez futureKeys après création
        futureKeys = Object.keys(state.budgets).filter((key) => {
          const [m, y] = key.split("-").map(Number);
          const date = new Date(y, m, 1);
          return date > currentDate;
        });
      }

      // 3.1 Mise à jour locale des budgets futurs
      setState((prev) => {
        const newBudgets = { ...prev.budgets };
        futureKeys.forEach((fk) => {
          newBudgets[fk] = {
            ...newBudgets[fk],
            monthlySavings: amount,
          };
        });
        return { ...prev, budgets: newBudgets };
      });

      // 3.2 Mise à jour Supabase pour chaque budget futur
      for (const fk of futureKeys) {
        const [m, y] = fk.split("-").map(Number);
        const { data: updData, error: updError } = await supabase
          .from("monthly_budgets")
          .update({ monthly_savings: amount })
          .eq("user_id", state.userId)
          .eq("month", m)
          .eq("year", y);
        if (updError) {
          console.error(`Erreur mise à jour épargne pour ${fk} :`, updError);
        } else {
          console.log(`Épargne mise à jour dans Supabase pour ${fk} :`, updData);
        }
      }
    }
  };

  const toggleSavingsSetAside = () => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;
    setState((prev) => {
      const currentBudget = prev.budgets[budgetKey] || getCurrentBudget();
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
      const currentBudget = prev.budgets[budgetKey] || getCurrentBudget();
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
