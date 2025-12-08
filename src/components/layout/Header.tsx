import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, User, Sun, Moon, Settings, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { name: "Odkrywaj", href: "/" },
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
  const [activeTab, setActiveTab] = useState("Odkrywaj");
  const { user, signOut, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b border-border">
      {/* Top Bar */}
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">I</span>
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:inline">
            informacje<span className="text-primary">.pl</span>
          </span>
        </Link>

        {/* Search Bar - Centered */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj w sieci"
              className="w-full pl-10 pr-4 h-10 bg-muted border-0 rounded-full focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {user && !loading && <NotificationBell />}
          
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/settings")}>
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
                <Button variant="default" size="sm" className="rounded-full">
                  Zaloguj
                </Button>
              </Link>
            )
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Category Tabs - MSN Style */}
      <div className="border-t border-border">
        <div className="container">
          <nav className="flex items-center gap-1 py-1 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.href}
                className={cn(
                  "msn-tab whitespace-nowrap",
                  activeTab === cat.name && "active"
                )}
                onClick={() => setActiveTab(cat.name)}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden bg-card border-t border-border overflow-hidden transition-all duration-300",
          isMenuOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <nav className="container py-4 flex flex-col gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={cat.href}
              className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
              onClick={() => {
                setIsMenuOpen(false);
                setActiveTab(cat.name);
              }}
            >
              {cat.name}
            </Link>
          ))}
          {!loading && (
            user ? (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Wyloguj się
              </Button>
            ) : (
              <Link to="/login" className="mt-2" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Zaloguj się
                </Button>
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
