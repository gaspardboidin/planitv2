
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Coins, Shield, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CurrentMonthToggle from "@/components/budget-item/CurrentMonthToggle";
import CurrentMonthUpdateHelp from "@/components/CurrentMonthUpdateHelp";
import { addMonths, format } from "date-fns";
import { fr } from "date-fns/locale";

interface SavingsCardProps {
  amount: number;
  isSetAside: boolean;
  className?: string;
  onAmountChange: (amount: number, currentMonthOnly?: boolean) => void;
  onToggleSetAside: () => void;
}

const SavingsCard = ({ 
  amount, 
  isSetAside,
  className, 
  onAmountChange,
  onToggleSetAside
}: SavingsCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(amount.toString());
  const [currentMonthOnly, setCurrentMonthOnly] = useState(true); // Default to true (current month only)
  const [showEstimates, setShowEstimates] = useState(false);

  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setEditValue(value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if the related target is within our toggle container
    // If it is, don't blur
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && (
        relatedTarget.closest('.month-toggle-container') || 
        relatedTarget.classList.contains('month-toggle-button')
      )) {
      e.preventDefault();
      return;
    }
    
    setIsEditing(false);
    const newAmount = parseFloat(editValue) || 0;
    onAmountChange(newAmount, currentMonthOnly);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      const newAmount = parseFloat(editValue) || 0;
      onAmountChange(newAmount, currentMonthOnly);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(amount.toString());
    }
  };

  const handleCardClick = () => {
    setIsEditing(true);
    setEditValue(amount.toString());
  };
  
  const handleToggleCurrentMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Just toggle the state without saving
    setCurrentMonthOnly(prev => !prev);
  };

  // Generate future month estimates
  const generateFutureEstimates = () => {
    const currentDate = new Date();
    const estimates = [];
    const newAmount = parseFloat(editValue) || amount;
    
    for (let i = 1; i <= 3; i++) {
      const futureDate = addMonths(currentDate, i);
      estimates.push({
        month: format(futureDate, 'MMMM yyyy', { locale: fr }),
        amount: newAmount
      });
    }
    
    return estimates;
  };

  const futureEstimates = generateFutureEstimates();

  return (
    <div 
      className={cn("glass-card rounded-lg p-6 shadow-sm hover:bg-gray-50 cursor-pointer", className)}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-gray-500">Épargne du mois</h3>
          {isEditing && <CurrentMonthUpdateHelp />}
        </div>
        <div className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-green-500" />
          
          {isEditing && (
            <div onClick={(e) => e.stopPropagation()} className="month-toggle-container">
              <CurrentMonthToggle 
                active={currentMonthOnly}
                onToggle={handleToggleCurrentMonth}
              />
            </div>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSetAside();
                }}
              >
                {isSetAside ? (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <Shield className="h-5 w-5 text-gray-400" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isSetAside 
                ? "L'épargne a été mise de côté et n'est pas comptée dans le solde restant" 
                : "Cliquer pour marquer l'épargne comme mise de côté"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      {isEditing ? (
        <div className="mt-2 w-full">
          <Input
            type="text"
            value={editValue}
            onChange={handleAmountChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="text-xl font-semibold h-10"
          />
          <p className="mt-1 text-xs text-blue-600">
            {currentMonthOnly 
              ? "Modification pour ce mois uniquement" 
              : "Modification pour ce mois et les suivants"}
          </p>
          
          {!currentMonthOnly && (
            <div className="mt-3 border-t pt-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEstimates(prev => !prev);
                }}
                className="text-xs text-blue-500 flex items-center"
              >
                {showEstimates ? "Masquer" : "Afficher"} l'estimation des mois futurs
              </button>
              
              {showEstimates && (
                <div className="mt-2 space-y-2 text-xs">
                  <p className="text-gray-500 italic">Estimation basée sur la valeur actuelle:</p>
                  {futureEstimates.map((estimate, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600">{estimate.month}:</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                          minimumFractionDigits: 2,
                        }).format(estimate.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-3xl font-semibold">{formattedAmount}</p>
      )}
      {isSetAside && (
        <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> 
          Épargne mise de côté
        </p>
      )}
    </div>
  );
};

export default SavingsCard;
