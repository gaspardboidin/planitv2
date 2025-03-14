import { v4 as uuid } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { handleServiceError } from "./api";
import { FixedExpense } from "@/types/finance";

/**
 * Récupérer les dépenses fixes pour un budget donné.
 */
export const getFixedExpenses = async (budgetId: string): Promise<FixedExpense[]> => {
  try {
    const { data, error } = await supabase
      .from("fixed_expenses")
      .select("*")
      .eq("budget_id", budgetId);

    if (error) throw error;
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      isPaid: item.is_paid || false,
    }));
  } catch (error) {
    handleServiceError(error, "Erreur lors de la récupération des dépenses fixes");
    return [];
  }
};

/**
 * Sauvegarder les dépenses fixes pour un budget donné.
 * Utilise une logique d'upsert + suppression sélective : 
 * - Upsert de tous les éléments locaux.
 * - Suppression des éléments en base qui ne figurent plus en local.
 */
export const saveFixedExpenses = async (
  budgetId: string,
  userId: string,
  expenses: FixedExpense[]
): Promise<boolean> => {
  try {
    // 1) Récupérer les dépenses existantes en base pour ce budget et cet utilisateur.
    const { data: existingExpenses, error: fetchError } = await supabase
      .from("fixed_expenses")
      .select("id")
      .eq("budget_id", budgetId)
      .eq("user_id", userId);

    if (fetchError) throw fetchError;
    const existingIds = new Set((existingExpenses || []).map((e: any) => e.id));

    // 2) Préparer le upsert de toutes les dépenses locales.
    const upsertData = expenses.map((expense) => ({
      id: expense.id || uuid(), // Générer un ID si nécessaire.
      budget_id: budgetId,
      user_id: userId,
      name: expense.name,
      amount: expense.amount,
      is_paid: expense.isPaid || false,
    }));

    if (upsertData.length > 0) {
      const { error: upsertError } = await supabase
        .from("fixed_expenses")
        .upsert(upsertData, { onConflict: "id" });
      if (upsertError) throw upsertError;
    }

    // 3) Supprimer les éléments en base qui ne sont plus dans la liste locale.
    const localIds = new Set(upsertData.map((exp) => exp.id));
    const idsToDelete = [...existingIds].filter((id) => !localIds.has(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("fixed_expenses")
        .delete()
        .in("id", idsToDelete);
      if (deleteError) throw deleteError;
    }

    return true;
  } catch (error) {
    handleServiceError(error, "Erreur lors de la sauvegarde des dépenses fixes");
    return false;
  }
};

/**
 * Ajouter des dépenses fixes par défaut lors de l'initialisation d'un utilisateur.
 */
export const addDefaultFixedExpenses = async (budgetId: string, userId: string): Promise<boolean> => {
  try {
    const defaultExpenses = [
      {
        id: uuid(),
        budget_id: budgetId,
        user_id: userId,
        name: "Loyer",
        amount: 0,
        is_paid: false,
      },
      {
        id: uuid(),
        budget_id: budgetId,
        user_id: userId,
        name: "Internet",
        amount: 0,
        is_paid: false,
      },
    ];

    const { error } = await supabase
      .from("fixed_expenses")
      .insert(defaultExpenses);

    if (error) throw error;
    return true;
  } catch (error) {
    handleServiceError(error, "Erreur lors de la création des dépenses fixes par défaut");
    return false;
  }
};
