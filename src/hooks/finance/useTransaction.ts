
import { useState } from 'react';
import { Transaction, SavingsAccount } from '@/types/finance';
import { getUpdatedBudgetForTransaction } from '@/contexts/finance/financeUtils';
import { addSavingsTransaction } from '@/services/savings';
import { toast } from '@/components/ui/use-toast';

export const useTransaction = (setState: React.Dispatch<React.SetStateAction<any>>) => {
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const transactionDate = transaction.date instanceof Date ? transaction.date : new Date();
    const budgetKey = `${transactionDate.getMonth()}-${transactionDate.getFullYear()}`;
    
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      type: transaction.type === 'expense' ? 'expense' : 'income', // Ensure it's one of the two allowed types
      isYearlyRecurring: !!transaction.isYearlyRecurring,
      fromSavingsAccount: !!transaction.fromSavingsAccount && transaction.type === 'expense', // Assurer que les revenus ne sont jamais depuis un compte d'épargne
      savingsAccountId: transaction.type === 'expense' && transaction.savingsAccountId ? transaction.savingsAccountId : undefined
    };
    
    // Si la transaction provient d'un compte épargne, mettre à jour ce compte
    if (newTransaction.fromSavingsAccount && newTransaction.savingsAccountId) {
      try {
        // Ajouter une transaction négative (withdrawal) au compte d'épargne
        const success = await addSavingsTransaction({
          accountId: newTransaction.savingsAccountId,
          amount: newTransaction.amount,
          description: `Retrait pour: ${newTransaction.description}`,
          transactionDate: new Date(),
          transactionType: 'withdrawal'
        }, null);
        
        if (!success) {
          toast({
            title: "Erreur",
            description: "Impossible de mettre à jour le compte d'épargne",
            variant: "destructive"
          });
          // Ne pas bloquer la création de la transaction si la mise à jour du compte d'épargne échoue
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour du compte d'épargne:", error);
      }
    }
    
    setState(prev => {
      const currentBudget = prev.budgets[budgetKey];
      if (!currentBudget) {
        console.error(`Budget not found for key: ${budgetKey}`);
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter la transaction pour ce mois",
          variant: "destructive"
        });
        return prev;
      }
      
      const updatedTransactions = [...currentBudget.transactions, newTransaction];
      
      // Mise à jour du solde du budget en fonction du type de transaction
      let updatedBudget = currentBudget;
      if (!newTransaction.fromSavingsAccount) {
        updatedBudget = getUpdatedBudgetForTransaction(currentBudget, newTransaction);
      }
      
      // Mise à jour des budgets
      let updatedBudgets = {
        ...prev.budgets,
        [budgetKey]: {
          ...updatedBudget,
          transactions: updatedTransactions
        }
      };
      
      // Si c'est une transaction récurrente annuelle, l'ajouter aux années suivantes
      if (newTransaction.isYearlyRecurring) {
        const originalMonth = transactionDate.getMonth();
        const originalYear = transactionDate.getFullYear();
        
        // Créer des transactions pour les 3 années suivantes
        for (let i = 1; i <= 10; i++) {
          const nextYear = originalYear + i;
          const nextYearBudgetKey = `${originalMonth}-${nextYear}`;
          
          // Vérifier si le budget pour cette année existe
          if (prev.budgets[nextYearBudgetKey]) {
            // Créer une copie de la transaction pour l'année suivante
            const nextYearTransaction: Transaction = {
              ...newTransaction,
              id: `${newTransaction.id}-year-${i}`, // ID unique pour éviter les conflits
              date: new Date(nextYear, originalMonth, transactionDate.getDate(), 
                transactionDate.getHours(), transactionDate.getMinutes())
            };
            
            const nextYearBudget = prev.budgets[nextYearBudgetKey];
            const nextYearUpdatedTransactions = [...nextYearBudget.transactions, nextYearTransaction];
            
            // Mettre à jour le budget de l'année suivante si la transaction n'est pas depuis un compte épargne
            let nextYearUpdatedBudget = nextYearBudget;
            if (!nextYearTransaction.fromSavingsAccount) {
              nextYearUpdatedBudget = getUpdatedBudgetForTransaction(nextYearBudget, nextYearTransaction);
            }
            
            updatedBudgets = {
              ...updatedBudgets,
              [nextYearBudgetKey]: {
                ...nextYearUpdatedBudget,
                transactions: nextYearUpdatedTransactions
              }
            };
          } else {
            // Si le budget n'existe pas encore pour cette année, le créer
            const nextYearTransaction: Transaction = {
              ...newTransaction,
              id: `${newTransaction.id}-year-${i}`,
              date: new Date(nextYear, originalMonth, transactionDate.getDate(), 
                transactionDate.getHours(), transactionDate.getMinutes())
            };
            
            // Créer un nouveau budget avec cette transaction
            updatedBudgets = {
              ...updatedBudgets,
              [nextYearBudgetKey]: {
                month: originalMonth,
                year: nextYear,
                initialBalance: 0,
                remainingBalance: nextYearTransaction.type === 'income' ? nextYearTransaction.amount : -nextYearTransaction.amount,
                monthlySavings: currentBudget.monthlySavings,
                isSavingsSetAside: false,
                isSavingsTransferred: false,
                fixedIncomes: [],
                fixedExpenses: [],
                transactions: [nextYearTransaction]
              }
            };
          }
        }
      }
      
      return {
        ...prev,
        budgets: updatedBudgets
      };
    });
  };

  const updateTransaction = (transaction: Transaction) => {
    const transactionDate = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
    const budgetKey = `${transactionDate.getMonth()}-${transactionDate.getFullYear()}`;
    
    setState(prev => {
      const currentBudget = prev.budgets[budgetKey];
      if (!currentBudget) {
        console.error(`Budget not found for key: ${budgetKey}`);
        return prev;
      }
      
      const oldTransaction = currentBudget.transactions.find(t => t.id === transaction.id);
      if (!oldTransaction) {
        console.error(`Transaction not found with id: ${transaction.id}`);
        return prev;
      }
      
      const updatedTransactions = currentBudget.transactions.map(t => 
        t.id === transaction.id ? transaction : t
      );
      
      // Si l'ancienne ou la nouvelle transaction provient d'un compte épargne, 
      // calculer l'impact sur le budget correctement
      let updatedBudget = currentBudget;
      
      if (!oldTransaction.fromSavingsAccount || !transaction.fromSavingsAccount) {
        updatedBudget = getUpdatedBudgetForTransaction(
          currentBudget, 
          transaction, 
          oldTransaction
        );
      }
      
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [budgetKey]: {
            ...updatedBudget,
            transactions: updatedTransactions
          }
        }
      };
    });
  };

  const deleteTransaction = (id: string, currentMonth: number, currentYear: number) => {
    const budgetKey = `${currentMonth}-${currentYear}`;
    
    setState(prev => {
      const currentBudget = prev.budgets[budgetKey];
      
      if (!currentBudget) {
        console.error(`Budget not found for key: ${budgetKey}`);
        return prev;
      }
      
      const transactionToDelete = currentBudget.transactions.find(t => t.id === id);
      
      if (!transactionToDelete) {
        console.error(`Transaction not found with id: ${id}`);
        return prev;
      }
      
      // Vérifier si c'est une transaction récurrente annuelle
      const isYearlyRecurring = transactionToDelete.isYearlyRecurring;
      
      // Créer une copie des budgets actuels
      let updatedBudgets = { ...prev.budgets };
      
      // Si la transaction provient d'un compte épargne, elle n'affecte pas le budget lors de la suppression
      let updatedBudget = currentBudget;
      
      if (!transactionToDelete.fromSavingsAccount) {
        // Update the balance in the opposite direction (delete = reverse of add)
        const reversedTransaction: Transaction = {
          ...transactionToDelete,
          type: transactionToDelete.type === 'expense' ? 'income' : 'expense'
        };
        
        updatedBudget = getUpdatedBudgetForTransaction(
          currentBudget, 
          reversedTransaction
        );
      }
      
      const updatedTransactions = currentBudget.transactions.filter(t => t.id !== id);
      
      // Mettre à jour le budget courant
      updatedBudgets[budgetKey] = {
        ...updatedBudget,
        transactions: updatedTransactions
      };
      
      // Si c'est une transaction récurrente annuelle, supprimer aussi les occurrences futures
      if (isYearlyRecurring) {
        const originalMonth = transactionToDelete.date instanceof Date 
          ? transactionToDelete.date.getMonth() 
          : new Date(transactionToDelete.date).getMonth();
          
        const originalYear = transactionToDelete.date instanceof Date 
          ? transactionToDelete.date.getFullYear() 
          : new Date(transactionToDelete.date).getFullYear();
        
        // Identifier le pattern d'ID pour les transactions récurrentes
        // Le format est généralement id-year-X où X est un nombre
        const baseId = id.split('-year-')[0];
        const isBaseTransaction = id === baseId; // Si c'est la transaction originale
        
        // Parcourir tous les budgets
        Object.keys(prev.budgets).forEach(key => {
          if (key !== budgetKey) { // Ne pas traiter à nouveau le budget courant
            const [month, year] = key.split('-').map(Number);
            
            // Pour une transaction de base, supprimer toutes les récurrences futures
            // Pour une récurrence, supprimer seulement les récurrences futures de la même séquence
            if ((isBaseTransaction && month === originalMonth && year > originalYear) ||
                (!isBaseTransaction && month === originalMonth && year > originalYear)) {
              
              const budget = prev.budgets[key];
              
              // Trouver toutes les transactions liées (mêmes récurrences)
              const relatedTransactions = budget.transactions.filter(t => {
                // Soit l'ID commence par baseId (pour les transactions futures de la base)
                // Soit l'ID est basé sur le même pattern baseId-year-X
                return t.id.startsWith(baseId);
              });
              
              // Mettre à jour le solde pour chaque transaction supprimée (sauf celles du compte épargne)
              let updatedYearBudget = budget;
              
              for (const t of relatedTransactions) {
                if (!t.fromSavingsAccount) {
                  const reversedTransaction: Transaction = {
                    ...t,
                    type: t.type === 'expense' ? 'income' : 'expense'
                  };
                  
                  updatedYearBudget = getUpdatedBudgetForTransaction(
                    updatedYearBudget, 
                    reversedTransaction
                  );
                }
              }
              
              // Filtrer pour supprimer les transactions liées
              const filteredTransactions = budget.transactions.filter(t => !t.id.startsWith(baseId));
              
              // Mettre à jour le budget pour cette année
              updatedBudgets[key] = {
                ...updatedYearBudget,
                transactions: filteredTransactions
              };
            }
          }
        });
      }
      
      return {
        ...prev,
        budgets: updatedBudgets
      };
    });
  };

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
};
