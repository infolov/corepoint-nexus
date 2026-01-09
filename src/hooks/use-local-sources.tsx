import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUserSettings } from "@/hooks/use-user-settings";
import { supabase } from "@/integrations/supabase/client";
import { voivodeshipSlugMap } from "@/data/local-news-sources";

export interface LocalSource {
  id: string;
  url: string;
  sourceName: string;
  voivodeship: string;
  sourceType: 'rss' | 'scrape';
  isActive: boolean;
  isSystem: boolean;
  isEnabled?: boolean; // User preference
}

export function useLocalSources() {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const [sources, setSources] = useState<LocalSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get normalized voivodeship slug
  const getVoivodeshipSlug = useCallback((voivodeship: string | null): string | null => {
    if (!voivodeship) return null;
    return voivodeshipSlugMap[voivodeship.toLowerCase()] || voivodeship.toLowerCase();
  }, []);

  // Fetch sources for a voivodeship
  const fetchSources = useCallback(async (voivodeship?: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const targetVoivodeship = voivodeship || settings.voivodeship;
      const normalizedVoivodeship = getVoivodeshipSlug(targetVoivodeship);

      if (!normalizedVoivodeship) {
        setSources([]);
        setLoading(false);
        return;
      }

      // Fetch all active sources for the voivodeship
      const { data: sourcesData, error: sourcesError } = await supabase
        .from("local_news_sources")
        .select("*")
        .eq("voivodeship", normalizedVoivodeship)
        .eq("is_active", true);

      if (sourcesError) throw sourcesError;

      // If user is logged in, fetch their preferences
      let userPreferences: Record<string, boolean> = {};
      if (user) {
        const { data: prefsData } = await supabase
          .from("user_local_sources")
          .select("source_id, is_enabled")
          .eq("user_id", user.id);

        if (prefsData) {
          userPreferences = prefsData.reduce((acc, pref) => {
            acc[pref.source_id] = pref.is_enabled;
            return acc;
          }, {} as Record<string, boolean>);
        }
      }

      // Map sources with user preferences
      const mappedSources: LocalSource[] = (sourcesData || []).map(source => ({
        id: source.id,
        url: source.url,
        sourceName: source.source_name,
        voivodeship: source.voivodeship,
        sourceType: source.source_type as 'rss' | 'scrape',
        isActive: source.is_active,
        isSystem: source.is_system,
        isEnabled: user 
          ? (userPreferences[source.id] ?? true) // Default to enabled if no preference
          : true
      }));

      setSources(mappedSources);
    } catch (err) {
      console.error("Error fetching local sources:", err);
      setError(err instanceof Error ? err.message : "Błąd pobierania źródeł");
    } finally {
      setLoading(false);
    }
  }, [user, settings.voivodeship, getVoivodeshipSlug]);

  // Toggle source enabled/disabled for user
  const toggleSource = async (sourceId: string, enabled: boolean) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("user_local_sources")
        .upsert({
          user_id: user.id,
          source_id: sourceId,
          is_enabled: enabled
        }, {
          onConflict: "user_id,source_id"
        });

      if (error) throw error;

      // Update local state
      setSources(prev => prev.map(s => 
        s.id === sourceId ? { ...s, isEnabled: enabled } : s
      ));

      return true;
    } catch (err) {
      console.error("Error toggling source:", err);
      return false;
    }
  };

  // Add custom source (non-system)
  const addCustomSource = async (url: string, sourceName: string, voivodeship: string) => {
    if (!user) return null;

    try {
      const normalizedVoivodeship = getVoivodeshipSlug(voivodeship);
      if (!normalizedVoivodeship) throw new Error("Nieprawidłowe województwo");

      const { data, error } = await supabase
        .from("local_news_sources")
        .insert({
          url,
          source_name: sourceName,
          voivodeship: normalizedVoivodeship,
          source_type: 'rss',
          is_system: false,
          added_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh sources
      await fetchSources();

      return data;
    } catch (err) {
      console.error("Error adding custom source:", err);
      throw err;
    }
  };

  // Auto-add sources for user when they set their voivodeship
  const autoAddSourcesForVoivodeship = async (voivodeship: string) => {
    if (!user) return 0;

    try {
      const normalizedVoivodeship = getVoivodeshipSlug(voivodeship);
      if (!normalizedVoivodeship) return 0;

      const { data, error } = await supabase
        .rpc("auto_add_local_sources_for_user", {
          p_user_id: user.id,
          p_voivodeship: normalizedVoivodeship
        });

      if (error) throw error;

      return data || 0;
    } catch (err) {
      console.error("Error auto-adding sources:", err);
      return 0;
    }
  };

  // Get enabled sources URLs for fetching
  const getEnabledSourceUrls = useCallback((): string[] => {
    return sources
      .filter(s => s.isEnabled !== false)
      .map(s => s.url);
  }, [sources]);

  // Initial fetch
  useEffect(() => {
    if (settings.voivodeship) {
      fetchSources();
    }
  }, [settings.voivodeship, fetchSources]);

  return {
    sources,
    loading,
    error,
    fetchSources,
    toggleSource,
    addCustomSource,
    autoAddSourcesForVoivodeship,
    getEnabledSourceUrls,
    voivodeship: settings.voivodeship
  };
}
