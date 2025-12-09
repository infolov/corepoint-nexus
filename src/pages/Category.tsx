import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { TrendingWidget } from "@/components/widgets/TrendingWidget";
import { AdBanner } from "@/components/widgets/AdBanner";
import {
  newsArticles,
  businessArticles,
  sportArticles,
  techArticles,
  lifestyleArticles,
  Article,
} from "@/data/mockNews";

const categoryConfig: Record<string, { title: string; articles: Article[] }> = {
  wiadomosci: { title: "Najnowsze Wiadomości", articles: newsArticles },
  biznes: { title: "Biznes i Finanse", articles: businessArticles },
  sport: { title: "Sport", articles: sportArticles },
  technologia: { title: "Technologia", articles: techArticles },
  lifestyle: { title: "Lifestyle", articles: lifestyleArticles },
  rozrywka: { title: "Rozrywka", articles: lifestyleArticles }, // Uses lifestyle as placeholder
};

// Generate more mock articles for each category
const generateMoreArticles = (baseArticles: Article[], category: string): Article[] => {
  const additionalArticles: Article[] = [
    ...baseArticles,
    ...baseArticles.map((article, i) => ({
      ...article,
      id: `${article.id}-extra-${i + 1}`,
      title: `${article.title} - kontynuacja`,
      timestamp: `${i + 10} godz. temu`,
      badge: undefined,
    })),
    ...baseArticles.map((article, i) => ({
      ...article,
      id: `${article.id}-extra-${i + 5}`,
      title: `Analiza: ${article.title}`,
      timestamp: `${i + 15} godz. temu`,
      badge: undefined,
    })),
  ];
  return additionalArticles;
};

export default function Category() {
  const { category } = useParams<{ category: string }>();
  
  const config = category ? categoryConfig[category] : null;
  
  if (!config) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-foreground">Kategoria nie znaleziona</h1>
        </main>
        <Footer />
      </div>
    );
  }

  const allArticles = generateMoreArticles(config.articles, category!);
  const heroArticle = allArticles[0];
  const gridArticles = allArticles.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          {config.title}
        </h1>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Hero Article */}
            {heroArticle && (
              <div className="mb-6">
                <NewsCard
                  title={heroArticle.title}
                  excerpt={heroArticle.excerpt}
                  category={heroArticle.category}
                  image={heroArticle.image}
                  timestamp={heroArticle.timestamp}
                  badge={heroArticle.badge}
                  variant="hero"
                  className="h-[400px]"
                />
              </div>
            )}

            {/* Grid of Articles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* Load More Button */}
            <div className="mt-8 text-center">
              <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Załaduj więcej
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
            <WeatherWidget />
            <AdBanner variant="square" />
            <TrendingWidget />
            <AdBanner variant="square" />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}