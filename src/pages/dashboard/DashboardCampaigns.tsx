import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Megaphone, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  MousePointerClick,
  MoreVertical,
  Calendar,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

interface Campaign {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  total_credits: number;
  ad_type: string;
  content_url: string | null;
  target_url: string | null;
  created_at: string;
  placement_name?: string;
  impressions?: number;
  clicks?: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "Oczekująca", variant: "secondary", icon: Clock },
  active: { label: "Aktywna", variant: "default", icon: CheckCircle },
  completed: { label: "Zakończona", variant: "outline", icon: CheckCircle },
  rejected: { label: "Odrzucona", variant: "destructive", icon: XCircle },
};

export default function DashboardCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return;

      try {
        const { data: campaignsData, error } = await supabase
          .from("ad_campaigns")
          .select(`
            *,
            ad_placements (name)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Fetch stats for each campaign
        const campaignsWithStats = await Promise.all(
          (campaignsData || []).map(async (campaign) => {
            const { data: stats } = await supabase
              .from("campaign_stats")
              .select("impressions, clicks")
              .eq("campaign_id", campaign.id);

            const totalImpressions = stats?.reduce((sum, s) => sum + s.impressions, 0) || 0;
            const totalClicks = stats?.reduce((sum, s) => sum + s.clicks, 0) || 0;

            return {
              ...campaign,
              placement_name: (campaign.ad_placements as any)?.name,
              impressions: totalImpressions,
              clicks: totalClicks,
            };
          })
        );

        setCampaigns(campaignsWithStats);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user]);

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (activeTab === "all") return true;
    return campaign.status === activeTab;
  });

  const getCounts = () => ({
    all: campaigns.length,
    pending: campaigns.filter(c => c.status === "pending").length,
    active: campaigns.filter(c => c.status === "active").length,
    completed: campaigns.filter(c => c.status === "completed").length,
  });

  const counts = getCounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Moje kampanie</h1>
          <p className="text-muted-foreground mt-1">
            Zarządzaj swoimi kampaniami reklamowymi.
          </p>
        </div>
        <Link to="/dashboard/placements">
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Nowa kampania
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Wszystkie ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Oczekujące ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="active">
            Aktywne ({counts.active})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Zakończone ({counts.completed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Brak kampanii</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "all" 
                    ? "Nie masz jeszcze żadnych kampanii. Utwórz swoją pierwszą kampanię!"
                    : `Nie masz kampanii o statusie "${statusConfig[activeTab]?.label || activeTab}"`
                  }
                </p>
                {activeTab === "all" && (
                  <Link to="/dashboard/placements">
                    <Button variant="gradient">
                      <Plus className="h-4 w-4 mr-2" />
                      Utwórz kampanię
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => {
                const status = statusConfig[campaign.status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{campaign.name}</h3>
                            <Badge variant={status.variant}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(parseISO(campaign.start_date), "d MMM", { locale: pl })} - {format(parseISO(campaign.end_date), "d MMM yyyy", { locale: pl })}
                            </span>
                            {campaign.placement_name && (
                              <span>• {campaign.placement_name}</span>
                            )}
                            <span>• {campaign.total_credits} kredytów</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Eye className="h-4 w-4" />
                                <span className="font-semibold text-foreground">
                                  {(campaign.impressions || 0).toLocaleString()}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">wyświetleń</span>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MousePointerClick className="h-4 w-4" />
                                <span className="font-semibold text-foreground">
                                  {(campaign.clicks || 0).toLocaleString()}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">kliknięć</span>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Szczegóły
                              </DropdownMenuItem>
                              {campaign.target_url && (
                                <DropdownMenuItem asChild>
                                  <a href={campaign.target_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Otwórz link
                                  </a>
                                </DropdownMenuItem>
                              )}
                              {campaign.status === "active" && (
                                <DropdownMenuItem>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Przedłuż kampanię
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
