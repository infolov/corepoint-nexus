import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useJournalists, Journalist } from "@/hooks/use-journalists";
import { useSponsoredArticles, SponsoredArticleFormData } from "@/hooks/use-sponsored-articles";
import { useSponsoredArticleEditor, SponsoredArticleFormData as EditorFormData } from "@/hooks/use-sponsored-article-editor";
import { useRSSArticles, RSSArticle } from "@/hooks/use-rss-articles";
import { 
  FileEdit, 
  Users, 
  ShoppingCart, 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Pencil,
  Eye,
  PenTool,
  Link,
  Search,
  X
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Oczekuje", icon: <Clock className="h-4 w-4" />, variant: "secondary" },
  draft: { label: "Szkic", icon: <PenTool className="h-4 w-4" />, variant: "outline" },
  in_progress: { label: "W realizacji", icon: <AlertCircle className="h-4 w-4" />, variant: "default" },
  approved: { label: "Zatwierdzony", icon: <CheckCircle className="h-4 w-4" />, variant: "default" },
  completed: { label: "Ukończone", icon: <CheckCircle className="h-4 w-4" />, variant: "outline" },
  rejected: { label: "Odrzucone", icon: <XCircle className="h-4 w-4" />, variant: "destructive" },
};

const CATEGORIES = [
  { value: "gospodarka", label: "Gospodarka" },
  { value: "polityka", label: "Polityka" },
  { value: "sport", label: "Sport" },
  { value: "technologie", label: "Technologie" },
  { value: "kultura", label: "Kultura" },
  { value: "nauka", label: "Nauka" },
  { value: "zdrowie", label: "Zdrowie" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "motoryzacja", label: "Motoryzacja" },
];

export default function DashboardPublisher() {
  const { journalists, isLoading: journalistsLoading } = useJournalists();
  const { orders, isLoading: ordersLoading, createOrder } = useSponsoredArticles();
  const { myArticles, isLoading: articlesLoading, createArticle, updateArticle } = useSponsoredArticleEditor();
  const { articles: rssArticles, loading: rssLoading } = useRSSArticles();
  
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [selectedJournalist, setSelectedJournalist] = useState<Journalist | null>(null);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [rssSearchQuery, setRssSearchQuery] = useState("");
  const [selectedRssArticle, setSelectedRssArticle] = useState<RSSArticle | null>(null);
  
  const [orderFormData, setOrderFormData] = useState<Omit<SponsoredArticleFormData, "journalist_id" | "price">>({
    title: "",
    description: "",
    target_url: "",
  });

  const [articleFormData, setArticleFormData] = useState<EditorFormData>({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    image: "",
    target_url: "",
  });

  // Filter RSS articles based on search query
  const filteredRssArticles = useMemo(() => {
    if (!rssSearchQuery.trim()) return [];
    const query = rssSearchQuery.toLowerCase();
    return rssArticles
      .filter(a => 
        a.title.toLowerCase().includes(query) || 
        a.source.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [rssArticles, rssSearchQuery]);

  const activeJournalists = journalists.filter((j) => j.is_active);

  const openOrderDialog = (journalist: Journalist) => {
    setSelectedJournalist(journalist);
    setOrderFormData({ title: "", description: "", target_url: "" });
    setIsOrderDialogOpen(true);
  };

  const openArticleDialog = (article?: any) => {
    if (article) {
      setEditingArticle(article);
      setArticleFormData({
        title: article.title,
        excerpt: article.excerpt || "",
        content: article.content || "",
        category: article.category,
        image: article.image,
        target_url: article.target_url || "",
      });
    } else {
      setEditingArticle(null);
      setArticleFormData({
        title: "",
        excerpt: "",
        content: "",
        category: "",
        image: "",
        target_url: "",
      });
    }
    setRssSearchQuery("");
    setSelectedRssArticle(null);
    setIsArticleDialogOpen(true);
  };

  const handleSelectRssArticle = (rssArticle: RSSArticle) => {
    setSelectedRssArticle(rssArticle);
    setArticleFormData({
      title: rssArticle.title,
      excerpt: rssArticle.excerpt,
      content: rssArticle.content,
      category: rssArticle.category.toLowerCase(),
      image: rssArticle.image,
      target_url: rssArticle.sourceUrl,
    });
    setRssSearchQuery("");
  };

  const handleClearRssArticle = () => {
    setSelectedRssArticle(null);
    setArticleFormData({
      title: "",
      excerpt: "",
      content: "",
      category: "",
      image: "",
      target_url: "",
    });
  };

  const handleSubmitOrder = async () => {
    if (!selectedJournalist) return;

    await createOrder.mutateAsync({
      journalist_id: selectedJournalist.id,
      title: orderFormData.title,
      description: orderFormData.description,
      target_url: orderFormData.target_url,
      price: selectedJournalist.price_per_article,
    });

    setIsOrderDialogOpen(false);
    setSelectedJournalist(null);
  };

  const handleSubmitArticle = async () => {
    if (editingArticle) {
      await updateArticle.mutateAsync({ id: editingArticle.id, ...articleFormData });
    } else {
      await createArticle.mutateAsync(articleFormData);
    }
    setIsArticleDialogOpen(false);
    setEditingArticle(null);
  };

  const getJournalistName = (journalistId: string | null) => {
    if (!journalistId) return "Nieznany";
    const journalist = journalists.find((j) => j.id === journalistId);
    return journalist?.name || "Nieznany";
  };

  const isLoading = journalistsLoading || ordersLoading || articlesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileEdit className="h-6 w-6" />
          Panel Wydawcy
        </h1>
        <p className="text-muted-foreground">
          Twórz artykuły sponsorowane lub zamów je u naszych dziennikarzy
        </p>
      </div>

      <Tabs defaultValue="my-articles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-articles" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Moje artykuły ({myArticles.length})
          </TabsTrigger>
          <TabsTrigger value="journalists" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Dziennikarze
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Zamówienia ({orders.length})
          </TabsTrigger>
        </TabsList>

        {/* My Articles Tab */}
        <TabsContent value="my-articles" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Moje artykuły sponsorowane</CardTitle>
                <CardDescription>
                  Twórz własne artykuły, które po zatwierdzeniu pojawią się w sekcji głównych kafelków
                </CardDescription>
              </div>
              <Button onClick={() => openArticleDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj artykuł
              </Button>
            </CardHeader>
            <CardContent>
              {myArticles.length === 0 ? (
                <div className="text-center py-12">
                  <PenTool className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">Brak artykułów</h3>
                  <p className="text-muted-foreground mb-4">
                    Dodaj swój pierwszy artykuł sponsorowany
                  </p>
                  <Button onClick={() => openArticleDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj artykuł
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myArticles.map((article) => {
                    const status = statusConfig[article.sponsor_status || "draft"] || statusConfig.draft;
                    return (
                      <Card key={article.id} className="overflow-hidden">
                        <div className="flex">
                          {article.image && (
                            <div className="w-40 h-32 shrink-0">
                              <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <CardContent className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {article.category}
                                  </Badge>
                                  <Badge variant={status.variant} className="flex items-center gap-1">
                                    {status.icon}
                                    {status.label}
                                  </Badge>
                                </div>
                                <h3 className="font-semibold line-clamp-1">{article.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {article.excerpt}
                                </p>
                                <div className="text-xs text-muted-foreground mt-2">
                                  {format(new Date(article.created_at), "dd MMM yyyy, HH:mm", { locale: pl })}
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openArticleDialog(article)}
                                  disabled={article.sponsor_status === "approved"}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {article.is_published && (
                                  <Button variant="ghost" size="icon" asChild>
                                    <a href={`/artykul/${article.id}`} target="_blank" rel="noopener">
                                      <Eye className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journalists Tab */}
        <TabsContent value="journalists" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dostępni dziennikarze</CardTitle>
              <CardDescription>
                Wybierz dziennikarza i zamów artykuł sponsorowany
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeJournalists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Brak dostępnych dziennikarzy. Sprawdź później.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeJournalists.map((journalist) => (
                    <Card key={journalist.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={journalist.avatar_url || undefined} />
                            <AvatarFallback className="text-lg">
                              {journalist.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{journalist.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {journalist.bio || "Brak opisu"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1">
                          {journalist.specialization?.slice(0, 4).map((spec) => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-lg font-bold text-primary">
                            {journalist.price_per_article} PLN
                          </div>
                          <Button size="sm" onClick={() => openOrderDialog(journalist)}>
                            Zamów artykuł
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historia zamówień</CardTitle>
              <CardDescription>
                Twoje zamówienia artykułów sponsorowanych
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nie masz jeszcze żadnych zamówień.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold">{order.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Dziennikarz: {getJournalistName(order.journalist_id)}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                {order.description}
                              </p>
                              {order.admin_notes && (
                                <p className="text-sm mt-2 p-2 bg-muted rounded">
                                  <strong>Uwagi:</strong> {order.admin_notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant={status.variant} className="flex items-center gap-1">
                                {status.icon}
                                {status.label}
                              </Badge>
                              <div className="mt-2 font-bold">{order.price} PLN</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(order.created_at), "dd MMM yyyy", { locale: pl })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Zamów artykuł sponsorowany</DialogTitle>
            <DialogDescription>
              {selectedJournalist && (
                <span>
                  Dziennikarz: <strong>{selectedJournalist.name}</strong> • Cena:{" "}
                  <strong>{selectedJournalist.price_per_article} PLN</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order-title">Tytuł artykułu *</Label>
              <Input
                id="order-title"
                value={orderFormData.title}
                onChange={(e) => setOrderFormData({ ...orderFormData, title: e.target.value })}
                placeholder="Wprowadź tytuł artykułu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-description">Opis / Brief *</Label>
              <Textarea
                id="order-description"
                value={orderFormData.description}
                onChange={(e) => setOrderFormData({ ...orderFormData, description: e.target.value })}
                placeholder="Opisz czego ma dotyczyć artykuł, jakie informacje powinien zawierać..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-target-url">Link do promowanej strony (opcjonalnie)</Label>
              <Input
                id="order-target-url"
                value={orderFormData.target_url}
                onChange={(e) => setOrderFormData({ ...orderFormData, target_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={!orderFormData.title || !orderFormData.description || createOrder.isPending}
            >
              {createOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Złóż zamówienie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Article Editor Dialog */}
      <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? "Edytuj artykuł" : "Dodaj artykuł sponsorowany"}
            </DialogTitle>
            <DialogDescription>
              Podepnij artykuł z RSS lub wypełnij dane ręcznie. Po wysłaniu artykuł zostanie zweryfikowany przez administratora.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* RSS Article Picker */}
            {!editingArticle && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                <Label className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Podepnij artykuł z RSS (opcjonalnie)
                </Label>
                
                {selectedRssArticle ? (
                  <div className="flex items-start gap-3 p-3 bg-background border rounded-lg">
                    {selectedRssArticle.image && (
                      <img 
                        src={selectedRssArticle.image} 
                        alt="" 
                        className="w-16 h-16 object-cover rounded shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2 text-sm">{selectedRssArticle.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedRssArticle.source} • {selectedRssArticle.category}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleClearRssArticle}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={rssSearchQuery}
                      onChange={(e) => setRssSearchQuery(e.target.value)}
                      placeholder="Szukaj artykułu po tytule, źródle lub kategorii..."
                      className="pl-10"
                    />
                    
                    {rssSearchQuery && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-lg shadow-lg">
                        {rssLoading ? (
                          <div className="p-4 text-center text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : filteredRssArticles.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            Nie znaleziono artykułów
                          </div>
                        ) : (
                          <ScrollArea className="max-h-64">
                            <div className="p-1">
                              {filteredRssArticles.map((rssArticle) => (
                                <button
                                  key={rssArticle.id}
                                  type="button"
                                  onClick={() => handleSelectRssArticle(rssArticle)}
                                  className="w-full flex items-start gap-3 p-2 hover:bg-muted rounded-md text-left transition-colors"
                                >
                                  {rssArticle.image && (
                                    <img 
                                      src={rssArticle.image} 
                                      alt="" 
                                      className="w-12 h-12 object-cover rounded shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium line-clamp-2 text-sm">{rssArticle.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {rssArticle.source} • {rssArticle.category}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Wyszukaj i wybierz artykuł z RSS, aby automatycznie wypełnić formularz
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="article-title">Tytuł artykułu *</Label>
                <Input
                  id="article-title"
                  value={articleFormData.title}
                  onChange={(e) => setArticleFormData({ ...articleFormData, title: e.target.value })}
                  placeholder="Wprowadź tytuł"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-category">Kategoria *</Label>
                <Select
                  value={articleFormData.category}
                  onValueChange={(value) => setArticleFormData({ ...articleFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="article-excerpt">Zajawka / Lead *</Label>
              <Textarea
                id="article-excerpt"
                value={articleFormData.excerpt}
                onChange={(e) => setArticleFormData({ ...articleFormData, excerpt: e.target.value })}
                placeholder="Krótki opis artykułu widoczny na kafelku (max 200 znaków)"
                rows={2}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {articleFormData.excerpt.length}/200
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="article-content">Treść artykułu *</Label>
              <Textarea
                id="article-content"
                value={articleFormData.content}
                onChange={(e) => setArticleFormData({ ...articleFormData, content: e.target.value })}
                placeholder="Napisz pełną treść artykułu..."
                rows={10}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="article-image">URL obrazka głównego *</Label>
                <Input
                  id="article-image"
                  value={articleFormData.image}
                  onChange={(e) => setArticleFormData({ ...articleFormData, image: e.target.value })}
                  placeholder="https://..."
                />
                {articleFormData.image && (
                  <div className="mt-2 rounded-lg overflow-hidden border">
                    <img
                      src={articleFormData.image}
                      alt="Podgląd"
                      className="w-full h-32 object-cover bg-muted"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-target-url">Link do promowanej strony (opcjonalnie)</Label>
                <Input
                  id="article-target-url"
                  value={articleFormData.target_url}
                  onChange={(e) => setArticleFormData({ ...articleFormData, target_url: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Przycisk "Dowiedz się więcej" będzie linkować do tej strony
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArticleDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleSubmitArticle}
              disabled={
                !articleFormData.title ||
                !articleFormData.excerpt ||
                !articleFormData.content ||
                !articleFormData.category ||
                !articleFormData.image ||
                createArticle.isPending ||
                updateArticle.isPending
              }
            >
              {(createArticle.isPending || updateArticle.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingArticle ? "Zapisz zmiany" : "Wyślij do weryfikacji"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
