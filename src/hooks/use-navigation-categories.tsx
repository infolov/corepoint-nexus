import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES as FALLBACK_CATEGORIES, Category, SubCategory, SubSubCategory } from "@/data/categories";

interface DbCategory {
  id: string;
  name: string;
  slug: string;
  parent_slug: string | null;
  display_order: number;
  is_active: boolean;
}

// Session cache to prevent redundant fetches
let cachedCategories: Category[] | null = null;
let cachedDbCategories: DbCategory[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Standalone function to check if a category is active.
 * Can be called outside of React components.
 */
export async function checkCategoryActive(slug: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("is_active")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Error checking category status:", error);
      return true; // Fallback to true on error
    }

    // If category doesn't exist in DB, assume it's active (for static categories)
    if (!data) return true;

    return data.is_active;
  } catch (err) {
    console.error("Error in checkCategoryActive:", err);
    return true;
  }
}

/**
 * Hook that fetches active categories from the database and transforms them
 * into the hierarchical structure expected by CategoryBar.
 * Falls back to static CATEGORIES if fetch fails.
 */
export function useNavigationCategories() {
  const [dbCategories, setDbCategories] = useState<DbCategory[]>(cachedDbCategories || []);
  const [loading, setLoading] = useState(!cachedDbCategories);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      // Check session cache first
      const now = Date.now();
      if (cachedCategories && (now - cacheTimestamp) < CACHE_DURATION_MS) {
        setLoading(false);
        return;
      }

      try {
        // Fetch only active categories - ensures hidden categories
        // don't appear for ANY user type (admin, logged-in, anonymous)
        const { data, error: fetchError } = await supabase
          .from("categories")
          .select("id, name, slug, parent_slug, display_order, is_active")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (fetchError) throw fetchError;

        setDbCategories(data || []);
        cachedDbCategories = data || [];
        cacheTimestamp = now;
      } catch (err) {
        console.error("Error fetching navigation categories:", err);
        setError("Nie udało się pobrać kategorii");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Transform flat DB categories into hierarchical structure
  const categories = useMemo<Category[]>(() => {
    if (dbCategories.length === 0) {
      // Use cached result if available
      if (cachedCategories) return cachedCategories;
      // Fall back to static categories during loading/error
      if (loading || error) return FALLBACK_CATEGORIES;
      // No categories in DB - return minimal set
      return [{ name: "Wszystko", slug: "all", subcategories: [] }];
    }

    // Build set of active slugs for fast lookup
    const activeSlugSet = new Set(dbCategories.map(c => c.slug));

    // Find root categories (no parent_slug)
    const rootCategories = dbCategories.filter(c => !c.parent_slug);

    // Build subcategory map: parent_slug -> children
    const childrenMap = new Map<string, DbCategory[]>();
    dbCategories.forEach(c => {
      if (c.parent_slug) {
        const existing = childrenMap.get(c.parent_slug) || [];
        existing.push(c);
        childrenMap.set(c.parent_slug, existing);
      }
    });

    // Transform to Category[] structure
    const result: Category[] = [];

    // Always add "Wszystko" as first item if not in DB
    if (!activeSlugSet.has("all")) {
      result.push({ name: "Wszystko", slug: "all", subcategories: [] });
    }

    rootCategories.forEach(root => {
      const children = childrenMap.get(root.slug) || [];
      
      // Build subcategories
      const subcategories: SubCategory[] = children
        .sort((a, b) => a.display_order - b.display_order)
        .map(child => {
          const grandchildren = childrenMap.get(child.slug) || [];
          
          const subSubcategories: SubSubCategory[] = grandchildren
            .sort((a, b) => a.display_order - b.display_order)
            .map(gc => ({
              name: gc.name,
              slug: gc.slug,
            }));

          return {
            name: child.name,
            slug: child.slug,
            subcategories: subSubcategories.length > 0 ? subSubcategories : undefined,
          };
        });

      result.push({
        name: root.name,
        slug: root.slug,
        subcategories,
      });
    });

    // Cache the result
    cachedCategories = result;

    return result;
  }, [dbCategories, loading, error]);

  // Helper to check if a category slug is active (exists in DB result)
  const isCategoryActive = (slug: string): boolean => {
    if (dbCategories.length === 0) return true; // During loading, assume all are active
    return dbCategories.some(c => c.slug === slug);
  };

  // Clear cache (useful for admin after making changes)
  const clearCache = () => {
    cachedCategories = null;
    cachedDbCategories = null;
    cacheTimestamp = 0;
  };

  // Set of active category slugs AND names for filtering articles
  const activeCategorySlugs = useMemo(() => {
    if (dbCategories.length === 0 && (loading || error)) return null; // Not yet loaded
    return new Set(dbCategories.map(c => c.slug));
  }, [dbCategories, loading, error]);

  // Build a comprehensive set of active category names/slugs for article filtering.
  // Key logic: subcategories whose parent is hidden are also treated as hidden.
  const activeCategoryNames = useMemo(() => {
    if (dbCategories.length === 0 && (loading || error)) return null;

    const activeSlugs = new Set(dbCategories.map(c => c.slug));
    const names = new Set<string>();

    // Common name variations for RSS feeds that use different names than DB
    const categoryVariations: Record<string, string[]> = {
      "wiadomości": ["wiadomosci", "news", "polska"],
      "sport": ["sports"],
      "biznes": ["business", "ekonomia"],
      "nauka i technologia": ["technologia", "nauka", "tech", "technology", "science"],
      "lifestyle": ["styl życia", "styl zycia"],
      "rozrywka": ["entertainment"],
      "kultura": ["culture"],
      "motoryzacja": ["auto", "automotive", "samochody"],
      "zdrowie": ["health"],
      "świat": ["world", "swiat"],
      "finanse": ["finance"],
      "prawo": ["law", "prawo"],
    };

    dbCategories.forEach(c => {
      // Skip subcategories whose parent is NOT in the active set
      // (parent is hidden → subcategory should also be treated as hidden)
      if (c.parent_slug && !activeSlugs.has(c.parent_slug)) return;

      names.add(c.name.toLowerCase());
      names.add(c.slug.toLowerCase());

      // Add known variations so RSS articles with alternate names get matched
      const nameKey = c.name.toLowerCase();
      if (categoryVariations[nameKey]) {
        categoryVariations[nameKey].forEach(v => names.add(v));
      }
    });

    return names;
  }, [dbCategories, loading, error]);

  return {
    categories,
    loading,
    error,
    isCategoryActive,
    clearCache,
    dbCategories,
    activeCategorySlugs,
    activeCategoryNames,
  };
}
