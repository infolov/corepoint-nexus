import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { decodeHTMLEntities } from "@/lib/utils";

export interface RSSArticle {
  id: string;
  title: string;
  aiTitle?: string | null;
  excerpt: string;
  category: string;
  image: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
  content: string;
  pubDateMs?: number; // For sorting by publication date
}

interface CacheMeta {
  total: number;
  fromCache: { rss: boolean; scraper: boolean };
  elapsed: number;
  cacheTTL: number;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useRSSArticles() {
  const [articles, setArticles] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheMeta, setCacheMeta] = useState<CacheMeta | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const articlesRef = useRef<RSSArticle[]>([]);

  const fetchArticles = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke("get-cached-news");

      if (fetchError) {
        console.error("Error from get-cached-news:", fetchError);
        throw fetchError;
      }

      const fetchedArticles: RSSArticle[] = data?.articles || [];
      const meta: CacheMeta | undefined = data?.meta;
      
      if (meta) {
        setCacheMeta(meta);
      }
      
      // Merge new articles with existing ones for smooth updates
      const existingIds = new Set(articlesRef.current.map(a => a.id));
      const trulyNewArticles = fetchedArticles.filter((a: RSSArticle) => !existingIds.has(a.id));
      
      const mergedArticles = [...trulyNewArticles, ...articlesRef.current.filter((existing: RSSArticle) => 
        fetchedArticles.some((newA: RSSArticle) => newA.id === existing.id)
      )];
      
      // Sort merged articles by publication date
      mergedArticles.sort((a, b) => (b.pubDateMs || 0) - (a.pubDateMs || 0));
      
      const finalArticles = articlesRef.current.length === 0 ? fetchedArticles : mergedArticles;
      
      articlesRef.current = finalArticles;
      setArticles(finalArticles);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Błąd podczas ładowania artykułów");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchArticles();

    // Set up auto-refresh every 5 minutes
    intervalRef.current = setInterval(() => {
      fetchArticles(false);
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

  return { articles, loading, error, refetch, lastUpdated, cacheMeta };
}

// Helper to format RSS article for NewsCard component
export function formatRSSArticleForCard(article: RSSArticle) {
  return {
    id: article.id,
    title: article.aiTitle ? decodeHTMLEntities(article.aiTitle) : decodeHTMLEntities(article.title),
    originalTitle: decodeHTMLEntities(article.title),
    excerpt: decodeHTMLEntities(article.excerpt),
    content: decodeHTMLEntities(article.content),
    category: article.category,
    image: article.image,
    timestamp: article.timestamp,
    source: article.source,
    sourceUrl: article.sourceUrl,
  };
}
