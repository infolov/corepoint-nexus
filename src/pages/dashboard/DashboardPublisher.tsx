import { useState } from "react";
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
import { useJournalists, Journalist } from "@/hooks/use-journalists";
import { useSponsoredArticles, SponsoredArticleFormData } from "@/hooks/use-sponsored-articles";
import { FileEdit, Users, ShoppingCart, Loader2, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Oczekuje", icon: <Clock className="h-4 w-4" />, variant: "secondary" },
  in_progress: { label: "W realizacji", icon: <AlertCircle className="h-4 w-4" />, variant: "default" },
  completed: { label: "Ukończone", icon: <CheckCircle className="h-4 w-4" />, variant: "outline" },
  rejected: { label: "Odrzucone", icon: <XCircle className="h-4 w-4" />, variant: "destructive" },
};

export default function DashboardPublisher() {
  const { journalists, isLoading: journalistsLoading } = useJournalists();
  const { orders, isLoading: ordersLoading, createOrder } = useSponsoredArticles();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedJournalist, setSelectedJournalist] = useState<Journalist | null>(null);
  const [formData, setFormData] = useState<Omit<SponsoredArticleFormData, "journalist_id" | "price">>({
    title: "",
    description: "",
    target_url: "",
  });

  const activeJournalists = journalists.filter((j) => j.is_active);

  const openOrderDialog = (journalist: Journalist) => {
    setSelectedJournalist(journalist);
    setFormData({ title: "", description: "", target_url: "" });
    setIsOrderDialogOpen(true);
  };

  const handleSubmitOrder = async () => {
    if (!selectedJournalist) return;

    await createOrder.mutateAsync({
      journalist_id: selectedJournalist.id,
      title: formData.title,
      description: formData.description,
      target_url: formData.target_url,
      price: selectedJournalist.price_per_article,
    });

    setIsOrderDialogOpen(false);
    setSelectedJournalist(null);
  };

  const getJournalistName = (journalistId: string | null) => {
    if (!journalistId) return "Nieznany";
    const journalist = journalists.find((j) => j.id === journalistId);
    return journalist?.name || "Nieznany";
  };

  if (journalistsLoading || ordersLoading) {
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

      <Tabs defaultValue="journalists" className="space-y-6">
        <TabsList>
          <TabsTrigger value="journalists" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Dziennikarze
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Moje zamówienia ({orders.length})
          </TabsTrigger>
        </TabsList>

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
              <Label htmlFor="title">Tytuł artykułu *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Wprowadź tytuł artykułu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Opis / Brief *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Opisz czego ma dotyczyć artykuł, jakie informacje powinien zawierać..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_url">Link do promowanej strony (opcjonalnie)</Label>
              <Input
                id="target_url"
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
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
              disabled={!formData.title || !formData.description || createOrder.isPending}
            >
              {createOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Złóż zamówienie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
