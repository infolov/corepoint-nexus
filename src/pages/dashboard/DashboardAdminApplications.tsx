import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { 
  FileText, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Handshake,
  User,
  Briefcase,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface PartnerApplication {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  industry: string;
  partnership_type: "site" | "category";
  target_category: string | null;
  message: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function DashboardAdminApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications((data || []) as PartnerApplication[]);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Błąd podczas pobierania zgłoszeń");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (applicationId: string, newStatus: "approved" | "rejected") => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("partner_applications")
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (error) throw error;

      toast.success(
        newStatus === "approved" 
          ? "Zgłoszenie zostało zaakceptowane" 
          : "Zgłoszenie zostało odrzucone"
      );

      setSelectedApplication(null);
      setAdminNotes("");
      fetchApplications();
    } catch (error: any) {
      console.error("Error updating application:", error);
      toast.error("Błąd podczas aktualizacji zgłoszenia");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Oczekuje</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Zaakceptowane</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Odrzucone</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPartnershipTypeBadge = (type: string) => {
    if (type === "site") {
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Partner Serwisu</Badge>;
    }
    return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">Partner Kategorii</Badge>;
  };

  const filteredApplications = applications.filter(app => {
    if (activeTab === "all") return true;
    return app.status === activeTab;
  });

  const pendingCount = applications.filter(a => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Zgłoszenia partnerskie
          </h1>
          <p className="text-muted-foreground mt-1">
            Zarządzaj zgłoszeniami od potencjalnych partnerów
          </p>
        </div>
        <Button variant="outline" onClick={fetchApplications} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Odśwież
        </Button>
      </div>

      {pendingCount > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              {pendingCount} {pendingCount === 1 ? "nowe zgłoszenie czeka" : "nowych zgłoszeń czeka"} na rozpatrzenie
            </span>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1">
            Oczekujące
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Zaakceptowane</TabsTrigger>
          <TabsTrigger value="rejected">Odrzucone</TabsTrigger>
          <TabsTrigger value="all">Wszystkie</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Brak zgłoszeń do wyświetlenia
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Firma</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Branża</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.company_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{application.contact_name}</div>
                            <div className="text-muted-foreground">{application.contact_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPartnershipTypeBadge(application.partnership_type)}
                          {application.target_category && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Kat: {application.target_category}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{application.industry}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(application.created_at), "d MMM yyyy", { locale: pl })}
                        </TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application);
                              setAdminNotes(application.admin_notes || "");
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Szczegóły
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {selectedApplication.company_name}
                </DialogTitle>
                <DialogDescription>
                  Szczegóły zgłoszenia partnerskiego
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  {getStatusBadge(selectedApplication.status)}
                  {getPartnershipTypeBadge(selectedApplication.partnership_type)}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Osoba kontaktowa</div>
                        <div className="text-sm text-muted-foreground">{selectedApplication.contact_name}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Email</div>
                        <a href={`mailto:${selectedApplication.contact_email}`} className="text-sm text-primary hover:underline">
                          {selectedApplication.contact_email}
                        </a>
                      </div>
                    </div>

                    {selectedApplication.contact_phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Telefon</div>
                          <a href={`tel:${selectedApplication.contact_phone}`} className="text-sm text-primary hover:underline">
                            {selectedApplication.contact_phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Branża</div>
                        <div className="text-sm text-muted-foreground">{selectedApplication.industry}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Handshake className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Typ partnerstwa</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedApplication.partnership_type === "site" ? "Partner Serwisu" : "Partner Kategorii"}
                          {selectedApplication.target_category && ` (${selectedApplication.target_category})`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Data zgłoszenia</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(selectedApplication.created_at), "d MMMM yyyy, HH:mm", { locale: pl })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedApplication.message && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Wiadomość od zgłaszającego</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedApplication.message}
                    </p>
                  </div>
                )}

                {selectedApplication.status === "pending" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notatka administratora</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Dodaj notatkę (opcjonalnie)..."
                      rows={3}
                    />
                  </div>
                )}

                {selectedApplication.admin_notes && selectedApplication.status !== "pending" && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm font-medium mb-1">Notatka administratora</div>
                    <p className="text-sm text-muted-foreground">{selectedApplication.admin_notes}</p>
                  </div>
                )}

                {selectedApplication.reviewed_at && (
                  <div className="text-xs text-muted-foreground">
                    Rozpatrzone: {format(new Date(selectedApplication.reviewed_at), "d MMMM yyyy, HH:mm", { locale: pl })}
                  </div>
                )}
              </div>

              {selectedApplication.status === "pending" && (
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusChange(selectedApplication.id, "rejected")}
                    disabled={isProcessing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Odrzuć
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(selectedApplication.id, "approved")}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Zaakceptuj
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
