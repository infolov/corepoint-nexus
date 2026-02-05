import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface ContentRatioPreferences {
  localRatio: number;
  sportRatio: number;
}

const DEFAULT_PREFERENCES: ContentRatioPreferences = {
  localRatio: 60,
  sportRatio: 40,
};

const LOCAL_STORAGE_KEY = "contentRatioPreferences";

export function useContentRatio() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ContentRatioPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences from localStorage first, then from database
  const loadPreferences = useCallback(async () => {
    setLoading(true);

    // First try localStorage for quick initial load
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        setPreferences({
          localRatio: parsed.localRatio ?? DEFAULT_PREFERENCES.localRatio,
          sportRatio: parsed.sportRatio ?? DEFAULT_PREFERENCES.sportRatio,
        });
      } catch (e) {
        console.error("Error parsing local content ratio preferences:", e);
      }
    }

    // If logged in, fetch from database (overrides localStorage)
    if (user) {
      try {
        const { data, error } = await supabase
          .from("user_notification_preferences")
          .select("local_ratio, sport_ratio")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          const dbPreferences = {
            localRatio: data.local_ratio ?? DEFAULT_PREFERENCES.localRatio,
            sportRatio: data.sport_ratio ?? DEFAULT_PREFERENCES.sportRatio,
          };
          setPreferences(dbPreferences);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbPreferences));
        }
      } catch (error) {
        console.error("Error loading content ratio preferences:", error);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Save preferences to database and localStorage
  const savePreferences = useCallback(async (newPreferences: ContentRatioPreferences) => {
    // Ensure ratios sum to 100
    const normalizedPreferences = {
      localRatio: Math.max(0, Math.min(100, newPreferences.localRatio)),
      sportRatio: 100 - Math.max(0, Math.min(100, newPreferences.localRatio)),
    };

    // Update local state immediately
    setPreferences(normalizedPreferences);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalizedPreferences));

    // If logged in, save to database
    if (user) {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("user_notification_preferences")
          .upsert({
            user_id: user.id,
            local_ratio: normalizedPreferences.localRatio,
            sport_ratio: normalizedPreferences.sportRatio,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id",
          });

        if (error) {
          console.error("Error saving content ratio preferences:", error);
        }
      } catch (error) {
        console.error("Error saving content ratio preferences:", error);
      } finally {
        setSaving(false);
      }
    }
  }, [user]);

  // Update local ratio (sport ratio adjusts automatically)
  const setLocalRatio = useCallback((ratio: number) => {
    const clampedRatio = Math.max(0, Math.min(100, ratio));
    savePreferences({
      localRatio: clampedRatio,
      sportRatio: 100 - clampedRatio,
    });
  }, [savePreferences]);

  return {
    preferences,
    loading,
    saving,
    setLocalRatio,
    savePreferences,
    refetch: loadPreferences,
  };
}

// Helper function to interleave articles based on ratio
export function interleaveArticlesByRatio<T>(
  localArticles: T[],
  sportArticles: T[],
  targetCount: number,
  localRatio: number = 60
): T[] {
  const sportRatio = 100 - localRatio;
  const localCount = Math.round((localRatio / 100) * targetCount);
  const sportCount = targetCount - localCount;

  // Take required articles from each pool
  const selectedLocal = localArticles.slice(0, localCount);
  const selectedSport = sportArticles.slice(0, sportCount);

  // Interleave the articles
  const result: T[] = [];
  let localIndex = 0;
  let sportIndex = 0;

  // Calculate interleaving pattern based on ratio
  // e.g., 60/40 means roughly 3 local for every 2 sport
  const localStep = localRatio > 0 ? 100 / localRatio : Infinity;
  const sportStep = sportRatio > 0 ? 100 / sportRatio : Infinity;

  let localAccum = 0;
  let sportAccum = 0;

  for (let i = 0; i < targetCount; i++) {
    localAccum += localStep;
    sportAccum += sportStep;

    if (localAccum >= sportAccum && localIndex < selectedLocal.length) {
      result.push(selectedLocal[localIndex++]);
      localAccum -= 100;
    } else if (sportIndex < selectedSport.length) {
      result.push(selectedSport[sportIndex++]);
      sportAccum -= 100;
    } else if (localIndex < selectedLocal.length) {
      result.push(selectedLocal[localIndex++]);
    }
  }

  // Add any remaining articles
  while (localIndex < selectedLocal.length) {
    result.push(selectedLocal[localIndex++]);
  }
  while (sportIndex < selectedSport.length) {
    result.push(selectedSport[sportIndex++]);
  }

  return result.slice(0, targetCount);
}
