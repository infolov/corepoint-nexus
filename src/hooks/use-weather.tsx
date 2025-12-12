import { useState, useEffect } from "react";

interface WeatherData {
  stacja: string;
  temperatura: string;
  predkosc_wiatru: string;
  kierunek_wiatru: string;
  wilgotnosc_wzgledna: string;
  suma_opadu: string;
  cisnienie: string;
  data_pomiaru: string;
  godzina_pomiaru: string;
}

interface WeatherState {
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;
}

// Map of major Polish cities to their IMGW station IDs
const STATION_IDS: Record<string, string> = {
  "warszawa": "12375",
  "krakow": "12566",
  "gdansk": "12150",
  "wroclaw": "12424",
  "poznan": "12330",
  "lodz": "12465",
  "szczecin": "12205",
  "lublin": "12495",
  "katowice": "12560",
  "bialystok": "12295",
  "gdynia": "12151",
  "jelenia-gora": "12500",
};

export function useWeather(stationId: string = "12375") {
  const [state, setState] = useState<WeatherState>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await fetch(
          `https://danepubliczne.imgw.pl/api/data/synop/id/${stationId}`
        );
        
        if (!response.ok) {
          throw new Error("Nie udało się pobrać danych pogodowych");
        }
        
        const data = await response.json();
        setState({ data, isLoading: false, error: null });
      } catch (err) {
        setState({ 
          data: null, 
          isLoading: false, 
          error: err instanceof Error ? err.message : "Błąd pobierania pogody" 
        });
      }
    };

    fetchWeather();
    
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [stationId]);

  return state;
}

export { STATION_IDS };
export type { WeatherData };
