
import React from "react";
import MonthPicker from "@/components/MonthPicker";
import BalanceCards from "./BalanceCards";
import TransactionsSection from "./TransactionsSection";
import BudgetItemsGrid from "./BudgetItemsGrid";

const DashboardLayout = () => {
  // Authentication is now handled at the route level in App.tsx,
  // so we don't need to check it again here
  
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
