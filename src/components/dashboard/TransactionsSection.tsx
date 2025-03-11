
import { useFinance } from "@/contexts/finance";
import TransactionItem from "@/components/TransactionItem";
import AddTransactionForm from "@/components/AddTransactionForm";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const TransactionsSection = () => {
  const { getCurrentBudget } = useFinance();
  const [searchQuery, setSearchQuery] = useState("");
  const [budget, setBudget] = useState(null);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setIsLoading(true);
      const currentBudget = getCurrentBudget();
      setBudget(currentBudget);
      
      if (currentBudget && currentBudget.transactions) {
        setFilteredTransactions(currentBudget.transactions);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching budget data:", err);
      setError("Impossible de charger les transactions");
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentBudget]);

  useEffect(() => {
    if (budget && budget.transactions) {
      if (searchQuery.trim() === "") {
        setFilteredTransactions(budget.transactions);
      } else {
        const filtered = budget.transactions.filter(
          transaction => transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredTransactions(filtered);
      }
    }
  }, [searchQuery, budget]);

  const handleRetry = () => {
    try {
      setIsLoading(true);
      const currentBudget = getCurrentBudget();
      setBudget(currentBudget);
      
      if (currentBudget && currentBudget.transactions) {
        setFilteredTransactions(currentBudget.transactions);
      }
      setError(null);
    } catch (err) {
      setError("Impossible de charger les transactions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-lg p-4 sm:p-6 shadow-sm mb-5 animate-fade-in border border-gray-700/50 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Transactions du mois</h2>
        <div className="flex-shrink-0">
          <AddTransactionForm />
        </div>
      </div>
      
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <Input
          placeholder="Rechercher un libellé..."
          className="pl-10 text-sm w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm mb-2">{error}</p>
            <button 
              onClick={handleRetry} 
              className="flex items-center justify-center mx-auto text-sm text-primary"
            >
              <RefreshCw size={14} className="mr-2" /> Réessayer
            </button>
          </div>
        ) : filteredTransactions && filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction} 
            />
          ))
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm">
            {searchQuery ? "Aucune transaction ne correspond à votre recherche" : "Aucune transaction pour ce mois"}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsSection;
