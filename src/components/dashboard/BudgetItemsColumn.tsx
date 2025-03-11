
import { useFinance } from "@/contexts/finance";
import { BudgetItem } from "@/components/budget-item";
import AddBudgetItemForm from "@/components/AddBudgetItemForm";
import CurrentMonthUpdateHelp from "@/components/CurrentMonthUpdateHelp";
import { FixedExpense, FixedIncome } from "@/types/finance";

interface BudgetItemsColumnProps {
  title: string;
  type: "income" | "expense";
  items: FixedIncome[] | FixedExpense[];
  total: number;
  onAdd: (name: string, amount: number) => void;
}

const BudgetItemsColumn = ({ 
  title, 
  type, 
  items, 
  total, 
  onAdd 
}: BudgetItemsColumnProps) => {
  const { 
    updateFixedIncome,
    updateFixedExpense,
    removeFixedIncome,
    removeFixedExpense,
    updateCurrentMonthIncome,
    updateCurrentMonthExpense
  } = useFinance();

  const getUpdateHandler = () => {
    return type === "income" ? updateFixedIncome : updateFixedExpense;
  };

  const getRemoveHandler = () => {
    return type === "income" ? removeFixedIncome : removeFixedExpense;
  };

  const getCurrentMonthUpdateHandler = () => {
    return type === "income" ? updateCurrentMonthIncome : updateCurrentMonthExpense;
  };

  return (
    <div className="glass-card rounded-lg p-4 sm:p-6 shadow-sm animate-fade-in h-full">
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:items-center sm:justify-between mb-4">
        <div className="flex items-center">
          <h2 className={`text-lg font-semibold ${type === "income" ? "text-revenue-DEFAULT" : "text-expense-DEFAULT"}`}>
            {title}
          </h2>
          <div className="ml-2">
            <CurrentMonthUpdateHelp />
          </div>
        </div>
        <div className="flex-shrink-0">
          <AddBudgetItemForm onAdd={onAdd} type={type} />
        </div>
      </div>

      <div className="text-2xl font-bold mb-6">
        {new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(total)}
      </div>
      
      <div className="space-y-1">
        {items && items.length > 0 ? (
          items.map((item) => (
            <BudgetItem
              key={item.id}
              item={item}
              onUpdate={getUpdateHandler()}
              onUpdateCurrentMonthOnly={getCurrentMonthUpdateHandler()}
              onRemove={getRemoveHandler()}
              type={type}
              isCurrentMonth={true}
            />
          ))
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm">
            Aucun élément {type === "income" ? "de revenu" : "de dépense"} fixe
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetItemsColumn;
