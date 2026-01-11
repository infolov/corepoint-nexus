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
  FileCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface VerificationLog {
  attempt: number;
  timestamp: string;
  status: string;
  errors?: string[];
  details?: {
    claimsChecked?: number;
    claimsVerified?: number;
    claimsRejected?: number;
    fabricatedClaims?: string[];
  };
}

interface ProcessedArticle {
  id: string;
  title: string;
  url: string;
  source: string | null;
  category: string | null;
  image_url: string | null;
  ai_summary: string | null;
  full_content: string | null;
  ai_verification_status: string;
  verification_logs: VerificationLog[] | null;
  pub_date: string | null;
  created_at: string;
  processed_at: string;
}

type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'manual_review';

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; color: string }> = {
  pending: { label: "Oczekujące", variant: "secondary", icon: <Clock className="h-3 w-3" />, color: "text-amber-500" },
  verified: { label: "Zweryfikowane", variant: "default", icon: <CheckCircle className="h-3 w-3" />, color: "text-green-500" },
  rejected: { label: "Odrzucone", variant: "destructive", icon: <XCircle className="h-3 w-3" />, color: "text-red-500" },
  manual_review: { label: "Wymaga przeglądu", variant: "outline", icon: <AlertTriangle className="h-3 w-3" />, color: "text-orange-500" },
};

export default function DashboardAdminFactCheck() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [articles, setArticles] = useState<ProcessedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("rejected");
  const [selectedArticle, setSelectedArticle] = useState<ProcessedArticle | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user && isAdmin) {
      fetchArticles();
    }
  }, [user, isAdmin]);

  const fetchArticles = async () => {
    setLoading(true);
    
    // Fetch from processed_articles table which has the verification data
    const { data, error } = await supabase
      .from("processed_articles")
      .select("*")
      .order("processed_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Error fetching articles:", error);
      toast.error("Błąd podczas pobierania artykułów");
      setLoading(false);
      return;
    }

    // Parse verification_logs from Json to proper type
    const parsedArticles = (data || []).map(article => ({
      ...article,
      verification_logs: Array.isArray(article.verification_logs) 
        ? article.verification_logs as unknown as VerificationLog[]
        : null,
    }));

    setArticles(parsedArticles);
    setLoading(false);
  };

  const handleApproveFactography = async () => {
    if (!selectedArticle) return;

    setProcessing(true);
    
    const { error } = await supabase
      .from("processed_articles")
      .update({ 
        ai_verification_status: "verified",
      })
      .eq("id", selectedArticle.id);

    if (error) {
      toast.error("Błąd podczas zatwierdzania artykułu");
    } else {
      toast.success("Faktografia zatwierdzona");
      setApproveDialogOpen(false);
      setSelectedArticle(null);
      fetchArticles();
    }
    
    setProcessing(false);
  };

  const handleRegenerate = async (article: ProcessedArticle) => {
    setRegenerating(article.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-summary', {
        body: { 
          title: article.title,
          originalContent: article.full_content || '',
          aiSummary: article.ai_summary || '',
          attemptNumber: 1 
        }
      });

      if (error) {
        toast.error("Błąd podczas ponownej weryfikacji: " + error.message);
      } else {
        if (data.status === 'verified') {
          // Update the article status in database
          await supabase
            .from("processed_articles")
            .update({ ai_verification_status: 'verified' })
            .eq("id", article.id);
          toast.success("Artykuł zweryfikowany pomyślnie");
        } else {
          toast.warning(`Weryfikacja nie przeszła: ${data.errors?.length || 0} błędów`);
        }
        fetchArticles();
      }
    } catch (err) {
      console.error("Regeneration error:", err);
      toast.error("Błąd podczas ponownej weryfikacji");
    } finally {
      setRegenerating(null);
    }
  };

  const handleRejectArticle = async (article: ProcessedArticle) => {
    setProcessing(true);
    
    const { error } = await supabase
      .from("processed_articles")
      .update({ 
        ai_verification_status: "rejected",
      })
      .eq("id", article.id);

    if (error) {
      toast.error("Błąd podczas odrzucania artykułu");
    } else {
      toast.success("Artykuł odrzucony");
      fetchArticles();
    }
    
    setProcessing(false);
  };

  const openDetailsDialog = (article: ProcessedArticle) => {
    setSelectedArticle(article);
    setDetailsDialogOpen(true);
  };

  const openApproveDialog = (article: ProcessedArticle) => {
    setSelectedArticle(article);
    setApproveDialogOpen(true);
  };

  const toggleErrorExpand = (articleId: string) => {
    setExpandedErrors(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

  const filteredArticles = articles.filter(article => {
    if (activeTab === "all") return true;
    return article.ai_verification_status === activeTab;
  });

  const getCounts = () => ({
    manual_review: articles.filter(a => a.ai_verification_status === "manual_review").length,
    rejected: articles.filter(a => a.ai_verification_status === "rejected").length,
    pending: articles.filter(a => a.ai_verification_status === "pending").length,
    verified: articles.filter(a => a.ai_verification_status === "verified").length,
    all: articles.length,
  });

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
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wymaga przeglądu</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{counts.manual_review}</div>
            <p className="text-xs text-muted-foreground">artykułów do ręcznej weryfikacji</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Odrzucone</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{counts.rejected}</div>
            <p className="text-xs text-muted-foreground">artykułów z błędami</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oczekujące</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{counts.pending}</div>
            <p className="text-xs text-muted-foreground">w kolejce do weryfikacji</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zweryfikowane</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{counts.verified}</div>
            <p className="text-xs text-muted-foreground">artykułów zatwierdzonych</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Weryfikacja Faktów AI
              </CardTitle>
              <CardDescription>
                Rygorystyczny system kontroli jakości podsumowań AI - Single Source of Truth
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchArticles} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Odśwież
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="manual_review" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Wymaga przeglądu ({counts.manual_review})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="h-4 w-4" />
                Odrzucone ({counts.rejected})
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Oczekujące ({counts.pending})
              </TabsTrigger>
              <TabsTrigger value="verified" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Zweryfikowane ({counts.verified})
              </TabsTrigger>
              <TabsTrigger value="all">
                Wszystkie ({counts.all})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Brak artykułów w tej kategorii</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArticles.map((article) => {
                    const lastLog = article.verification_logs?.slice(-1)[0];
                    const hasErrors = lastLog?.errors && lastLog.errors.length > 0;
                    const isExpanded = expandedErrors[article.id];

                    return (
                      <Card key={article.id} className="border-l-4" style={{
                        borderLeftColor: statusConfig[article.ai_verification_status || 'pending']?.color === 'text-green-500' ? '#22c55e' :
                          statusConfig[article.ai_verification_status || 'pending']?.color === 'text-red-500' ? '#ef4444' :
                          statusConfig[article.ai_verification_status || 'pending']?.color === 'text-orange-500' ? '#f97316' :
                          '#f59e0b'
                      }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant={statusConfig[article.ai_verification_status || 'pending']?.variant || "outline"} className="gap-1">
                                  {statusConfig[article.ai_verification_status || 'pending']?.icon}
                                  {statusConfig[article.ai_verification_status || 'pending']?.label}
                                </Badge>
                                {article.category && <Badge variant="outline">{article.category}</Badge>}
                                {article.source && (
                                  <span className="text-xs text-muted-foreground">
                                    Źródło: {article.source}
                                  </span>
                                )}
                              </div>
                              
                              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{article.title}</h3>
                              
                              {article.ai_summary && (
                                <div className="bg-muted/50 rounded-lg p-3 mb-3">
                                  <p className="text-sm text-muted-foreground font-medium mb-1">Podsumowanie AI:</p>
                                  <p className="text-sm line-clamp-3">{article.ai_summary}</p>
                                </div>
                              )}

                              {/* Errors Section */}
                              {hasErrors && (
                                <Collapsible open={isExpanded} onOpenChange={() => toggleErrorExpand(article.id)}>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive">
                                      <AlertCircle className="h-4 w-4" />
                                      {lastLog.errors!.length} wykrytych błędów
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2">
                                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
                                      {lastLog.errors!.map((error, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-sm">
                                          <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                          <span>{error}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}

                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span>Przetworzono: {format(new Date(article.processed_at), "dd MMM yyyy HH:mm", { locale: pl })}</span>
                                {article.url && (
                                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    Źródło oryginalne
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDetailsDialog(article)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Szczegóły
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRegenerate(article)}
                                disabled={regenerating === article.id}
                              >
                                <RefreshCw className={`h-4 w-4 mr-2 ${regenerating === article.id ? 'animate-spin' : ''}`} />
                                Ponów weryfikację
                              </Button>

                              {(article.ai_verification_status === 'manual_review' || article.ai_verification_status === 'rejected') && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => openApproveDialog(article)}
                                    className="gap-1"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Zatwierdź faktografię
                                  </Button>
                                  
                                  {article.ai_verification_status !== 'rejected' && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleRejectArticle(article)}
                                      disabled={processing}
                                      className="gap-1"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Odrzuć
                                    </Button>
                                  )}
                                </>
                              )}
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

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Szczegóły weryfikacji faktów</DialogTitle>
            <DialogDescription>
              Porównanie podsumowania AI ze źródłem prawdy (original_content)
            </DialogDescription>
          </DialogHeader>
          
          {selectedArticle && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 pr-4">
                {/* Article Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedArticle.title}</h3>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge variant={statusConfig[selectedArticle.ai_verification_status || 'pending']?.variant}>
                      {statusConfig[selectedArticle.ai_verification_status || 'pending']?.icon}
                      <span className="ml-1">{statusConfig[selectedArticle.ai_verification_status || 'pending']?.label}</span>
                    </Badge>
                    {selectedArticle.category && <Badge variant="outline">{selectedArticle.category}</Badge>}
                    {selectedArticle.source && (
                      <span className="text-sm text-muted-foreground">
                        Źródło: {selectedArticle.source}
                      </span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* AI Summary */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Podsumowanie AI (do weryfikacji)
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedArticle.ai_summary || "Brak podsumowania"}</p>
                  </div>
                </div>

                <Separator />

                {/* Original Content (Source of Truth) */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Źródło prawdy (original_content)
                  </h4>
                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                      {selectedArticle.full_content || "Brak treści źródłowej"}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Verification History */}
                <div>
                  <h4 className="font-medium mb-2">Historia weryfikacji</h4>
                  {selectedArticle.verification_logs && selectedArticle.verification_logs.length > 0 ? (
                    <div className="space-y-3">
                      {selectedArticle.verification_logs.map((log, idx) => (
                        <div key={idx} className={`rounded-lg p-4 ${log.status === 'verified' ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Próba #{log.attempt}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={log.status === 'verified' ? 'default' : 'destructive'}>
                                {log.status === 'verified' ? 'Zweryfikowano' : 'Odrzucono'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.timestamp), "dd MMM yyyy HH:mm:ss", { locale: pl })}
                              </span>
                            </div>
                          </div>
                          
                          {log.details?.claimsChecked !== undefined && (
                            <div className="flex gap-4 text-sm mb-2">
                              <span>Sprawdzono: {log.details.claimsChecked}</span>
                              <span className="text-green-600">Poprawne: {log.details.claimsVerified}</span>
                              <span className="text-destructive">Błędne: {log.details.claimsRejected}</span>
                            </div>
                          )}
                          
                          {log.errors && log.errors.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-sm font-medium text-destructive">Wykryte błędy:</p>
                              {log.errors.map((error, errIdx) => (
                                <div key={errIdx} className="flex items-start gap-2 text-sm">
                                  <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                  <span>{error}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Brak historii weryfikacji</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Zamknij
            </Button>
            {selectedArticle && (selectedArticle.ai_verification_status === 'manual_review' || selectedArticle.ai_verification_status === 'rejected') && (
              <Button onClick={() => {
                setDetailsDialogOpen(false);
                openApproveDialog(selectedArticle);
              }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Zatwierdź faktografię
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zatwierdź faktografię artykułu</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz zatwierdzić faktografię artykułu "{selectedArticle?.title}"?
              <br /><br />
              <strong className="text-foreground">Uwaga:</strong> Zatwierdzenie oznacza, że ręcznie zweryfikowałeś podsumowanie AI 
              i potwierdzasz jego zgodność ze źródłem prawdy. Artykuł zostanie opublikowany na stronie głównej.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveFactography} disabled={processing}>
              {processing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Zatwierdź i opublikuj
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
