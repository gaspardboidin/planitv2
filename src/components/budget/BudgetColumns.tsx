import { useFinance } from "@/contexts/finance";
import BudgetColumn from "./BudgetColumn";

const BudgetColumns = () => {
  const { 
    getCurrentBudget, 
    updateFixedIncome, 
    updateFixedExpense,
    removeFixedIncome,
    removeFixedExpense,
    addFixedIncome,
    addFixedExpense,
    getTotalFixedIncomes,
    getTotalFixedExpenses
  } = useFinance();
  
  const budget = getCurrentBudget();
  const totalIncomes = getTotalFixedIncomes();
  const totalIncomesExcludingReceived = getTotalFixedIncomes(true);
  const totalExpenses = getTotalFixedExpenses();
  const totalExpensesExcludingPaid = getTotalFixedExpenses(true);

  // Ajoute ici un console.log pour vérifier le budget et les totaux
  console.log("Budget actuel :", budget);
  console.log("Total revenus fixes :", totalIncomes, totalIncomesExcludingReceived);
  console.log("Total dépenses fixes :", totalExpenses, totalExpensesExcludingPaid);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-5">
      <BudgetColumn
        title="Revenus fixes"
        type="income"
        items={budget.fixedIncomes}
        total={totalIncomes}
        totalExcludingStatus={totalIncomesExcludingReceived}
        onAdd={addFixedIncome}
        onUpdate={updateFixedIncome}
        onRemove={removeFixedIncome}
      />
      <BudgetColumn
        title="Dépenses fixes"
        type="expense"
        items={budget.fixedExpenses}
        total={totalExpenses}
        totalExcludingStatus={totalExpensesExcludingPaid}
        onAdd={addFixedExpense}
        onUpdate={updateFixedExpense}
        onRemove={removeFixedExpense}
      />
    </div>
  );
};

export default BudgetColumns;
