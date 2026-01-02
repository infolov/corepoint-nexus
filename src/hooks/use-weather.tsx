import { useState, useEffect } from "react";

interface WeatherData {
  id_stacji: string;
  stacja: string;
  temperatura: string;
  predkosc_wiatru: string;
  kierunek_wiatru: string;
  wilgotnosc_wzgledna: string;
  suma_opadu: string;
  cisnienie: string | null;
  data_pomiaru: string;
  godzina_pomiaru: string;
}

interface WeatherState {
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;
}

// Station coordinates for finding nearest station
interface StationCoords {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

const STATIONS: StationCoords[] = [
  { id: "12295", name: "Białystok", lat: 53.1325, lon: 23.1688 },
  { id: "12600", name: "Bielsko Biała", lat: 49.8225, lon: 19.0444 },
  { id: "12235", name: "Chojnice", lat: 53.6972, lon: 17.5631 },
  { id: "12550", name: "Częstochowa", lat: 50.8118, lon: 19.1203 },
  { id: "12160", name: "Elbląg", lat: 54.1522, lon: 19.4044 },
  { id: "12155", name: "Gdańsk", lat: 54.3520, lon: 18.6466 },
  { id: "12300", name: "Gorzów", lat: 52.7368, lon: 15.2288 },
  { id: "12135", name: "Hel", lat: 54.6083, lon: 18.8012 },
  { id: "12500", name: "Jelenia Góra", lat: 50.9044, lon: 15.7197 },
  { id: "12435", name: "Kalisz", lat: 51.7611, lon: 18.0919 },
  { id: "12650", name: "Kasprowy Wierch", lat: 49.2319, lon: 19.9817 },
  { id: "12560", name: "Katowice", lat: 50.2649, lon: 19.0238 },
  { id: "12185", name: "Kętrzyn", lat: 54.0761, lon: 21.3747 },
  { id: "12570", name: "Kielce", lat: 50.8661, lon: 20.6286 },
  { id: "12520", name: "Kłodzko", lat: 50.4347, lon: 16.6614 },
  { id: "12345", name: "Koło", lat: 52.2006, lon: 18.6361 },
  { id: "12100", name: "Kołobrzeg", lat: 54.1758, lon: 15.5833 },
  { id: "12105", name: "Koszalin", lat: 54.1944, lon: 16.1722 },
  { id: "12488", name: "Kozienice", lat: 51.5836, lon: 21.5583 },
  { id: "12566", name: "Kraków", lat: 50.0647, lon: 19.9450 },
  { id: "12670", name: "Krosno", lat: 49.6886, lon: 21.7700 },
  { id: "12415", name: "Legnica", lat: 51.2070, lon: 16.1619 },
  { id: "12690", name: "Lesko", lat: 49.4700, lon: 22.3289 },
  { id: "12418", name: "Leszno", lat: 51.8400, lon: 16.5756 },
  { id: "12125", name: "Lębork", lat: 54.5392, lon: 17.7483 },
  { id: "12495", name: "Lublin", lat: 51.2465, lon: 22.5684 },
  { id: "12120", name: "Łeba", lat: 54.7536, lon: 17.5314 },
  { id: "12465", name: "Łódź", lat: 51.7592, lon: 19.4550 },
  { id: "12280", name: "Mikołajki", lat: 53.8017, lon: 21.5708 },
  { id: "12270", name: "Mława", lat: 53.1119, lon: 20.3769 },
  { id: "12660", name: "Nowy Sącz", lat: 49.6250, lon: 20.6903 },
  { id: "12272", name: "Olsztyn", lat: 53.7792, lon: 20.4942 },
  { id: "12530", name: "Opole", lat: 50.6751, lon: 17.9213 },
  { id: "12285", name: "Ostrołęka", lat: 53.0842, lon: 21.5742 },
  { id: "12230", name: "Piła", lat: 53.1519, lon: 16.7383 },
  { id: "12360", name: "Płock", lat: 52.5464, lon: 19.7064 },
  { id: "12330", name: "Poznań", lat: 52.4064, lon: 16.9252 },
  { id: "12695", name: "Przemyśl", lat: 49.7839, lon: 22.7678 },
  { id: "12540", name: "Racibórz", lat: 50.0919, lon: 18.2192 },
  { id: "12210", name: "Resko", lat: 53.7667, lon: 15.4167 },
  { id: "12580", name: "Rzeszów", lat: 50.0412, lon: 21.9991 },
  { id: "12585", name: "Sandomierz", lat: 50.6828, lon: 21.7489 },
  { id: "12385", name: "Siedlce", lat: 52.1676, lon: 22.2900 },
  { id: "12310", name: "Słubice", lat: 52.3522, lon: 14.5594 },
  { id: "12469", name: "Sulejów", lat: 51.3550, lon: 19.8714 },
  { id: "12195", name: "Suwałki", lat: 54.1003, lon: 22.9308 },
  { id: "12205", name: "Szczecin", lat: 53.4285, lon: 14.5528 },
  { id: "12215", name: "Szczecinek", lat: 53.7072, lon: 16.6994 },
  { id: "12510", name: "Śnieżka", lat: 50.7361, lon: 15.7397 },
  { id: "12200", name: "Świnoujście", lat: 53.9103, lon: 14.2453 },
  { id: "12575", name: "Tarnów", lat: 50.0121, lon: 20.9858 },
  { id: "12399", name: "Terespol", lat: 52.0747, lon: 23.6156 },
  { id: "12250", name: "Toruń", lat: 53.0138, lon: 18.5981 },
  { id: "12115", name: "Ustka", lat: 54.5803, lon: 16.8614 },
  { id: "12375", name: "Warszawa", lat: 52.2297, lon: 21.0122 },
  { id: "12455", name: "Wieluń", lat: 51.2206, lon: 18.5697 },
  { id: "12497", name: "Włodawa", lat: 51.5508, lon: 23.5475 },
  { id: "12424", name: "Wrocław", lat: 51.1079, lon: 17.0385 },
  { id: "12625", name: "Zakopane", lat: 49.2992, lon: 19.9496 },
  { id: "12595", name: "Zamość", lat: 50.7231, lon: 23.2517 },
  { id: "12400", name: "Zielona Góra", lat: 51.9356, lon: 15.5062 },
];

// Calculate distance between two points using Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest station to given coordinates
function findNearestStation(lat: number, lon: number): StationCoords {
  let nearest = STATIONS[0];
  let minDistance = getDistance(lat, lon, nearest.lat, nearest.lon);

  for (const station of STATIONS) {
    const distance = getDistance(lat, lon, station.lat, station.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = station;
    }
  }

  return nearest;
}

export function useWeather(defaultStationId: string = "12375") {
  const [state, setState] = useState<WeatherState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [stationId, setStationId] = useState<string | null>(null);
  const [geoResolved, setGeoResolved] = useState(false);

  // Get user's location and find nearest station FIRST
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nearest = findNearestStation(
            position.coords.latitude,
            position.coords.longitude
          );
          console.log(`Geolocation: ${position.coords.latitude}, ${position.coords.longitude} -> Nearest station: ${nearest.name} (${nearest.id})`);
          setStationId(nearest.id);
          setGeoResolved(true);
        },
        (error) => {
          // Geolocation denied or failed, use default (Warszawa)
          console.log(`Geolocation failed: ${error.message}, using default station`);
          setStationId(defaultStationId);
          setGeoResolved(true);
        },
        { 
          timeout: 10000, // 10 second timeout
          maximumAge: 300000, // 5 min cache (shorter for accuracy)
          enableHighAccuracy: true // Request high accuracy
        }
      );
    } else {
      // No geolocation support
      console.log("Geolocation not supported, using default station");
      setStationId(defaultStationId);
      setGeoResolved(true);
    }
  }, [defaultStationId]);

  const fetchWeather = async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(
        `https://danepubliczne.imgw.pl/api/data/synop/id/${id}`
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

  // Fetch weather data ONLY after geolocation is resolved
  useEffect(() => {
    if (!geoResolved || !stationId) return;
    
    fetchWeather(stationId);
    
    // Refresh weather every 30 minutes
    const interval = setInterval(() => fetchWeather(stationId), 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [stationId, geoResolved]);

  const refetch = () => {
    if (stationId) {
      fetchWeather(stationId);
    }
  };

  return { ...state, stationId: stationId || defaultStationId, refetch };
}

export { STATIONS, findNearestStation };
export type { WeatherData, StationCoords };
