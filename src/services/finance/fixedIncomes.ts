import { supabase } from "@/integrations/supabase/client";
import { v4 as uuid } from "uuid";
import { FixedIncome } from "@/types/finance";
import { handleServiceError } from "./api";

/**
 * Récupérer les revenus fixes pour un budget donné
 */
export async function getFixedIncomes(budgetId: string): Promise<FixedIncome[]> {
  try {
    const { data, error } = await supabase
      .from("fixed_incomes")
      .select("*")
      .eq("budget_id", budgetId);

    if (error) throw error;
    if (!data) return [];

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      isReceived: item.is_received || false,
    }));
  } catch (error) {
    handleServiceError(error, "Erreur lors de la récupération des revenus fixes");
    return [];
  }
}

/**
 * Sauvegarder les revenus fixes (avec suppression sélective et upsert)
 */
export const saveFixedIncomes = async (
  budgetId: string,
  userId: string,
  incomes: FixedIncome[]
): Promise<boolean> => {
  try {
    // 1) Récupérer les revenus existants pour ce budget
    const { data: existingIncomes, error: fetchError } = await supabase
      .from("fixed_incomes")
      .select("id")
      .eq("budget_id", budgetId);

    if (fetchError) throw fetchError;

    // 2) Construire un ensemble des IDs existants en base
    const existingIds = new Set((existingIncomes || []).map((i) => i.id));

    // 3) Construire un ensemble des IDs présents localement (en filtrant les valeurs falsy)
    const localIds = new Set(incomes.map((i) => i.id).filter(Boolean));

    // 4) Déterminer quels IDs sont en base mais plus dans le state local => à supprimer
    const idsToDelete = [...existingIds].filter((id) => !localIds.has(id));

    // 5) Supprimer uniquement ces revenus
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("fixed_incomes")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) throw deleteError;
    }

    // 6) Upsert pour les revenus existants ou nouveaux
    if (incomes.length > 0) {
      const incomesToUpsert = incomes.map((income) => ({
        id: income.id || uuid(), // Générer un uuid() uniquement si l'ID n'existe pas déjà
        budget_id: budgetId,
        user_id: userId,
        name: income.name,
        amount: income.amount,
        is_received: income.isReceived || false,
      }));

      const { error: upsertError } = await supabase
        .from("fixed_incomes")
        .upsert(incomesToUpsert, { onConflict: "id" });

      if (upsertError) throw upsertError;
    }

    return true;
  } catch (error) {
    handleServiceError(error, "Erreur lors de la sauvegarde des revenus fixes");
    return false;
  }
};

/**
 * Ajouter des revenus fixes par défaut lors de l'initialisation (optionnel)
 */
export async function addDefaultFixedIncome(budgetId: string, userId: string): Promise<void> {
  try {
    const defaultIncome: FixedIncome = {
      id: uuid(),
      name: "Salaire",
      amount: 1000,
      isReceived: false,
    };

    const { error } = await supabase
      .from("fixed_incomes")
      .insert({
        id: defaultIncome.id,
        budget_id: budgetId,
        user_id: userId,
        name: defaultIncome.name,
        amount: defaultIncome.amount,
        is_received: defaultIncome.isReceived,
      });

    if (error) throw error;
  } catch (error) {
    handleServiceError(error, "Erreur lors de l'ajout du revenu fixe par défaut");
  }
}
