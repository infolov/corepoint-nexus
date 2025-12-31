import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  AuctionAd, 
  UserLocation, 
  AuctionResult, 
  runAuctionWithTracking,
  getSessionImpressions 
} from "@/lib/ad-auction-engine";

interface UseAdAuctionOptions {
  userLocation?: UserLocation;
  placementSlug?: string;
}

export function useAdAuction(options: UseAdAuctionOptions = {}) {
  const { userLocation, placementSlug } = options;
  const [ads, setAds] = useState<AuctionAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotCounter, setSlotCounter] = useState(0);

  // Fetch all active campaigns and convert to AuctionAd format
  const fetchAds = useCallback(async () => {
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
          total_credits,
          ad_placements!inner(slug, name, credit_cost)
        `)
        .eq("status", "active")
        .lte("start_date", today)
        .gte("end_date", today);

      if (error) {
        console.error("Error fetching ads:", error);
        setAds([]);
        return;
      }

      // Convert to AuctionAd format
      const auctionAds: AuctionAd[] = (data || []).map(campaign => {
        // Calculate bid price from credits (higher credits = higher bid)
        const baseBid = campaign.total_credits / 10;
        const placementCost = campaign.ad_placements?.credit_cost || 10;
        const bidPrice = Math.max(1, baseBid * (placementCost / 10));

        return {
          id: campaign.id,
          type: campaign.is_global ? 'national' : 'local',
          bidPrice: bidPrice,
          priorityMultiplier: 1.0, // Default, can be enhanced later
          ctrScore: 1.0, // Default, can be calculated from stats later
          impressionCount: getSessionImpressions(campaign.id),
          targetVoivodeship: campaign.region || undefined,
          targetPowiat: campaign.target_powiat || undefined,
          targetGmina: campaign.target_gmina || undefined,
          contentUrl: campaign.content_url,
          contentText: campaign.content_text,
          targetUrl: campaign.target_url,
          name: campaign.name,
          placementSlug: campaign.ad_placements?.slug || "",
        };
      });

      // Filter by placement if specified
      const filteredAds = placementSlug 
        ? auctionAds.filter(ad => ad.placementSlug === placementSlug)
        : auctionAds;

      setAds(filteredAds);
    } catch (error) {
      console.error("Error fetching ads:", error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [placementSlug]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Run auction for a single slot
  const getNextAd = useCallback((forPlacement?: string): AuctionResult | null => {
    const filteredAds = forPlacement 
      ? ads.filter(ad => ad.placementSlug === forPlacement)
      : ads;

    if (filteredAds.length === 0) return null;

    const newSlotIndex = slotCounter + 1;
    setSlotCounter(newSlotIndex);

    return runAuctionWithTracking(
      filteredAds,
      userLocation || {},
      newSlotIndex
    );
  }, [ads, userLocation, slotCounter]);

  // Get multiple ads for feed injection
  const getAdsForFeed = useCallback((
    count: number,
    forPlacement?: string
  ): AuctionResult[] => {
    const results: AuctionResult[] = [];
    const filteredAds = forPlacement 
      ? ads.filter(ad => ad.placementSlug === forPlacement)
      : ads;

    if (filteredAds.length === 0) return results;

    for (let i = 0; i < count; i++) {
      const result = runAuctionWithTracking(
        filteredAds,
        userLocation || {},
        slotCounter + i + 1
      );
      if (result) {
        results.push(result);
      }
    }

    setSlotCounter(prev => prev + count);
    return results;
  }, [ads, userLocation, slotCounter]);

  // Get statistics about available ads
  const stats = useMemo(() => {
    const national = ads.filter(a => a.type === 'national');
    const local = ads.filter(a => a.type === 'local');
    return {
      total: ads.length,
      national: national.length,
      local: local.length,
      avgBidNational: national.length > 0 
        ? national.reduce((sum, a) => sum + a.bidPrice, 0) / national.length 
        : 0,
      avgBidLocal: local.length > 0 
        ? local.reduce((sum, a) => sum + a.bidPrice, 0) / local.length 
        : 0,
    };
  }, [ads]);

  // Track impression manually (for components that handle their own display)
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
    getNextAd,
    getAdsForFeed,
    trackImpression,
    trackClick,
    stats,
    refetch: fetchAds,
  };
}
