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
   * getCurrentBudget : Renvoie simplement le budget du mois courant **sans** setState.
   * - Si le budget existe, on le retourne.
   * - Sinon, on retourne un budget “virtuel” par défaut (mais on ne l'ajoute pas dans le state).
   *   => La création “à la demande” se fera dans un useEffect dans useFinanceState.ts (par ex.)
   */
  const getCurrentBudget = (): MonthlyBudget => {
    const budgetKey = `${state.currentMonth}-${state.currentYear}`;
    if (state.budgets[budgetKey]) {
      // Le budget existe déjà, on le renvoie
      return state.budgets[budgetKey];
    }

    // Sinon, on retourne juste un objet “par défaut” **sans** faire de setState
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
      const currentBudget = prev.budgets[budgetKey];
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
   * - Si tu veux propager aux mois futurs déjà créés, tu peux ajouter la boucle.
   * - Met aussi à jour Supabase pour le mois courant.
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

    // 3) Si l'utilisateur veut appliquer à tous les mois futurs déjà créés
    if (!currentMonthOnly) {
      const currentDate = new Date(state.currentYear, state.currentMonth, 1);

      // Trouver tous les budgets futurs
      const futureKeys = Object.keys(state.budgets).filter((key) => {
        const [m, y] = key.split("-").map(Number);
        const date = new Date(y, m, 1);
        return date > currentDate;
      });

      if (futureKeys.length > 0) {
        // 3.1 Mettre à jour localement
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

        // 3.2 Mettre à jour Supabase pour chaque budget futur
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
