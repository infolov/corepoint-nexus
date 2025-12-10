import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, User, Sun, Moon, Settings, CloudSun, LayoutDashboard, LogOut, Zap } from "lucide-react";
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
import { UserPanel } from "@/components/panels/UserPanel";
import { useAuth } from "@/hooks/use-auth";
import { useDisplayMode } from "@/hooks/use-display-mode";

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
  const { settings: displaySettings, toggleDataSaver } = useDisplayMode();

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
          {/* Left: Logo + Partner Space + Search */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-hero-gradient shadow-lg">
                <span className="text-xl font-black text-primary-foreground">i</span>
              </div>
              <span className="text-xl font-bold tracking-tight">
                INFORMACJE<span className="text-primary">.PL</span>
              </span>
            </Link>

            {/* Partner Space */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 border-l border-nav-foreground/20">
              <span className="text-xs text-nav-foreground/50">Partner:</span>
              <div className="h-6 w-20 bg-nav-foreground/10 rounded flex items-center justify-center">
                <span className="text-xs text-nav-foreground/40">Logo partnera</span>
              </div>
            </div>

            {/* Search Icon - Desktop */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Szukaj..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 h-9 pl-9 pr-3 rounded-full bg-background/90 border-border/50 text-foreground text-sm placeholder:text-muted-foreground focus:bg-background focus:border-primary/50 focus:w-64 transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
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
            {/* Mobile Search Toggle */}
            <div className="relative sm:hidden">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Szukaj..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-40 h-8 text-sm bg-nav-foreground/10 border-nav-foreground/20 text-nav-foreground placeholder:text-nav-foreground/50"
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

            {/* Data Saver Toggle */}
            <Button 
              variant="nav" 
              size="icon" 
              onClick={toggleDataSaver}
              className={cn(displaySettings.dataSaver && "text-primary")}
              title={displaySettings.dataSaver ? "Tryb oszczędzania włączony" : "Włącz oszczędzanie danych"}
            >
              <Zap className="h-4 w-4" />
            </Button>

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
                <SheetTitle className="text-left text-senior">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                {/* User Panel */}
                <div className="border-b border-border pb-4">
                  <UserPanel 
                    onSignOut={handleSignOut}
                    onSettingsClick={() => setIsSettingsOpen(true)}
                  />
                </div>

                {/* Personalization section */}
                <div className="border-b border-border pb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Wyświetlanie</h3>
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="w-full justify-start text-senior-sm" onClick={toggleTheme}>
                      {isDark ? <Sun className="h-5 w-5 mr-2" /> : <Moon className="h-5 w-5 mr-2" />}
                      {isDark ? "Tryb jasny" : "Tryb ciemny"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-senior-sm",
                        displaySettings.dataSaver && "text-primary"
                      )}
                      onClick={toggleDataSaver}
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      Oszczędzanie danych {displaySettings.dataSaver ? "(włączone)" : ""}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-senior-sm"
                      onClick={() => setIsSettingsOpen(true)}
                    >
                      <Settings className="h-5 w-5 mr-2" />
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
                        className="px-3 py-3 text-senior-sm font-medium rounded-lg hover:bg-muted transition-colors"
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
