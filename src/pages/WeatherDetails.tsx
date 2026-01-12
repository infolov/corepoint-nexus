import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Thermometer, 
  Wind, 
  Droplets, 
  CloudRain, 
  Gauge, 
  Compass,
  Sun,
  Moon,
  Cloud,
  CloudSnow,
  CloudSun,
  CloudMoon,
  Snowflake,
  Loader2,
  RefreshCw,
  ChevronDown,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeather, STATIONS } from "@/hooks/use-weather";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLocationContext } from "@/components/geolocation/LocationProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Get wind direction arrow rotation
const getWindRotation = (degrees: string): number => {
  const deg = parseFloat(degrees);
  if (isNaN(deg)) return 0;
  return deg;
};

// Get wind direction name in Polish
const getWindDirectionName = (degrees: string): string => {
  const deg = parseFloat(degrees);
  if (isNaN(deg)) return "—";
  
  const directionsPL = ["Północny", "Północno-wschodni", "Wschodni", "Południowo-wschodni", 
                        "Południowy", "Południowo-zachodni", "Zachodni", "Północno-zachodni"];
  const index = Math.round(deg / 45) % 8;
  return directionsPL[index];
};

// Check if it's currently daytime (simplified: 6:00 - 20:00)
const isDaytime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 20;
};

// Get weather condition based on precipitation, temperature and humidity
const getWeatherCondition = (
  precipitation: string, 
  temperature: string, 
  humidity: string
): { icon: React.ReactNode; label: string } => {
  const precip = parseFloat(precipitation);
  const temp = parseFloat(temperature);
  const humid = parseFloat(humidity);
  const daytime = isDaytime();
  
  // Snow conditions
  if (precip > 0 && temp <= 0) {
    if (precip > 3) {
      return { 
        icon: <Snowflake className="h-20 w-20 text-sky-300" />, 
        label: "Intensywne opady śniegu" 
      };
    }
    return { 
      icon: <CloudSnow className="h-20 w-20 text-sky-200" />, 
      label: "Opady śniegu" 
    };
  }
  
  // Rain conditions
  if (precip > 0) {
    return { 
      icon: <CloudRain className="h-20 w-20 text-primary" />, 
      label: precip > 5 ? "Intensywne opady deszczu" : "Opady deszczu"
    };
  }
  
  // Cloudy based on humidity
  if (humid > 80) {
    return { 
      icon: <Cloud className="h-20 w-20 text-muted-foreground" />, 
      label: "Pochmurno" 
    };
  }
  
  if (humid > 60) {
    if (daytime) {
      return { 
        icon: <CloudSun className="h-20 w-20 text-weather-sunny" />, 
        label: "Częściowe zachmurzenie" 
      };
    }
    return { 
      icon: <CloudMoon className="h-20 w-20 text-muted-foreground" />, 
      label: "Częściowe zachmurzenie" 
    };
  }
  
  // Clear weather
  if (daytime) {
    return { 
      icon: <Sun className="h-20 w-20 text-weather-sunny" />, 
      label: "Słonecznie" 
    };
  }
  
  return { 
    icon: <Moon className="h-20 w-20 text-muted-foreground" />, 
    label: "Bezchmurnie" 
  };
};

// Local storage key for manual station selection
const MANUAL_STATION_KEY = "weather_manual_station";

export default function WeatherDetails() {
  const navigate = useNavigate();
  const { location } = useLocationContext();
  
  // Get manual station from localStorage
  const [manualStationId, setManualStationId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(MANUAL_STATION_KEY);
    }
    return null;
  });

  const { data, isLoading, error, stationId, isManualSelection, refetch } = useWeather("12375", {
    city: location.city,
    voivodeship: location.voivodeship,
    manualStationId
  });

  // Handle station change
  const handleStationChange = (newStationId: string) => {
    if (newStationId === "auto") {
      localStorage.removeItem(MANUAL_STATION_KEY);
      setManualStationId(null);
    } else {
      localStorage.setItem(MANUAL_STATION_KEY, newStationId);
      setManualStationId(newStationId);
    }
  };

  // Get sorted stations alphabetically
  const sortedStations = [...STATIONS].sort((a, b) => a.name.localeCompare(b.name, 'pl'));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Ładowanie danych pogodowych...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Cloud className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Nie udało się pobrać danych</h2>
            <p className="text-muted-foreground">{error || "Spróbuj ponownie później"}</p>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const weatherCondition = getWeatherCondition(data.suma_opadu, data.temperatura, data.wilgotnosc_wzgledna);
  const windDirRotation = getWindRotation(data.kierunek_wiatru);
  const windDirName = getWindDirectionName(data.kierunek_wiatru);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Back button and station selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="-ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do strony głównej
          </Button>

          {/* Station selector */}
          <div className="flex items-center gap-2">
            <Select 
              value={manualStationId || "auto"} 
              onValueChange={handleStationChange}
            >
              <SelectTrigger className="w-[220px] backdrop-blur-sm bg-background/80">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  <SelectValue placeholder="Wybierz stację" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Automatyczna (wg lokalizacji)</span>
                  </div>
                </SelectItem>
                {sortedStations.map((station) => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main weather card with glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-xl border border-white/20 shadow-2xl p-8 mb-8">
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-weather-sunny/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            {/* Station name and refresh */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/20 backdrop-blur-sm">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  {!isManualSelection && location.city && location.city !== data.stacja && (
                    <p className="text-lg font-semibold text-primary">{location.city}</p>
                  )}
                  <h1 className="text-2xl md:text-3xl font-bold">{data.stacja}</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>Stacja IMGW • ID: {data.id_stacji}</span>
                    {isManualSelection && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                        Wybrano ręcznie
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => refetch?.()}
                className="rounded-full backdrop-blur-sm bg-background/50"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Main temperature display */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="flex items-center gap-6">
                {weatherCondition.icon}
                <div>
                  <span className="text-6xl md:text-8xl font-bold tracking-tight">
                    {Math.round(parseFloat(data.temperatura))}°
                  </span>
                  <p className="text-xl text-muted-foreground mt-1">{weatherCondition.label}</p>
                </div>
              </div>
            </div>

            {/* Measurement time */}
            <p className="text-sm text-muted-foreground">
              Pomiar: {data.data_pomiaru} o godz. {data.godzina_pomiaru}:00
            </p>
          </div>
        </div>

        {/* Weather parameters grid */}
        <h2 className="text-xl font-semibold mb-4">Szczegółowe parametry</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Temperature */}
          <div className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 hover:border-primary/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-orange-500/10">
                  <Thermometer className="h-5 w-5 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Temperatura</span>
              </div>
              <p className="text-3xl font-bold">{data.temperatura}°C</p>
            </div>
          </div>

          {/* Wind speed */}
          <div className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 hover:border-primary/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-sky-500/10">
                  <Wind className="h-5 w-5 text-sky-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Prędkość wiatru</span>
              </div>
              <p className="text-3xl font-bold">{data.predkosc_wiatru} <span className="text-base font-normal">km/h</span></p>
            </div>
          </div>

          {/* Wind direction */}
          <div className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 hover:border-primary/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-indigo-500/10">
                  <Compass 
                    className="h-5 w-5 text-indigo-500 transition-transform duration-500" 
                    style={{ transform: `rotate(${windDirRotation}deg)` }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Kierunek wiatru</span>
              </div>
              <p className="text-2xl font-bold">{windDirName}</p>
              <p className="text-sm text-muted-foreground">{data.kierunek_wiatru}°</p>
            </div>
          </div>

          {/* Humidity */}
          <div className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 hover:border-primary/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Droplets className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Wilgotność</span>
              </div>
              <p className="text-3xl font-bold">{data.wilgotnosc_wzgledna}<span className="text-base font-normal">%</span></p>
            </div>
          </div>

          {/* Precipitation */}
          <div className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 hover:border-primary/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <CloudRain className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Suma opadu</span>
              </div>
              <p className="text-3xl font-bold">{data.suma_opadu} <span className="text-base font-normal">mm</span></p>
            </div>
          </div>

          {/* Pressure */}
          <div className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 hover:border-primary/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <Gauge className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Ciśnienie</span>
              </div>
              <p className="text-3xl font-bold">
                {data.cisnienie || "—"} 
                {data.cisnienie && <span className="text-base font-normal"> hPa</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Data source info */}
        <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            Dane pochodzą z Instytutu Meteorologii i Gospodarki Wodnej (IMGW).
            Aktualizacja co 30 minut.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
