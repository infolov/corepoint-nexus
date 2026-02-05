import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Monitor, Square, Smartphone, Bug, Maximize2, Loader2 } from "lucide-react";
import { useAdAuction } from "@/hooks/use-ad-auction";
import { useUserSettings } from "@/hooks/use-user-settings";
import { AuctionResult } from "@/lib/ad-auction-engine";
import { useLazyLoad } from "@/hooks/use-lazy-load";
import { 
  useWindowSize, 
  useBreakpoint, 
  getBestAdSize, 
  getMinHeightForBreakpoint,
  getAspectRatio,
  type AdVariant,
  type AdPlacement,
  type ResponsiveAdSize,
  type Breakpoint
} from "@/hooks/use-window-size";

// Available placement slugs in the database
export type AdPlacementSlug = 
  | "top-banner"           // Baner Górny (Strona Główna)
  | "article-top"          // Baner Górny (Artykuł)
  | "article-middle"       // Baner Środkowy (Artykuł)
  | "article-bottom"       // Baner Dolny (Artykuł)
  | "feed-tile"            // Kafelek w Feedzie
  | "feed-carousel"        // Karuzela w Feedzie
  | "footer"               // Stopka
  | "sponsored-article"    // Artykuł Sponsorowany
  // Category-specific top banners
  | "category-top-wiadomosci"
  | "category-top-swiat"
  | "category-top-biznes"
  | "category-top-finanse"
  | "category-top-prawo"
  | "category-top-tech-nauka"
  | "category-top-motoryzacja"
  | "category-top-sport"
  | "category-top-kultura"
  | "category-top-lifestyle";

interface AuctionAdSlotProps {
  variant?: AdVariant;
  className?: string;
  slotIndex?: number;
  showDevOverlay?: boolean;
  /** Placement context for responsive sizing */
  placement?: AdPlacement;
  /** 
   * Direct placement slug override - use this to specify exact placement from database.
   * When provided, overrides the default mapping from variant.
   */
  placementSlug?: AdPlacementSlug;
  /** When true, automatically selects the best ad size for the current viewport */
  auto?: boolean;
  /** Enable lazy loading - only load ad when near viewport */
  lazyLoad?: boolean;
  /** Root margin for lazy loading trigger (default: 200px) */
  lazyRootMargin?: string;
}

// Visual variant configuration (for display purposes only)
const variantConfig: Record<string, { 
  name: string; 
  icon: typeof Monitor; 
  defaultPlacementSlug: AdPlacementSlug;
}> = {
  horizontal: { 
    name: "Baner poziomy", 
    icon: Monitor, 
    defaultPlacementSlug: "top-banner",
  },
  square: { 
    name: "Baner boczny", 
    icon: Square, 
    defaultPlacementSlug: "feed-tile",
  },
  vertical: { 
    name: "Baner pionowy", 
    icon: Smartphone, 
    defaultPlacementSlug: "article-middle",
  },
  auto: {
    name: "Baner responsywny",
    icon: Maximize2,
    defaultPlacementSlug: "top-banner",
  },
};

// Check if dev mode (localhost or dev flag)
const isDevMode = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         localStorage.getItem('devMode') === 'true';
};

// Breakpoint color for dev badge
const breakpointColors: Record<Breakpoint, string> = {
  mobile: "bg-orange-500",
  tablet: "bg-blue-500", 
  desktop: "bg-green-500",
};

const breakpointLabels: Record<Breakpoint, string> = {
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
};

export function AuctionAdSlot({ 
  variant = "horizontal", 
  className,
  slotIndex = 1,
  showDevOverlay = true,
  placement = "main",
  placementSlug: placementSlugProp,
  auto = false,
  lazyLoad = true,
  lazyRootMargin = "200px",
}: AuctionAdSlotProps) {
  const { settings } = useUserSettings();
  const [auctionResult, setAuctionResult] = useState<AuctionResult | null>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  // Lazy loading hook
  const { ref: lazyRef, hasBeenVisible } = useLazyLoad<HTMLDivElement>({
    rootMargin: lazyRootMargin,
    triggerOnce: true,
    initialVisible: !lazyLoad,
  });
  
  // Responsive hooks
  const { width: windowWidth } = useWindowSize();
  const breakpoint = useBreakpoint();

  // Determine effective variant
  const effectiveVariant: AdVariant = auto ? "auto" : variant;

  // Calculate responsive ad size
  const responsiveSize: ResponsiveAdSize = useMemo(() => {
    return getBestAdSize(windowWidth, {
      variant: effectiveVariant,
      placement,
    });
  }, [windowWidth, effectiveVariant, placement]);

  // Get min-height to prevent CLS
  const minHeight = useMemo(() => {
    return getMinHeightForBreakpoint(breakpoint, placement);
  }, [breakpoint, placement]);

  // Handle smooth transition on size change
  const prevSizeRef = useMemo(() => responsiveSize, []);
  useEffect(() => {
    if (prevSizeRef.width !== responsiveSize.width || prevSizeRef.height !== responsiveSize.height) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      return () => clearTimeout(timer);
    }
  }, [responsiveSize, prevSizeRef]);

  const config = variantConfig[effectiveVariant] || variantConfig.horizontal;
  const { defaultPlacementSlug } = config;
  
  const placementSlug = placementSlugProp || defaultPlacementSlug;

  // Build full user location from settings
  const userLocation = {
    voivodeship: settings.voivodeship || undefined,
    powiat: settings.county || undefined,
    gmina: settings.locality || undefined,
    city: settings.city || undefined,
  };

  const { 
    getNextAd, 
    trackImpression, 
    trackClick, 
    loading,
    cacheHit,
    isRevalidating,
  } = useAdAuction({ 
    userLocation,
    placementSlug 
  });

  // Run auction when component becomes visible
  useEffect(() => {
    if (!loading && hasBeenVisible) {
      const result = getNextAd(placementSlug);
      setAuctionResult(result);
      setHasTrackedImpression(false);
      setHasAttemptedLoad(true);
    }
  }, [loading, placementSlug, hasBeenVisible]);

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

  // Dynamic aspect ratio based on responsive size
  const aspectRatio = getAspectRatio(responsiveSize);

  // Container styles with CLS prevention
  const containerStyles: React.CSSProperties = {
    minHeight: `${minHeight}px`,
    aspectRatio,
  };

  // Dev mode badge component
  const DevBadge = () => (
    <div className={cn(
      "absolute top-1 left-1 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white",
      breakpointColors[breakpoint],
      "transition-opacity duration-300",
      isTransitioning ? "opacity-50" : "opacity-100"
    )}>
      <Maximize2 className="h-2.5 w-2.5" />
      <span>{breakpointLabels[breakpoint]}: {responsiveSize.width}×{responsiveSize.height}</span>
      {lazyLoad && (
        <span className={cn(
          "ml-1 px-1 rounded text-[8px]",
          hasBeenVisible ? "bg-green-600" : "bg-yellow-600"
        )}>
          {hasBeenVisible ? "⚡" : "💤"}
        </span>
      )}
    </div>
  );

  // CRITICAL: If lazy loading is enabled and we haven't been visible yet,
  // render an invisible placeholder for the IntersectionObserver
  if (lazyLoad && !hasBeenVisible) {
    return <div ref={lazyRef} className="h-0 w-full" aria-hidden="true" />;
  }

  // CRITICAL: If we've attempted to load but have no valid ad result,
  // or if the ad has no content (no image/text), hide completely
  if (hasAttemptedLoad && !loading) {
    const hasValidAd = auctionResult && 
      (auctionResult.ad.contentUrl || auctionResult.ad.contentText);
    
    if (!hasValidAd) {
      // In dev mode, show a minimal debug indicator (collapsed)
      if (showDev) {
        return (
          <div ref={lazyRef} className="relative">
            <div 
              className="h-6 bg-black/80 text-white text-[9px] px-2 font-mono flex items-center gap-2 rounded opacity-50 hover:opacity-100 transition-opacity cursor-help"
              title="Ad slot hidden - no valid ad available"
            >
              <Bug className="h-3 w-3 text-yellow-400" />
              <span>Empty slot: {placementSlug}</span>
              <span className={cn(
                "px-1 rounded",
                cacheHit ? "bg-emerald-600" : "bg-orange-600"
              )}>
                {cacheHit ? "📦" : "🌐"}
              </span>
            </div>
          </div>
        );
      }
      
      // Production: completely hidden, no space taken
      return null;
    }
  }

  // Still loading - show nothing to prevent CLS
  if (loading || !hasAttemptedLoad) {
    return <div ref={lazyRef} className="h-0 w-full" aria-hidden="true" />;
  }

  // Show active campaign from auction
  if (auctionResult) {
    const { ad, finalScore, debugInfo } = auctionResult;

    // Double-check ad has displayable content
    if (!ad.contentUrl && !ad.contentText) {
      return null;
    }

    return (
      <div ref={lazyRef} className="relative">
        <div
          className={cn(
            "relative rounded-lg overflow-hidden cursor-pointer group transition-opacity duration-300",
            isTransitioning ? "opacity-80" : "opacity-100",
            className
          )}
          style={{
            ...containerStyles,
            minHeight: 80,
            maxHeight: 400,
          }}
          onClick={handleClick}
        >
          {ad.contentUrl ? (
            <img
              src={ad.contentUrl}
              alt={ad.name}
              className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              loading="lazy"
              onError={(e) => {
                // Hide the entire ad if image fails to load
                const container = e.currentTarget.closest('[data-ad-container]');
                if (container) {
                  (container as HTMLElement).style.display = 'none';
                }
              }}
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
          
          {showDev && <DevBadge />}
        </div>

        {/* Dev Overlay */}
        {showDev && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] p-1.5 font-mono flex items-center gap-2 flex-wrap">
            <Bug className="h-3 w-3 text-yellow-400 flex-shrink-0" />
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
            <span className="text-cyan-400">Size: {responsiveSize.label}</span>
            <span className={cn(
              "px-1 rounded",
              cacheHit ? "bg-emerald-600" : "bg-orange-600"
            )}>
              {cacheHit ? "📦 Cache" : "🌐 Fresh"}
            </span>
            {isRevalidating && <span className="text-yellow-400 animate-pulse">↻</span>}
          </div>
        )}
      </div>
    );
  }

  // Fallback: no ad available - hide completely
  return null;
}
