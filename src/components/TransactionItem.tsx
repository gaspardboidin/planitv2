
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Transaction } from "@/types/finance";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useFinance } from "@/contexts/finance";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { fetchSavingsAccounts } from "@/services/savings";
import { format } from "date-fns";

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const { deleteTransaction } = useFinance();
  const [savingsAccountName, setSavingsAccountName] = useState("");
  
  useEffect(() => {
    if (transaction.fromSavingsAccount && transaction.savingsAccountId) {
      loadSavingsAccountName(transaction.savingsAccountId);
    }
  }, [transaction]);
  
  const loadSavingsAccountName = async (accountId: string) => {
    try {
      const accounts = await fetchSavingsAccounts();
      const account = accounts.find(acc => acc.id === accountId);
      if (account) {
        setSavingsAccountName(account.name);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des comptes d'épargne:", error);
    }
  };

  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(transaction.amount);

  // Improved date formatting with better error handling and normalization
  const formattedTime = (() => {
    try {
      // Ensure we're working with a proper Date object
      let transactionDate: Date;
      
      if (transaction.date instanceof Date) {
        transactionDate = transaction.date;
      } else if (typeof transaction.date === 'string') {
        transactionDate = new Date(transaction.date);
      } else if (transaction.date && typeof transaction.date === 'object') {
        // Safely convert any object to string for Date constructor
        try {
          // Check if the date object has a custom structure
          const dateObj = transaction.date as any;
          if (dateObj.value && typeof dateObj.value === 'object' && 'iso' in dateObj.value) {
            transactionDate = new Date(dateObj.value.iso);
          } else {
            // Use safer stringification approach for objects
            const dateStr = String(transaction.date);
            transactionDate = new Date(dateStr);
          }
        } catch (e) {
          console.warn("Failed to convert date object:", e);
          transactionDate = new Date();
        }
      } else {
        // Fallback to current date if no valid date found
        console.warn("Date format not recognized:", transaction.date);
        transactionDate = new Date();
      }
      
      // Verify the date is valid
      if (isNaN(transactionDate.getTime())) {
        console.warn("Date non valide après conversion:", transaction.date);
        return "Date inconnue";
      }
      
      // Normalize date to current timezone to avoid time shifts
      const now = new Date();
      const isSameDay = 
        transactionDate.getDate() === now.getDate() &&
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear();
      
      // Use more specific formatting for today's transactions
      if (isSameDay) {
        // Utiliser format de date-fns pour formater l'heure correctement
        return `aujourd'hui à ${format(transactionDate, 'HH:mm')}`;
      }
      
      return formatDistanceToNow(transactionDate, {
        addSuffix: true,
        locale: fr,
      });
    } catch (error) {
      console.error("Erreur de formatage de date:", error, transaction.date);
      return "Date inconnue";
    }
  })();

  return (
    <div className="py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 group">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-xs text-white">
            {transaction.description.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="ml-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-200">{transaction.description}</h4>
            {transaction.isYearlyRecurring && (
              <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                Annuel
              </Badge>
            )}
            {transaction.fromSavingsAccount && (
              <Badge variant="outline" className="text-xs bg-gray-100 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                Épargne {savingsAccountName ? `(${savingsAccountName})` : ''}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formattedTime} depuis {transaction.account}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span className={`font-medium ${transaction.type === 'expense' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
          {transaction.type === 'expense' ? '-' : '+'}{formattedAmount}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4 dark:text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 dark:bg-gray-800 dark:border-gray-700">
            <DropdownMenuItem onClick={() => deleteTransaction(transaction.id)} className="text-red-500 dark:text-red-400 dark:hover:bg-gray-700">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Supprimer</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TransactionItem;
