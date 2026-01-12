import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGeolocation, UserLocation } from "@/hooks/use-geolocation";
import { LocationPrompt } from "./LocationPrompt";

interface LocationContextType {
  location: UserLocation;
  loading: boolean;
  hasLocation: boolean;
  refreshLocation: () => Promise<UserLocation>;
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
  const geolocation = useGeolocation();
  const [showPrompt, setShowPrompt] = useState(false);

  // Show prompt on first visit if no location is set and hasn't been prompted yet
  useEffect(() => {
    if (!geolocation.loading && !geolocation.hasLocation && !geolocation.hasPrompted) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [geolocation.loading, geolocation.hasLocation, geolocation.hasPrompted]);

  const handleLocationSet = (location: UserLocation) => {
    setShowPrompt(false);
    // The geolocation hook already handles saving
  };

  const handleClose = () => {
    setShowPrompt(false);
    geolocation.dismissPrompt();
  };

  const contextValue: LocationContextType = {
    location: geolocation.location,
    loading: geolocation.loading,
    hasLocation: geolocation.hasLocation,
    refreshLocation: geolocation.detectLocation,
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
