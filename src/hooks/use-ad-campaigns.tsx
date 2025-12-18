import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdCampaign {
  id: string;
  name: string;
  ad_type: string;
  content_url: string | null;
  content_text: string | null;
  target_url: string | null;
  placement_slug: string;
  placement_name: string;
}

export function useAdCampaigns() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select(`
          id,
          name,
          ad_type,
          content_url,
          content_text,
          target_url,
          ad_placements!inner(slug, name)
        `)
        .eq("status", "active")
        .lte("start_date", today)
        .gte("end_date", today);

      if (error) {
        console.error("Error fetching ad campaigns:", error);
        setCampaigns([]);
        return;
      }

      const formattedCampaigns: AdCampaign[] = (data || []).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        ad_type: campaign.ad_type,
        content_url: campaign.content_url,
        content_text: campaign.content_text,
        target_url: campaign.target_url,
        placement_slug: campaign.ad_placements?.slug || "",
        placement_name: campaign.ad_placements?.name || "",
      }));

      setCampaigns(formattedCampaigns);
    } catch (error) {
      console.error("Error fetching ad campaigns:", error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const getCampaignsByPlacement = useCallback((placementSlug: string) => {
    return campaigns.filter(c => c.placement_slug === placementSlug);
  }, [campaigns]);

  const getRandomCampaign = useCallback((placementSlug: string) => {
    const placementCampaigns = getCampaignsByPlacement(placementSlug);
    if (placementCampaigns.length === 0) return null;
    return placementCampaigns[Math.floor(Math.random() * placementCampaigns.length)];
  }, [getCampaignsByPlacement]);

  const trackImpression = useCallback(async (campaignId: string) => {
    const today = new Date().toISOString().split("T")[0];
    
    try {
      // Try to update existing record
      const { data: existing } = await supabase
        .from("campaign_stats")
        .select("id, impressions")
        .eq("campaign_id", campaignId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("campaign_stats")
          .update({ impressions: (existing.impressions || 0) + 1 })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("campaign_stats")
          .insert({
            campaign_id: campaignId,
            date: today,
            impressions: 1,
            clicks: 0
          });
      }
    } catch (error) {
      console.error("Error tracking impression:", error);
    }
  }, []);

  const trackClick = useCallback(async (campaignId: string) => {
    const today = new Date().toISOString().split("T")[0];
    
    try {
      const { data: existing } = await supabase
        .from("campaign_stats")
        .select("id, clicks")
        .eq("campaign_id", campaignId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("campaign_stats")
          .update({ clicks: (existing.clicks || 0) + 1 })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("campaign_stats")
          .insert({
            campaign_id: campaignId,
            date: today,
            impressions: 0,
            clicks: 1
          });
      }
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  }, []);

  return {
    campaigns,
    loading,
    getCampaignsByPlacement,
    getRandomCampaign,
    trackImpression,
    trackClick,
    refetch: fetchCampaigns
  };
}
