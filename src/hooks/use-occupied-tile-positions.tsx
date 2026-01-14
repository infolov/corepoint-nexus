import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SelectedRegion {
  voivodeship: string;
  powiat?: string | null;
  gmina?: string | null;
}

interface UseOccupiedTilePositionsProps {
  placementId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isGlobal: boolean;
  selectedRegions?: SelectedRegion[];
  /** @deprecated Use selectedRegions instead */
  region?: string | null;
}

interface OccupiedPosition {
  position: number;
  campaignName: string;
  startDate: string;
  endDate: string;
  isGlobal: boolean;
  region: string | null;
  targetPowiat: string | null;
  targetGmina: string | null;
}

/**
 * Check if a campaign conflicts with the user's targeting selection.
 * 
 * Conflict rules based on geographic hierarchy:
 * - Global campaigns conflict with everything
 * - Voivodeship-level campaigns conflict with: global, same voivodeship, any powiat/gmina in that voivodeship
 * - Powiat-level campaigns conflict with: global, parent voivodeship, same powiat, any gmina in that powiat
 * - Gmina-level campaigns conflict with: global, parent voivodeship, parent powiat, same gmina
 */
function checkGeographicConflict(
  campaign: {
    is_global: boolean;
    region: string | null;
    target_powiat: string | null;
    target_gmina: string | null;
  },
  userIsGlobal: boolean,
  userRegions: SelectedRegion[]
): boolean {
  // If user wants global campaign, it conflicts with ALL campaigns
  if (userIsGlobal) {
    return true;
  }

  // If campaign is global, it conflicts with any regional targeting
  if (campaign.is_global) {
    return true;
  }

  // Check each user-selected region for conflicts
  for (const userRegion of userRegions) {
    const campaignVoivodeship = campaign.region?.toLowerCase() || null;
    const campaignPowiat = campaign.target_powiat?.toLowerCase() || null;
    const campaignGmina = campaign.target_gmina?.toLowerCase() || null;

    const userVoivodeship = userRegion.voivodeship?.toLowerCase() || null;
    const userPowiat = userRegion.powiat?.toLowerCase() || null;
    const userGmina = userRegion.gmina?.toLowerCase() || null;

    // Different voivodeships - no conflict possible
    if (campaignVoivodeship !== userVoivodeship) {
      continue;
    }

    // Same voivodeship - now check deeper hierarchy

    // Determine campaign targeting level
    const campaignLevel = campaignGmina ? 'gmina' : (campaignPowiat ? 'powiat' : 'voivodeship');
    const userLevel = userGmina ? 'gmina' : (userPowiat ? 'powiat' : 'voivodeship');

    // If campaign targets entire voivodeship
    if (campaignLevel === 'voivodeship') {
      // It conflicts with anything in that voivodeship
      return true;
    }

    // If user targets entire voivodeship
    if (userLevel === 'voivodeship') {
      // Any campaign in that voivodeship conflicts
      return true;
    }

    // Both target at powiat level or deeper - check powiat
    if (campaignPowiat !== userPowiat) {
      // Different powiats - no conflict
      continue;
    }

    // Same powiat - check gmina level
    if (campaignLevel === 'powiat') {
      // Campaign targets entire powiat - conflicts with anything in that powiat
      return true;
    }

    if (userLevel === 'powiat') {
      // User targets entire powiat - any campaign in that powiat conflicts
      return true;
    }

    // Both target at gmina level - check if same gmina
    if (campaignGmina === userGmina) {
      return true;
    }

    // Different gminas in same powiat - no conflict
  }

  return false;
}

export function useOccupiedTilePositions({
  placementId,
  startDate,
  endDate,
  isGlobal,
  selectedRegions = [],
  region,
}: UseOccupiedTilePositionsProps) {
  const [occupiedPositions, setOccupiedPositions] = useState<number[]>([]);
  const [occupiedDetails, setOccupiedDetails] = useState<OccupiedPosition[]>([]);
  const [loading, setLoading] = useState(false);

  // Support legacy region prop
  const effectiveRegions: SelectedRegion[] = selectedRegions.length > 0 
    ? selectedRegions 
    : (region ? [{ voivodeship: region }] : []);

  useEffect(() => {
    const fetchOccupiedPositions = async () => {
      // Only fetch if we have placement and dates
      if (!placementId || !startDate || !endDate) {
        setOccupiedPositions([]);
        setOccupiedDetails([]);
        return;
      }

      setLoading(true);

      try {
        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = format(endDate, "yyyy-MM-dd");

        // Fetch ALL campaigns for this placement with overlapping dates
        // We'll filter client-side for geographic conflicts
        const { data, error } = await supabase
          .from("ad_campaigns")
          .select("tile_position, name, start_date, end_date, is_global, region, target_powiat, target_gmina, status")
          .eq("placement_id", placementId)
          .not("tile_position", "is", null)
          .in("status", ["active", "pending", "approved"])
          // Date overlap: start_date <= our_end AND end_date >= our_start
          .lte("start_date", endDateStr)
          .gte("end_date", startDateStr);

        if (error) {
          console.error("Error fetching occupied positions:", error);
          setOccupiedPositions([]);
          setOccupiedDetails([]);
          return;
        }

        if (data) {
          // Filter campaigns that actually conflict with user's targeting
          const conflictingCampaigns = data.filter(campaign => 
            campaign.tile_position !== null &&
            checkGeographicConflict(campaign, isGlobal, effectiveRegions)
          );

          const positions = conflictingCampaigns.map(campaign => campaign.tile_position as number);
          const uniquePositions = [...new Set(positions)];
          setOccupiedPositions(uniquePositions);

          // Store details for tooltips
          const details: OccupiedPosition[] = conflictingCampaigns.map(campaign => ({
            position: campaign.tile_position as number,
            campaignName: campaign.name,
            startDate: campaign.start_date,
            endDate: campaign.end_date,
            isGlobal: campaign.is_global,
            region: campaign.region,
            targetPowiat: campaign.target_powiat,
            targetGmina: campaign.target_gmina,
          }));
          setOccupiedDetails(details);
        }
      } catch (error) {
        console.error("Error in fetchOccupiedPositions:", error);
        setOccupiedPositions([]);
        setOccupiedDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOccupiedPositions();
  }, [placementId, startDate, endDate, isGlobal, JSON.stringify(effectiveRegions)]);

  return {
    occupiedPositions,
    occupiedDetails,
    loading,
  };
}
