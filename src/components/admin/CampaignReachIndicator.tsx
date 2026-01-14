import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, MapPin, Globe, Building, Building2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface CampaignReachIndicatorProps {
  isGlobal: boolean;
  region?: string | null;
  targetPowiat?: string | null;
  targetGmina?: string | null;
}

interface ReachData {
  matchingUsers: number;
  totalUsers: number;
  percentage: number;
  breakdown: {
    voivodeship: number;
    powiat: number;
    gmina: number;
  };
}

export function CampaignReachIndicator({ 
  isGlobal, 
  region, 
  targetPowiat, 
  targetGmina 
}: CampaignReachIndicatorProps) {
  const [reachData, setReachData] = useState<ReachData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReachData();
  }, [isGlobal, region, targetPowiat, targetGmina]);

  const fetchReachData = async () => {
    setLoading(true);
    try {
      // Get total users with location settings
      const { data: allUsers, error: totalError } = await supabase
        .from("user_site_settings")
        .select("voivodeship, county, city");

      if (totalError) throw totalError;

      const totalUsers = allUsers?.length || 0;

      // If global, all users match
      if (isGlobal) {
        setReachData({
          matchingUsers: totalUsers,
          totalUsers,
          percentage: 100,
          breakdown: {
            voivodeship: totalUsers,
            powiat: totalUsers,
            gmina: totalUsers,
          },
        });
        setLoading(false);
        return;
      }

      // Count users matching each level
      let voivodeshipMatches = 0;
      let powiatMatches = 0;
      let gminaMatches = 0;

      (allUsers || []).forEach((user) => {
        // Voivodeship match
        if (region) {
          if (user.voivodeship?.toLowerCase() === region.toLowerCase()) {
            voivodeshipMatches++;

            // Powiat match (only if voivodeship matches)
            if (targetPowiat) {
              if (user.county?.toLowerCase() === targetPowiat.toLowerCase()) {
                powiatMatches++;

                // Gmina match (only if powiat matches)
                if (targetGmina) {
                  // Note: gmina is stored in different fields depending on data source
                  // For now we'll assume city contains the most specific location
                  if (user.city?.toLowerCase() === targetGmina.toLowerCase()) {
                    gminaMatches++;
                  }
                }
              }
            }
          }
        }
      });

      // Determine matching users based on targeting level
      let matchingUsers = 0;
      if (targetGmina) {
        matchingUsers = gminaMatches;
      } else if (targetPowiat) {
        matchingUsers = powiatMatches;
      } else if (region) {
        matchingUsers = voivodeshipMatches;
      } else {
        // No targeting = matches everyone (but with lower priority in auction)
        matchingUsers = totalUsers;
      }

      const percentage = totalUsers > 0 ? (matchingUsers / totalUsers) * 100 : 0;

      setReachData({
        matchingUsers,
        totalUsers,
        percentage,
        breakdown: {
          voivodeship: voivodeshipMatches,
          powiat: powiatMatches,
          gmina: gminaMatches,
        },
      });
    } catch (error) {
      console.error("Error fetching reach data:", error);
      setReachData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  if (!reachData) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        Nie można pobrać danych o zasięgu
      </div>
    );
  }

  // Determine targeting level for display
  const getTargetingLevel = () => {
    if (isGlobal) return { label: "Krajowa", icon: Globe, color: "text-blue-500" };
    if (targetGmina) return { label: "Gmina", icon: MapPin, color: "text-purple-500" };
    if (targetPowiat) return { label: "Powiat", icon: Building, color: "text-orange-500" };
    if (region) return { label: "Województwo", icon: Building2, color: "text-green-500" };
    return { label: "Brak targetowania", icon: Globe, color: "text-gray-500" };
  };

  const targeting = getTargetingLevel();
  const TargetIcon = targeting.icon;

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Zasięg kampanii</span>
        </div>
        <Badge variant="outline" className={`gap-1 ${targeting.color}`}>
          <TargetIcon className="h-3 w-3" />
          {targeting.label}
        </Badge>
      </div>

      {/* Targeting details */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        {isGlobal ? (
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span>Kampania ogólnopolska</span>
          </div>
        ) : (
          <>
            {region && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>Województwo: {region}</span>
              </div>
            )}
            {targetPowiat && (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                <span>Powiat: {targetPowiat}</span>
              </div>
            )}
            {targetGmina && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Gmina: {targetGmina}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reach stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {reachData.matchingUsers.toLocaleString('pl-PL')}
            </span>
            <span className="text-muted-foreground">
              / {reachData.totalUsers.toLocaleString('pl-PL')} użytkowników
            </span>
          </div>
          <span className="font-bold text-primary">
            {reachData.percentage.toFixed(1)}%
          </span>
        </div>

        <Progress 
          value={reachData.percentage} 
          className="h-2"
        />

        {/* Breakdown by level (only for targeted campaigns) */}
        {!isGlobal && region && (
          <div className="grid grid-cols-3 gap-2 text-xs text-center mt-2">
            <div className="p-2 bg-background rounded">
              <div className="font-medium text-green-600">
                {reachData.breakdown.voivodeship}
              </div>
              <div className="text-muted-foreground">woj.</div>
            </div>
            <div className="p-2 bg-background rounded">
              <div className="font-medium text-orange-600">
                {reachData.breakdown.powiat}
              </div>
              <div className="text-muted-foreground">pow.</div>
            </div>
            <div className="p-2 bg-background rounded">
              <div className="font-medium text-purple-600">
                {reachData.breakdown.gmina}
              </div>
              <div className="text-muted-foreground">gm.</div>
            </div>
          </div>
        )}
      </div>

      {/* Warning for low reach */}
      {reachData.matchingUsers === 0 && (
        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>Brak użytkowników w wybranej lokalizacji</span>
        </div>
      )}
    </div>
  );
}
