import { useState, useEffect, useCallback } from "react";
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

export function useDailySummary(categorySlug?: string) {
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
      const today = new Date().toISOString().split("T")[0];

      // If category is specified, fetch category summary
      if (categorySlug) {
        const { data: category, error: categoryError } = await supabase
          .from("daily_summaries")
          .select("*")
          .eq("summary_date", today)
          .eq("category", categorySlug)
          .is("region", null)
          .single();

        if (categoryError && categoryError.code !== "PGRST116") {
          console.error("Error fetching category summary:", categoryError);
        }
        
        setCategorySummary(category || null);
        setLoading(false);
        return;
      }

      // Fetch national summary (all categories, no region)
      const { data: national, error: nationalError } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("summary_date", today)
        .is("region", null)
        .is("category", null)
        .single();

      if (nationalError && nationalError.code !== "PGRST116") {
        console.error("Error fetching national summary:", nationalError);
      }
      
      setNationalSummary(national || null);

      // Fetch regional summary if user has voivodeship set
      if (settings?.voivodeship) {
        const { data: regional, error: regionalError } = await supabase
          .from("daily_summaries")
          .select("*")
          .eq("summary_date", today)
          .eq("region", settings.voivodeship)
          .is("category", null)
          .single();

        if (regionalError && regionalError.code !== "PGRST116") {
          console.error("Error fetching regional summary:", regionalError);
        }
        
        setRegionalSummary(regional || null);
      }
    } catch (err) {
      console.error("Error fetching summaries:", err);
      setError("Nie udało się pobrać podsumowania");
    } finally {
      setLoading(false);
    }
  }, [settings?.voivodeship, categorySlug]);

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

export function useCategorySummary(categorySlug: string) {
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
      const today = new Date().toISOString().split("T")[0];

      const { data, error: fetchError } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("summary_date", today)
        .eq("category", categorySlug)
        .is("region", null)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching category summary:", fetchError);
        setError("Nie udało się pobrać podsumowania kategorii");
      }
      
      setSummary(data || null);
    } catch (err) {
      console.error("Error fetching category summary:", err);
      setError("Nie udało się pobrać podsumowania");
    } finally {
      setLoading(false);
    }
  }, [categorySlug]);

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
