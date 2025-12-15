import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AdBanner } from "./AdBanner";
import { LocalAdBanner } from "./LocalAdBanner";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdCarouselProps {
  className?: string;
  autoRotateInterval?: number; // in ms
}

export function AdCarousel({ 
  className,
  autoRotateInterval = 5000 
}: AdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Ad types to rotate through
  const adTypes = [
    { type: "local", placementType: "regional_banner" as const },
    { type: "regular", variant: "horizontal" as const },
    { type: "local", placementType: "sponsored_tile" as const },
    { type: "regular", variant: "horizontal" as const },
  ];

  // Auto-rotate ads
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % adTypes.length);
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [autoRotateInterval, adTypes.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + adTypes.length) % adTypes.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % adTypes.length);
  };

  const currentAd = adTypes[currentIndex];

  return (
    <div className={cn("relative group", className)}>
      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        aria-label="Poprzednia reklama"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        aria-label="Następna reklama"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Ad Content */}
      <div className="overflow-hidden rounded-lg">
        {currentAd.type === "local" ? (
          <LocalAdBanner 
            placementType={currentAd.placementType} 
            variant="horizontal" 
            className="w-full transition-opacity duration-300" 
          />
        ) : (
          <AdBanner 
            variant={currentAd.variant} 
            className="w-full transition-opacity duration-300" 
          />
        )}
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {adTypes.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex 
                ? "bg-primary w-4" 
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Reklama ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
