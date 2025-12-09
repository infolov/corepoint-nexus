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
  // Show first article as hero, rest as grid
  const heroArticle = articles[0];
  const gridArticles = articles.slice(1, 5);

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

      {/* Responsive layout: stacked on mobile, grid on tablet/desktop */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Hero article - full width on mobile, spans 2 columns on desktop */}
        {heroArticle && (
          <div className="w-full">
            <NewsCard
              id={heroArticle.id}
              title={heroArticle.title}
              category={heroArticle.category}
              image={heroArticle.image}
              timestamp={heroArticle.timestamp}
              source={heroArticle.source}
              badge={heroArticle.badge}
              variant="hero"
              className="aspect-[16/10] sm:aspect-[16/9] md:aspect-[16/8]"
            />
          </div>
        )}
        
        {/* Grid of smaller articles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
              className="aspect-[4/3]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
