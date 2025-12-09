import { useState } from "react";
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudFog, Wind, Droplets, 
  MapPin, RefreshCw, Thermometer, Eye, Gauge, Sunrise, Sunset,
  CloudLightning
} from "lucide-react";
import { useWeather } from "@/hooks/use-weather";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Map OpenWeatherMap icon codes to Lucide icons
const getWeatherIcon = (iconCode: string, className?: string) => {
  const baseClass = cn("w-8 h-8", className);
  
  switch (iconCode) {
    case "01d":
    case "01n":
      return <Sun className={cn(baseClass, "text-yellow-400")} />;
    case "02d":
    case "02n":
    case "03d":
    case "03n":
    case "04d":
    case "04n":
      return <Cloud className={cn(baseClass, "text-gray-400")} />;
    case "09d":
    case "09n":
    case "10d":
    case "10n":
      return <CloudRain className={cn(baseClass, "text-blue-400")} />;
    case "11d":
    case "11n":
      return <CloudLightning className={cn(baseClass, "text-yellow-500")} />;
    case "13d":
    case "13n":
      return <CloudSnow className={cn(baseClass, "text-blue-200")} />;
    case "50d":
    case "50n":
      return <CloudFog className={cn(baseClass, "text-gray-300")} />;
    default:
      return <Sun className={cn(baseClass, "text-yellow-400")} />;
  }
};

const getDayName = (timestamp: number, index: number) => {
  if (index === 0) return "Dziś";
  const date = new Date(timestamp * 1000);
  const days = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];
  return days[date.getDay()];
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function WeatherPanel() {
  const { weather, loading, error, locationName, refetch } = useWeather();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-5" />
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div>
              <Skeleton className="h-10 w-20 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-card rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Pogoda
          </h3>
          <button 
            onClick={handleRefresh}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </button>
        </div>
        <p className="text-muted-foreground text-sm">
          {error || "Nie udało się pobrać danych pogodowych"}
        </p>
      </div>
    );
  }

  const { current, forecast } = weather;

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {locationName || current.city}
        </h3>
        <button 
          onClick={handleRefresh}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Odśwież pogodę"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </button>
      </div>

      {/* Current Weather */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          {getWeatherIcon(current.icon, "w-14 h-14")}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{current.temp}°</span>
              <span className="text-muted-foreground text-sm">C</span>
            </div>
            <p className="text-muted-foreground text-sm capitalize">{current.description}</p>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground space-y-1.5">
          <p className="flex items-center justify-end gap-1.5">
            <Thermometer className="h-4 w-4" />
            <span>Odczuwalna: {current.feels_like}°</span>
          </p>
          <p className="flex items-center justify-end gap-1.5">
            <Wind className="h-4 w-4" />
            <span>{current.wind_speed} km/h</span>
          </p>
          <p className="flex items-center justify-end gap-1.5">
            <Droplets className="h-4 w-4" />
            <span>{current.humidity}%</span>
          </p>
        </div>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-4 gap-2 mb-6 pb-4 border-b border-border text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-1">
          <Gauge className="h-4 w-4" />
          <span>{current.pressure} hPa</span>
        </div>
        {current.visibility && (
          <div className="flex flex-col items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{current.visibility} km</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-1">
          <Sunrise className="h-4 w-4" />
          <span>{formatTime(current.sunrise)}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Sunset className="h-4 w-4" />
          <span>{formatTime(current.sunset)}</span>
        </div>
      </div>

      {/* Forecast */}
      <div className="flex justify-between">
        {forecast.map((day, index) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">{getDayName(day.date, index)}</span>
            {getWeatherIcon(day.icon, "w-6 h-6")}
            <span className="text-sm font-medium">{day.temp}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}
