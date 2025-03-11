import { useState } from "react";
import { SavingsAccount } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Plus, Edit, Trash2, ArrowUpDown, BarChart3 } from "lucide-react";
import { formatEuro } from "@/lib/utils";
import AccountDialog from "./AccountDialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";

interface AccountListProps {
  accounts: SavingsAccount[];
  onAdd: (account: Omit<SavingsAccount, 'id'>) => void;
  onEdit: (account: SavingsAccount) => void;
  onDelete: (accountId: string) => void;
  onSelect: (account: SavingsAccount) => void;
  onViewDetails?: (account: SavingsAccount) => void;
  isLoading: boolean;
}

export function AccountList({
  accounts,
  onAdd,
  onEdit,
  onDelete,
  onSelect,
  onViewDetails,
  isLoading
}: AccountListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<SavingsAccount | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  
  const handleEdit = (account: SavingsAccount) => {
    setEditAccount(account);
  };
  
  // Modified handleSave to match AccountDialog's onSubmit prop expectation
  const handleSave = async (account: SavingsAccount) => {
    try {
      console.log("Tentative de sauvegarde du compte:", account);
      setIsAddingAccount(true);
      
      if (account.id) {
        console.log("Modification d'un compte existant");
        await onEdit(account);
        // Suppression du toast ici pour éviter le doublon
      } else {
        console.log("Création d'un nouveau compte");
        await onAdd(account as Omit<SavingsAccount, 'id'>);
        // Suppression du toast ici pour éviter le doublon
      }
      
      setEditAccount(null);
      setIsAddOpen(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde du compte",
        variant: "destructive"
      });
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    try {
      setDeletingAccountId(accountId);
      await onDelete(accountId);
    } finally {
      setDeletingAccountId(null);
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  };
  
  const getLiquidBalance = () => {
    return accounts
      .filter(account => account.isLiquid)
      .reduce((sum, account) => sum + account.currentBalance, 0);
  };

  // Group accounts by type
  const groupedAccounts = accounts.reduce((groups, account) => {
    const type = account.accountType;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as Record<string, SavingsAccount[]>);

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Comptes d'épargne</CardTitle>
        <Button 
          onClick={() => setIsAddOpen(true)}
          disabled={isAddingAccount}
        >
          {isAddingAccount ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Ajout en cours...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" /> 
              Ajouter un compte
            </>
          )}
        </Button>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Tous ({accounts.length})</TabsTrigger>
            <TabsTrigger value="liquid">Liquides uniquement</TabsTrigger>
            <TabsTrigger value="by-type">Par type</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(account => (
                <AccountCard 
                  key={account.id} 
                  account={account} 
                  onEdit={() => handleEdit(account)}
                  onDelete={() => handleDelete(account.id)}
                  onTransfer={() => onSelect(account)}
                  onViewDetails={onViewDetails ? () => onViewDetails(account) : undefined}
                  isDeleting={deletingAccountId === account.id}
                />
              ))}
            </div>
            
            {accounts.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                Aucun compte d'épargne. Ajoutez-en un pour commencer.
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                <LoadingSpinner size="lg" className="mb-2" />
                <p>Chargement des comptes...</p>
              </div>
            )}
            
            {accounts.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg flex-1">
                  <div className="text-sm text-purple-700 dark:text-purple-300">Épargne totale</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                    {formatEuro(getTotalBalance())}
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg flex-1">
                  <div className="text-sm text-blue-700 dark:text-blue-300">Épargne liquide</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                    {formatEuro(getLiquidBalance())}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="liquid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts
                .filter(account => account.isLiquid)
                .map(account => (
                  <AccountCard 
                    key={account.id} 
                    account={account} 
                    onEdit={() => handleEdit(account)}
                    onDelete={() => handleDelete(account.id)}
                    onTransfer={() => onSelect(account)}
                    onViewDetails={onViewDetails ? () => onViewDetails(account) : undefined}
                    isDeleting={deletingAccountId === account.id}
                  />
                ))
              }
            </div>
            
            {accounts.filter(a => a.isLiquid).length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                Aucun compte d'épargne liquide.
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                <LoadingSpinner size="lg" className="mb-2" />
                <p>Chargement des comptes...</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="by-type">
            {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
              <div key={type} className="mb-6">
                <h3 className="text-lg font-semibold mb-3">{type}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeAccounts.map(account => (
                    <AccountCard 
                      key={account.id} 
                      account={account} 
                      onEdit={() => handleEdit(account)}
                      onDelete={() => handleDelete(account.id)}
                      onTransfer={() => onSelect(account)}
                      onViewDetails={onViewDetails ? () => onViewDetails(account) : undefined}
                      isDeleting={deletingAccountId === account.id}
                    />
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(groupedAccounts).length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                Aucun compte d'épargne.
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                <LoadingSpinner size="lg" className="mb-2" />
                <p>Chargement des comptes...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <AccountDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen}
        onSubmit={handleSave}
        title="Ajouter un compte d'épargne"
      />
      
      {editAccount && (
        <AccountDialog 
          open={!!editAccount} 
          onOpenChange={() => setEditAccount(null)}
          account={editAccount}
          onSubmit={handleSave}
          title="Modifier le compte d'épargne"
        />
      )}
    </Card>
  );
}

interface AccountCardProps {
  account: SavingsAccount;
  onEdit: () => void;
  onDelete: () => void;
  onTransfer: () => void;
  onViewDetails?: () => void;
  isDeleting?: boolean;
}

const AccountCard = ({ account, onEdit, onDelete, onTransfer, onViewDetails, isDeleting }: AccountCardProps) => {
  return (
    <Card className="overflow-hidden border border-gray-700/50 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)]">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-[#252530] dark:to-[#2a2a35] p-4">
        <div className="font-semibold text-lg dark:text-gray-200">{account.name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{account.accountType}</div>
        <div className="mt-2 text-2xl font-bold dark:text-gray-100">
          {formatEuro(account.currentBalance)}
        </div>
      </div>
      
      <div className="p-4 pt-2">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="text-gray-500 dark:text-gray-400">Taux d'intérêt</div>
          <div className="font-medium dark:text-gray-300">{account.interestRate}%</div>
        </div>
        
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="text-gray-500 dark:text-gray-400">Fréquence</div>
          <div className="font-medium dark:text-gray-300">
            {account.interestFrequency === "annually" ? "Annuel" : "Mensuel"}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="text-gray-500 dark:text-gray-400">Disponibilité</div>
          <div className={`font-medium ${account.isLiquid ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
            {account.isLiquid ? "Liquide" : "Non-liquide"}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={onEdit} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <Edit className="h-3.5 w-3.5 mr-1" /> Modifier
          </Button>
          <Button variant="outline" size="sm" onClick={onTransfer} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" /> Transférer
          </Button>
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <BarChart3 className="h-3.5 w-3.5 mr-1" /> Prévisions
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDelete} 
            disabled={isDeleting}
            className="text-destructive hover:text-destructive dark:text-red-400 dark:hover:bg-gray-800 ml-auto"
          >
            {isDeleting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
