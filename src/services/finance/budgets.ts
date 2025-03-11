
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserSession, handleServiceError } from "./api";
import { MonthlyBudget } from "@/types/finance";

// Get a specific budget by month and year
export const getBudget = async (userId: string, month: number, year: number) => {
  try {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleServiceError(error, "Erreur lors de la récupération du budget");
    return null;
  }
};

// Get all budgets for a user
export const getAllBudgets = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleServiceError(error, "Erreur lors de la récupération des budgets");
    return [];
  }
};

// Create or update a budget
export const saveBudget = async (budget: Partial<MonthlyBudget>, userId: string) => {
  try {
    const { month, year } = budget;
    
    // Check if budget exists
    const existingBudget = await getBudget(userId, month!, year!);
    
    if (existingBudget) {
      // Update existing budget
      const { error } = await supabase
        .from('monthly_budgets')
        .update({
          initial_balance: budget.initialBalance,
          remaining_balance: budget.remainingBalance,
          monthly_savings: budget.monthlySavings,
          is_savings_set_aside: budget.isSavingsSetAside,
          is_savings_transferred: budget.isSavingsTransferred
        })
        .eq('id', existingBudget.id);
        
      if (error) throw error;
      return existingBudget.id;
    } else {
      // Create new budget
      const { data, error } = await supabase
        .from('monthly_budgets')
        .insert({
          user_id: userId,
          month: month,
          year: year,
          initial_balance: budget.initialBalance || 0,
          remaining_balance: budget.remainingBalance || 0,
          monthly_savings: budget.monthlySavings || 0,
          is_savings_set_aside: budget.isSavingsSetAside || false,
          is_savings_transferred: budget.isSavingsTransferred || false
        })
        .select('id')
        .single();
        
      if (error) throw error;
      return data.id;
    }
  } catch (error) {
    handleServiceError(error, "Erreur lors de la sauvegarde du budget");
    return null;
  }
};

// Create a new budget with default values
export const createInitialBudget = async (userId: string, month: number, year: number) => {
  try {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .insert({
        user_id: userId,
        month: month,
        year: year,
        initial_balance: 0,
        remaining_balance: 0,
        monthly_savings: 0,
        is_savings_set_aside: false,
        is_savings_transferred: false
      })
      .select('id')
      .single();
      
    if (error) throw error;
    return data.id;
  } catch (error) {
    handleServiceError(error, "Erreur lors de la création du budget initial");
    return null;
  }
};
