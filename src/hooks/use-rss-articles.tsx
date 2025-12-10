import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
}

export function useRSSArticles() {
  const [articles, setArticles] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching RSS articles...");
      
      const { data, error: fetchError } = await supabase.functions.invoke("fetch-rss");

      if (fetchError) {
        console.error("Error from edge function:", fetchError);
        throw fetchError;
      }

      console.log("RSS data received:", data);
      setArticles(data?.articles || []);
    } catch (err) {
      console.error("Error fetching RSS articles:", err);
      setError("Błąd podczas ładowania artykułów z RSS");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const refetch = () => {
    fetchArticles();
  };

  return { articles, loading, error, refetch };
}

// Helper to format RSS article for NewsCard component
export function formatRSSArticleForCard(article: RSSArticle) {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    image: article.image,
    timestamp: article.timestamp,
    source: article.source,
    sourceUrl: article.sourceUrl,
  };
}
