import { useEffect, useState } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { 
  Menu,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { useDemo } from "@/contexts/DemoContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin, isPartner, isPublisher, getDashboardPath, loading: roleLoading } = useUserRole();
  const { isDemoMode, demoUser, exitDemoMode } = useDemo();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine effective user (real or demo)
  const effectiveUser = isDemoMode ? demoUser : user;

  useEffect(() => {
    if (!loading && !user && !isDemoMode) {
      navigate("/login");
    }
  }, [user, loading, navigate, isDemoMode]);

  // Redirect to role-specific dashboard on initial load
  useEffect(() => {
    if (!loading && !roleLoading && user && !isDemoMode) {
      const targetPath = getDashboardPath();
      // Only redirect if we're at the base /dashboard path
      if (location.pathname === "/dashboard") {
        navigate(targetPath, { replace: true });
      }
    }
  }, [user, loading, roleLoading, navigate, isDemoMode, getDashboardPath, location.pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    if (isDemoMode) {
      exitDemoMode();
      navigate("/login");
    } else {
      await signOut();
      navigate("/");
    }
  };

  if ((loading || roleLoading) && !isDemoMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!effectiveUser) return null;

  // All logged in users now have dashboard access (to their role-specific dashboard)

  const sidebarProps = {
    user: effectiveUser,
    isAdmin,
    isPublisher,
    isDemoMode,
    onSignOut: handleSignOut,
  };

  return (
    <div className="min-h-screen bg-muted/30 flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-card border-r border-border flex-shrink-0">
        <DashboardSidebar {...sidebarProps} />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu nawigacyjne</SheetTitle>
          <DashboardSidebar {...sidebarProps} onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <nav className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Strona główna</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Panel Partnera</span>
            {isDemoMode && (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded">
                TRYB DEMO
              </span>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {isDemoMode && (
              <Link to="/login">
                <Button variant="default" size="sm">
                  Załóż prawdziwe konto
                </Button>
              </Link>
            )}
            <Link to="/">
              <Button variant="outline" size="sm">
                Wróć do portalu
              </Button>
            </Link>
          </div>
        </header>

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
            <Alert className="bg-transparent border-0 p-0">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                Przeglądasz panel w trybie demo. Dane są przykładowe, a działania nie będą zapisywane.{" "}
                <Link to="/login" className="font-medium underline hover:no-underline">
                  Załóż konto
                </Link>
                {" "}aby uzyskać pełny dostęp.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
