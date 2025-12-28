import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";

const categories = [
  { id: "wiadomosci", name: "Wiadomości", icon: "📰" },
  { id: "biznes", name: "Biznes", icon: "💼" },
  { id: "sport", name: "Sport", icon: "⚽" },
  { id: "technologia", name: "Technologia", icon: "💻" },
  { id: "lifestyle", name: "Lifestyle", icon: "🌟" },
  { id: "rozrywka", name: "Rozrywka", icon: "🎬" },
  { id: "nauka", name: "Nauka", icon: "🔬" },
  { id: "zdrowie", name: "Zdrowie", icon: "💊" },
  { id: "kultura", name: "Kultura", icon: "🎭" },
  { id: "motoryzacja", name: "Motoryzacja", icon: "🚗" },
];

const sportSubcategories = [
  { id: "pilka-nozna", name: "Piłka nożna" },
  { id: "koszykowka", name: "Koszykówka" },
  { id: "siatkowka", name: "Siatkówka" },
  { id: "tenis", name: "Tenis" },
  { id: "sporty-motorowe", name: "Sporty Motorowe" },
  { id: "sporty-walki", name: "Sporty Walki" },
  { id: "hokej", name: "Hokej" },
  { id: "lekkoatletyka", name: "Lekkoatletyka" },
  { id: "sporty-zimowe", name: "Sporty Zimowe" },
  { id: "esport", name: "E-sport" },
];

interface InterestsSelectorProps {
  selectedCategories: string[];
  selectedTags: string[];
  onCategoriesChange: (categories: string[]) => void;
  onTagsChange: (tags: string[]) => void;
  onContinue: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
  showSkip?: boolean;
  submitLabel?: string;
}

export function InterestsSelector({
  selectedCategories,
  selectedTags,
  onCategoriesChange,
  onTagsChange,
  onContinue,
  onSkip,
  isLoading = false,
  showSkip = true,
  submitLabel = "Kontynuuj",
}: InterestsSelectorProps) {
  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const showSportSubcategories = selectedCategories.includes("sport");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Wybierz swoje zainteresowania
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          Dzięki temu pokażemy Ci najbardziej dopasowane treści
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => (
          <label
            key={category.id}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              selectedCategories.includes(category.id)
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <Checkbox
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={() => handleCategoryToggle(category.id)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-lg mr-1">{category.icon}</span>
            <span className="text-sm font-medium text-foreground">
              {category.name}
            </span>
          </label>
        ))}
      </div>

      {/* Sport Subcategories */}
      {showSportSubcategories && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-medium text-foreground">
            Wybierz dyscypliny sportowe:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sportSubcategories.map((sport) => (
              <label
                key={sport.id}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm ${
                  selectedTags.includes(sport.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Checkbox
                  checked={selectedTags.includes(sport.id)}
                  onCheckedChange={() => handleTagToggle(sport.id)}
                  className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-foreground">{sport.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={onContinue}
          disabled={isLoading}
          variant="gradient"
          size="xl"
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {submitLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
        
        {showSkip && onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            Pomiń na razie
          </Button>
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        Możesz zmienić swoje zainteresowania w każdej chwili w ustawieniach konta
      </p>
    </div>
  );
}
