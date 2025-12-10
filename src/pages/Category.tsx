import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { TrendingWidget } from "@/components/widgets/TrendingWidget";
import { AdBanner } from "@/components/widgets/AdBanner";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { Loader2 } from "lucide-react";
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
  rozrywka: { title: "Rozrywka", articles: lifestyleArticles },
};

// Generate more mock articles for each category
const generateMoreArticles = (baseArticles: Article[], category: string): Article[] => {
  const additionalArticles: Article[] = [];
  
  // Generate 5 cycles of articles for infinite scroll
  for (let cycle = 0; cycle < 5; cycle++) {
    baseArticles.forEach((article, i) => {
      additionalArticles.push({
        ...article,
        id: `${article.id}-cycle-${cycle}-${i}`,
        title: cycle === 0 ? article.title : `${article.title} ${cycle > 0 ? `#${cycle + 1}` : ''}`,
        timestamp: `${(cycle * baseArticles.length) + i + 1} godz. temu`,
        badge: cycle === 0 ? article.badge : undefined,
      });
    });
  }
  return additionalArticles;
};

// Responsive initial count based on device
const getInitialCount = () => {
  if (typeof window === "undefined") return 9;
  if (window.innerWidth < 640) return 6; // Mobile
  if (window.innerWidth < 1024) return 8; // Tablet
  return 12; // Desktop
};

const ARTICLES_PER_LOAD = 6;

export default function Category() {
  const { category } = useParams<{ category: string }>();
  const { settings: displaySettings } = useDisplayMode();
  const isCompact = displaySettings.mode === "compact" || displaySettings.dataSaver;
  
  const config = category ? categoryConfig[category] : null;
  const allArticles = config ? generateMoreArticles(config.articles, category!) : [];
  
  const [visibleCount, setVisibleCount] = useState(getInitialCount);
  
  const hasMore = visibleCount < allArticles.length;
  
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + ARTICLES_PER_LOAD, allArticles.length));
  }, [allArticles.length]);

  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);
  
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

  const heroArticle = allArticles[0];
  const gridArticles = allArticles.slice(1, visibleCount);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 text-senior">
          {config.title}
        </h1>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Hero Article - hidden in compact mode */}
            {heroArticle && !isCompact && (
              <div className="mb-4 sm:mb-6">
                <NewsCard
                  id={heroArticle.id}
                  title={heroArticle.title}
                  excerpt={heroArticle.excerpt}
                  category={heroArticle.category}
                  image={heroArticle.image}
                  timestamp={heroArticle.timestamp}
                  source={heroArticle.source}
                  badge={heroArticle.badge}
                  variant="hero"
                  className="h-[250px] sm:h-[350px] lg:h-[400px]"
                />
              </div>
            )}

            {/* Compact mode - list view */}
            {isCompact ? (
              <div className="space-y-1">
                {allArticles.slice(0, visibleCount).map((article) => (
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
            ) : (
              /* Grid of Articles - responsive columns */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
            )}

            {/* Infinite scroll trigger */}
            <div 
              ref={loadMoreRef} 
              className="py-6 sm:py-8 flex justify-center min-h-[60px]"
            >
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                  <span className="text-sm sm:text-base text-senior-sm">Ładowanie więcej artykułów...</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - hidden on mobile */}
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