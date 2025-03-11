
import { v4 as uuid } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { handleServiceError } from "./api";
import { FixedExpense } from "@/types/finance";

// Get fixed expenses for a budget
export const getFixedExpenses = async (budgetId: string) => {
  try {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('budget_id', budgetId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleServiceError(error, "Erreur lors de la récupération des dépenses fixes");
    return [];
  }
};

// Save fixed expenses for a budget (clears existing ones first)
export const saveFixedExpenses = async (budgetId: string, userId: string, expenses: FixedExpense[]) => {
  try {
    // Get existing expenses to avoid duplicate IDs
    const { data: existingExpenses, error: fetchError } = await supabase
      .from('fixed_expenses')
      .select('id')
      .eq('budget_id', budgetId);
    
    if (fetchError) throw fetchError;
    
    // Create a set of existing IDs
    const existingIds = new Set((existingExpenses || []).map(e => e.id));
    
    // Delete existing expenses for this budget only
    const { error: deleteError } = await supabase
      .from('fixed_expenses')
      .delete()
      .eq('budget_id', budgetId);
      
    if (deleteError) throw deleteError;
    
    // Skip if no expenses to add
    if (expenses.length === 0) return true;
    
    // Add new expenses with completely new IDs to avoid conflicts
    const expensesToInsert = expenses.map(expense => {
      // Always generate a new UUID for insertion to prevent conflicts
      const newId = uuid();
      
      return {
        id: newId,
        budget_id: budgetId,
        user_id: userId,
        name: expense.name,
        amount: expense.amount,
        is_paid: expense.isPaid || false
      };
    });
    
    const { error: insertError } = await supabase
      .from('fixed_expenses')
      .insert(expensesToInsert);
      
    if (insertError) throw insertError;
    
    return true;
  } catch (error) {
    handleServiceError(error, "Erreur lors de la sauvegarde des dépenses fixes");
    return false;
  }
};

// Add default fixed expenses
export const addDefaultFixedExpenses = async (budgetId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('fixed_expenses')
      .insert([
        {
          id: uuid(),
          budget_id: budgetId,
          user_id: userId,
          name: 'Loyer',
          amount: 0,
          is_paid: false
        },
        {
          id: uuid(),
          budget_id: budgetId,
          user_id: userId,
          name: 'Internet',
          amount: 0,
          is_paid: false
        }
      ]);
      
    if (error) throw error;
    return true;
  } catch (error) {
    handleServiceError(error, "Erreur lors de la création des dépenses fixes par défaut");
    return false;
  }
};
