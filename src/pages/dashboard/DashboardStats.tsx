import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Eye, 
  MousePointerClick, 
  TrendingUp,
  Monitor,
  Smartphone,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO, subDays } from "date-fns";
import { pl } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

interface CampaignStat {
  date: string;
  impressions: number;
  clicks: number;
}

interface AggregatedStats {
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  dailyStats: { date: string; impressions: number; clicks: number }[];
}

const chartConfig = {
  impressions: {
    label: "Wyświetlenia",
    color: "hsl(var(--primary))",
  },
  clicks: {
    label: "Kliknięcia",
    color: "hsl(var(--chart-2))",
  },
};

export default function DashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AggregatedStats>({
    totalImpressions: 0,
    totalClicks: 0,
    ctr: 0,
    dailyStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Get user's campaigns
        const { data: campaigns } = await supabase
          .from("ad_campaigns")
          .select("id")
          .eq("user_id", user.id);

        if (!campaigns || campaigns.length === 0) {
          setLoading(false);
          return;
        }

        const campaignIds = campaigns.map(c => c.id);
        const daysBack = period === "7d" ? 7 : period === "30d" ? 30 : 90;
        const startDate = format(subDays(new Date(), daysBack), "yyyy-MM-dd");

        // Fetch stats
        const { data: statsData } = await supabase
          .from("campaign_stats")
          .select("*")
          .in("campaign_id", campaignIds)
          .gte("date", startDate)
          .order("date", { ascending: true });

        if (statsData) {
          // Aggregate by date
          const dailyMap = new Map<string, { impressions: number; clicks: number }>();
          
          statsData.forEach(stat => {
            const existing = dailyMap.get(stat.date) || { impressions: 0, clicks: 0 };
            dailyMap.set(stat.date, {
              impressions: existing.impressions + stat.impressions,
              clicks: existing.clicks + stat.clicks,
            });
          });

          const dailyStats = Array.from(dailyMap.entries()).map(([date, data]) => ({
            date: format(parseISO(date), "d MMM", { locale: pl }),
            impressions: data.impressions,
            clicks: data.clicks,
          }));

          const totalImpressions = statsData.reduce((sum, s) => sum + s.impressions, 0);
          const totalClicks = statsData.reduce((sum, s) => sum + s.clicks, 0);

          setStats({
            totalImpressions,
            totalClicks,
            ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
            dailyStats,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, period]);

  // Mock device data for visualization
  const deviceData = [
    { name: "Desktop", value: 65, color: "hsl(var(--primary))" },
    { name: "Mobile", value: 30, color: "hsl(var(--chart-2))" },
    { name: "Tablet", value: 5, color: "hsl(var(--chart-3))" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Statystyki kampanii</h1>
          <p className="text-muted-foreground mt-1">
            Analizuj skuteczność swoich reklam.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={period === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("7d")}
          >
            7 dni
          </Button>
          <Button
            variant={period === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("30d")}
          >
            30 dni
          </Button>
          <Button
            variant={period === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("90d")}
          >
            90 dni
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wyświetlenia
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              W wybranym okresie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kliknięcia
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              W wybranym okresie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CTR
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ctr.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Click-through rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Wyświetlenia i kliknięcia</CardTitle>
          <CardDescription>Dzienna aktywność w wybranym okresie</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Ładowanie...
            </div>
          ) : stats.dailyStats.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Brak danych do wyświetlenia
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={stats.dailyStats} accessibilityLayer>
                <defs>
                  <linearGradient id="fillImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-impressions)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-impressions)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-clicks)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-clicks)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="impressions" 
                  stroke="var(--color-impressions)" 
                  fill="url(#fillImpressions)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="var(--color-clicks)" 
                  fill="url(#fillClicks)" 
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Device Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Urządzenia</CardTitle>
            <CardDescription>Rozkład wyświetleń według urządzeń</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceData.map((device) => (
                <div key={device.name} className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `color-mix(in srgb, ${device.color} 20%, transparent)` }}
                  >
                    {device.name === "Desktop" ? (
                      <Monitor className="h-5 w-5" style={{ color: device.color }} />
                    ) : (
                      <Smartphone className="h-5 w-5" style={{ color: device.color }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{device.name}</span>
                      <span className="text-sm text-muted-foreground">{device.value}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${device.value}%`, backgroundColor: device.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Najlepsze dni</CardTitle>
            <CardDescription>Dni z największą liczbą interakcji</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.dailyStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Brak danych
              </div>
            ) : (
              <div className="space-y-3">
                {[...stats.dailyStats]
                  .sort((a, b) => b.clicks - a.clicks)
                  .slice(0, 5)
                  .map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </div>
                        <span className="font-medium">{day.date}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {day.impressions.toLocaleString()} wyśw. / {day.clicks} klik.
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
