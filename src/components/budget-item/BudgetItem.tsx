import { FixedIncome, FixedExpense } from "@/types/finance";
import BudgetItemName from "./BudgetItemName";
import BudgetItemAmount from "./BudgetItemAmount";
import CurrentMonthToggle from "./CurrentMonthToggle";
import DeleteButton from "./DeleteButton";
import { useBudgetItemUpdate } from "./useBudgetItemUpdate";

interface BudgetItemProps {
  item: FixedIncome | FixedExpense;
  onUpdate: (item: FixedIncome | FixedExpense) => void;
  onUpdateCurrentMonthOnly?: (item: FixedIncome | FixedExpense) => void;
  onRemove?: (id: string) => void;
  type: "income" | "expense";
  isCurrentMonth?: boolean;
}

const BudgetItem = ({ 
  item, 
  onUpdate, 
  onUpdateCurrentMonthOnly, 
  onRemove, 
  type, 
  isCurrentMonth = false 
}: BudgetItemProps) => {
  const {
    isChecked,
    updateCurrentMonthOnly,
    handleNameChange,
    handleAmountChange,
    handleStatusChange,
    toggleCurrentMonthOnly
  } = useBudgetItemUpdate({
    item,
    type,
    onUpdate,
    onUpdateCurrentMonthOnly,
    isCurrentMonth
  });

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100">
      <BudgetItemName 
        item={item}
        isChecked={isChecked || false}
        onNameChange={handleNameChange}
        onStatusChange={handleStatusChange}
      />
      
      <div className="flex items-center gap-2">
        {isCurrentMonth && onUpdateCurrentMonthOnly && (
          <div onClick={(e) => e.stopPropagation()} className="month-toggle-container">
            <CurrentMonthToggle
              active={updateCurrentMonthOnly}
              onToggle={toggleCurrentMonthOnly}
            />
          </div>
        )}
        
        <BudgetItemAmount
          amount={item.amount}
          isChecked={isChecked || false}
          type={type}
          onAmountChange={handleAmountChange}
        />
        
        {onRemove && (
          <DeleteButton onDelete={() => onRemove(item.id)} />
        )}
      </div>
    </div>
  );
};

export default BudgetItem;
