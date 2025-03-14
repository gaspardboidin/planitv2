import { supabase } from "@/integrations/supabase/client";
import { v4 as uuid } from "uuid";
import { FixedIncome } from "@/types/finance";
import { handleServiceError } from "./api";

/**
 * Récupérer les revenus fixes pour un budget donné.
 */
export const getFixedIncomes = async (budgetId: string): Promise<FixedIncome[]> => {
  try {
    const { data, error } = await supabase
      .from("fixed_incomes")
      .select("*")
      .eq("budget_id", budgetId);
      
    if (error) throw error;
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      isReceived: item.is_received || false,
    }));
  } catch (error) {
    handleServiceError(error, "Erreur lors de la récupération des revenus fixes");
    return [];
  }
};

/**
 * Sauvegarder les revenus fixes pour un budget donné.
 * On effectue un upsert des éléments locaux et on supprime ceux qui ne figurent plus.
 */
export const saveFixedIncomes = async (
  budgetId: string,
  userId: string,
  incomes: FixedIncome[]
): Promise<boolean> => {
  try {
    // 1) Récupérer les revenus existants en base pour ce budget et cet utilisateur.
    const { data: existingIncomes, error: fetchError } = await supabase
      .from("fixed_incomes")
      .select("id")
      .eq("budget_id", budgetId)
      .eq("user_id", userId);
      
    if (fetchError) throw fetchError;
    const existingIds = new Set((existingIncomes || []).map((i: any) => i.id));
    
    // 2) Préparer le upsert de tous les revenus locaux.
    const upsertData = incomes.map((income) => ({
      id: income.id || uuid(), // Générer un ID si nécessaire.
      budget_id: budgetId,
      user_id: userId,
      name: income.name,
      amount: income.amount,
      is_received: income.isReceived || false,
    }));
    
    if (upsertData.length > 0) {
      const { error: upsertError } = await supabase
        .from("fixed_incomes")
        .upsert(upsertData, { onConflict: "id" });
      if (upsertError) throw upsertError;
    }
    
    // 3) Supprimer les éléments en base qui ne figurent plus dans la liste locale.
    const localIds = new Set(upsertData.map((income) => income.id));
    const idsToDelete = [...existingIds].filter((id) => !localIds.has(id));
    
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("fixed_incomes")
        .delete()
        .in("id", idsToDelete);
      if (deleteError) throw deleteError;
    }
    
    return true;
  } catch (error) {
    handleServiceError(error, "Erreur lors de la sauvegarde des revenus fixes");
    return false;
  }
};

/**
 * Ajouter un revenu fixe par défaut lors de l'initialisation d'un utilisateur.
 */
export const addDefaultFixedIncome = async (budgetId: string, userId: string): Promise<boolean> => {
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
    return true;
  } catch (error) {
    handleServiceError(error, "Erreur lors de l'ajout du revenu fixe par défaut");
    return false;
  }
};
