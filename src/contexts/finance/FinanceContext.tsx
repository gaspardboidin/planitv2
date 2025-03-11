
import React, { createContext, useContext } from 'react';
import { FinanceContextType } from './types';
import { useFinanceState } from './useFinanceState';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const financeState = useFinanceState();
  
  return (
    <FinanceContext.Provider value={financeState}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
