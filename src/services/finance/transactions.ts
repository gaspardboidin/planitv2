
import { supabase } from "@/integrations/supabase/client";
import { handleServiceError } from "./api";
import { Transaction } from "@/types/finance";
import { v4 as uuidv4 } from 'uuid';

// Get transactions for a budget
export const getTransactions = async (budgetId: string) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('budget_id', budgetId);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    handleServiceError(error, "Erreur lors de la récupération des transactions");
    return [];
  }
};

// Save transactions for a budget (updates existing, adds new, removes deleted)
export const saveTransactions = async (
  budgetId: string, 
  userId: string, 
  transactions: Transaction[], 
  existingTransactionIds: string[] = []
) => {
  try {
    const currentTransactionIds = transactions.map(t => t.id);
    
    // Delete transactions that no longer exist
    const transactionsToDelete = existingTransactionIds.filter(id => !currentTransactionIds.includes(id));
    if (transactionsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .in('id', transactionsToDelete);
        
      if (deleteError) throw deleteError;
    }
    
    // Process each transaction (update or insert)
    for (const transaction of transactions) {
      // Ensure the transaction ID is a valid UUID for the database
      let dbId = transaction.id;
      // Check if the ID is not a valid UUID and create one if needed
      if (!dbId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        dbId = uuidv4();
      }
      
      // Convert date to ISO string safely - maintaining the original time
      let dateValue;
      if (transaction.date instanceof Date && !isNaN(transaction.date.getTime())) {
        dateValue = transaction.date.toISOString();
      } else if (typeof transaction.date === 'string') {
        // Handle string dates
        dateValue = new Date(transaction.date).toISOString();
      } else if (typeof transaction.date === 'object' && transaction.date !== null) {
        // Try a more general approach for objects
        try {
          // Check if date has a custom structure
          const dateObj = transaction.date as any;
          if (dateObj.value && typeof dateObj.value === 'object' && 'iso' in dateObj.value) {
            dateValue = dateObj.value.iso;
          } else {
            // Fall back to string conversion
            dateValue = new Date(String(transaction.date)).toISOString();
          }
        } catch (e) {
          // Use current date and time if parsing fails
          dateValue = new Date().toISOString();
          console.warn("Failed to parse transaction date, using current time:", e);
        }
      } else {
        dateValue = new Date().toISOString();
      }
        
      // Prepare transaction data object with only the fields that exist in the database
      const transactionData = {
        description: transaction.description,
        amount: transaction.amount,
        date: dateValue,
        category: transaction.category,
        account: transaction.account,
        type: transaction.type
      };
      
      if (existingTransactionIds.includes(transaction.id)) {
        // Update existing transaction
        const { error: updateError } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transaction.id);
          
        if (updateError) throw updateError;
      } else {
        // Insert new transaction with a valid UUID
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({
            id: dbId,
            budget_id: budgetId,
            ...transactionData
          });
          
        if (insertError) throw insertError;
      }
    }
    
    return true;
  } catch (error) {
    handleServiceError(error, "Erreur lors de la sauvegarde des transactions");
    return false;
  }
};

// Get existing transaction IDs for a budget
export const getExistingTransactionIds = async (budgetId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('budget_id', budgetId);
      
    if (error) throw error;
    return (data || []).map(t => t.id);
  } catch (error) {
    handleServiceError(error, "Erreur lors de la récupération des IDs de transactions");
    return [];
  }
};
