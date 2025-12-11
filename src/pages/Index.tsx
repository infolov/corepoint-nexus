import { useState, useCallback, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/navigation/CategoryBar";
import { NewsCard } from "@/components/news/NewsCard";
import { AdBanner } from "@/components/widgets/AdBanner";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, RefreshCw } from "lucide-react";
import { useArticles, formatArticleForCard } from "@/hooks/use-articles";
import { useRSSArticles, formatRSSArticleForCard } from "@/hooks/use-rss-articles";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  const { articles: rssArticles, loading: rssLoading, refetch: refetchRSS, lastUpdated } = useRSSArticles();
  const { user } = useAuth();
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [recentCategories, setRecentCategories] = useState<string[]>([]);

  // Load user preferences for personalization
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) {
        setUserPreferences([]);
        setRecentCategories([]);
        return;
      }

      try {
        // Get notification preferences (selected categories)
        const { data: prefData } = await supabase
          .from("user_notification_preferences")
          .select("categories")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prefData?.categories) {
          setUserPreferences(prefData.categories);
        }

        // Get recently viewed categories
        const { data: recentData } = await supabase
          .from("user_recently_viewed")
          .select("category")
          .eq("user_id", user.id)
          .order("viewed_at", { ascending: false })
          .limit(30);

        if (recentData) {
          const categories = [...new Set(recentData.map(item => item.category))];
          setRecentCategories(categories);
        }
      } catch (error) {
        console.error("Error loading user preferences:", error);
      }
    };

    loadUserPreferences();
  }, [user]);

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

  // Personalize articles for logged-in users
  const personalizedArticles = useMemo(() => {
    if (!user || (userPreferences.length === 0 && recentCategories.length === 0)) {
      return allArticles;
    }

    // Combine preferences and recent categories
    const interestCategories = [...new Set([...userPreferences, ...recentCategories])];
    
    // Score articles based on user interests
    const scoredArticles = allArticles.map(article => {
      let score = 0;
      const articleCategory = article.category?.toLowerCase() || "";
      
      interestCategories.forEach((interest, index) => {
        if (articleCategory.includes(interest.toLowerCase())) {
          // Higher score for earlier interests (more recent/important)
          score += (interestCategories.length - index) * 2;
        }
      });
      
      return { article, score };
    });

    // Sort by score (highest first), then shuffle within same score for variety
    scoredArticles.sort((a, b) => b.score - a.score);

    // Mix personalized with general content (70% personalized, 30% general for variety)
    const personalized = scoredArticles.filter(s => s.score > 0).map(s => s.article);
    const general = scoredArticles.filter(s => s.score === 0).map(s => s.article);
    
    const result = [];
    let pIndex = 0;
    let gIndex = 0;
    
    for (let i = 0; i < allArticles.length; i++) {
      // Every 4th article can be general for variety
      if (i % 4 === 3 && gIndex < general.length) {
        result.push(general[gIndex++]);
      } else if (pIndex < personalized.length) {
        result.push(personalized[pIndex++]);
      } else if (gIndex < general.length) {
        result.push(general[gIndex++]);
      }
    }

    return result;
  }, [allArticles, user, userPreferences, recentCategories]);

  // Generate enough articles for infinite scroll by cycling
  const getArticlesForDisplay = useMemo(() => {
    const articlesToUse = user ? personalizedArticles : allArticles;
    const totalNeeded = visibleGrids * ARTICLES_PER_GRID;
    const result = [];
    
    for (let i = 0; i < totalNeeded; i++) {
      result.push(articlesToUse[i % articlesToUse.length]);
    }
    
    return result;
  }, [allArticles, personalizedArticles, visibleGrids, user]);

  // Split feed articles into grids of 12
  const articleGrids = [];
  for (let i = 0; i < visibleGrids; i++) {
    const startIndex = i * ARTICLES_PER_GRID;
    const gridArticles = getArticlesForDisplay.slice(startIndex, startIndex + ARTICLES_PER_GRID);
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
        {/* RSS status and refresh */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {user && (userPreferences.length > 0 || recentCategories.length > 0) && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                Spersonalizowany feed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Zaktualizowano: {lastUpdated.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
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
        </div>

        {/* Main Content - Ad + 4x3 Grid pattern */}
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
            className="py-8 flex justify-center min-h-[200px] sm:min-h-[180px] md:min-h-[150px]"
            style={{ touchAction: 'pan-y' }}
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
