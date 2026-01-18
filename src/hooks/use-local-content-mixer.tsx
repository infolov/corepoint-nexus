import { useMemo } from "react";
import { getLocalContentMixConfig, LocalContentMixConfig } from "@/data/categories";
import { LocalArticle } from "@/hooks/use-local-news";

export type LocationLevel = "city" | "county" | "voivodeship" | "none";

export interface UserLocationContext {
  voivodeship: string | null;
  county: string | null; // powiat
  city: string | null;
}

export interface MixedContentResult {
  articles: LocalArticle[];
  mixConfig: LocalContentMixConfig;
  selectedLevel: LocationLevel;
  stats: {
    cityCount: number;
    countyCount: number;
    voivodeshipCount: number;
    totalCount: number;
  };
}

/**
 * Determines the most granular location level available
 */
export function getLocationLevel(location: UserLocationContext): LocationLevel {
  if (location.city) return "city";
  if (location.county) return "county";
  if (location.voivodeship) return "voivodeship";
  return "none";
}

/**
 * Filters articles by location level
 */
function filterByCity(articles: LocalArticle[], city: string): LocalArticle[] {
  const normalized = city.toLowerCase();
  return articles.filter(article => {
    const content = `${article.title} ${article.excerpt} ${article.content}`.toLowerCase();
    return content.includes(normalized);
  });
}

function filterByCounty(articles: LocalArticle[], county: string): LocalArticle[] {
  const normalized = county.toLowerCase();
  return articles.filter(article => {
    const content = `${article.title} ${article.excerpt} ${article.content}`.toLowerCase();
    return content.includes(normalized);
  });
}

function filterByVoivodeship(articles: LocalArticle[], voivodeship: string): LocalArticle[] {
  // Match by region field or content
  return articles.filter(article => {
    if (article.region?.toLowerCase() === voivodeship.toLowerCase()) return true;
    return false;
  });
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Mixes content according to the 80/15/5 algorithm based on location granularity
 */
export function mixLocalContent(
  allArticles: LocalArticle[],
  location: UserLocationContext,
  targetCount: number = 50
): MixedContentResult {
  const level = getLocationLevel(location);
  
  // If no location, return all articles
  if (level === "none") {
    return {
      articles: allArticles.slice(0, targetCount),
      mixConfig: { cityPercentage: 0, countyPercentage: 0, voivodeshipPercentage: 100 },
      selectedLevel: "none",
      stats: { cityCount: 0, countyCount: 0, voivodeshipCount: allArticles.length, totalCount: allArticles.length },
    };
  }

  const mixConfig = getLocalContentMixConfig(level);
  
  // Get articles at each level
  let cityArticles: LocalArticle[] = [];
  let countyArticles: LocalArticle[] = [];
  let voivodeshipArticles: LocalArticle[] = [];

  // All articles at voivodeship level
  if (location.voivodeship) {
    voivodeshipArticles = filterByVoivodeship(allArticles, location.voivodeship);
    // If no voivodeship-filtered results, use all articles
    if (voivodeshipArticles.length === 0) {
      voivodeshipArticles = allArticles;
    }
  }

  // Filter by county (within voivodeship articles)
  if (location.county) {
    countyArticles = filterByCounty(voivodeshipArticles, location.county);
  }

  // Filter by city (within county articles or voivodeship if no county)
  if (location.city) {
    const sourceArticles = countyArticles.length > 0 ? countyArticles : voivodeshipArticles;
    cityArticles = filterByCity(sourceArticles, location.city);
  }

  // Calculate how many articles we need from each level
  const cityCount = Math.round((mixConfig.cityPercentage / 100) * targetCount);
  const countyCount = Math.round((mixConfig.countyPercentage / 100) * targetCount);
  const voivodeshipCount = targetCount - cityCount - countyCount;

  // Shuffle and take the required number from each level
  const shuffledCity = shuffle(cityArticles);
  const shuffledCounty = shuffle(countyArticles.filter(a => !cityArticles.includes(a)));
  const shuffledVoivodeship = shuffle(
    voivodeshipArticles.filter(a => !cityArticles.includes(a) && !countyArticles.includes(a))
  );

  // Take articles, with fallback if not enough at a level
  const selectedCity = shuffledCity.slice(0, cityCount);
  const neededFromCounty = countyCount + (cityCount - selectedCity.length);
  const selectedCounty = shuffledCounty.slice(0, neededFromCounty);
  const neededFromVoivodeship = voivodeshipCount + (neededFromCounty - selectedCounty.length);
  const selectedVoivodeship = shuffledVoivodeship.slice(0, neededFromVoivodeship);

  // Combine and sort by publication date (newest first)
  const combined = [...selectedCity, ...selectedCounty, ...selectedVoivodeship];
  combined.sort((a, b) => (b.pubDateMs || 0) - (a.pubDateMs || 0));

  // If we still don't have enough, add more from voivodeship
  if (combined.length < targetCount) {
    const remaining = voivodeshipArticles
      .filter(a => !combined.includes(a))
      .slice(0, targetCount - combined.length);
    combined.push(...remaining);
  }

  return {
    articles: combined.slice(0, targetCount),
    mixConfig,
    selectedLevel: level,
    stats: {
      cityCount: selectedCity.length,
      countyCount: selectedCounty.length,
      voivodeshipCount: selectedVoivodeship.length,
      totalCount: combined.length,
    },
  };
}

/**
 * Hook that provides mixed local content based on user location
 */
export function useLocalContentMixer(
  articles: LocalArticle[],
  location: UserLocationContext,
  targetCount: number = 50
) {
  const result = useMemo(() => {
    return mixLocalContent(articles, location, targetCount);
  }, [articles, location.voivodeship, location.county, location.city, targetCount]);

  return result;
}
