import { useState, useMemo } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  FolderTree, 
  Tags, 
  Rss, 
  Loader2,
  RefreshCw,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCategories, Category, CategoryWithSources } from "@/hooks/use-categories";
import { KeywordTagInput } from "@/components/admin/KeywordTagInput";
import { SourcesTable } from "@/components/admin/SourcesTable";

export default function DashboardAdminCategories() {
  const {
    categories,
    loading,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
    createSource,
    updateSource,
    deleteSource,
  } = useCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithSources | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parent_slug: null as string | null,
    keywords: [] as string[],
    display_order: 0,
    is_active: true,
  });

  // Group categories by parent
  const { parentCategories, childrenMap } = useMemo(() => {
    const parents = categories.filter((c) => !c.parent_slug);
    const children: Record<string, CategoryWithSources[]> = {};
    
    categories.forEach((cat) => {
      if (cat.parent_slug) {
        if (!children[cat.parent_slug]) {
          children[cat.parent_slug] = [];
        }
        children[cat.parent_slug].push(cat);
      }
    });

    return { parentCategories: parents, childrenMap: children };
  }, [categories]);

  // Filter categories by search
  const filteredParents = useMemo(() => {
    if (!searchQuery.trim()) return parentCategories;
    const query = searchQuery.toLowerCase();
    return parentCategories.filter((cat) => 
      cat.name.toLowerCase().includes(query) ||
      cat.slug.toLowerCase().includes(query) ||
      cat.keywords.some((k) => k.toLowerCase().includes(query)) ||
      childrenMap[cat.slug]?.some((child) => 
        child.name.toLowerCase().includes(query) ||
        child.slug.toLowerCase().includes(query) ||
        child.keywords.some((k) => k.toLowerCase().includes(query))
      )
    );
  }, [parentCategories, childrenMap, searchQuery]);

  const toggleExpand = (slug: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      parent_slug: null,
      keywords: [],
      display_order: 0,
      is_active: true,
    });
    setEditingCategory(null);
  };

  const openEditDialog = (category: CategoryWithSources) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      parent_slug: category.parent_slug,
      keywords: category.keywords,
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) return;

    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          slug: formData.slug,
          parent_slug: formData.parent_slug,
          keywords: formData.keywords,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
      } else {
        await createCategory({
          name: formData.name,
          slug: formData.slug,
          parent_slug: formData.parent_slug,
          keywords: formData.keywords,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
      }
      setIsAddDialogOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingCategory ? formData.slug : generateSlug(name),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Zarządzanie kategoriami</h1>
          <p className="text-muted-foreground">
            Konfiguruj kategorie, słowa kluczowe i źródła treści
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Odśwież
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Dodaj kategorię
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj kategorii, słów kluczowych..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
              Spróbuj ponownie
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {filteredParents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium">Brak kategorii</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery ? "Nie znaleziono kategorii pasujących do wyszukiwania" : "Dodaj pierwszą kategorię aby rozpocząć"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredParents.map((category) => {
            const children = childrenMap[category.slug] || [];
            const hasChildren = children.length > 0;
            const isExpanded = expandedCategories.has(category.slug);

            return (
              <Card key={category.id}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(category.slug)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 mt-0.5">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{category.name}</CardTitle>
                            {!category.is_active && (
                              <Badge variant="secondary">Nieaktywna</Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs">
                            Slug: <code className="bg-muted px-1 rounded">{category.slug}</code>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Tags className="h-4 w-4" />
                              <span>{category.keywords.length}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {category.keywords.length} słów kluczowych
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Rss className="h-4 w-4" />
                              <span>{category.sourcesCount}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {category.sourcesCount} aktywnych źródeł
                          </TooltipContent>
                        </Tooltip>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(category)}
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
                                <AlertDialogTitle>Usunąć kategorię?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ta akcja jest nieodwracalna. Kategoria "{category.name}" 
                                  oraz wszystkie jej źródła zostaną trwale usunięte.
                                  {hasChildren && (
                                    <span className="block mt-2 text-destructive">
                                      Uwaga: Ta kategoria ma {children.length} podkategorii!
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCategory(category.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Usuń
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-6">
                      {/* Keywords Preview */}
                      {category.keywords.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Słowa kluczowe</h4>
                          <div className="flex flex-wrap gap-1">
                            {category.keywords.slice(0, 10).map((keyword) => (
                              <Badge key={keyword} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {category.keywords.length > 10 && (
                              <Badge variant="secondary" className="text-xs">
                                +{category.keywords.length - 10} więcej
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sources */}
                      <SourcesTable
                        sources={category.sources}
                        categoryId={category.id}
                        onCreateSource={createSource}
                        onUpdateSource={updateSource}
                        onDeleteSource={deleteSource}
                      />

                      {/* Subcategories */}
                      {hasChildren && (
                        <div className="space-y-3 pt-4 border-t">
                          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <FolderTree className="h-4 w-4" />
                            Podkategorie ({children.length})
                          </h4>
                          <div className="space-y-2 pl-4 border-l-2 border-muted">
                            {children.map((child) => (
                              <div
                                key={child.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{child.name}</span>
                                    {!child.is_active && (
                                      <Badge variant="secondary" className="text-xs">Nieaktywna</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>
                                      <code className="bg-background px-1 rounded">{child.slug}</code>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Tags className="h-3 w-3" />
                                      {child.keywords.length}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Rss className="h-3 w-3" />
                                      {child.sourcesCount}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditDialog(child)}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Usunąć podkategorię?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Ta akcja jest nieodwracalna. Podkategoria "{child.name}" 
                                          oraz wszystkie jej źródła zostaną trwale usunięte.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteCategory(child.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Usuń
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edytuj kategorię" : "Dodaj nową kategorię"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Zaktualizuj ustawienia kategorii i słowa kluczowe."
                : "Utwórz nową kategorię z konfiguracją słów kluczowych."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa kategorii</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="np. Technologia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug URL</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="np. technologia"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kategoria nadrzędna</Label>
              <Select
                value={formData.parent_slug || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, parent_slug: value === "none" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Brak (kategoria główna)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Brak (kategoria główna)</SelectItem>
                  {parentCategories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Słowa kluczowe do auto-przypisywania</Label>
              <KeywordTagInput
                keywords={formData.keywords}
                onChange={(keywords) => setFormData({ ...formData, keywords })}
                placeholder="Wpisz słowo kluczowe i naciśnij Enter..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Kolejność wyświetlania</Label>
                <Input
                  id="order"
                  type="number"
                  min={0}
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="active">Aktywna</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !formData.name || !formData.slug}
            >
              {saving
                ? "Zapisywanie..."
                : editingCategory
                ? "Zapisz zmiany"
                : "Dodaj kategorię"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
