import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/use-user-settings";

interface DailySummary {
  id: string;
  summary_date: string;
  region: string | null;
  summary_text: string;
  audio_url: string | null;
  article_ids: string[];
  view_count_total: number;
  created_at: string;
}

export function useDailySummary() {
  const [nationalSummary, setNationalSummary] = useState<DailySummary | null>(null);
  const [regionalSummary, setRegionalSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useUserSettings();

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];

      // Fetch national summary
      const { data: national, error: nationalError } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("summary_date", today)
        .is("region", null)
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
  }, [settings?.voivodeship]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  return {
    nationalSummary,
    regionalSummary,
    loading,
    error,
    refetch: fetchSummaries,
  };
}
