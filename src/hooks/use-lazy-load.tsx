import { useState, useEffect, useRef, useCallback } from "react";

interface UseLazyLoadOptions {
  /** Margin around the root (viewport) for triggering earlier */
  rootMargin?: string;
  /** Visibility threshold (0-1) */
  threshold?: number;
  /** Only trigger once (default: true) */
  triggerOnce?: boolean;
  /** Initial state before intersection check */
  initialVisible?: boolean;
}

interface UseLazyLoadResult<T extends HTMLElement> {
  /** Ref to attach to the element */
  ref: React.RefObject<T>;
  /** Whether the element is currently visible */
  isVisible: boolean;
  /** Whether the element has ever been visible */
  hasBeenVisible: boolean;
}

/**
 * Hook for lazy loading elements based on Intersection Observer
 * Perfect for ads, images, and other heavy content outside viewport
 */
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyLoadOptions = {}
): UseLazyLoadResult<T> {
  const {
    rootMargin = "200px", // Start loading 200px before entering viewport
    threshold = 0,
    triggerOnce = true,
    initialVisible = false,
  } = options;

  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [hasBeenVisible, setHasBeenVisible] = useState(initialVisible);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If already triggered and triggerOnce, skip observer
    if (triggerOnce && hasBeenVisible) return;

    // Fallback for browsers without IntersectionObserver
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visible = entry.isIntersecting;
          setIsVisible(visible);
          
          if (visible && !hasBeenVisible) {
            setHasBeenVisible(true);
            
            if (triggerOnce) {
              observer.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin, threshold, triggerOnce, hasBeenVisible]);

  return { ref: ref as React.RefObject<T>, isVisible, hasBeenVisible };
}

/**
 * Wrapper component for lazy loading children
 */
interface LazyLoadWrapperProps {
  children: React.ReactNode;
  /** Placeholder to show before content loads */
  placeholder?: React.ReactNode;
  /** Intersection Observer options */
  rootMargin?: string;
  threshold?: number;
  /** CSS class for the wrapper */
  className?: string;
  /** Inline styles for the wrapper */
  style?: React.CSSProperties;
  /** Whether to keep showing placeholder after visible (for debugging) */
  debugMode?: boolean;
  /** Callback when element becomes visible */
  onVisible?: () => void;
}

export function LazyLoadWrapper({
  children,
  placeholder,
  rootMargin = "200px",
  threshold = 0,
  className,
  style,
  debugMode = false,
  onVisible,
}: LazyLoadWrapperProps) {
  const { ref, hasBeenVisible, isVisible } = useLazyLoad<HTMLDivElement>({
    rootMargin,
    threshold,
    triggerOnce: true,
  });

  // Trigger callback when first visible
  useEffect(() => {
    if (hasBeenVisible && onVisible) {
      onVisible();
    }
  }, [hasBeenVisible, onVisible]);

  const showDebug = debugMode && typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
  );

  return (
    <div ref={ref} className={className} style={style}>
      {hasBeenVisible ? (
        <>
          {children}
          {showDebug && (
            <div className="absolute top-0 left-0 bg-green-500 text-white text-[8px] px-1 rounded-br z-20">
              LOADED {isVisible ? '👁️' : '📦'}
            </div>
          )}
        </>
      ) : (
        <>
          {placeholder}
          {showDebug && (
            <div className="absolute top-0 left-0 bg-yellow-500 text-black text-[8px] px-1 rounded-br z-20">
              LAZY
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default useLazyLoad;
