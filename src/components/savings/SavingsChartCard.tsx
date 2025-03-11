
import { MonthlyBudget } from "@/types/finance";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface SavingsChartCardProps {
  budget: MonthlyBudget;
}

interface ChartDataItem {
  name: string;
  saving: number;
  balance: number;
}

const getMonthName = (monthIndex: number): string => {
  const months = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
  ];
  return months[monthIndex];
};

export const SavingsChartCard = ({ budget }: SavingsChartCardProps) => {
  // Generate data for the past 6 months (simulated)
  const generateMonthlyData = (): ChartDataItem[] => {
    const currentMonth = budget.month;
    const currentYear = budget.year;
    const data = [];
    
    let previousBalance = budget.initialBalance - 3 * budget.monthlySavings;
    
    for (let i = 5; i >= 0; i--) {
      let monthIndex = currentMonth - i;
      let year = currentYear;
      
      if (monthIndex < 0) {
        monthIndex += 12;
        year -= 1;
      }
      
      const monthName = getMonthName(monthIndex);
      const saving = i === 0 ? budget.monthlySavings : Math.round(budget.monthlySavings * (0.8 + Math.random() * 0.4));
      previousBalance += saving;
      
      data.push({
        name: `${monthName} ${year}`,
        saving,
        balance: previousBalance
      });
    }
    
    return data;
  };
  
  const data = generateMonthlyData();

  return (
    <div className="glass-card rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Évolution de l'épargne</h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value) => 
                new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                }).format(Number(value))
              }
            />
            <Area
              type="monotone"
              dataKey="saving"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Solde total estimé</h3>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Dans 1 an</span>
          <span className="font-medium">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(budget.initialBalance + budget.monthlySavings * 12)}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-700">Dans 5 ans</span>
          <span className="font-medium">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(budget.initialBalance + budget.monthlySavings * 60)}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-700">Dans 10 ans</span>
          <span className="font-medium">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(budget.initialBalance + budget.monthlySavings * 120)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SavingsChartCard;
