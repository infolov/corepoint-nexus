import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/use-user-settings";

interface CarouselBanner {
  id: string;
  group_id: string;
  campaign_id: string | null;
  local_campaign_id: string | null;
  display_order: number;
  campaign?: {
    id: string;
    name: string;
    ad_type: string;
    content_url: string | null;
    content_text: string | null;
    target_url: string | null;
    is_global: boolean;
    region: string | null;
  };
  local_campaign?: {
    id: string;
    name: string;
    ad_type: string;
    content_url: string | null;
    content_text: string | null;
    target_url: string;
    target_regions: unknown;
  };
}

interface CarouselGroup {
  id: string;
  name: string;
  placement_position: number;
  banners: CarouselBanner[];
}

export function useCarouselBanners() {
  const [groups, setGroups] = useState<CarouselGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useUserSettings();

  const fetchCarouselGroups = useCallback(async () => {
    try {
      // Fetch active carousel groups with their banners
      const { data: groupsData, error: groupsError } = await supabase
        .from("carousel_banner_groups")
        .select("*")
        .eq("is_active", true)
        .order("placement_position");

      if (groupsError) throw groupsError;

      // For each group, fetch banners with campaign details
      const groupsWithBanners = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: bannersData, error: bannersError } = await supabase
            .from("carousel_banners")
            .select(`
              id,
              group_id,
              campaign_id,
              local_campaign_id,
              display_order
            `)
            .eq("group_id", group.id)
            .order("display_order");

          if (bannersError) throw bannersError;

          // Fetch campaign details for each banner
          const bannersWithCampaigns = await Promise.all(
            (bannersData || []).map(async (banner) => {
              let campaign = null;
              let local_campaign = null;

              if (banner.campaign_id) {
                const { data } = await supabase
                  .from("ad_campaigns")
                  .select("id, name, ad_type, content_url, content_text, target_url, is_global, region")
                  .eq("id", banner.campaign_id)
                  .eq("status", "active")
                  .single();
                campaign = data;
              }

              if (banner.local_campaign_id) {
                const { data } = await supabase
                  .from("local_ad_campaigns")
                  .select("id, name, ad_type, content_url, content_text, target_url, target_regions")
                  .eq("id", banner.local_campaign_id)
                  .eq("status", "active")
                  .single();
                local_campaign = data;
              }

              return { ...banner, campaign, local_campaign };
            })
          );

          return {
            ...group,
            banners: bannersWithCampaigns.filter(b => b.campaign || b.local_campaign),
          };
        })
      );

      setGroups(groupsWithBanners);
    } catch (error) {
      console.error("Error fetching carousel banners:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCarouselGroups();
  }, [fetchCarouselGroups]);

  // Get carousel group for a specific position
  const getCarouselForPosition = useCallback((position: number) => {
    const group = groups.find(g => g.placement_position === position);
    if (!group || group.banners.length === 0) return null;

    // Filter banners based on user location
    const userVoivodeship = settings.voivodeship;
    
    const filteredBanners = group.banners.filter(banner => {
      // National campaigns always shown
      if (banner.campaign?.is_global) return true;
      
      // If user has no location, only show global
      if (!userVoivodeship) {
        return banner.campaign?.is_global || false;
      }

      // Check regional targeting for ad_campaigns
      if (banner.campaign?.region) {
        return banner.campaign.region.toLowerCase() === userVoivodeship.toLowerCase();
      }

      // Check targeting for local campaigns
      if (banner.local_campaign?.target_regions) {
        const regions = banner.local_campaign.target_regions as string[];
        return Array.isArray(regions) && regions.some(
          r => r.toLowerCase() === userVoivodeship.toLowerCase()
        );
      }

      return true;
    });

    return {
      ...group,
      banners: filteredBanners,
    };
  }, [groups, settings.voivodeship]);

  // Get all positions that have carousels
  const carouselPositions = useMemo(() => {
    return groups.map(g => g.placement_position);
  }, [groups]);

  return {
    groups,
    loading,
    getCarouselForPosition,
    carouselPositions,
    refetch: fetchCarouselGroups,
  };
}
