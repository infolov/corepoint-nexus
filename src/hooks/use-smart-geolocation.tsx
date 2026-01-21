import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { polandDivisions, getVoivodeships, getPowiats, getGminas } from "@/data/poland-divisions";

export interface UserLocation {
  voivodeship: string | null;
  county: string | null; // powiat
  city: string | null;
  detectedAt?: string;
  method?: "browser" | "ip" | "manual";
}

interface SmartGeolocationState {
  location: UserLocation;
  isDetecting: boolean;
  error: string | null;
  detectionPhase: "idle" | "high_accuracy" | "network" | "ip_fallback" | "success" | "error";
}

type GeolocationErrorType = "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "NOT_SUPPORTED" | "NOT_SECURE" | "UNKNOWN";

interface DetectionResult {
  success: boolean;
  location?: UserLocation;
  error?: GeolocationErrorType;
  message?: string;
}

// Region name mappings from English to Polish voivodeships
const regionMappings: Record<string, string> = {
  'warmia-masuria': 'warmińsko-mazurskie',
  'warmian-masurian': 'warmińsko-mazurskie',
  'warmia-masurian': 'warmińsko-mazurskie',
  'pomeranian': 'pomorskie',
  'masovian': 'mazowieckie',
  'lesser poland': 'małopolskie',
  'silesian': 'śląskie',
  'greater poland': 'wielkopolskie',
  'lower silesian': 'dolnośląskie',
  'łódź': 'łódzkie',
  'lodz': 'łódzkie',
  'kuyavian-pomeranian': 'kujawsko-pomorskie',
  'subcarpathian': 'podkarpackie',
  'lublin': 'lubelskie',
  'west pomeranian': 'zachodniopomorskie',
  'podlaskie': 'podlaskie',
  'holy cross': 'świętokrzyskie',
  'opole': 'opolskie',
  'lubusz': 'lubuskie',
};

// Map coordinates to nearest major cities
const cityCoordinates: Array<{ name: string; voivodeship: string; powiat: string; lat: number; lng: number }> = [
  // Warmińsko-mazurskie
  { name: "Pasłęk", voivodeship: "warmińsko-mazurskie", powiat: "elbląski", lat: 54.0567, lng: 19.6603 },
  { name: "Elbląg", voivodeship: "warmińsko-mazurskie", powiat: "m. Elbląg", lat: 54.1522, lng: 19.4088 },
  { name: "Olsztyn", voivodeship: "warmińsko-mazurskie", powiat: "m. Olsztyn", lat: 53.7784, lng: 20.4801 },
  { name: "Ełk", voivodeship: "warmińsko-mazurskie", powiat: "ełcki", lat: 53.8283, lng: 22.3647 },
  { name: "Ostróda", voivodeship: "warmińsko-mazurskie", powiat: "ostródzki", lat: 53.6958, lng: 19.9658 },
  { name: "Iława", voivodeship: "warmińsko-mazurskie", powiat: "iławski", lat: 53.5963, lng: 19.5686 },
  { name: "Giżycko", voivodeship: "warmińsko-mazurskie", powiat: "giżycki", lat: 54.0382, lng: 21.7662 },
  { name: "Kętrzyn", voivodeship: "warmińsko-mazurskie", powiat: "kętrzyński", lat: 54.0757, lng: 21.3758 },
  { name: "Mrągowo", voivodeship: "warmińsko-mazurskie", powiat: "mrągowski", lat: 53.8661, lng: 21.3056 },
  { name: "Lidzbark Warmiński", voivodeship: "warmińsko-mazurskie", powiat: "lidzbarski", lat: 54.1258, lng: 20.5808 },
  { name: "Braniewo", voivodeship: "warmińsko-mazurskie", powiat: "braniewski", lat: 54.3799, lng: 19.8226 },
  { name: "Bartoszyce", voivodeship: "warmińsko-mazurskie", powiat: "bartoszycki", lat: 54.2532, lng: 20.8108 },
  { name: "Szczytno", voivodeship: "warmińsko-mazurskie", powiat: "szczycieński", lat: 53.5622, lng: 20.9863 },
  { name: "Działdowo", voivodeship: "warmińsko-mazurskie", powiat: "działdowski", lat: 53.2378, lng: 20.1806 },
  { name: "Nidzica", voivodeship: "warmińsko-mazurskie", powiat: "nidzicki", lat: 53.3583, lng: 20.4286 },
  // Pomorskie
  { name: "Gdańsk", voivodeship: "pomorskie", powiat: "m. Gdańsk", lat: 54.3520, lng: 18.6466 },
  { name: "Gdynia", voivodeship: "pomorskie", powiat: "m. Gdynia", lat: 54.5189, lng: 18.5305 },
  { name: "Sopot", voivodeship: "pomorskie", powiat: "m. Sopot", lat: 54.4418, lng: 18.5601 },
  { name: "Słupsk", voivodeship: "pomorskie", powiat: "m. Słupsk", lat: 54.4641, lng: 17.0285 },
  { name: "Tczew", voivodeship: "pomorskie", powiat: "tczewski", lat: 54.0917, lng: 18.7969 },
  { name: "Starogard Gdański", voivodeship: "pomorskie", powiat: "starogardzki", lat: 53.9653, lng: 18.5306 },
  { name: "Wejherowo", voivodeship: "pomorskie", powiat: "wejherowski", lat: 54.6060, lng: 18.2358 },
  { name: "Rumia", voivodeship: "pomorskie", powiat: "wejherowski", lat: 54.5708, lng: 18.3939 },
  { name: "Malbork", voivodeship: "pomorskie", powiat: "malborski", lat: 54.0357, lng: 19.0282 },
  { name: "Pruszcz Gdański", voivodeship: "pomorskie", powiat: "gdański", lat: 54.2622, lng: 18.6347 },
  // Major cities
  { name: "Warszawa", voivodeship: "mazowieckie", powiat: "m. st. Warszawa", lat: 52.2297, lng: 21.0122 },
  { name: "Kraków", voivodeship: "małopolskie", powiat: "m. Kraków", lat: 50.0647, lng: 19.9450 },
  { name: "Wrocław", voivodeship: "dolnośląskie", powiat: "m. Wrocław", lat: 51.1079, lng: 17.0385 },
  { name: "Poznań", voivodeship: "wielkopolskie", powiat: "m. Poznań", lat: 52.4064, lng: 16.9252 },
  { name: "Katowice", voivodeship: "śląskie", powiat: "m. Katowice", lat: 50.2649, lng: 19.0238 },
  { name: "Łódź", voivodeship: "łódzkie", powiat: "m. Łódź", lat: 51.7592, lng: 19.4560 },
  { name: "Szczecin", voivodeship: "zachodniopomorskie", powiat: "m. Szczecin", lat: 53.4285, lng: 14.5528 },
  { name: "Lublin", voivodeship: "lubelskie", powiat: "m. Lublin", lat: 51.2465, lng: 22.5684 },
  { name: "Bydgoszcz", voivodeship: "kujawsko-pomorskie", powiat: "m. Bydgoszcz", lat: 53.1235, lng: 18.0084 },
  { name: "Białystok", voivodeship: "podlaskie", powiat: "m. Białystok", lat: 53.1325, lng: 23.1688 },
  { name: "Rzeszów", voivodeship: "podkarpackie", powiat: "m. Rzeszów", lat: 50.0413, lng: 21.9990 },
  { name: "Toruń", voivodeship: "kujawsko-pomorskie", powiat: "m. Toruń", lat: 53.0138, lng: 18.5984 },
  { name: "Kielce", voivodeship: "świętokrzyskie", powiat: "m. Kielce", lat: 50.8661, lng: 20.6286 },
  { name: "Gorzów Wielkopolski", voivodeship: "lubuskie", powiat: "m. Gorzów Wielkopolski", lat: 52.7368, lng: 15.2288 },
  { name: "Zielona Góra", voivodeship: "lubuskie", powiat: "m. Zielona Góra", lat: 51.9356, lng: 15.5062 },
  { name: "Opole", voivodeship: "opolskie", powiat: "m. Opole", lat: 50.6751, lng: 17.9213 },
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const findNearestCity = (lat: number, lng: number) => {
  let nearest = cityCoordinates[0];
  let minDistance = calculateDistance(lat, lng, nearest.lat, nearest.lng);

  for (const city of cityCoordinates) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }

  return { ...nearest, distance: minDistance };
};

const findCityInDivisions = (cityName: string): { voivodeship: string; powiat: string; city: string } | null => {
  const normalizedCityName = cityName.toLowerCase().trim();
  
  for (const [voivodeship, powiats] of Object.entries(polandDivisions)) {
    for (const [powiat, cities] of Object.entries(powiats)) {
      for (const city of cities) {
        if (city.toLowerCase() === normalizedCityName || 
            normalizedCityName.includes(city.toLowerCase()) ||
            city.toLowerCase().includes(normalizedCityName)) {
          return { voivodeship, powiat, city };
        }
      }
    }
  }
  
  return null;
};

const findVoivodeship = (region: string): string | null => {
  const normalizedRegion = region.toLowerCase().trim();
  
  for (const [key, value] of Object.entries(regionMappings)) {
    if (normalizedRegion.includes(key) || key.includes(normalizedRegion)) {
      return value;
    }
  }
  
  const voivodeships = getVoivodeships();
  for (const v of voivodeships) {
    if (normalizedRegion.includes(v) || v.includes(normalizedRegion)) {
      return v;
    }
  }
  
  return null;
};

const getErrorMessage = (errorType: GeolocationErrorType): string => {
  switch (errorType) {
    case "PERMISSION_DENIED":
      return "Dostęp do lokalizacji został zablokowany. Odblokuj w ustawieniach przeglądarki (ikona kłódki obok adresu).";
    case "POSITION_UNAVAILABLE":
      return "Lokalizacja jest niedostępna. Sprawdź czy GPS jest włączony.";
    case "TIMEOUT":
      return "Przekroczono czas oczekiwania na lokalizację.";
    case "NOT_SUPPORTED":
      return "Twoja przeglądarka nie obsługuje geolokalizacji.";
    case "NOT_SECURE":
      return "Geolokalizacja wymaga bezpiecznego połączenia (HTTPS).";
    default:
      return "Wystąpił nieznany błąd podczas pobierania lokalizacji.";
  }
};

export function useSmartGeolocation() {
  const { user } = useAuth();
  const isDetectingRef = useRef(false);
  
  const [state, setState] = useState<SmartGeolocationState>({
    location: { voivodeship: null, county: null, city: null },
    isDetecting: false,
    error: null,
    detectionPhase: "idle",
  });

  // Save location to localStorage and database
  const saveLocation = useCallback(async (location: UserLocation) => {
    localStorage.setItem("userSettings", JSON.stringify({
      voivodeship: location.voivodeship,
      county: location.county,
      city: location.city,
    }));
    localStorage.setItem("locationPrompted", "true");

    if (user) {
      try {
        const { data: existing } = await supabase
          .from("user_site_settings")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        const siteData = {
          voivodeship: location.voivodeship,
          county: location.county,
          city: location.city,
        };

        if (existing) {
          await supabase
            .from("user_site_settings")
            .update(siteData)
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("user_site_settings")
            .insert({ user_id: user.id, ...siteData });
        }
      } catch (error) {
        console.error("Error saving location to database:", error);
      }
    }
  }, [user]);

  // Browser geolocation with specific options
  const detectWithBrowserOptions = useCallback((
    options: PositionOptions
  ): Promise<DetectionResult> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ success: false, error: "NOT_SUPPORTED" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const nearest = findNearestCity(latitude, longitude);
          const exactMatch = findCityInDivisions(nearest.name);
          
          const location: UserLocation = exactMatch ? {
            voivodeship: exactMatch.voivodeship,
            county: exactMatch.powiat,
            city: exactMatch.city,
            method: "browser",
            detectedAt: new Date().toISOString(),
          } : {
            voivodeship: nearest.voivodeship,
            county: nearest.powiat,
            city: nearest.name,
            method: "browser",
            detectedAt: new Date().toISOString(),
          };

          resolve({ success: true, location });
        },
        (error) => {
          let errorType: GeolocationErrorType;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorType = "PERMISSION_DENIED";
              break;
            case error.POSITION_UNAVAILABLE:
              errorType = "POSITION_UNAVAILABLE";
              break;
            case error.TIMEOUT:
              errorType = "TIMEOUT";
              break;
            default:
              errorType = "UNKNOWN";
          }
          resolve({ success: false, error: errorType });
        },
        options
      );
    });
  }, []);

  // IP-based fallback detection
  const detectWithIP = useCallback(async (): Promise<DetectionResult> => {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const clientIP = ipData.ip;

      const geoResponse = await fetch(`https://ipwho.is/${clientIP}`);
      const geoData = await geoResponse.json();
      
      if (geoData.success && geoData.country === 'Poland') {
        const city = geoData.city?.toLowerCase().trim() || '';
        const region = geoData.region?.toLowerCase().trim() || '';
        
        const cityMatch = findCityInDivisions(city);
        if (cityMatch) {
          return {
            success: true,
            location: {
              voivodeship: cityMatch.voivodeship,
              county: cityMatch.powiat,
              city: cityMatch.city,
              method: "ip",
              detectedAt: new Date().toISOString(),
            }
          };
        }
        
        const voivodeship = findVoivodeship(region);
        if (voivodeship) {
          const powiats = getPowiats(voivodeship);
          for (const powiat of powiats) {
            const cities = getGminas(voivodeship, powiat);
            const matchedCity = cities.find(c => 
              c.toLowerCase() === city || 
              city.includes(c.toLowerCase()) ||
              c.toLowerCase().includes(city)
            );
            if (matchedCity) {
              return {
                success: true,
                location: {
                  voivodeship,
                  county: powiat,
                  city: matchedCity,
                  method: "ip",
                  detectedAt: new Date().toISOString(),
                }
              };
            }
          }
          
          return {
            success: true,
            location: {
              voivodeship,
              county: null,
              city: null,
              method: "ip",
              detectedAt: new Date().toISOString(),
            }
          };
        }
      }
      
      return { success: false, error: "POSITION_UNAVAILABLE", message: "Nie wykryto lokalizacji w Polsce" };
    } catch (error) {
      console.error("IP geolocation error:", error);
      return { success: false, error: "UNKNOWN", message: "Błąd pobierania lokalizacji przez IP" };
    }
  }, []);

  // Main smart detection function with progressive fallback
  const detectLocation = useCallback(async (): Promise<UserLocation | null> => {
    // Prevent multiple simultaneous detections
    if (isDetectingRef.current) {
      console.log("Detection already in progress");
      return null;
    }

    // Security check
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      toast.error("Geolokalizacja wymaga bezpiecznego połączenia HTTPS");
      setState(prev => ({
        ...prev,
        error: "NOT_SECURE",
        detectionPhase: "error",
      }));
      return null;
    }

    isDetectingRef.current = true;
    setState(prev => ({ ...prev, isDetecting: true, error: null, detectionPhase: "high_accuracy" }));

    try {
      // Phase 1: High Accuracy GPS (6s timeout)
      toast.loading("Szukam sygnału GPS...", { id: "geolocation" });
      
      const highAccuracyResult = await detectWithBrowserOptions({
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 0,
      });

      if (highAccuracyResult.success && highAccuracyResult.location) {
        await saveLocation(highAccuracyResult.location);
        setState(prev => ({
          ...prev,
          location: highAccuracyResult.location!,
          isDetecting: false,
          detectionPhase: "success",
        }));
        
        const displayName = highAccuracyResult.location.city || 
          highAccuracyResult.location.county || 
          highAccuracyResult.location.voivodeship;
        toast.success(`Wykryto lokalizację: ${displayName}`, { id: "geolocation" });
        
        isDetectingRef.current = false;
        return highAccuracyResult.location;
      }

      // Check for permission denied - don't fallback, show error immediately
      if (highAccuracyResult.error === "PERMISSION_DENIED") {
        toast.error(getErrorMessage("PERMISSION_DENIED"), { id: "geolocation", duration: 6000 });
        setState(prev => ({
          ...prev,
          isDetecting: false,
          error: "PERMISSION_DENIED",
          detectionPhase: "error",
        }));
        isDetectingRef.current = false;
        return null;
      }

      // Phase 2: Network-based location (10s timeout)
      setState(prev => ({ ...prev, detectionPhase: "network" }));
      toast.loading("Przełączam na lokalizację sieciową...", { id: "geolocation" });

      const networkResult = await detectWithBrowserOptions({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      });

      if (networkResult.success && networkResult.location) {
        await saveLocation(networkResult.location);
        setState(prev => ({
          ...prev,
          location: networkResult.location!,
          isDetecting: false,
          detectionPhase: "success",
        }));
        
        const displayName = networkResult.location.city || 
          networkResult.location.county || 
          networkResult.location.voivodeship;
        toast.success(`Wykryto lokalizację: ${displayName}`, { id: "geolocation" });
        
        isDetectingRef.current = false;
        return networkResult.location;
      }

      // Check for permission denied again
      if (networkResult.error === "PERMISSION_DENIED") {
        toast.error(getErrorMessage("PERMISSION_DENIED"), { id: "geolocation", duration: 6000 });
        setState(prev => ({
          ...prev,
          isDetecting: false,
          error: "PERMISSION_DENIED",
          detectionPhase: "error",
        }));
        isDetectingRef.current = false;
        return null;
      }

      // Phase 3: IP-based fallback
      setState(prev => ({ ...prev, detectionPhase: "ip_fallback" }));
      toast.loading("Próbuję wykryć po adresie IP...", { id: "geolocation" });

      const ipResult = await detectWithIP();

      if (ipResult.success && ipResult.location) {
        await saveLocation(ipResult.location);
        setState(prev => ({
          ...prev,
          location: ipResult.location!,
          isDetecting: false,
          detectionPhase: "success",
        }));
        
        const displayName = ipResult.location.city || 
          ipResult.location.county || 
          ipResult.location.voivodeship;
        toast.success(`Wykryto lokalizację (IP): ${displayName}`, { id: "geolocation" });
        
        isDetectingRef.current = false;
        return ipResult.location;
      }

      // All methods failed
      const errorMsg = "Nie udało się wykryć lokalizacji. Wybierz ręcznie.";
      toast.error(errorMsg, { id: "geolocation" });
      setState(prev => ({
        ...prev,
        isDetecting: false,
        error: errorMsg,
        detectionPhase: "error",
      }));
      
      isDetectingRef.current = false;
      return null;

    } catch (error) {
      console.error("Smart geolocation error:", error);
      const errorMsg = "Wystąpił błąd podczas wykrywania lokalizacji";
      toast.error(errorMsg, { id: "geolocation" });
      setState(prev => ({
        ...prev,
        isDetecting: false,
        error: errorMsg,
        detectionPhase: "error",
      }));
      
      isDetectingRef.current = false;
      return null;
    }
  }, [detectWithBrowserOptions, detectWithIP, saveLocation]);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, detectionPhase: "idle" }));
  }, []);

  // Check if secure context
  const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : true;

  return {
    ...state,
    detectLocation,
    saveLocation,
    clearError,
    isSecureContext,
  };
}
