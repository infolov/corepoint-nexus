import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArticleFormData } from "@/hooks/useAdminArticles";

const categories = [
  "Wiadomości",
  "Biznes",
  "Sport",
  "Technologia",
  "Lifestyle",
  "Kultura",
  "Analiza",
  "Poradnik",
];

const badges = [
  { value: "none", label: "Brak" },
  { value: "hot", label: "🔥 Gorące" },
  { value: "trending", label: "📈 Trending" },
  { value: "new", label: "✨ Nowe" },
];

interface ArticleFormProps {
  initialData?: Partial<ArticleFormData> & { id?: string };
  onSubmit: (data: ArticleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ArticleForm({ initialData, onSubmit, onCancel, isLoading }: ArticleFormProps) {
  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    excerpt: "",
    content: "",
    category: "Wiadomości",
    image: "",
    badge: null,
    is_published: true,
    is_featured: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        excerpt: initialData.excerpt || "",
        content: initialData.content || "",
        category: initialData.category || "Wiadomości",
        image: initialData.image || "",
        badge: initialData.badge || null,
        is_published: initialData.is_published ?? true,
        is_featured: initialData.is_featured ?? false,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Tytuł *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Zajawka</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          rows={2}
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Treść</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={8}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Kategoria *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Etykieta</Label>
          <Select
            value={formData.badge || "none"}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                badge: value === "none" ? null : (value as "hot" | "trending" | "new"),
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {badges.map((badge) => (
                <SelectItem key={badge.value} value={badge.value}>
                  {badge.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">URL obrazka *</Label>
        <Input
          id="image"
          type="url"
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          required
          placeholder="https://..."
        />
        {formData.image && (
          <img
            src={formData.image}
            alt="Preview"
            className="mt-2 h-32 w-auto object-cover rounded-lg"
          />
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="is_published"
            checked={formData.is_published}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_published: checked })
            }
          />
          <Label htmlFor="is_published">Opublikowany</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="is_featured"
            checked={formData.is_featured}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_featured: checked })
            }
          />
          <Label htmlFor="is_featured">Wyróżniony (slider)</Label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="gradient" disabled={isLoading}>
          {isLoading ? "Zapisywanie..." : initialData?.id ? "Zapisz zmiany" : "Dodaj artykuł"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
      </div>
    </form>
  );
}
