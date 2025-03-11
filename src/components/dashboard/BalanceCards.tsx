
import { useEffect } from "react";
import { useFinance } from "@/contexts/finance";
import { CreditCard, Wallet } from "lucide-react";
import BalanceCard from "@/components/BalanceCard";
import SavingsCard from "@/components/SavingsCard";
import { toast } from "@/components/ui/use-toast";

const BalanceCards = () => {
  const { 
    getCurrentBudget, 
    getTotalFixedIncomes, 
    getTotalFixedExpenses, 
    getTotalTransactions,
    updateInitialBalance,
    updateMonthlySavings,
    toggleSavingsSetAside
  } = useFinance();
  
  const budget = getCurrentBudget();
  const fixedIncomes = getTotalFixedIncomes(true);
  const fixedExpenses = getTotalFixedExpenses(true);
  const transactionTotal = getTotalTransactions();
  
  // Calculate the remaining balance
  const calculatedRemainingBalance = 
  budget.initialBalance
  + fixedIncomes
  - fixedExpenses
  + transactionTotal
  - (budget.isSavingsSetAside ? 0 : budget.monthlySavings);

  const handleInitialBalanceChange = (newAmount: number) => {
    updateInitialBalance(newAmount);
    toast({
      title: "Solde initial mis à jour",
      description: "Le solde initial a été mis à jour avec succès."
    });
  };

  const handleSavingsChange = (newAmount: number, currentMonthOnly: boolean = false) => {
    updateMonthlySavings(newAmount, currentMonthOnly);
    toast({
      title: "Épargne mise à jour",
      description: currentMonthOnly 
        ? "Le montant d'épargne a été mis à jour pour ce mois uniquement." 
        : "Le montant d'épargne a été mis à jour pour ce mois et les mois futurs."
    });
  };

  const handleToggleSavingsSetAside = () => {
    toggleSavingsSetAside();
    toast({
      title: budget.isSavingsSetAside ? "Épargne non mise de côté" : "Épargne mise de côté",
      description: budget.isSavingsSetAside 
        ? "L'épargne est maintenant comptée dans le solde restant." 
        : "L'épargne n'est plus comptée dans le solde restant."
    });
  };

  useEffect(() => {
    // Animation for cards
    const cards = document.querySelectorAll('.fade-in-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate-slide-in');
        card.classList.remove('opacity-0');
      }, 100 * index);
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
      <BalanceCard 
        title="Solde initial" 
        amount={budget.initialBalance}
        className="fade-in-card opacity-0"
        icon={<Wallet className="h-5 w-5 text-gray-400" />}
        editable={true}
        onAmountChange={handleInitialBalanceChange}
      />
      <BalanceCard 
        title="Solde restant mois" 
        amount={calculatedRemainingBalance}
        className="fade-in-card opacity-0"
        icon={<CreditCard className="h-5 w-5 text-savings-DEFAULT" />}
      />
      <SavingsCard 
        amount={budget.monthlySavings}
        isSetAside={budget.isSavingsSetAside}
        className="fade-in-card opacity-0"
        onAmountChange={handleSavingsChange}
        onToggleSetAside={handleToggleSavingsSetAside}
      />
    </div>
  );
};

export default BalanceCards;
