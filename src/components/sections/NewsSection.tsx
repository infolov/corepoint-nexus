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
  // Show max 5 articles
  const displayArticles = articles.slice(0, 5);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link
          to={`/${category}`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Więcej
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Grid: 5 columns on desktop, 1 column on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {displayArticles.map((article) => (
          <NewsCard
            key={article.id}
            title={article.title}
            category={article.category}
            image={article.image}
            timestamp={article.timestamp}
            badge={article.badge}
            variant="default"
            className="h-full"
          />
        ))}
      </div>
    </section>
  );
}
