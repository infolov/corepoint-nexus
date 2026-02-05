import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/use-user-settings";

interface DailySummary {
  id: string;
  summary_date: string;
  region: string | null;
  category: string | null;
  summary_text: string;
  audio_url: string | null;
  article_ids: string[];
  view_count_total: number;
  created_at: string;
}

// Session cache for historical summaries
const summaryCache = new Map<string, DailySummary | null>();

function getCacheKey(date: string, region: string | null, category: string | null): string {
  return `${date}|${region || "null"}|${category || "null"}`;
}

export function useDailySummary(categorySlug?: string, selectedDate?: string) {
  const [nationalSummary, setNationalSummary] = useState<DailySummary | null>(null);
  const [regionalSummary, setRegionalSummary] = useState<DailySummary | null>(null);
  const [categorySummary, setCategorySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useUserSettings();

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const targetDate = selectedDate || new Date().toISOString().split("T")[0];

      // If category is specified, fetch category summary
      if (categorySlug) {
        const cacheKey = getCacheKey(targetDate, null, categorySlug);
        
        if (summaryCache.has(cacheKey)) {
          setCategorySummary(summaryCache.get(cacheKey) || null);
          setLoading(false);
          return;
        }

        const { data: category, error: categoryError } = await supabase
          .from("daily_summaries")
          .select("*")
          .eq("summary_date", targetDate)
          .eq("category", categorySlug)
          .is("region", null)
          .maybeSingle();

        if (categoryError && categoryError.code !== "PGRST116") {
          console.error("Error fetching category summary:", categoryError);
        }
        
        summaryCache.set(cacheKey, category || null);
        setCategorySummary(category || null);
        setLoading(false);
        return;
      }

      // Check cache for national summary
      const nationalCacheKey = getCacheKey(targetDate, null, null);
      let nationalData: DailySummary | null = null;
      
      if (summaryCache.has(nationalCacheKey)) {
        nationalData = summaryCache.get(nationalCacheKey) || null;
      } else {
        const { data: national, error: nationalError } = await supabase
          .from("daily_summaries")
          .select("*")
          .eq("summary_date", targetDate)
          .is("region", null)
          .is("category", null)
          .maybeSingle();

        if (nationalError && nationalError.code !== "PGRST116") {
          console.error("Error fetching national summary:", nationalError);
        }
        
        nationalData = national || null;
        summaryCache.set(nationalCacheKey, nationalData);
      }
      
      setNationalSummary(nationalData);

      // Fetch regional summary if user has voivodeship set
      if (settings?.voivodeship) {
        const regionalCacheKey = getCacheKey(targetDate, settings.voivodeship, null);
        
        if (summaryCache.has(regionalCacheKey)) {
          setRegionalSummary(summaryCache.get(regionalCacheKey) || null);
        } else {
          const { data: regional, error: regionalError } = await supabase
            .from("daily_summaries")
            .select("*")
            .eq("summary_date", targetDate)
            .eq("region", settings.voivodeship)
            .is("category", null)
            .maybeSingle();

          if (regionalError && regionalError.code !== "PGRST116") {
            console.error("Error fetching regional summary:", regionalError);
          }
          
          const regionalData = regional || null;
          summaryCache.set(regionalCacheKey, regionalData);
          setRegionalSummary(regionalData);
        }
      }
    } catch (err) {
      console.error("Error fetching summaries:", err);
      setError("Nie udało się pobrać podsumowania");
    } finally {
      setLoading(false);
    }
  }, [settings?.voivodeship, categorySlug, selectedDate]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  return {
    nationalSummary,
    regionalSummary,
    categorySummary,
    loading,
    error,
    refetch: fetchSummaries,
  };
}

export function useCategorySummary(categorySlug: string, selectedDate?: string) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!categorySlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const targetDate = selectedDate || new Date().toISOString().split("T")[0];
      const cacheKey = getCacheKey(targetDate, null, categorySlug);

      if (summaryCache.has(cacheKey)) {
        setSummary(summaryCache.get(cacheKey) || null);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("summary_date", targetDate)
        .eq("category", categorySlug)
        .is("region", null)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching category summary:", fetchError);
        setError("Nie udało się pobrać podsumowania kategorii");
      }
      
      summaryCache.set(cacheKey, data || null);
      setSummary(data || null);
    } catch (err) {
      console.error("Error fetching category summary:", err);
      setError("Nie udało się pobrać podsumowania");
    } finally {
      setLoading(false);
    }
  }, [categorySlug, selectedDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}

// Hook to get available dates for last 7 days
export function useAvailableSummaryDates() {
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchDates = async () => {
      try {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
          .from("daily_summaries")
          .select("summary_date")
          .gte("summary_date", sevenDaysAgo.toISOString().split("T")[0])
          .lte("summary_date", today.toISOString().split("T")[0])
          .is("region", null)
          .is("category", null)
          .order("summary_date", { ascending: false });

        if (error) {
          console.error("Error fetching summary dates:", error);
          return;
        }

        const uniqueDates = [...new Set(data?.map(d => d.summary_date) || [])];
        setDates(uniqueDates);
      } catch (err) {
        console.error("Error fetching summary dates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, []);

  return { dates, loading };
}

// Clear cache utility (can be called on logout or refresh)
export function clearSummaryCache() {
  summaryCache.clear();
}
