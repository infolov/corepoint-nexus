import { useState, useEffect } from "react";
import { checkCategoryActive } from "./use-navigation-categories";

interface UseCategoryStatusResult {
  isActive: boolean;
  loading: boolean;
  checked: boolean;
}

/**
 * Hook to check if a category is active in the database.
 * Returns loading state and active status.
 */
export function useCategoryStatus(slug: string | undefined): UseCategoryStatusResult {
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!slug || slug === "all") {
      setIsActive(true);
      setLoading(false);
      setChecked(true);
      return;
    }

    const checkStatus = async () => {
      setLoading(true);
      try {
        const active = await checkCategoryActive(slug);
        setIsActive(active);
      } catch (err) {
        console.error("Error checking category status:", err);
        setIsActive(true); // Fallback to true on error
      } finally {
        setLoading(false);
        setChecked(true);
      }
    };

    checkStatus();
  }, [slug]);

  return { isActive, loading, checked };
}
