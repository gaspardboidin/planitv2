
import { RefreshCw, Moon, Sun, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/settings";
import { useFinance } from "@/contexts/finance";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { deleteAllSavingsDistributionPlans } from "@/services/savings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const { settings, toggleTheme } = useSettings();
  const { resetAllData } = useFinance();
  const navigate = useNavigate();

  const handleResetData = async () => {
    // Réinitialiser les données de finances dans le state local
    resetAllData();
    
    // Supprimer tous les plans de répartition d'épargne
    await deleteAllSavingsDistributionPlans();
    
    // Réinitialiser également les comptes d'épargne dans Supabase si l'utilisateur est connecté
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.user) {
        const userId = session.session.user.id;
        
        // Supprimer les transactions d'épargne
        await supabase
          .from('savings_transactions')
          .delete()
          .eq('user_id', userId);
          
        // Supprimer les comptes d'épargne
        await supabase
          .from('savings_accounts')
          .delete()
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des comptes d'épargne:", error);
    }
    
    toast({
      title: "Données réinitialisées",
      description: "Toutes les données ont été réinitialisées avec succès.",
      variant: "destructive",
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold dark:text-gray-200">Paramètres</h1>
      </div>

      <Card className="mb-6 glass-card animate-slide-in">
        <CardHeader>
          <CardTitle className="dark:text-gray-200">Apparence</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Personnalisez l'apparence de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.theme === 'light' ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-400" />
              )}
              <span className="dark:text-white">Mode {settings.theme === 'light' ? 'jour' : 'nuit'}</span>
            </div>
            <Switch 
              checked={settings.theme === 'dark'}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-gray-600"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 glass-card animate-slide-in">
        <CardHeader>
          <CardTitle className="text-destructive dark:text-red-400">Données</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Options de réinitialisation et gestion des données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Réinitialiser les données
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="dark:bg-[#222228] dark:border-gray-800/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="dark:text-white">Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription className="dark:text-gray-400">
                  Cette action va supprimer définitivement toutes vos données financières, 
                  y compris les comptes d'épargne. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="dark:bg-[#2a2a30] dark:text-white dark:hover:bg-[#333338]">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleResetData}
                  className="dark:bg-red-500 dark:text-white dark:hover:bg-red-600"
                >
                  Réinitialiser
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
