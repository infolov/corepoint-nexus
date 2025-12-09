import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  city: string;
  country: string;
  sunrise: number;
  sunset: number;
  pressure: number;
  visibility: number | null;
}

interface ForecastDay {
  date: number;
  temp: number;
  icon: string;
  description: string;
}

interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
}

interface UseWeatherResult {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  locationName: string | null;
  refetch: () => void;
}

export function useWeather(): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  const fetchWeather = useCallback(async (lat?: number, lon?: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-weather", {
        body: { lat, lon },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setWeather(data);
      setLocationName(data.current.city);
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError(err instanceof Error ? err.message : "Błąd pobierania pogody");
    } finally {
      setLoading(false);
    }
  }, []);

  const getLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
          // Fallback to default location (Warsaw)
          fetchWeather();
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    } else {
      // Fallback to default location
      fetchWeather();
    }
  }, [fetchWeather]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const refetch = useCallback(() => {
    getLocation();
  }, [getLocation]);

  return { weather, loading, error, locationName, refetch };
}
