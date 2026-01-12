import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/use-user-settings";

interface LocalAd {
  id: string;
  name: string;
  ad_type: string;
  content_url: string | null;
  content_text: string | null;
  target_url: string;
  target_regions: string[];
  placement_id: string;
  placement_type?: string;
}

export function useLocalAds() {
  const { settings } = useUserSettings();
  const [ads, setAds] = useState<LocalAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocalAds();
  }, [settings.voivodeship]);

  const fetchLocalAds = async () => {
    setLoading(true);
    try {
      // Fetch active campaigns
      const { data: campaigns, error } = await supabase
        .from("local_ad_campaigns")
        .select(`
          id,
          name,
          ad_type,
          content_url,
          content_text,
          target_url,
          target_regions,
          placement_id,
          local_ad_placements!inner(placement_type)
        `)
        .eq("status", "active")
        .gte("end_date", new Date().toISOString().split("T")[0])
        .lte("start_date", new Date().toISOString().split("T")[0]);

      if (error) {
        console.error("Error fetching local ads:", error);
        setAds([]);
        return;
      }

      // Format and filter ads
      const formattedAds: LocalAd[] = (campaigns || []).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        ad_type: campaign.ad_type,
        content_url: campaign.content_url,
        content_text: campaign.content_text,
        target_url: campaign.target_url,
        target_regions: campaign.target_regions || [],
        placement_id: campaign.placement_id,
        placement_type: campaign.local_ad_placements?.placement_type,
      }));

      setAds(formattedAds);
    } catch (error) {
      console.error("Error fetching local ads:", error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter ads based on user's full location (voivodeship, county, city)
  const filteredAds = useMemo(() => {
    if (!settings.voivodeship) {
      // Show national ads or all ads if no voivodeship set
      return ads.filter(ad => 
        ad.target_regions.length === 0 || 
        ad.target_regions.includes("wszystkie")
      );
    }

    // Normalize voivodeship to slug format
    const normalizeString = (str: string) => str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l")
      .replace(/\s+/g, "-");

    const userVoivodeshipSlug = normalizeString(settings.voivodeship);
    const userCountySlug = settings.county ? normalizeString(settings.county) : null;
    const userCitySlug = settings.city ? normalizeString(settings.city) : null;

    return ads.filter(ad => {
      // National ads (no targeting) always match
      if (ad.target_regions.length === 0 || ad.target_regions.includes("wszystkie")) {
        return true;
      }
      
      // Check if any target region matches user's location hierarchy
      return ad.target_regions.some(region => {
        const regionSlug = normalizeString(region);
        
        // Check voivodeship match
        if (regionSlug === userVoivodeshipSlug) return true;
        if (region.toLowerCase().includes(settings.voivodeship?.toLowerCase() || "")) return true;
        
        // Check county match (if user has county set)
        if (userCountySlug && regionSlug === userCountySlug) return true;
        if (settings.county && region.toLowerCase().includes(settings.county.toLowerCase())) return true;
        
        // Check city match (if user has city set)
        if (userCitySlug && regionSlug === userCitySlug) return true;
        if (settings.city && region.toLowerCase().includes(settings.city.toLowerCase())) return true;
        
        return false;
      });
    });
  }, [ads, settings.voivodeship, settings.county, settings.city]);

  // Get ads by placement type
  const getAdsByType = (placementType: string) => {
    return filteredAds.filter(ad => ad.placement_type === placementType);
  };

  // Get a random ad for a placement type
  const getRandomAd = (placementType: string) => {
    const typeAds = getAdsByType(placementType);
    if (typeAds.length === 0) return null;
    return typeAds[Math.floor(Math.random() * typeAds.length)];
  };

  // Track impression - simplified without RPC
  const trackImpression = async (adId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const regionSlug = settings.voivodeship?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/\s+/g, "-") || "unknown";

      // Check if stats entry exists
      const { data: existing } = await supabase
        .from("local_campaign_stats")
        .select("id, impressions")
        .eq("campaign_id", adId)
        .eq("date", today)
        .eq("region_slug", regionSlug)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from("local_campaign_stats")
          .update({ impressions: (existing.impressions || 0) + 1 })
          .eq("id", existing.id);
      } else {
        // Insert new
        await supabase
          .from("local_campaign_stats")
          .insert({
            campaign_id: adId,
            date: today,
            region_slug: regionSlug,
            impressions: 1,
            clicks: 0,
          });
      }
    } catch (error) {
      console.log("Error tracking impression:", error);
    }
  };

  // Track click - simplified without RPC
  const trackClick = async (adId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const regionSlug = settings.voivodeship?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/\s+/g, "-") || "unknown";

      // Check if stats entry exists
      const { data: existing } = await supabase
        .from("local_campaign_stats")
        .select("id, clicks")
        .eq("campaign_id", adId)
        .eq("date", today)
        .eq("region_slug", regionSlug)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from("local_campaign_stats")
          .update({ clicks: (existing.clicks || 0) + 1 })
          .eq("id", existing.id);
      } else {
        // Insert new
        await supabase
          .from("local_campaign_stats")
          .insert({
            campaign_id: adId,
            date: today,
            region_slug: regionSlug,
            impressions: 0,
            clicks: 1,
          });
      }
    } catch (error) {
      console.log("Error tracking click:", error);
    }
  };

  return {
    ads: filteredAds,
    loading,
    getAdsByType,
    getRandomAd,
    trackImpression,
    trackClick,
    refetch: fetchLocalAds,
  };
}
