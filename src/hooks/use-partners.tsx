import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  logo_text: string | null;
  target_url: string | null;
  partner_type: "site" | "category";
  category_slug: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export function usePartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("partner_campaigns")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString());

      if (error) throw error;
      
      setPartners((data || []) as Partner[]);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Get the active site partner
  const sitePartner = useMemo(() => {
    return partners.find(p => p.partner_type === "site") || null;
  }, [partners]);

  // Get category partner by slug
  const getCategoryPartner = useCallback((categorySlug: string) => {
    return partners.find(
      p => p.partner_type === "category" && p.category_slug === categorySlug
    ) || null;
  }, [partners]);

  // Check if a category has an active partner
  const hasCategoryPartner = useCallback((categorySlug: string) => {
    return partners.some(
      p => p.partner_type === "category" && p.category_slug === categorySlug
    );
  }, [partners]);

  return {
    partners,
    sitePartner,
    getCategoryPartner,
    hasCategoryPartner,
    loading,
    refetch: fetchPartners,
  };
}
