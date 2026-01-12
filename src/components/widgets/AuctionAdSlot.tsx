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
  | "sponsored-article";   // Artykuł Sponsorowany

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
  
  // Lazy loading hook
  const { ref: lazyRef, hasBeenVisible } = useLazyLoad<HTMLDivElement>({
    rootMargin: lazyRootMargin,
    triggerOnce: true,
    initialVisible: !lazyLoad, // If lazy loading disabled, start visible
  });
  
  // Responsive hooks
  const { width: windowWidth } = useWindowSize();
  const breakpoint = useBreakpoint();

  // Determine effective variant (auto mode picks based on placement)
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
  const { name, icon: Icon, defaultPlacementSlug } = config;
  
  // Use prop placementSlug if provided, otherwise fall back to default from variant config
  const placementSlug = placementSlugProp || defaultPlacementSlug;

  // Build full user location from settings (voivodeship, powiat, city)
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
    stats,
    cacheHit,
    isRevalidating,
  } = useAdAuction({ 
    userLocation,
    placementSlug 
  });

  // Run auction when component becomes visible (lazy loading) or dependencies change
  useEffect(() => {
    // Only run auction when visible (for lazy loading) and data is ready
    if (!loading && hasBeenVisible) {
      const result = getNextAd(placementSlug);
      setAuctionResult(result);
      setHasTrackedImpression(false);
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

  // Container styles with CLS prevention and smooth transitions
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

  // Lazy loading placeholder (shown before content enters viewport)
  const LazyPlaceholder = () => (
    <div
      className={cn(
        "relative bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg overflow-hidden flex items-center justify-center border border-border/30 animate-pulse",
        className
      )}
      style={containerStyles}
    >
      <div className="text-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-[10px] text-muted-foreground/40">
          Ładowanie reklamy...
        </p>
      </div>
      <span className="absolute top-1 right-2 text-[10px] text-muted-foreground/30">
        AD
      </span>
      {showDev && (
        <div className="absolute top-1 left-1 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-yellow-600">
          <Maximize2 className="h-2.5 w-2.5" />
          <span>LAZY: {responsiveSize.width}×{responsiveSize.height}</span>
        </div>
      )}
    </div>
  );

  // Show lazy placeholder if not yet visible
  if (lazyLoad && !hasBeenVisible) {
    return (
      <div ref={lazyRef}>
        <LazyPlaceholder />
      </div>
    );
  }

  // Show active campaign from auction
  if (auctionResult) {
    const { ad, finalScore, debugInfo } = auctionResult;

    return (
      <div ref={lazyRef} className="relative">
        <div
          className={cn(
            "relative rounded-lg overflow-hidden cursor-pointer group transition-opacity duration-300",
            isTransitioning ? "opacity-80" : "opacity-100",
            className
          )}
          style={containerStyles}
          onClick={handleClick}
        >
          {ad.contentUrl ? (
            <img
              src={ad.contentUrl}
              alt={ad.name}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
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
          
          {/* Dev mode breakpoint badge */}
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
            {lazyLoad && <span className="text-purple-400">⚡Lazy</span>}
            {/* Cache info */}
            <span className={cn(
              "px-1 rounded",
              cacheHit ? "bg-emerald-600" : "bg-orange-600"
            )}>
              {cacheHit ? "📦 Cache" : "🌐 Fresh"}
            </span>
            {isRevalidating && <span className="text-yellow-400 animate-pulse">↻ Revalidating</span>}
          </div>
        )}
      </div>
    );
  }

  // Fallback placeholder when no active campaign
  return (
    <div ref={lazyRef} className="relative">
      <div
        className={cn(
          "relative bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden flex items-center justify-center border border-border/50 transition-opacity duration-300",
          isTransitioning ? "opacity-80" : "opacity-100",
          className
        )}
        style={containerStyles}
      >
        <div className="text-center p-4">
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider mb-1">
            <Icon className="h-3 w-3" />
            <span>{name}</span>
          </div>
          <p className="text-sm text-muted-foreground/70">
            Twoja reklama może być tutaj
          </p>
          {auto && (
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              {responsiveSize.label}
            </p>
          )}
        </div>
        <span className="absolute top-1 right-2 text-[10px] text-muted-foreground/50">
          AD
        </span>
        
        {/* Dev mode breakpoint badge */}
        {showDev && <DevBadge />}
      </div>

      {/* Dev Overlay - Stats */}
      {showDev && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] p-1.5 font-mono flex items-center gap-2 flex-wrap">
          <Bug className="h-3 w-3 text-yellow-400 flex-shrink-0" />
          <span>No ads available</span>
          <span>Pool: {stats.total}</span>
          <span className="text-blue-400">N:{stats.national}</span>
          <span className="text-green-400">L:{stats.local}</span>
          <span className="text-cyan-400">Size: {responsiveSize.label}</span>
          <span className="text-purple-400">minH: {minHeight}px</span>
          {lazyLoad && <span className="text-purple-400">⚡Lazy</span>}
          {/* Cache info */}
          <span className={cn(
            "px-1 rounded",
            cacheHit ? "bg-emerald-600" : "bg-orange-600"
          )}>
            {cacheHit ? "📦 Cache" : "🌐 Fresh"}
          </span>
          {isRevalidating && <span className="text-yellow-400 animate-pulse">↻ Revalidating</span>}
        </div>
      )}
    </div>
  );
}
