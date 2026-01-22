import { useState } from "react";
import { Edit, Trash2, Plus, ExternalLink, Rss, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ContentSource } from "@/hooks/use-categories";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface SourcesTableProps {
  sources: ContentSource[];
  categoryId: string;
  onCreateSource: (source: Omit<ContentSource, "id" | "created_at" | "updated_at" | "last_fetched_at">) => Promise<any>;
  onUpdateSource: (id: string, updates: Partial<ContentSource>) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
}

export function SourcesTable({
  sources,
  categoryId,
  onCreateSource,
  onUpdateSource,
  onDeleteSource,
}: SourcesTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ContentSource | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    type: "rss" as "rss" | "scraping",
    selector: "",
    fetch_interval_minutes: 30,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      name: "",
      url: "",
      type: "rss",
      selector: "",
      fetch_interval_minutes: 30,
      is_active: true,
    });
    setEditingSource(null);
  };

  const openEditDialog = (source: ContentSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      url: source.url,
      type: source.type,
      selector: source.selector || "",
      fetch_interval_minutes: source.fetch_interval_minutes,
      is_active: source.is_active,
    });
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.url) return;
    
    setSaving(true);
    try {
      if (editingSource) {
        await onUpdateSource(editingSource.id, {
          name: formData.name,
          url: formData.url,
          type: formData.type,
          selector: formData.type === "scraping" ? formData.selector : null,
          fetch_interval_minutes: formData.fetch_interval_minutes,
          is_active: formData.is_active,
        });
      } else {
        await onCreateSource({
          category_id: categoryId,
          name: formData.name,
          url: formData.url,
          type: formData.type,
          selector: formData.type === "scraping" ? formData.selector : null,
          fetch_interval_minutes: formData.fetch_interval_minutes,
          is_active: formData.is_active,
        });
      }
      setIsAddDialogOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (source: ContentSource) => {
    await onUpdateSource(source.id, { is_active: !source.is_active });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">
          Źródła treści ({sources.length})
        </h4>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Dodaj źródło
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingSource ? "Edytuj źródło" : "Dodaj nowe źródło"}
              </DialogTitle>
              <DialogDescription>
                {editingSource 
                  ? "Zaktualizuj konfigurację źródła treści."
                  : "Dodaj nowe źródło RSS lub konfigurację scrapowania."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa źródła</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="np. TVN24, Onet, Gazeta Wyborcza"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/rss/feed.xml"
                />
              </div>
              <div className="space-y-2">
                <Label>Typ źródła</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "rss" | "scraping") => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rss">
                      <div className="flex items-center gap-2">
                        <Rss className="h-4 w-4" />
                        RSS Feed
                      </div>
                    </SelectItem>
                    <SelectItem value="scraping">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Web Scraping
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type === "scraping" && (
                <div className="space-y-2">
                  <Label htmlFor="selector">Selektor CSS</Label>
                  <Input
                    id="selector"
                    value={formData.selector}
                    onChange={(e) => setFormData({ ...formData, selector: e.target.value })}
                    placeholder="np. article.news-item, .main-content h2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Selektor CSS do wyodrębniania artykułów ze strony.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="interval">Interwał pobierania (minuty)</Label>
                <Input
                  id="interval"
                  type="number"
                  min={5}
                  max={1440}
                  value={formData.fetch_interval_minutes}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    fetch_interval_minutes: parseInt(e.target.value) || 30 
                  })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="active">Aktywne</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={handleSubmit} disabled={saving || !formData.name || !formData.url}>
                {saving ? "Zapisywanie..." : editingSource ? "Zapisz zmiany" : "Dodaj źródło"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sources.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed">
          <Rss className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Brak skonfigurowanych źródeł</p>
          <p className="text-xs">Dodaj źródło RSS lub konfigurację scrapowania</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Ostatnie pobranie</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>
                    <Badge variant={source.type === "rss" ? "default" : "secondary"}>
                      {source.type === "rss" ? (
                        <><Rss className="h-3 w-3 mr-1" /> RSS</>
                      ) : (
                        <><Code className="h-3 w-3 mr-1" /> Scraping</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {source.url.replace(/^https?:\/\//, "").slice(0, 30)}...
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {source.last_fetched_at 
                      ? format(new Date(source.last_fetched_at), "dd MMM yyyy, HH:mm", { locale: pl })
                      : "Nigdy"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={source.is_active}
                      onCheckedChange={() => handleToggleActive(source)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(source)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Usunąć źródło?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Ta akcja jest nieodwracalna. Źródło "{source.name}" zostanie 
                              trwale usunięte.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteSource(source.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Usuń
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
