import { useEffect, useRef } from "react";
import { FinanceState } from "@/types/finance";
import { supabase } from "@/integrations/supabase/client";
import { syncFinanceData } from "@/services/finance";
import { toast } from "@/components/ui/use-toast";

export const useLocalStoragePersistence = (state: FinanceState) => {
  const syncInProgressRef = useRef(false);
  const syncErrorCountRef = useRef(0);
  const lastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_SYNC_ERRORS = 3;
  const INACTIVITY_DELAY = 2000; // 3 secondes

  useEffect(() => {
    // Si trop d'erreurs, on n'essaie plus
    if (syncErrorCountRef.current >= MAX_SYNC_ERRORS) {
      console.warn("Trop d'erreurs de synchronisation, synchronisation désactivée temporairement");
      return;
    }

    // Annule le précédent timer s'il existe
    if (lastTimeoutRef.current) {
      clearTimeout(lastTimeoutRef.current);
    }

    // Programme une synchro après 3 s d'inactivité
    lastTimeoutRef.current = setTimeout(async () => {
      try {
        // Empêche les sync multiples
        if (syncInProgressRef.current) return;
        syncInProgressRef.current = true;

        // Vérifier si l'état est vide (ex : aucun budget)
        if (Object.keys(state.budgets).length === 0) {
          syncInProgressRef.current = false;
          return;
        }

        // Récupérer l'ID de l'utilisateur
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;

        if (userId) {
          // Sauvegarder dans localStorage
          localStorage.setItem(`financeState-${userId}`, JSON.stringify(state));

          // Synchroniser avec Supabase
          const success = await syncFinanceData(state);
          if (success) {
            syncErrorCountRef.current = 0;
            console.log("Données synchronisées avec Supabase pour l'utilisateur:", userId);
          } else {
            syncErrorCountRef.current++;
          }
        } else {
          // Fallback si pas d'utilisateur
          localStorage.setItem("financeState", JSON.stringify(state));
        }
      } catch (error) {
        syncErrorCountRef.current++;
        console.error("Erreur lors de la sauvegarde des données:", error);

        if (syncErrorCountRef.current <= MAX_SYNC_ERRORS) {
          toast({
            title: "Erreur de synchronisation",
            description: "Une erreur est survenue lors de la sauvegarde de vos données.",
            variant: "destructive",
          });
        }
      } finally {
        syncInProgressRef.current = false;
      }
    }, INACTIVITY_DELAY);

    // Nettoyage du timer quand le composant se démonte ou si on repasse dans l'effet
    return () => {
      if (lastTimeoutRef.current) {
        clearTimeout(lastTimeoutRef.current);
      }
    };
  }, [state]);
};
