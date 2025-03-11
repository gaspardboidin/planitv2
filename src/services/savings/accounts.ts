
import { supabase } from "@/integrations/supabase/client";
import { SavingsAccount } from "@/types/finance";
import { toast } from "@/hooks/use-toast";
import { handleApiError } from "./utils";

// Helper function to ensure interest frequency is valid
const validateInterestFrequency = (value: string): "monthly" | "annually" => {
  return value === "monthly" ? "monthly" : "annually";
};

// Helper function to ensure interest type is valid
const validateInterestType = (value: string): "fixed" | "variable" => {
  return value === "variable" ? "variable" : "fixed";
};

// Récupérer tous les comptes d'épargne d'un utilisateur
export async function fetchSavingsAccounts(userId: string): Promise<SavingsAccount[]> {
  try {
    if (!userId) {
      throw new Error("Aucun utilisateur connecté");
    }

    const { data, error } = await supabase
      .from("savings_accounts")
      .select("*")
      .eq("user_id", userId) // Important si ta policy RLS attend user_id = auth.uid()
      .order("name");

    if (error) {
      throw error;
    }
    if (!data) {
      return [];
    }

    return data.map(account => ({
      id: account.id,
      name: account.name,
      accountType: account.account_type,
      isLiquid: account.is_liquid,
      maxDepositLimit: account.max_deposit_limit,
      currentBalance: account.current_balance,
      interestRate: account.interest_rate,
      interestFrequency: validateInterestFrequency(account.interest_frequency),
      interestType: validateInterestType(account.interest_type),
      user_id: account.user_id,
      created_at: account.created_at,
      updated_at: account.updated_at,
    }));
  } catch (error) {
    handleApiError(error, "Erreur lors de la récupération des comptes d'épargne");
    return [];
  }
}
// Créer un nouveau compte d'épargne
export const createSavingsAccount = async (account: Omit<SavingsAccount, 'id'>): Promise<SavingsAccount | null> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error("Aucun utilisateur connecté");
    }

    const userId = session.session.user.id;
    console.log("ID utilisateur:", userId);
    console.log("Création d'un compte avec les données:", account);

    // Préparer les données avec le snake_case pour Supabase
    const accountData = {
      user_id: userId,
      name: account.name,
      account_type: account.accountType,
      is_liquid: account.isLiquid,
      max_deposit_limit: account.maxDepositLimit,
      current_balance: account.currentBalance,
      interest_rate: account.interestRate,
      interest_frequency: account.interestFrequency,
      interest_type: account.interestType
    };

    console.log("Données formatées pour Supabase:", accountData);

    const { data, error } = await supabase
      .from('savings_accounts')
      .insert(accountData)
      .select()
      .single();

    if (error) {
      console.error("Erreur Supabase:", error);
      throw error;
    }

    console.log("Compte créé avec succès:", data);

    return {
      id: data.id,
      name: data.name,
      accountType: data.account_type,
      isLiquid: data.is_liquid,
      maxDepositLimit: data.max_deposit_limit,
      currentBalance: data.current_balance,
      interestRate: data.interest_rate,
      interestFrequency: validateInterestFrequency(data.interest_frequency),
      interestType: validateInterestType(data.interest_type),
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error("Erreur détaillée:", error);
    handleApiError(error, "Erreur lors de la création du compte d'épargne");
    return null;
  }
};

// Mettre à jour un compte d'épargne
export const updateSavingsAccount = async (account: SavingsAccount): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('savings_accounts')
      .update({
        name: account.name,
        account_type: account.accountType,
        is_liquid: account.isLiquid,
        max_deposit_limit: account.maxDepositLimit,
        current_balance: account.currentBalance,
        interest_rate: account.interestRate,
        interest_frequency: account.interestFrequency,
        interest_type: account.interestType
      })
      .eq('id', account.id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    handleApiError(error, "Erreur lors de la mise à jour du compte d'épargne");
    return false;
  }
};

// Supprimer un compte d'épargne
export const deleteSavingsAccount = async (accountId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('savings_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    handleApiError(error, "Erreur lors de la suppression du compte d'épargne");
    return false;
  }
};
