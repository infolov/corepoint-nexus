import { useEffect, useRef, useCallback, useState } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  debounceMs?: number;
}

export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  options: UseInfiniteScrollOptions = {}
) {
  // Responsive root margin - larger on mobile for earlier trigger
  const getResponsiveRootMargin = () => {
    if (typeof window === "undefined") return "300px";
    if (window.innerWidth < 640) return "400px"; // Mobile - load much earlier
    if (window.innerWidth < 1024) return "350px"; // Tablet
    return "300px"; // Desktop
  };

  const { 
    threshold = 0.01, 
    rootMargin = getResponsiveRootMargin(),
    debounceMs = 100
  } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        setIsLoading(true);
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Debounced load
        timeoutRef.current = setTimeout(() => {
          onLoadMore();
          setIsLoading(false);
        }, debounceMs);
      }
    },
    [hasMore, isLoading, onLoadMore, debounceMs]
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleObserver, threshold]);

  // Update observer on window resize with debounce
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const element = loadMoreRef.current;
        if (!element || !observerRef.current) return;

        observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(handleObserver, {
          threshold,
          rootMargin: getResponsiveRootMargin(),
        });
        observerRef.current.observe(element);
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [handleObserver, threshold]);

  return { loadMoreRef, isLoading };
}
