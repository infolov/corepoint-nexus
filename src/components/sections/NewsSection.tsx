import { NewsCard } from "@/components/news/NewsCard";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

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
}

export function NewsSection({ title, category, articles }: NewsSectionProps) {
  // Show 3 articles in MSN-style grid
  const gridArticles = articles.slice(0, 3);

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
        {gridArticles.map((article) => (
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
    </section>
  );
}
