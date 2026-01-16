import { useMemo } from "react";
import { getLocalContentMixConfig } from "@/data/categories";

export interface LocalArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  region: string;
  image: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
  content: string;
  pubDateMs: number;
  // New fields for content mixing
  locationLevel?: "city" | "county" | "voivodeship";
  city?: string;
  county?: string;
}

export interface UserLocationSettings {
  voivodeship: string | null;
  county: string | null;  // powiat
  city: string | null;
}

export type LocationLevel = "city" | "county" | "voivodeship";

/**
 * Determines the user's selection level based on their settings
 */
export function determineLocationLevel(settings: UserLocationSettings): LocationLevel {
  if (settings.city) return "city";
  if (settings.county) return "county";
  return "voivodeship";
}

/**
 * Categorizes an article based on its relevance to user's location
 * Returns the closest matching level
 */
function categorizeArticle(
  article: LocalArticle,
  userSettings: UserLocationSettings
): LocationLevel {
  const articleTitle = article.title.toLowerCase();
  const articleExcerpt = article.excerpt?.toLowerCase() || "";
  const articleContent = article.content?.toLowerCase() || "";
  const fullText = `${articleTitle} ${articleExcerpt} ${articleContent}`;
  
  // Check for city match (most specific)
  if (userSettings.city) {
    const cityName = userSettings.city.toLowerCase();
    if (fullText.includes(cityName)) {
      return "city";
    }
  }
  
  // Check for county (powiat) match
  if (userSettings.county) {
    const countyName = userSettings.county.toLowerCase().replace("powiat ", "");
    if (fullText.includes(countyName)) {
      return "county";
    }
  }
  
  // Default to voivodeship level
  return "voivodeship";
}

/**
 * Mixes local content according to the 80/15/5% algorithm:
 * - City selected: 80% city + 15% county + 5% voivodeship
 * - County selected: 85% county + 15% voivodeship
 * - Voivodeship only: 100% voivodeship content
 */
export function mixLocalContent(
  articles: LocalArticle[],
  userSettings: UserLocationSettings,
  limit: number = 50
): LocalArticle[] {
  const level = determineLocationLevel(userSettings);
  const mixConfig = getLocalContentMixConfig(level);
  
  // Categorize all articles
  const categorized = {
    city: [] as LocalArticle[],
    county: [] as LocalArticle[],
    voivodeship: [] as LocalArticle[],
  };
  
  articles.forEach((article) => {
    const articleLevel = categorizeArticle(article, userSettings);
    categorized[articleLevel].push(article);
  });
  
  // Calculate target counts for each level
  const cityCount = Math.round((mixConfig.cityPercentage / 100) * limit);
  const countyCount = Math.round((mixConfig.countyPercentage / 100) * limit);
  const voivodeshipCount = limit - cityCount - countyCount;
  
  // Build mixed result
  const result: LocalArticle[] = [];
  
  // Add city articles
  const cityArticles = categorized.city.slice(0, cityCount);
  result.push(...cityArticles.map(a => ({ ...a, locationLevel: "city" as const })));
  
  // Add county articles
  const countyArticles = categorized.county.slice(0, countyCount);
  result.push(...countyArticles.map(a => ({ ...a, locationLevel: "county" as const })));
  
  // Add voivodeship articles
  const voivodeshipArticles = categorized.voivodeship.slice(0, voivodeshipCount);
  result.push(...voivodeshipArticles.map(a => ({ ...a, locationLevel: "voivodeship" as const })));
  
  // If we don't have enough articles at specific levels, fill from general pool
  const remaining = limit - result.length;
  if (remaining > 0) {
    const allRemaining = [
      ...categorized.city.slice(cityCount),
      ...categorized.county.slice(countyCount),
      ...categorized.voivodeship.slice(voivodeshipCount),
    ].slice(0, remaining);
    result.push(...allRemaining);
  }
  
  // Sort by publication date while maintaining some variety
  return result.sort((a, b) => b.pubDateMs - a.pubDateMs).slice(0, limit);
}

/**
 * Hook for mixing local content based on user's location settings
 */
export function useLocalContentMixer(
  articles: LocalArticle[],
  userSettings: UserLocationSettings,
  limit: number = 50
) {
  const mixedArticles = useMemo(() => {
    if (!userSettings.voivodeship) {
      return articles.slice(0, limit);
    }
    return mixLocalContent(articles, userSettings, limit);
  }, [articles, userSettings, limit]);
  
  const locationLevel = useMemo(() => {
    return determineLocationLevel(userSettings);
  }, [userSettings]);
  
  const mixStats = useMemo(() => {
    const config = getLocalContentMixConfig(locationLevel);
    const counts = {
      city: mixedArticles.filter(a => a.locationLevel === "city").length,
      county: mixedArticles.filter(a => a.locationLevel === "county").length,
      voivodeship: mixedArticles.filter(a => a.locationLevel === "voivodeship" || !a.locationLevel).length,
    };
    return {
      targetPercentages: config,
      actualCounts: counts,
      total: mixedArticles.length,
    };
  }, [mixedArticles, locationLevel]);
  
  return {
    mixedArticles,
    locationLevel,
    mixStats,
  };
}
