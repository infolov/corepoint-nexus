import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, X, Sun, Moon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { UserPanel } from "@/components/panels/UserPanel";
import { useAuth } from "@/hooks/use-auth";
import { useDisplayMode } from "@/hooks/use-display-mode";

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { settings, setTheme } = useDisplayMode();
  
  const isDark = settings.theme === "dark" || 
    (settings.theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

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
    <header className="sticky top-0 z-50 w-full bg-nav text-nav-foreground">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold tracking-tight">
            informacje<span className="text-primary">.pl</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center animate-fade-in">
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Szukaj..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-44 sm:w-56 h-9 text-sm bg-background/90 border-0 text-foreground placeholder:text-muted-foreground rounded-full pr-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 h-9 w-9 hover:bg-transparent text-muted-foreground"
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
                  variant="ghost"
                  size="icon"
                  className="text-nav-foreground/80 hover:text-nav-foreground hover:bg-nav-foreground/10"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="text-nav-foreground/80 hover:text-nav-foreground hover:bg-nav-foreground/10"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-nav-foreground/80 hover:text-nav-foreground hover:bg-nav-foreground/10"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  {/* User Panel */}
                  <div className="pb-4 border-b border-border">
                    <UserPanel
                      onSignOut={handleSignOut}
                      onSettingsClick={() => setIsSettingsOpen(true)}
                    />
                  </div>

                  {/* Settings button */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Ustawienia
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </header>
  );
}
