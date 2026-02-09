import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface ContentRatioPreferences {
  generalRatio: number;
  localRatio: number;
  sportRatio: number;
}

const DEFAULT_PREFERENCES: ContentRatioPreferences = {
  generalRatio: 40,
  localRatio: 35,
  sportRatio: 25,
};

const LOCAL_STORAGE_KEY = "contentRatioPreferences";

export function useContentRatio() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ContentRatioPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    setLoading(true);

    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        setPreferences({
          generalRatio: parsed.generalRatio ?? DEFAULT_PREFERENCES.generalRatio,
          localRatio: parsed.localRatio ?? DEFAULT_PREFERENCES.localRatio,
          sportRatio: parsed.sportRatio ?? DEFAULT_PREFERENCES.sportRatio,
        });
      } catch (e) {
        console.error("Error parsing local content ratio preferences:", e);
      }
    }

    if (user) {
      try {
        const { data, error } = await supabase
          .from("user_notification_preferences")
          .select("general_ratio, local_ratio, sport_ratio")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          const dbPreferences = {
            generalRatio: (data as any).general_ratio ?? DEFAULT_PREFERENCES.generalRatio,
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

  const savePreferences = useCallback(async (newPreferences: ContentRatioPreferences) => {
    const sum = newPreferences.generalRatio + newPreferences.localRatio + newPreferences.sportRatio;
    if (sum !== 100) {
      console.error("Content ratios must sum to 100, got:", sum);
      return;
    }

    setPreferences(newPreferences);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPreferences));

    if (user) {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("user_notification_preferences")
          .upsert({
            user_id: user.id,
            general_ratio: newPreferences.generalRatio,
            local_ratio: newPreferences.localRatio,
            sport_ratio: newPreferences.sportRatio,
            updated_at: new Date().toISOString(),
          } as any, {
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

  const setRatios = useCallback((general: number, local: number, sport: number) => {
    savePreferences({
      generalRatio: Math.max(0, Math.min(100, general)),
      localRatio: Math.max(0, Math.min(100, local)),
      sportRatio: Math.max(0, Math.min(100, sport)),
    });
  }, [savePreferences]);

  return {
    preferences,
    loading,
    saving,
    setRatios,
    savePreferences,
    refetch: loadPreferences,
  };
}

/**
 * Balances two other ratios when one changes, keeping their mutual proportion.
 */
export function balanceRatios(
  changedValue: number,
  otherA: number,
  otherB: number
): [number, number] {
  const remaining = 100 - changedValue;
  const otherSum = otherA + otherB;

  if (otherSum === 0) {
    const half = Math.round(remaining / 2);
    return [half, remaining - half];
  }

  const newA = Math.round((otherA / otherSum) * remaining);
  const newB = remaining - newA;
  return [Math.max(0, newA), Math.max(0, newB)];
}

/**
 * Interleave articles from three pools based on ratios.
 */
export function interleaveArticlesByThreeRatios<T>(
  generalArticles: T[],
  localArticles: T[],
  sportArticles: T[],
  targetCount: number,
  ratios: ContentRatioPreferences
): T[] {
  const { generalRatio, localRatio, sportRatio } = ratios;

  const generalCount = Math.round((generalRatio / 100) * targetCount);
  const localCount = Math.round((localRatio / 100) * targetCount);
  const sportCount = targetCount - generalCount - localCount;

  const selectedGeneral = generalArticles.slice(0, generalCount);
  const selectedLocal = localArticles.slice(0, localCount);
  const selectedSport = sportArticles.slice(0, sportCount);

  // Interleave evenly
  const result: T[] = [];
  const pools = [
    { items: selectedGeneral, ratio: generalRatio, index: 0 },
    { items: selectedLocal, ratio: localRatio, index: 0 },
    { items: selectedSport, ratio: sportRatio, index: 0 },
  ];

  for (let i = 0; i < targetCount; i++) {
    // Pick the pool that is most "behind" based on its expected vs actual ratio
    let bestPool = -1;
    let bestScore = -Infinity;

    for (let p = 0; p < pools.length; p++) {
      if (pools[p].index >= pools[p].items.length) continue;
      const expected = (pools[p].ratio / 100) * (i + 1);
      const actual = pools[p].index;
      const score = expected - actual;
      if (score > bestScore) {
        bestScore = score;
        bestPool = p;
      }
    }

    if (bestPool === -1) break;
    result.push(pools[bestPool].items[pools[bestPool].index]);
    pools[bestPool].index++;
  }

  return result.slice(0, targetCount);
}

// Legacy compat
export function interleaveArticlesByRatio<T>(
  localArticles: T[],
  sportArticles: T[],
  targetCount: number,
  localRatio: number = 60
): T[] {
  const sportRatio = 100 - localRatio;
  return interleaveArticlesByThreeRatios(
    [],
    localArticles,
    sportArticles,
    targetCount,
    { generalRatio: 0, localRatio, sportRatio }
  );
}
