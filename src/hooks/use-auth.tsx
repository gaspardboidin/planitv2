/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

/**
 * Type d'erreur pour capturer message, code, status, etc.
 * selon ce que Supabase peut renvoyer.
 */
type SupabaseAuthError = {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ success: boolean; error?: string; confirmEmail?: boolean }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  // -------------------------------------------
  // 1) Logs pour observer user et isLoading
  // -------------------------------------------
  useEffect(() => {
    console.log("[useAuth] user changed:", user);
  }, [user]);

  useEffect(() => {
    console.log("[useAuth] isLoading changed:", isLoading);
  }, [isLoading]);

  // -------------------------------------------
  // 2) Vérification de session au montage
  // -------------------------------------------
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Checking session on mount...");
        setIsLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error fetching session:", error.message);
          throw error;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log("Session found, user is authenticated:", session.user.id);
        } else {
          console.log("No active session found");
        }
      } catch (error: unknown) {
        console.error("Authentication error:", error);
        // Reset state on error
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
      }
    };

    checkSession();
  }, []);

  // -------------------------------------------
  // 3) Empêcher la double subscription
  // -------------------------------------------
  const hasSetupListenerRef = useRef(false);

  // -------------------------------------------
  // 4) Mise en place du onAuthStateChange
  // -------------------------------------------
  useEffect(() => {
    if (!authChecked) return;
    if (hasSetupListenerRef.current) return; // Évite la double subscription
    hasSetupListenerRef.current = true;

    console.log("Setting up auth state change listener");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state change event:", event);

      if (event === "SIGNED_IN" && newSession?.user) {
        // Éviter le re-signed_in si c'est le même user
        if (newSession.user.id === user?.id) {
          console.log("Already signed in with the same user, ignoring...");
          return;
        }

        console.log("User signed in:", newSession.user.id);
        setSession(newSession);
        setUser(newSession.user);

        // Check if user profile exists, create if not
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", newSession.user.id)
          .maybeSingle();

        if (!profile) {
          await supabase.from("profiles").insert({
            id: newSession.user.id,
            email: newSession.user.email,
            full_name: newSession.user.user_metadata.full_name || "",
          });
        }

        toast({
          title: "Connecté",
          description: "Vous êtes maintenant connecté.",
        });

        navigate("/dashboard", { replace: true });
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        setUser(null);
        setSession(null);

        toast({
          title: "Déconnecté",
          description: "Vous avez été déconnecté.",
        });

        navigate("/auth", { replace: true });
      } else if (event === "TOKEN_REFRESHED" && newSession) {
        console.log("Token refreshed");
        setSession(newSession);
        setUser(newSession.user);
      }

      setIsLoading(false);
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [authChecked, user, navigate]);

  // -------------------------------------------
  // 5) Méthodes d'authentification
  // -------------------------------------------
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in:", email);
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Authentication error:", error);
        throw error;
      }

      console.log("Sign in successful:", data);
      return { success: true };
    } catch (error: unknown) {
      const e = error as SupabaseAuthError;
      console.error("Sign in error:", e);

      let errorMessage = "Une erreur est survenue lors de la connexion.";

      if (e.status === 400) {
        if (e.message && e.message.includes("Email not confirmed")) {
          errorMessage = "Veuillez confirmer votre adresse email avant de vous connecter.";
        } else if (
          e.message &&
          (e.message.includes("Invalid login credentials") || e.code === "invalid_credentials")
        ) {
          errorMessage = "Email ou mot de passe incorrect.";
        }
      }

      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Check if user already exists before trying to sign up
      const { data: existingUsers, error: queryError } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email)
        .limit(1);

      if (queryError) {
        console.error("Erreur lors de la vérification de l'email:", queryError);
      } else if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Erreur d'inscription",
          description: "Cet email est déjà utilisé.",
          variant: "destructive",
        });

        return {
          success: false,
          error: "Cet email est déjà utilisé.",
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Si l'email de confirmation est activé
      if (data.user && !data.session) {
        console.log("Email de confirmation envoyé à", email);

        toast({
          title: "Inscription réussie",
          description:
            "Un email de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception.",
        });

        return {
          success: true,
          confirmEmail: true,
        };
      }

      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès.",
      });

      return { success: true };
    } catch (error: unknown) {
      const e = error as SupabaseAuthError;
      console.error("Erreur lors de l'inscription:", e);

      let errorMessage = "Une erreur est survenue lors de l'inscription.";

      if (e.message && e.message.includes("already registered")) {
        errorMessage = "Cet email est déjà utilisé.";
      } else if (e.message && e.message.includes("password")) {
        errorMessage =
          "Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
      }

      toast({
        title: "Erreur d'inscription",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log("Tentative de réinitialisation du mot de passe pour:", email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Erreur lors de la réinitialisation du mot de passe:", error);
        throw error;
      }

      console.log("Email de réinitialisation envoyé à:", email);

      return { success: true };
    } catch (error: unknown) {
      const e = error as SupabaseAuthError;
      console.error("Erreur détaillée lors de la réinitialisation:", e);

      let errorMessage = "Une erreur est survenue lors de l'envoi de l'email de réinitialisation.";

      if (e.message && e.message.includes("rate limit")) {
        errorMessage = "Trop de tentatives. Veuillez réessayer plus tard.";
      } else if (e.message && e.message.includes("user not found")) {
        errorMessage = "Aucun compte n'est associé à cette adresse email.";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const signOut = async () => {
    try {
      console.log("Attempting to sign out");
      setIsLoading(true);

      if (!session) {
        console.log("No active session found, treating as already signed out");
        setUser(null);
        setSession(null);
        navigate("/auth", { replace: true });

        toast({
          title: "Déconnecté",
          description: "Vous avez été déconnecté.",
        });
        return;
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);

        if (
          error.message?.includes("Auth session missing") ||
          error.name === "AuthSessionMissingError"
        ) {
          console.log("Session already expired, treating as success");
        } else {
          throw error;
        }
      }

      console.log("Sign out successful");
      // La navigation se fera dans l'écouteur onAuthStateChange
    } catch (error: unknown) {
      const e = error as SupabaseAuthError;
      console.error("Sign out error:", e);

      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur est survenue lors de la déconnexion.",
        variant: "destructive",
      });

      setUser(null);
      setSession(null);
      navigate("/auth", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------
  // 6) Exposer le contexte
  // -------------------------------------------
  const value = {
    user,
    session,
    isLoading,
    signOut,
    signIn,
    signUp,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ========================
// 7) Hook useAuth
// ========================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
