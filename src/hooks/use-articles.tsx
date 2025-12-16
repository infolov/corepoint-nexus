import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/use-user-settings";

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

export function useArticles(options: UseArticlesOptions = {}) {
  const { category, limit = 20 } = options;
  const { settings, loading: settingsLoading } = useUserSettings();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchArticles = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
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
      if (settings.voivodeship) {
        query = query.or(`region.eq.${settings.voivodeship},region.is.null`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setArticles(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Błąd podczas ładowania artykułów");
    } finally {
      setLoading(false);
    }
  }, [category, limit, settings.voivodeship]);

  useEffect(() => {
    if (!settingsLoading) {
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
    }
  }, [fetchArticles, settingsLoading]);

  const refetch = () => {
    fetchArticles();
  };

  return { articles, loading: loading || settingsLoading, error, refetch, lastUpdated };
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
