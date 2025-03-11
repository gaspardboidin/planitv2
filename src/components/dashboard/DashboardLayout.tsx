import React from "react";
import { useFinance } from "@/contexts/finance"; // <-- pour accéder à isLoading
import MonthPicker from "@/components/MonthPicker";
import BalanceCards from "./BalanceCards";
import TransactionsSection from "./TransactionsSection";
import BudgetItemsGrid from "./BudgetItemsGrid";

const DashboardLayout = () => {
  // Récupérer l'indicateur de chargement
  const { isLoading } = useFinance();

  // Si c'est encore en chargement, on affiche un spinner ou un message
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Chargement des données...</p>
      </div>
    );
  }

  // Sinon, on affiche le contenu normal du dashboard
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-6">
      <div className="mb-6">
        <MonthPicker />
      </div>

      <BalanceCards />

      <div className="mb-6">
        <TransactionsSection />
      </div>

      <BudgetItemsGrid />
    </div>
  );
};

export default DashboardLayout;
