import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Target, 
  CreditCard, 
  BarChart3, 
  Megaphone,
  TrendingUp,
  Eye,
  MousePointerClick,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useDemo } from "@/contexts/DemoContext";
import { supabase } from "@/integrations/supabase/client";
import { FirecrawlStatusAlert } from "@/components/admin/FirecrawlStatusAlert";

interface DashboardStats {
  credits: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
}

const quickActions = [
  { name: "Zarezerwuj reklamę", href: "/dashboard/placements", icon: Target, color: "bg-primary" },
  { name: "Moje kampanie", href: "/dashboard/campaigns", icon: Megaphone, color: "bg-orange-500" },
  { name: "Kalendarz", href: "/dashboard/calendar", icon: Calendar, color: "bg-green-500" },
  { name: "Kredyty reklamowe", href: "/dashboard/credits", icon: CreditCard, color: "bg-purple-500" },
];

// Demo data
const demoStats: DashboardStats = {
  credits: 2500,
  activeCampaigns: 3,
  totalImpressions: 45820,
  totalClicks: 1234,
};

export default function DashboardHome() {
  const { user } = useAuth();
  const { isDemoMode, demoUser } = useDemo();
  const [stats, setStats] = useState<DashboardStats>({
    credits: 0,
    activeCampaigns: 0,
    totalImpressions: 0,
    totalClicks: 0,
  });
  const [loading, setLoading] = useState(true);

  const effectiveUser = isDemoMode ? demoUser : user;

  useEffect(() => {
    // If demo mode, use demo stats
    if (isDemoMode) {
      setStats(demoStats);
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch credits
        const { data: creditsData } = await supabase
          .from("advertiser_credits")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();

        // Fetch active campaigns count
        const { count: activeCampaigns } = await supabase
          .from("ad_campaigns")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "active");

        // Fetch campaign stats
        const { data: campaigns } = await supabase
          .from("ad_campaigns")
          .select("id")
          .eq("user_id", user.id);

        let totalImpressions = 0;
        let totalClicks = 0;

        if (campaigns && campaigns.length > 0) {
          const campaignIds = campaigns.map(c => c.id);
          const { data: statsData } = await supabase
            .from("campaign_stats")
            .select("impressions, clicks")
            .in("campaign_id", campaignIds);

          if (statsData) {
            totalImpressions = statsData.reduce((sum, s) => sum + s.impressions, 0);
            totalClicks = statsData.reduce((sum, s) => sum + s.clicks, 0);
          }
        }

        setStats({
          credits: creditsData?.balance || 0,
          activeCampaigns: activeCampaigns || 0,
          totalImpressions,
          totalClicks,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, isDemoMode]);

  return (
    <div className="space-y-6">
      {/* Firecrawl Status Alert for Admins */}
      <FirecrawlStatusAlert />

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Witaj, {effectiveUser?.user_metadata?.full_name || "Reklamodawco"}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Zarządzaj swoimi kampaniami reklamowymi i śledź ich efektywność.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} to={action.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium">{action.name}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dostępne kredyty
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.credits}</div>
            <Link to="/dashboard/credits" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
              Kup więcej <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktywne kampanie
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <Link to="/dashboard/campaigns" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
              Zobacz wszystkie <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wyświetlenia
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Łącznie ze wszystkich kampanii</p>
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
              CTR: {stats.totalImpressions > 0 
                ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2) 
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Rozpocznij nową kampanię</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Wybierz miejsce reklamowe i dotrzyj do tysięcy czytelników.
            </p>
          </div>
          <Link to="/dashboard/placements">
            <Button variant="gradient" size="lg">
              <Target className="h-5 w-5 mr-2" />
              Przeglądaj miejsca reklamowe
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
