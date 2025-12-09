import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, User, Sun, Moon, Settings, CloudSun, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { SportDropdown } from "@/components/navigation/SportDropdown";
import { CategoryDropdown } from "@/components/navigation/CategoryDropdown";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/use-auth";

const categories = [
  { name: "Wiadomości", slug: "wiadomosci", parentFilter: "Wiadomości" },
  { name: "Biznes", slug: "biznes", parentFilter: "Biznes" },
  { name: "Lifestyle", slug: "lifestyle", parentFilter: "Lifestyle" },
  { name: "Rozrywka", slug: "rozrywka", parentFilter: "Rozrywka" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/szukaj?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsSearchOpen(false);
      setSearchQuery("");
    }
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
            {categories.slice(0, 1).map((cat) => (
              <CategoryDropdown 
                key={cat.name}
                categoryName={cat.name} 
                categorySlug={cat.slug} 
                parentFilter={cat.parentFilter} 
              />
            ))}
            <SportDropdown />
            {categories.slice(1).map((cat) => (
              <CategoryDropdown 
                key={cat.name}
                categoryName={cat.name} 
                categorySlug={cat.slug} 
                parentFilter={cat.parentFilter} 
              />
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Szukaj..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-40 sm:w-56 h-8 text-sm bg-nav-foreground/10 border-nav-foreground/20 text-nav-foreground placeholder:text-nav-foreground/50"
                  />
                  <Button
                    type="button"
                    variant="nav"
                    size="icon"
                    className="ml-1"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="nav"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Weather */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-nav-foreground/80 text-sm">
              <CloudSun className="h-4 w-4 text-weather-sunny" />
              <span className="font-medium">22°C</span>
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* Theme toggle */}
            <Button variant="nav" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Hamburger Menu (Sheet) */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="nav" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  {/* Login/Register or User section */}
                  <div className="border-b border-border pb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Konto</h3>
                    {user ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.user_metadata?.full_name || "Użytkownik"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <Link to="/dashboard">
                          <Button variant="gradient" className="w-full">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Panel reklamodawcy
                          </Button>
                        </Link>
                        <Button variant="outline" className="w-full" onClick={handleSignOut}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Wyloguj się
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Link to="/login">
                          <Button variant="gradient" className="w-full">
                            <User className="h-4 w-4 mr-2" />
                            Zaloguj się
                          </Button>
                        </Link>
                        <Link to="/login">
                          <Button variant="outline" className="w-full">
                            Zarejestruj się
                          </Button>
                        </Link>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Załóż konto, aby zarządzać reklamami i mieć dostęp do panelu reklamodawcy.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Personalization section */}
                  <div className="border-b border-border pb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Personalizacja</h3>
                    <div className="flex flex-col gap-2">
                      <Button variant="ghost" className="w-full justify-start" onClick={toggleTheme}>
                        {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                        {isDark ? "Tryb jasny" : "Tryb ciemny"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => setIsSettingsOpen(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Ustawienia
                      </Button>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Kategorie</h3>
                    <nav className="flex flex-col gap-1">
                      {categories.map((cat) => (
                        <Link
                          key={cat.name}
                          to={`/${cat.slug}`}
                          className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Mobile Menu (kept for category quick access) */}
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
              to={`/${cat.slug}`}
              className="px-4 py-2 text-nav-foreground hover:bg-nav-foreground/10 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => window.location.reload()}
      />
    </header>
  );
}
