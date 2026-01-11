// Ad Auction Cache System
// Stores auction ads in localStorage for faster initial loading

import { AuctionAd } from "./ad-auction-engine";

const CACHE_KEY = "ad_auction_cache";
const CACHE_VERSION = "1.0";
const CACHE_TTL_MINUTES = 15; // Cache expires after 15 minutes
const STALE_WHILE_REVALIDATE_MINUTES = 60; // Show stale data for up to 1 hour while fetching fresh

interface AdCache {
  version: string;
  timestamp: number;
  ads: AuctionAd[];
  placementSlug?: string;
}

interface CacheStatus {
  isFresh: boolean;      // Cache is within TTL
  isStale: boolean;      // Cache is past TTL but can be used
  isExpired: boolean;    // Cache should not be used
  age: number;           // Age in minutes
}

/**
 * Get cache key for specific placement
 */
function getCacheKey(placementSlug?: string): string {
  return placementSlug ? `${CACHE_KEY}_${placementSlug}` : CACHE_KEY;
}

/**
 * Check cache status
 */
export function getCacheStatus(placementSlug?: string): CacheStatus {
  try {
    const cacheKey = getCacheKey(placementSlug);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return { isFresh: false, isStale: false, isExpired: true, age: Infinity };
    }

    const data: AdCache = JSON.parse(cached);
    
    // Version mismatch - treat as expired
    if (data.version !== CACHE_VERSION) {
      return { isFresh: false, isStale: false, isExpired: true, age: Infinity };
    }

    const ageMs = Date.now() - data.timestamp;
    const ageMinutes = ageMs / (1000 * 60);

    if (ageMinutes < CACHE_TTL_MINUTES) {
      return { isFresh: true, isStale: false, isExpired: false, age: ageMinutes };
    }
    
    if (ageMinutes < STALE_WHILE_REVALIDATE_MINUTES) {
      return { isFresh: false, isStale: true, isExpired: false, age: ageMinutes };
    }

    return { isFresh: false, isStale: false, isExpired: true, age: ageMinutes };
  } catch {
    return { isFresh: false, isStale: false, isExpired: true, age: Infinity };
  }
}

/**
 * Get cached ads if available and not expired
 */
export function getCachedAds(placementSlug?: string): AuctionAd[] | null {
  try {
    const cacheKey = getCacheKey(placementSlug);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;

    const data: AdCache = JSON.parse(cached);
    
    // Version check
    if (data.version !== CACHE_VERSION) {
      clearAdCache(placementSlug);
      return null;
    }

    const status = getCacheStatus(placementSlug);
    
    // Return data if fresh or stale (stale-while-revalidate)
    if (status.isFresh || status.isStale) {
      return data.ads;
    }

    // Expired - clear and return null
    clearAdCache(placementSlug);
    return null;
  } catch (error) {
    console.error("Error reading ad cache:", error);
    return null;
  }
}

/**
 * Set cached ads
 */
export function setCachedAds(ads: AuctionAd[], placementSlug?: string): void {
  try {
    const cacheKey = getCacheKey(placementSlug);
    const cache: AdCache = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      ads,
      placementSlug,
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (error) {
    console.error("Error setting ad cache:", error);
  }
}

/**
 * Clear ad cache
 */
export function clearAdCache(placementSlug?: string): void {
  try {
    if (placementSlug) {
      localStorage.removeItem(getCacheKey(placementSlug));
    } else {
      // Clear all ad caches
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY));
      keys.forEach(key => localStorage.removeItem(key));
    }
  } catch (error) {
    console.error("Error clearing ad cache:", error);
  }
}

/**
 * Preload cache - call on app init
 */
export function preloadAdCache(): boolean {
  const status = getCacheStatus();
  return status.isFresh || status.isStale;
}

/**
 * Get cache debug info
 */
export function getCacheDebugInfo(placementSlug?: string): {
  hasCache: boolean;
  status: CacheStatus;
  adCount: number;
  lastUpdated: string | null;
} {
  const status = getCacheStatus(placementSlug);
  const ads = getCachedAds(placementSlug);
  
  let lastUpdated: string | null = null;
  try {
    const cacheKey = getCacheKey(placementSlug);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data: AdCache = JSON.parse(cached);
      lastUpdated = new Date(data.timestamp).toLocaleTimeString();
    }
  } catch {}

  return {
    hasCache: ads !== null,
    status,
    adCount: ads?.length || 0,
    lastUpdated,
  };
}

/**
 * Cache statistics for dev mode
 */
export function getCacheStats(): {
  totalCaches: number;
  totalAds: number;
  cacheKeys: string[];
} {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY));
    let totalAds = 0;

    keys.forEach(key => {
      try {
        const data: AdCache = JSON.parse(localStorage.getItem(key) || "{}");
        totalAds += data.ads?.length || 0;
      } catch {}
    });

    return {
      totalCaches: keys.length,
      totalAds,
      cacheKeys: keys,
    };
  } catch {
    return { totalCaches: 0, totalAds: 0, cacheKeys: [] };
  }
}
