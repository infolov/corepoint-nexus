import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Monitor, Square, Smartphone, Bug } from "lucide-react";
import { useAdAuction } from "@/hooks/use-ad-auction";
import { useUserSettings } from "@/hooks/use-user-settings";
import { AuctionResult } from "@/lib/ad-auction-engine";

interface AuctionAdSlotProps {
  variant?: "horizontal" | "square" | "vertical";
  className?: string;
  slotIndex?: number;
  showDevOverlay?: boolean;
}

const variantConfig: Record<string, { 
  name: string; 
  icon: typeof Monitor; 
  placementSlug: string;
  aspectClass: string;
}> = {
  horizontal: { 
    name: "Baner - Strona Główna", 
    icon: Monitor, 
    placementSlug: "top-banner",
    aspectClass: "aspect-[728/90] max-h-[90px]"
  },
  square: { 
    name: "Baner boczny", 
    icon: Square, 
    placementSlug: "sidebar-square",
    aspectClass: "aspect-square"
  },
  vertical: { 
    name: "Baner pionowy", 
    icon: Monitor, 
    placementSlug: "mobile-banner",
    aspectClass: "aspect-[300/600]"
  },
};

// Check if dev mode (localhost or dev flag)
const isDevMode = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         localStorage.getItem('devMode') === 'true';
};

export function AuctionAdSlot({ 
  variant = "horizontal", 
  className,
  slotIndex = 1,
  showDevOverlay = true 
}: AuctionAdSlotProps) {
  const { settings } = useUserSettings();
  const [auctionResult, setAuctionResult] = useState<AuctionResult | null>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  const { name, icon: Icon, placementSlug, aspectClass } = variantConfig[variant];

  // Build user location from settings
  const userLocation = {
    voivodeship: settings.voivodeship || undefined,
    // Additional fields can be added when user_site_settings is expanded
  };

  const { 
    getNextAd, 
    trackImpression, 
    trackClick, 
    loading,
    stats 
  } = useAdAuction({ 
    userLocation,
    placementSlug 
  });

  // Run auction when component mounts or dependencies change
  useEffect(() => {
    if (!loading) {
      const result = getNextAd(placementSlug);
      setAuctionResult(result);
      setHasTrackedImpression(false);
    }
  }, [loading, placementSlug]);

  // Track impression when ad becomes visible
  useEffect(() => {
    if (auctionResult && !hasTrackedImpression) {
      trackImpression(auctionResult.ad.id);
      setHasTrackedImpression(true);
    }
  }, [auctionResult, hasTrackedImpression, trackImpression]);

  const handleClick = () => {
    if (auctionResult) {
      trackClick(auctionResult.ad.id);
      if (auctionResult.ad.targetUrl) {
        window.open(auctionResult.ad.targetUrl, "_blank");
      }
    }
  };

  const showDev = showDevOverlay && isDevMode();

  // Show active campaign from auction
  if (auctionResult) {
    const { ad, finalScore, debugInfo } = auctionResult;

    return (
      <div className="relative">
        <div
          className={cn(
            "relative rounded-lg overflow-hidden cursor-pointer group",
            aspectClass,
            className
          )}
          onClick={handleClick}
        >
          {ad.contentUrl ? (
            <img
              src={ad.contentUrl}
              alt={ad.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <p className="text-sm font-medium text-center p-4">
                {ad.contentText || ad.name}
              </p>
            </div>
          )}
          <span className="absolute top-1 right-2 text-[10px] text-white/70 bg-black/30 px-1 rounded">
            AD
          </span>
        </div>

        {/* Dev Overlay */}
        {showDev && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] p-1.5 font-mono flex items-center gap-2">
            <Bug className="h-3 w-3 text-yellow-400" />
            <span className={cn(
              "px-1 rounded",
              debugInfo.type === 'national' ? "bg-blue-600" : "bg-green-600"
            )}>
              {debugInfo.type.toUpperCase()}
            </span>
            <span>Score: {finalScore.toFixed(2)}</span>
            <span>Bid: {debugInfo.bidPrice.toFixed(2)}</span>
            {debugInfo.targetingBonus > 0 && (
              <span className="text-green-400">+{(debugInfo.targetingBonus / debugInfo.baseScore * 100).toFixed(0)}% local</span>
            )}
            {debugInfo.frequencyPenalty > 0 && (
              <span className="text-red-400">-{(debugInfo.frequencyPenalty / (debugInfo.baseScore + debugInfo.targetingBonus) * 100).toFixed(0)}% freq</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fallback placeholder when no active campaign
  return (
    <div className="relative">
      <div
        className={cn(
          "relative bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden flex items-center justify-center border border-border/50",
          aspectClass,
          className
        )}
      >
        <div className="text-center p-4">
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider mb-1">
            <Icon className="h-3 w-3" />
            <span>{name}</span>
          </div>
          <p className="text-sm text-muted-foreground/70">
            Twoja reklama może być tutaj
          </p>
        </div>
        <span className="absolute top-1 right-2 text-[10px] text-muted-foreground/50">
          AD
        </span>
      </div>

      {/* Dev Overlay - Stats */}
      {showDev && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] p-1.5 font-mono flex items-center gap-2">
          <Bug className="h-3 w-3 text-yellow-400" />
          <span>No ads available</span>
          <span>Pool: {stats.total}</span>
          <span className="text-blue-400">N:{stats.national}</span>
          <span className="text-green-400">L:{stats.local}</span>
        </div>
      )}
    </div>
  );
}
