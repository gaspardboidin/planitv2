import { useEffect, useRef } from "react";
import { FinanceState } from "@/types/finance";
import { supabase } from "@/integrations/supabase/client";
import { syncFinanceData } from "@/services/finance";
import { toast } from "@/components/ui/use-toast";

export const useLocalStoragePersistence = (state: FinanceState) => {
  const syncInProgressRef = useRef<boolean>(false);
  const syncErrorCountRef = useRef<number>(0);
  const lastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_SYNC_ERRORS = 3;
  const INACTIVITY_DELAY = 3000; // 3 secondes

  useEffect(() => {
    // Vérifier que les informations essentielles sont définies
    if (state.currentMonth === undefined || state.currentYear === undefined) {
      console.log("useLocalStoragePersistence: currentMonth ou currentYear non définis, synchronisation ignorée.");
      return;
    }

    // Log de l'état actuel pour le débogage
    console.log("useLocalStoragePersistence: state mis à jour :", state);

    // Annuler le timer précédent s'il existe
    if (lastTimeoutRef.current) {
      clearTimeout(lastTimeoutRef.current);
    }

    // Planifier une synchronisation après INACTIVITY_DELAY millisecondes d'inactivité
    lastTimeoutRef.current = setTimeout(async () => {
      try {
        if (syncInProgressRef.current) {
          console.log("useLocalStoragePersistence: synchronisation déjà en cours, annulation de ce cycle.");
          return;
        }
        syncInProgressRef.current = true;
        console.log("useLocalStoragePersistence: démarrage de la synchronisation...");

        // Sauvegarder dans localStorage
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (userId) {
          localStorage.setItem(`financeState-${userId}`, JSON.stringify(state));
          console.log(`useLocalStoragePersistence: État sauvegardé dans localStorage sous la clé financeState-${userId}`);
        } else {
          localStorage.setItem("financeState", JSON.stringify(state));
          console.log("useLocalStoragePersistence: État sauvegardé dans localStorage sous la clé financeState");
        }

        // Synchroniser avec Supabase
        const success = await syncFinanceData(state);
        if (success) {
          console.log("useLocalStoragePersistence: Synchronisation réussie avec Supabase.");
          syncErrorCountRef.current = 0;
        } else {
          syncErrorCountRef.current++;
          console.error("useLocalStoragePersistence: Échec de la synchronisation avec Supabase.");
        }
      } catch (error) {
        syncErrorCountRef.current++;
        console.error("useLocalStoragePersistence: Erreur lors de la synchronisation :", error);
        if (syncErrorCountRef.current <= MAX_SYNC_ERRORS) {
          toast({
            title: "Erreur de synchronisation",
            description: "Une erreur est survenue lors de la sauvegarde de vos données.",
            variant: "destructive",
          });
        }
      } finally {
        syncInProgressRef.current = false;
        console.log("useLocalStoragePersistence: Synchronisation terminée.");
      }
    }, INACTIVITY_DELAY);

    return () => {
      if (lastTimeoutRef.current) {
        clearTimeout(lastTimeoutRef.current);
      }
    };
  }, [state]);
};
