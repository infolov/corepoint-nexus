import { NewsCard } from "./NewsCard";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  category: string;
  image: string;
  timestamp: string;
  badge?: "hot" | "trending" | "new" | "pilne";
  source?: string;
}

interface MSNSlotGridProps {
  articles: Article[];
  className?: string;
}

/**
 * MSN-style slot grid layout:
 * - Desktop: Slot 1 (large left), Slots 2-5 (small right column)
 * - Tablet: 2 columns
 * - Mobile: Single column
 * 
 * Card dimensions: 16:9 aspect ratio, height 180-250px
 */
export function MSNSlotGrid({ articles, className }: MSNSlotGridProps) {
  const { settings } = useDisplayMode();
  const isCompact = settings.mode === "compact" || settings.dataSaver;
  
  if (articles.length === 0) return null;

  // Slot 1: Main featured article
  const mainArticle = articles[0];
  // Slots 2-5: Secondary articles
  const secondaryArticles = articles.slice(1, 5);
  // Remaining articles for standard grid
  const remainingArticles = articles.slice(5);

  // Compact mode: List view
  if (isCompact) {
    return (
      <div className={cn("space-y-2", className)}>
        {articles.slice(0, 8).map((article) => (
          <NewsCard
            key={article.id}
            id={article.id}
            title={article.title}
            category={article.category}
            image={article.image}
            timestamp={article.timestamp}
            source={article.source}
            badge={article.badge}
            variant="compact"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* MSN-style 5-slot layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        {/* Slot 1: Large featured card */}
        <div className="msn-slot-main">
          <NewsCard
            id={mainArticle.id}
            title={mainArticle.title}
            category={mainArticle.category}
            image={mainArticle.image}
            timestamp={mainArticle.timestamp}
            source={mainArticle.source}
            badge={mainArticle.badge}
            variant="hero"
            className="h-[280px] sm:h-[320px] lg:h-full lg:min-h-[400px]"
          />
        </div>

        {/* Slots 2-5: Secondary cards in column */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-2">
          {secondaryArticles.map((article, index) => (
            <NewsCard
              key={article.id}
              id={article.id}
              title={article.title}
              category={article.category}
              image={article.image}
              timestamp={article.timestamp}
              source={article.source}
              badge={article.badge}
              variant="msn-slot"
              className={cn(
                "msn-slot-secondary",
                index >= 2 && "hidden sm:block"
              )}
            />
          ))}
        </div>
      </div>

      {/* Remaining articles in standard grid */}
      {remainingArticles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {remainingArticles.map((article) => (
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
      )}
    </div>
  );
}
