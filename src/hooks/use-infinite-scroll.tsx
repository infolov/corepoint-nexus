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
  // Larger root margin for mobile devices to trigger earlier
  const getResponsiveRootMargin = () => {
    if (typeof window === "undefined") return "200px";
    if (window.innerWidth < 640) return "300px"; // Mobile - load earlier
    if (window.innerWidth < 1024) return "250px"; // Tablet
    return "200px"; // Desktop
  };

  const { threshold = 0.1, rootMargin = getResponsiveRootMargin() } = options;
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        setIsLoading(true);
        // Faster loading for better UX
        setTimeout(() => {
          onLoadMore();
          setIsLoading(false);
        }, 300);
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    // Re-calculate rootMargin on mount and resize
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
  }, [handleObserver, threshold, rootMargin]);

  // Update observer on window resize
  useEffect(() => {
    const handleResize = () => {
      const element = loadMoreRef.current;
      if (!element || !observerRef.current) return;

      observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(handleObserver, {
        threshold,
        rootMargin: getResponsiveRootMargin(),
      });
      observerRef.current.observe(element);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleObserver, threshold]);

  return { loadMoreRef, isLoading };
}
