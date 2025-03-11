
import { useState } from "react";
import { MonthlyBudget, SavingsAccount } from "@/types/finance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/utils";
import { PiggyBank, ArrowRight, ChevronDown, Percent, AlertTriangle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AvailableSavingsCardProps {
  budget: MonthlyBudget;
  onTransfer: (account: SavingsAccount) => void;
  onDistributedTransfer: () => void;
  accounts: SavingsAccount[];
}

const AvailableSavingsCard = ({ 
  budget, 
  onTransfer,
  onDistributedTransfer,
  accounts 
}: AvailableSavingsCardProps) => {
  const [open, setOpen] = useState(false);
  
  // Ne montrer la carte que si des économies sont disponibles et pas encore mises de côté
  const hasSavingsToTransfer = budget.monthlySavings > 0 && budget.isSavingsSetAside && !budget.isSavingsTransferred;
  
  if (!hasSavingsToTransfer || accounts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800/50 dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <PiggyBank className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium">Épargne disponible à placer</h3>
              <p className="text-xl font-bold">{formatEuro(budget.monthlySavings)}</p>
            </div>
          </div>
          
          <div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button size="sm">
                  Placer l'épargne <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <div className="overflow-hidden rounded-md">
                  {/* Option de répartition automatique selon le plan */}
                  <div
                    className="flex items-center px-4 py-2 hover:bg-accent cursor-pointer"
                    onClick={() => {
                      onDistributedTransfer();
                      setOpen(false);
                    }}
                  >
                    <Percent className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Selon plan de répartition</span>
                  </div>
                  
                  {/* Séparateur visuel */}
                  <div className="border-t border-border my-1"></div>
                  
                  {/* Comptes individuels */}
                  <div className="px-4 py-1 text-xs text-muted-foreground">
                    Comptes spécifiques
                  </div>
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center px-4 py-2 hover:bg-accent cursor-pointer"
                      onClick={() => {
                        onTransfer(account);
                        setOpen(false);
                      }}
                    >
                      <PiggyBank className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                      <span>{account.name}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailableSavingsCard;
