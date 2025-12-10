import { NewsCard } from "./NewsCard";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { cn } from "@/lib/utils";
import { Flame, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

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
 * MSN.com-style layout:
 * Row 1: [Large featured] [Best articles list] [Medium card] [Medium card]
 * Row 2: [Card] [Card] [Card] continuing grid
 */
export function MSNSlotGrid({ articles, className }: MSNSlotGridProps) {
  const { settings } = useDisplayMode();
  const isCompact = settings.mode === "compact" || settings.dataSaver;
  
  if (articles.length === 0) return null;

  // MSN Layout distribution
  const mainArticle = articles[0]; // Large left card
  const listArticles = articles.slice(1, 4); // "Najlepsze artykuły" list
  const rightCards = articles.slice(4, 6); // Two medium cards on right
  const gridArticles = articles.slice(6); // Remaining for grid below

  // Compact mode: List view
  if (isCompact) {
    return (
      <div className={cn("space-y-1", className)}>
        {articles.slice(0, 10).map((article) => (
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
    <div className={cn("space-y-4", className)}>
      {/* MSN-style main row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Large featured card - spans 4 columns */}
        <div className="lg:col-span-4">
          <NewsCard
            id={mainArticle.id}
            title={mainArticle.title}
            category={mainArticle.category}
            image={mainArticle.image}
            timestamp={mainArticle.timestamp}
            source={mainArticle.source}
            badge={mainArticle.badge}
            variant="hero"
            className="h-[280px] sm:h-[320px] lg:h-[400px]"
          />
        </div>

        {/* "Najlepsze artykuły" list - spans 3 columns */}
        <div className="lg:col-span-3 bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <Flame className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-foreground">Najlepsze artykuły</h3>
          </div>
          <div className="space-y-0">
            {listArticles.map((article, index) => (
              <NewsCard
                key={article.id}
                id={article.id}
                title={article.title}
                category={article.category}
                image={article.image}
                timestamp={article.timestamp}
                source={article.source}
                badge={index === 0 ? "pilne" : article.badge}
                variant="compact"
              />
            ))}
          </div>
          <Link 
            to="/wiadomosci" 
            className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-border text-sm text-primary hover:underline"
          >
            Więcej artykułów
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Two medium cards on right - spans 5 columns */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rightCards.map((article) => (
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
              className="h-[180px] sm:h-[192px]"
            />
          ))}
        </div>
      </div>

      {/* Second row - 3 cards grid (MSN style) */}
      {gridArticles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gridArticles.slice(0, 3).map((article) => (
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
