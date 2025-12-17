import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Target,
  ShieldAlert, 
  Plus,
  Pencil,
  Lock,
  Unlock,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface Placement {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  dimensions: string | null;
  credit_cost: number;
  is_active: boolean;
  created_at: string;
}

export default function DashboardAdminPlacements() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    dimensions: "",
    credit_cost: 10,
    is_active: true,
  });

  useEffect(() => {
    if (user && isAdmin) {
      fetchPlacements();
    }
  }, [user, isAdmin]);

  const fetchPlacements = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("ad_placements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching placements:", error);
      toast.error("Błąd podczas pobierania miejsc reklamowych");
    } else {
      setPlacements(data || []);
    }

    setLoading(false);
  };

  const openEditDialog = (placement?: Placement) => {
    if (placement) {
      setSelectedPlacement(placement);
      setFormData({
        name: placement.name,
        slug: placement.slug,
        description: placement.description || "",
        dimensions: placement.dimensions || "",
        credit_cost: placement.credit_cost,
        is_active: placement.is_active,
      });
    } else {
      setSelectedPlacement(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        dimensions: "",
        credit_cost: 10,
        is_active: true,
      });
    }
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Nazwa i slug są wymagane");
      return;
    }

    setProcessing(true);

    if (selectedPlacement) {
      // Update existing
      const { error } = await supabase
        .from("ad_placements")
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          dimensions: formData.dimensions || null,
          credit_cost: formData.credit_cost,
          is_active: formData.is_active,
        })
        .eq("id", selectedPlacement.id);

      if (error) {
        toast.error("Błąd podczas aktualizacji");
      } else {
        toast.success("Miejsce reklamowe zaktualizowane");
        setEditDialogOpen(false);
        fetchPlacements();
      }
    } else {
      // Create new
      const { error } = await supabase
        .from("ad_placements")
        .insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          dimensions: formData.dimensions || null,
          credit_cost: formData.credit_cost,
          is_active: formData.is_active,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Slug musi być unikalny");
        } else {
          toast.error("Błąd podczas tworzenia");
        }
      } else {
        toast.success("Miejsce reklamowe utworzone");
        setEditDialogOpen(false);
        fetchPlacements();
      }
    }

    setProcessing(false);
  };

  const toggleActive = async (placement: Placement) => {
    setProcessing(true);

    const { error } = await supabase
      .from("ad_placements")
      .update({ is_active: !placement.is_active })
      .eq("id", placement.id);

    if (error) {
      toast.error("Błąd podczas zmiany statusu");
    } else {
      toast.success(placement.is_active ? "Miejsce zablokowane" : "Miejsce odblokowane");
      fetchPlacements();
    }

    setProcessing(false);
  };

  const handleDelete = async (placement: Placement) => {
    if (!confirm(`Czy na pewno chcesz usunąć "${placement.name}"?`)) {
      return;
    }

    setProcessing(true);

    const { error } = await supabase
      .from("ad_placements")
      .delete()
      .eq("id", placement.id);

    if (error) {
      toast.error("Błąd podczas usuwania - może istnieją powiązane kampanie");
    } else {
      toast.success("Miejsce reklamowe usunięte");
      fetchPlacements();
    }

    setProcessing(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Zarządzanie miejscami reklamowymi</h1>
          <p className="text-muted-foreground">
            Twórz, edytuj i blokuj miejsca reklamowe
          </p>
        </div>
        <Button onClick={() => openEditDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nowe miejsce
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Miejsca reklamowe ({placements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : placements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Brak miejsc reklamowych
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Wymiary</TableHead>
                    <TableHead>Koszt (kredyty)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data utworzenia</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {placements.map(placement => (
                    <TableRow key={placement.id} className={!placement.is_active ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Target className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">{placement.name}</span>
                            {placement.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {placement.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {placement.slug}
                        </code>
                      </TableCell>
                      <TableCell>{placement.dimensions || "-"}</TableCell>
                      <TableCell>{placement.credit_cost}</TableCell>
                      <TableCell>
                        <Badge variant={placement.is_active ? "default" : "secondary"} className="gap-1">
                          {placement.is_active ? (
                            <>
                              <Unlock className="h-3 w-3" />
                              Aktywne
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" />
                              Zablokowane
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(placement.created_at), "d MMM yyyy", { locale: pl })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(placement)}
                            disabled={processing}
                            title={placement.is_active ? "Zablokuj" : "Odblokuj"}
                          >
                            {placement.is_active ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(placement)}
                            disabled={processing}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(placement)}
                            disabled={processing}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPlacement ? "Edytuj miejsce reklamowe" : "Nowe miejsce reklamowe"}
            </DialogTitle>
            <DialogDescription>
              {selectedPlacement 
                ? "Zaktualizuj dane miejsca reklamowego"
                : "Utwórz nowe miejsce reklamowe dla kampanii"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="np. Baner górny"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="np. top-banner"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Opis miejsca reklamowego..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dimensions">Wymiary</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                  placeholder="np. 728x90"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="credit_cost">Koszt (kredyty)</Label>
                <Input
                  id="credit_cost"
                  type="number"
                  min="1"
                  value={formData.credit_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, credit_cost: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Aktywne</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave} disabled={processing}>
              {selectedPlacement ? "Zapisz zmiany" : "Utwórz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
