import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/use-user-settings";

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  image: string;
  badge: string | null;
  created_at: string;
  region: string | null;
}

interface UseArticlesOptions {
  category?: string;
  limit?: number;
}

export function useArticles(options: UseArticlesOptions = {}) {
  const { category, limit = 20 } = options;
  const { settings, loading: settingsLoading } = useUserSettings();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("articles")
        .select("id, title, excerpt, category, image, badge, created_at, region")
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
    }
  }, [fetchArticles, settingsLoading]);

  const refetch = () => {
    fetchArticles();
  };

  return { articles, loading: loading || settingsLoading, error, refetch };
}

// Helper to format article for NewsCard component
export function formatArticleForCard(article: Article) {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt || undefined,
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

  if (diffMins < 60) {
    return `${diffMins} min temu`;
  } else if (diffHours < 24) {
    return `${diffHours} godz. temu`;
  } else if (diffDays < 7) {
    return `${diffDays} dni temu`;
  } else {
    return date.toLocaleDateString("pl-PL");
  }
}
