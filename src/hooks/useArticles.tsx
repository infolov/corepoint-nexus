import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type BadgeType = "hot" | "trending" | "new" | null;

export interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string;
  image: string;
  badge: BadgeType;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  timestamp: string;
}

function formatTimestamp(date: string): string {
  const now = new Date();
  const articleDate = new Date(date);
  const diffMs = now.getTime() - articleDate.getTime();
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
    return articleDate.toLocaleDateString("pl-PL");
  }
}

function parseBadge(badge: string | null): BadgeType {
  if (badge === "hot" || badge === "trending" || badge === "new") {
    return badge;
  }
  return null;
}

export function useArticles(category?: string) {
  return useQuery({
    queryKey: ["articles", category],
    queryFn: async (): Promise<Article[]> => {
      let query = supabase
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((article) => ({
        ...article,
        badge: parseBadge(article.badge),
        timestamp: formatTimestamp(article.created_at),
      }));
    },
  });
}

export function useFeaturedArticles() {
  return useQuery({
    queryKey: ["articles", "featured"],
    queryFn: async (): Promise<Article[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map((article) => ({
        ...article,
        badge: parseBadge(article.badge),
        timestamp: formatTimestamp(article.created_at),
      }));
    },
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ["article", id],
    queryFn: async (): Promise<Article | null> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        badge: parseBadge(data.badge),
        timestamp: formatTimestamp(data.created_at),
      };
    },
    enabled: !!id,
  });
}

export function useRelatedArticles(category: string, excludeId: string) {
  return useQuery({
    queryKey: ["articles", "related", category, excludeId],
    queryFn: async (): Promise<Article[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .eq("category", category)
        .neq("id", excludeId)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;

      return (data || []).map((article) => ({
        ...article,
        badge: parseBadge(article.badge),
        timestamp: formatTimestamp(article.created_at),
      }));
    },
    enabled: !!category && !!excludeId,
  });
}
