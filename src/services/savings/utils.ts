
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Noms des mois en français
export const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

// Fonction utilitaire pour gérer les erreurs API
export const handleApiError = (error: any, message: string): void => {
  console.error(`${message}:`, error);
  toast({
    title: "Erreur",
    description: message,
    variant: "destructive"
  });
};

// Fonction utilitaire pour mettre à jour le solde d'un compte
export const updateAccountBalance = async (accountId: string, balanceChange: number): Promise<boolean> => {
  try {
    await supabase.rpc('increment', { 
      x: balanceChange,
      row_id: accountId,
      column_name: 'current_balance',
      table_name: 'savings_accounts'
    });
    return true;
  } catch (error) {
    handleApiError(error, "Erreur lors de la mise à jour du solde du compte");
    return false;
  }
};
