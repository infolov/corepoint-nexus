import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { usePartners, Partner } from "@/hooks/use-partners";
import { cn } from "@/lib/utils";

interface DynamicHeaderBrandingProps {
  className?: string;
  variant?: "desktop" | "mobile";
}

/**
 * Dynamic header branding component that:
 * - Shows static site partner on home page
 * - Rotates between site partner and category partner on category pages (if category partner exists)
 * - Falls back to site partner if no category partner
 */
export function DynamicHeaderBranding({ className, variant = "desktop" }: DynamicHeaderBrandingProps) {
  const location = useLocation();
  const { sitePartner, getCategoryPartner, hasCategoryPartner, loading } = usePartners();
  const [showCategoryPartner, setShowCategoryPartner] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Extract category from URL path
  const getCurrentCategory = useCallback(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0 && pathParts[0] !== "") {
      // Check if it's a known category
      const knownCategories = ["wiadomosci", "sport", "biznes", "technologia", "lifestyle", "rozrywka"];
      if (knownCategories.includes(pathParts[0])) {
        return pathParts[0];
      }
    }
    return null;
  }, [location.pathname]);

  const currentCategory = getCurrentCategory();
  const isHomePage = location.pathname === "/" || location.pathname === "";
  const categoryPartner = currentCategory ? getCategoryPartner(currentCategory) : null;
  const shouldRotate = !isHomePage && categoryPartner !== null;

  // Rotation effect - every 10 seconds
  useEffect(() => {
    if (!shouldRotate) {
      setShowCategoryPartner(false);
      return;
    }

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowCategoryPartner(prev => !prev);
        setIsTransitioning(false);
      }, 300); // Fade out duration
    }, 10000);

    return () => clearInterval(interval);
  }, [shouldRotate]);

  // Reset to site partner when navigating
  useEffect(() => {
    setShowCategoryPartner(false);
    setIsTransitioning(false);
  }, [location.pathname]);

  // Determine which partner to display
  const displayPartner = shouldRotate && showCategoryPartner ? categoryPartner : sitePartner;
  const displayLabel = shouldRotate && showCategoryPartner 
    ? `Partner ${getCategoryDisplayName(currentCategory)}:`
    : "Partner Serwisu:";

  if (loading) {
    return <PartnerPlaceholder variant={variant} />;
  }

  if (variant === "mobile") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <span className="text-[10px] text-nav-foreground/60">Partner:</span>
        <div 
          className={cn(
            "h-5 w-16 bg-nav-foreground/10 rounded flex items-center justify-center transition-opacity duration-300",
            isTransitioning && "opacity-0"
          )}
        >
          {displayPartner ? (
            displayPartner.logo_url ? (
              <img 
                src={displayPartner.logo_url} 
                alt={displayPartner.name} 
                className="h-4 max-w-full object-contain"
              />
            ) : (
              <span className="text-[8px] text-nav-foreground/70 truncate px-1">
                {displayPartner.logo_text || displayPartner.name}
              </span>
            )
          ) : (
            <span className="text-[8px] text-nav-foreground/50">Logo</span>
          )}
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div className={cn(
      "hidden md:flex items-center gap-3 px-4 py-2 border-l border-nav-foreground/20 transition-opacity duration-300",
      isTransitioning && "opacity-0",
      className
    )}>
      <span className="text-sm text-nav-foreground/60 whitespace-nowrap">{displayLabel}</span>
      <div className="h-10 w-28 bg-nav-foreground/10 rounded-lg flex items-center justify-center overflow-hidden">
        {displayPartner ? (
          displayPartner.logo_url ? (
            <a 
              href={displayPartner.target_url || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="h-full w-full flex items-center justify-center"
            >
              <img 
                src={displayPartner.logo_url} 
                alt={displayPartner.name} 
                className="h-8 max-w-full object-contain"
              />
            </a>
          ) : (
            <a 
              href={displayPartner.target_url || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-nav-foreground/70 hover:text-nav-foreground transition-colors truncate px-2"
            >
              {displayPartner.logo_text || displayPartner.name}
            </a>
          )
        ) : (
          <span className="text-sm text-nav-foreground/50">Logo partnera</span>
        )}
      </div>
    </div>
  );
}

function PartnerPlaceholder({ variant }: { variant: "desktop" | "mobile" }) {
  if (variant === "mobile") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-nav-foreground/60">Partner:</span>
        <div className="h-5 w-16 bg-nav-foreground/10 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-3 px-4 py-2 border-l border-nav-foreground/20">
      <span className="text-sm text-nav-foreground/60">Partner Serwisu:</span>
      <div className="h-10 w-28 bg-nav-foreground/10 rounded-lg animate-pulse" />
    </div>
  );
}

function getCategoryDisplayName(slug: string | null): string {
  const categoryNames: Record<string, string> = {
    wiadomosci: "Wiadomości",
    sport: "Sport",
    biznes: "Biznes",
    technologia: "Technologia",
    lifestyle: "Lifestyle",
    rozrywka: "Rozrywka",
  };
  return slug ? categoryNames[slug] || slug : "";
}
