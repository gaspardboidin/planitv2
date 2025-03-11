
import { useEffect, useState } from "react";
import { useFinance } from "@/contexts/finance";
import BudgetItemsColumn from "./BudgetItemsColumn";
import { toast } from "@/components/ui/use-toast";

const BudgetItemsGrid = () => {
  const { 
    getCurrentBudget,
    getTotalFixedIncomes, 
    getTotalFixedExpenses,
    addFixedIncome,
    addFixedExpense
  } = useFinance();
  
  const [budget, setBudget] = useState(null);
  const [fixedIncomes, setFixedIncomes] = useState(0);
  const [fixedExpenses, setFixedExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBudgetData = () => {
      try {
        setIsLoading(true);
        const currentBudget = getCurrentBudget();
        setBudget(currentBudget);
        
        // Calculer les totaux après avoir défini le budget
        const totalIncomes = getTotalFixedIncomes(true);
        const totalExpenses = getTotalFixedExpenses(true);
        
        setFixedIncomes(totalIncomes);
        setFixedExpenses(totalExpenses);
        
        // Debugging
        console.log("Budget chargé:", currentBudget);
        console.log("Revenus fixes:", currentBudget.fixedIncomes);
        console.log("Dépenses fixes:", currentBudget.fixedExpenses);
      } catch (error) {
        console.error("Erreur lors du chargement des données du budget:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du budget",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBudgetData();
  }, [getCurrentBudget, getTotalFixedIncomes, getTotalFixedExpenses]);

  // Handle loading state
  if (isLoading) {
    return <div className="p-4 text-center">Chargement du budget...</div>;
  }

  // Don't render until we have the budget data
  if (!budget) {
    return <div className="p-4 text-center">Aucune donnée de budget disponible</div>;
  }

  // These wrapper functions match the expected interface in BudgetItemsColumn
  const handleAddIncome = (name: string, amount: number) => {
    addFixedIncome(name, amount);
  };

  const handleAddExpense = (name: string, amount: number) => {
    addFixedExpense(name, amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
      <BudgetItemsColumn 
        title="Revenus fixes"
        type="income"
        items={budget.fixedIncomes || []}
        total={fixedIncomes}
        onAdd={handleAddIncome}
      />
      
      <BudgetItemsColumn 
        title="Dépenses fixes"
        type="expense"
        items={budget.fixedExpenses || []}
        total={fixedExpenses}
        onAdd={handleAddExpense}
      />
    </div>
  );
};

export default BudgetItemsGrid;
