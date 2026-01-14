import { Check, LayoutGrid, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface FeedTilePositionSelectorProps {
  selectedPosition: number | null;
  onPositionSelect: (position: number) => void;
  occupiedPositions?: number[];
  loading?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

const TILE_POSITIONS = [
  { id: 1, row: 1, col: 1, label: "1" },
  { id: 2, row: 1, col: 2, label: "2" },
  { id: 3, row: 1, col: 3, label: "3" },
  { id: 4, row: 2, col: 1, label: "4" },
  { id: 5, row: 2, col: 2, label: "5" },
  { id: 6, row: 2, col: 3, label: "6" },
  { id: 7, row: 3, col: 1, label: "7" },
  { id: 8, row: 3, col: 2, label: "8" },
  { id: 9, row: 3, col: 3, label: "9" },
  { id: 10, row: 4, col: 1, label: "10" },
  { id: 11, row: 4, col: 2, label: "11" },
  { id: 12, row: 4, col: 3, label: "12" },
];

export function FeedTilePositionSelector({
  selectedPosition,
  onPositionSelect,
  occupiedPositions = [],
  loading = false,
  startDate,
  endDate,
}: FeedTilePositionSelectorProps) {
  const availableCount = 12 - occupiedPositions.length;
  const hasDateRange = startDate && endDate;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Wybierz pozycję kafelka</CardTitle>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Sprawdzanie dostępności...</span>
            </div>
          )}
        </div>
        <CardDescription>
          Wybierz jedną z 12 pozycji w siatce artykułów. Twoja reklama zajmie miejsce wybranego kafelka.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Availability status */}
        {hasDateRange && !loading && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Dostępność w wybranym terminie:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={availableCount > 0 ? "default" : "destructive"}>
                  {availableCount} z 12 wolnych
                </Badge>
              </div>
            </div>
            {startDate && endDate && (
              <p className="text-xs text-muted-foreground mt-2">
                Termin: {format(startDate, "d MMMM yyyy", { locale: pl })} - {format(endDate, "d MMMM yyyy", { locale: pl })}
              </p>
            )}
            {occupiedPositions.length > 0 && (
              <p className="text-xs text-destructive mt-1">
                Zajęte pozycje: {occupiedPositions.sort((a, b) => a - b).join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Visual grid representation */}
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-3 text-center">
              Podgląd siatki artykułów (3 kolumny × 4 wiersze)
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
              {TILE_POSITIONS.map((tile) => {
                const isOccupied = occupiedPositions.includes(tile.id);
                const isSelected = selectedPosition === tile.id;

                return (
                  <button
                    key={tile.id}
                    disabled={isOccupied || loading}
                    onClick={() => !isOccupied && !loading && onPositionSelect(tile.id)}
                    className={cn(
                      "relative aspect-[4/3] rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1",
                      !isOccupied && !isSelected && !loading && "border-border bg-card hover:border-primary hover:bg-primary/5 cursor-pointer",
                      isSelected && "border-primary bg-primary/10 ring-2 ring-primary/30",
                      isOccupied && "border-destructive/50 bg-destructive/10 cursor-not-allowed",
                      loading && !isSelected && "opacity-50 cursor-wait"
                    )}
                  >
                    {isSelected ? (
                      <>
                        <ImageIcon className="h-6 w-6 text-primary" />
                        <span className="text-xs font-medium text-primary">Reklama</span>
                      </>
                    ) : isOccupied ? (
                      <>
                        <span className="text-lg font-bold text-destructive/70">{tile.label}</span>
                        <span className="text-[10px] text-destructive/70 font-medium">Zajęty</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-muted-foreground">{tile.label}</span>
                        <span className="text-[10px] text-muted-foreground">Wolny</span>
                      </>
                    )}

                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-border bg-card" />
              <span className="text-muted-foreground">Wolny</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-primary bg-primary/10" />
              <span className="text-muted-foreground">Wybrany</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-destructive/50 bg-destructive/10" />
              <span className="text-muted-foreground">Zajęty</span>
            </div>
          </div>

          {/* Button grid for quick selection */}
          <div>
            <div className="text-sm font-medium mb-2">Szybki wybór pozycji:</div>
            <div className="grid grid-cols-6 gap-2">
              {TILE_POSITIONS.map((tile) => {
                const isOccupied = occupiedPositions.includes(tile.id);
                const isSelected = selectedPosition === tile.id;

                return (
                  <button
                    key={tile.id}
                    disabled={isOccupied || loading}
                    onClick={() => !isOccupied && !loading && onPositionSelect(tile.id)}
                    className={cn(
                      "p-2 rounded-lg border-2 transition-all text-center",
                      !isOccupied && !isSelected && !loading && "border-border hover:border-primary cursor-pointer",
                      isSelected && "border-primary bg-primary/10",
                      isOccupied && "border-destructive/50 bg-destructive/10 cursor-not-allowed",
                      loading && !isSelected && "opacity-50 cursor-wait"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected && "text-primary",
                      isOccupied && "text-destructive/70 line-through"
                    )}>
                      {tile.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedPosition && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/30">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="text-sm">
                Wybrana pozycja: <strong>Kafelek {selectedPosition}</strong> 
                {selectedPosition <= 3 && " (górny rząd - najlepsza widoczność)"}
                {selectedPosition > 3 && selectedPosition <= 6 && " (drugi rząd)"}
                {selectedPosition > 6 && selectedPosition <= 9 && " (trzeci rząd)"}
                {selectedPosition > 9 && " (dolny rząd)"}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            💡 Tip: Pozycje 1-3 (górny rząd) mają najwyższą widoczność. Reklama będzie wyświetlana w każdej siatce 12 artykułów.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
