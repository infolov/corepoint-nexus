import { useEffect, useRef, useCallback, useState } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  options: UseInfiniteScrollOptions = {}
) {
  const getResponsiveRootMargin = () => {
    if (typeof window === "undefined") return "400px";
    if (window.innerWidth < 640) return "800px"; // Mobile - load much earlier
    if (window.innerWidth < 1024) return "600px"; // Tablet
    return "500px"; // Desktop
  };

  const { 
    threshold = 0.1, 
    rootMargin = getResponsiveRootMargin(),
  } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const lastLoadTime = useRef<number>(0);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      const now = Date.now();
      
      // Throttle to prevent too frequent calls (min 100ms between loads)
      if (entry.isIntersecting && hasMore && now - lastLoadTime.current > 100) {
        lastLoadTime.current = now;
        setIsLoading(true);
        onLoadMore();
        // Reset loading state after a short delay
        setTimeout(() => setIsLoading(false), 200);
      }
    },
    [hasMore, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const currentRootMargin = getResponsiveRootMargin();

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold,
      rootMargin: currentRootMargin,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, threshold]);

  return { loadMoreRef, isLoading };
}
