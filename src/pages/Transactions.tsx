
import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/finance';
import TransactionItem from '@/components/TransactionItem';
import AddTransactionForm from '@/components/AddTransactionForm';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const Transactions = () => {
  const { getMonthlyBudgets } = useFinance();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [budgets, setBudgets] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  // Formater un mois pour l'affichage
  const formatMonthYear = (month, year) => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[month]} ${year}`;
  };

  // Charger les budgets au chargement de la page
  useEffect(() => {
    const monthlyBudgets = getMonthlyBudgets();
    setBudgets(monthlyBudgets);
    
    // Extraire toutes les transactions
    const transactions = monthlyBudgets.flatMap(budget => {
      return (budget.transactions || []).map(transaction => ({
        ...transaction,
        monthYear: formatMonthYear(budget.month, budget.year),
        budgetKey: `${budget.month}-${budget.year}`
      }));
    });
    
    setAllTransactions(transactions);
    setFilteredTransactions(transactions);
    
    // Sélectionner le mois courant par défaut
    const currentDate = new Date();
    const currentKey = `${currentDate.getMonth()}-${currentDate.getFullYear()}`;
    setSelectedMonth(currentKey);
  }, [getMonthlyBudgets]);

  // Filtrer les transactions en fonction des critères
  useEffect(() => {
    let filtered = [...allTransactions];
    
    // Filtre par mois si un mois est sélectionné
    if (selectedMonth && selectedMonth !== "all") {
      filtered = filtered.filter(t => t.budgetKey === selectedMonth);
    }
    
    // Filtre par recherche
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredTransactions(filtered);
  }, [searchQuery, selectedMonth, allTransactions]);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="my-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Gérez vos transactions financières</p>
        </div>
        <AddTransactionForm />
      </div>
      
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Rechercher un libellé..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-64">
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un mois" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mois</SelectItem>
              {budgets.map(budget => (
                <SelectItem key={`${budget.month}-${budget.year}`} value={`${budget.month}-${budget.year}`}>
                  {formatMonthYear(budget.month, budget.year)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="glass-card rounded-lg p-6 shadow-sm">
        <div className="space-y-2">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TransactionItem 
                key={transaction.id} 
                transaction={transaction} 
              />
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              {searchQuery || selectedMonth !== "all" 
                ? "Aucune transaction ne correspond à vos critères" 
                : "Aucune transaction trouvée"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
