import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Rss, RefreshCw, Search } from "lucide-react";

interface RSSSource {
  id: string;
  url: string;
  source_name: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  "Wiadomości",
  "Biznes",
  "Sport",
  "Technologia",
  "Rozrywka",
  "Zdrowie",
  "Kultura",
  "Nauka",
  "Motoryzacja",
  "Lifestyle"
];

export default function DashboardAdminRSS() {
  const [sources, setSources] = useState<RSSSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<RSSSource | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    url: "",
    source_name: "",
    category: "Wiadomości",
    is_active: true
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rss_sources")
      .select("*")
      .order("category", { ascending: true })
      .order("source_name", { ascending: true });

    if (error) {
      toast.error("Błąd podczas ładowania źródeł RSS");
      console.error(error);
    } else {
      setSources(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.url || !formData.source_name || !formData.category) {
      toast.error("Wypełnij wszystkie wymagane pola");
      return;
    }

    try {
      if (editingSource) {
        const { error } = await supabase
          .from("rss_sources")
          .update({
            url: formData.url,
            source_name: formData.source_name,
            category: formData.category,
            is_active: formData.is_active
          })
          .eq("id", editingSource.id);

        if (error) throw error;
        toast.success("Źródło RSS zaktualizowane");
      } else {
        const { error } = await supabase
          .from("rss_sources")
          .insert({
            url: formData.url,
            source_name: formData.source_name,
            category: formData.category,
            is_active: formData.is_active
          });

        if (error) throw error;
        toast.success("Źródło RSS dodane");
      }

      setDialogOpen(false);
      resetForm();
      fetchSources();
    } catch (error: any) {
      toast.error(error.message || "Wystąpił błąd");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć to źródło RSS?")) return;

    const { error } = await supabase
      .from("rss_sources")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Błąd podczas usuwania");
    } else {
      toast.success("Źródło RSS usunięte");
      fetchSources();
    }
  };

  const toggleActive = async (source: RSSSource) => {
    const { error } = await supabase
      .from("rss_sources")
      .update({ is_active: !source.is_active })
      .eq("id", source.id);

    if (error) {
      toast.error("Błąd podczas aktualizacji");
    } else {
      fetchSources();
    }
  };

  const openEditDialog = (source: RSSSource) => {
    setEditingSource(source);
    setFormData({
      url: source.url,
      source_name: source.source_name,
      category: source.category,
      is_active: source.is_active
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSource(null);
    setFormData({
      url: "",
      source_name: "",
      category: "Wiadomości",
      is_active: true
    });
  };

  const filteredSources = sources.filter(source => {
    const matchesSearch = 
      source.source_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || source.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = CATEGORIES.map(cat => ({
    name: cat,
    count: sources.filter(s => s.category === cat).length,
    active: sources.filter(s => s.category === cat && s.is_active).length
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Zarządzanie źródłami RSS</h1>
          <p className="text-muted-foreground">
            Zarządzaj źródłami wiadomości dla agregacji treści
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSources}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Odśwież
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj źródło
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSource ? "Edytuj źródło RSS" : "Dodaj nowe źródło RSS"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source_name">Nazwa źródła *</Label>
                  <Input
                    id="source_name"
                    value={formData.source_name}
                    onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                    placeholder="np. TVN24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL kanału RSS *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/rss.xml"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Aktywne</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Anuluj
                  </Button>
                  <Button type="submit">
                    {editingSource ? "Zapisz zmiany" : "Dodaj źródło"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {categoryCounts.slice(0, 5).map((cat) => (
          <Card key={cat.name} className="cursor-pointer hover:bg-muted/50" onClick={() => setCategoryFilter(cat.name)}>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">{cat.name}</div>
              <div className="text-2xl font-bold">{cat.active}/{cat.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj źródeł..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Kategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie kategorie</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5" />
            Źródła RSS ({filteredSources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Ładowanie...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead className="hidden md:table-cell">URL</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <Switch
                        checked={source.is_active}
                        onCheckedChange={() => toggleActive(source)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{source.source_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{source.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground truncate block max-w-xs"
                      >
                        {source.url}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(source)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(source.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSources.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Brak źródeł RSS
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
