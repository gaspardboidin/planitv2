
import { supabase } from "@/integrations/supabase/client";
import { SavingsTransaction } from "@/types/finance";
import { handleApiError, updateAccountBalance } from "./utils";

// Récupérer les transactions d'un compte d'épargne
export const fetchSavingsTransactions = async (accountId: string): Promise<SavingsTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('savings_transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('transaction_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(transaction => ({
      id: transaction.id,
      accountId: transaction.account_id,
      amount: transaction.amount,
      description: transaction.description,
      transactionDate: new Date(transaction.transaction_date),
      transactionType: transaction.transaction_type as 'deposit' | 'withdrawal' | 'interest'
    }));
  } catch (error) {
    handleApiError(error, "Erreur lors de la récupération des transactions");
    return [];
  }
};

// Ajouter une transaction à un compte d'épargne
export const addSavingsTransaction = async (
  transaction: Omit<SavingsTransaction, 'id'>, 
  maxDepositLimit: number | null
): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error("Aucun utilisateur connecté");
    }

    // Vérifier les limites de dépôt si c'est un dépôt
    if (transaction.transactionType === 'deposit' && maxDepositLimit !== null) {
      // Récupérer le solde actuel
      const { data: accountData } = await supabase
        .from('savings_accounts')
        .select('current_balance')
        .eq('id', transaction.accountId)
        .single();
      
      // Calculer le total des dépôts pour ce compte
      const { data: depositsData } = await supabase
        .from('savings_transactions')
        .select('amount')
        .eq('account_id', transaction.accountId)
        .eq('transaction_type', 'deposit');
      
      const totalDeposits = depositsData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      
      // Vérifier si le dépôt dépasse la limite
      if (totalDeposits + transaction.amount > maxDepositLimit) {
        handleApiError(
          new Error(`Dépôt maximum dépassé`), 
          `Ce dépôt dépasse la limite maximale de ce compte (${maxDepositLimit}€)`
        );
        return false;
      }
    }

    // Ajouter la transaction
    const { error: transactionError } = await supabase
      .from('savings_transactions')
      .insert({
        account_id: transaction.accountId,
        amount: transaction.amount,
        description: transaction.description,
        transaction_date: transaction.transactionDate.toISOString(),
        transaction_type: transaction.transactionType,
        user_id: session.session.user.id
      });

    if (transactionError) {
      throw transactionError;
    }

    // Mettre à jour le solde du compte
    const balanceChange = transaction.transactionType === 'withdrawal' 
      ? -transaction.amount 
      : transaction.amount;
    
    // Mettre à jour le solde via la fonction utilitaire
    await updateAccountBalance(transaction.accountId, balanceChange);

    return true;
  } catch (error) {
    handleApiError(error, "Erreur lors de l'ajout de la transaction");
    return false;
  }
};

// Supprimer une transaction
export const deleteSavingsTransaction = async (
  transaction: SavingsTransaction
): Promise<boolean> => {
  try {
    // Supprimer la transaction
    const { error: deleteError } = await supabase
      .from('savings_transactions')
      .delete()
      .eq('id', transaction.id);

    if (deleteError) {
      throw deleteError;
    }

    // Ajuster le solde du compte
    const balanceChange = transaction.transactionType === 'withdrawal' 
      ? transaction.amount 
      : -transaction.amount;
    
    // Mettre à jour le solde via la fonction utilitaire
    await updateAccountBalance(transaction.accountId, balanceChange);

    return true;
  } catch (error) {
    handleApiError(error, "Erreur lors de la suppression de la transaction");
    return false;
  }
};
