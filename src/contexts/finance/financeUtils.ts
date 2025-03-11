
import { MonthlyBudget, Transaction, FixedIncome, FixedExpense, SavingsAccount } from '@/types/finance';

export const getTotalFixedIncomesUtil = (budget: MonthlyBudget, excludeReceived: boolean = false): number => {
  return budget.fixedIncomes.reduce((sum, income) => {
    // Si on exclut les revenus reçus et que ce revenu est reçu, ne pas l'ajouter
    if (excludeReceived && income.isReceived) {
      return sum;
    }
    return sum + income.amount;
  }, 0);
};

export const getTotalFixedExpensesUtil = (budget: MonthlyBudget, excludePaid: boolean = false): number => {
  return budget.fixedExpenses.reduce((sum, expense) => {
    // Si on exclut les dépenses payées et que cette dépense est payée, ne pas l'ajouter
    if (excludePaid && expense.isPaid) {
      return sum; // Correction ici: ne pas ajouter la dépense si elle est payée
    }
    return sum + expense.amount;
  }, 0);
};

export const getTotalTransactionsUtil = (budget: MonthlyBudget): number => {
  // Calcule le total des transactions en considérant correctement le type 
  // (revenus comme positifs et dépenses comme négatifs)
  return budget.transactions.reduce((sum, transaction) => {
    // Ignorer les transactions provenant de l'épargne car elles n'affectent pas le solde restant
    if (transaction.fromSavingsAccount) {
      return sum;
    }
    
    if (transaction.type === 'expense') {
      return sum - transaction.amount;
    }
    return sum + transaction.amount;
  }, 0);
};

export const getUpdatedBudgetForTransaction = (
  currentBudget: MonthlyBudget, 
  newTransaction: Transaction, 
  oldTransaction?: Transaction
): MonthlyBudget => {
  let balanceDifference = 0;
  
  // Ignorer les transactions provenant de l'épargne
  if (newTransaction.fromSavingsAccount) {
    return currentBudget;
  }
  
  // Calculate difference if updating an existing transaction
  if (oldTransaction) {
    // Ignorer l'ancienne transaction si elle provenait de l'épargne
    if (!oldTransaction.fromSavingsAccount) {
      if (oldTransaction.type === 'expense') {
        balanceDifference += oldTransaction.amount;
      } else {
        balanceDifference -= oldTransaction.amount;
      }
    }
  }
  
  // Add effect of new transaction
  if (newTransaction.type === 'expense') {
    balanceDifference -= newTransaction.amount;
  } else {
    balanceDifference += newTransaction.amount;
  }
  
  return {
    ...currentBudget,
    remainingBalance: currentBudget.remainingBalance + balanceDifference
  };
};

export const getUpdatedBudgetForFixedIncome = (
  currentBudget: MonthlyBudget,
  income: FixedIncome,
  oldIncome?: FixedIncome
): MonthlyBudget => {
  const oldAmount = oldIncome ? oldIncome.amount : 0;
  const oldIsReceived = oldIncome ? !!oldIncome.isReceived : false;
  
  let difference = income.amount - oldAmount;
  
  // Si le revenu est maintenant marqué comme reçu et ne l'était pas avant
  // Soustrayez le montant complet (car il n'affectera plus le solde)
  if (income.isReceived && !oldIsReceived) {
    difference -= income.amount;
  }
  
  // Si le revenu était reçu avant mais ne l'est plus maintenant
  // Ajoutez le montant complet (car il affectera maintenant le solde)
  if (!income.isReceived && oldIsReceived) {
    difference += income.amount;
  }
  
  return {
    ...currentBudget,
    remainingBalance: currentBudget.remainingBalance + difference
  };
};

export const getUpdatedBudgetForFixedExpense = (
  currentBudget: MonthlyBudget,
  expense: FixedExpense,
  oldExpense?: FixedExpense
): MonthlyBudget => {
  const oldAmount = oldExpense ? oldExpense.amount : 0;
  const oldIsPaid = oldExpense ? !!oldExpense.isPaid : false;
  
  // Si l'état payé a changé ET que la dépense est maintenant payée
  // N'ajoutez pas cette dépense au calcul du solde restant
  let difference = oldAmount - expense.amount; // Inversé car les dépenses réduisent le solde
  
  // Si la dépense est maintenant marquée comme payée et ne l'était pas avant
  // Ajoutez le montant complet (car il n'affectera plus le solde)
  if (expense.isPaid && !oldIsPaid) {
    difference += expense.amount;
  }
  
  // Si la dépense était payée avant mais ne l'est plus maintenant
  // Soustrayez le montant complet (car il affectera maintenant le solde)
  if (!expense.isPaid && oldIsPaid) {
    difference -= expense.amount;
  }
  
  return {
    ...currentBudget,
    remainingBalance: currentBudget.remainingBalance + difference
  };
};

// Calculate the future balance of a savings account based on monthly savings and interest
export const calculateFutureBalance = (
  account: SavingsAccount,
  budgets: Record<string, MonthlyBudget>,
  startMonth: number,
  startYear: number,
  targetMonth: number,
  targetYear: number
): number => {
  // If target date is not in the future, return current balance
  const startDate = new Date(startYear, startMonth, 1);
  const targetDate = new Date(targetYear, targetMonth, 1);
  
  if (targetDate <= startDate) {
    return account.currentBalance;
  }
  
  // Start with current balance
  let futureBalance = account.currentBalance;
  const monthlyInterestRate = account.interestRate / 100 / 12; // Monthly interest rate
  
  // Create date objects for iteration
  const currentDate = new Date(startYear, startMonth, 1);
  
  // Loop through each month from start to target
  while (currentDate <= targetDate) {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const budgetKey = `${month}-${year}`;
    
    // Apply interest for this month
    const interestAmount = futureBalance * monthlyInterestRate;
    futureBalance += interestAmount;
    
    // Add monthly savings if there's a budget for this month
    if (budgets[budgetKey]) {
      futureBalance += budgets[budgetKey].monthlySavings;
    }
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return futureBalance;
};

// Fonction améliorée pour propager les changements aux mois futurs
export const propagateFixedItemsToFutureMonths = (
  state: any,
  currentMonth: number,
  currentYear: number,
  updateFunction: (budgetKey: string, item: FixedIncome | FixedExpense) => void,
  item: FixedIncome | FixedExpense,
  isRemove: boolean = false
) => {
  const currentDate = new Date(currentYear, currentMonth, 1);
  
  // Parcourir tous les budgets existants
  Object.keys(state.budgets).forEach(budgetKey => {
    const [month, year] = budgetKey.split('-').map(Number);
    const budgetDate = new Date(year, month, 1);
    
    // Seulement propager aux mois futurs (comparés au mois actuel)
    if (budgetDate > currentDate) {
      if (isRemove) {
        // Pour la suppression, on supprime l'élément avec cet ID des mois futurs
        updateFunction(budgetKey, item);
      } else {
        // Pour l'ajout/mise à jour, on copie l'élément (sans cocher) aux mois futurs
        const resetItem = { 
          ...item, 
          // Réinitialiser l'état "reçu/payé" pour les mois futurs
          isReceived: false,
          isPaid: false
        };
        updateFunction(budgetKey, resetItem);
      }
    }
  });
  
  // Si on est en train d'ajouter ou de modifier (pas de supprimer),
  // vérifier qu'il y a au moins un mois futur existant
  if (!isRemove) {
    let futureBudgetExists = false;
    
    // Vérifier si des budgets futurs existent déjà
    Object.keys(state.budgets).forEach(budgetKey => {
      const [month, year] = budgetKey.split('-').map(Number);
      const budgetDate = new Date(year, month, 1);
      
      if (budgetDate > currentDate) {
        futureBudgetExists = true;
      }
    });
    
    // Si aucun budget futur n'existe, créer les budgets pour les 3 prochains mois
    if (!futureBudgetExists) {
      for (let i = 1; i <= 3; i++) {
        let nextDate = new Date(currentYear, currentMonth + i, 1);
        let nextMonth = nextDate.getMonth();
        let nextYear = nextDate.getFullYear();
        let nextBudgetKey = `${nextMonth}-${nextYear}`;
        
        // Si ce budget n'existe pas déjà, l'initialiser avec les valeurs par défaut
        if (!state.budgets[nextBudgetKey]) {
          state.budgets[nextBudgetKey] = {
            month: nextMonth,
            year: nextYear,
            initialBalance: 0,
            remainingBalance: 0,
            monthlySavings: 0,
            isSavingsSetAside: false,
            fixedIncomes: [],
            fixedExpenses: [],
            transactions: []
          };
        }
        
        // Ajouter l'élément à ce nouveau mois
        const resetItem = { 
          ...item, 
          isReceived: false,
          isPaid: false
        };
        updateFunction(nextBudgetKey, resetItem);
      }
    }
  }
};
