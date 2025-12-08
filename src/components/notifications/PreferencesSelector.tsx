import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AVAILABLE_CATEGORIES = [
  { id: "wiadomosci", label: "Wiadomości", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "biznes", label: "Biznes", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { id: "sport", label: "Sport", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { id: "tech", label: "Technologia", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { id: "lifestyle", label: "Lifestyle", color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
  { id: "rozrywka", label: "Rozrywka", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
];

interface PreferencesSelectorProps {
  selectedCategories: string[];
  selectedTags: string[];
  onCategoriesChange: (categories: string[]) => void;
  onTagsChange: (tags: string[]) => void;
}

export function PreferencesSelector({
  selectedCategories,
  selectedTags,
  onCategoriesChange,
  onTagsChange,
}: PreferencesSelectorProps) {
  const [newTag, setNewTag] = useState("");

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter(c => c !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="text-sm font-medium mb-3">Wybierz kategorie</h4>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_CATEGORIES.map(category => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                  isSelected
                    ? category.color
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h4 className="text-sm font-medium mb-3">Dodaj własne tagi</h4>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="np. AI, polityka, ekologia..."
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addTag}
            disabled={!newTag.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="pr-1 gap-1"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:bg-foreground/10 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
