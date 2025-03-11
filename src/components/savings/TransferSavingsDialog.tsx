
import { useState } from "react";
import { MonthlyBudget, SavingsAccount } from "@/types/finance";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { moveSavingsToAccount } from "@/services/savings";
import { toast } from "@/components/ui/use-toast";
import { formatEuro } from "@/lib/utils";
import { ArrowRight, AlertTriangle } from "lucide-react";

interface TransferSavingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: MonthlyBudget;
  account: SavingsAccount;
  onTransferSuccess: () => void;
}

const TransferSavingsDialog = ({ 
  open, 
  onOpenChange, 
  budget,
  account,
  onTransferSuccess
}: TransferSavingsDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // On vérifie si le dépôt va dépasser le plafond
  const willExceedLimit = 
    account.maxDepositLimit !== null && 
    budget.monthlySavings > 0 && 
    account.currentBalance + budget.monthlySavings > account.maxDepositLimit;

  const handleTransfer = async () => {
    // Vérifier encore une fois que l'épargne n'a pas déjà été transférée
    if (budget.isSavingsTransferred) {
      toast({
        title: "Erreur",
        description: "L'épargne de ce mois a déjà été transférée",
        variant: "destructive"
      });
      onOpenChange(false);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const budgetKey = `${budget.month}-${budget.year}`;
      const success = await moveSavingsToAccount(
        budgetKey,
        account.id,
        budget.monthlySavings,
        account.maxDepositLimit
      );
      
      if (success) {
        onTransferSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Erreur lors du transfert:", error);
      toast({
        title: "Erreur",
        description: "Impossible de transférer l'épargne",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtenir le nom du mois en français
  const getMonthName = (month: number) => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return monthNames[month];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transférer l'épargne sur un compte</DialogTitle>
          <DialogDescription>
            Vous allez transférer l'épargne du mois de {getMonthName(budget.month)} {budget.year} vers {account.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center justify-between mb-6 px-4 py-3 bg-gray-50 rounded-md">
            <div>
              <div className="text-sm text-gray-500">Épargne du mois</div>
              <div className="text-xl font-bold">{formatEuro(budget.monthlySavings)}</div>
            </div>
            <ArrowRight className="h-6 w-6 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">{account.name}</div>
              <div className="text-xl font-bold">{formatEuro(account.currentBalance)}</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium">Après le transfert</div>
              <div className="mt-1 text-lg">{formatEuro(account.currentBalance + budget.monthlySavings)}</div>
            </div>
            
            {willExceedLimit && (
              <div className="flex items-start gap-2 p-3 border border-yellow-300 bg-yellow-50 rounded-md">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">Attention au plafond</div>
                  <div className="text-sm text-yellow-700">
                    Ce transfert dépassera le plafond de dépôt pour ce compte ({formatEuro(account.maxDepositLimit!)}).
                  </div>
                </div>
              </div>
            )}
            
            {budget.isSavingsTransferred && (
              <div className="flex items-start gap-2 p-3 border border-red-300 bg-red-50 rounded-md">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">Épargne déjà transférée</div>
                  <div className="text-sm text-red-700">
                    L'épargne de ce mois a déjà été transférée et ne peut pas être transférée à nouveau.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleTransfer}
            disabled={isSubmitting || budget.isSavingsTransferred}
          >
            {isSubmitting ? "Transfert en cours..." : "Confirmer le transfert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferSavingsDialog;
