import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { LockIcon, MailIcon, UserIcon, Eye, EyeOff } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();
  const { signIn, signUp, isLoading, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Show a simple loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Log login attempt for debugging
      console.log("Tentative de connexion avec:", email);
      
      if (!email || !password) {
        toast({
          title: "Information manquante",
          description: "Veuillez saisir votre email et votre mot de passe.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const result = await signIn(email, password);
      
      if (!result.success) {
        console.log("Erreur de connexion:", result.error);
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      console.error("Erreur dans le composant Auth lors de la connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!email || email.trim() === "") {
      toast({
        title: "Email manquant",
        description: "Veuillez saisir votre email pour réinitialiser votre mot de passe.",
        variant: "destructive",
      });
      return;
    }
    
    setResetLoading(true);
    
    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        toast({
          title: "Email envoyé",
          description: "Un email de réinitialisation a été envoyé à votre adresse.",
        });
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Une erreur est survenue lors de l'envoi de l'email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || fullName.trim() === "") {
      toast({
        title: "Information manquante",
        description: "Veuillez saisir votre nom complet.",
        variant: "destructive",
      });
      return;
    }
    
    if (!email || email.trim() === "") {
      toast({
        title: "Information manquante",
        description: "Veuillez saisir votre email.",
        variant: "destructive",
      });
      return;
    }
    
    if (!password || password.trim() === "") {
      toast({
        title: "Information manquante",
        description: "Veuillez saisir un mot de passe.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const result = await signUp(email, password, fullName);
      
      if (!result.success) {
        console.log("Erreur d'inscription:", result.error);
      } else if (result.confirmEmail) {
        // Si l'inscription nécessite une confirmation par email
        // Réinitialiser le formulaire d'inscription
        setFullName("");
        setEmail("");
        setPassword("");
        
        // Basculer vers l'onglet de connexion
        setActiveTab("login");
      } else {
        // Si l'email de confirmation est désactivé dans Supabase
        // Réinitialiser le formulaire et basculer vers l'onglet de connexion
        setFullName("");
        setEmail("");
        setPassword("");
        setActiveTab("login");
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900 px-6 sm:px-10 md:px-16 lg:px-24 p-4">
      <Card className="w-full max-w-md glass-card border border-gray-200 dark:border-gray-800/30">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary dark:text-gray-200">Planit</CardTitle>
          <CardDescription className="dark:text-gray-400">Gérez vos finances personnelles</CardDescription>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full p-4">
          <TabsList className="grid w-full grid-cols-2 mb-2 mx-auto x-4">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 px-0 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4" />
                    Email
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="votre@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="dark:bg-gray-800/50 dark:border-gray-700/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <LockIcon className="h-4 w-4" />
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="dark:bg-gray-800/50 dark:border-gray-700/30 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="link" 
                  className="text-sm p-0 h-auto justify-start text-primary" 
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" /> 
                      Envoi en cours...
                    </>
                  ) : (
                    "Mot de passe oublié ?"
                  )}
                </Button>
              </CardContent>
              <CardFooter className="px-0 pb-4 pt-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><LoadingSpinner size="sm" className="mr-2" /> Connexion en cours...</> : "Se connecter"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 px-0 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Nom complet
                  </Label>
                  <Input 
                    id="fullName" 
                    type="text" 
                    placeholder="Jean Dupont" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="dark:bg-gray-800/50 dark:border-gray-700/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4" />
                    Email
                  </Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="votre@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="dark:bg-gray-800/50 dark:border-gray-700/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="flex items-center gap-2">
                    <LockIcon className="h-4 w-4" />
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input 
                      id="register-password" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="dark:bg-gray-800/50 dark:border-gray-700/30 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-0 pb-4 pt-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><LoadingSpinner size="sm" className="mr-2" /> Inscription en cours...</> : "S'inscrire"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
