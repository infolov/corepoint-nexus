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
  }>;
}

export function NewsSection({ title, category, articles }: NewsSectionProps) {
  // Show first article as hero, rest as grid
  const heroArticle = articles[0];
  const gridArticles = articles.slice(1, 5);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <Link
          to={`/${category}`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Więcej
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* MSN-style layout: 1 large + smaller grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Hero article - spans 2 columns */}
        {heroArticle && (
          <div className="col-span-2 row-span-2">
            <NewsCard
              title={heroArticle.title}
              category={heroArticle.category}
              image={heroArticle.image}
              timestamp={heroArticle.timestamp}
              badge={heroArticle.badge}
              variant="hero"
              className="h-full"
            />
          </div>
        )}
        
        {/* Grid of smaller articles */}
        {gridArticles.map((article) => (
          <NewsCard
            key={article.id}
            title={article.title}
            category={article.category}
            image={article.image}
            timestamp={article.timestamp}
            badge={article.badge}
            variant="default"
          />
        ))}
      </div>
    </section>
  );
}
