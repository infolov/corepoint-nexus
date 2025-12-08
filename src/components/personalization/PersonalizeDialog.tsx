import { useState } from "react";
import { Settings2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const categories = [
  { id: "news", name: "Wiadomości", emoji: "📰" },
  { id: "sport", name: "Sport", emoji: "⚽" },
  { id: "business", name: "Biznes", emoji: "💼" },
  { id: "tech", name: "Technologia", emoji: "💻" },
  { id: "entertainment", name: "Rozrywka", emoji: "🎬" },
  { id: "lifestyle", name: "Lifestyle", emoji: "🌟" },
  { id: "science", name: "Nauka", emoji: "🔬" },
  { id: "health", name: "Zdrowie", emoji: "🏥" },
  { id: "travel", name: "Podróże", emoji: "✈️" },
  { id: "food", name: "Jedzenie", emoji: "🍕" },
  { id: "auto", name: "Motoryzacja", emoji: "🚗" },
  { id: "culture", name: "Kultura", emoji: "🎭" },
];

const sources = [
  { id: "informacje", name: "INFORMACJE.PL", selected: true },
  { id: "tvn24", name: "TVN24", selected: false },
  { id: "polsat", name: "Polsat News", selected: false },
  { id: "onet", name: "Onet", selected: false },
  { id: "wp", name: "Wirtualna Polska", selected: false },
  { id: "interia", name: "Interia", selected: false },
];

export function PersonalizeDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "news", "sport", "tech"
  ]);
  const [selectedSources, setSelectedSources] = useState<string[]>(["informacje"]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleSource = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!user) {
      toast.error("Zaloguj się, aby zapisać preferencje");
      return;
    }
    toast.success("Preferencje zostały zapisane");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Personalizuj</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Personalizuj swój feed
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Categories Section */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Zainteresowania</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Wybierz kategorie, które Cię interesują
            </p>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sources Section */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Źródła wiadomości</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Wybierz preferowane źródła informacji
            </p>
            <div className="space-y-2">
              {sources.map((source) => {
                const isSelected = selectedSources.includes(source.id);
                return (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-lg border text-sm transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <span className={isSelected ? "text-primary font-medium" : ""}>
                      {source.name}
                    </span>
                    {isSelected ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded border border-muted-foreground/30" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hidden Topics */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Ukryte tematy</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Tematy, które nie będą wyświetlane w Twoim feedzie
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded-full text-xs">
                Polityka
                <button className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded-full text-xs">
                Celebryci
                <button className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
              <button className="px-2.5 py-1 border border-dashed border-muted-foreground/30 rounded-full text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                + Dodaj temat
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Anuluj
          </Button>
          <Button size="sm" onClick={handleSave}>
            Zapisz preferencje
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
