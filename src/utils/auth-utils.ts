
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Nettoie complètement les données d'authentification et redirige vers la page d'authentification
 * Utile pour tester l'expérience d'un nouvel utilisateur
 */
export const clearAuthData = async () => {
  try {
    // Déconnexion via Supabase
    await supabase.auth.signOut();
    
    // Suppression des données de localStorage
    localStorage.clear();
    
    // Suppression des cookies liés à Supabase
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    toast({
      title: "Données effacées",
      description: "Toutes les données d'authentification ont été effacées. L'application va être rechargée.",
    });
    
    // Redirection avec un délai court pour permettre à la notification de s'afficher
    setTimeout(() => {
      window.location.href = "/auth";
    }, 1500);
  } catch (error) {
    console.error("Erreur lors de la suppression des données :", error);
    toast({
      title: "Erreur",
      description: "Une erreur est survenue lors de la suppression des données.",
      variant: "destructive"
    });
  }
};
