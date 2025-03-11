
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { FinanceState } from "@/types/finance";

// Helper function to get the current user's session
export const getCurrentUserSession = async () => {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user) {
    throw new Error("Aucun utilisateur connecté");
  }
  return session.session.user;
};

// Helper function to show error toasts
export const handleServiceError = (error: any, message: string) => {
  console.error(`${message}:`, error);
  toast({
    title: "Erreur",
    description: `${message}: ${error.message || "Erreur inconnue"}`,
    variant: "destructive"
  });
};

// Load user accounts with fallback
export const loadUserAccounts = async (userId: string): Promise<string[]> => {
  try {
    // Try to get accounts from RPC function
    const { data, error } = await supabase.rpc('get_user_accounts', {
      user_id_param: userId
    });
    
    if (error) throw error;
    return (data || []).map((account: any) => account.name);
  } catch (accountsError) {
    console.warn("Fallback to default accounts:", accountsError);
    
    // Try to get from profiles if RPC fails
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('accounts')
        .eq('id', userId)
        .maybeSingle();
      
      return profileData?.accounts || ['Courant', 'Espèces', 'Carte bancaire'];
    } catch (e) {
      return ['Courant', 'Espèces', 'Carte bancaire'];
    }
  }
};

// Load user categories with fallback
export const loadUserCategories = async (userId: string): Promise<string[]> => {
  try {
    // Try to get categories from RPC function
    const { data, error } = await supabase.rpc('get_user_categories', {
      user_id_param: userId
    });
    
    if (error) throw error;
    return (data || []).map((category: any) => category.name);
  } catch (categoriesError) {
    console.warn("Fallback to default categories:", categoriesError);
    
    // Try to get from profiles if RPC fails
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('categories')
        .eq('id', userId)
        .maybeSingle();
      
      return profileData?.categories || [
        'Alimentation', 'Transport', 'Loisirs', 'Santé', 
        'Logement', 'Habillement', 'Autres'
      ];
    } catch (e) {
      return [
        'Alimentation', 'Transport', 'Loisirs', 'Santé', 
        'Logement', 'Habillement', 'Autres'
      ];
    }
  }
};

// Save user accounts
export const saveUserAccounts = async (userId: string, accounts: string[]): Promise<void> => {
  try {
    await supabase.rpc('save_user_accounts', {
      user_id_param: userId,
      account_names: accounts
    });
  } catch (err) {
    console.error("Could not save accounts with RPC, using profiles table:", err);
    
    // Alternative approach if RPC doesn't exist or fails
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileData) {
        await supabase
          .from('profiles')
          .update({
            accounts: accounts
          })
          .eq('id', userId);
      }
    } catch (profileErr) {
      console.error("Error updating profiles:", profileErr);
      throw profileErr;
    }
  }
};

// Save user categories
export const saveUserCategories = async (userId: string, categories: string[]): Promise<void> => {
  try {
    await supabase.rpc('save_user_categories', {
      user_id_param: userId,
      category_names: categories
    });
  } catch (err) {
    console.error("Could not save categories with RPC, using profiles table:", err);
    
    // Alternative approach if RPC doesn't exist or fails
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileData) {
        await supabase
          .from('profiles')
          .update({
            categories: categories
          })
          .eq('id', userId);
      }
    } catch (profileErr) {
      console.error("Error updating profiles:", profileErr);
      throw profileErr;
    }
  }
};
