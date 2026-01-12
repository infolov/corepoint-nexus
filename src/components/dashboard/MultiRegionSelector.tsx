import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import { getVoivodeships } from "@/data/poland-divisions";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SelectedRegion {
  voivodeship: string;
}

interface MultiRegionSelectorProps {
  selectedRegions: SelectedRegion[];
  onRegionsChange: (regions: SelectedRegion[]) => void;
  maxRegions?: number;
}

export const MultiRegionSelector = ({
  selectedRegions,
  onRegionsChange,
  maxRegions = 16,
}: MultiRegionSelectorProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const voivodeships = getVoivodeships();

  const isVoivodeshipSelected = (voivodeship: string) => {
    return selectedRegions.some(r => r.voivodeship === voivodeship);
  };

  const toggleVoivodeship = (voivodeship: string) => {
    if (isVoivodeshipSelected(voivodeship)) {
      onRegionsChange(selectedRegions.filter(r => r.voivodeship !== voivodeship));
    } else {
      if (selectedRegions.length < maxRegions) {
        onRegionsChange([...selectedRegions, { voivodeship }]);
      }
    }
  };

  const selectAllVoivodeships = () => {
    onRegionsChange(voivodeships.map(v => ({ voivodeship: v })));
  };

  const clearAllVoivodeships = () => {
    onRegionsChange([]);
  };

  const removeRegion = (voivodeship: string) => {
    onRegionsChange(selectedRegions.filter(r => r.voivodeship !== voivodeship));
  };

  const formatVoivodeshipName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Selected regions badges */}
      {selectedRegions.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            Wybrane regiony ({selectedRegions.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedRegions.map((region) => (
              <Badge
                key={region.voivodeship}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                {formatVoivodeshipName(region.voivodeship)}
                <button
                  type="button"
                  onClick={() => removeRegion(region.voivodeship)}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Region selector */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Wybierz województwa
            </span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="border rounded-lg p-4 space-y-4">
            {/* Quick actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllVoivodeships}
                disabled={selectedRegions.length === voivodeships.length}
              >
                Zaznacz wszystkie
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllVoivodeships}
                disabled={selectedRegions.length === 0}
              >
                Odznacz wszystkie
              </Button>
            </div>

            {/* Voivodeships grid */}
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {voivodeships.map((voivodeship) => {
                  const isSelected = isVoivodeshipSelected(voivodeship);
                  return (
                    <div
                      key={voivodeship}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleVoivodeship(voivodeship)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleVoivodeship(voivodeship)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm font-medium">
                        {formatVoivodeshipName(voivodeship)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Info text */}
            <p className="text-xs text-muted-foreground">
              Możesz wybrać maksymalnie {maxRegions} województw. Reklama będzie
              wyświetlana użytkownikom z wybranych regionów.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Targeting summary */}
      {selectedRegions.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <p className="text-sm font-medium mb-1">Zasięg reklamy:</p>
          <p className="text-sm text-muted-foreground">
            {selectedRegions.length === voivodeships.length ? (
              <>Wszystkie województwa w Polsce</>
            ) : selectedRegions.length === 1 ? (
              <>
                Województwo <strong>{formatVoivodeshipName(selectedRegions[0].voivodeship)}</strong>
              </>
            ) : (
              <>
                <strong>{selectedRegions.length}</strong> województw:{" "}
                {selectedRegions
                  .slice(0, 3)
                  .map((r) => formatVoivodeshipName(r.voivodeship))
                  .join(", ")}
                {selectedRegions.length > 3 && ` i ${selectedRegions.length - 3} więcej`}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
