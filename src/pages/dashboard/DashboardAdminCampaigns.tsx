import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Calendar, 
  User, 
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface Campaign {
  id: string;
  name: string;
  status: string;
  ad_type: string;
  start_date: string;
  end_date: string;
  total_credits: number;
  target_url: string | null;
  content_url: string | null;
  content_text: string | null;
  created_at: string;
  user_id: string;
  placement_name?: string;
  user_email?: string;
  user_name?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Oczekująca", variant: "secondary", icon: Clock },
  approved: { label: "Zatwierdzona", variant: "default", icon: CheckCircle },
  active: { label: "Aktywna", variant: "default", icon: CheckCircle },
  rejected: { label: "Odrzucona", variant: "destructive", icon: XCircle },
  completed: { label: "Zakończona", variant: "outline", icon: CheckCircle },
  cancelled: { label: "Anulowana", variant: "outline", icon: XCircle },
};

export default function DashboardAdminCampaigns() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      fetchCampaigns();
    }
  }, [user, isAdmin]);

  const fetchCampaigns = async () => {
    setLoading(true);
    
    // Fetch all campaigns (admin has access via RLS)
    const { data: campaignsData, error: campaignsError } = await supabase
      .from("ad_campaigns")
      .select(`
        *,
        ad_placements (name)
      `)
      .order("created_at", { ascending: false });

    if (campaignsError) {
      console.error("Error fetching campaigns:", campaignsError);
      toast.error("Błąd podczas pobierania kampanii");
      setLoading(false);
      return;
    }

    // Fetch user profiles for each campaign
    const userIds = [...new Set((campaignsData || []).map(c => c.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", userIds);

    const profilesMap = new Map(
      (profilesData || []).map(p => [p.user_id, p])
    );

    const formattedCampaigns: Campaign[] = (campaignsData || []).map(campaign => ({
      ...campaign,
      placement_name: campaign.ad_placements?.name || "Nieznane",
      user_email: profilesMap.get(campaign.user_id)?.email || "Brak",
      user_name: profilesMap.get(campaign.user_id)?.full_name || "Nieznany",
    }));

    setCampaigns(formattedCampaigns);
    setLoading(false);
  };

  const handleApprove = async (campaign: Campaign) => {
    setProcessing(true);
    
    const { error } = await supabase
      .from("ad_campaigns")
      .update({ status: "approved" })
      .eq("id", campaign.id);

    if (error) {
      toast.error("Błąd podczas zatwierdzania kampanii");
    } else {
      toast.success("Kampania została zatwierdzona");
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

  const filteredCampaigns = campaigns.filter(c => {
    if (activeTab === "all") return true;
    return c.status === activeTab;
  });

  const getCounts = (status: string) => {
    if (status === "all") return campaigns.length;
    return campaigns.filter(c => c.status === status).length;
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Brak dostępu</h2>
          <p className="text-muted-foreground">
            Ta strona jest dostępna tylko dla administratorów.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zarządzanie kampaniami</h1>
        <p className="text-muted-foreground">
          Przeglądaj i zatwierdzaj kampanie reklamowe użytkowników
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Wszystkie kampanie</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Oczekujące ({getCounts("pending")})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Zatwierdzone ({getCounts("approved")})
              </TabsTrigger>
              <TabsTrigger value="active">
                Aktywne ({getCounts("active")})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Odrzucone ({getCounts("rejected")})
              </TabsTrigger>
              <TabsTrigger value="all">
                Wszystkie ({getCounts("all")})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Brak kampanii w tej kategorii
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kampania</TableHead>
                        <TableHead>Reklamodawca</TableHead>
                        <TableHead>Miejsce</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Okres</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.map(campaign => {
                        const status = statusConfig[campaign.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        
                        return (
                          <TableRow key={campaign.id}>
                            <TableCell>
                              <div className="font-medium">{campaign.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(campaign.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm">{campaign.user_name}</div>
                                  <div className="text-xs text-muted-foreground">{campaign.user_email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{campaign.placement_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{campaign.ad_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(campaign.start_date), "d.MM")} - {format(new Date(campaign.end_date), "d.MM.yyyy")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {campaign.target_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                  >
                                    <a href={campaign.target_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                {campaign.content_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                  >
                                    <a href={campaign.content_url} target="_blank" rel="noopener noreferrer">
                                      <Eye className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
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
              Podaj powód odrzucenia kampanii "{selectedCampaign?.name}". 
              Reklamodawca zobaczy tę wiadomość.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Powód odrzucenia..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
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
    </div>
  );
}
