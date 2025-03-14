
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface AddBudgetItemFormProps {
  onAdd: (name: string, amount: number) => void;
  type: "income" | "expense";
}

const AddBudgetItemForm = ({ onAdd, type }: AddBudgetItemFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setAmount(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez saisir un nom pour cet élément.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    
    const parsedAmount = parseFloat(amount) || 0;
    onAdd(name.trim(), parsedAmount);
    
    // Reset form
    setName("");
    setAmount("");
    setIsOpen(false);
    
    toast({
      title: type === "income" ? "Revenu ajouté" : "Dépense ajoutée",
      description: `${name} a été ajouté avec succès.`,
      duration: 2000,
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className={`${
          type === "income" ? "text-revenue-DEFAULT hover:text-revenue-DEFAULT" : "text-expense-DEFAULT hover:text-expense-DEFAULT"
        }`}
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        {type === "income" ? "Ajouter un revenu" : "Ajouter une dépense"}
      </Button>
    );
  }

  return (
    <div className="border rounded-md p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">
          {type === "income" ? "Ajouter un revenu" : "Ajouter une dépense"}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-2"
            autoFocus
          />
          <Input
            type="text"
            placeholder="Montant (€)"
            value={amount}
            onChange={handleAmountChange}
          />
        </div>
        
        <div className="flex justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            className="bg-[#1E2632] hover:bg-[#1E2632]/90 text-white"
          >
            Ajouter
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddBudgetItemForm;
