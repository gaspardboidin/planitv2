
import { useState } from "react";
import { MonthlyBudget } from "@/types/finance";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck } from "lucide-react";

interface SavingsGoalCardProps {
  budget: MonthlyBudget;
  updateMonthlySavings: (amount: number) => void;
  toggleSavingsSetAside: () => void;
}

const SavingsGoalCard = ({ 
  budget, 
  updateMonthlySavings, 
  toggleSavingsSetAside 
}: SavingsGoalCardProps) => {
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState(budget.monthlySavings.toString());
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSavingGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonthlySavingsGoal(e.target.value);
  };
  
  const handleSavingGoalSubmit = () => {
    const newSaving = parseFloat(monthlySavingsGoal) || 0;
    updateMonthlySavings(newSaving);
    setIsEditing(false);
  };

  return (
    <div className="glass-card rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Objectif d'épargne</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Économies mensuelles actuelles</span>
          {isEditing ? (
            <div className="flex items-center">
              <Input
                value={monthlySavingsGoal}
                onChange={handleSavingGoalChange}
                className="w-32 mr-2"
                type="number"
                step="0.01"
              />
              <Button size="sm" onClick={handleSavingGoalSubmit}>
                Enregistrer
              </Button>
            </div>
          ) : (
            <span className="font-medium flex items-center">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(budget.monthlySavings)}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={() => setIsEditing(true)}
              >
                Modifier
              </Button>
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-700">État de l'épargne</span>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
            onClick={toggleSavingsSetAside}
          >
            {budget.isSavingsSetAside ? (
              <>
                <ShieldCheck size={16} className="text-green-600" />
                Mise de côté
              </>
            ) : (
              <>
                <Shield size={16} />
                Non mise de côté
              </>
            )}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Économies annuelles estimées</span>
          <span className="font-medium">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(budget.monthlySavings * 12)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Taux d'épargne (% du revenu)</span>
          <span className="font-medium">
            {Math.round((budget.monthlySavings / (budget.initialBalance * 0.05)) * 100)}%
          </span>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Conseils d'épargne</h3>
        <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
          <li>
            Automatisez votre épargne dès réception de votre salaire.
          </li>
          <li>
            Définissez des objectifs d'épargne spécifiques avec des échéances.
          </li>
          <li>
            Augmentez progressivement votre taux d'épargne chaque année.
          </li>
          <li>
            Diversifiez vos investissements pour gérer les risques.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SavingsGoalCard;
