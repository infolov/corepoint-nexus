import { useEffect, useState } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  Target, 
  CreditCard, 
  BarChart3, 
  Megaphone, 
  Settings, 
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
  Shield,
  Users,
  LayoutGrid,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useDemo } from "@/contexts/DemoContext";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const sidebarLinks = [
  { name: "Panel główny", href: "/dashboard", icon: LayoutDashboard },
  { name: "Kalendarz rezerwacji", href: "/dashboard/calendar", icon: Calendar },
  { name: "Miejsca reklamowe", href: "/dashboard/placements", icon: Target },
  { name: "Kredyty reklamowe", href: "/dashboard/credits", icon: CreditCard },
  { name: "Statystyki kampanii", href: "/dashboard/stats", icon: BarChart3 },
  { name: "Moje kampanie", href: "/dashboard/campaigns", icon: Megaphone },
  { name: "Ustawienia konta", href: "/dashboard/settings", icon: Settings },
];

const adminLinks = [
  { name: "Statystyki platformy", href: "/dashboard/admin/stats", icon: BarChart3 },
  { name: "Zarządzanie kampaniami", href: "/dashboard/admin/campaigns", icon: Shield },
  { name: "Zarządzanie użytkownikami", href: "/dashboard/admin/users", icon: Users },
  { name: "Zarządzanie miejscami", href: "/dashboard/admin/placements", icon: LayoutGrid },
];

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
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

  const handleSignOut = async () => {
    if (isDemoMode) {
      exitDemoMode();
      navigate("/login");
    } else {
      await signOut();
      navigate("/");
    }
  };

  if (loading && !isDemoMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!effectiveUser) return null;

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 lg:static",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero-gradient">
                <span className="text-xl font-bold text-primary-foreground">I</span>
              </div>
              <span className="text-lg font-bold tracking-tight">
                INFORMACJE<span className="text-primary">.PL</span>
              </span>
            </Link>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isDemoMode ? "bg-amber-500/10" : "bg-primary/10"
              )}>
                <User className={cn("h-5 w-5", isDemoMode ? "text-amber-500" : "text-primary")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {effectiveUser.user_metadata?.full_name || "Użytkownik"}
                  </p>
                  {isDemoMode && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded">
                      DEMO
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{effectiveUser.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.name}
                </Link>
              );
            })}

            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Administracja
                  </p>
                </div>
                {adminLinks.map((link) => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Wyloguj się
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
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
            <span className="text-foreground">Panel reklamodawcy</span>
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
