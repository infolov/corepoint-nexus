import { NewsCard } from "@/components/news/NewsCard";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Article } from "@/hooks/useArticles";

interface NewsSectionProps {
  title: string;
  category: string;
  articles: Article[];
}

export function NewsSection({ title, category, articles }: NewsSectionProps) {
  const displayArticles = articles.slice(0, 4);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link
          to={`/${category}`}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Więcej
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {displayArticles.map((article, index) => (
          <NewsCard
            key={article.id}
            id={article.id}
            title={article.title}
            category={article.category}
            image={article.image}
            timestamp={article.timestamp}
            badge={index === 0 ? "trending" : undefined}
            variant="small"
          />
        ))}
      </div>
    </section>
  );
}
