import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, User, Sun, Moon, Settings, CloudSun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { name: "Wiadomości", href: "/news" },
  { name: "Biznes", href: "/business" },
  { name: "Sport", href: "/sport" },
  { name: "Technologia", href: "/tech" },
  { name: "Lifestyle", href: "/lifestyle" },
  { name: "Rozrywka", href: "/entertainment" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Bar */}
      <div className="bg-nav text-nav-foreground">
        <div className="container flex h-12 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-hero-gradient">
                <span className="text-lg font-bold text-primary-foreground">I</span>
              </div>
              <span className="text-xl font-bold tracking-tight">
                INFORMACJE<span className="text-primary">.PL</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.href}
                className="nav-link px-3 py-2 text-sm font-medium"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="nav" size="icon" className="hidden sm:flex">
              <Search className="h-4 w-4" />
            </Button>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-nav-foreground/80 text-sm">
              <CloudSun className="h-4 w-4 text-weather-sunny" />
              <span className="font-medium">22°C</span>
            </div>
            
            {/* Notification Bell - only for logged in users */}
            {user && !loading && (
              <NotificationBell />
            )}
            
            <Button variant="nav" size="icon" className="hidden sm:flex" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="nav" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            {/* Auth buttons */}
            {!loading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="nav" size="sm" className="hidden sm:flex gap-2">
                      <User className="h-4 w-4" />
                      <span className="max-w-24 truncate">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Wyloguj się
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button variant="gradient" size="sm" className="hidden sm:flex">
                    <User className="h-4 w-4 mr-1" />
                    Zaloguj
                  </Button>
                </Link>
              )
            )}
            
            <Button
              variant="nav"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden bg-nav border-t border-nav-foreground/10 overflow-hidden transition-all duration-300",
          isMenuOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <nav className="container py-4 flex flex-col gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={cat.href}
              className="px-4 py-2 text-nav-foreground hover:bg-nav-foreground/10 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
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
                <Button variant="gradient" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Zaloguj się
                </Button>
              </Link>
            )
          )}
        </nav>
      </div>

      {/* Secondary Nav - Categories Bar */}
      <div className="hidden lg:block bg-card border-b">
        <div className="container">
          <div className="flex items-center gap-6 py-2 text-sm">
            <span className="text-muted-foreground">Popularne:</span>
            <Link to="/news/politics" className="text-foreground hover:text-primary transition-colors">
              Polityka
            </Link>
            <Link to="/news/world" className="text-foreground hover:text-primary transition-colors">
              Świat
            </Link>
            <Link to="/business/stocks" className="text-foreground hover:text-primary transition-colors">
              Giełda
            </Link>
            <Link to="/sport/football" className="text-foreground hover:text-primary transition-colors">
              Piłka nożna
            </Link>
            <Link to="/tech/ai" className="text-foreground hover:text-primary transition-colors">
              AI
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
