import { Sun, Cloud, CloudRain, Wind, Droplets, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface WeatherData {
  city: string;
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: "sun" | "cloud" | "rain";
  forecast: { day: string; temp: number; icon: "sun" | "cloud" | "rain" }[];
}

const WeatherIcon = ({ type, className = "h-6 w-6" }: { type: "sun" | "cloud" | "rain"; className?: string }) => {
  switch (type) {
    case "sun":
      return <Sun className={`${className} text-weather-sunny`} />;
    case "cloud":
      return <Cloud className={`${className} text-weather-cloudy`} />;
    case "rain":
      return <CloudRain className={`${className} text-primary`} />;
  }
};

const getWeatherIcon = (code: number): "sun" | "cloud" | "rain" => {
  if (code === 0 || code === 1) return "sun";
  if (code >= 2 && code <= 3) return "cloud";
  return "rain";
};

const getWeatherDescription = (code: number): string => {
  if (code === 0) return "Bezchmurnie";
  if (code === 1) return "Przeważnie słonecznie";
  if (code === 2) return "Częściowe zachmurzenie";
  if (code === 3) return "Pochmurno";
  if (code >= 45 && code <= 48) return "Mgła";
  if (code >= 51 && code <= 55) return "Mżawka";
  if (code >= 61 && code <= 65) return "Deszcz";
  if (code >= 71 && code <= 77) return "Śnieg";
  if (code >= 80 && code <= 82) return "Przelotne opady";
  if (code >= 95) return "Burza";
  return "Zmienna pogoda";
};

const getDayName = (dateStr: string, index: number): string => {
  if (index === 0) return "Dziś";
  const days = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];
  const date = new Date(dateStr);
  return days[date.getDay()];
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        // Get city name from coordinates
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pl`
        );
        const geoData = await geoResponse.json();
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Nieznana lokalizacja";

        // Get weather from Open-Meteo (free, no API key needed)
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&timezone=Europe/Warsaw&forecast_days=5`
        );
        const weatherData = await weatherResponse.json();

        const forecast = weatherData.daily.time.map((date: string, i: number) => ({
          day: getDayName(date, i),
          temp: Math.round(weatherData.daily.temperature_2m_max[i]),
          icon: getWeatherIcon(weatherData.daily.weather_code[i]),
        }));

        setWeather({
          city,
          temp: Math.round(weatherData.current.temperature_2m),
          description: getWeatherDescription(weatherData.current.weather_code),
          humidity: weatherData.current.relative_humidity_2m,
          windSpeed: Math.round(weatherData.current.wind_speed_10m),
          icon: getWeatherIcon(weatherData.current.weather_code),
          forecast,
        });
      } catch (err) {
        setError("Nie udało się pobrać pogody");
      } finally {
        setLoading(false);
      }
    };

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Default to Warsaw if geolocation denied
          fetchWeather(52.2297, 21.0122);
        }
      );
    } else {
      // Default to Warsaw if geolocation not supported
      fetchWeather(52.2297, 21.0122);
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-5 shadow-sm flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-card rounded-xl p-5 shadow-sm">
        <p className="text-muted-foreground text-sm">{error || "Brak danych"}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        Pogoda - {weather.city}
      </h3>
      
      {/* Current Weather */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <WeatherIcon type={weather.icon} className="h-12 w-12" />
          <div>
            <span className="text-4xl font-bold">{weather.temp}°</span>
            <p className="text-muted-foreground text-sm">{weather.description}</p>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground space-y-1">
          <p className="flex items-center justify-end gap-1">
            <Wind className="h-4 w-4" /> {weather.windSpeed} km/h
          </p>
          <p className="flex items-center justify-end gap-1">
            <Droplets className="h-4 w-4" /> {weather.humidity}%
          </p>
        </div>
      </div>

      {/* Forecast */}
      <div className="flex justify-between">
        {weather.forecast.map((day) => (
          <div key={day.day} className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">{day.day}</span>
            <WeatherIcon type={day.icon} />
            <span className="text-sm font-medium">{day.temp}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}
