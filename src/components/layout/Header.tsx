import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, User, Sun, Moon, Settings, CloudSun, LayoutDashboard, LogOut, MapPin, Loader2, Cloud, CloudRain, Wind, Droplets, Navigation } from "lucide-react";
import { useWeather, type StationCoords } from "@/hooks/use-weather";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { SportDropdown } from "@/components/navigation/SportDropdown";
import { CategoryDropdown } from "@/components/navigation/CategoryDropdown";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserPanel } from "@/components/panels/UserPanel";
import { LocationSettings } from "@/components/settings/LocationSettings";
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
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings: displaySettings, toggleDataSaver } = useDisplayMode();
  const { data: weatherData, isLoading: weatherLoading, currentStation, setStation } = useWeather();
  const [forecast, setForecast] = useState<{ day: string; temp: number; icon: string }[]>([]);

  // Fetch weekly forecast based on current station
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        // Get location from localStorage or current station, or default to Warsaw
        let lat = 52.2297;
        let lon = 21.0122;

        const savedLocation = localStorage.getItem("userLocation");
        if (savedLocation) {
          const parsed = JSON.parse(savedLocation);
          if (parsed.lat && parsed.lon) {
            lat = parsed.lat;
            lon = parsed.lon;
          }
        } else if (currentStation) {
          lat = currentStation.lat;
          lon = currentStation.lon;
        } else if (navigator.geolocation) {
          const coords = await new Promise<{ lat: number; lon: number }>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
              () => resolve({ lat: 52.2297, lon: 21.0122 }),
              { timeout: 5000 }
            );
          });
          lat = coords.lat;
          lon = coords.lon;
        }

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max&timezone=Europe/Warsaw&forecast_days=7`
        );
        const data = await response.json();
        
        const days = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];
        const forecastData = data.daily.time.map((date: string, i: number) => {
          const d = new Date(date);
          const dayName = i === 0 ? "Dziś" : i === 1 ? "Jutro" : days[d.getDay()];
          const code = data.daily.weather_code[i];
          const icon = code <= 1 ? "sun" : code <= 3 ? "cloud" : "rain";
          return { day: dayName, temp: Math.round(data.daily.temperature_2m_max[i]), icon };
        });
        setForecast(forecastData);
      } catch (e) {
        console.error("Forecast fetch error:", e);
      }
    };
    fetchForecast();
  }, [currentStation]);

  const handleLocationChange = (station: StationCoords) => {
    setStation(station);
    // Trigger event for articles to listen to
    window.dispatchEvent(new CustomEvent("locationChanged", { detail: station }));
  };

  const getWeatherIcon = (type: string) => {
    switch (type) {
      case "sun": return <Sun className="h-5 w-5 text-weather-sunny" />;
      case "cloud": return <Cloud className="h-5 w-5 text-weather-cloudy" />;
      default: return <CloudRain className="h-5 w-5 text-primary" />;
    }
  };

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
        <div className="container flex h-16 items-center justify-between">
          {/* Left: Logo + Partner Space */}
          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/" className="flex flex-col md:flex-row items-start md:items-center gap-0.5 md:gap-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-hero-gradient shadow-lg">
                  <span className="text-xl md:text-2xl font-black text-primary-foreground">i</span>
                </div>
                <span className="text-lg md:text-2xl font-bold tracking-tight">
                  INFORMACJE<span className="text-primary">.PL</span>
                </span>
              </div>
              {/* Mobile Partner - below logo */}
              <div className="flex md:hidden items-center gap-1.5 pl-10">
                <span className="text-[10px] text-nav-foreground/60">Partner:</span>
                <div className="h-5 w-16 bg-nav-foreground/10 rounded flex items-center justify-center">
                  <span className="text-[8px] text-nav-foreground/50">Logo</span>
                </div>
              </div>
            </Link>

            {/* Desktop Partner Space */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 border-l border-nav-foreground/20">
              <span className="text-sm text-nav-foreground/60">Partner Serwisu:</span>
              <div className="h-10 w-28 bg-nav-foreground/10 rounded-lg flex items-center justify-center">
                <span className="text-sm text-nav-foreground/50">Logo partnera</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Icon with expandable input */}
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
                    className="w-40 sm:w-56 h-8 text-sm bg-background/90 border-border/50 text-foreground placeholder:text-muted-foreground rounded-full pr-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 h-8 w-8 hover:bg-transparent"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="nav"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  title="Szukaj"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Weather - popup with weekly forecast */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-nav-foreground/80 text-sm hover:bg-nav-foreground/10 rounded-lg transition-colors">
                  {weatherLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : weatherData ? (
                    <>
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{weatherData.stacja}</span>
                      <CloudSun className="h-5 w-5 text-weather-sunny" />
                      <span className="font-semibold">{Math.round(parseFloat(weatherData.temperatura))}°C</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs text-nav-foreground/60">Warszawa</span>
                      <CloudSun className="h-5 w-5 text-weather-sunny" />
                      <span className="font-semibold">--°C</span>
                    </>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  {/* Current weather */}
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{weatherData?.stacja || "Warszawa"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CloudSun className="h-8 w-8 text-weather-sunny" />
                      <span className="text-2xl font-bold">
                        {weatherData ? Math.round(parseFloat(weatherData.temperatura)) : "--"}°C
                      </span>
                    </div>
                  </div>

                  {/* Current conditions */}
                  {weatherData && (
                    <div className="flex justify-around text-sm text-muted-foreground pb-3 border-b border-border">
                      <div className="flex items-center gap-1">
                        <Wind className="h-4 w-4" />
                        <span>{weatherData.predkosc_wiatru} km/h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="h-4 w-4" />
                        <span>{weatherData.wilgotnosc_wzgledna}%</span>
                      </div>
                    </div>
                  )}

                  {/* Weekly forecast */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Prognoza 7 dni</h4>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {forecast.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{day.day}</span>
                          {getWeatherIcon(day.icon)}
                          <span className="text-xs font-medium">{day.temp}°</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => setIsLocationOpen(true)}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Zmień lokalizację
                    </Button>
                    <Link 
                      to="/pogoda" 
                      className="flex-1"
                    >
                      <Button variant="default" size="sm" className="w-full">
                        Więcej →
                      </Button>
                    </Link>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

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
                      className="w-full justify-start text-senior-sm"
                      onClick={() => setIsSettingsOpen(true)}
                    >
                      <Settings className="h-5 w-5 mr-2" />
                      Ustawienia
                    </Button>
                  </div>
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

      {/* Location Settings */}
      <LocationSettings
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        onLocationChange={handleLocationChange}
        currentStation={currentStation}
      />
    </header>
  );
}
