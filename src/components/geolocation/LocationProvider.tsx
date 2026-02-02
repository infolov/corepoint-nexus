import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useSmartGeolocation, UserLocation, Coordinates } from "@/hooks/use-smart-geolocation";
import { LocationPrompt } from "./LocationPrompt";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface LocationContextType {
  location: UserLocation;
  loading: boolean;
  hasLocation: boolean;
  refreshLocation: () => Promise<UserLocation | null>;
  showLocationPrompt: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationContext must be used within LocationProvider");
  }
  return context;
}

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const { user } = useAuth();
  const smartGeo = useSmartGeolocation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [location, setLocation] = useState<UserLocation>({
    voivodeship: null,
    county: null,
    city: null,
    coordinates: null,
  });
  const [loading, setLoading] = useState(true);
  const [hasPrompted, setHasPrompted] = useState(false);

  // Load saved location on mount
  useEffect(() => {
    const loadSavedLocation = async () => {
      setLoading(true);
      
      // First check localStorage
      const localSettings = localStorage.getItem("userSettings");
      let loadedLocation: UserLocation = { voivodeship: null, county: null, city: null, coordinates: null };
      
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
          // Properly parse coordinates object
          let coordinates: { lat: number; lng: number } | null = null;
          if (parsed.coordinates && typeof parsed.coordinates === 'object') {
            const lat = parseFloat(parsed.coordinates.lat);
            const lng = parseFloat(parsed.coordinates.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
              coordinates = { lat, lng };
            }
          }
          loadedLocation = {
            voivodeship: parsed.voivodeship || null,
            county: parsed.county || null,
            city: parsed.city || null,
            coordinates,
          };
          console.log("LocationProvider: Loaded from localStorage:", loadedLocation);
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
            // Keep coordinates from localStorage if available
            loadedLocation = {
              voivodeship: data.voivodeship || null,
              county: data.county || null,
              city: data.city || null,
              coordinates: loadedLocation.coordinates,
            };
            localStorage.setItem("userSettings", JSON.stringify(loadedLocation));
            console.log("LocationProvider: Merged with DB data:", loadedLocation);
          }
        } catch (error) {
          console.error("Error loading location from database:", error);
        }
      }

      const prompted = localStorage.getItem("locationPrompted") === "true";
      setHasPrompted(prompted);
      setLocation(loadedLocation);
      setLoading(false);
    };

    loadSavedLocation();
  }, [user]);

  // Show prompt on first visit if no location is set
  useEffect(() => {
    if (!loading && !hasLocation && !hasPrompted) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, hasPrompted]);

  const hasLocation = !!(location.voivodeship || location.city || location.coordinates);

  const handleLocationSet = useCallback((newLocation: UserLocation) => {
    setLocation(newLocation);
    setShowPrompt(false);
    setHasPrompted(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem("locationPrompted", "true");
    setHasPrompted(true);
  }, []);

  const refreshLocation = useCallback(async () => {
    const newLocation = await smartGeo.detectLocation();
    if (newLocation) {
      setLocation(newLocation);
    }
    return newLocation;
  }, [smartGeo]);

  const contextValue: LocationContextType = {
    location,
    loading,
    hasLocation,
    refreshLocation,
    showLocationPrompt: () => setShowPrompt(true),
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
      <LocationPrompt
        open={showPrompt}
        onClose={handleClose}
        onLocationSet={handleLocationSet}
      />
    </LocationContext.Provider>
  );
}