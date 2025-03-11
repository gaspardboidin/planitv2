
import { useState } from 'react';
import { Transaction } from '@/types/finance';
import { useTransaction } from '@/hooks/finance/useTransaction';

export const useTransactionState = (state: any, setState: React.Dispatch<React.SetStateAction<any>>) => {
  const { 
    addTransaction: addTx, 
    updateTransaction: updateTx, 
    deleteTransaction: deleteTx 
  } = useTransaction(setState);

  // Wrapper functions to provide the current month/year context
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    // Préserver l'heure exacte de la transaction tout en l'ajustant au mois/année sélectionné
    const transactionDate = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
    
    // Créer une nouvelle date avec le mois et l'année courants mais en préservant l'heure
    const newDate = new Date(
      state.currentYear, 
      state.currentMonth, 
      transactionDate.getDate(),
      transactionDate.getHours(), 
      transactionDate.getMinutes(), 
      transactionDate.getSeconds()
    );
    
    const transactionWithCurrentDate = {
      ...transaction,
      date: newDate
    };
    
    addTx(transactionWithCurrentDate);
  };

  const updateTransaction = (transaction: Transaction) => {
    updateTx(transaction);
  };

  const deleteTransaction = (id: string) => {
    deleteTx(id, state.currentMonth, state.currentYear);
  };

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
};
