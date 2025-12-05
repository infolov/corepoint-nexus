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
  const mainArticle = articles[0];
  const sideArticles = articles.slice(1, 4);

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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Main Article */}
        {mainArticle && (
          <NewsCard
            title={mainArticle.title}
            excerpt={mainArticle.excerpt}
            category={mainArticle.category}
            image={mainArticle.image}
            timestamp={mainArticle.timestamp}
            badge={mainArticle.badge}
          />
        )}

        {/* Side Articles */}
        <div className="space-y-4">
          {sideArticles.map((article) => (
            <NewsCard
              key={article.id}
              title={article.title}
              category={article.category}
              image={article.image}
              timestamp={article.timestamp}
              badge={article.badge}
              variant="horizontal"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
