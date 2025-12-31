import { useState } from "react";
import { cn } from "@/lib/utils";

interface PolandMapSelectorProps {
  selectedRegion: string | null;
  onSelect: (region: string) => void;
}

// Voivodeship data with display names
const VOIVODESHIPS = [
  { slug: "dolnoslaskie", name: "Dolnośląskie" },
  { slug: "kujawsko-pomorskie", name: "Kujawsko-Pomorskie" },
  { slug: "lodzkie", name: "Łódzkie" },
  { slug: "lubelskie", name: "Lubelskie" },
  { slug: "lubuskie", name: "Lubuskie" },
  { slug: "malopolskie", name: "Małopolskie" },
  { slug: "mazowieckie", name: "Mazowieckie" },
  { slug: "opolskie", name: "Opolskie" },
  { slug: "podkarpackie", name: "Podkarpackie" },
  { slug: "podlaskie", name: "Podlaskie" },
  { slug: "pomorskie", name: "Pomorskie" },
  { slug: "slaskie", name: "Śląskie" },
  { slug: "swietokrzyskie", name: "Świętokrzyskie" },
  { slug: "warminsko-mazurskie", name: "Warmińsko-Mazurskie" },
  { slug: "wielkopolskie", name: "Wielkopolskie" },
  { slug: "zachodniopomorskie", name: "Zachodniopomorskie" },
];

// SVG paths for Polish voivodeships (simplified for visual representation)
const VOIVODESHIP_PATHS: Record<string, string> = {
  "zachodniopomorskie": "M 80 20 L 140 15 L 160 50 L 145 90 L 100 110 L 60 85 L 50 45 Z",
  "pomorskie": "M 145 10 L 220 5 L 240 45 L 225 85 L 180 95 L 145 90 L 160 50 Z",
  "warminsko-mazurskie": "M 225 5 L 310 10 L 320 70 L 295 110 L 240 100 L 225 85 L 240 45 Z",
  "podlaskie": "M 295 110 L 320 70 L 350 85 L 355 150 L 330 195 L 290 180 L 280 135 Z",
  "lubuskie": "M 40 95 L 100 110 L 105 160 L 80 200 L 35 185 L 25 130 Z",
  "wielkopolskie": "M 100 110 L 145 90 L 180 95 L 195 140 L 175 195 L 115 210 L 80 200 L 105 160 Z",
  "kujawsko-pomorskie": "M 145 90 L 225 85 L 240 100 L 235 150 L 195 170 L 175 150 L 180 95 Z",
  "mazowieckie": "M 235 150 L 280 135 L 290 180 L 285 240 L 240 270 L 200 250 L 195 200 L 210 170 Z",
  "lodzkie": "M 175 150 L 195 170 L 200 250 L 165 275 L 130 250 L 125 200 L 150 175 Z",
  "lubelskie": "M 285 240 L 330 195 L 355 220 L 345 300 L 295 330 L 265 295 L 270 250 Z",
  "dolnoslaskie": "M 35 185 L 80 200 L 115 210 L 120 265 L 85 305 L 40 290 L 25 235 Z",
  "opolskie": "M 115 210 L 150 205 L 165 245 L 150 290 L 110 300 L 85 275 L 95 230 Z",
  "slaskie": "M 150 205 L 175 195 L 200 250 L 195 295 L 155 315 L 130 300 L 150 260 Z",
  "swietokrzyskie": "M 200 250 L 240 270 L 265 295 L 250 340 L 205 345 L 185 310 L 195 275 Z",
  "malopolskie": "M 155 315 L 195 295 L 220 340 L 245 370 L 195 395 L 145 375 L 140 335 Z",
  "podkarpackie": "M 250 340 L 295 330 L 335 355 L 330 405 L 280 420 L 245 395 L 245 370 Z",
};

export function PolandMapSelector({ selectedRegion, onSelect }: PolandMapSelectorProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getRegionName = (slug: string) => {
    return VOIVODESHIPS.find(v => v.slug === slug)?.name || slug;
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-muted/30 rounded-lg p-4">
        <svg
          viewBox="0 0 380 440"
          className="w-full max-w-md mx-auto h-auto"
          style={{ maxHeight: "400px" }}
        >
          {Object.entries(VOIVODESHIP_PATHS).map(([slug, path]) => {
            const isSelected = selectedRegion === slug;
            const isHovered = hoveredRegion === slug;

            return (
              <path
                key={slug}
                d={path}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  "stroke-border stroke-2",
                  isSelected
                    ? "fill-primary"
                    : isHovered
                    ? "fill-primary/50"
                    : "fill-muted hover:fill-muted-foreground/20"
                )}
                onClick={() => onSelect(slug)}
                onMouseEnter={() => setHoveredRegion(slug)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredRegion && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-3 py-1.5 rounded-md shadow-md text-sm font-medium border">
            {getRegionName(hoveredRegion)}
          </div>
        )}
      </div>

      {/* Selected region display */}
      {selectedRegion && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Wybrany region:</p>
          <p className="font-semibold text-primary">{getRegionName(selectedRegion)}</p>
        </div>
      )}

      {/* Region list for accessibility */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {VOIVODESHIPS.map((v) => (
          <button
            key={v.slug}
            type="button"
            onClick={() => onSelect(v.slug)}
            className={cn(
              "px-2 py-1.5 rounded border transition-colors text-left truncate",
              selectedRegion === v.slug
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            )}
          >
            {v.name}
          </button>
        ))}
      </div>
    </div>
  );
}
