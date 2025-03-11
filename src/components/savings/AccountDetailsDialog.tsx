
import { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from "recharts";
import { format, addMonths, getMonth, getYear } from "date-fns";
import { fr } from "date-fns/locale";
import { useFinance } from "@/contexts/finance";
import { SavingsAccount } from "@/types/finance";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { calculateFutureValue, formatEuro } from "@/lib/utils";

interface AccountDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SavingsAccount;
}

export function AccountDetailsDialog({
  open,
  onOpenChange,
  account
}: AccountDetailsDialogProps) {
  const { getCurrentBudget, getMonthlyBudgets } = useFinance();
  const [forecastData, setForecastData] = useState<Array<any>>([]);
  const [forecastRange, setForecastRange] = useState<"1year" | "5years" | "10years">("1year");
  const [isLoading, setIsLoading] = useState(true);
  const [predictedValues, setPredictedValues] = useState({
    oneYear: 0,
    fiveYears: 0,
    tenYears: 0
  });
  
  // Generate forecast data when account or forecast range changes
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      generateForecastData();
    }
  }, [open, account, forecastRange]);
  
  const generateForecastData = () => {
    // Toujours générer des données pour 10 ans, quelle que soit la période affichée
    const maxYears = 10;
    const monthlyBudgets = getMonthlyBudgets();
    const currentBudget = getCurrentBudget();
    
    // Use current date instead of budget date to ensure accurate forecasting
    const currentDate = new Date();
    
    let data = [];
    let previousBalance = account.currentBalance;
    
    // Get monthly distributions for the account
    for (let i = 0; i <= maxYears * 12; i++) {
      const date = addMonths(currentDate, i);
      const month = format(date, "yyyy-MM");
      
      // Format month - simplify to quarterly display for longer timeframes
      let formattedMonth;
      if (forecastRange === "10years" || forecastRange === "5years") {
        if (i % 3 === 0) {
          formattedMonth = format(date, "MMM yyyy", { locale: fr });
        } else {
          formattedMonth = "";
        }
      } else {
        formattedMonth = format(date, "MMM yyyy", { locale: fr });
      }
      
      // Distribution for that month (but only starting from the current month)
      const distribution = i === 0 ? 0 : getFutureDistributedSavings(monthlyBudgets, month, account.id);
      
      // Calculate interest based on frequency
      let interest = 0;
      if (account.interestFrequency === "monthly" || 
          (account.interestFrequency === "annually" && getMonth(date) === 11)) {
        
        const months = account.interestFrequency === "monthly" ? 1 : 12;
        const rate = account.interestRate / 100 / (account.interestFrequency === "monthly" ? 12 : 1);
        interest = previousBalance * rate;
      }
      
      const newBalance = previousBalance + distribution + interest;
      
      data.push({
        month: formattedMonth,
        fullDate: date.toISOString(),
        balance: newBalance,
        distribution,
        interest,
        previousBalance,
        // Pour l'affichage des trimestres/années
        isQuarterEnd: getMonth(date) % 3 === 2,
        isYearEnd: getMonth(date) === 11
      });
      
      previousBalance = newBalance;
      
      // Stocker les valeurs prédites à 1, 5 et 10 ans
      if (i === 12) {
        setPredictedValues(prev => ({ ...prev, oneYear: newBalance }));
      } else if (i === 60) {
        setPredictedValues(prev => ({ ...prev, fiveYears: newBalance }));
      } else if (i === 120) {
        setPredictedValues(prev => ({ ...prev, tenYears: newBalance }));
      }
    }
    
    // Filtrer les données selon la période sélectionnée pour l'affichage du graphique
    let filteredData;
    if (forecastRange === "1year") {
      filteredData = data.slice(0, 13); // jusqu'à 1 an (inclus le mois actuel)
    } else if (forecastRange === "5years") {
      filteredData = data.slice(0, 61); // jusqu'à 5 ans
    } else {
      filteredData = data; // Toutes les données (10 ans)
    }
    
    setForecastData(filteredData);
    setIsLoading(false);
  };
  
  const getFutureDistributedSavings = (budgets: any[], month: string, accountId: string) => {
    // Find the budget for this month
    const budget = budgets.find(b => b.month === month);
    
    if (!budget || !budget.distributionPlan) return 0;
    
    // Find distribution for this account
    const distribution = budget.distributionPlan.find((d: any) => d.accountId === accountId);
    
    return distribution ? distribution.amount : 0;
  };
  
  // Function to get displayed data - reduce points for smoother curves
  const getChartData = () => {
    if (forecastRange === "1year") {
      return forecastData;
    }
    
    // For longer timeframes, reduce data points to smooth the curve
    const dataPointCount = forecastRange === "5years" ? 20 : 30;
    const step = Math.max(1, Math.floor(forecastData.length / dataPointCount));
    
    return forecastData.filter((_, index) => index % step === 0 || index === forecastData.length - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0 mb-3">
          <DialogTitle>Prévisions d'épargne: {account.name}</DialogTitle>
          <DialogDescription>
            Simulation de l'évolution du compte sur différentes périodes avec un taux d'intérêt de {account.interestRate}%
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          defaultValue="graph" 
          className="mt-0"
        >
          <div className="flex flex-col space-y-3 mb-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant={forecastRange === "1year" ? "default" : "outline"}
                onClick={() => setForecastRange("1year")}
                className="rounded-full"
              >
                1 an
              </Button>
              <Button 
                size="sm" 
                variant={forecastRange === "5years" ? "default" : "outline"} 
                onClick={() => setForecastRange("5years")}
                className="rounded-full"
              >
                5 ans
              </Button>
              <Button 
                size="sm" 
                variant={forecastRange === "10years" ? "default" : "outline"} 
                onClick={() => setForecastRange("10years")}
                className="rounded-full"
              >
                10 ans
              </Button>
            </div>
            
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="graph">Graphique</TabsTrigger>
              <TabsTrigger value="table">Détails</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="graph" className="pt-1 mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="text-sm text-green-700 dark:text-green-400 mb-1">Dans 1 an</div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {formatEuro(predictedValues.oneYear)}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="text-sm text-blue-700 dark:text-blue-400 mb-1">Dans 5 ans</div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {formatEuro(predictedValues.fiveYears)}
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                    <div className="text-sm text-purple-700 dark:text-purple-400 mb-1">Dans 10 ans</div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      {formatEuro(predictedValues.tenYears)}
                    </div>
                  </div>
                </div>
                  
                <div className="h-[300px] w-full bg-white dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800 mb-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getChartData()}
                      margin={{ top: 10, right: 25, left: 15, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(tick) => tick || ""}
                        stroke="#888"
                        tick={{ fill: '#666', fontSize: 10 }}
                        angle={forecastRange === "10years" ? -45 : 0}
                        textAnchor={forecastRange === "10years" ? "end" : "middle"}
                        height={45}
                        interval={forecastRange === "1year" ? 1 : "preserveStartEnd"}
                        minTickGap={30}
                        padding={{ left: 10, right: 10 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatEuro(value)} 
                        domain={['dataMin - 10', 'dataMax + 10']}
                        stroke="#888"
                        tick={{ fill: '#666', fontSize: 11 }}
                        width={75}
                      />
                      <Tooltip 
                        formatter={(value: any) => [formatEuro(value), "Solde"]}
                        labelFormatter={(label) => `${label || "Date"}`}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          padding: '8px 12px'
                        }}
                      />
                      <Legend verticalAlign="top" height={28} />
                      <ReferenceLine y={account.currentBalance} 
                        stroke="#ff7300" 
                        strokeDasharray="3 3" 
                        label={{ 
                          value: "Solde initial", 
                          fill: '#ff7300', 
                          position: 'insideBottomRight'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        name="Solde" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        activeDot={{ r: 5, fill: '#8884d8', stroke: '#fff' }} 
                        dot={false}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="table" className="pt-1 mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800 mb-3">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Mois</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Solde initial</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Distribution</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Intérêts</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Solde final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.map((item, index) => (
                      <tr key={index} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                        item.isYearEnd ? 'bg-blue-50/50 dark:bg-blue-900/10' : 
                        index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/10' : ''
                      }`}>
                        <td className="py-3 px-4 font-medium">
                          {format(new Date(item.fullDate), "MMM yyyy", { locale: fr })}
                        </td>
                        <td className="text-right py-3 px-4">{formatEuro(item.previousBalance)}</td>
                        <td className="text-right py-3 px-4 text-green-600 dark:text-green-400">
                          {item.distribution > 0 ? `+${formatEuro(item.distribution)}` : formatEuro(0)}
                        </td>
                        <td className="text-right py-3 px-4 text-blue-600 dark:text-blue-400">
                          {item.interest > 0 ? `+${formatEuro(item.interest)}` : formatEuro(0)}
                        </td>
                        <td className="text-right font-medium py-3 px-4">{formatEuro(item.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
