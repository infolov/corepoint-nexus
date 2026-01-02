import { Sun, Moon, Cloud, CloudRain, MapPin, Loader2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWeather } from "@/hooks/use-weather";
import { Button } from "@/components/ui/button";

// Check if it's currently daytime (simplified: 6:00 - 20:00)
const isDaytime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 20;
};

// Get weather icon based on precipitation and time
const getWeatherIcon = (precipitation: string) => {
  const precip = parseFloat(precipitation);
  
  if (precip > 0) {
    return <CloudRain className="h-10 w-10 text-primary" />;
  }
  
  if (isDaytime()) {
    return <Sun className="h-10 w-10 text-weather-sunny" />;
  }
  
  return <Moon className="h-10 w-10 text-muted-foreground" />;
};

export function WeatherWidget() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useWeather();

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl border border-white/20 p-5 shadow-lg">
        <div className="flex items-center justify-center h-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-transparent backdrop-blur-xl border border-border p-5 shadow-lg">
        <div className="flex items-center justify-center h-24">
          <p className="text-sm text-muted-foreground">{error || "Brak danych pogodowych"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl border border-white/20 p-5 shadow-lg group hover:border-primary/30 transition-all duration-300">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-weather-sunny/10 rounded-full blur-xl" />
      
      <div className="relative z-10">
        {/* Header with location */}
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium truncate">{data.stacja}</span>
        </div>
        
        {/* Main weather display */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {getWeatherIcon(data.suma_opadu)}
            <div>
              <span className="text-4xl font-bold tracking-tight">
                {Math.round(parseFloat(data.temperatura))}°
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {parseFloat(data.suma_opadu) > 0 ? "Opady" : isDaytime() ? "Słonecznie" : "Bezchmurnie"}
              </p>
            </div>
          </div>
        </div>

        {/* More button */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/pogoda-szczegoly")}
          className="w-full justify-between text-sm font-medium hover:bg-primary/10 -mx-1"
        >
          Więcej szczegółów
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
