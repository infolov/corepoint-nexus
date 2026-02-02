import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// Size constraints to ensure ads are visible but not overwhelming
const SIZE_CONSTRAINTS = {
  minHeight: 80, // Minimum height in pixels
  maxHeight: 400, // Maximum height in pixels
  minWidth: 200, // Minimum width in pixels
  maxWidthRatio: 1, // Maximum width as ratio of container (1 = 100%)
};

interface BannerItem {
  id: string;
  campaignId: string;
  imageUrl: string | null;
  text: string | null;
  targetUrl: string | null;
  isLocal: boolean;
}

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

interface ResponsiveAdBannerProps {
  banners: BannerItem[];
  className?: string;
  autoRotateInterval?: number;
  /** Layout variant: 'banner' for full-width, 'tile' for grid placement */
  variant?: "banner" | "tile";
  /** Maximum height override (default: 400px for banner, 300px for tile) */
  maxHeight?: number;
  /** Minimum height override (default: 80px for banner, 120px for tile) */
  minHeight?: number;
}

/**
 * Responsive ad banner that adapts its size to the uploaded image dimensions
 * with constraints to prevent ads from being too small or too large.
 */
export function ResponsiveAdBanner({
  banners,
  className,
  autoRotateInterval = 5000,
  variant = "banner",
  maxHeight: maxHeightProp,
  minHeight: minHeightProp,
}: ResponsiveAdBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasMultipleBanners = banners.length > 1;
  const currentBanner = banners[currentIndex];

  // Default constraints based on variant
  const maxHeight = maxHeightProp ?? (variant === "tile" ? 300 : SIZE_CONSTRAINTS.maxHeight);
  const minHeight = minHeightProp ?? (variant === "tile" ? 120 : SIZE_CONSTRAINTS.minHeight);

  // Observe container width for responsive calculations
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Load image dimensions when banner changes
  useEffect(() => {
    if (!currentBanner?.imageUrl) {
      setImageDimensions(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      });
    };
    img.onerror = () => {
      setImageDimensions(null);
    };
    img.src = currentBanner.imageUrl;
  }, [currentBanner?.imageUrl]);

  // Auto-rotate effect
  useEffect(() => {
    if (!hasMultipleBanners || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [hasMultipleBanners, isPaused, banners.length, autoRotateInterval]);

  // Track impression when banner changes
  useEffect(() => {
    if (!currentBanner) return;

    const trackImpression = async () => {
      try {
        await supabase.rpc("increment_campaign_impression", {
          p_campaign_id: currentBanner.campaignId,
        });
      } catch (error) {
        // Silent fail for impression tracking
      }
    };

    trackImpression();
  }, [currentBanner?.id]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handleClick = useCallback(async () => {
    if (!currentBanner) return;

    try {
      await supabase.rpc("increment_campaign_click", {
        p_campaign_id: currentBanner.campaignId,
      });
    } catch (error) {
      // Silent fail for click tracking
    }

    if (currentBanner.targetUrl) {
      window.open(currentBanner.targetUrl, "_blank", "noopener,noreferrer");
    }
  }, [currentBanner]);

  // Calculate constrained dimensions - prioritize full width on mobile
  const getConstrainedDimensions = useCallback(() => {
    if (!imageDimensions || containerWidth === 0) {
      // Fallback dimensions - always full width
      return {
        height: Math.min(maxHeight, 200),
        width: "100%",
      };
    }

    const { aspectRatio } = imageDimensions;
    const isMobileWidth = containerWidth < 640;
    
    // On mobile, always use full container width
    if (isMobileWidth) {
      let targetHeight = containerWidth / aspectRatio;
      
      // Apply height constraints
      targetHeight = Math.max(targetHeight, minHeight);
      targetHeight = Math.min(targetHeight, maxHeight);
      
      return {
        height: Math.round(targetHeight),
        width: "100%",
      };
    }
    
    // Desktop: existing logic with width constraints
    let targetWidth = Math.min(containerWidth, imageDimensions.width);
    targetWidth = Math.max(targetWidth, SIZE_CONSTRAINTS.minWidth);
    
    // Calculate height based on aspect ratio
    let targetHeight = targetWidth / aspectRatio;
    
    // Apply height constraints
    if (targetHeight > maxHeight) {
      targetHeight = maxHeight;
      targetWidth = targetHeight * aspectRatio;
    }
    
    if (targetHeight < minHeight) {
      targetHeight = minHeight;
      targetWidth = targetHeight * aspectRatio;
    }
    
    // Ensure width doesn't exceed container
    if (targetWidth > containerWidth) {
      targetWidth = containerWidth;
      targetHeight = targetWidth / aspectRatio;
      targetHeight = Math.max(targetHeight, minHeight);
    }
    
    return {
      height: Math.round(targetHeight),
      width: targetWidth >= containerWidth ? "100%" : `${Math.round(targetWidth)}px`,
    };
  }, [imageDimensions, containerWidth, maxHeight, minHeight]);

  if (banners.length === 0) {
    return null;
  }

  const dimensions = getConstrainedDimensions();
  const isTile = variant === "tile";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg w-full",
        isTile ? "bg-card border border-border" : "bg-muted/30",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Content */}
      <div
        className={cn(
          "relative cursor-pointer transition-all duration-300 w-full",
          isTile ? "group" : ""
        )}
        style={{
          height: dimensions.height,
          minHeight: minHeight,
          maxHeight: maxHeight,
        }}
        onClick={handleClick}
      >
        {currentBanner.imageUrl ? (
          <img
            src={currentBanner.imageUrl}
            alt="Reklama"
            className={cn(
              "w-full h-full transition-all duration-300",
              // On mobile use object-cover to fill width, on desktop use object-contain
              containerWidth < 640 ? "object-cover" : "object-contain",
              isTile && "group-hover:scale-[1.02]"
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/10 to-primary/5">
            <span className="text-sm sm:text-base md:text-lg font-medium text-foreground/80 text-center px-4">
              {currentBanner.text || "Reklama"}
            </span>
          </div>
        )}

        {/* Sponsored label */}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-[10px] font-normal"
        >
          {isTile ? "Reklama" : "Sponsorowane"}
        </Badge>

        {/* Local/National indicator */}
        {currentBanner.isLocal && (
          <Badge
            className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm text-[10px] text-primary-foreground"
          >
            Lokalne
          </Badge>
        )}

        {/* External link indicator on hover (tile variant) */}
        {isTile && currentBanner.targetUrl && (
          <div className={cn(
            "absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          )}>
            <ExternalLink className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Navigation - only show if multiple banners */}
      {hasMultipleBanners && (
        <>
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Dots indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  index === currentIndex
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Re-export helper from FeedBannerCarousel for compatibility
export { formatBannersForCarousel } from "./FeedBannerCarousel";
