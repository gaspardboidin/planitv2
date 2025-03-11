import { useState, useEffect } from "react";
import { SavingsAccount } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { toast } from "@/components/ui/use-toast";
import { PiggyBank, Plus, Percent, BarChart3, Database, Save } from "lucide-react";
import { formatEuro } from "@/lib/utils";
import { useFinance } from "@/contexts/finance";
import { saveSavingsDistributionPlan, getSavingsDistributionPlan } from "@/services/savings";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// -------------------------
// Types
// -------------------------
interface Budget {
  monthlySavings: number;
  // Ajoutez d'autres champs si nécessaire, par ex. initialBalance, remainingBalance...
}

interface DistributionItem {
  accountId: string;
  percentage: number;
  accountName: string;
}

interface ChartItem {
  name: string;
  value: number;
  amount: number;
}

interface SavingsDistributionPlanProps {
  accounts: SavingsAccount[];
  budget: Budget; // Remplacez "any" par le type Budget
}

// Couleurs en niveaux de gris pour correspondre au thème
const COLORS = ['#4A4A4A', '#6E6E6E', '#8F8F8F', '#ADADAD', '#C8C8C8', '#E0E0E0'];

// -------------------------
// Composant principal
// -------------------------
const SavingsDistributionPlan = ({ accounts, budget }: SavingsDistributionPlanProps) => {
  const { state } = useFinance();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [storageType, setStorageType] = useState<'database' | 'localStorage'>(
    user ? 'database' : 'localStorage'
  );

  // Charger le plan de répartition quand currentMonth, currentYear ou user changent
  useEffect(() => {
    if (!user) {
      console.log("User is null, skippink loadDistribution");
      return;
    }
    console.log("User is defined, calling loadDistribution")
    loadDistribution();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentMonth, state.currentYear, user, accounts]);

  useEffect(() => {
    // Mettre à jour le mode de stockage en fonction de l'état d'authentification
    setStorageType(user ? 'database' : 'localStorage');
  }, [user]);

  useEffect(() => {
    // Calculer le pourcentage total et préparer les données pour le graphique
    const total = distribution.reduce((sum, item) => sum + item.percentage, 0);
    setTotalPercentage(total);

    const data = distribution.map((item) => {
      const account = accounts.find(acc => acc.id === item.accountId);
      return {
        name: account?.name || item.accountName,
        value: item.percentage,
        amount: (budget.monthlySavings * item.percentage) / 100
      };
    });
    setChartData(data);
  }, [distribution, accounts, budget.monthlySavings]);

  // Fonction pour charger la distribution depuis la base ou le fallback
  const loadDistribution = async () => {
    try {
      setIsLoading(true);
      console.log("Chargement des comptes d'épargne...");
      const plan = await getSavingsDistributionPlan(state.currentMonth, state.currentYear);
      console.log("=== Debug plan ===");
      console.log("plan:", plan);

      
      if (plan && plan.distribution && plan.distribution.length > 0) {
        // Transformer les données pour ajouter le nom du compte
        const distributionWithNames = plan.distribution.map(
          (item: { accountId: string; percentage: number }) => {
            const account = accounts.find(acc => acc.id === item.accountId);
            return {
              ...item,
              accountName: account?.name || "Compte inconnu"
            };
          }
        );
        
        // Filtrer les items dont les comptes n'existent plus
        const validDistribution = distributionWithNames.filter(item => 
          accounts.some(acc => acc.id === item.accountId)
        );
        
        if (validDistribution.length !== distributionWithNames.length) {
          // Ajuster les pourcentages si certains comptes ont été retirés
          const remainingTotal = validDistribution.reduce((sum, item) => sum + item.percentage, 0);
          if (remainingTotal > 0 && remainingTotal < 100) {
            const scaleFactor = 100 / remainingTotal;
            validDistribution.forEach(item => {
              item.percentage = Math.round(item.percentage * scaleFactor);
            });
            const newTotal = validDistribution.reduce((sum, item) => sum + item.percentage, 0);
            if (newTotal !== 100 && validDistribution.length > 0) {
              const diff = 100 - newTotal;
              const largestAllocation = validDistribution.reduce(
                (prev, current) => prev.percentage > current.percentage ? prev : current
              );
              largestAllocation.percentage += diff;
            }
            // Enregistrer la distribution mise à jour
            await saveSavingsDistributionPlan({
              month: state.currentMonth,
              year: state.currentYear,
              distribution: validDistribution.map(({ accountId, percentage }) => ({
                accountId,
                percentage
              }))
            });
          }
        }
        
        setDistribution(validDistribution);
      } else {
        setDistribution([]);
      }
    } catch (error) {
      console.error("Error loading savings distribution plan:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le plan de répartition",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = () => {
    if (accounts.length === 0) {
      toast({
        title: "Aucun compte disponible",
        description: "Veuillez d'abord créer un compte d'épargne",
        variant: "destructive"
      });
      return;
    }
    const unusedAccounts = accounts.filter(
      account => !distribution.some(item => item.accountId === account.id)
    );
    if (unusedAccounts.length === 0) {
      toast({
        title: "Tous les comptes sont déjà inclus",
        description: "Tous vos comptes d'épargne sont déjà dans le plan",
        variant: "destructive"
      });
      return;
    }
    const firstUnusedAccount = unusedAccounts[0];
    setDistribution([
      ...distribution,
      {
        accountId: firstUnusedAccount.id,
        percentage: 0,
        accountName: firstUnusedAccount.name
      }
    ]);
  };

  const handleRemoveAccount = (index: number) => {
    const newDistribution = [...distribution];
    newDistribution.splice(index, 1);
    setDistribution(newDistribution);
  };

  const handleAccountChange = (index: number, accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    const newDistribution = [...distribution];
    newDistribution[index] = {
      ...newDistribution[index],
      accountId,
      accountName: account.name
    };
    setDistribution(newDistribution);
  };

  const handlePercentageChange = (index: number, value: string) => {
    const percentage = parseFloat(value);
    if (isNaN(percentage)) return;
    const newDistribution = [...distribution];
    newDistribution[index] = {
      ...newDistribution[index],
      percentage
    };
    setDistribution(newDistribution);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const dataToSave = distribution.map(({ accountId, percentage }) => ({
        accountId,
        percentage
      }));
      await saveSavingsDistributionPlan({
        month: state.currentMonth,
        year: state.currentYear,
        distribution: dataToSave
      });
      toast({
        title: "Plan d'épargne enregistré",
        description: `Votre plan de répartition a été enregistré avec succès${user ? ' dans la base de données' : ' localement'}`
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving savings distribution plan:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement du plan",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderDistribution = () => {
    if (distribution.length === 0) {
      return (
        <div className="py-6 text-center border border-dashed rounded-lg dark:border-gray-700/50">
          <PiggyBank className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">Aucune répartition définie</p>
          <Button variant="outline" onClick={handleAddAccount} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un compte
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {distribution.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Select value={item.accountId} onValueChange={(value) => handleAccountChange(index, value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner un compte" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem 
                    key={account.id} 
                    value={account.id}
                    disabled={distribution.some((d, i) => i !== index && d.accountId === account.id)}
                  >
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center">
              <Input
                type="number"
                min="0"
                max="100"
                value={item.percentage}
                onChange={(e) => handlePercentageChange(index, e.target.value)}
                className="w-20"
              />
              <Percent className="h-4 w-4 ml-1" />
            </div>
            <div className="text-sm ml-2 dark:text-gray-300">
              {formatEuro((budget.monthlySavings * item.percentage) / 100)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveAccount(index)}
              className="ml-auto text-destructive hover:text-destructive dark:text-red-400 dark:hover:text-red-300"
            >
              Retirer
            </Button>
          </div>
        ))}
        <div className="pt-2 flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={handleAddAccount} disabled={accounts.length === distribution.length}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un compte
          </Button>
          <div className={`font-semibold ${totalPercentage === 100 ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>
            Total: {totalPercentage}%
          </div>
        </div>
        {totalPercentage !== 100 && (
          <p className="text-sm text-orange-500 dark:text-orange-400">
            Le total doit être égal à 100% pour une répartition complète de votre épargne.
          </p>
        )}
      </div>
    );
  };

  const renderChart = () => {
    if (chartData.length === 0) return null;
    return (
      <div className="h-[300px] mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name, props) => [`${formatEuro(props.payload.amount)} (${value}%)`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-gray-200">Plan de répartition d'épargne</h2>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Gérer le plan
        </Button>
      </div>
      {distribution.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="dark:bg-gray-800/80 dark:border-gray-700/30 dark:text-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4 dark:text-gray-200">Répartition actuelle</h3>
              <div className="space-y-2">
                {distribution.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="dark:text-gray-200">{item.accountName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="dark:text-gray-200">{item.percentage}%</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatEuro((budget.monthlySavings * item.percentage) / 100)}
                      </span>
                    </div>
                  </div>
                ))}
                <Separator className="my-2 dark:bg-gray-700/60" />
                <div className="pt-2">
                  <div className="flex justify-between font-medium">
                    <span className="dark:text-gray-200">Total</span>
                    <span className="dark:text-gray-200">{formatEuro(budget.monthlySavings)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800/80 dark:border-gray-700/30">
            <CardContent className="p-6">
              {renderChart()}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="py-12 text-center border border-dashed rounded-lg dark:border-gray-700/40">
          <PiggyBank className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium mb-2 dark:text-gray-200">Aucun plan de répartition</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Définissez comment répartir votre épargne mensuelle entre vos différents comptes</p>
          <Button onClick={() => setIsOpen(true)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Créer un plan
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] dark:bg-gray-800 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-200">Plan de répartition d'épargne</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Définissez comment répartir votre épargne mensuelle ({formatEuro(budget.monthlySavings)}) entre vos différents comptes.
              {!user && (
                <div className="mt-2 text-amber-600 dark:text-amber-400 text-xs">
                  <p className="flex items-center gap-1">
                    <Database className="h-3 w-3" /> 
                    Connectez-vous pour sauvegarder vos plans dans la base de données.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {renderDistribution()}
            {distribution.length > 0 && renderChart()}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isLoading || (distribution.length > 0 && totalPercentage !== 100)}>
              {isLoading ? "Chargement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavingsDistributionPlan;
