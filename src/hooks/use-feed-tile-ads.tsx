import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeedTileAd {
  id: string;
  name: string;
  contentUrl: string | null;
  targetUrl: string | null;
  tilePosition: number;
  isGlobal: boolean;
  region: string | null;
}

// Blocked positions (1-3) - reserved, no ads allowed
const BLOCKED_POSITIONS = [1, 2, 3];

/**
 * Hook to fetch active feed-tile ads with their tile positions
 * Returns a map of tile positions to ads for efficient lookup
 * Supports positions 4-12 (first section) and 13-24 (second section)
 */
export function useFeedTileAds() {
  const [ads, setAds] = useState<FeedTileAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [adsByPosition, setAdsByPosition] = useState<Map<number, FeedTileAd>>(new Map());

  const fetchAds = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select(`
          id,
          name,
          content_url,
          target_url,
          tile_position,
          is_global,
          region,
          ad_placements!inner(slug)
        `)
        .eq("status", "active")
        .eq("ad_placements.slug", "feed-tile")
        .not("tile_position", "is", null)
        .lte("start_date", today)
        .gte("end_date", today);

      if (error) {
        console.error("Error fetching feed-tile ads:", error);
        return;
      }

      const feedTileAds: FeedTileAd[] = (data || []).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        contentUrl: campaign.content_url,
        targetUrl: campaign.target_url,
        tilePosition: campaign.tile_position!,
        isGlobal: campaign.is_global,
        region: campaign.region,
      }));

      setAds(feedTileAds);

      // Create position map for efficient lookup
      const positionMap = new Map<number, FeedTileAd>();
      feedTileAds.forEach(ad => {
        // If multiple ads for same position, use first one (could add auction logic here)
        if (!positionMap.has(ad.tilePosition)) {
          positionMap.set(ad.tilePosition, ad);
        }
      });
      setAdsByPosition(positionMap);
    } catch (error) {
      console.error("Error fetching feed-tile ads:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Get ad for specific position (excludes blocked positions 1-3)
  const getAdForPosition = useCallback((position: number): FeedTileAd | undefined => {
    if (BLOCKED_POSITIONS.includes(position)) return undefined;
    return adsByPosition.get(position);
  }, [adsByPosition]);

  // Check if position has an ad (excludes blocked positions 1-3)
  const hasAdAtPosition = useCallback((position: number): boolean => {
    if (BLOCKED_POSITIONS.includes(position)) return false;
    return adsByPosition.has(position);
  }, [adsByPosition]);

  // Track impression
  const trackImpression = useCallback(async (adId: string) => {
    try {
      await supabase.rpc('increment_campaign_impression', {
        p_campaign_id: adId
      });
    } catch (error) {
      console.error("Error tracking impression:", error);
    }
  }, []);

  // Track click
  const trackClick = useCallback(async (adId: string) => {
    try {
      await supabase.rpc('increment_campaign_click', {
        p_campaign_id: adId
      });
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  }, []);

  return {
    ads,
    loading,
    getAdForPosition,
    hasAdAtPosition,
    trackImpression,
    trackClick,
    refetch: fetchAds,
  };
}
