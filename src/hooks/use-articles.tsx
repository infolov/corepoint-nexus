import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string;
  image: string;
  badge: string | null;
  created_at: string;
  region: string | null;
  view_count: number;
}

interface UseArticlesOptions {
  category?: string;
  limit?: number;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = "cached_articles";
const CACHE_EXPIRY = 2 * 60 * 1000; // 2 minutes cache

interface CachedData {
  articles: Article[];
  timestamp: number;
  category?: string;
}

// Get user voivodeship from localStorage (non-blocking)
function getUserVoivodeship(): string | null {
  try {
    const localSettings = localStorage.getItem("userSettings");
    if (localSettings) {
      const parsed = JSON.parse(localSettings);
      return parsed.voivodeship || null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

// Cache helpers
function getCachedArticles(category?: string): Article[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CachedData = JSON.parse(cached);
    const isExpired = Date.now() - data.timestamp > CACHE_EXPIRY;
    const categoryMatch = data.category === category;
    
    if (!isExpired && categoryMatch && data.articles.length > 0) {
      console.log("Using cached articles:", data.articles.length);
      return data.articles;
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

function setCachedArticles(articles: Article[], category?: string): void {
  try {
    const data: CachedData = {
      articles,
      timestamp: Date.now(),
      category
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function useArticles(options: UseArticlesOptions = {}) {
  const { category, limit = 20 } = options;
  const [articles, setArticles] = useState<Article[]>(() => {
    // Initialize with cached data immediately (no loading delay)
    return getCachedArticles(category) || [];
  });
  const [loading, setLoading] = useState(() => {
    // If we have cached data, don't show loading
    return getCachedArticles(category) === null;
  });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchArticles = useCallback(async (showLoading = true) => {
    // Only show loading if we don't have cached data
    if (showLoading && articles.length === 0) setLoading(true);
    setError(null);

    try {
      // Get voivodeship directly from localStorage (non-blocking)
      const voivodeship = getUserVoivodeship();
      
      let query = supabase
        .from("articles")
        .select("id, title, excerpt, content, category, image, badge, created_at, region, view_count")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      // Filter by category if provided
      if (category) {
        query = query.eq("category", category);
      }

      // Filter by user's voivodeship - include articles for the region OR national articles (region is null)
      if (voivodeship) {
        query = query.or(`region.eq.${voivodeship},region.is.null`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const newArticles = data || [];
      setArticles(newArticles);
      setCachedArticles(newArticles, category);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Błąd podczas ładowania artykułów");
    } finally {
      setLoading(false);
    }
  }, [category, limit, articles.length]);

  useEffect(() => {
    // Fetch immediately without waiting for anything
    fetchArticles();

    // Set up auto-refresh every 5 minutes
    intervalRef.current = setInterval(() => {
      console.log("Auto-refreshing database articles...");
      fetchArticles(false); // Don't show loading spinner for auto-refresh
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const refetch = () => {
    fetchArticles();
  };

  return { articles, loading, error, refetch, lastUpdated };
}

// Helper to format article for NewsCard component
export function formatArticleForCard(article: Article) {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt || undefined,
    content: article.content || undefined,
    category: article.category,
    image: article.image,
    timestamp: formatTimestamp(article.created_at),
    badge: article.badge as "hot" | "trending" | "new" | undefined,
    source: "INFORMACJE.PL",
  };
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Przed chwilą";
  } else if (diffMins < 60) {
    return `${diffMins} min temu`;
  } else if (diffHours < 24) {
    return `${diffHours} godz. temu`;
  } else if (diffDays < 30) {
    return `${diffDays} dni temu`;
  } else {
    return date.toLocaleDateString("pl-PL");
  }
}
