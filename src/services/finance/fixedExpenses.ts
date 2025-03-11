import { supabase } from "@/integrations/supabase/client";
import { v4 as uuid } from "uuid";
import { FixedExpense } from "@/types/finance";
import { handleServiceError } from "./api";

/**
 * Récupérer les dépenses fixes pour un budget donné
 */
export async function getFixedExpenses(budgetId: string): Promise<FixedExpense[]> {
  try {
    const { data, error } = await supabase
      .from("fixed_expenses")
      .select("*")
      .eq("budget_id", budgetId);

    if (error) throw error;
    if (!data) return [];

    // Transformer chaque ligne de la table en FixedExpense
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      isPaid: item.is_paid || false,
    }));
  } catch (error) {
    handleServiceError(error, "Erreur lors de la récupération des dépenses fixes");
    return [];
  }
}

/**
 * Sauvegarder les dépenses fixes (suppression sélective + upsert)
 * => Logique identique à fixedIncomes, pour éviter duplication en base
 */
export async function saveFixedExpenses(
  budgetId: string,
  userId: string,
  expenses: FixedExpense[]
): Promise<boolean> {
  try {
    // 1) Récupérer la liste des dépenses existantes en base (on ne sélectionne que l'id)
    const { data: existingExpenses, error: fetchError } = await supabase
      .from("fixed_expenses")
      .select("id")
      .eq("budget_id", budgetId);

    if (fetchError) throw fetchError;

    // 2) Construire un ensemble des IDs existants en base
    const existingIds = new Set((existingExpenses || []).map((e) => e.id));

    // 3) Construire un ensemble des IDs présents localement (filtrer les id falsy)
    const localIds = new Set(expenses.map((e) => e.id).filter(Boolean));

    // 4) Déterminer quels IDs sont en base mais plus dans le state local => à supprimer
    const idsToDelete = [...existingIds].filter((id) => !localIds.has(id));

    // 5) Supprimer uniquement ces dépenses en trop
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("fixed_expenses")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) throw deleteError;
    }

    // 6) Upsert (insertion ou mise à jour) pour les dépenses locales
    if (expenses.length > 0) {
      const expensesToUpsert = expenses.map((expense) => ({
        id: expense.id || uuid(),  // Génère un uuid() si l'ID est vide
        budget_id: budgetId,
        user_id: userId,
        name: expense.name,
        amount: expense.amount,
        is_paid: expense.isPaid || false,
      }));

      const { error: upsertError } = await supabase
        .from("fixed_expenses")
        .upsert(expensesToUpsert, { onConflict: "id" });

      if (upsertError) throw upsertError;
    }

    return true;
  } catch (error) {
    handleServiceError(error, "Erreur lors de la sauvegarde des dépenses fixes");
    return false;
  }
}

/**
 * Ajouter des dépenses fixes par défaut (optionnel)
 */
export async function addDefaultFixedExpenses(budgetId: string, userId: string): Promise<void> {
  try {
    // Exemple de deux dépenses par défaut
    const { error } = await supabase
      .from("fixed_expenses")
      .insert([
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
      ]);

    if (error) throw error;
  } catch (error) {
    handleServiceError(error, "Erreur lors de l'ajout des dépenses fixes par défaut");
  }
}
