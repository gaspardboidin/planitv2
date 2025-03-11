
import { useFinance } from "@/contexts/finance";
import BalanceCard from "@/components/BalanceCard";

const BudgetSummary = () => {
  const { 
    getTotalFixedIncomes, 
    getTotalFixedExpenses 
  } = useFinance();
  
  const totalIncomesExcludingReceived = getTotalFixedIncomes(true);
  const totalExpensesExcludingPaid = getTotalFixedExpenses(true);
  const difference = totalIncomesExcludingReceived - totalExpensesExcludingPaid;

  return (
    <div className="glass-card rounded-lg p-6 shadow-sm border border-gray-700/50 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)]">
      <h2 className="text-xl font-semibold mb-6">Résumé du budget</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BalanceCard
          title="Total revenus"
          amount={totalIncomesExcludingReceived}
          className="bg-green-50"
        />
        <BalanceCard
          title="Total dépenses"
          amount={totalExpensesExcludingPaid}
          className="bg-red-50"
        />
        <BalanceCard
          title="Différence"
          amount={difference}
          className="bg-blue-50"
        />
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Conseils de budget</h3>
        <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 dark:text-white">
          <li>
            Visez à économiser 20% de vos revenus pour l'épargne et les investissements.
          </li>
          <li>
            Limitez vos dépenses fixes à moins de 50% de vos revenus nets.
          </li>
          <li>
            Révisez régulièrement vos abonnements et services pour éliminer ceux que vous n'utilisez pas.
          </li>
          <li>
            Prévoyez une réserve d'urgence équivalente à 3-6 mois de dépenses.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BudgetSummary;
