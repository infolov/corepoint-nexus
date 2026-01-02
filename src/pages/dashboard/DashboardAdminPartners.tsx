import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  logo_text: string | null;
  target_url: string | null;
  partner_type: "site" | "category";
  category_slug: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  user_id: string;
}

const categories = [
  { slug: "wiadomosci", name: "Wiadomości" },
  { slug: "sport", name: "Sport" },
  { slug: "biznes", name: "Biznes" },
  { slug: "technologia", name: "Technologia" },
  { slug: "lifestyle", name: "Lifestyle" },
  { slug: "rozrywka", name: "Rozrywka" },
];

export default function DashboardAdminPartners() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    logo_text: "",
    target_url: "",
    partner_type: "site" as "site" | "category",
    category_slug: "",
    start_date: "",
    end_date: "",
  });

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from("partner_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPartners((data || []) as Partner[]);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Nie udało się pobrać partnerów");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const partnerData = {
        ...formData,
        user_id: user.id,
        logo_url: formData.logo_url || null,
        logo_text: formData.logo_text || null,
        target_url: formData.target_url || null,
        category_slug: formData.partner_type === "category" ? formData.category_slug : null,
        is_active: true,
      };

      if (editingPartner) {
        const { error } = await supabase
          .from("partner_campaigns")
          .update(partnerData)
          .eq("id", editingPartner.id);

        if (error) throw error;
        toast.success("Partner zaktualizowany");
      } else {
        const { error } = await supabase
          .from("partner_campaigns")
          .insert(partnerData);

        if (error) throw error;
        toast.success("Partner dodany");
      }

      setDialogOpen(false);
      resetForm();
      fetchPartners();
    } catch (error) {
      console.error("Error saving partner:", error);
      toast.error("Nie udało się zapisać partnera");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tego partnera?")) return;

    try {
      const { error } = await supabase
        .from("partner_campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Partner usunięty");
      fetchPartners();
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast.error("Nie udało się usunąć partnera");
    }
  };

  const toggleActive = async (partner: Partner) => {
    try {
      const { error } = await supabase
        .from("partner_campaigns")
        .update({ is_active: !partner.is_active })
        .eq("id", partner.id);

      if (error) throw error;
      toast.success(partner.is_active ? "Partner dezaktywowany" : "Partner aktywowany");
      fetchPartners();
    } catch (error) {
      console.error("Error toggling partner:", error);
      toast.error("Nie udało się zmienić statusu");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      logo_url: "",
      logo_text: "",
      target_url: "",
      partner_type: "site",
      category_slug: "",
      start_date: "",
      end_date: "",
    });
    setEditingPartner(null);
  };

  const openEditDialog = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logo_url: partner.logo_url || "",
      logo_text: partner.logo_text || "",
      target_url: partner.target_url || "",
      partner_type: partner.partner_type,
      category_slug: partner.category_slug || "",
      start_date: partner.start_date.split("T")[0],
      end_date: partner.end_date.split("T")[0],
    });
    setDialogOpen(true);
  };

  const sitePartners = useMemo(() => partners.filter(p => p.partner_type === "site"), [partners]);
  const categoryPartners = useMemo(() => partners.filter(p => p.partner_type === "category"), [partners]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Zarządzanie Partnerami</h1>
          <p className="text-muted-foreground">Partnerzy serwisu i kategorii wyświetlani w nagłówku</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj partnera
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingPartner ? "Edytuj partnera" : "Dodaj partnera"}</DialogTitle>
              <DialogDescription>
                Partnerzy wyświetlani są w nagłówku strony
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa partnera</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partner_type">Typ partnerstwa</Label>
                <Select
                  value={formData.partner_type}
                  onValueChange={(value: "site" | "category") => 
                    setFormData({ ...formData, partner_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="site">Partner Serwisu (globalny)</SelectItem>
                    <SelectItem value="category">Partner Kategorii</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.partner_type === "category" && (
                <div className="space-y-2">
                  <Label htmlFor="category">Kategoria</Label>
                  <Select
                    value={formData.category_slug}
                    onValueChange={(value) => setFormData({ ...formData, category_slug: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL logo (opcjonalnie)</Label>
                <Input
                  id="logo_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_text">Tekst logo (jeśli brak obrazka)</Label>
                <Input
                  id="logo_text"
                  value={formData.logo_text}
                  onChange={(e) => setFormData({ ...formData, logo_text: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_url">Link docelowy</Label>
                <Input
                  id="target_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data rozpoczęcia</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data zakończenia</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">
                  {editingPartner ? "Zapisz zmiany" : "Dodaj partnera"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Site Partners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Partner Serwisu
          </CardTitle>
          <CardDescription>
            Główny partner wyświetlany na stronie głównej i jako fallback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sitePartners.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Brak partnerów serwisu</p>
          ) : (
            <div className="space-y-3">
              {sitePartners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  onEdit={() => openEditDialog(partner)}
                  onDelete={() => handleDelete(partner.id)}
                  onToggleActive={() => toggleActive(partner)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Partners */}
      <Card>
        <CardHeader>
          <CardTitle>Partnerzy Kategorii</CardTitle>
          <CardDescription>
            Partnerzy wyświetlani w rotacji na stronach kategorii
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryPartners.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Brak partnerów kategorii</p>
          ) : (
            <div className="space-y-3">
              {categoryPartners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  onEdit={() => openEditDialog(partner)}
                  onDelete={() => handleDelete(partner.id)}
                  onToggleActive={() => toggleActive(partner)}
                  showCategory
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PartnerCard({
  partner,
  onEdit,
  onDelete,
  onToggleActive,
  showCategory = false,
}: {
  partner: Partner;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  showCategory?: boolean;
}) {
  const isExpired = new Date(partner.end_date) < new Date();
  const categoryName = categories.find(c => c.slug === partner.category_slug)?.name;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        {partner.logo_url ? (
          <img
            src={partner.logo_url}
            alt={partner.name}
            className="h-10 w-20 object-contain bg-muted rounded"
          />
        ) : (
          <div className="h-10 w-20 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
            {partner.logo_text || partner.name}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{partner.name}</span>
            {showCategory && categoryName && (
              <Badge variant="secondary">{categoryName}</Badge>
            )}
            {isExpired && <Badge variant="destructive">Wygasła</Badge>}
            {!partner.is_active && <Badge variant="outline">Nieaktywna</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(partner.start_date), "d MMM yyyy", { locale: pl })} - {format(new Date(partner.end_date), "d MMM yyyy", { locale: pl })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onToggleActive}>
          <Eye className={`h-4 w-4 ${partner.is_active ? "text-primary" : "text-muted-foreground"}`} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
