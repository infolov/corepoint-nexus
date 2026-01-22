import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_slug: string | null;
  keywords: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentSource {
  id: string;
  category_id: string;
  name: string;
  url: string;
  type: "rss" | "scraping";
  is_active: boolean;
  selector: string | null;
  last_fetched_at: string | null;
  fetch_interval_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithSources extends Category {
  sources: ContentSource[];
  sourcesCount: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryWithSources[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use direct queries with type casting since types may not be regenerated yet
      const { data: rawCategories, error: catError } = await supabase
        .from("categories" as any)
        .select("*")
        .order("display_order", { ascending: true });

      if (catError) throw catError;

      const { data: rawSources, error: srcError } = await supabase
        .from("content_sources" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (srcError) throw srcError;

      const categoriesWithSources: CategoryWithSources[] = (rawCategories || []).map((cat: any) => {
        const catSources = (rawSources || []).filter((s: any) => s.category_id === cat.id);
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parent_slug: cat.parent_slug,
          keywords: cat.keywords || [],
          display_order: cat.display_order,
          is_active: cat.is_active,
          created_at: cat.created_at,
          updated_at: cat.updated_at,
          sources: catSources.map((s: any) => ({
            id: s.id,
            category_id: s.category_id,
            name: s.name,
            url: s.url,
            type: s.type as "rss" | "scraping",
            is_active: s.is_active,
            selector: s.selector,
            last_fetched_at: s.last_fetched_at,
            fetch_interval_minutes: s.fetch_interval_minutes,
            created_at: s.created_at,
            updated_at: s.updated_at,
          })),
          sourcesCount: catSources.filter((s: any) => s.is_active).length,
        };
      });

      setCategories(categoriesWithSources);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Nie udało się pobrać kategorii");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (category: Omit<Category, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("categories" as any)
        .insert(category as any)
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Kategoria została utworzona");
      fetchCategories();
      return data;
    } catch (err) {
      console.error("Error creating category:", err);
      toast.error("Nie udało się utworzyć kategorii");
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const { error } = await supabase
        .from("categories" as any)
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Kategoria została zaktualizowana");
      fetchCategories();
    } catch (err) {
      console.error("Error updating category:", err);
      toast.error("Nie udało się zaktualizować kategorii");
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("categories" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Kategoria została usunięta");
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error("Nie udało się usunąć kategorii");
      throw err;
    }
  };

  // Source management
  const createSource = async (source: Omit<ContentSource, "id" | "created_at" | "updated_at" | "last_fetched_at">) => {
    try {
      const { data, error } = await supabase
        .from("content_sources" as any)
        .insert(source as any)
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Źródło zostało dodane");
      fetchCategories();
      return data;
    } catch (err) {
      console.error("Error creating source:", err);
      toast.error("Nie udało się dodać źródła");
      throw err;
    }
  };

  const updateSource = async (id: string, updates: Partial<ContentSource>) => {
    try {
      const { error } = await supabase
        .from("content_sources" as any)
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Źródło zostało zaktualizowane");
      fetchCategories();
    } catch (err) {
      console.error("Error updating source:", err);
      toast.error("Nie udało się zaktualizować źródła");
      throw err;
    }
  };

  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from("content_sources" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Źródło zostało usunięte");
      fetchCategories();
    } catch (err) {
      console.error("Error deleting source:", err);
      toast.error("Nie udało się usunąć źródła");
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createSource,
    updateSource,
    deleteSource,
  };
}
