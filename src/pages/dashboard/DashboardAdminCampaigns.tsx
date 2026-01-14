import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Edit,
  Trash2,
  Save,
  X,
  Filter,
  Target,
  BarChart3,
  MousePointerClick,
  MapPin,
} from "lucide-react";
import { CampaignReachIndicator } from "@/components/admin/CampaignReachIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Placement {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface Campaign {
  id: string;
  name: string;
  ad_type: string;
  content_url: string | null;
  content_text: string | null;
  target_url: string | null;
  status: string;
  start_date: string;
  end_date: string;
  total_credits: number;
  created_at: string;
  user_id: string;
  placement_id: string;
  rejection_reason: string | null;
  is_global: boolean;
  region: string | null;
  target_powiat: string | null;
  target_gmina: string | null;
  placement_name?: string;
  placement_slug?: string;
  user_email?: string;
  user_name?: string;
}

interface PlacementStats {
  total: number;
  active: number;
  pending: number;
  impressions: number;
  clicks: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Oczekująca", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Zatwierdzona", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  active: { label: "Aktywna", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Odrzucona", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

export default function DashboardAdminCampaigns() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [placementStats, setPlacementStats] = useState<Record<string, PlacementStats>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedPlacementFilter, setSelectedPlacementFilter] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    target_url: "",
    content_text: "",
    start_date: "",
    end_date: "",
    total_credits: 0,
    placement_id: "",
  });
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (user && isAdmin) {
      fetchPlacements();
      fetchCampaigns();
    }
  }, [user, isAdmin]);

  const fetchPlacements = async () => {
    const { data, error } = await supabase
      .from("ad_placements")
      .select("id, name, slug, is_active")
      .order("name");

    if (!error && data) {
      setPlacements(data);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    
    // Fetch campaigns with placements
    const { data: campaignsData, error: campaignsError } = await supabase
      .from("ad_campaigns")
      .select(`
        *,
        ad_placements (id, name, slug)
      `)
      .order("created_at", { ascending: false });

    if (campaignsError) {
      console.error("Error fetching campaigns:", campaignsError);
      toast.error("Błąd podczas pobierania kampanii");
      setLoading(false);
      return;
    }

    // Fetch user profiles
    const userIds = [...new Set((campaignsData || []).map(c => c.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", userIds);

    const profilesMap = new Map(
      (profilesData || []).map(p => [p.user_id, p])
    );

    // Fetch campaign stats for all campaigns
    const campaignIds = (campaignsData || []).map(c => c.id);
    const { data: statsData } = await supabase
      .from("campaign_stats")
      .select("campaign_id, impressions, clicks")
      .in("campaign_id", campaignIds);

    // Aggregate stats by campaign
    const statsMap = new Map<string, { impressions: number; clicks: number }>();
    (statsData || []).forEach(stat => {
      const existing = statsMap.get(stat.campaign_id) || { impressions: 0, clicks: 0 };
      statsMap.set(stat.campaign_id, {
        impressions: existing.impressions + (stat.impressions || 0),
        clicks: existing.clicks + (stat.clicks || 0),
      });
    });

    const formattedCampaigns: Campaign[] = (campaignsData || []).map(campaign => ({
      ...campaign,
      placement_name: campaign.ad_placements?.name || "Nieznane",
      placement_slug: campaign.ad_placements?.slug || "",
      user_email: profilesMap.get(campaign.user_id)?.email || "Brak",
      user_name: profilesMap.get(campaign.user_id)?.full_name || "Nieznany",
    }));

    setCampaigns(formattedCampaigns);

    // Calculate stats per placement
    const newPlacementStats: Record<string, PlacementStats> = {};
    formattedCampaigns.forEach(campaign => {
      const placementId = campaign.placement_id;
      if (!newPlacementStats[placementId]) {
        newPlacementStats[placementId] = { total: 0, active: 0, pending: 0, impressions: 0, clicks: 0 };
      }
      newPlacementStats[placementId].total++;
      if (campaign.status === "active" || campaign.status === "approved") {
        newPlacementStats[placementId].active++;
      }
      if (campaign.status === "pending") {
        newPlacementStats[placementId].pending++;
      }
      const stats = statsMap.get(campaign.id);
      if (stats) {
        newPlacementStats[placementId].impressions += stats.impressions;
        newPlacementStats[placementId].clicks += stats.clicks;
      }
    });
    setPlacementStats(newPlacementStats);

    setLoading(false);
  };

  const handleApprove = async (campaign: Campaign) => {
    setProcessing(true);
    
    const { error } = await supabase
      .from("ad_campaigns")
      .update({ status: "active" })
      .eq("id", campaign.id);

    if (error) {
      toast.error("Błąd podczas zatwierdzania kampanii");
    } else {
      toast.success("Kampania została zatwierdzona i jest teraz aktywna");
      fetchCampaigns();
    }
    
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedCampaign || !rejectionReason.trim()) {
      toast.error("Podaj powód odrzucenia");
      return;
    }

    setProcessing(true);
    
    const { error } = await supabase
      .from("ad_campaigns")
      .update({ 
        status: "rejected",
        rejection_reason: rejectionReason.trim()
      })
      .eq("id", selectedCampaign.id);

    if (error) {
      toast.error("Błąd podczas odrzucania kampanii");
    } else {
      toast.success("Kampania została odrzucona");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedCampaign(null);
      fetchCampaigns();
    }
    
    setProcessing(false);
  };

  const openRejectDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setRejectDialogOpen(true);
  };

  const openPreviewDialog = (campaign: Campaign) => {
    setPreviewCampaign(campaign);
    setPreviewDialogOpen(true);
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditCampaign(campaign);
    setEditForm({
      name: campaign.name,
      target_url: campaign.target_url || "",
      content_text: campaign.content_text || "",
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      total_credits: campaign.total_credits,
      placement_id: campaign.placement_id,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editCampaign) return;

    setProcessing(true);
    
    const { error } = await supabase
      .from("ad_campaigns")
      .update({
        name: editForm.name,
        target_url: editForm.target_url || null,
        content_text: editForm.content_text || null,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        total_credits: editForm.total_credits,
        placement_id: editForm.placement_id,
      })
      .eq("id", editCampaign.id);

    if (error) {
      console.error("Error updating campaign:", error);
      toast.error("Błąd podczas aktualizacji kampanii");
    } else {
      toast.success("Kampania została zaktualizowana");
      setEditDialogOpen(false);
      setEditCampaign(null);
      fetchCampaigns();
    }
    
    setProcessing(false);
  };

  const openDeleteDialog = (campaign: Campaign) => {
    setDeleteCampaign(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteCampaign) return;

    setProcessing(true);
    
    // First delete related campaign_stats
    await supabase
      .from("campaign_stats")
      .delete()
      .eq("campaign_id", deleteCampaign.id);
    
    // Then delete the campaign
    const { error } = await supabase
      .from("ad_campaigns")
      .delete()
      .eq("id", deleteCampaign.id);

    if (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Błąd podczas usuwania kampanii");
    } else {
      toast.success("Kampania została usunięta");
      setDeleteDialogOpen(false);
      setDeleteCampaign(null);
      fetchCampaigns();
    }
    
    setProcessing(false);
  };

  // Filter by status and placement
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      // Status filter
      const statusMatch = activeTab === "all" ? true :
        activeTab === "approved" ? (campaign.status === "approved" || campaign.status === "active") :
        campaign.status === activeTab;
      
      // Placement filter
      const placementMatch = selectedPlacementFilter === "all" || 
        campaign.placement_id === selectedPlacementFilter;
      
      return statusMatch && placementMatch;
    });
  }, [campaigns, activeTab, selectedPlacementFilter]);

  const getCounts = () => {
    const filtered = selectedPlacementFilter === "all" ? campaigns :
      campaigns.filter(c => c.placement_id === selectedPlacementFilter);
    
    return {
      pending: filtered.filter(c => c.status === "pending").length,
      approved: filtered.filter(c => c.status === "approved" || c.status === "active").length,
      rejected: filtered.filter(c => c.status === "rejected").length,
      all: filtered.length,
    };
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-medium">Brak dostępu</p>
          <p className="text-muted-foreground">Nie masz uprawnień do tej sekcji</p>
        </CardContent>
      </Card>
    );
  }

  const counts = getCounts();

  return (
    <div className="space-y-6">
      {/* Placement Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${selectedPlacementFilter === "all" ? "ring-2 ring-primary" : "hover:border-primary/50"}`}
          onClick={() => setSelectedPlacementFilter("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Wszystkie</span>
            </div>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <div className="text-xs text-muted-foreground">kampanii</div>
          </CardContent>
        </Card>
        
        {placements.map(placement => {
          const stats = placementStats[placement.id] || { total: 0, active: 0, pending: 0, impressions: 0, clicks: 0 };
          const isSelected = selectedPlacementFilter === placement.id;
          
          return (
            <Card 
              key={placement.id}
              className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : "hover:border-primary/50"} ${!placement.is_active ? "opacity-60" : ""}`}
              onClick={() => setSelectedPlacementFilter(placement.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm truncate" title={placement.name}>
                    {placement.name}
                  </span>
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="flex items-center gap-2 mt-1">
                  {stats.pending > 0 && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {stats.pending}
                    </Badge>
                  )}
                  {stats.active > 0 && (
                    <Badge variant="default" className="text-xs gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {stats.active}
                    </Badge>
                  )}
                </div>
                {(stats.impressions > 0 || stats.clicks > 0) && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {stats.impressions.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      {stats.clicks.toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {selectedPlacementFilter === "all" 
              ? "Wszystkie kampanie reklamowe" 
              : `Kampanie: ${placements.find(p => p.id === selectedPlacementFilter)?.name || ""}`
            }
          </CardTitle>
          {selectedPlacementFilter !== "all" && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedPlacementFilter("all")}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Wyczyść filtr
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Oczekujące ({counts.pending})
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Aktywne ({counts.approved})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Odrzucone ({counts.rejected})
                </TabsTrigger>
                <TabsTrigger value="all">
                  Wszystkie ({counts.all})
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedPlacementFilter} onValueChange={setSelectedPlacementFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtruj po placemencie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie placementy</SelectItem>
                    {placements.map(placement => (
                      <SelectItem key={placement.id} value={placement.id}>
                        {placement.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value={activeTab}>
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Brak kampanii w tej kategorii
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Nazwa kampanii</TableHead>
                      <TableHead>Placement</TableHead>
                      <TableHead>Targetowanie</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Daty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.user_name}</div>
                            <div className="text-sm text-muted-foreground">{campaign.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.placement_name}</TableCell>
                        <TableCell>
                          {campaign.is_global ? (
                            <Badge variant="secondary" className="gap-1">
                              <Target className="h-3 w-3" />
                              Krajowa
                            </Badge>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              {campaign.region && (
                                <Badge variant="outline" className="gap-1 text-xs">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {campaign.target_powiat || campaign.region}
                                </Badge>
                              )}
                              {!campaign.region && (
                                <span className="text-xs text-muted-foreground">Brak</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {campaign.ad_type === "image" ? "Obraz" : "Tekst"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(campaign.start_date), "dd MMM yyyy", { locale: pl })}</div>
                            <div className="text-muted-foreground">
                              do {format(new Date(campaign.end_date), "dd MMM yyyy", { locale: pl })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[campaign.status]?.variant || "outline"} className="gap-1">
                            {statusConfig[campaign.status]?.icon}
                            {statusConfig[campaign.status]?.label || campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPreviewDialog(campaign)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {/* Edit button - available for all campaigns */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(campaign)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {/* Delete button - available for all campaigns */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(campaign)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            
                            {campaign.status === "pending" && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApprove(campaign)}
                                  disabled={processing}
                                  className="gap-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Zatwierdź
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openRejectDialog(campaign)}
                                  disabled={processing}
                                  className="gap-1"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Odrzuć
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odrzuć kampanię</DialogTitle>
            <DialogDescription>
              Podaj powód odrzucenia kampanii "{selectedCampaign?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Powód odrzucenia</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Opisz powód odrzucenia..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Anuluj
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              Odrzuć kampanię
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Podgląd kampanii: {previewCampaign?.name}</DialogTitle>
            <DialogDescription>
              Partner: {previewCampaign?.user_name} ({previewCampaign?.user_email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Campaign details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Placement:</span>
                <span className="ml-2 font-medium">{previewCampaign?.placement_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Typ:</span>
                <span className="ml-2 font-medium">
                  {previewCampaign?.ad_type === "image" ? "Obraz" : "Tekst"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Data rozpoczęcia:</span>
                <span className="ml-2 font-medium">
                  {previewCampaign && format(new Date(previewCampaign.start_date), "dd MMM yyyy", { locale: pl })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Data zakończenia:</span>
                <span className="ml-2 font-medium">
                  {previewCampaign && format(new Date(previewCampaign.end_date), "dd MMM yyyy", { locale: pl })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Kredyty:</span>
                <span className="ml-2 font-medium">{previewCampaign?.total_credits}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge 
                  variant={statusConfig[previewCampaign?.status || "pending"]?.variant || "outline"} 
                  className="ml-2 gap-1"
                >
                  {statusConfig[previewCampaign?.status || "pending"]?.icon}
                  {statusConfig[previewCampaign?.status || "pending"]?.label}
                </Badge>
              </div>
            </div>

            {/* Ad preview */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="text-sm font-medium mb-2">Podgląd reklamy:</h4>
              {previewCampaign?.ad_type === "image" && previewCampaign.content_url ? (
                <div className="flex justify-center">
                  <img 
                    src={previewCampaign.content_url} 
                    alt="Podgląd reklamy"
                    className="max-w-full max-h-64 object-contain rounded"
                  />
                </div>
              ) : previewCampaign?.content_text ? (
                <div className="p-4 bg-background rounded border">
                  <p>{previewCampaign.content_text}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center">Brak treści do wyświetlenia</p>
              )}
            </div>

            {previewCampaign?.target_url && (
              <div>
                <span className="text-sm text-muted-foreground">Link docelowy:</span>
                <a 
                  href={previewCampaign.target_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-sm text-primary hover:underline"
                >
                  {previewCampaign.target_url}
                </a>
              </div>
            )}

            {/* Campaign Reach Indicator */}
            {previewCampaign && (
              <CampaignReachIndicator
                isGlobal={previewCampaign.is_global}
                region={previewCampaign.region}
                targetPowiat={previewCampaign.target_powiat}
                targetGmina={previewCampaign.target_gmina}
              />
            )}

            {previewCampaign?.rejection_reason && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <span className="text-sm font-medium text-destructive">Powód odrzucenia:</span>
                <p className="mt-1 text-sm">{previewCampaign.rejection_reason}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            {previewCampaign?.status === "pending" && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    handleApprove(previewCampaign);
                    setPreviewDialogOpen(false);
                  }}
                  disabled={processing}
                  className="gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Zatwierdź
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setPreviewDialogOpen(false);
                    openRejectDialog(previewCampaign);
                  }}
                  disabled={processing}
                  className="gap-1"
                >
                  <XCircle className="h-4 w-4" />
                  Odrzuć
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Zamknij
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edytuj kampanię</DialogTitle>
            <DialogDescription>
              Edytuj szczegóły kampanii "{editCampaign?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nazwa kampanii</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-target-url">Link docelowy</Label>
              <Input
                id="edit-target-url"
                value={editForm.target_url}
                onChange={(e) => setEditForm({ ...editForm, target_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            {editCampaign?.ad_type === "text" && (
              <div className="space-y-2">
                <Label htmlFor="edit-content-text">Treść tekstowa</Label>
                <Textarea
                  id="edit-content-text"
                  value={editForm.content_text}
                  onChange={(e) => setEditForm({ ...editForm, content_text: e.target.value })}
                  rows={3}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Data rozpoczęcia</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-date">Data zakończenia</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-placement">Miejsce reklamowe</Label>
              <Select 
                value={editForm.placement_id} 
                onValueChange={(value) => setEditForm({ ...editForm, placement_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz placement" />
                </SelectTrigger>
                <SelectContent>
                  {placements.map(placement => (
                    <SelectItem key={placement.id} value={placement.id}>
                      {placement.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-credits">Kredyty</Label>
              <Input
                id="edit-credits"
                type="number"
                value={editForm.total_credits}
                onChange={(e) => setEditForm({ ...editForm, total_credits: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Anuluj
            </Button>
            <Button onClick={handleEdit} disabled={processing || !editForm.name.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Zapisz zmiany
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń kampanię</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć kampanię "{deleteCampaign?.name}"? 
              Ta operacja jest nieodwracalna i usunie również wszystkie statystyki powiązane z tą kampanią.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={processing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Usuń kampanię
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
