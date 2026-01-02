import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { decodeHTMLEntities } from "@/lib/utils";

export interface RSSArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
  content: string;
  pubDateMs?: number; // For sorting by publication date
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const RSS_CACHE_KEY = "cached_rss_articles";
const RSS_CACHE_EXPIRY = 3 * 60 * 1000; // 3 minutes cache

interface CachedRSSData {
  articles: RSSArticle[];
  timestamp: number;
}

// Cache helpers for RSS
function getCachedRSSArticles(): RSSArticle[] | null {
  try {
    const cached = localStorage.getItem(RSS_CACHE_KEY);
    if (!cached) return null;
    
    const data: CachedRSSData = JSON.parse(cached);
    const isExpired = Date.now() - data.timestamp > RSS_CACHE_EXPIRY;
    
    if (!isExpired && data.articles.length > 0) {
      console.log("Using cached RSS articles:", data.articles.length);
      return data.articles;
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

function setCachedRSSArticles(articles: RSSArticle[]): void {
  try {
    const data: CachedRSSData = {
      articles,
      timestamp: Date.now()
    };
    localStorage.setItem(RSS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function useRSSArticles() {
  const [articles, setArticles] = useState<RSSArticle[]>(() => {
    // Initialize with cached data immediately
    return getCachedRSSArticles() || [];
  });
  const [loading, setLoading] = useState(() => {
    // If we have cached data, don't show loading
    return getCachedRSSArticles() === null;
  });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const articlesRef = useRef<RSSArticle[]>([]);
  const isFetchingRef = useRef(false);

  const fetchArticles = useCallback(async (showLoading = true) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    // Only show loading if we don't have any articles
    if (showLoading && articles.length === 0) setLoading(true);
    setError(null);

    try {
      console.log("Fetching articles from RSS and scraping...");
      
      // Fetch from both RSS and scraping in parallel
      const [rssResult, scrapeResult] = await Promise.allSettled([
        supabase.functions.invoke("fetch-rss"),
        supabase.functions.invoke("scrape-news")
      ]);

      let allArticles: RSSArticle[] = [];

      // Process RSS results
      if (rssResult.status === 'fulfilled' && !rssResult.value.error) {
        console.log("RSS data received:", rssResult.value.data?.articles?.length || 0, "articles");
        allArticles = [...allArticles, ...(rssResult.value.data?.articles || [])];
      } else {
        console.error("Error from RSS:", rssResult.status === 'rejected' ? rssResult.reason : rssResult.value.error);
      }

      // Process scraping results
      if (scrapeResult.status === 'fulfilled' && !scrapeResult.value.error) {
        console.log("Scraping data received:", scrapeResult.value.data?.articles?.length || 0, "articles");
        allArticles = [...allArticles, ...(scrapeResult.value.data?.articles || [])];
      } else {
        console.error("Error from scraping:", scrapeResult.status === 'rejected' ? scrapeResult.reason : scrapeResult.value.error);
      }

      // Sort all articles by publication date (newest first)
      allArticles.sort((a, b) => (b.pubDateMs || 0) - (a.pubDateMs || 0));
      
      // Remove duplicates by ID
      const seenIds = new Set<string>();
      const uniqueArticles = allArticles.filter(article => {
        if (seenIds.has(article.id)) return false;
        seenIds.add(article.id);
        return true;
      });

      console.log("Total unique articles:", uniqueArticles.length);
      
      // Merge new articles with existing ones
      const existingIds = new Set(articlesRef.current.map(a => a.id));
      const trulyNewArticles = uniqueArticles.filter((a: RSSArticle) => !existingIds.has(a.id));
      
      const mergedArticles = [...trulyNewArticles, ...articlesRef.current.filter((existing: RSSArticle) => 
        uniqueArticles.some((newA: RSSArticle) => newA.id === existing.id)
      )];
      
      const finalArticles = articlesRef.current.length === 0 ? uniqueArticles : mergedArticles;
      
      articlesRef.current = finalArticles;
      setArticles(finalArticles);
      setCachedRSSArticles(finalArticles);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Błąd podczas ładowania artykułów");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [articles.length]);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchArticles();

    // Set up auto-refresh every 5 minutes
    intervalRef.current = setInterval(() => {
      console.log("Auto-refreshing RSS articles...");
      fetchArticles(false); // Don't show loading spinner for auto-refresh
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchArticles]);

  const refetch = () => {
    fetchArticles();
  };

  return { articles, loading, error, refetch, lastUpdated };
}

// Helper to format RSS article for NewsCard component
export function formatRSSArticleForCard(article: RSSArticle) {
  return {
    id: article.id,
    title: decodeHTMLEntities(article.title),
    excerpt: decodeHTMLEntities(article.excerpt),
    content: decodeHTMLEntities(article.content),
    category: article.category,
    image: article.image,
    timestamp: article.timestamp,
    source: article.source,
    sourceUrl: article.sourceUrl,
  };
}
