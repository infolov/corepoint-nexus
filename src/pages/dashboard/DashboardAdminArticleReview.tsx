import { useState, useEffect } from "react";
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
  RefreshCw,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface SponsoredArticle {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string;
  image: string;
  target_url: string | null;
  is_sponsored: boolean;
  sponsor_user_id: string | null;
  sponsor_status: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Oczekujący", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Zaakceptowany", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Odrzucony", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  draft: { label: "Szkic", variant: "outline", icon: <FileText className="h-3 w-3" /> },
};

export default function DashboardAdminArticleReview() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [articles, setArticles] = useState<SponsoredArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedArticle, setSelectedArticle] = useState<SponsoredArticle | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      fetchArticles();
    }
  }, [user, isAdmin]);

  const fetchArticles = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("is_sponsored", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sponsored articles:", error);
      toast.error("Błąd podczas pobierania artykułów");
      setLoading(false);
      return;
    }

    setArticles((data || []) as SponsoredArticle[]);
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!selectedArticle) return;
    setProcessing(true);

    const { error } = await supabase
      .from("articles")
      .update({
        sponsor_status: "approved",
        is_published: true,
      })
      .eq("id", selectedArticle.id);

    if (error) {
      toast.error("Błąd podczas akceptowania artykułu");
      console.error(error);
    } else {
      toast.success("Artykuł zaakceptowany i opublikowany");
      setApproveDialogOpen(false);
      setSelectedArticle(null);
      fetchArticles();
    }

    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedArticle) return;
    setProcessing(true);

    const { error } = await supabase
      .from("articles")
      .update({
        sponsor_status: "rejected",
        is_published: false,
      })
      .eq("id", selectedArticle.id);

    if (error) {
      toast.error("Błąd podczas odrzucania artykułu");
      console.error(error);
    } else {
      toast.success("Artykuł odrzucony");
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedArticle(null);
      fetchArticles();
    }

    setProcessing(false);
  };

  const openPreview = (article: SponsoredArticle) => {
    setSelectedArticle(article);
    setPreviewOpen(true);
  };

  const openApproveDialog = (article: SponsoredArticle) => {
    setSelectedArticle(article);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (article: SponsoredArticle) => {
    setSelectedArticle(article);
    setRejectDialogOpen(true);
    setRejectReason("");
  };

  const filteredArticles = articles.filter((article) => {
    if (activeTab === "all") return true;
    return (article.sponsor_status || "draft") === activeTab;
  });

  const getCounts = () => ({
    pending: articles.filter((a) => a.sponsor_status === "pending").length,
    approved: articles.filter((a) => a.sponsor_status === "approved").length,
    rejected: articles.filter((a) => a.sponsor_status === "rejected").length,
    all: articles.length,
  });

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oczekujące</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{counts.pending}</div>
            <p className="text-xs text-muted-foreground">artykułów do weryfikacji</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zaakceptowane</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{counts.approved}</div>
            <p className="text-xs text-muted-foreground">opublikowanych artykułów</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Odrzucone</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{counts.rejected}</div>
            <p className="text-xs text-muted-foreground">odrzuconych artykułów</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Weryfikacja artykułów sponsorowanych
              </CardTitle>
              <CardDescription>
                Przeglądaj i akceptuj artykuły dodane przez wydawców i partnerów
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchArticles} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Odśwież
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Oczekujące ({counts.pending})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Zaakceptowane ({counts.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="h-4 w-4" />
                Odrzucone ({counts.rejected})
              </TabsTrigger>
              <TabsTrigger value="all">Wszystkie ({counts.all})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Brak artykułów w tej kategorii</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArticles.map((article) => {
                    const status = statusConfig[article.sponsor_status || "draft"] || statusConfig.draft;

                    return (
                      <Card key={article.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            {/* Thumbnail */}
                            {article.image && (
                              <div className="w-full md:w-48 h-32 md:h-auto shrink-0">
                                <img
                                  src={article.image}
                                  alt={article.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 p-4">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant={status.variant} className="gap-1">
                                  {status.icon}
                                  {status.label}
                                </Badge>
                                <Badge variant="outline">{article.category}</Badge>
                                {article.is_published && (
                                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                                    Opublikowany
                                  </Badge>
                                )}
                              </div>

                              <h3 className="font-semibold text-lg mb-1 line-clamp-2">{article.title}</h3>

                              {article.excerpt && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                  {article.excerpt}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                <span>
                                  Dodano: {format(new Date(article.created_at), "dd MMM yyyy HH:mm", { locale: pl })}
                                </span>
                                {article.target_url && (
                                  <a
                                    href={article.target_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Link docelowy
                                  </a>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={() => openPreview(article)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Podgląd
                                </Button>
                                {article.sponsor_status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => openApproveDialog(article)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Akceptuj
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => openRejectDialog(article)}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Odrzuć
                                    </Button>
                                  </>
                                )}
                                {article.sponsor_status === "rejected" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openApproveDialog(article)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Przywróć i zaakceptuj
                                  </Button>
                                )}
                                {article.sponsor_status === "approved" && article.is_published && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openRejectDialog(article)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Wycofaj publikację
                                  </Button>
                                )}
                              </div>
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
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Podgląd artykułu</DialogTitle>
            <DialogDescription>Pełna treść artykułu sponsorowanego</DialogDescription>
          </DialogHeader>
          {selectedArticle && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {selectedArticle.image && (
                  <img
                    src={selectedArticle.image}
                    alt={selectedArticle.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <h2 className="text-xl font-bold">{selectedArticle.title}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedArticle.category}</Badge>
                  {selectedArticle.target_url && (
                    <a
                      href={selectedArticle.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Link docelowy
                    </a>
                  )}
                </div>
                {selectedArticle.excerpt && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Zajawka:</p>
                    <p className="text-sm">{selectedArticle.excerpt}</p>
                  </div>
                )}
                {selectedArticle.content && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Treść:</p>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            {selectedArticle?.sponsor_status === "pending" && (
              <div className="flex gap-2 w-full justify-end">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setPreviewOpen(false);
                    openRejectDialog(selectedArticle);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Odrzuć
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    setPreviewOpen(false);
                    openApproveDialog(selectedArticle);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Akceptuj
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Akceptuj artykuł</AlertDialogTitle>
            <AlertDialogDescription>
              Artykuł „{selectedArticle?.title}" zostanie zaakceptowany i opublikowany na feedzie.
              Czy na pewno chcesz kontynuować?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Akceptuj i opublikuj
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odrzuć artykuł</AlertDialogTitle>
            <AlertDialogDescription>
              Artykuł „{selectedArticle?.title}" zostanie odrzucony i nie będzie widoczny na stronie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Powód odrzucenia (opcjonalnie)</Label>
            <Textarea
              id="reject-reason"
              placeholder="Wpisz powód odrzucenia artykułu..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={processing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
              Odrzuć artykuł
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
