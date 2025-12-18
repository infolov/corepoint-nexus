import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Monitor, Square, Smartphone } from "lucide-react";
import { useAdCampaigns } from "@/hooks/use-ad-campaigns";

interface AdBannerProps {
  variant?: "horizontal" | "square" | "vertical";
  className?: string;
}

const variantNames: Record<string, { name: string; icon: typeof Monitor; placementSlug: string }> = {
  horizontal: { name: "Baner - Strona Główna", icon: Monitor, placementSlug: "top-banner" },
  square: { name: "Baner boczny", icon: Square, placementSlug: "sidebar-square" },
  vertical: { name: "Baner pionowy", icon: Monitor, placementSlug: "mobile-banner" },
};

export function AdBanner({ variant = "horizontal", className }: AdBannerProps) {
  const { getRandomCampaign, trackImpression, trackClick, loading } = useAdCampaigns();
  const [currentCampaign, setCurrentCampaign] = useState<ReturnType<typeof getRandomCampaign>>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  const variants = {
    horizontal: "aspect-[728/90] max-h-[90px]",
    square: "aspect-square",
    vertical: "aspect-[300/600]",
  };

  const { name, icon: Icon, placementSlug } = variantNames[variant];

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

  // Show active campaign if available
  if (currentCampaign) {
    return (
      <div
        className={cn(
          "relative rounded-lg overflow-hidden cursor-pointer group",
          variants[variant],
          className
        )}
        onClick={handleClick}
      >
        {currentCampaign.content_url ? (
          <img
            src={currentCampaign.content_url}
            alt={currentCampaign.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
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
      </div>
    );
  }

  // Fallback placeholder when no active campaign
  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden flex items-center justify-center border border-border/50",
        variants[variant],
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
  );
}
