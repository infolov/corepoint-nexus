import { useState } from "react";
import { Newspaper, MapPin, Trophy, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useContentRatio, balanceRatios } from "@/hooks/use-content-ratio";
import { cn } from "@/lib/utils";

interface ContentRatioSliderProps {
  className?: string;
}

type Category = "general" | "local" | "sport";

const CATEGORIES: {
  key: Category;
  label: string;
  icon: typeof Newspaper;
  colorClass: string;
  bgClass: string;
}[] = [
  { key: "general", label: "Wszystkie", icon: Newspaper, colorClass: "text-orange-500", bgClass: "bg-orange-500" },
  { key: "local", label: "Lokalne", icon: MapPin, colorClass: "text-blue-500", bgClass: "bg-blue-500" },
  { key: "sport", label: "Sport", icon: Trophy, colorClass: "text-green-500", bgClass: "bg-green-500" },
];

export function ContentRatioSlider({ className }: ContentRatioSliderProps) {
  const { preferences, loading, saving, setRatios } = useContentRatio();
  const [localValues, setLocalValues] = useState<Record<Category, number> | null>(null);

  const values = localValues ?? {
    general: preferences.generalRatio,
    local: preferences.localRatio,
    sport: preferences.sportRatio,
  };

  const handleSliderChange = (category: Category, newValue: number) => {
    const clamped = Math.max(0, Math.min(100, newValue));
    const others = CATEGORIES.filter(c => c.key !== category).map(c => c.key);
    const [balA, balB] = balanceRatios(clamped, values[others[0]], values[others[1]]);

    setLocalValues({
      ...values,
      [category]: clamped,
      [others[0]]: balA,
      [others[1]]: balB,
    });
  };

  const handleSliderCommit = () => {
    if (localValues) {
      setRatios(localValues.general, localValues.local, localValues.sport);
      setLocalValues(null);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Proporcje treści</Label>
        {saving && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Zapisywanie...
          </span>
        )}
      </div>

      {/* Three category sliders */}
      <div className="space-y-3">
        {CATEGORIES.map(({ key, label, icon: Icon, colorClass }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", colorClass)} />
                <span className="text-muted-foreground">{label}</span>
              </div>
              <span className="font-semibold text-foreground tabular-nums w-10 text-right">
                {values[key]}%
              </span>
            </div>
            <Slider
              value={[values[key]]}
              onValueChange={(v) => handleSliderChange(key, v[0])}
              onValueCommit={handleSliderCommit}
              min={0}
              max={100}
              step={5}
              className="relative"
            />
          </div>
        ))}
      </div>

      {/* Visual preview bar */}
      <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden">
        {CATEGORIES.map(({ key, bgClass }) => (
          <div
            key={key}
            className={cn(bgClass, "transition-all duration-300")}
            style={{ width: `${values[key]}%` }}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Dostosuj proporcje wiadomości w Twoim feedzie. Suma zawsze wynosi 100%.
      </p>
    </div>
  );
}
