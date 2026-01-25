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
  ExternalLink,
  Image,
  Target,
  CreditCard,
  BarChart3
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useDemo } from "@/contexts/DemoContext";
import { format, parseISO, addDays, addMonths } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";

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

// Demo campaigns
const demoCampaigns: Campaign[] = [
  {
    id: "demo-1",
    name: "Kampania promocyjna - Nowy produkt",
    status: "active",
    start_date: "2024-12-01",
    end_date: "2024-12-31",
    total_credits: 500,
    ad_type: "banner",
    content_url: null,
    target_url: "https://example.com/produkt",
    created_at: "2024-11-28T10:00:00Z",
    placement_name: "Banner główny",
    impressions: 23456,
    clicks: 567,
  },
  {
    id: "demo-2",
    name: "Reklama świąteczna",
    status: "active",
    start_date: "2024-12-15",
    end_date: "2025-01-05",
    total_credits: 300,
    ad_type: "banner",
    content_url: null,
    target_url: "https://example.com/swieta",
    created_at: "2024-12-10T14:30:00Z",
    placement_name: "Sidebar prawy",
    impressions: 12890,
    clicks: 234,
  },
  {
    id: "demo-3",
    name: "Kampania testowa",
    status: "pending",
    start_date: "2025-01-01",
    end_date: "2025-01-31",
    total_credits: 200,
    ad_type: "banner",
    content_url: null,
    target_url: "https://example.com",
    created_at: "2024-12-20T09:15:00Z",
    placement_name: "Banner artykułu",
    impressions: 0,
    clicks: 0,
  },
  {
    id: "demo-4",
    name: "Black Friday 2024",
    status: "completed",
    start_date: "2024-11-20",
    end_date: "2024-11-30",
    total_credits: 1000,
    ad_type: "banner",
    content_url: null,
    target_url: "https://example.com/black-friday",
    created_at: "2024-11-15T08:00:00Z",
    placement_name: "Banner główny",
    impressions: 45000,
    clicks: 1890,
  },
];

export default function DashboardCampaigns() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(undefined);
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    // If demo mode, use demo campaigns
    if (isDemoMode) {
      setCampaigns(demoCampaigns);
      setLoading(false);
      return;
    }

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
  }, [user, isDemoMode]);

  // Helper to get effective status (treat expired "active" campaigns as "completed")
  const getEffectiveStatus = (campaign: Campaign) => {
    const today = new Date().toISOString().split("T")[0];
    if (campaign.status === "active" && campaign.end_date < today) {
      return "completed";
    }
    return campaign.status;
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (activeTab === "all") return true;
    return getEffectiveStatus(campaign) === activeTab;
  });

  const getCounts = () => ({
    all: campaigns.length,
    pending: campaigns.filter(c => getEffectiveStatus(c) === "pending").length,
    active: campaigns.filter(c => getEffectiveStatus(c) === "active").length,
    completed: campaigns.filter(c => getEffectiveStatus(c) === "completed").length,
  });

  const counts = getCounts();

  const openDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDetailsOpen(true);
  };

  const openExtend = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setNewEndDate(addMonths(parseISO(campaign.end_date), 1));
    setExtendOpen(true);
  };

  const handleExtendCampaign = async () => {
    if (!selectedCampaign || !newEndDate || isDemoMode) {
      if (isDemoMode) {
        toast.success("Kampania została przedłużona (tryb demo)");
        setExtendOpen(false);
        return;
      }
      return;
    }

    setExtending(true);
    try {
      const { error } = await supabase
        .from("ad_campaigns")
        .update({ end_date: format(newEndDate, "yyyy-MM-dd") })
        .eq("id", selectedCampaign.id);

      if (error) throw error;

      // Update local state
      setCampaigns(prev => prev.map(c => 
        c.id === selectedCampaign.id 
          ? { ...c, end_date: format(newEndDate, "yyyy-MM-dd") }
          : c
      ));

      toast.success("Kampania została przedłużona");
      setExtendOpen(false);
    } catch (error) {
      console.error("Error extending campaign:", error);
      toast.error("Nie udało się przedłużyć kampanii");
    } finally {
      setExtending(false);
    }
  };

  const getCTR = (campaign: Campaign) => {
    if (!campaign.impressions || campaign.impressions === 0) return "0.00";
    return ((campaign.clicks || 0) / campaign.impressions * 100).toFixed(2);
  };

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
                              <DropdownMenuItem onClick={() => openDetails(campaign)}>
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
                              {(campaign.status === "active" || campaign.status === "completed") && (
                                <DropdownMenuItem onClick={() => openExtend(campaign)}>
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

      {/* Campaign Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              {selectedCampaign?.name}
            </DialogTitle>
            <DialogDescription>
              Szczegółowe informacje o kampanii
            </DialogDescription>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6">
              {/* Status & Dates */}
              <div className="flex items-center gap-3">
                <Badge variant={statusConfig[selectedCampaign.status]?.variant || "secondary"}>
                  {statusConfig[selectedCampaign.status]?.label || selectedCampaign.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(parseISO(selectedCampaign.start_date), "d MMMM yyyy", { locale: pl })} - {format(parseISO(selectedCampaign.end_date), "d MMMM yyyy", { locale: pl })}
                </span>
              </div>

              {/* Preview Image */}
              {selectedCampaign.content_url && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Image className="h-4 w-4" />
                    Podgląd reklamy
                  </div>
                  <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                    <img 
                      src={selectedCampaign.content_url} 
                      alt="Podgląd reklamy"
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <Eye className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{(selectedCampaign.impressions || 0).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Wyświetleń</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <MousePointerClick className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{(selectedCampaign.clicks || 0).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Kliknięć</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <BarChart3 className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{getCTR(selectedCampaign)}%</div>
                  <div className="text-xs text-muted-foreground">CTR</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <CreditCard className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{selectedCampaign.total_credits}</div>
                  <div className="text-xs text-muted-foreground">Kredytów</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3 text-sm">
                {selectedCampaign.placement_name && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Placement:</span>
                    <span className="font-medium">{selectedCampaign.placement_name}</span>
                  </div>
                )}
                {selectedCampaign.target_url && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Link docelowy:</span>
                    <a 
                      href={selectedCampaign.target_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline truncate max-w-xs"
                    >
                      {selectedCampaign.target_url}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Utworzono:</span>
                  <span className="font-medium">
                    {format(parseISO(selectedCampaign.created_at), "d MMMM yyyy, HH:mm", { locale: pl })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Zamknij
            </Button>
            {selectedCampaign && (selectedCampaign.status === "active" || selectedCampaign.status === "completed") && (
              <Button variant="gradient" onClick={() => {
                setDetailsOpen(false);
                openExtend(selectedCampaign);
              }}>
                <Calendar className="h-4 w-4 mr-2" />
                Przedłuż kampanię
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Campaign Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przedłuż kampanię</DialogTitle>
            <DialogDescription>
              Wybierz nową datę zakończenia dla kampanii "{selectedCampaign?.name}"
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Obecna data zakończenia: <span className="font-medium text-foreground">
                  {format(parseISO(selectedCampaign.end_date), "d MMMM yyyy", { locale: pl })}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nowa data zakończenia</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {newEndDate ? format(newEndDate, "d MMMM yyyy", { locale: pl }) : "Wybierz datę"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newEndDate}
                      onSelect={setNewEndDate}
                      disabled={(date) => date < addDays(parseISO(selectedCampaign.end_date), 1)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quick extend buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewEndDate(addDays(parseISO(selectedCampaign.end_date), 7))}
                >
                  +7 dni
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewEndDate(addDays(parseISO(selectedCampaign.end_date), 14))}
                >
                  +14 dni
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewEndDate(addMonths(parseISO(selectedCampaign.end_date), 1))}
                >
                  +1 miesiąc
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewEndDate(addMonths(parseISO(selectedCampaign.end_date), 3))}
                >
                  +3 miesiące
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOpen(false)}>
              Anuluj
            </Button>
            <Button 
              variant="gradient" 
              onClick={handleExtendCampaign}
              disabled={!newEndDate || extending}
            >
              {extending ? "Przedłużanie..." : "Przedłuż kampanię"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
