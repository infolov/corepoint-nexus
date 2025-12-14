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

export function useRSSArticles() {
  const [articles, setArticles] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const articlesRef = useRef<RSSArticle[]>([]);

  const fetchArticles = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      console.log("Fetching RSS articles...");
      
      const { data, error: fetchError } = await supabase.functions.invoke("fetch-rss");

      if (fetchError) {
        console.error("Error from edge function:", fetchError);
        throw fetchError;
      }

      console.log("RSS data received:", data);
      const newArticles = data?.articles || [];
      
      // Merge new articles with existing ones, preserving order for stability
      // but adding new articles at the beginning
      const existingIds = new Set(articlesRef.current.map(a => a.id));
      const trulyNewArticles = newArticles.filter((a: RSSArticle) => !existingIds.has(a.id));
      
      // Update existing articles and add new ones at the start
      const mergedArticles = [...trulyNewArticles, ...articlesRef.current.filter((existing: RSSArticle) => 
        newArticles.some((newA: RSSArticle) => newA.id === existing.id)
      )];
      
      // If we have no existing articles, just use the new ones
      const finalArticles = articlesRef.current.length === 0 ? newArticles : mergedArticles;
      
      articlesRef.current = finalArticles;
      setArticles(finalArticles);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching RSS articles:", err);
      setError("Błąd podczas ładowania artykułów z RSS");
    } finally {
      setLoading(false);
    }
  }, []);

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
