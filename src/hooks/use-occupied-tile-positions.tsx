import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface UseOccupiedTilePositionsProps {
  placementId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isGlobal: boolean;
  region?: string | null;
}

interface OccupiedPosition {
  position: number;
  campaignName: string;
  startDate: string;
  endDate: string;
}

export function useOccupiedTilePositions({
  placementId,
  startDate,
  endDate,
  isGlobal,
  region,
}: UseOccupiedTilePositionsProps) {
  const [occupiedPositions, setOccupiedPositions] = useState<number[]>([]);
  const [occupiedDetails, setOccupiedDetails] = useState<OccupiedPosition[]>([]);
  const [loading, setLoading] = useState(false);

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

        // Build query for campaigns that:
        // 1. Are for the same placement
        // 2. Have overlapping date range
        // 3. Are active or pending (not rejected)
        // 4. Have tile_position set
        let query = supabase
          .from("ad_campaigns")
          .select("tile_position, name, start_date, end_date, is_global, region, status")
          .eq("placement_id", placementId)
          .not("tile_position", "is", null)
          .in("status", ["active", "pending", "approved"])
          // Date overlap: start_date <= our_end AND end_date >= our_start
          .lte("start_date", endDateStr)
          .gte("end_date", startDateStr);

        // Filter by targeting scope
        if (isGlobal) {
          // For global campaigns, they conflict with any campaign that's either:
          // - Also global, OR
          // - Regional (since global would show in all regions)
          // So all campaigns for this date range are potential conflicts
        } else if (region) {
          // For regional campaigns, they conflict with:
          // - Global campaigns, OR
          // - Campaigns targeting the same region
          query = query.or(`is_global.eq.true,region.eq.${region}`);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching occupied positions:", error);
          setOccupiedPositions([]);
          setOccupiedDetails([]);
          return;
        }

        if (data) {
          const positions = data
            .filter(campaign => campaign.tile_position !== null)
            .map(campaign => campaign.tile_position as number);
          
          const uniquePositions = [...new Set(positions)];
          setOccupiedPositions(uniquePositions);

          // Store details for tooltips
          const details: OccupiedPosition[] = data
            .filter(campaign => campaign.tile_position !== null)
            .map(campaign => ({
              position: campaign.tile_position as number,
              campaignName: campaign.name,
              startDate: campaign.start_date,
              endDate: campaign.end_date,
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
  }, [placementId, startDate, endDate, isGlobal, region]);

  return {
    occupiedPositions,
    occupiedDetails,
    loading,
  };
}
