
import { useState, useEffect } from "react";
import { useFinance } from "@/contexts/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SavingsAccount } from "@/types/finance";
import { fetchSavingsAccounts } from "@/services/savings";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth"; // si ce n'est pas déjà importé
import { userInfo } from "os";

interface FormData {
  label: string;
  amount: string;
  account: string;
  type: "income" | "expense";
  isYearlyRecurring: boolean;
  fromSavingsAccount: boolean;
  savingsAccountId: string;
}

const AddTransactionForm = () => {
  const { user } = useAuth();
  const { state, addTransaction } = useFinance();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    label: "",
    amount: "",
    account: "Compte chèques",
    type: "expense",
    isYearlyRecurring: false,
    fromSavingsAccount: false,
    savingsAccountId: "",
  });
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  
  // Load savings accounts when the dialog opens
  useEffect(() => {
    if (open) {
      loadSavingsAccounts();
    }
  }, [open]);
  
  // Réinitialiser les options relatives à l'épargne quand on change de type de transaction
  useEffect(() => {
    if (formData.type === "income") {
      setFormData(prev => ({
        ...prev,
        fromSavingsAccount: false,
        savingsAccountId: ""
      }));
    }
  }, [formData.type]);
  
  const loadSavingsAccounts = async () => {
    try {
      if (!user) {
        console.log("User est null, on ne fetch pas les comptes d'epargne");
        return;
      }
      const accounts = await fetchSavingsAccounts(user.id);
      setSavingsAccounts(accounts);
    } catch (error) {
      console.error("Erreur lors du chargement des comptes d'épargne:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBooleanChange = (name: string, value: boolean) => {
    // Si on désactive "depuis épargne", réinitialiser le compte d'épargne sélectionné
    if (name === "fromSavingsAccount" && !value) {
      setFormData((prev) => ({ 
        ...prev, 
        [name]: value,
        savingsAccountId: ""
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label || !formData.amount || !formData.account) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }
    
    // Si transaction depuis épargne mais aucun compte sélectionné
    if (formData.fromSavingsAccount && !formData.savingsAccountId) {
      toast({
        title: "Compte d'épargne manquant",
        description: "Veuillez sélectionner un compte d'épargne",
        variant: "destructive"
      });
      return;
    }
    
    // Création d'une date avec l'heure exacte pour résoudre le problème d'affichage du temps
    const now = new Date();
    
    // Construire une date avec le mois/année actuels et l'heure précise
    const transactionDate = new Date(
      state.currentYear,
      state.currentMonth,
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );
    
    // Ajouter les nouvelles propriétés à l'objet transaction
    addTransaction({
      description: formData.label,
      amount: parseFloat(formData.amount),
      date: transactionDate,
      category: "Autre", // Catégorie par défaut
      account: formData.account,
      type: formData.type,
      isYearlyRecurring: formData.isYearlyRecurring,
      fromSavingsAccount: formData.type === 'income' ? false : formData.fromSavingsAccount,
      savingsAccountId: formData.type === 'income' ? undefined : formData.savingsAccountId,
    });
    
    // Si c'est une transaction depuis l'épargne, mettre à jour le solde du compte d'épargne
    if (formData.type === 'expense' && formData.fromSavingsAccount && formData.savingsAccountId) {
      try {
        // Trouver le compte d'épargne
        const selectedAccount = savingsAccounts.find(acc => acc.id === formData.savingsAccountId);
        if (selectedAccount) {
          // Mise à jour automatique du solde du compte d'épargne sera gérée par les services
          toast({
            title: "Compte d'épargne débité",
            description: `${formData.amount}€ ont été débités de ${selectedAccount.name}`,
          });
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour du compte d'épargne:", error);
      }
    }
    
    setFormData({
      label: "",
      amount: "",
      account: "Compte chèques",
      type: "expense",
      isYearlyRecurring: false,
      fromSavingsAccount: false,
      savingsAccountId: "",
    });
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-transition">
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une transaction</DialogTitle>
          <DialogDescription>
            Saisissez les détails de votre transaction ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <div className="col-span-3 flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === "expense" ? "default" : "outline"}
                  onClick={() => handleSelectChange("type", "expense")}
                  className="flex-1"
                >
                  Dépense
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "income" ? "default" : "outline"}
                  onClick={() => handleSelectChange("type", "income")}
                  className="flex-1"
                >
                  Revenu
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Libellé
              </Label>
              <Input
                id="label"
                name="label"
                value={formData.label}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Montant (€)
              </Label>
              <Input
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                type="number"
                step="0.01"
                min="0"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account" className="text-right">
                Compte
              </Label>
              <Select 
                onValueChange={(value) => handleSelectChange("account", value)}
                value={formData.account}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Compte chèques">Compte chèques</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isYearlyRecurring" className="text-right">
                Récurrent annuel
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="isYearlyRecurring"
                  checked={formData.isYearlyRecurring}
                  onCheckedChange={(checked) => 
                    handleBooleanChange("isYearlyRecurring", checked)
                  }
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Se répète chaque année à la même période
                </span>
              </div>
            </div>
            
            {/* Option "Depuis épargne" uniquement visible pour les dépenses */}
            {formData.type === "expense" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fromSavingsAccount" className="text-right">
                  Depuis épargne
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="fromSavingsAccount"
                    checked={formData.fromSavingsAccount}
                    onCheckedChange={(checked) => 
                      handleBooleanChange("fromSavingsAccount", checked)
                    }
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Transaction depuis un compte épargne (n'affecte pas le solde restant)
                  </span>
                </div>
              </div>
            )}
            
            {formData.type === "expense" && formData.fromSavingsAccount && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="savingsAccountId" className="text-right">
                  Compte d'épargne
                </Label>
                <Select
                  onValueChange={(value) => handleSelectChange("savingsAccountId", value)}
                  value={formData.savingsAccountId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un compte d'épargne" />
                  </SelectTrigger>
                  <SelectContent>
                    {savingsAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.currentBalance.toFixed(2)}€)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">Ajouter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionForm;
