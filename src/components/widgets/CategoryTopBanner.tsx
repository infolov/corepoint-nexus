import { useState, useEffect, useMemo } from "react";
import { AuctionAdSlot, type AdPlacementSlug } from "@/components/widgets/AuctionAdSlot";
import { useAdAuction } from "@/hooks/use-ad-auction";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";

interface CategoryTopBannerProps {
  categorySlug: string;
  className?: string;
}

// Map category slugs to their placement slugs
const CATEGORY_PLACEMENT_MAP: Record<string, AdPlacementSlug> = {
  wiadomosci: "category-top-wiadomosci" as AdPlacementSlug,
  swiat: "category-top-swiat" as AdPlacementSlug,
  biznes: "category-top-biznes" as AdPlacementSlug,
  finanse: "category-top-finanse" as AdPlacementSlug,
  prawo: "category-top-prawo" as AdPlacementSlug,
  "tech-nauka": "category-top-tech-nauka" as AdPlacementSlug,
  motoryzacja: "category-top-motoryzacja" as AdPlacementSlug,
  sport: "category-top-sport" as AdPlacementSlug,
  kultura: "category-top-kultura" as AdPlacementSlug,
  lifestyle: "category-top-lifestyle" as AdPlacementSlug,
};

/**
 * Category-specific top banner with fallback to homepage top banner.
 * If no category-specific ad is available, displays the general top-banner.
 */
export function CategoryTopBanner({ categorySlug, className }: CategoryTopBannerProps) {
  const { settings } = useUserSettings();
  const [useFallback, setUseFallback] = useState(false);
  
  // Get category-specific placement slug
  const categoryPlacementSlug = CATEGORY_PLACEMENT_MAP[categorySlug];
  
  // Build user location for targeting
  const userLocation = useMemo(() => ({
    voivodeship: settings.voivodeship || undefined,
    powiat: settings.county || undefined,
    gmina: settings.locality || undefined,
    city: settings.city || undefined,
  }), [settings]);
  
  // Hook for category-specific ads
  const categoryAuction = useAdAuction({
    userLocation,
    placementSlug: categoryPlacementSlug || "top-banner",
  });
  
  // Check if category has ads available
  useEffect(() => {
    if (!categoryAuction.loading && categoryPlacementSlug) {
      const categoryAd = categoryAuction.getNextAd(categoryPlacementSlug);
      // If no category-specific ad, use fallback
      setUseFallback(!categoryAd);
    }
  }, [categoryAuction.loading, categoryPlacementSlug, categoryAuction]);
  
  // If no category placement exists or fallback needed, show homepage banner
  const effectivePlacementSlug: AdPlacementSlug = 
    (!categoryPlacementSlug || useFallback) 
      ? "top-banner" 
      : categoryPlacementSlug;
  
  return (
    <div className={cn("w-full", className)}>
      <AuctionAdSlot
        variant="horizontal"
        placementSlug={effectivePlacementSlug}
        placement="main"
        className="w-full"
        showDevOverlay={true}
        lazyLoad={false} // Top banner should load immediately
      />
    </div>
  );
}
