import React, { createContext, useContext } from "react";
import { useFinanceState } from "./useFinanceState";

type FinanceContextType = ReturnType<typeof useFinanceState>;

// On crée le contexte en lui donnant le type complet
const FinanceContext = createContext<FinanceContextType>({} as FinanceContextType);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // On récupère TOUT ce que renvoie useFinanceState (y compris isLoading)
  const financeState = useFinanceState();

  return (
    <FinanceContext.Provider value={financeState}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};
