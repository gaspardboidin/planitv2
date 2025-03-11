
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatEuro } from "@/lib/utils";

interface BudgetItemAmountProps {
  amount: number;
  isChecked: boolean;
  type: "income" | "expense";
  onAmountChange: (amount: number) => void;
}

const BudgetItemAmount = ({ 
  amount, 
  isChecked, 
  type,
  onAmountChange 
}: BudgetItemAmountProps) => {
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [amountString, setAmountString] = useState(amount.toString());

  const formattedAmount = formatEuro(amount);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setAmountString(value);
  };

  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
    
    setIsEditingAmount(false);
    const newAmount = parseFloat(amountString) || 0;
    onAmountChange(newAmount);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingAmount(false);
      const newAmount = parseFloat(amountString) || 0;
      onAmountChange(newAmount);
    } else if (e.key === 'Escape') {
      setIsEditingAmount(false);
      setAmountString(amount.toString());
    }
  };

  return (
    <div 
      className="min-w-24 text-right cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setIsEditingAmount(true);
      }}
    >
      {isEditingAmount ? (
        <Input
          type="text"
          value={amountString}
          onChange={handleAmountChange}
          onBlur={handleAmountBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-8 w-24 text-right dark:bg-[#1c1c20] dark:border-gray-700/30 dark:text-gray-200"
        />
      ) : (
        <span 
          className={`font-medium ${
            type === "income" 
              ? isChecked
                ? "text-gray-400 dark:text-gray-500 line-through"
                : amount > 0 ? "text-revenue-DEFAULT dark:text-green-400" : "text-gray-400 dark:text-gray-500" 
              : isChecked
                ? "text-gray-400 dark:text-gray-500 line-through"
                : amount > 0 ? "text-expense-DEFAULT dark:text-red-400" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {amount > 0 ? formattedAmount : "- €"}
        </span>
      )}
    </div>
  );
};

export default BudgetItemAmount;
