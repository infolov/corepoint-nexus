import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Search, User, Sun, Moon, Settings, Cloud, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PersonalizeDialog } from "@/components/personalization/PersonalizeDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { name: "Odkryj", href: "/" },
  { name: "Wiadomości", href: "/news" },
  { name: "Sport", href: "/sport" },
  { name: "Biznes", href: "/business" },
  { name: "Pogoda", href: "/weather" },
  { name: "Rozrywka", href: "/entertainment" },
  { name: "Technologia", href: "/tech" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    const category = categories.find(cat => cat.href === path);
    return category?.name || "Odkryj";
  };

  const activeTab = getActiveTab();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-nav border-b border-border">
      {/* Top Bar */}
      <div className="container">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl font-bold tracking-tight text-foreground">
              INFORMACJE<span className="text-primary">.PL</span>
            </span>
          </Link>

          {/* Search Bar - MSN Style */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj w sieci"
                className="w-full pl-10 pr-4 h-10 bg-secondary border-0 rounded-full focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Weather */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              <Cloud className="h-4 w-4" />
              <span className="font-medium">Warszawa</span>
              <span className="text-foreground font-semibold">22°</span>
            </div>

            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {user && !loading && <NotificationBell />}

            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" />
            </Button>

            {/* Auth */}
            {!loading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline max-w-24 truncate">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <User className="h-4 w-4 mr-2" />
                      Mój profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="h-4 w-4 mr-2" />
                      Ustawienia
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/admin/articles")}>
                          <Shield className="h-4 w-4 mr-2" />
                          Panel admina
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Wyloguj się
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button variant="default" size="sm">
                    Zaloguj
                  </Button>
                </Link>
              )
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Category Tabs - MSN Style */}
        <nav className="hidden md:flex items-center justify-between py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.href}
                className={cn(
                  "nav-tab whitespace-nowrap",
                  activeTab === cat.name && "nav-tab-active"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <PersonalizeDialog />
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden bg-nav border-t border-border overflow-hidden transition-all duration-300",
          isMenuOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="container py-4">
          {/* Mobile Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj w sieci"
              className="w-full pl-10 pr-4 h-10 bg-secondary border-0 rounded-full"
            />
          </div>

          <nav className="flex flex-col gap-1">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.href}
                className="px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {!loading && (
            user ? (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Wyloguj się
              </Button>
            ) : (
              <Link to="/login" className="mt-4 block" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Zaloguj się
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
