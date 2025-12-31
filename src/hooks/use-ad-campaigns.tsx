import { useState, useEffect, useCallback } from "react";
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
  is_global: boolean;
  region: string | null;
}

interface UseAdCampaignsOptions {
  userRegion?: string;
}

export function useAdCampaigns(options: UseAdCampaignsOptions = {}) {
  const { userRegion } = options;
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
          is_global,
          region,
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
        is_global: campaign.is_global,
        region: campaign.region,
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
    return campaigns.filter(c => {
      // Must match placement
      if (c.placement_slug !== placementSlug) return false;
      
      // Global campaigns show everywhere
      if (c.is_global) return true;
      
      // Local campaigns require region match
      if (userRegion && c.region) {
        return c.region.toLowerCase() === userRegion.toLowerCase();
      }
      
      // No region specified - don't show local campaigns
      return false;
    });
  }, [campaigns, userRegion]);

  const getRandomCampaign = useCallback((placementSlug: string) => {
    const placementCampaigns = getCampaignsByPlacement(placementSlug);
    if (placementCampaigns.length === 0) return null;
    return placementCampaigns[Math.floor(Math.random() * placementCampaigns.length)];
  }, [getCampaignsByPlacement]);

  const trackImpression = useCallback(async (campaignId: string) => {
    try {
      const { error } = await supabase.rpc('increment_campaign_impression', {
        p_campaign_id: campaignId
      });
      
      if (error) {
        console.error("Error tracking impression:", error);
      }
    } catch (error) {
      console.error("Error tracking impression:", error);
    }
  }, []);

  const trackClick = useCallback(async (campaignId: string) => {
    try {
      const { error } = await supabase.rpc('increment_campaign_click', {
        p_campaign_id: campaignId
      });
      
      if (error) {
        console.error("Error tracking click:", error);
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
