
import { NavLink, useNavigate } from "react-router-dom";
import { UserCircle, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/contexts/settings";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { clearAuthData } from "@/utils/auth-utils";

const UserMenu = () => {
  const { settings } = useSettings();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data?.avatar_url) {
          const { data: { publicUrl } } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(data.avatar_url);

          setAvatarUrl(publicUrl);
        }
      } catch (error) {
        console.error("Error fetching avatar URL:", error);
      }
    };

    fetchAvatarUrl();
    
    // Set up realtime subscription to profile changes
    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`
        },
        () => {
          fetchAvatarUrl();
        }
      )
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
    };
  }, [user]);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    try {
      setIsSigningOut(true);
      setMenuOpen(false); // Close the dropdown menu
      
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      setIsSigningOut(false); // Reset signing out state
    }
  };

  const handleClearAuthData = async () => {
    setMenuOpen(false); // Fermer le menu
    await clearAuthData();
  };

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-9 w-9 rounded-full hidden md:flex cursor-pointer"
          disabled={isSigningOut || authLoading}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl || ""} alt="User" />
            <AvatarFallback className={`${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <UserCircle className={`h-6 w-6 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`} />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="cursor-default">Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <NavLink to="/profile">Profil</NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <NavLink to="/settings">Paramètres</NavLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut} 
          className="cursor-pointer text-destructive"
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Déconnexion...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleClearAuthData} 
          className="cursor-pointer text-orange-500"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Effacer toutes les données
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
