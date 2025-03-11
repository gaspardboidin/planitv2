
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface BalanceCardProps {
  title: string;
  amount: number;
  className?: string;
  icon?: ReactNode;
  editable?: boolean;
  onAmountChange?: (amount: number) => void;
}

const BalanceCard = ({ 
  title, 
  amount, 
  className, 
  icon, 
  editable = false,
  onAmountChange
}: BalanceCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(amount.toString());

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

  const handleBlur = () => {
    setIsEditing(false);
    if (onAmountChange) {
      const newAmount = parseFloat(editValue) || 0;
      onAmountChange(newAmount);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(amount.toString());
    }
  };

  const handleCardClick = () => {
    if (editable) {
      setIsEditing(true);
      setEditValue(amount.toString());
    }
  };

  return (
    <div 
      className={cn(
        "glass-card rounded-lg p-6 shadow-sm cursor-default dark:card-highlight", 
        editable && "hover:bg-gray-50 dark:hover:bg-[#28282d] cursor-pointer", 
        className
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">{title}</h3>
        {icon && <div className="opacity-70 dark:text-gray-300">{icon}</div>}
      </div>
      {isEditing && editable ? (
        <div className="mt-2 w-full">
          <Input
            type="text"
            value={editValue}
            onChange={handleAmountChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="text-xl font-semibold h-10 dark:bg-[#1c1c20] dark:border-gray-700/30 dark:text-gray-200"
          />
        </div>
      ) : (
        <p className="mt-2 text-3xl font-semibold dark:text-gray-100">{formattedAmount}</p>
      )}
    </div>
  );
};

export default BalanceCard;
