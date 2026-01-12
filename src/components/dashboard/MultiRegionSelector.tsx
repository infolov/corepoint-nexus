import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Plus, X, ChevronDown, ChevronRight, Building2, Home, Trash2 } from "lucide-react";
import { getVoivodeships, getPowiats, getGminas } from "@/data/poland-divisions";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface SelectedRegion {
  voivodeship: string;
  powiat?: string;
  gmina?: string;
}

interface MultiRegionSelectorProps {
  selectedRegions: SelectedRegion[];
  onRegionsChange: (regions: SelectedRegion[]) => void;
  maxRegions?: number;
}

export const MultiRegionSelector = ({
  selectedRegions,
  onRegionsChange,
  maxRegions = 50,
}: MultiRegionSelectorProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedVoivodeships, setExpandedVoivodeships] = useState<string[]>([]);
  const voivodeships = getVoivodeships();

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Check if a voivodeship has any selections (even partial)
  const hasVoivodeshipSelection = (voivodeship: string) => {
    return selectedRegions.some(r => r.voivodeship === voivodeship);
  };

  // Check if entire voivodeship is selected (without powiat/gmina specifics)
  const isEntireVoivodeshipSelected = (voivodeship: string) => {
    return selectedRegions.some(
      r => r.voivodeship === voivodeship && !r.powiat && !r.gmina
    );
  };

  // Get all selections for a specific voivodeship
  const getVoivodeshipSelections = (voivodeship: string) => {
    return selectedRegions.filter(r => r.voivodeship === voivodeship);
  };

  // Toggle entire voivodeship selection
  const toggleEntireVoivodeship = (voivodeship: string) => {
    if (isEntireVoivodeshipSelected(voivodeship)) {
      // Remove entire voivodeship selection
      onRegionsChange(selectedRegions.filter(r => r.voivodeship !== voivodeship));
    } else {
      // Remove any specific selections and add entire voivodeship
      const filtered = selectedRegions.filter(r => r.voivodeship !== voivodeship);
      if (filtered.length < maxRegions) {
        onRegionsChange([...filtered, { voivodeship }]);
      }
    }
  };

  // Add specific powiat selection
  const addPowiatSelection = (voivodeship: string, powiat: string) => {
    // Remove entire voivodeship selection if exists
    const filtered = selectedRegions.filter(
      r => !(r.voivodeship === voivodeship && !r.powiat)
    );
    
    // Check if this powiat is already selected
    const exists = filtered.some(
      r => r.voivodeship === voivodeship && r.powiat === powiat && !r.gmina
    );
    
    if (!exists && filtered.length < maxRegions) {
      onRegionsChange([...filtered, { voivodeship, powiat }]);
    }
  };

  // Add specific gmina selection
  const addGminaSelection = (voivodeship: string, powiat: string, gmina: string) => {
    // Remove powiat-level selection if exists
    const filtered = selectedRegions.filter(
      r => !(r.voivodeship === voivodeship && r.powiat === powiat && !r.gmina)
    );
    
    // Check if this gmina is already selected
    const exists = filtered.some(
      r => r.voivodeship === voivodeship && r.powiat === powiat && r.gmina === gmina
    );
    
    if (!exists && filtered.length < maxRegions) {
      onRegionsChange([...filtered, { voivodeship, powiat, gmina }]);
    }
  };

  // Remove a specific region
  const removeRegion = (region: SelectedRegion) => {
    onRegionsChange(
      selectedRegions.filter(
        r => !(r.voivodeship === region.voivodeship && 
               r.powiat === region.powiat && 
               r.gmina === region.gmina)
      )
    );
  };

  // Select all voivodeships (entire Poland)
  const selectAllVoivodeships = () => {
    onRegionsChange(voivodeships.map(v => ({ voivodeship: v })));
  };

  // Clear all selections
  const clearAllSelections = () => {
    onRegionsChange([]);
  };

  // Toggle voivodeship expansion
  const toggleVoivodeshipExpansion = (voivodeship: string) => {
    setExpandedVoivodeships(prev =>
      prev.includes(voivodeship)
        ? prev.filter(v => v !== voivodeship)
        : [...prev, voivodeship]
    );
  };

  // Format region display for badge
  const formatRegionDisplay = (region: SelectedRegion) => {
    if (region.gmina) {
      return `${region.gmina}, ${region.powiat}`;
    }
    if (region.powiat) {
      return `pow. ${region.powiat}, ${formatName(region.voivodeship)}`;
    }
    return `woj. ${formatName(region.voivodeship)}`;
  };

  // Get targeting level color
  const getTargetingLevelColor = (region: SelectedRegion) => {
    if (region.gmina) return "bg-green-500";
    if (region.powiat) return "bg-blue-500";
    return "bg-orange-500";
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
            {selectedRegions.map((region, index) => (
              <Badge
                key={`${region.voivodeship}-${region.powiat || ''}-${region.gmina || ''}-${index}`}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                <span 
                  className={cn(
                    "w-2 h-2 rounded-full mr-1",
                    getTargetingLevelColor(region)
                  )}
                />
                {formatRegionDisplay(region)}
                <button
                  type="button"
                  onClick={() => removeRegion(region)}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Województwo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Powiat
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Gmina
            </span>
          </div>
        </div>
      )}

      {/* Region selector */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Dodaj regiony
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
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllVoivodeships}
                disabled={selectedRegions.length === voivodeships.length && 
                  selectedRegions.every(r => !r.powiat && !r.gmina)}
              >
                Zaznacz całą Polskę
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllSelections}
                disabled={selectedRegions.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Wyczyść wszystko
              </Button>
            </div>

            {/* Hierarchical voivodeships list */}
            <ScrollArea className="h-[400px]">
              <Accordion type="multiple" value={expandedVoivodeships} className="space-y-1">
                {voivodeships.map((voivodeship) => {
                  const selections = getVoivodeshipSelections(voivodeship);
                  const isEntireSelected = isEntireVoivodeshipSelected(voivodeship);
                  const hasSelection = hasVoivodeshipSelection(voivodeship);
                  const powiats = getPowiats(voivodeship);

                  return (
                    <AccordionItem
                      key={voivodeship}
                      value={voivodeship}
                      className="border rounded-lg px-3"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isEntireSelected}
                          onCheckedChange={() => toggleEntireVoivodeship(voivodeship)}
                          className="mr-1"
                        />
                        <AccordionTrigger 
                          className="flex-1 hover:no-underline py-3"
                          onClick={() => toggleVoivodeshipExpansion(voivodeship)}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">{formatName(voivodeship)}</span>
                            {hasSelection && !isEntireSelected && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {selections.length} wybran{selections.length === 1 ? 'e' : 'ych'}
                              </Badge>
                            )}
                            {isEntireSelected && (
                              <Badge variant="default" className="ml-2 text-xs bg-orange-500">
                                Całe województwo
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="pb-3">
                        <div className="pl-6 space-y-2">
                          <p className="text-xs text-muted-foreground mb-2">
                            Wybierz całe województwo lub kliknij na powiat, aby wybrać szczegółowo
                          </p>
                          
                          {/* Powiats */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                            {powiats.map((powiat) => {
                              const gminas = getGminas(voivodeship, powiat);
                              const isPowiatSelected = selectedRegions.some(
                                r => r.voivodeship === voivodeship && 
                                     r.powiat === powiat && 
                                     !r.gmina
                              );
                              const hasGminaSelections = selectedRegions.some(
                                r => r.voivodeship === voivodeship && 
                                     r.powiat === powiat && 
                                     r.gmina
                              );

                              return (
                                <Collapsible key={powiat} className="border rounded-md">
                                  <div className="flex items-center p-2 gap-2">
                                    <Checkbox
                                      checked={isPowiatSelected || isEntireSelected}
                                      disabled={isEntireSelected}
                                      onCheckedChange={() => {
                                        if (isPowiatSelected) {
                                          removeRegion({ voivodeship, powiat });
                                        } else {
                                          addPowiatSelection(voivodeship, powiat);
                                        }
                                      }}
                                    />
                                    <CollapsibleTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="flex-1 justify-start h-auto p-1 text-left"
                                        disabled={isEntireSelected || isPowiatSelected}
                                      >
                                        <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
                                        <span className="text-sm truncate">{powiat}</span>
                                        {hasGminaSelections && (
                                          <Badge variant="outline" className="ml-1 text-xs">
                                            +gminy
                                          </Badge>
                                        )}
                                        {!isEntireSelected && !isPowiatSelected && gminas.length > 0 && (
                                          <ChevronDown className="h-3 w-3 ml-auto" />
                                        )}
                                      </Button>
                                    </CollapsibleTrigger>
                                  </div>
                                  {!isEntireSelected && !isPowiatSelected && gminas.length > 0 && (
                                    <CollapsibleContent className="px-2 pb-2">
                                      <div className="pl-6 space-y-1 border-l ml-2">
                                        {gminas.map((gmina) => {
                                          const isGminaSelected = selectedRegions.some(
                                            r => r.voivodeship === voivodeship && 
                                                 r.powiat === powiat && 
                                                 r.gmina === gmina
                                          );
                                          return (
                                            <div 
                                              key={gmina} 
                                              className="flex items-center gap-2 py-1"
                                            >
                                              <Checkbox
                                                checked={isGminaSelected}
                                                onCheckedChange={() => {
                                                  if (isGminaSelected) {
                                                    removeRegion({ voivodeship, powiat, gmina });
                                                  } else {
                                                    addGminaSelection(voivodeship, powiat, gmina);
                                                  }
                                                }}
                                              />
                                              <Home className="h-3 w-3 text-muted-foreground" />
                                              <span className="text-sm">{gmina}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </CollapsibleContent>
                                  )}
                                </Collapsible>
                              );
                            })}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>

            {/* Info text */}
            <p className="text-xs text-muted-foreground">
              Możesz wybrać maksymalnie {maxRegions} lokalizacji. Im bardziej szczegółowy wybór, tym precyzyjniejsze targetowanie reklamy.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Targeting summary */}
      {selectedRegions.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <p className="text-sm font-medium mb-1">Zasięg reklamy:</p>
          <p className="text-sm text-muted-foreground">
            {selectedRegions.length === voivodeships.length && 
             selectedRegions.every(r => !r.powiat) ? (
              <>Wszystkie województwa w Polsce (kampania ogólnopolska)</>
            ) : (
              <>
                <strong>{selectedRegions.length}</strong>{" "}
                {selectedRegions.length === 1 ? "lokalizacja" : 
                 selectedRegions.length < 5 ? "lokalizacje" : "lokalizacji"}
                {" "}— dla każdej zostanie utworzona osobna kampania
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
