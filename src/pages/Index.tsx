import { useState, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/navigation/CategoryBar";
import { MSNSlotGrid } from "@/components/news/MSNSlotGrid";
import { NewsCard } from "@/components/news/NewsCard";
import { AdBanner } from "@/components/widgets/AdBanner";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { Loader2, RefreshCw } from "lucide-react";
import { useArticles, formatArticleForCard } from "@/hooks/use-articles";
import { useRSSArticles, formatRSSArticleForCard } from "@/hooks/use-rss-articles";
import { Button } from "@/components/ui/button";
import {
  newsArticles,
  businessArticles,
  sportArticles,
  techArticles,
  lifestyleArticles,
} from "@/data/mockNews";

// Combine all mock articles as fallback
const allMockArticles = [
  ...newsArticles,
  ...businessArticles,
  ...sportArticles,
  ...techArticles,
  ...lifestyleArticles,
];

// Shuffle articles for variety
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const ARTICLES_PER_GRID = 12; // 4x3 grid
const INITIAL_GRIDS = 2;
const GRIDS_PER_LOAD = 1;

const Index = () => {
  const [visibleGrids, setVisibleGrids] = useState(INITIAL_GRIDS);
  const [activeCategory, setActiveCategory] = useState("all");
  const { settings: displaySettings } = useDisplayMode();
  const { articles: dbArticles, loading: dbLoading } = useArticles({ limit: 100 });
  const { articles: rssArticles, loading: rssLoading, refetch: refetchRSS } = useRSSArticles();

  // Always has more - infinite scroll
  const hasMore = true;

  const loadMore = useCallback(() => {
    setVisibleGrids((prev) => prev + GRIDS_PER_LOAD);
  }, []);

  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);

  // Combine RSS articles with DB articles, preferring RSS
  const allArticles = useMemo(() => {
    // Format RSS articles
    const formattedRSSArticles = rssArticles.map(formatRSSArticleForCard);
    
    // Format DB articles
    const formattedDbArticles = dbArticles.map(formatArticleForCard);
    
    // Prioritize RSS articles, then DB articles, then mock as fallback
    let articles = [];
    if (formattedRSSArticles.length > 0) {
      // Combine RSS with DB articles for more variety
      const combined = [...formattedRSSArticles, ...formattedDbArticles];
      articles = shuffleArray(combined);
    } else if (formattedDbArticles.length > 0) {
      articles = formattedDbArticles;
    } else {
      // Use shuffled mock data as fallback
      articles = shuffleArray(allMockArticles);
    }

    // Filter by category if not "all"
    if (activeCategory !== "all") {
      const categoryMap: Record<string, string[]> = {
        wiadomosci: ["Wiadomości", "Polska", "News"],
        biznes: ["Biznes", "Finanse", "Ekonomia"],
        sport: ["Sport", "Piłka nożna", "Koszykówka"],
        technologia: ["Technologia", "Tech", "IT"],
        lifestyle: ["Lifestyle", "Moda", "Uroda"],
        rozrywka: ["Rozrywka", "Film", "Muzyka"],
        zdrowie: ["Zdrowie", "Medycyna"],
        nauka: ["Nauka", "Edukacja"],
        motoryzacja: ["Motoryzacja", "Auto"],
        podroze: ["Podróże", "Turystyka"],
        kultura: ["Kultura", "Sztuka"],
        polityka: ["Polityka"],
        swiat: ["Świat", "Zagranica"],
      };
      const categoryNames = categoryMap[activeCategory] || [];
      articles = articles.filter(a => 
        categoryNames.some(cat => a.category?.toLowerCase().includes(cat.toLowerCase()))
      );
    }

    return articles;
  }, [rssArticles, dbArticles, activeCategory]);

  // Generate enough articles for infinite scroll by cycling
  const getArticlesForDisplay = useMemo(() => {
    const totalNeeded = visibleGrids * ARTICLES_PER_GRID + 12; // +12 for hero section
    const result = [];
    
    for (let i = 0; i < totalNeeded; i++) {
      result.push(allArticles[i % allArticles.length]);
    }
    
    return result;
  }, [allArticles, visibleGrids]);

  // First 12 articles for MSN-style hero section
  const heroArticles = getArticlesForDisplay.slice(0, 12);
  
  // Remaining articles for grid sections
  const feedArticles = getArticlesForDisplay.slice(12);

  // Split feed articles into grids of 12
  const articleGrids = [];
  for (let i = 0; i < visibleGrids; i++) {
    const startIndex = i * ARTICLES_PER_GRID;
    const gridArticles = feedArticles.slice(startIndex, startIndex + ARTICLES_PER_GRID);
    if (gridArticles.length > 0) {
      articleGrids.push(gridArticles);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Floating Category Bar */}
      <CategoryBar 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory} 
      />

      <main className="container py-4 sm:py-6">
        {/* MSN-style Hero Section */}
        <section className="mb-6 sm:mb-8">
          <MSNSlotGrid articles={heroArticles} />
        </section>

        {/* RSS status and refresh */}
        <div className="mb-4 flex items-center justify-end gap-2">
          {rssArticles.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {rssArticles.length} artykułów z RSS
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refetchRSS}
            disabled={rssLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${rssLoading ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
        </div>

        {/* Main Content - Unified feed without category divisions */}
        <div className="space-y-6 sm:space-y-8">
          {articleGrids.map((gridArticles, gridIndex) => (
            <div key={`grid-${gridIndex}`}>
              {/* Ad Banner before each grid */}
              {!displaySettings.dataSaver && (
                <div className="mb-6 sm:mb-8">
                  <AdBanner variant="horizontal" className="w-full" />
                </div>
              )}

              {/* 4x3 Article Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {gridArticles.map((article, articleIndex) => (
                  <NewsCard
                    key={`${article.id}-${gridIndex}-${articleIndex}`}
                    id={article.id}
                    title={article.title}
                    category={article.category}
                    image={article.image}
                    timestamp={article.timestamp}
                    badge={article.badge}
                    source={article.source}
                    sourceUrl={article.sourceUrl}
                    variant="default"
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Load more trigger - infinite scroll */}
          <div 
            ref={loadMoreRef} 
            className="py-10 sm:py-12 md:py-16 flex justify-center min-h-[150px]"
          >
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin" />
                <span className="text-senior-base">Ładowanie...</span>
              </div>
            )}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Index;
