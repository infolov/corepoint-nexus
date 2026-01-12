import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { MapPin, Save, Trash2, Plus } from "lucide-react";
import { getVoivodeships } from "@/data/poland-divisions";

interface RegionalPrice {
  id?: string;
  placement_id: string;
  region_slug: string;
  region_name: string;
  credit_cost: number;
}

interface RegionalPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placementId: string;
  placementName: string;
  defaultCost: number;
}

const voivodeshipDisplayNames: Record<string, string> = {
  "mazowieckie": "Mazowieckie",
  "pomorskie": "Pomorskie",
  "małopolskie": "Małopolskie",
  "śląskie": "Śląskie",
  "wielkopolskie": "Wielkopolskie",
  "dolnośląskie": "Dolnośląskie",
  "łódzkie": "Łódzkie",
  "zachodniopomorskie": "Zachodniopomorskie",
  "kujawsko-pomorskie": "Kujawsko-Pomorskie",
  "lubelskie": "Lubelskie",
  "podkarpackie": "Podkarpackie",
  "podlaskie": "Podlaskie",
  "warmińsko-mazurskie": "Warmińsko-Mazurskie",
  "lubuskie": "Lubuskie",
  "świętokrzyskie": "Świętokrzyskie",
  "opolskie": "Opolskie",
};

export function RegionalPricingDialog({
  open,
  onOpenChange,
  placementId,
  placementName,
  defaultCost,
}: RegionalPricingDialogProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regionalPrices, setRegionalPrices] = useState<RegionalPrice[]>([]);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});

  const voivodeships = getVoivodeships();

  useEffect(() => {
    if (open && placementId) {
      fetchRegionalPrices();
    }
  }, [open, placementId]);

  const fetchRegionalPrices = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("ad_placement_regional_pricing")
      .select("*")
      .eq("placement_id", placementId);

    if (error) {
      console.error("Error fetching regional prices:", error);
      toast.error("Błąd podczas pobierania cen regionalnych");
    } else {
      setRegionalPrices(data || []);
      // Initialize edited prices from existing data
      const pricesMap: Record<string, number> = {};
      data?.forEach(price => {
        pricesMap[price.region_slug] = price.credit_cost;
      });
      setEditedPrices(pricesMap);
    }
    
    setLoading(false);
  };

  const handlePriceChange = (regionSlug: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditedPrices(prev => ({
      ...prev,
      [regionSlug]: numValue,
    }));
  };

  const handleRemoveRegion = async (regionSlug: string) => {
    const existingPrice = regionalPrices.find(p => p.region_slug === regionSlug);
    
    if (existingPrice?.id) {
      setSaving(true);
      const { error } = await supabase
        .from("ad_placement_regional_pricing")
        .delete()
        .eq("id", existingPrice.id);

      if (error) {
        toast.error("Błąd podczas usuwania ceny regionalnej");
      } else {
        toast.success("Cena regionalna usunięta");
        setEditedPrices(prev => {
          const updated = { ...prev };
          delete updated[regionSlug];
          return updated;
        });
        setRegionalPrices(prev => prev.filter(p => p.region_slug !== regionSlug));
      }
      setSaving(false);
    } else {
      setEditedPrices(prev => {
        const updated = { ...prev };
        delete updated[regionSlug];
        return updated;
      });
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);

    const toUpsert: RegionalPrice[] = [];
    
    for (const regionSlug of Object.keys(editedPrices)) {
      const cost = editedPrices[regionSlug];
      if (cost > 0) {
        toUpsert.push({
          placement_id: placementId,
          region_slug: regionSlug,
          region_name: voivodeshipDisplayNames[regionSlug] || regionSlug,
          credit_cost: cost,
        });
      }
    }

    if (toUpsert.length === 0) {
      toast.info("Brak cen do zapisania");
      setSaving(false);
      return;
    }

    // Delete all existing and insert new
    const { error: deleteError } = await supabase
      .from("ad_placement_regional_pricing")
      .delete()
      .eq("placement_id", placementId);

    if (deleteError) {
      toast.error("Błąd podczas aktualizacji cen");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("ad_placement_regional_pricing")
      .insert(toUpsert);

    if (insertError) {
      toast.error("Błąd podczas zapisywania cen regionalnych");
    } else {
      toast.success(`Zapisano ${toUpsert.length} cen regionalnych`);
      fetchRegionalPrices();
    }

    setSaving(false);
  };

  const addAllRegions = () => {
    const newPrices: Record<string, number> = { ...editedPrices };
    voivodeships.forEach(v => {
      if (!(v in newPrices)) {
        newPrices[v] = defaultCost;
      }
    });
    setEditedPrices(newPrices);
  };

  const regionsWithPrices = Object.keys(editedPrices);
  const regionsWithoutPrices = voivodeships.filter(v => !regionsWithPrices.includes(v));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Ceny regionalne: {placementName}
          </DialogTitle>
          <DialogDescription>
            Ustaw różne ceny dla poszczególnych województw. Cena domyślna: <strong>{defaultCost} kr./dzień</strong>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-4 py-4">
              {regionsWithPrices.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Województwo</TableHead>
                      <TableHead className="w-[150px]">Cena (kr./dzień)</TableHead>
                      <TableHead className="w-[80px]">Różnica</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regionsWithPrices.sort().map(regionSlug => {
                      const cost = editedPrices[regionSlug];
                      const diff = cost - defaultCost;
                      return (
                        <TableRow key={regionSlug}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {voivodeshipDisplayNames[regionSlug] || regionSlug}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={cost}
                              onChange={(e) => handlePriceChange(regionSlug, e.target.value)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            {diff !== 0 && (
                              <Badge variant={diff > 0 ? "default" : "secondary"}>
                                {diff > 0 ? "+" : ""}{diff}
                              </Badge>
                            )}
                            {diff === 0 && (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRegion(regionSlug)}
                              disabled={saving}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {regionsWithPrices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Brak cen regionalnych</p>
                  <p className="text-sm">Wszystkie regiony używają ceny domyślnej ({defaultCost} kr./dzień)</p>
                </div>
              )}

              {regionsWithoutPrices.length > 0 && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Dodaj cenę dla województwa:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {regionsWithoutPrices.slice(0, 8).map(regionSlug => (
                      <Button
                        key={regionSlug}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePriceChange(regionSlug, String(defaultCost))}
                        className="gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        {voivodeshipDisplayNames[regionSlug] || regionSlug}
                      </Button>
                    ))}
                    {regionsWithoutPrices.length > 8 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addAllRegions}
                        className="gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Dodaj wszystkie ({regionsWithoutPrices.length})
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-auto">
            {regionsWithPrices.length > 0 && (
              <span>{regionsWithPrices.length} z 16 województw z ceną indywidualną</span>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSaveAll} disabled={saving || loading} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Zapisywanie..." : "Zapisz wszystkie"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}