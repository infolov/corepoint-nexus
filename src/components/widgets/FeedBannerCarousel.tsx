import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface BannerItem {
  id: string;
  campaignId: string;
  imageUrl: string | null;
  text: string | null;
  targetUrl: string | null;
  isLocal: boolean;
}

interface FeedBannerCarouselProps {
  banners: BannerItem[];
  className?: string;
  autoRotateInterval?: number;
}

/**
 * Carousel component for displaying 1-4 banners in the feed
 * - Auto-rotates if more than 1 banner
 * - Disables navigation and auto-play if only 1 banner
 * - Tracks impressions and clicks
 */
export function FeedBannerCarousel({
  banners,
  className,
  autoRotateInterval = 5000,
}: FeedBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const hasMultipleBanners = banners.length > 1;
  const currentBanner = banners[currentIndex];

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
        console.error("Error tracking impression:", error);
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
      console.error("Error tracking click:", error);
    }

    if (currentBanner.targetUrl) {
      window.open(currentBanner.targetUrl, "_blank", "noopener,noreferrer");
    }
  }, [currentBanner]);

  if (banners.length === 0) {
    return null;
  }

  // Load image dimensions for responsive sizing
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Size constraints
  const MIN_HEIGHT = 80;
  const MAX_HEIGHT = 350;

  // Observe container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Load image dimensions
  useEffect(() => {
    if (!currentBanner?.imageUrl) {
      setImageDimensions(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = currentBanner.imageUrl;
  }, [currentBanner?.imageUrl]);

  // Calculate constrained height
  const getConstrainedHeight = () => {
    if (!imageDimensions || containerWidth === 0) {
      return 150; // Default fallback
    }
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    let height = containerWidth / aspectRatio;
    height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height));
    return Math.round(height);
  };

  const bannerHeight = getConstrainedHeight();

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-muted/30",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Content */}
      <div
        className="relative cursor-pointer transition-all duration-300"
        style={{
          height: bannerHeight,
          minHeight: MIN_HEIGHT,
          maxHeight: MAX_HEIGHT,
        }}
        onClick={handleClick}
      >
        {currentBanner.imageUrl ? (
          <img
            src={currentBanner.imageUrl}
            alt="Reklama"
            className="w-full h-full object-contain transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/10 to-primary/5">
            <span className="text-sm sm:text-base md:text-lg font-medium text-foreground/80 text-center px-4">
              {currentBanner.text || "Reklama"}
            </span>
          </div>
        )}

        {/* Sponsored label */}
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-background/80 backdrop-blur-sm rounded text-[10px] text-muted-foreground">
          Sponsorowane
        </div>

        {/* Local/National indicator */}
        {currentBanner.isLocal && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/80 backdrop-blur-sm rounded text-[10px] text-primary-foreground">
            Lokalne
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

// Helper to format banners from carousel groups
export function formatBannersForCarousel(
  banners: Array<{
    id: string;
    campaign_id: string | null;
    local_campaign_id: string | null;
    campaign?: {
      id: string;
      content_url: string | null;
      content_text: string | null;
      target_url: string | null;
    } | null;
    local_campaign?: {
      id: string;
      content_url: string | null;
      content_text: string | null;
      target_url: string;
    } | null;
  }>
): BannerItem[] {
  return banners
    .map((banner) => {
      if (banner.campaign) {
        return {
          id: banner.id,
          campaignId: banner.campaign.id,
          imageUrl: banner.campaign.content_url,
          text: banner.campaign.content_text,
          targetUrl: banner.campaign.target_url,
          isLocal: false,
        };
      }
      if (banner.local_campaign) {
        return {
          id: banner.id,
          campaignId: banner.local_campaign.id,
          imageUrl: banner.local_campaign.content_url,
          text: banner.local_campaign.content_text,
          targetUrl: banner.local_campaign.target_url,
          isLocal: true,
        };
      }
      return null;
    })
    .filter((b): b is BannerItem => b !== null);
}
