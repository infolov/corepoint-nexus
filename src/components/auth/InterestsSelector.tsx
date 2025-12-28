import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: { id: string; name: string }[];
}

const categories: Category[] = [
  {
    id: "wiadomosci",
    name: "Wiadomości",
    icon: "📰",
    subcategories: [
      { id: "wiadomosci-polska", name: "Polska" },
      { id: "wiadomosci-swiat", name: "Świat" },
      { id: "wiadomosci-polityka", name: "Polityka" },
      { id: "wiadomosci-gospodarka", name: "Gospodarka" },
      { id: "wiadomosci-spoleczenstwo", name: "Społeczeństwo" },
    ],
  },
  {
    id: "biznes",
    name: "Biznes",
    icon: "💼",
    subcategories: [
      { id: "biznes-finanse", name: "Finanse" },
      { id: "biznes-gielda", name: "Giełda" },
      { id: "biznes-startupy", name: "Startupy" },
      { id: "biznes-nieruchomosci", name: "Nieruchomości" },
      { id: "biznes-praca", name: "Praca" },
    ],
  },
  {
    id: "sport",
    name: "Sport",
    icon: "⚽",
    subcategories: [
      { id: "sport-pilka-nozna", name: "Piłka nożna" },
      { id: "sport-koszykowka", name: "Koszykówka" },
      { id: "sport-siatkowka", name: "Siatkówka" },
      { id: "sport-tenis", name: "Tenis" },
      { id: "sport-sporty-motorowe", name: "Sporty Motorowe" },
      { id: "sport-sporty-walki", name: "Sporty Walki" },
      { id: "sport-hokej", name: "Hokej" },
      { id: "sport-lekkoatletyka", name: "Lekkoatletyka" },
      { id: "sport-sporty-zimowe", name: "Sporty Zimowe" },
      { id: "sport-esport", name: "E-sport" },
    ],
  },
  {
    id: "technologia",
    name: "Technologia",
    icon: "💻",
    subcategories: [
      { id: "tech-ai", name: "Sztuczna inteligencja" },
      { id: "tech-smartfony", name: "Smartfony" },
      { id: "tech-gaming", name: "Gaming" },
      { id: "tech-software", name: "Oprogramowanie" },
      { id: "tech-hardware", name: "Sprzęt" },
    ],
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    icon: "🌟",
    subcategories: [
      { id: "lifestyle-moda", name: "Moda" },
      { id: "lifestyle-uroda", name: "Uroda" },
      { id: "lifestyle-podroze", name: "Podróże" },
      { id: "lifestyle-jedzenie", name: "Jedzenie" },
      { id: "lifestyle-design", name: "Design" },
    ],
  },
  {
    id: "rozrywka",
    name: "Rozrywka",
    icon: "🎬",
    subcategories: [
      { id: "rozrywka-filmy", name: "Filmy" },
      { id: "rozrywka-seriale", name: "Seriale" },
      { id: "rozrywka-muzyka", name: "Muzyka" },
      { id: "rozrywka-gwiazdy", name: "Gwiazdy" },
      { id: "rozrywka-streaming", name: "Streaming" },
    ],
  },
  {
    id: "nauka",
    name: "Nauka",
    icon: "🔬",
    subcategories: [
      { id: "nauka-kosmos", name: "Kosmos" },
      { id: "nauka-medycyna", name: "Medycyna" },
      { id: "nauka-fizyka", name: "Fizyka" },
      { id: "nauka-biologia", name: "Biologia" },
      { id: "nauka-ekologia", name: "Ekologia" },
    ],
  },
  {
    id: "zdrowie",
    name: "Zdrowie",
    icon: "💊",
    subcategories: [
      { id: "zdrowie-dieta", name: "Dieta" },
      { id: "zdrowie-fitness", name: "Fitness" },
      { id: "zdrowie-psychologia", name: "Psychologia" },
      { id: "zdrowie-choroby", name: "Choroby" },
      { id: "zdrowie-profilaktyka", name: "Profilaktyka" },
    ],
  },
  {
    id: "kultura",
    name: "Kultura",
    icon: "🎭",
    subcategories: [
      { id: "kultura-sztuka", name: "Sztuka" },
      { id: "kultura-teatr", name: "Teatr" },
      { id: "kultura-ksiazki", name: "Książki" },
      { id: "kultura-muzea", name: "Muzea" },
      { id: "kultura-festiwale", name: "Festiwale" },
    ],
  },
  {
    id: "motoryzacja",
    name: "Motoryzacja",
    icon: "🚗",
    subcategories: [
      { id: "moto-samochody", name: "Samochody" },
      { id: "moto-motocykle", name: "Motocykle" },
      { id: "moto-elektryczne", name: "Elektryczne" },
      { id: "moto-testy", name: "Testy" },
      { id: "moto-porady", name: "Porady" },
    ],
  },
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
      // Auto-select main category when expanding
      if (!selectedCategories.includes(categoryId)) {
        onCategoriesChange([...selectedCategories, categoryId]);
      }
    }
  };

  const handleCategoryToggle = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== categoryId));
      // Remove all subcategories of this category
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        const subIds = category.subcategories.map((s) => s.id);
        onTagsChange(selectedTags.filter((t) => !subIds.includes(t)));
      }
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const handleSubcategoryToggle = (subcategoryId: string) => {
    if (selectedTags.includes(subcategoryId)) {
      onTagsChange(selectedTags.filter((t) => t !== subcategoryId));
    } else {
      onTagsChange([...selectedTags, subcategoryId]);
    }
  };

  const getSelectedSubcategoriesCount = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return 0;
    return category.subcategories.filter((s) => selectedTags.includes(s.id)).length;
  };

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
          Kliknij kategorię, aby rozwinąć podkategorie
        </p>
      </div>

      {/* Categories with expandable subcategories */}
      <div className="space-y-2">
        {categories.map((category) => {
          const isExpanded = expandedCategory === category.id;
          const isSelected = selectedCategories.includes(category.id);
          const selectedSubCount = getSelectedSubcategoriesCount(category.id);

          return (
            <div key={category.id} className="rounded-xl border border-border overflow-hidden">
              {/* Main category tile */}
              <div
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  "flex items-center justify-between p-4 cursor-pointer transition-all",
                  isSelected
                    ? "bg-primary/5 border-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    onClick={(e) => handleCategoryToggle(category.id, e)}
                    className="flex items-center"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {}}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  <span className="text-xl">{category.icon}</span>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {category.name}
                    </span>
                    {selectedSubCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {selectedSubCount} podkategorii wybranych
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Subcategories panel */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/30 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="grid grid-cols-2 gap-2">
                    {category.subcategories.map((sub) => (
                      <label
                        key={sub.id}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                          selectedTags.includes(sub.id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 hover:border-primary/50 hover:bg-background"
                        )}
                      >
                        <Checkbox
                          checked={selectedTags.includes(sub.id)}
                          onCheckedChange={() => handleSubcategoryToggle(sub.id)}
                          className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className="text-foreground">{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
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
