
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/settings";
import { ROUTES } from "./constants";

type NavigationProps = {
  routes: Array<{
    path: string;
    name: string;
    icon: React.ReactNode;
  }>;
};

const Navigation = ({ routes }: NavigationProps) => {
  const { settings } = useSettings();

  return (
    <nav className="hidden md:flex items-center space-x-1">
      {routes.map((route) => (
        <NavLink
          key={route.path}
          to={route.path}
          className={({ isActive }) =>
            cn(
              "px-4 py-2 rounded-md transition-all duration-200 flex items-center",
              isActive
                ? "bg-secondary font-medium text-primary dark:bg-gray-800 dark:text-gray-200"
                : `${settings.theme === 'dark' ? 'text-gray-300 hover:bg-[#2a2a2e]' : 'text-gray-600 hover:bg-gray-100'}`
            )
          }
        >
          {route.icon}
          <span className="ml-2">{route.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation;
