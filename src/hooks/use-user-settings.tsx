import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface UserSettings {
  language: string;
  voivodeship: string | null;
}

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    language: "pl",
    voivodeship: null,
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
      const parsed = JSON.parse(localSettings);
      setSettings({
        language: parsed.language || "pl",
        voivodeship: parsed.voivodeship || null,
      });
    }

    // If logged in, fetch from database (overrides localStorage)
    if (user) {
      try {
        const { data, error } = await supabase
          .from("user_site_settings")
          .select("language, voivodeship")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          setSettings({
            language: data.language || "pl",
            voivodeship: data.voivodeship || null,
          });
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

  return { settings, loading, refreshSettings };
}
