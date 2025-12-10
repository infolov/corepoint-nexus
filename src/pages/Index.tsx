import { useState, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MSNSlotGrid } from "@/components/news/MSNSlotGrid";
import { NewsCard } from "@/components/news/NewsCard";
import { AdBanner } from "@/components/widgets/AdBanner";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { Loader2, MapPin } from "lucide-react";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useArticles, formatArticleForCard } from "@/hooks/use-articles";
import {
  newsArticles,
  businessArticles,
  sportArticles,
  techArticles,
  lifestyleArticles,
} from "@/data/mockNews";

// Combine all mock articles
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
  const { settings } = useUserSettings();
  const { settings: displaySettings } = useDisplayMode();
  const { articles: dbArticles, loading: articlesLoading } = useArticles({ limit: 100 });

  // Always has more - infinite scroll
  const hasMore = true;

  const loadMore = useCallback(() => {
    setVisibleGrids((prev) => prev + GRIDS_PER_LOAD);
  }, []);

  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);

  // Combine and prepare all articles
  const allArticles = useMemo(() => {
    const formattedDbArticles = dbArticles.map(formatArticleForCard);
    
    if (formattedDbArticles.length > 0) {
      return formattedDbArticles;
    }
    
    // Use shuffled mock data as fallback
    return shuffleArray(allMockArticles);
  }, [dbArticles]);

  // Generate enough articles for infinite scroll by cycling
  const getArticlesForDisplay = useMemo(() => {
    const totalNeeded = visibleGrids * ARTICLES_PER_GRID + 12; // +12 for hero section
    const result = [];
    
    for (let i = 0; i < totalNeeded; i++) {
      result.push(allArticles[i % allArticles.length]);
    }
    
    return result;
  }, [allArticles, visibleGrids]);

  // Get region label for display
  const regionLabels: Record<string, string> = {
    mazowieckie: "Mazowieckie",
    malopolskie: "Małopolskie",
    slaskie: "Śląskie",
    wielkopolskie: "Wielkopolskie",
    pomorskie: "Pomorskie",
    dolnoslaskie: "Dolnośląskie",
    lodzkie: "Łódzkie",
    "kujawsko-pomorskie": "Kujawsko-Pomorskie",
    podkarpackie: "Podkarpackie",
    lubelskie: "Lubelskie",
    "warminsko-mazurskie": "Warmińsko-Mazurskie",
    zachodniopomorskie: "Zachodniopomorskie",
    podlaskie: "Podlaskie",
    swietokrzyskie: "Świętokrzyskie",
    opolskie: "Opolskie",
    lubuskie: "Lubuskie",
  };

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

      <main className="container py-4 sm:py-6">
        {/* MSN-style Hero Section */}
        <section className="mb-6 sm:mb-8">
          <MSNSlotGrid articles={heroArticles} />
        </section>

        {/* Region indicator */}
        {settings.voivodeship && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-senior-sm">
              Artykuły dla regionu: <strong className="text-foreground">{regionLabels[settings.voivodeship] || settings.voivodeship}</strong>
            </span>
          </div>
        )}

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
