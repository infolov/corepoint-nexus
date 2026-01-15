import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface SavedArticle {
  id: string;
  article_id: string;
  article_title: string;
  article_image: string | null;
  article_category: string | null;
  article_excerpt: string | null;
  article_url: string | null;
  saved_at: string;
}

export function useSavedArticles() {
  const { user } = useAuth();
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());

  const fetchSavedArticles = useCallback(async () => {
    if (!user) {
      setSavedArticles([]);
      setSavedArticleIds(new Set());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("saved_articles")
        .select("*")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (error) throw error;

      setSavedArticles(data || []);
      setSavedArticleIds(new Set((data || []).map(a => a.article_id)));
    } catch (error) {
      console.error("Error fetching saved articles:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedArticles();
  }, [fetchSavedArticles]);

  const saveArticle = useCallback(async (article: {
    id: string;
    title: string;
    image?: string;
    category?: string;
    excerpt?: string;
    url?: string;
  }) => {
    if (!user) {
      toast.error("Zaloguj się, aby zapisywać artykuły");
      return false;
    }

    try {
      const { error } = await supabase
        .from("saved_articles")
        .insert({
          user_id: user.id,
          article_id: article.id,
          article_title: article.title,
          article_image: article.image || null,
          article_category: article.category || null,
          article_excerpt: article.excerpt || null,
          article_url: article.url || null,
        });

      if (error) {
        if (error.code === "23505") {
          toast.info("Artykuł jest już zapisany");
          return false;
        }
        throw error;
      }

      setSavedArticleIds(prev => new Set([...prev, article.id]));
      toast.success("Artykuł zapisany");
      fetchSavedArticles();
      return true;
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Nie udało się zapisać artykułu");
      return false;
    }
  }, [user, fetchSavedArticles]);

  const unsaveArticle = useCallback(async (articleId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("saved_articles")
        .delete()
        .eq("user_id", user.id)
        .eq("article_id", articleId);

      if (error) throw error;

      setSavedArticleIds(prev => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
      toast.success("Artykuł usunięty z zapisanych");
      fetchSavedArticles();
      return true;
    } catch (error) {
      console.error("Error unsaving article:", error);
      toast.error("Nie udało się usunąć artykułu");
      return false;
    }
  }, [user, fetchSavedArticles]);

  const toggleSave = useCallback(async (article: {
    id: string;
    title: string;
    image?: string;
    category?: string;
    excerpt?: string;
    url?: string;
  }) => {
    if (savedArticleIds.has(article.id)) {
      return unsaveArticle(article.id);
    } else {
      return saveArticle(article);
    }
  }, [savedArticleIds, saveArticle, unsaveArticle]);

  const isArticleSaved = useCallback((articleId: string) => {
    return savedArticleIds.has(articleId);
  }, [savedArticleIds]);

  return {
    savedArticles,
    loading,
    saveArticle,
    unsaveArticle,
    toggleSave,
    isArticleSaved,
    refetch: fetchSavedArticles,
  };
}
