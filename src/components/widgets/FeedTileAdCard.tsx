import { useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
 * Ad card component styled to match NewsCard
 * Used in feed grid to display ads in place of articles
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
  const cardRef = useRef<HTMLDivElement>(null);

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

  const isVideo = contentUrl?.match(/\.(mp4|webm)$/i);
  const isAnimatedImage = contentUrl?.match(/\.(gif|webp|apng)$/i);

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

      {/* Media Container - matches NewsCard aspect ratio */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {contentUrl ? (
          isVideo ? (
            <video
              src={contentUrl}
              className="w-full h-full object-cover"
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
                "w-full h-full object-cover transition-transform duration-500",
                isHovered && "scale-105"
              )}
            />
          )
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Brak obrazu</span>
          </div>
        )}

        {/* Overlay gradient on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
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
