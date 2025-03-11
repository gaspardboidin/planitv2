
import { useEffect, useRef } from 'react';
import { FinanceState } from '@/types/finance';
import { supabase } from '@/integrations/supabase/client';
import { syncFinanceData } from '@/services/finance';
import { toast } from '@/components/ui/use-toast';

export const useLocalStoragePersistence = (state: FinanceState) => {
  const syncInProgressRef = useRef(false);
  const syncErrorCountRef = useRef(0);
  const lastSyncAttemptRef = useRef(0);
  const MIN_SYNC_INTERVAL = 5000; // Minimum 5 seconds between sync attempts
  const MAX_SYNC_ERRORS = 3;

  useEffect(() => {
    // Prevent infinite loops from sync errors
    if (syncErrorCountRef.current >= MAX_SYNC_ERRORS) {
      console.warn("Trop d'erreurs de synchronisation, synchronisation désactivée temporairement");
      return;
    }

    // Don't trigger multiple syncs at once
    if (syncInProgressRef.current) {
      return;
    }

    // Rate limiting - don't sync too frequently
    const now = Date.now();
    if (now - lastSyncAttemptRef.current < MIN_SYNC_INTERVAL) {
      return;
    }
    
    lastSyncAttemptRef.current = now;

    const saveState = async () => {
      try {
        syncInProgressRef.current = true;
        
        // Ne pas sauvegarder l'état initial vide
        if (Object.keys(state.budgets).length === 0) {
          syncInProgressRef.current = false;
          return;
        }
        
        // Récupérer l'ID de l'utilisateur actuel
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        
        if (userId) {
          // Sauvegarder avec une clé spécifique à l'utilisateur dans localStorage
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
          // Fallback au comportement précédent si pas d'utilisateur connecté
          localStorage.setItem('financeState', JSON.stringify(state));
        }
        
        syncInProgressRef.current = false;
      } catch (error) {
        syncInProgressRef.current = false;
        syncErrorCountRef.current++;
        
        // En cas d'erreur, utiliser le comportement par défaut
        localStorage.setItem('financeState', JSON.stringify(state));
        console.error('Erreur lors de la sauvegarde des données:', error);
        
        if (syncErrorCountRef.current <= MAX_SYNC_ERRORS) {
          toast({
            title: "Erreur de synchronisation",
            description: "Une erreur est survenue lors de la sauvegarde de vos données.",
            variant: "destructive"
          });
        }
      }
    };
    
    // Ne pas déclencher de synchronisation si l'état est vide ou initial
    if (Object.keys(state.budgets).length > 0) {
      saveState();
    }
  }, [state]);
};
