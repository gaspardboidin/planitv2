
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider";
import { FinanceProvider } from './contexts/finance';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Savings from './pages/Savings';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import { SettingsProvider } from './contexts/settings';
import { AuthProvider } from './hooks/use-auth';
import Layout from './components/Layout';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from './hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect, useState } from 'react';

// Protected route component with improved loading handling and timeout
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  useEffect(() => {
    // Set a timeout to avoid infinite loading
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("Loading timeout reached, forcing navigation decision");
        setTimeoutReached(true);
      }
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  // If still loading and timeout not reached, show spinner
  if (isLoading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // If user is not authenticated or loading timed out without a user, redirect
  if (!user) {
    console.log("No authenticated user found, redirecting to auth page");
    return <Navigate to="/auth" replace />;
  }
  
  // User is authenticated, render children
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <AppRoutes />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

// Separate component for routes with improved auth state handling
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<AuthRouteHandler />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <FinanceProvider>
            <SettingsProvider>
              <Layout />
            </SettingsProvider>
          </FinanceProvider>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budget" element={<Budget />} />
        <Route path="savings" element={<Savings />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      
      {/* Redirect all other routes */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Improved auth route handler with timeout
const AuthRouteHandler = () => {
  const { user, isLoading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  useEffect(() => {
    // Set a timeout to avoid infinite loading
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("Auth loading timeout reached");
        setTimeoutReached(true);
      }
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  // If still loading and timeout not reached, show spinner
  if (isLoading && !timeoutReached) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background dark:bg-gray-900">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Vérification de l'authentification...</p>
      </div>
    );
  }
  
  // If user is authenticated or loading timed out with a user, redirect to dashboard
  if (user) {
    console.log("User is authenticated, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is not authenticated, show auth page
  return <Auth />;
};

export default App;
