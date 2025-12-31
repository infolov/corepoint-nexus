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
  target_powiat: string | null;
  target_gmina: string | null;
}

export interface UserLocation {
  voivodeship?: string;
  powiat?: string;
  gmina?: string;
}

interface UseAdCampaignsOptions {
  userLocation?: UserLocation;
  // Legacy support
  userRegion?: string;
}

export function useAdCampaigns(options: UseAdCampaignsOptions = {}) {
  const { userLocation, userRegion } = options;
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
          target_powiat,
          target_gmina,
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
        target_powiat: campaign.target_powiat,
        target_gmina: campaign.target_gmina,
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
    // Resolve user location from new format or legacy format
    const userVoivodeship = userLocation?.voivodeship || userRegion;
    const userPowiat = userLocation?.powiat;
    const userGmina = userLocation?.gmina;

    return campaigns.filter(c => {
      // Must match placement
      if (c.placement_slug !== placementSlug) return false;
      
      // Global campaigns show everywhere
      if (c.is_global) return true;
      
      // No user location - don't show local campaigns
      if (!userVoivodeship) return false;

      // Check hierarchical matching
      // Campaign must match at voivodeship level at minimum
      if (!c.region || c.region.toLowerCase() !== userVoivodeship.toLowerCase()) {
        return false;
      }

      // If campaign targets specific powiat
      if (c.target_powiat) {
        // User must have powiat and it must match
        if (!userPowiat || c.target_powiat.toLowerCase() !== userPowiat.toLowerCase()) {
          return false;
        }

        // If campaign targets specific gmina
        if (c.target_gmina) {
          // User must have gmina and it must match
          if (!userGmina || c.target_gmina.toLowerCase() !== userGmina.toLowerCase()) {
            return false;
          }
        }
      }

      // All checks passed - campaign matches user's location
      return true;
    });
  }, [campaigns, userLocation, userRegion]);

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
