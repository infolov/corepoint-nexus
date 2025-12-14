import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocalAds } from "@/hooks/use-local-ads";
import { useUserSettings } from "@/hooks/use-user-settings";
import { MapPin, ExternalLink } from "lucide-react";

interface LocalAdBannerProps {
  placementType?: "sponsored_tile" | "regional_banner" | "local_sidebar";
  variant?: "horizontal" | "square" | "tile";
  className?: string;
  showFallback?: boolean;
}

export function LocalAdBanner({ 
  placementType = "regional_banner", 
  variant = "horizontal",
  className,
  showFallback = true 
}: LocalAdBannerProps) {
  const { getRandomAd, trackImpression, trackClick, loading } = useLocalAds();
  const { settings } = useUserSettings();
  const [currentAd, setCurrentAd] = useState<ReturnType<typeof getRandomAd>>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    if (!loading) {
      const ad = getRandomAd(placementType);
      setCurrentAd(ad);
      setHasTrackedImpression(false);
    }
  }, [loading, placementType, getRandomAd]);

  // Track impression when ad becomes visible
  useEffect(() => {
    if (currentAd && !hasTrackedImpression) {
      trackImpression(currentAd.id);
      setHasTrackedImpression(true);
    }
  }, [currentAd, hasTrackedImpression, trackImpression]);

  const handleClick = () => {
    if (currentAd) {
      trackClick(currentAd.id);
      window.open(currentAd.target_url, "_blank", "noopener,noreferrer");
    }
  };

  const variants = {
    horizontal: "aspect-[728/90] max-h-[90px]",
    square: "aspect-square max-w-[300px]",
    tile: "aspect-[4/3] max-h-[250px]",
  };

  // Show local ad if available
  if (currentAd) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "relative bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg overflow-hidden border border-primary/20 cursor-pointer group transition-all hover:border-primary/40 hover:shadow-lg",
          variants[variant],
          className
        )}
      >
        {currentAd.content_url ? (
          <img 
            src={currentAd.content_url} 
            alt={currentAd.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <p className="text-foreground font-medium text-sm sm:text-base line-clamp-2">
              {currentAd.content_text || currentAd.name}
            </p>
          </div>
        )}
        
        {/* Regional badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-full text-[10px] font-medium">
          <MapPin className="h-2.5 w-2.5" />
          <span>{settings.voivodeship || "Twój region"}</span>
        </div>

        {/* Ad label */}
        <span className="absolute top-1 right-2 text-[10px] text-foreground/50 bg-background/80 px-1 rounded">
          Reklama lokalna
        </span>

        {/* CTA overlay on hover */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="flex items-center gap-1 text-xs font-medium text-foreground bg-background/90 px-3 py-1.5 rounded-full shadow-sm">
            <ExternalLink className="h-3 w-3" />
            Dowiedz się więcej
          </span>
        </div>
      </div>
    );
  }

  // Fallback placeholder
  if (showFallback) {
    return (
      <div
        className={cn(
          "relative bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden flex items-center justify-center border border-border/50",
          variants[variant],
          className
        )}
      >
        <div className="text-center p-4">
          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
            <MapPin className="h-3 w-3" />
            <span className="uppercase tracking-wider">Reklama regionalna</span>
          </div>
          <p className="text-sm text-muted-foreground/70">
            {settings.voivodeship 
              ? `Reklama dla ${settings.voivodeship}` 
              : "Ustaw lokalizację, aby zobaczyć lokalne reklamy"}
          </p>
        </div>
        <span className="absolute top-1 right-2 text-[10px] text-muted-foreground/50">
          AD
        </span>
      </div>
    );
  }

  return null;
}
