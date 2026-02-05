import { NewsCard } from "@/components/news/NewsCard";
import { Sparkles } from "lucide-react";

interface RecommendedArticle {
  id: string;
  title: string;
  image: string;
  category: string;
  timestamp?: string;
  source?: string;
}

interface RecommendedArticlesProps {
  articles: RecommendedArticle[];
  title?: string;
}

export function RecommendedArticles({ 
  articles, 
  title = "Polecane dla Ciebie" 
}: RecommendedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-border/50">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.map((article) => (
          <NewsCard
            key={article.id}
            id={article.id}
            title={article.title}
            image={article.image}
            category={article.category}
            timestamp={article.timestamp || "Dzisiaj"}
            source={article.source || "Informacje.pl"}
            variant="msn-slot"
          />
        ))}
      </div>
    </section>
  );
}
