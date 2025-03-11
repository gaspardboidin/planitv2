
import { useState, useEffect } from "react";
import { SavingsAccount } from "@/types/finance";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (account: any) => Promise<void>;
  title: string;
  account?: SavingsAccount;
}

const ACCOUNT_TYPES = [
  { value: "Livret A", label: "Livret A", 
    defaultRate: 2.4, defaultMax: 22950, defaultInterestType: "fixed", defaultInterestFrequency: "annually" },
  { value: "LDDS", label: "LDDS - Livret Développement Durable et Solidaire", 
    defaultRate: 2.4, defaultMax: 12000, defaultInterestType: "fixed", defaultInterestFrequency: "annually" },
  { value: "LEP", label: "LEP (Livret d'Épargne Populaire)", 
    defaultRate: 3.5, defaultMax: 10000, defaultInterestType: "fixed", defaultInterestFrequency: "annually" },
  { value: "Livret Jeune", label: "Livret Jeune", 
    defaultRate: 2.4, defaultMax: 1600, defaultInterestType: "fixed", defaultInterestFrequency: "annually" },
  { value: "CEL", label: "CEL (Compte Épargne Logement)", 
    defaultRate: 1.5, defaultMax: 15300, defaultInterestType: "fixed", defaultInterestFrequency: "annually" },
  { value: "PEL", label: "PEL (Plan Épargne Logement)", 
    defaultRate: 2.8, defaultMax: 61200, defaultInterestType: "fixed", defaultInterestFrequency: "annually" },
  { value: "Assurance Vie", label: "Assurance Vie", 
    defaultRate: 8, defaultMax: null, defaultInterestType: "variable", defaultInterestFrequency: "annually" },
  { value: "PEA", label: "PEA (Plan d'Épargne en Actions)", 
    defaultRate: 8, defaultMax: 150000, defaultInterestType: "variable", defaultInterestFrequency: "annually" },
  { value: "PER", label: "PER (Plan d'Épargne Retraite)", 
    defaultRate: 8, defaultMax: null, defaultInterestType: "variable", defaultInterestFrequency: "annually" },
  { value: "Compte Courant", label: "Compte Courant", 
    defaultRate: 0, defaultMax: null, defaultInterestType: "fixed", defaultInterestFrequency: "annually" },
  { value: "Compte Titres", label: "Compte Titres", 
    defaultRate: 8, defaultMax: null, defaultInterestType: "variable", defaultInterestFrequency: "annually" },
  { value: "Autre", label: "Autre", 
    defaultRate: 0, defaultMax: null, defaultInterestType: "fixed", defaultInterestFrequency: "annually" },
];

const AccountDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  title, 
  account 
}: AccountDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    accountType: "Livret A",
    isLiquid: true,
    maxDepositLimit: 22950,
    hasLimit: true,
    currentBalance: 0,
    interestRate: 3,
    interestFrequency: "annually" as "monthly" | "annually",
    interestType: "fixed" as "fixed" | "variable"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        accountType: account.accountType,
        isLiquid: account.isLiquid,
        maxDepositLimit: account.maxDepositLimit || 0,
        hasLimit: account.maxDepositLimit !== null,
        currentBalance: account.currentBalance,
        interestRate: account.interestRate,
        interestFrequency: account.interestFrequency || "annually",
        interestType: account.interestType || "fixed"
      });
    } else {
      // Default values for a new account
      setFormData({
        name: "",
        accountType: "Livret A",
        isLiquid: true,
        maxDepositLimit: 22950,
        hasLimit: true,
        currentBalance: 0,
        interestRate: 3,
        interestFrequency: "annually",
        interestType: "fixed"
      });
    }
    setFormError(null);
    setIsSubmitting(false);
  }, [account, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAccountTypeChange = (value: string) => {
    const selectedType = ACCOUNT_TYPES.find(type => type.value === value);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        accountType: value,
        interestRate: selectedType.defaultRate,
        maxDepositLimit: selectedType.defaultMax || 0,
        hasLimit: selectedType.defaultMax !== null,
        interestType: selectedType.defaultInterestType as "fixed" | "variable",
        interestFrequency: selectedType.defaultInterestFrequency as "monthly" | "annually"
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log("Soumission déjà en cours, ignorée");
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Veuillez saisir un nom pour le compte");
      setIsSubmitting(false);
      return;
    }
    
    console.log("Soumission du formulaire:", formData);
    
    try {
      const submitData = {
        ...account,
        name: formData.name,
        accountType: formData.accountType,
        isLiquid: formData.isLiquid,
        maxDepositLimit: formData.hasLimit ? Number(formData.maxDepositLimit) : null,
        currentBalance: Number(formData.currentBalance),
        interestRate: Number(formData.interestRate),
        interestFrequency: formData.interestFrequency,
        interestType: formData.interestType
      };
      
      console.log("Données soumises:", submitData);
      await onSubmit(submitData);
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      setFormError("Une erreur est survenue lors de l'enregistrement du compte");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Créez ou modifiez les informations de votre compte d'épargne
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du compte</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Mon Livret A"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountType">Type de compte</Label>
            <Select
              value={formData.accountType}
              onValueChange={handleAccountTypeChange}
              disabled={isSubmitting}
            >
              <SelectTrigger id="accountType">
                <SelectValue placeholder="Sélectionner un type de compte" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="isLiquid">Liquidité</Label>
            <Switch
              id="isLiquid"
              checked={formData.isLiquid}
              onCheckedChange={value => setFormData(prev => ({ ...prev, isLiquid: value }))}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="hasLimit">Plafond de dépôt</Label>
            <Switch
              id="hasLimit"
              checked={formData.hasLimit}
              onCheckedChange={value => setFormData(prev => ({ ...prev, hasLimit: value }))}
              disabled={isSubmitting}
            />
          </div>
          
          {formData.hasLimit && (
            <div className="space-y-2">
              <Label htmlFor="maxDepositLimit">Montant du plafond (€)</Label>
              <Input
                id="maxDepositLimit"
                name="maxDepositLimit"
                type="number"
                value={formData.maxDepositLimit}
                onChange={handleChange}
                min="0"
                required={formData.hasLimit}
                disabled={isSubmitting}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="currentBalance">Solde actuel (€)</Label>
            <Input
              id="currentBalance"
              name="currentBalance"
              type="number"
              value={formData.currentBalance}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interestRate">Taux d'intérêt (%)</Label>
            <Input
              id="interestRate"
              name="interestRate"
              type="number"
              value={formData.interestRate}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="100"
              required
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              {formData.interestType === "variable" 
                ? "Taux estimé basé sur des performances historiques (rendement non garanti)" 
                : "Taux fixe garanti"}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Type d'intérêts</Label>
            <RadioGroup 
              value={formData.interestType} 
              onValueChange={(value: "fixed" | "variable") => 
                setFormData(prev => ({ ...prev, interestType: value }))
              }
              className="flex flex-col space-y-1"
              disabled={isSubmitting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" disabled={isSubmitting} />
                <Label htmlFor="fixed" className="font-normal">Fixe (garanti)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="variable" id="variable" disabled={isSubmitting} />
                <Label htmlFor="variable" className="font-normal">Variable (non garanti, estimé)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>Fréquence des intérêts</Label>
            <RadioGroup 
              value={formData.interestFrequency} 
              onValueChange={(value: "monthly" | "annually") => 
                setFormData(prev => ({ ...prev, interestFrequency: value }))
              }
              className="flex flex-col space-y-1"
              disabled={isSubmitting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" disabled={isSubmitting} />
                <Label htmlFor="monthly" className="font-normal">Mensuelle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="annually" id="annually" disabled={isSubmitting} />
                <Label htmlFor="annually" className="font-normal">Annuelle</Label>
              </div>
            </RadioGroup>
          </div>
          
          {formError && (
            <div className="text-destructive text-sm">{formError}</div>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="relative">
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDialog;
