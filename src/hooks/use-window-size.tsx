import { useState, useEffect, useCallback } from "react";

export interface WindowSize {
  width: number;
  height: number;
}

export type Breakpoint = "mobile" | "tablet" | "desktop";

export interface ResponsiveAdSize {
  width: number;
  height: number;
  label: string;
}

// Standard IAB ad sizes
export const AD_SIZES = {
  billboard: { width: 970, height: 250, label: "Billboard 970×250" },
  leaderboard: { width: 728, height: 90, label: "Leaderboard 728×90" },
  mediumRectangle: { width: 300, height: 250, label: "Medium Rectangle 300×250" },
  largeMobileBanner: { width: 320, height: 100, label: "Large Mobile Banner 320×100" },
  mobileBanner: { width: 320, height: 50, label: "Mobile Banner 320×50" },
  halfPage: { width: 300, height: 600, label: "Half Page 300×600" },
  wideSkyscraper: { width: 160, height: 600, label: "Wide Skyscraper 160×600" },
} as const;

// Breakpoint thresholds
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      // Debounce resize events
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    
    // Set initial size
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return windowSize;
}

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowSize();

  if (width < BREAKPOINTS.mobile) {
    return "mobile";
  } else if (width < BREAKPOINTS.tablet) {
    return "tablet";
  }
  return "desktop";
}

export type AdVariant = "horizontal" | "square" | "vertical" | "auto";
export type AdPlacement = "main" | "sidebar" | "feed" | "header";

interface GetBestAdSizeOptions {
  variant: AdVariant;
  placement?: AdPlacement;
  preferredSize?: keyof typeof AD_SIZES;
}

/**
 * Returns the optimal ad size based on window width, variant, and placement
 * Following the rules:
 * - Desktop (>1024px): Billboard 970×250 for leaderboard, fallback to 728×90
 * - Tablet (768-1024px): Leaderboard 728×90 or 300×250 in sidebar
 * - Mobile (<768px): 320×100 or 320×50 for all wide formats
 */
export function getBestAdSize(
  windowWidth: number,
  options: GetBestAdSizeOptions
): ResponsiveAdSize {
  const { variant, placement = "main", preferredSize } = options;
  const breakpoint = getBreakpointFromWidth(windowWidth);

  // Square variant - always returns medium rectangle
  if (variant === "square") {
    return AD_SIZES.mediumRectangle;
  }

  // Vertical variant - returns half page on desktop/tablet, smaller on mobile
  if (variant === "vertical") {
    if (breakpoint === "mobile") {
      return AD_SIZES.mediumRectangle;
    }
    return AD_SIZES.halfPage;
  }

  // Horizontal variant or auto
  if (variant === "horizontal" || variant === "auto") {
    // Mobile - always use mobile banner sizes
    if (breakpoint === "mobile") {
      // Use larger mobile banner by default, smaller if container is very tight
      return windowWidth < 350 ? AD_SIZES.mobileBanner : AD_SIZES.largeMobileBanner;
    }

    // Tablet
    if (breakpoint === "tablet") {
      // Sidebar gets medium rectangle
      if (placement === "sidebar") {
        return AD_SIZES.mediumRectangle;
      }
      // Main content gets leaderboard
      return AD_SIZES.leaderboard;
    }

    // Desktop
    if (breakpoint === "desktop") {
      // Sidebar gets medium rectangle
      if (placement === "sidebar") {
        return AD_SIZES.mediumRectangle;
      }

      // Check if user preferred leaderboard - try billboard first
      if (preferredSize === "leaderboard" || variant === "horizontal") {
        // If window is wide enough for billboard
        if (windowWidth >= 1200) {
          return AD_SIZES.billboard;
        }
        // Fallback to leaderboard
        return AD_SIZES.leaderboard;
      }

      // Default to billboard on wide screens
      if (windowWidth >= 1200) {
        return AD_SIZES.billboard;
      }
      return AD_SIZES.leaderboard;
    }
  }

  // Fallback
  return AD_SIZES.leaderboard;
}

function getBreakpointFromWidth(width: number): Breakpoint {
  if (width < BREAKPOINTS.mobile) return "mobile";
  if (width < BREAKPOINTS.tablet) return "tablet";
  return "desktop";
}

/**
 * Returns the minimum height to reserve for ad slot to prevent CLS
 * Based on the largest possible format for the current breakpoint
 */
export function getMinHeightForBreakpoint(breakpoint: Breakpoint, placement: AdPlacement = "main"): number {
  if (placement === "sidebar") {
    // Sidebar always uses square or medium rectangle
    return AD_SIZES.mediumRectangle.height;
  }

  switch (breakpoint) {
    case "mobile":
      return AD_SIZES.largeMobileBanner.height; // 100px
    case "tablet":
      return AD_SIZES.leaderboard.height; // 90px
    case "desktop":
      return AD_SIZES.billboard.height; // 250px
    default:
      return AD_SIZES.leaderboard.height;
  }
}

/**
 * Returns CSS aspect ratio string for the ad size
 */
export function getAspectRatio(size: ResponsiveAdSize): string {
  return `${size.width}/${size.height}`;
}
