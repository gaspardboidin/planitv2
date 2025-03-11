
import BudgetHeader from "./BudgetHeader";
import BudgetColumns from "./BudgetColumns";
import BudgetSummary from "./BudgetSummary";

const BudgetLayout = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <BudgetHeader />
      <BudgetColumns />
      <BudgetSummary />
    </div>
  );
};

export default BudgetLayout;
