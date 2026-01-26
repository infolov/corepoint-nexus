import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { usePartners, Partner } from "@/hooks/use-partners";
import { cn } from "@/lib/utils";
interface DynamicHeaderBrandingProps {
  className?: string;
}

/**
 * Dynamic header branding component that:
 * - Shows static site partner on home page
 * - Rotates between site partner and category partner on category pages (if category partner exists)
 * - Falls back to site partner if no category partner
 */
export function DynamicHeaderBranding({
  className
}: DynamicHeaderBrandingProps) {
  const location = useLocation();
  const {
    sitePartner,
    getCategoryPartner,
    hasCategoryPartner,
    loading
  } = usePartners();
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

  // Rotation effect - 80% category partner, 20% site partner
  useEffect(() => {
    if (!shouldRotate) {
      setShowCategoryPartner(false);
      return;
    }
    
    // Start with category partner visible
    setShowCategoryPartner(true);
    
    const timeoutIds: NodeJS.Timeout[] = [];
    
    const runCycle = () => {
      // Show category partner for 8 seconds (80%)
      const categoryTimeout = setTimeout(() => {
        setIsTransitioning(true);
        const fadeOutTimeout = setTimeout(() => {
          setShowCategoryPartner(false); // Switch to site partner
          setIsTransitioning(false);
          
          // Show site partner for 2 seconds (20%)
          const siteTimeout = setTimeout(() => {
            setIsTransitioning(true);
            const fadeBackTimeout = setTimeout(() => {
              setShowCategoryPartner(true); // Switch back to category partner
              setIsTransitioning(false);
              runCycle(); // Start next cycle
            }, 300);
            timeoutIds.push(fadeBackTimeout);
          }, 2000);
          timeoutIds.push(siteTimeout);
        }, 300);
        timeoutIds.push(fadeOutTimeout);
      }, 8000);
      timeoutIds.push(categoryTimeout);
    };
    
    runCycle();
    
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [shouldRotate]);

  // Reset to site partner when navigating
  useEffect(() => {
    setShowCategoryPartner(false);
    setIsTransitioning(false);
  }, [location.pathname]);

  // Determine which partner to display
  const displayPartner = shouldRotate && showCategoryPartner ? categoryPartner : sitePartner;
  const displayLabel = shouldRotate && showCategoryPartner ? `Partner ${getCategoryDisplayName(currentCategory)}:` : "Partner Serwisu:";
  if (loading) {
    return <PartnerPlaceholder />;
  }
  return <div className={cn("flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1 md:py-2 border-l border-nav-foreground/20 transition-opacity duration-300", isTransitioning && "opacity-0", className)}>
      <span className="text-[10px] md:text-sm text-nav-foreground/60 whitespace-nowrap">
        {shouldRotate && showCategoryPartner ? <><span className="hidden md:inline">{`Partner ${getCategoryDisplayName(currentCategory)}:`}</span><span className="md:hidden">Partner:</span></> : <><span className="hidden md:inline">Partner Serwisu:</span><span className="md:hidden">Partner:</span></>}
      </span>
      <div className={cn(
        "rounded md:rounded-lg flex items-center justify-center overflow-hidden",
        displayPartner?.logo_url 
          ? "h-auto w-auto" 
          : "h-6 md:h-10 w-16 md:w-28 bg-nav-foreground/10"
      )}>
        {displayPartner ? displayPartner.logo_url ? <a href={displayPartner.target_url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
              <img src={displayPartner.logo_url} alt={displayPartner.name} className="h-6 md:h-10 max-w-[80px] md:max-w-[120px] object-contain" />
            </a> : <a href={displayPartner.target_url || "#"} target="_blank" rel="noopener noreferrer" className="text-[8px] md:text-sm text-nav-foreground/70 hover:text-nav-foreground transition-colors truncate px-1 md:px-2" onClick={e => e.stopPropagation()}>
              {displayPartner.logo_text || displayPartner.name}
            </a> : <span className="text-[8px] md:text-sm text-nav-foreground/40">Logo</span>}
      </div>
    </div>;
}
function PartnerPlaceholder() {
  return <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1 md:py-2 border-l border-nav-foreground/20">
      <span className="text-[10px] md:text-sm text-nav-foreground/60">
        <span className="hidden md:inline">Partner Serwisu:</span>
        <span className="md:hidden">Partner:</span>
      </span>
      <div className="h-6 md:h-10 w-16 md:w-28 bg-nav-foreground/10 rounded md:rounded-lg animate-pulse" />
    </div>;
}
function getCategoryDisplayName(slug: string | null): string {
  const categoryNames: Record<string, string> = {
    wiadomosci: "Wiadomości",
    sport: "Sport",
    biznes: "Biznes",
    technologia: "Technologia",
    lifestyle: "Lifestyle",
    rozrywka: "Rozrywka"
  };
  return slug ? categoryNames[slug] || slug : "";
}