
import { supabase } from "@/integrations/supabase/client";
import { handleApiError, monthNames, updateAccountBalance } from "./utils";
import { getSavingsDistributionPlan } from "./distribution";

// Déplacer l'épargne d'un mois vers un compte d'épargne
export const moveSavingsToAccount = async (
  budgetKey: string,
  accountId: string,
  amount: number,
  maxDepositLimit: number | null
): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error("Aucun utilisateur connecté");
    }

    const [month, year] = budgetKey.split('-').map(Number);
    
    // Vérifier d'abord si l'épargne a déjà été transférée pour ce mois
    const { data: budgetData, error: budgetCheckError } = await supabase
      .from('monthly_budgets')
      .select('is_savings_transferred')
      .eq('user_id', session.session.user.id)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    
    if (budgetCheckError) {
      throw budgetCheckError;
    }
    
    if (budgetData && budgetData.is_savings_transferred) {
      handleApiError(
        new Error("Épargne déjà transférée"),
        "L'épargne de ce mois a déjà été transférée"
      );
      return false;
    }

    // Vérifier les limites de dépôt
    if (maxDepositLimit !== null) {
      // Calculer le total des dépôts pour ce compte
      const { data: depositsData } = await supabase
        .from('savings_transactions')
        .select('amount')
        .eq('account_id', accountId)
        .eq('transaction_type', 'deposit');
      
      const totalDeposits = depositsData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      
      // Vérifier si le dépôt dépasse la limite
      if (totalDeposits + amount > maxDepositLimit) {
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
        account_id: accountId,
        amount: amount,
        description: `Épargne du mois de ${monthNames[month]} ${year}`,
        transaction_date: new Date().toISOString(),
        transaction_type: 'deposit',
        user_id: session.session.user.id
      });

    if (transactionError) {
      throw transactionError;
    }

    // Mettre à jour le solde du compte
    await updateAccountBalance(accountId, amount);

    // Marquer l'épargne comme transférée dans le budget
    // Récupérer d'abord l'ID du budget mensuel
    const { data: budgetIdData, error: budgetQueryError } = await supabase
      .from('monthly_budgets')
      .select('id')
      .eq('user_id', session.session.user.id)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    
    if (budgetQueryError) {
      throw budgetQueryError;
    }
    
    if (!budgetIdData) {
      throw new Error("Budget not found");
    }
    
    // Ensuite mettre à jour le budget
    const { error: budgetError } = await supabase
      .from('monthly_budgets')
      .update({ 
        is_savings_transferred: true 
      })
      .eq('id', budgetIdData.id);

    if (budgetError) {
      throw budgetError;
    }

    return true;
  } catch (error) {
    handleApiError(error, "Erreur lors du transfert de l'épargne vers le compte");
    return false;
  }
};

// Fonction pour transférer l'épargne selon le plan de répartition
export const distributeAndTransferSavings = async (
  budgetKey: string,
  totalAmount: number
): Promise<boolean> => {
  try {
    const [month, year] = budgetKey.split('-').map(Number);
    
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error("Aucun utilisateur connecté");
    }
    
    // Vérifier d'abord si l'épargne a déjà été transférée pour ce mois
    const { data: budgetData, error: budgetCheckError } = await supabase
      .from('monthly_budgets')
      .select('is_savings_transferred')
      .eq('user_id', session.session.user.id)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    
    if (budgetCheckError) {
      throw budgetCheckError;
    }
    
    if (budgetData && budgetData.is_savings_transferred) {
      handleApiError(
        new Error("Épargne déjà transférée"),
        "L'épargne de ce mois a déjà été transférée"
      );
      return false;
    }
    
    // Récupérer le plan de répartition
    const plan = await getSavingsDistributionPlan(month, year);
    
    if (!plan || !plan.distribution || plan.distribution.length === 0) {
      throw new Error("Aucun plan de répartition défini pour ce mois");
    }
    
    // Obtenir tous les comptes pour vérifier leurs limites
    const { data: accounts, error: accountsError } = await supabase
      .from('savings_accounts')
      .select('id, max_deposit_limit, current_balance')
      .eq('user_id', session.session.user.id);
      
    if (accountsError) {
      throw accountsError;
    }
    
    // Pour chaque compte dans le plan, calculer et transférer le montant
    let allTransfersSuccessful = true;
    let totalTransferred = 0;
    
    // Vérifier d'abord si les limites de dépôt seront respectées
    for (const item of plan.distribution) {
      const account = accounts.find(a => a.id === item.accountId);
      if (!account) continue;
      
      const amountToTransfer = (totalAmount * item.percentage) / 100;
      
      if (account.max_deposit_limit !== null) {
        // Calculer le total des dépôts pour ce compte
        const { data: depositsData } = await supabase
          .from('savings_transactions')
          .select('amount')
          .eq('account_id', account.id)
          .eq('transaction_type', 'deposit');
        
        const totalDeposits = depositsData?.reduce((sum, t) => sum + t.amount, 0) || 0;
        
        // Vérifier si le dépôt dépasse la limite
        if (totalDeposits + amountToTransfer > account.max_deposit_limit) {
          handleApiError(
            new Error(`Dépôt maximum dépassé`), 
            `Le dépôt sur le compte ${account.id} dépasse sa limite maximale selon le plan de répartition`
          );
          return false;
        }
      }
    }
    
    // Procéder aux transferts
    for (const item of plan.distribution) {
      if (item.percentage <= 0) continue;
      
      const amountToTransfer = Math.min(
        (totalAmount * item.percentage) / 100,
        totalAmount - totalTransferred // Ensure we don't transfer more than available
      );
      
      if (amountToTransfer <= 0) continue;
      
      const success = await moveSavingsToAccount(
        budgetKey,
        item.accountId,
        amountToTransfer,
        null // We already checked limits
      );
      
      if (success) {
        totalTransferred += amountToTransfer;
      } else {
        allTransfersSuccessful = false;
        break;
      }
    }
    
    // Si tous les transferts ont réussi, marquer le budget comme transféré
    if (allTransfersSuccessful && totalTransferred > 0) {
      // Vérifier s'il reste un reliquat non transféré (si le total des pourcentages < 100%)
      if (totalTransferred < totalAmount) {
        console.log(`Reliquat non transféré: ${totalAmount - totalTransferred}€`);
        // On pourrait gérer ce cas dans le futur
      }
      
      // Le budget est déjà marqué comme transféré dans moveSavingsToAccount
      return true;
    }
    
    return false;
  } catch (error) {
    handleApiError(error, "Erreur lors de la répartition de l'épargne");
    return false;
  }
};
