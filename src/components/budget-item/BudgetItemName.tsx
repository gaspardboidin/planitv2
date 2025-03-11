
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit } from "lucide-react";
import { FixedIncome, FixedExpense } from "@/types/finance";

interface BudgetItemNameProps {
  item: FixedIncome | FixedExpense;
  isChecked: boolean;
  onNameChange: (name: string) => void;
  onStatusChange: (checked: boolean | "indeterminate") => void;
}

const BudgetItemName = ({ 
  item, 
  isChecked, 
  onNameChange, 
  onStatusChange 
}: BudgetItemNameProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(item.name);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (name.trim()) {
      onNameChange(name.trim());
    } else {
      setName(item.name); // Reset to original if empty
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Checkbox 
        id={`status-${item.id}`}
        checked={isChecked || false}
        onCheckedChange={onStatusChange}
      />
      <div className="flex-1">
        {isEditingName ? (
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            autoFocus
            className="h-8 w-full dark:bg-[#1c1c20] dark:border-gray-700/30 dark:text-gray-200"
          />
        ) : (
          <div 
            className="group flex items-center cursor-pointer" 
            onClick={() => setIsEditingName(true)}
          >
            <span className={`font-medium ${isChecked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
              {item.name}
            </span>
            <Edit className="h-3.5 w-3.5 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetItemName;
