import { useState, useCallback, useEffect } from "react";
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

interface GeolocationState {
  location: UserLocation;
  loading: boolean;
  error: string | null;
  hasPrompted: boolean;
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

// Map coordinates to nearest major cities (approximate)
const cityCoordinates: Array<{ name: string; voivodeship: string; powiat: string; lat: number; lng: number }> = [
  { name: "Pasłęk", voivodeship: "warmińsko-mazurskie", powiat: "elbląski", lat: 54.0567, lng: 19.6603 },
  { name: "Elbląg", voivodeship: "warmińsko-mazurskie", powiat: "m. Elbląg", lat: 54.1522, lng: 19.4088 },
  { name: "Olsztyn", voivodeship: "warmińsko-mazurskie", powiat: "m. Olsztyn", lat: 53.7784, lng: 20.4801 },
  { name: "Gdańsk", voivodeship: "pomorskie", powiat: "m. Gdańsk", lat: 54.3520, lng: 18.6466 },
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
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
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

// Find city in Poland divisions data
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

// Find voivodeship from region name
const findVoivodeship = (region: string): string | null => {
  const normalizedRegion = region.toLowerCase().trim();
  
  // Check mappings first
  for (const [key, value] of Object.entries(regionMappings)) {
    if (normalizedRegion.includes(key) || key.includes(normalizedRegion)) {
      return value;
    }
  }
  
  // Check direct voivodeship names
  const voivodeships = getVoivodeships();
  for (const v of voivodeships) {
    if (normalizedRegion.includes(v) || v.includes(normalizedRegion)) {
      return v;
    }
  }
  
  return null;
};

export function useGeolocation() {
  const { user } = useAuth();
  const [state, setState] = useState<GeolocationState>({
    location: {
      voivodeship: null,
      county: null,
      city: null,
    },
    loading: true,
    error: null,
    hasPrompted: false,
  });

  // Load saved location from localStorage and database
  const loadSavedLocation = useCallback(async () => {
    // First check localStorage
    const localSettings = localStorage.getItem("userSettings");
    let location: UserLocation = { voivodeship: null, county: null, city: null };
    
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        location = {
          voivodeship: parsed.voivodeship || null,
          county: parsed.county || null,
          city: parsed.city || null,
        };
      } catch (e) {
        console.error("Error parsing local settings:", e);
      }
    }

    // If logged in, fetch from database (overrides localStorage)
    if (user) {
      try {
        const { data, error } = await supabase
          .from("user_site_settings")
          .select("voivodeship, county, city")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          location = {
            voivodeship: data.voivodeship || null,
            county: data.county || null,
            city: data.city || null,
          };
          // Sync to localStorage
          localStorage.setItem("userSettings", JSON.stringify(location));
        }
      } catch (error) {
        console.error("Error loading location from database:", error);
      }
    }

    const hasPrompted = localStorage.getItem("locationPrompted") === "true";
    
    setState(prev => ({
      ...prev,
      location,
      loading: false,
      hasPrompted,
    }));

    return location;
  }, [user]);

  // Save location to localStorage and database
  const saveLocation = useCallback(async (location: UserLocation) => {
    // Save to localStorage
    localStorage.setItem("userSettings", JSON.stringify({
      voivodeship: location.voivodeship,
      county: location.county,
      city: location.city,
    }));
    localStorage.setItem("locationPrompted", "true");

    // Save to database if logged in
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

    setState(prev => ({
      ...prev,
      location,
      hasPrompted: true,
    }));
  }, [user]);

  // Detect location using browser Geolocation API
  const detectWithBrowser = useCallback((): Promise<UserLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolokalizacja nie jest obsługiwana"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const nearest = findNearestCity(latitude, longitude);
          
          // Also try to find exact match in divisions
          const exactMatch = findCityInDivisions(nearest.name);
          
          if (exactMatch) {
            resolve({
              voivodeship: exactMatch.voivodeship,
              county: exactMatch.powiat,
              city: exactMatch.city,
              method: "browser",
              detectedAt: new Date().toISOString(),
            });
          } else {
            resolve({
              voivodeship: nearest.voivodeship,
              county: nearest.powiat,
              city: nearest.name,
              method: "browser",
              detectedAt: new Date().toISOString(),
            });
          }
        },
        (error) => {
          console.error("Browser geolocation error:", error);
          reject(new Error("Nie udało się uzyskać lokalizacji z przeglądarki"));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    });
  }, []);

  // Detect location using IP geolocation as fallback
  const detectWithIP = useCallback(async (): Promise<UserLocation> => {
    try {
      // Get client IP
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const clientIP = ipData.ip;

      // Call geolocation API
      const geoResponse = await fetch(`https://ipwho.is/${clientIP}`);
      const geoData = await geoResponse.json();
      
      if (geoData.success && geoData.country === 'Poland') {
        const city = geoData.city?.toLowerCase().trim() || '';
        const region = geoData.region?.toLowerCase().trim() || '';
        
        // Try to find matching city first
        const cityMatch = findCityInDivisions(city);
        if (cityMatch) {
          return {
            voivodeship: cityMatch.voivodeship,
            county: cityMatch.powiat,
            city: cityMatch.city,
            method: "ip",
            detectedAt: new Date().toISOString(),
          };
        }
        
        // Try to find matching voivodeship
        const voivodeship = findVoivodeship(region);
        if (voivodeship) {
          // Try to find city in that voivodeship
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
                voivodeship,
                county: powiat,
                city: matchedCity,
                method: "ip",
                detectedAt: new Date().toISOString(),
              };
            }
          }
          
          // Return just voivodeship if no city match
          return {
            voivodeship,
            county: null,
            city: null,
            method: "ip",
            detectedAt: new Date().toISOString(),
          };
        }
      }
      
      throw new Error("Nie wykryto lokalizacji w Polsce");
    } catch (error) {
      console.error("IP geolocation error:", error);
      throw new Error("Nie udało się wykryć lokalizacji przez IP");
    }
  }, []);

  // Main detection function - tries browser first, then IP
  const detectLocation = useCallback(async (): Promise<UserLocation> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Try browser geolocation first
      const location = await detectWithBrowser();
      await saveLocation(location);
      setState(prev => ({ ...prev, loading: false, location }));
      return location;
    } catch (browserError) {
      console.log("Browser geolocation failed, trying IP...");
      
      try {
        // Fallback to IP geolocation
        const location = await detectWithIP();
        await saveLocation(location);
        setState(prev => ({ ...prev, loading: false, location }));
        return location;
      } catch (ipError) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: "Nie udało się wykryć lokalizacji" 
        }));
        throw ipError;
      }
    }
  }, [detectWithBrowser, detectWithIP, saveLocation]);

  // Mark that user has been prompted (dismissed without selecting)
  const dismissPrompt = useCallback(() => {
    localStorage.setItem("locationPrompted", "true");
    setState(prev => ({ ...prev, hasPrompted: true }));
  }, []);

  // Reset location (for testing or user wants to change)
  const resetLocation = useCallback(() => {
    localStorage.removeItem("userSettings");
    localStorage.removeItem("locationPrompted");
    setState({
      location: { voivodeship: null, county: null, city: null },
      loading: false,
      error: null,
      hasPrompted: false,
    });
  }, []);

  // Load saved location on mount
  useEffect(() => {
    loadSavedLocation();
  }, [loadSavedLocation]);

  return {
    ...state,
    detectLocation,
    detectWithBrowser,
    detectWithIP,
    saveLocation,
    dismissPrompt,
    resetLocation,
    hasLocation: !!(state.location.voivodeship || state.location.city),
  };
}
