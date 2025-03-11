
import { useState, useEffect } from 'react';
import { FinanceState } from '@/types/finance';
import { initialState } from '../initialData';
import { supabase } from '@/integrations/supabase/client';
import { loadFinanceData } from '@/services/finance';
import { toast } from '@/components/ui/use-toast';

export const useInitializeState = (): [FinanceState, React.Dispatch<React.SetStateAction<FinanceState>>] => {
  const [state, setState] = useState<FinanceState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        
        if (userId) {
          // D'abord, essayer de charger depuis Supabase
          const supabaseData = await loadFinanceData();
          
          if (supabaseData) {
            // Si on a des données dans Supabase, on les utilise
            setState(supabaseData);
            // Suppression de la notification ici pour éviter les doublons
            // car une notification s'affiche déjà lors de la connexion
          } else {
            // Sinon, on essaie de charger depuis localStorage puis on synchronisera plus tard
            const savedState = localStorage.getItem(`financeState-${userId}`);
            
            if (savedState) {
              const parsedState = JSON.parse(savedState);
              
              // Convertir les chaînes de date en objets Date
              Object.keys(parsedState.budgets).forEach(key => {
                if (parsedState.budgets[key].transactions) {
                  parsedState.budgets[key].transactions.forEach((transaction: any) => {
                    transaction.date = new Date(transaction.date);
                  });
                }
                
                // Assurer la compatibilité avec les versions antérieures
                if (parsedState.budgets[key].isSavingsSetAside === undefined) {
                  parsedState.budgets[key].isSavingsSetAside = false;
                }
                
                if (parsedState.budgets[key].isSavingsTransferred === undefined) {
                  parsedState.budgets[key].isSavingsTransferred = false;
                }
              });
              
              setState(parsedState);
            }
          }
        } else {
          // Fallback au comportement précédent si pas d'utilisateur connecté
          const savedState = localStorage.getItem('financeState');
          
          if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            // Convertir les chaînes de date en objets Date
            Object.keys(parsedState.budgets).forEach(key => {
              if (parsedState.budgets[key].transactions) {
                parsedState.budgets[key].transactions.forEach((transaction: any) => {
                  transaction.date = new Date(transaction.date);
                });
              }
              
              // Assurer la compatibilité avec les versions antérieures
              if (parsedState.budgets[key].isSavingsSetAside === undefined) {
                parsedState.budgets[key].isSavingsSetAside = false;
              }
              
              if (parsedState.budgets[key].isSavingsTransferred === undefined) {
                parsedState.budgets[key].isSavingsTransferred = false;
              }
            });
            
            setState(parsedState);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast({
          title: "Erreur de chargement",
          description: "Une erreur est survenue lors du chargement de vos données financières.",
          variant: "destructive"
        });
        
        // Utiliser le comportement par défaut en cas d'erreur
        const savedState = localStorage.getItem('financeState');
        
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Convertir les chaînes de date en objets Date
          Object.keys(parsedState.budgets).forEach(key => {
            if (parsedState.budgets[key].transactions) {
              parsedState.budgets[key].transactions.forEach((transaction: any) => {
                transaction.date = new Date(transaction.date);
              });
            }
            
            // Assurer la compatibilité avec les versions antérieures
            if (parsedState.budgets[key].isSavingsSetAside === undefined) {
              parsedState.budgets[key].isSavingsSetAside = false;
            }
            
            if (parsedState.budgets[key].isSavingsTransferred === undefined) {
              parsedState.budgets[key].isSavingsTransferred = false;
            }
          });
          
          setState(parsedState);
        }
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadUserData();
  }, []);
  
  // Return a properly typed tuple with state and setState
  return [state, setState];
};
