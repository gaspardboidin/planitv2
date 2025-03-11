
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFinance } from "@/contexts/finance";
import { SavingsAccount } from "@/types/finance";
import { 
  AccountList, 
  AccountDetailsDialog
} from "@/components/savings";
import AvailableSavingsCard from "@/components/savings/AvailableSavingsCard";
import SavingsDistributionPlan from "@/components/savings/SavingsDistributionPlan";
import TransferSavingsDialog from "@/components/savings/TransferSavingsDialog";
import { 
  fetchSavingsAccounts, 
  createSavingsAccount, 
  updateSavingsAccount, 
  deleteSavingsAccount,
  moveSavingsToAccount,
  distributeAndTransferSavings
} from "@/services/savings";
import { toast } from "@/components/ui/use-toast";

const Savings = () => {
  const { getCurrentBudget, markSavingsAsTransferred } = useFinance();
  const { user } = useAuth(); // Récupère l'utilisateur
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDetailAccount, setSelectedDetailAccount] = useState<SavingsAccount | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get budget directly without month navigation
  const budget = getCurrentBudget();
  
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    loadAccounts(user.id);
  }, [user]);

  useEffect(() => {
    function onFocus() {
      if (user) {
        console.log("Window focus detected – reloading savings accounts");
        loadAccounts(user.id);
      }
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user]);

  const loadAccounts = async (userId: string) => {
    try {
      setIsLoading(true);
      console.log("Chargement des comptes d'épargne...");
      const data = await fetchSavingsAccounts(userId);
      console.log("Comptes récupérés:", data);
      
      // Ensure all accounts have the new properties
      const updatedAccounts = data.map(account => ({
        ...account,
        interestFrequency: account.interestFrequency || "annually",
        interestType: account.interestType || "fixed"
      }));
      
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error("Erreur lors du chargement des comptes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les comptes d'épargne",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async (account: Omit<SavingsAccount, 'id'>) => {
    try {
      console.log("Tentative d'ajout d'un compte:", account);
      const newAccount = await createSavingsAccount(account);
      
      if (newAccount) {
        console.log("Compte créé avec succès:", newAccount);
        setAccounts(prev => [...prev, newAccount]);
        toast({
          title: "Compte créé",
          description: "Le compte d'épargne a été créé avec succès"
        });
      } else {
        console.error("Erreur: compte retourné null");
        toast({
          title: "Erreur",
          description: "Impossible de créer le compte d'épargne",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur détaillée lors de la création du compte:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du compte",
        variant: "destructive"
      });
    }
  };

  const handleEditAccount = async (account: SavingsAccount) => {
    try {
      console.log("Tentative de mise à jour d'un compte:", account);
      const success = await updateSavingsAccount(account);
      
      if (success) {
        console.log("Compte mis à jour avec succès");
        setAccounts(prev => prev.map(acc => 
          acc.id === account.id ? account : acc
        ));
        toast({
          title: "Compte mis à jour",
          description: "Le compte d'épargne a été mis à jour avec succès"
        });
      } else {
        console.error("Erreur: mise à jour a échoué");
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le compte d'épargne",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur détaillée lors de la mise à jour du compte:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du compte",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      console.log("Tentative de suppression du compte:", accountId);
      const success = await deleteSavingsAccount(accountId);
      
      if (success) {
        console.log("Compte supprimé avec succès");
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        toast({
          title: "Compte supprimé",
          description: "Le compte d'épargne a été supprimé avec succès"
        });
      } else {
        console.error("Erreur: suppression a échoué");
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le compte d'épargne",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur détaillée lors de la suppression du compte:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du compte",
        variant: "destructive"
      });
    }
  };

  const handleSelectAccount = (account: SavingsAccount) => {
    // Vérifier si l'épargne a déjà été transférée pour ce mois
    if (budget.isSavingsTransferred) {
      toast({
        title: "Opération non autorisée",
        description: "L'épargne de ce mois a déjà été transférée",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Compte sélectionné pour transfert:", account);
    setSelectedAccount(account);
    setIsTransferOpen(true);
  };

  const handleSelectAccountDetails = (account: SavingsAccount) => {
    console.log("Compte sélectionné pour détails:", account);
    setSelectedDetailAccount(account);
    setIsDetailsOpen(true);
  };

  const handleTransferSuccess = () => {
    console.log("Transfert réussi, rechargement des comptes");
    loadAccounts(user.id);
    markSavingsAsTransferred();
    toast({
      title: "Épargne transférée",
      description: "Votre épargne a été transférée avec succès"
    });
  };

  const handleDistributedTransfer = async () => {
    // Vérifier si l'épargne a déjà été transférée pour ce mois
    if (budget.isSavingsTransferred) {
      toast({
        title: "Opération non autorisée",
        description: "L'épargne de ce mois a déjà été transférée",
        variant: "destructive"
      });
      return;
    }
    
    if (isTransferring) return;
    
    try {
      console.log("Tentative de distribution d'épargne");
      setIsTransferring(true);
      
      const budgetKey = `${budget.month}-${budget.year}`;
      const success = await distributeAndTransferSavings(budgetKey, budget.monthlySavings);
      
      if (success) {
        console.log("Distribution réussie");
        handleTransferSuccess();
      } else {
        console.error("Erreur: distribution a échoué");
        toast({
          title: "Erreur",
          description: "Impossible de répartir l'épargne selon le plan",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur détaillée lors de la répartition de l'épargne:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la répartition de l'épargne",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="my-6">
        <h1 className="text-2xl font-bold">Épargne</h1>
        <p className="text-muted-foreground">Gérez vos comptes et votre épargne mensuelle</p>
      </div>
      
      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <AvailableSavingsCard 
            budget={budget}
            onTransfer={handleSelectAccount}
            onDistributedTransfer={handleDistributedTransfer}
            accounts={accounts}
          />
        </div>

        <AccountList 
          accounts={accounts}
          onAdd={handleAddAccount}
          onEdit={handleEditAccount}
          onDelete={handleDeleteAccount}
          onSelect={handleSelectAccount}
          onViewDetails={handleSelectAccountDetails}
          isLoading={isLoading}
        />
        
        <SavingsDistributionPlan 
          accounts={accounts}
          budget={budget}
        />
      </div>
      
      {selectedAccount && (
        <TransferSavingsDialog
          open={isTransferOpen}
          onOpenChange={setIsTransferOpen}
          budget={budget}
          account={selectedAccount}
          onTransferSuccess={handleTransferSuccess}
        />
      )}
      
      {selectedDetailAccount && (
        <AccountDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          account={selectedDetailAccount}
        />
      )}
    </div>
  );
};

export default Savings;
