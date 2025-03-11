
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Function to calculate future value with compound interest
export function calculateFutureValue(
  principal: number,
  rate: number,
  time: number,
  frequency: "monthly" | "annually" = "annually"
): number {
  // Convert annual rate to decimal
  const r = rate / 100;
  
  // Adjust for compounding frequency
  const n = frequency === "monthly" ? 12 : 1;
  
  // Calculate future value: P(1 + r/n)^(nt)
  return principal * Math.pow(1 + r / n, n * time);
}

// Fonction pour formater les libellés d'axe du graphique - limite le nombre de caractères et ajoute ... si nécessaire
export function truncateLabel(value: string, maxLength: number = 15): string {
  if (!value) return "";
  return value.length > maxLength ? value.substring(0, maxLength) + "..." : value;
}
