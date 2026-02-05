import { useState } from "react";
import { MapPin, Trophy, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useContentRatio } from "@/hooks/use-content-ratio";
import { cn } from "@/lib/utils";

interface ContentRatioSliderProps {
  className?: string;
}

export function ContentRatioSlider({ className }: ContentRatioSliderProps) {
  const { preferences, loading, saving, setLocalRatio } = useContentRatio();
  const [localValue, setLocalValue] = useState<number | null>(null);

  // Use local value during drag, otherwise use saved value
  const displayValue = localValue ?? preferences.localRatio;
  const sportValue = 100 - displayValue;

  const handleValueChange = (values: number[]) => {
    setLocalValue(values[0]);
  };

  const handleValueCommit = (values: number[]) => {
    setLocalRatio(values[0]);
    setLocalValue(null);
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
      
      {/* Ratio display */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-500/10">
            <MapPin className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-muted-foreground">Lokalne</span>
          <span className="font-semibold text-foreground">{displayValue}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{sportValue}%</span>
          <span className="text-muted-foreground">Sport</span>
          <div className="p-1.5 rounded-md bg-green-500/10">
            <Trophy className="h-4 w-4 text-green-500" />
          </div>
        </div>
      </div>

      {/* Slider with gradient track */}
      <div className="relative">
        <div className="absolute inset-0 h-2 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 opacity-20" />
        <Slider
          value={[displayValue]}
          onValueChange={handleValueChange}
          onValueCommit={handleValueCommit}
          min={0}
          max={100}
          step={10}
          className="relative"
        />
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center">
        Przesuń suwak, aby dostosować proporcje lokalnych i sportowych wiadomości w Twoim feedzie.
      </p>

      {/* Visual preview */}
      <div className="flex gap-1 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-blue-500 transition-all duration-300"
          style={{ width: `${displayValue}%` }}
        />
        <div 
          className="bg-green-500 transition-all duration-300"
          style={{ width: `${sportValue}%` }}
        />
      </div>
    </div>
  );
}
