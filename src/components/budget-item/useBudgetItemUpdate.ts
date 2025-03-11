
import { useState } from "react";
import { FixedIncome, FixedExpense } from "@/types/finance";

interface UseBudgetItemUpdateProps {
  item: FixedIncome | FixedExpense;
  type: "income" | "expense";
  onUpdate: (item: FixedIncome | FixedExpense) => void;
  onUpdateCurrentMonthOnly?: (item: FixedIncome | FixedExpense) => void;
  isCurrentMonth?: boolean;
}

export const useBudgetItemUpdate = ({
  item,
  type,
  onUpdate,
  onUpdateCurrentMonthOnly,
  isCurrentMonth = false
}: UseBudgetItemUpdateProps) => {
  const [updateCurrentMonthOnly, setUpdateCurrentMonthOnly] = useState(true); // Default to true

  const isChecked = type === "expense" 
    ? (item as FixedExpense).isPaid 
    : (item as FixedIncome).isReceived;

  const handleNameChange = (newName: string) => {
    const updatedItem = { ...item, name: newName };
    onUpdate(updatedItem);
  };

  const handleAmountChange = (newAmount: number) => {
    const updatedItem = { ...item, amount: newAmount };
    
    if (isCurrentMonth && onUpdateCurrentMonthOnly && updateCurrentMonthOnly) {
      onUpdateCurrentMonthOnly(updatedItem);
    } else {
      onUpdate(updatedItem);
    }
    
    // No longer reset to default after saving
    // This was the issue - it was always resetting to current month only
  };

  const handleStatusChange = (checked: boolean | "indeterminate") => {
    if (type === "expense") {
      const updatedItem = { 
        ...item as FixedExpense, 
        isPaid: checked === true 
      };
      
      if (isCurrentMonth && onUpdateCurrentMonthOnly && updateCurrentMonthOnly) {
        onUpdateCurrentMonthOnly(updatedItem);
      } else {
        onUpdate(updatedItem);
      }
    } else if (type === "income") {
      const updatedItem = { 
        ...item as FixedIncome, 
        isReceived: checked === true 
      };
      
      if (isCurrentMonth && onUpdateCurrentMonthOnly && updateCurrentMonthOnly) {
        onUpdateCurrentMonthOnly(updatedItem);
      } else {
        onUpdate(updatedItem);
      }
    }
    
    // No longer reset to default after saving
    // This was the issue - it was always resetting to current month only
  };

  const toggleCurrentMonthOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdateCurrentMonthOnly(!updateCurrentMonthOnly);
  };

  return {
    isChecked,
    updateCurrentMonthOnly,
    handleNameChange,
    handleAmountChange,
    handleStatusChange,
    toggleCurrentMonthOnly
  };
};
