import { useState, useCallback } from "react";
import { NewsCard } from "@/components/news/NewsCard";
import { ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

interface NewsSectionProps {
  title: string;
  category: string;
  articles: Array<{
    id: string;
    title: string;
    excerpt?: string;
    category: string;
    image: string;
    timestamp: string;
    badge?: "hot" | "trending" | "new";
    source?: string;
  }>;
  initialCount?: number;
  loadMoreCount?: number;
  enableInfiniteScroll?: boolean;
}

export function NewsSection({ 
  title, 
  category, 
  articles,
  initialCount = 3,
  loadMoreCount = 3,
  enableInfiniteScroll = true
}: NewsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  
  const hasMore = enableInfiniteScroll && visibleCount < articles.length;
  
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + loadMoreCount, articles.length));
  }, [loadMoreCount, articles.length]);

  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);
  
  const visibleArticles = articles.slice(0, visibleCount);

  return (
    <section className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">{title}</h2>
        <Link
          to={`/${category}`}
          className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary hover:underline"
        >
          Więcej
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
      </div>

      {/* MSN-style grid - 3 cards in a row on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleArticles.map((article) => (
          <NewsCard
            key={article.id}
            id={article.id}
            title={article.title}
            category={article.category}
            image={article.image}
            timestamp={article.timestamp}
            source={article.source}
            badge={article.badge}
            variant="default"
          />
        ))}
      </div>

      {/* Infinite scroll trigger for this section */}
      {enableInfiniteScroll && hasMore && (
        <div 
          ref={loadMoreRef} 
          className="py-4 flex justify-center"
        >
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs sm:text-sm">Ładowanie...</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
