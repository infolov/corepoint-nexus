// Ad Auction Engine Types & Scoring System

export interface AuctionAd {
  id: string;
  type: 'national' | 'local';
  bidPrice: number;        // Base eCPM rate
  priorityMultiplier: number;  // Manual campaign priority (default 1.0)
  targetCity?: string[];   // Only for 'local' type
  targetVoivodeship?: string;
  targetPowiat?: string;
  targetGmina?: string;
  ctrScore: number;        // Click-through rate quality score (default 1.0)
  impressionCount: number; // Session impression counter
  contentUrl: string | null;
  contentText: string | null;
  targetUrl: string | null;
  name: string;
  placementSlug: string;
  tilePosition?: number;   // Position (1-12) in feed grid for feed-tile placements
}

export interface UserLocation {
  voivodeship?: string;
  powiat?: string;
  gmina?: string;
  city?: string;
}

export interface AuctionResult {
  ad: AuctionAd;
  finalScore: number;
  debugInfo: {
    baseScore: number;
    targetingBonus: number;
    frequencyPenalty: number;
    type: string;
    bidPrice: number;
  };
}

// Session impression tracking
const sessionImpressions = new Map<string, number>();

export function getSessionImpressions(adId: string): number {
  return sessionImpressions.get(adId) || 0;
}

export function incrementSessionImpressions(adId: string): void {
  sessionImpressions.set(adId, getSessionImpressions(adId) + 1);
}

export function resetSessionImpressions(): void {
  sessionImpressions.clear();
}

/**
 * Calculate dynamic score for an ad based on auction rules
 * Formula: S = bidPrice × priorityMultiplier × ctrScore
 * + Targeting Bonus (+50% for local match)
 * - Frequency Penalty (-40% per impression after 2)
 */
export function calculateDynamicScore(
  ad: AuctionAd,
  userLocation: UserLocation
): { score: number; debugInfo: AuctionResult['debugInfo'] } {
  // Base score calculation
  const baseScore = ad.bidPrice * ad.priorityMultiplier * ad.ctrScore;
  
  let finalScore = baseScore;
  let targetingBonus = 0;
  let frequencyPenalty = 0;

  // Targeting Bonus: +50% for matching local campaigns with specific targeting
  // Non-matching local ads get reduced score but still participate (no complete exclusion)
  if (ad.type === 'local') {
    const hasTargeting = ad.targetVoivodeship || ad.targetPowiat || ad.targetGmina || 
                        (ad.targetCity && ad.targetCity.length > 0);
    
    if (hasTargeting) {
      const locationMatch = checkLocationMatch(ad, userLocation);
      if (locationMatch) {
        // Matching local ads get +50% bonus
        targetingBonus = baseScore * 0.5;
        finalScore += targetingBonus;
      } else if (!userLocation.voivodeship) {
        // User has no location set - show local ads with reduced priority (-30%)
        finalScore = baseScore * 0.7;
      } else {
        // User location doesn't match - show with much reduced priority (-70%)
        finalScore = baseScore * 0.3;
      }
    }
  }

  // Frequency Penalty: -40% for each impression after 2
  const impressions = getSessionImpressions(ad.id);
  if (impressions > 2) {
    const penaltyCount = impressions - 2;
    frequencyPenalty = finalScore * 0.4 * penaltyCount;
    finalScore = Math.max(0, finalScore - frequencyPenalty);
  }

  return {
    score: finalScore,
    debugInfo: {
      baseScore,
      targetingBonus,
      frequencyPenalty,
      type: ad.type,
      bidPrice: ad.bidPrice
    }
  };
}

/**
 * Check if user location matches ad targeting
 * Hierarchical matching: Voivodeship > Powiat > Gmina > City
 * Ads with NO targeting (no voivodeship/powiat/gmina) are considered "untargeted local" and match everyone
 */
function checkLocationMatch(ad: AuctionAd, userLocation: UserLocation): boolean {
  // If ad has no geographic targeting at all, it matches everyone (untargeted local ad)
  const hasNoTargeting = !ad.targetVoivodeship && !ad.targetPowiat && !ad.targetGmina && 
                         (!ad.targetCity || ad.targetCity.length === 0);
  if (hasNoTargeting) {
    return true;
  }

  // If ad has voivodeship targeting, user must have location set
  if (ad.targetVoivodeship) {
    if (!userLocation.voivodeship) return false;
    if (ad.targetVoivodeship.toLowerCase() !== userLocation.voivodeship.toLowerCase()) {
      return false;
    }
  }

  // Check powiat if specified
  if (ad.targetPowiat) {
    if (!userLocation.powiat) return false;
    if (ad.targetPowiat.toLowerCase() !== userLocation.powiat.toLowerCase()) {
      return false;
    }
  }

  // Check gmina if specified
  if (ad.targetGmina) {
    if (!userLocation.gmina) return false;
    if (ad.targetGmina.toLowerCase() !== userLocation.gmina.toLowerCase()) {
      return false;
    }
  }

  // Check city targeting
  if (ad.targetCity && ad.targetCity.length > 0) {
    if (!userLocation.city) return false;
    const cityMatch = ad.targetCity.some(
      city => city.toLowerCase() === userLocation.city!.toLowerCase()
    );
    if (!cityMatch) return false;
  }

  return true;
}

/**
 * Weighted random selection (Stochastic Auction)
 * Probability of selection is proportional to score
 */
export function weightedRandomSelect(scoredAds: AuctionResult[]): AuctionResult | null {
  if (scoredAds.length === 0) return null;
  if (scoredAds.length === 1) return scoredAds[0];

  // Filter out zero-score ads
  const validAds = scoredAds.filter(a => a.finalScore > 0);
  if (validAds.length === 0) return null;

  const totalScore = validAds.reduce((sum, a) => sum + a.finalScore, 0);
  if (totalScore === 0) return validAds[0];

  // Random weighted selection
  let random = Math.random() * totalScore;
  for (const scoredAd of validAds) {
    random -= scoredAd.finalScore;
    if (random <= 0) {
      return scoredAd;
    }
  }

  return validAds[validAds.length - 1];
}

/**
 * Get the highest scoring national ad (for guaranteed slots)
 */
export function selectHighestNational(scoredAds: AuctionResult[]): AuctionResult | null {
  const nationalAds = scoredAds.filter(a => a.ad.type === 'national' && a.finalScore > 0);
  if (nationalAds.length === 0) return null;
  
  return nationalAds.reduce((best, current) => 
    current.finalScore > best.finalScore ? current : best
  );
}

/**
 * Run the hybrid auction for a single ad slot
 * @param ads Available ads
 * @param userLocation User's location data
 * @param slotIndex Current slot index (1-based)
 * @param nationalEveryN Force national every N slots
 */
export function runAuction(
  ads: AuctionAd[],
  userLocation: UserLocation,
  slotIndex: number = 1,
  nationalEveryN: number = 4
): AuctionResult | null {
  if (ads.length === 0) return null;

  // Score all ads
  const scoredAds: AuctionResult[] = ads.map(ad => {
    const { score, debugInfo } = calculateDynamicScore(ad, userLocation);
    return { ad, finalScore: score, debugInfo };
  });

  // Filter out zero-score ads
  const validAds = scoredAds.filter(a => a.finalScore > 0);
  if (validAds.length === 0) return null;

  // Minimum National Presence rule: every Nth slot is national only
  const forceNational = slotIndex % nationalEveryN === 0;
  
  if (forceNational) {
    const nationalAd = selectHighestNational(validAds);
    if (nationalAd) {
      return nationalAd;
    }
    // Fall through to weighted random if no national available
  }

  // Weighted random selection
  return weightedRandomSelect(validAds);
}

/**
 * Run auction and track impression
 */
export function runAuctionWithTracking(
  ads: AuctionAd[],
  userLocation: UserLocation,
  slotIndex: number = 1
): AuctionResult | null {
  const result = runAuction(ads, userLocation, slotIndex);
  if (result) {
    incrementSessionImpressions(result.ad.id);
  }
  return result;
}
