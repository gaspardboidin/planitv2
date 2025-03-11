
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  UserCircle,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSettings } from "@/contexts/settings";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

type MobileMenuProps = {
  routes: Array<{ 
    path: string;
    name: string;
    icon: React.ReactNode;
  }>;
  onSignOut: () => Promise<void>;
};

const MobileMenu = ({ routes, onSignOut }: MobileMenuProps) => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user, isLoading: authLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    try {
      setIsSigningOut(true);
      setIsMenuOpen(false); // Close the menu sheet
      
      await onSignOut();
    } catch (error) {
      console.error("Erreur lors de la déconnexion (mobile):", error);
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur est survenue lors de la déconnexion.",
        variant: "destructive"
      });
    } finally {
      setIsSigningOut(false); // Reset signing out state
    }
  };

  return (
    <div className="md:hidden flex items-center justify-end">
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full"
            disabled={isSigningOut || authLoading}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className={`${settings.theme === 'dark' ? 'bg-[#1c1c24] text-white border-gray-800' : 'bg-white'} p-0`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </Button>
            </div>
            
            <div className="flex-1 py-4">
              <div className="space-y-1 px-3">
                {routes.map((route) => (
                  <NavLink
                    key={route.path}
                    to={route.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "px-4 py-3 rounded-md transition-all duration-200 flex items-center",
                        isActive
                          ? "bg-secondary font-medium text-primary dark:bg-gray-800 dark:text-white"
                          : `${settings.theme === 'dark' ? 'text-gray-300 hover:bg-gray-800/50' : 'text-gray-600 hover:bg-gray-100'}`
                      )
                    }
                  >
                    <span className="mr-3 text-gray-500 dark:text-gray-400">{route.icon}</span>
                    {route.name}
                  </NavLink>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t dark:border-gray-800">
              <div className="mt-4 space-y-2">
                <NavLink
                  to="/profile"
                  className="flex items-center w-full px-3 py-2 rounded-md text-sm dark:hover:bg-gray-800/50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserCircle className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>Profil</span>
                </NavLink>
                
                <NavLink
                  to="/settings"
                  className="flex items-center w-full px-3 py-2 rounded-md text-sm dark:hover:bg-gray-800/50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <SettingsIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>Paramètres</span>
                </NavLink>
                
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut || authLoading}
                  className="flex items-center w-full px-3 py-2 rounded-md text-sm text-destructive dark:hover:bg-gray-800/50 disabled:opacity-50"
                >
                  <LogOut className="mr-2 h-4 w-4 text-red-500" />
                  <span>{isSigningOut ? "Déconnexion..." : "Déconnexion"}</span>
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileMenu;
