
import { Outlet } from "react-router-dom";
import { ROUTES } from "./constants";
import Navigation from "./Navigation";
import UserMenu from "./UserMenu";
import AppOptions from "./AppOptions";
import MobileMenu from "./MobileMenu";
import { useAuth } from "@/hooks/use-auth";

const Layout = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#121214]">
      <header className="border-b dark:border-gray-800/30 bg-white dark:bg-[#1c1c1e] sticky top-0 z-50 shadow-sm dark:shadow-gray-900/10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold dark:text-gray-200">Planit</h1>
            <Navigation routes={ROUTES} />
          </div>

          <div className="flex items-center gap-3">
            <AppOptions />
            <UserMenu />
            <MobileMenu routes={ROUTES} onSignOut={signOut} />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t dark:border-gray-800/30 py-4 bg-white dark:bg-[#1c1c1e]">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground dark:text-gray-400">
          © {new Date().getFullYear()} Planit. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
