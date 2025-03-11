
import { ChartBar, PiggyBank, LayoutDashboard } from "lucide-react";

export const ROUTES = [
  { path: "/dashboard", name: "Dashboard", icon: <LayoutDashboard className="w-5 h-5 mr-2" /> },
  { path: "/budget", name: "Budget", icon: <ChartBar className="w-5 h-5 mr-2" /> },
  { path: "/savings", name: "Épargne", icon: <PiggyBank className="w-5 h-5 mr-2" /> },
];
