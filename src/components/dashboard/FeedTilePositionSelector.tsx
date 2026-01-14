import { Check, LayoutGrid, Image as ImageIcon, Loader2, AlertCircle, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  section1Price?: number;
  section2Price?: number | null;
}

// Blocked positions (1-3) - reserved, no ads allowed
const BLOCKED_POSITIONS = [1, 2, 3];

// First section: positions 4-12 (tiles 4-12 in first grid)
const SECTION_1_POSITIONS = [
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

// Second section: positions 13-24 (tiles 1-12 in second grid)
const SECTION_2_POSITIONS = [
  { id: 13, row: 1, col: 1, label: "13" },
  { id: 14, row: 1, col: 2, label: "14" },
  { id: 15, row: 1, col: 3, label: "15" },
  { id: 16, row: 2, col: 1, label: "16" },
  { id: 17, row: 2, col: 2, label: "17" },
  { id: 18, row: 2, col: 3, label: "18" },
  { id: 19, row: 3, col: 1, label: "19" },
  { id: 20, row: 3, col: 2, label: "20" },
  { id: 21, row: 3, col: 3, label: "21" },
  { id: 22, row: 4, col: 1, label: "22" },
  { id: 23, row: 4, col: 2, label: "23" },
  { id: 24, row: 4, col: 3, label: "24" },
];

// Full first grid for visual representation (including blocked positions)
const FULL_GRID_1 = [
  { id: 1, row: 1, col: 1, label: "1", blocked: true },
  { id: 2, row: 1, col: 2, label: "2", blocked: true },
  { id: 3, row: 1, col: 3, label: "3", blocked: true },
  { id: 4, row: 2, col: 1, label: "4", blocked: false },
  { id: 5, row: 2, col: 2, label: "5", blocked: false },
  { id: 6, row: 2, col: 3, label: "6", blocked: false },
  { id: 7, row: 3, col: 1, label: "7", blocked: false },
  { id: 8, row: 3, col: 2, label: "8", blocked: false },
  { id: 9, row: 3, col: 3, label: "9", blocked: false },
  { id: 10, row: 4, col: 1, label: "10", blocked: false },
  { id: 11, row: 4, col: 2, label: "11", blocked: false },
  { id: 12, row: 4, col: 3, label: "12", blocked: false },
];

export function FeedTilePositionSelector({
  selectedPosition,
  onPositionSelect,
  occupiedPositions = [],
  loading = false,
  startDate,
  endDate,
  section1Price,
  section2Price,
}: FeedTilePositionSelectorProps) {
  const hasDateRange = startDate && endDate;
  
  // Calculate availability for each section
  const section1Occupied = occupiedPositions.filter(p => p >= 4 && p <= 12).length;
  const section2Occupied = occupiedPositions.filter(p => p >= 13 && p <= 24).length;
  const section1Available = 9 - section1Occupied; // 9 positions in section 1 (4-12)
  const section2Available = 12 - section2Occupied; // 12 positions in section 2 (13-24)

  // Determine which section the selected position belongs to
  const selectedSection = selectedPosition 
    ? (selectedPosition >= 13 ? "section2" : "section1")
    : "section1";

  const renderTileGrid = (
    tiles: { id: number; row: number; col: number; label: string; blocked?: boolean }[],
    showBlockedRow?: boolean
  ) => (
    <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
      {tiles.map((tile) => {
        const isBlocked = tile.blocked || BLOCKED_POSITIONS.includes(tile.id);
        const isOccupied = occupiedPositions.includes(tile.id);
        const isSelected = selectedPosition === tile.id;

        return (
          <button
            key={tile.id}
            disabled={isBlocked || isOccupied || loading}
            onClick={() => !isBlocked && !isOccupied && !loading && onPositionSelect(tile.id)}
            className={cn(
              "relative aspect-[4/3] rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1",
              // Normal available state
              !isBlocked && !isOccupied && !isSelected && !loading && 
                "border-border bg-card hover:border-primary hover:bg-primary/5 cursor-pointer",
              // Selected state
              isSelected && "border-primary bg-primary/10 ring-2 ring-primary/30",
              // Occupied state
              isOccupied && !isBlocked && "border-destructive/50 bg-destructive/10 cursor-not-allowed",
              // Blocked state
              isBlocked && "border-muted bg-muted/30 cursor-not-allowed",
              // Loading state
              loading && !isSelected && !isBlocked && "opacity-50 cursor-wait"
            )}
          >
            {isBlocked ? (
              <>
                <Lock className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground/50">Zablokowany</span>
              </>
            ) : isSelected ? (
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
  );

  const renderQuickSelect = (positions: { id: number; label: string }[]) => (
    <div className="grid grid-cols-6 gap-2">
      {positions.map((tile) => {
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
  );

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
          Wybierz jedną z dostępnych pozycji w siatce artykułów. Pozycje 1-3 są zarezerwowane.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={selectedSection} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="section1" className="relative flex-col sm:flex-row gap-1">
              <span>Sekcja 1 (poz. 4-12)</span>
              <div className="flex items-center gap-1">
                {section1Price !== undefined && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                    {section1Price} kr./dzień
                  </Badge>
                )}
                {hasDateRange && !loading && (
                  <Badge 
                    variant={section1Available > 0 ? "secondary" : "destructive"} 
                    className="text-xs"
                  >
                    {section1Available}/9
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="section2" className="relative flex-col sm:flex-row gap-1">
              <span>Sekcja 2 (poz. 13-24)</span>
              <div className="flex items-center gap-1">
                {section2Price !== undefined && section2Price !== null && (
                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                    {section2Price} kr./dzień
                  </Badge>
                )}
                {hasDateRange && !loading && (
                  <Badge 
                    variant={section2Available > 0 ? "secondary" : "destructive"} 
                    className="text-xs"
                  >
                    {section2Available}/12
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Availability status */}
          {hasDateRange && !loading && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Termin: {format(startDate, "d MMMM yyyy", { locale: pl })} - {format(endDate, "d MMMM yyyy", { locale: pl })}
                </span>
              </div>
              {occupiedPositions.length > 0 && (
                <p className="text-xs text-destructive mt-1">
                  Zajęte pozycje: {occupiedPositions.sort((a, b) => a - b).join(", ")}
                </p>
              )}
            </div>
          )}

          <TabsContent value="section1" className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="text-xs text-muted-foreground mb-3 text-center">
                Pierwsza siatka artykułów (pozycje 1-3 zablokowane)
              </div>
              {renderTileGrid(FULL_GRID_1)}
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Szybki wybór (dostępne pozycje 4-12):</div>
              {renderQuickSelect(SECTION_1_POSITIONS)}
            </div>
          </TabsContent>

          <TabsContent value="section2" className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="text-xs text-muted-foreground mb-3 text-center">
                Druga siatka artykułów (pozycje 13-24)
              </div>
              {renderTileGrid(SECTION_2_POSITIONS)}
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Szybki wybór (pozycje 13-24):</div>
              {renderQuickSelect(SECTION_2_POSITIONS)}
            </div>
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs mt-4">
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
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-muted bg-muted/30" />
            <span className="text-muted-foreground">Zablokowany</span>
          </div>
        </div>

        {selectedPosition && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/30 mt-4">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-sm">
              Wybrana pozycja: <strong>Kafelek {selectedPosition}</strong>
              {selectedPosition >= 4 && selectedPosition <= 12 && " (Sekcja 1)"}
              {selectedPosition >= 13 && selectedPosition <= 24 && " (Sekcja 2)"}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          💡 Tip: Sekcja 1 to pierwsza siatka artykułów (lepsza widoczność, wyższa cena). Sekcja 2 to druga siatka (niższa cena).
        </p>
      </CardContent>
    </Card>
  );
}