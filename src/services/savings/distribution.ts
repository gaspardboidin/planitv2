import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { SavingsAccount } from "@/types/finance";
import { Json } from "@/integrations/supabase/types";

// Représente la structure d'une ligne dans la table `savings_distribution_plans`
export interface SavingsDistributionPlansRow {
  id: string;
  user_id: string;
  month: number;
  year: number;
  distribution: Json;
  updated_at?: string;
}

export interface SavingsDistribution {
  accountId: string;
  percentage: number;
}

export interface SavingsDistributionPlan {
  month: number;
  year: number;
  distribution: SavingsDistribution[];
}

// Convertir SavingsDistribution[] en Json
export const distributionToJson = (distribution: SavingsDistribution[]): Json => {
  return distribution as unknown as Json;
};

// Convertir Json en SavingsDistribution[]
export const jsonToDistribution = (json: Json): SavingsDistribution[] => {
  return json as unknown as SavingsDistribution[];
};

export const saveSavingsDistributionPlan = async (
  plan: SavingsDistributionPlan
): Promise<boolean> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    
    if (!userId) {
      console.error("No user ID found, saving to localStorage as fallback");
      const planKey = `savings_plan_${plan.month}_${plan.year}`;
      localStorage.setItem(planKey, JSON.stringify(plan));
      return true;
    }

    // Vérifie si un plan existe déjà pour ce mois/année
    const { data: existingPlan } = await supabase
      .from("savings_distribution_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("month", plan.month)
      .eq("year", plan.year)
      .maybeSingle();
    
    if (existingPlan) {
      // Mise à jour d'un plan existant
      const { error } = await supabase
        .from("savings_distribution_plans")
        .update({ 
          distribution: distributionToJson(plan.distribution),
          updated_at: new Date().toISOString()
        })
        .eq("id", existingPlan.id);
      
      if (error) {
        console.error("Error updating savings distribution plan:", error);
        return false;
      }
    } else {
      // Insertion d'un nouveau plan
      const { error } = await supabase
        .from("savings_distribution_plans")
        .insert({
          user_id: userId,
          month: plan.month,
          year: plan.year,
          distribution: distributionToJson(plan.distribution)
        });
      
      if (error) {
        console.error("Error saving savings distribution plan:", error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error saving savings distribution plan:", error);
    // Fallback en localStorage
    try {
      const planKey = `savings_plan_${plan.month}_${plan.year}`;
      localStorage.setItem(planKey, JSON.stringify(plan));
      return true;
    } catch (localStorageError) {
      console.error("Error saving to localStorage:", localStorageError);
      return false;
    }
  }
};

export const getSavingsDistributionPlan = async (
  month: number,
  year: number
): Promise<SavingsDistributionPlan | null> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    
    if (!userId) {
      console.warn("No user ID found, using localStorage as fallback");
      return getLocalStoragePlan(month, year);
    }
    
    const { data, error } = await supabase
      .from("savings_distribution_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching savings distribution plan:", error);
      return getLocalStoragePlan(month, year);
    }
    
    if (data) {
      return {
        month,
        year,
        distribution: jsonToDistribution(data.distribution)
      };
    }
    
    // Si aucun plan pour ce mois, on tente un plan précédent
    const previousPlan = await getPreviousPlanFromDatabase(userId, month, year);
    if (previousPlan) {
      return {
        month,
        year,
        distribution: jsonToDistribution(previousPlan.distribution)
      };
    }
    
    return getLocalStoragePlan(month, year);
  } catch (error) {
    console.error("Error getting savings distribution plan:", error);
    return getLocalStoragePlan(month, year);
  }
};

const getLocalStoragePlan = async (
  month: number,
  year: number
): Promise<SavingsDistributionPlan | null> => {
  try {
    const planKey = `savings_plan_${month}_${year}`;
    const storedPlan = localStorage.getItem(planKey);
    
    if (storedPlan) {
      return JSON.parse(storedPlan) as SavingsDistributionPlan;
    }
    
    // Rechercher un plan précédent dans localStorage
    const currentDate = new Date(year, month, 1);
    for (let i = 1; i <= 12; i++) {
      const prevDate = new Date(currentDate);
      prevDate.setMonth(prevDate.getMonth() - i);
      
      const prevMonth = prevDate.getMonth();
      const prevYear = prevDate.getFullYear();
      const prevPlanKey = `savings_plan_${prevMonth}_${prevYear}`;
      const prevStoredPlan = localStorage.getItem(prevPlanKey);
      
      if (prevStoredPlan) {
        const prevPlan = JSON.parse(prevStoredPlan) as SavingsDistributionPlan;
        const newPlan = {
          month,
          year,
          distribution: prevPlan.distribution
        };
        return newPlan;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in getLocalStoragePlan:", error);
    return null;
  }
};

// Remplace `any | null` par `SavingsDistributionPlansRow | null`
export const getPreviousPlanFromDatabase = async (
  userId: string,
  month: number,
  year: number
): Promise<SavingsDistributionPlansRow | null> => {
  try {
    const dates = [];
    const currentDate = new Date(year, month, 1);
    
    for (let i = 1; i <= 12; i++) {
      const prevDate = new Date(currentDate);
      prevDate.setMonth(prevDate.getMonth() - i);
      dates.push({
        month: prevDate.getMonth(),
        year: prevDate.getFullYear()
      });
    }
    
    for (const date of dates) {
      const { data, error } = await supabase
        .from("savings_distribution_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("month", date.month)
        .eq("year", date.year)
        .maybeSingle();
      
      if (!error && data) {
        return data as SavingsDistributionPlansRow;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in getPreviousPlanFromDatabase:", error);
    return null;
  }
};

export const deleteAllSavingsDistributionPlans = async (): Promise<boolean> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    
    if (userId) {
      const { error } = await supabase
        .from("savings_distribution_plans")
        .delete()
        .eq("user_id", userId);
      
      if (error) {
        console.error("Error deleting savings distribution plans from database:", error);
      } else {
        console.log("All savings distribution plans deleted from database");
      }
    }
    
    const keys = Object.keys(localStorage);
    const planKeys = keys.filter(key => key.startsWith('savings_plan_'));
    
    planKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Deleted ${planKeys.length} savings distribution plans from localStorage`);
    return true;
  } catch (error) {
    console.error("Error deleting savings distribution plans:", error);
    return false;
  }
};

export const getFutureDistributedSavings = async (
  account: SavingsAccount,
  currentBalance: number,
  currentMonth: number,
  currentYear: number,
  targetMonth: number,
  targetYear: number,
  monthlySavings: number,
  allAccounts: SavingsAccount[] = []
): Promise<number> => {
  try {
    console.log(`Calculating future distributed savings for ${account.name}:`, {
      currentBalance,
      currentMonth, 
      currentYear,
      targetMonth,
      targetYear,
      monthlySavings
    });
    
    let futureBalance = currentBalance;
    const currentDate = new Date(currentYear, currentMonth, 1);
    const targetDate = new Date(targetYear, targetMonth, 1);
    
    if (targetDate < currentDate) {
      return futureBalance;
    }
    
    const interestFrequency = account.interestFrequency;
    const interestType = account.interestType;
    const interestRate = account.interestRate;
    let effectiveMonthlyRate = 0;
    
    if (interestFrequency === "monthly") {
      effectiveMonthlyRate = interestRate / 100 / 12;
    } else {
      effectiveMonthlyRate = 0;
    }
    
    const plan = await getSavingsDistributionPlan(targetMonth, targetYear);
    let accountSavings = 0;
    
    if (plan && plan.distribution && plan.distribution.length > 0) {
      const accountDistribution = plan.distribution.find(
        item => item.accountId === account.id
      );
      
      if (accountDistribution) {
        accountSavings = (monthlySavings * accountDistribution.percentage) / 100;
        console.log(`Account ${account.name} has distribution: ${accountDistribution.percentage}%, amount: ${accountSavings}`);
      } else {
        console.log(`Account ${account.name} has no distribution in plan`);
      }
    } else {
      const isMainAccount = 
        account.accountType === "Livret A" || 
        account.accountType === "LEP" || 
        account.accountType === "LDDS";
      
      if (isMainAccount) {
        const otherMainAccounts = allAccounts.filter(a => 
          (a.accountType === "Livret A" || a.accountType === "LEP" || a.accountType === "LDDS") &&
          a.id !== account.id
        );
        
        const hasHigherInterestMainAccount = otherMainAccounts.some(a => 
          a.interestRate > account.interestRate
        );
        
        if (!hasHigherInterestMainAccount) {
          accountSavings = monthlySavings;
          console.log(`Account ${account.name} receives all savings as default account: ${accountSavings}`);
        }
      } else if (allAccounts.length === 1) {
        accountSavings = monthlySavings;
        console.log(`Account ${account.name} receives all savings as only account: ${accountSavings}`);
      }
    }
    
    let interestAmount = 0;
    if (interestFrequency === "monthly") {
      interestAmount = futureBalance * effectiveMonthlyRate;
    } else if (interestFrequency === "annually" && targetMonth === 11) {
      interestAmount = futureBalance * (interestRate / 100);
    }
    
    console.log(`Account ${account.name} interest: ${interestAmount} (${interestFrequency})`);
    futureBalance += interestAmount + accountSavings;
    console.log(`Final future balance for ${account.name}: ${futureBalance}`);
    
    return futureBalance;
  } catch (error) {
    console.error("Error calculating future distributed savings:", error);
    return currentBalance;
  }
};
