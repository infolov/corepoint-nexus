import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Size constraints for tile ads
const TILE_CONSTRAINTS = {
  minHeight: 120,
  maxHeight: 320,
  defaultHeight: 200,
};

interface FeedTileAdCardProps {
  id: string;
  contentUrl: string | null;
  targetUrl: string | null;
  name?: string;
  onImpression?: (adId: string) => void;
  onClick?: (adId: string) => void;
  className?: string;
}

/**
 * Ad card component that adapts to uploaded image dimensions
 * with min/max constraints to prevent too small or too large ads
 */
export function FeedTileAdCard({
  id,
  contentUrl,
  targetUrl,
  name,
  onImpression,
  onClick,
  className,
}: FeedTileAdCardProps) {
  const [impressionTracked, setImpressionTracked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Observe container width for responsive sizing
  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Load image dimensions
  useEffect(() => {
    if (!contentUrl || contentUrl.match(/\.(mp4|webm)$/i)) {
      setImageDimensions(null);
      return;
    }
    setImageLoadFailed(false);
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setImageLoadFailed(true);
    };
    img.src = contentUrl;
  }, [contentUrl]);

  // Track impression when card is visible
  useEffect(() => {
    if (impressionTracked || !onImpression) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionTracked) {
            onImpression(id);
            setImpressionTracked(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [id, onImpression, impressionTracked]);

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Calculate constrained height based on image aspect ratio
  const getConstrainedHeight = () => {
    if (!imageDimensions || containerWidth === 0) {
      return TILE_CONSTRAINTS.defaultHeight;
    }
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    let height = containerWidth / aspectRatio;
    height = Math.max(TILE_CONSTRAINTS.minHeight, Math.min(TILE_CONSTRAINTS.maxHeight, height));
    return Math.round(height);
  };

  // CRITICAL: Hide completely if no content URL or image failed to load
  if (!contentUrl || imageLoadFailed) {
    return null;
  }

  const isVideo = contentUrl?.match(/\.(mp4|webm)$/i);
  const mediaHeight = getConstrainedHeight();

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative overflow-hidden rounded-lg bg-card border border-border cursor-pointer transition-all duration-300",
        "hover:shadow-lg hover:border-primary/30",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ad Badge */}
      <div className="absolute top-2 left-2 z-20">
        <Badge 
          variant="secondary" 
          className="bg-background/80 backdrop-blur-sm text-xs font-normal"
        >
          Reklama
        </Badge>
      </div>

      {/* Media Container - adaptive height based on image */}
      <div 
        className="relative overflow-hidden transition-all duration-300"
        style={{
          height: mediaHeight,
          minHeight: TILE_CONSTRAINTS.minHeight,
          maxHeight: TILE_CONSTRAINTS.maxHeight,
        }}
      >
        {isVideo ? (
          <video
            src={contentUrl}
            className="w-full h-full object-contain"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={contentUrl}
            alt={name || "Reklama"}
            className={cn(
              "w-full h-full object-contain transition-transform duration-500",
              isHovered && "scale-[1.02]"
            )}
            onError={() => setImageLoadFailed(true)}
          />
        )}

        {/* Overlay gradient on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        )} />

        {/* External link indicator on hover */}
        {targetUrl && (
          <div className={cn(
            "absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          )}>
            <ExternalLink className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Optional title/name */}
      {name && (
        <div className="p-3 border-t border-border">
          <h3 className="text-sm font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
        </div>
      )}
    </div>
  );
}
