import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function useRecentlyViewed() {
  const { user } = useAuth();

  const trackArticleView = async (articleId: string, category: string) => {
    if (!user) return;

    try {
      // Upsert to handle duplicate views
      await supabase.from("user_recently_viewed").upsert(
        {
          user_id: user.id,
          article_id: articleId,
          category: category,
          viewed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,article_id",
        }
      );
    } catch (error) {
      console.error("Error tracking article view:", error);
    }
  };

  const getRecentlyViewedCategories = async (): Promise<string[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("user_recently_viewed")
        .select("category")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get unique categories, maintaining order of most recent
      const categories = data.map((item) => item.category);
      return [...new Set(categories)];
    } catch (error) {
      console.error("Error getting recently viewed categories:", error);
      return [];
    }
  };

  return { trackArticleView, getRecentlyViewedCategories };
}
