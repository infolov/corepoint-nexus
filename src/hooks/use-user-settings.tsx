import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface UserSettings {
  language: string;
  voivodeship: string | null;
  county: string | null;  // powiat
  city: string | null;
  locality: string | null; // gmina
}

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    language: "pl",
    voivodeship: null,
    county: null,
    city: null,
    locality: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    setLoading(true);

    // First try localStorage
    const localSettings = localStorage.getItem("userSettings");
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        setSettings({
          language: parsed.language || "pl",
          voivodeship: parsed.voivodeship || null,
          county: parsed.county || null,
          city: parsed.city || null,
          locality: parsed.locality || null,
        });
      } catch (e) {
        console.error("Error parsing local settings:", e);
      }
    }

    // If logged in, fetch from database (overrides localStorage)
    if (user) {
      try {
        const { data, error } = await supabase
          .from("user_site_settings")
          .select("language, voivodeship, county, city, locality")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          const dbSettings = {
            language: data.language || "pl",
            voivodeship: data.voivodeship || null,
            county: data.county || null,
            city: data.city || null,
            locality: data.locality || null,
          };
          setSettings(dbSettings);
          // Sync to localStorage
          localStorage.setItem("userSettings", JSON.stringify(dbSettings));
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    }

    setLoading(false);
  };

  const refreshSettings = () => {
    loadSettings();
  };

  // Helper to get UserLocation for auction engine
  const getUserLocation = () => ({
    voivodeship: settings.voivodeship || undefined,
    powiat: settings.county || undefined,
    gmina: settings.locality || undefined,
    city: settings.city || undefined,
  });

  return { settings, loading, refreshSettings, getUserLocation };
}
