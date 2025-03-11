
import { FixedIncome, FixedExpense } from "@/types/finance";
import { BudgetItem } from "@/components/budget-item";
import AddBudgetItemForm from "@/components/AddBudgetItemForm";
import { formatEuro } from "@/lib/utils";

interface BudgetColumnProps {
  title: string;
  type: "income" | "expense";
  items: FixedIncome[] | FixedExpense[];
  total: number;
  totalExcludingStatus: number;
  onAdd: (name: string, amount: number) => void;
  onUpdate: (item: FixedIncome | FixedExpense) => void;
  onRemove: (id: string) => void;
}

const BudgetColumn = ({ 
  title, 
  type, 
  items, 
  total,
  totalExcludingStatus, 
  onAdd, 
  onUpdate,
  onRemove 
}: BudgetColumnProps) => {
  const colorClass = type === "income" 
    ? "text-revenue-DEFAULT dark:text-green-400" 
    : "text-expense-DEFAULT dark:text-red-400";

  return (
    <div className="glass-card rounded-lg p-6 shadow-sm border border-gray-700/50 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)]">
      <h2 className={`text-xl font-semibold mb-4 ${colorClass} flex items-center justify-between`}>
        {title}
        <div className="flex flex-col items-end">
          <span className="text-2xl">
            {formatEuro(totalExcludingStatus)}
          </span>
          {total !== totalExcludingStatus && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              (Total: {formatEuro(total)})
            </span>
          )}
        </div>
      </h2>
      
      <AddBudgetItemForm onAdd={onAdd} type={type} />
      
      <div className="space-y-1">
        {items.map((item) => (
          <BudgetItem
            key={item.id}
            item={item}
            onUpdate={onUpdate}
            onRemove={onRemove}
            type={type}
          />
        ))}
      </div>
    </div>
  );
};

export default BudgetColumn;
