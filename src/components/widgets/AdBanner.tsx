import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Monitor, Square, Smartphone, Maximize2 } from "lucide-react";
import { useAdCampaigns } from "@/hooks/use-ad-campaigns";
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

interface AdBannerProps {
  variant?: AdVariant;
  className?: string;
  /** Placement context for responsive sizing */
  placement?: AdPlacement;
  /** When true, automatically selects the best ad size for the current viewport */
  auto?: boolean;
}

const variantNames: Record<string, { name: string; icon: typeof Monitor; placementSlug: string }> = {
  horizontal: { name: "Baner - Strona Główna", icon: Monitor, placementSlug: "top-banner" },
  square: { name: "Baner boczny", icon: Square, placementSlug: "sidebar-square" },
  vertical: { name: "Baner pionowy", icon: Smartphone, placementSlug: "mobile-banner" },
  auto: { name: "Baner responsywny", icon: Maximize2, placementSlug: "top-banner" },
};

// Check if dev mode
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

export function AdBanner({ 
  variant = "horizontal", 
  className,
  placement = "main",
  auto = false,
}: AdBannerProps) {
  const { getRandomCampaign, trackImpression, trackClick, loading } = useAdCampaigns();
  const [currentCampaign, setCurrentCampaign] = useState<ReturnType<typeof getRandomCampaign>>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [responsiveSize.width, responsiveSize.height]);

  const config = variantNames[effectiveVariant] || variantNames.horizontal;
  const { name, icon: Icon, placementSlug } = config;

  useEffect(() => {
    if (!loading) {
      const campaign = getRandomCampaign(placementSlug);
      setCurrentCampaign(campaign);
      setHasTrackedImpression(false);
    }
  }, [loading, placementSlug, getRandomCampaign]);

  // Track impression when ad becomes visible
  useEffect(() => {
    if (currentCampaign && !hasTrackedImpression) {
      trackImpression(currentCampaign.id);
      setHasTrackedImpression(true);
    }
  }, [currentCampaign, hasTrackedImpression, trackImpression]);

  const handleClick = () => {
    if (currentCampaign) {
      trackClick(currentCampaign.id);
      if (currentCampaign.target_url) {
        window.open(currentCampaign.target_url, "_blank");
      }
    }
  };

  const showDev = isDevMode();
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
    </div>
  );

  // Show active campaign if available
  if (currentCampaign) {
    return (
      <div
        className={cn(
          "relative rounded-lg overflow-hidden cursor-pointer group transition-opacity duration-300",
          isTransitioning ? "opacity-80" : "opacity-100",
          className
        )}
        style={containerStyles}
        onClick={handleClick}
      >
        {currentCampaign.content_url ? (
          <img
            src={currentCampaign.content_url}
            alt={currentCampaign.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <p className="text-sm font-medium text-center p-4">
              {currentCampaign.content_text || currentCampaign.name}
            </p>
          </div>
        )}
        <span className="absolute top-1 right-2 text-[10px] text-white/70 bg-black/30 px-1 rounded">
          AD
        </span>
        {showDev && <DevBadge />}
      </div>
    );
  }

  // Fallback placeholder when no active campaign
  return (
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
      {showDev && <DevBadge />}
    </div>
  );
}
