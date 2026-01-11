import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { Json } from "@/integrations/supabase/types";

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: unknown;
  description: string | null;
  updated_at: string;
}

export function useSiteSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [rawSettings, setRawSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("site_settings")
        .select("*")
        .order("setting_key");

      if (fetchError) throw fetchError;

      const settingsMap: Record<string, unknown> = {};
      (data || []).forEach((s) => {
        settingsMap[s.setting_key] = s.setting_value;
      });

      setSettings(settingsMap);
      setRawSettings(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching site settings:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: Json): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from("site_settings")
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("setting_key", key);

      if (updateError) throw updateError;

      setSettings((prev) => ({ ...prev, [key]: value }));
      return true;
    } catch (err) {
      console.error("Error updating setting:", err);
      return false;
    }
  };

  const getSetting = <T,>(key: string, defaultValue: T): T => {
    if (key in settings) {
      return settings[key] as T;
    }
    return defaultValue;
  };

  return {
    settings,
    rawSettings,
    loading,
    error,
    updateSetting,
    getSetting,
    refetch: fetchSettings,
  };
}
