import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/navigation/CategoryBar";
import { NewsCard } from "@/components/news/NewsCard";
import { AdBanner } from "@/components/widgets/AdBanner";
import { LocalAdBanner } from "@/components/widgets/LocalAdBanner";
import { AdCarousel } from "@/components/widgets/AdCarousel";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useArticles, formatArticleForCard } from "@/hooks/use-articles";
import { useRSSArticles, formatRSSArticleForCard } from "@/hooks/use-rss-articles";
import { FloatingRefreshButton } from "@/components/ui/FloatingRefreshButton";

import { supabase } from "@/integrations/supabase/client";
import { newsArticles, businessArticles, sportArticles, techArticles, lifestyleArticles } from "@/data/mockNews";

// Combine all mock articles as fallback
const allMockArticles = [...newsArticles, ...businessArticles, ...sportArticles, ...techArticles, ...lifestyleArticles];

// Sort articles by popularity (view_count) and publication date
const sortByPopularityAndDate = <T extends { pubDateMs?: number; createdAt?: string; viewCount?: number }>(array: T[]): T[] => {
  return [...array].sort((a, b) => {
    // First sort by view count (popularity) - higher views first
    const viewsA = a.viewCount || 0;
    const viewsB = b.viewCount || 0;
    if (viewsB !== viewsA) {
      return viewsB - viewsA;
    }
    
    // Then sort by date - newer articles first
    // Use pubDateMs for RSS articles, createdAt for DB articles
    const dateA = a.pubDateMs || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const dateB = b.pubDateMs || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return dateB - dateA;
  });
};
const ARTICLES_PER_GRID = 12; // 4x3 grid
const INITIAL_GRIDS = 2;
const GRIDS_PER_LOAD = 1;
const Index = () => {
  const [visibleGrids, setVisibleGrids] = useState(INITIAL_GRIDS);
  const [activeCategory, setActiveCategory] = useState("all");
  const {
    settings: displaySettings
  } = useDisplayMode();
  const {
    articles: dbArticles,
    loading: dbLoading,
    refetch: refetchDB,
    lastUpdated: dbLastUpdated
  } = useArticles({
    limit: 100
  });
  const {
    articles: rssArticles,
    loading: rssLoading,
    refetch: refetchRSS,
    lastUpdated: rssLastUpdated
  } = useRSSArticles();
  const {
    user
  } = useAuth();
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      console.log("Auto-refreshing articles...");
      refetchRSS();
      refetchDB();
    }, 5 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refetchRSS, refetchDB]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchRSS(), refetchDB()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchRSS, refetchDB]);

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
        const {
          data: prefData
        } = await supabase.from("user_notification_preferences").select("categories").eq("user_id", user.id).maybeSingle();
        if (prefData?.categories) {
          setUserPreferences(prefData.categories);
        }

        // Get recently viewed categories
        const {
          data: recentData
        } = await supabase.from("user_recently_viewed").select("category").eq("user_id", user.id).order("viewed_at", {
          ascending: false
        }).limit(30);
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
    setVisibleGrids(prev => prev + GRIDS_PER_LOAD);
  }, []);
  const {
    loadMoreRef,
    isLoading
  } = useInfiniteScroll(loadMore, hasMore);

  // Combine RSS articles with DB articles, preferring RSS
  const allArticles = useMemo(() => {
    // Format RSS articles with viewCount and pubDateMs for sorting
    const formattedRSSArticles = rssArticles.map(article => ({
      ...formatRSSArticleForCard(article),
      viewCount: 0, // RSS articles don't have view count, use 0
      pubDateMs: article.pubDateMs || Date.now(),
    }));

    // Format DB articles with viewCount and createdAt for sorting
    const formattedDbArticles = dbArticles.map(article => ({
      ...formatArticleForCard(article),
      viewCount: article.view_count || 0,
      createdAt: article.created_at,
    }));

    // Combine RSS with DB articles and sort by popularity/date
    let articles = [];
    if (formattedRSSArticles.length > 0 || formattedDbArticles.length > 0) {
      const combined = [...formattedRSSArticles, ...formattedDbArticles];
      articles = sortByPopularityAndDate(combined);
    } else {
      // Use mock data as fallback, sorted by date
      articles = sortByPopularityAndDate(allMockArticles.map(a => ({ ...a, viewCount: 0 })));
    }

    // Filter by category if not "all"
    if (activeCategory !== "all") {
      // Check if it's a subcategory (format: category/subcategory)
      const [mainCategory, subCategory] = activeCategory.split("/");
      const categoryMap: Record<string, string[]> = {
        wiadomosci: ["Wiadomości", "Polska", "News", "Polityka", "Społeczeństwo"],
        biznes: ["Biznes", "Finanse", "Ekonomia", "Giełda", "Gospodarka", "Money"],
        sport: ["Sport", "Piłka nożna", "Koszykówka", "Siatkówka", "Tenis", "F1", "MMA", "Sportowe"],
        technologia: ["Technologia", "Tech", "IT", "AI", "Gaming", "Smartfon", "Chip"],
        lifestyle: ["Lifestyle", "Moda", "Uroda", "Dom", "Podróże"],
        rozrywka: ["Rozrywka", "Film", "Muzyka", "Seriale", "Gwiazdy", "TV"],
        zdrowie: ["Zdrowie", "Medycyna", "Dieta", "Fitness"],
        nauka: ["Nauka", "Edukacja", "Kosmos", "Historia", "Odkrycia"],
        motoryzacja: ["Motoryzacja", "Auto", "Samochód"],
        kultura: ["Kultura", "Sztuka", "Teatr", "Literatura"]
      };
      const subcategoryMap: Record<string, string[]> = {
        // Wiadomości
        "wiadomosci/polska": ["Polska"],
        "wiadomosci/swiat": ["Świat", "Zagranica"],
        "wiadomosci/polityka": ["Polityka"],
        "wiadomosci/spoleczenstwo": ["Społeczeństwo"],
        // Sport
        "sport/pilka-nozna": ["Piłka nożna", "Ekstraklasa", "Liga", "UEFA", "Lech", "Legia"],
        "sport/koszykowka": ["Koszykówka", "NBA", "Euroliga"],
        "sport/siatkowka": ["Siatkówka", "PlusLiga"],
        "sport/tenis": ["Tenis", "ATP", "WTA"],
        "sport/sporty-motorowe": ["F1", "MotoGP", "Rajdy", "Żużel"],
        "sport/sporty-walki": ["MMA", "UFC", "KSW", "Boks"],
        "sport/e-sport": ["E-sport", "CS2", "League of Legends", "Valorant"],
        // Biznes
        "biznes/finanse-osobiste": ["Finanse osobiste", "Oszczędności"],
        "biznes/gielda": ["Giełda", "GPW", "Akcje", "Inwestycje"],
        "biznes/nieruchomosci": ["Nieruchomości", "Mieszkania"],
        "biznes/gospodarka": ["Gospodarka", "PKB", "Inflacja"],
        "biznes/kryptowaluty": ["Kryptowaluty", "Bitcoin", "Crypto"],
        // Technologia
        "technologia/smartfony": ["Smartfon", "iPhone", "Samsung", "Telefon"],
        "technologia/gaming": ["Gaming", "Gry", "PlayStation", "Xbox", "PC"],
        "technologia/ai": ["AI", "Sztuczna inteligencja", "ChatGPT", "GPT"],
        "technologia/cyberbezpieczenstwo": ["Cyberbezpieczeństwo", "Haker", "Bezpieczeństwo"],
        // Lifestyle
        "lifestyle/moda": ["Moda", "Fashion"],
        "lifestyle/podroze": ["Podróże", "Turystyka", "Wakacje"],
        "lifestyle/gotowanie": ["Gotowanie", "Przepisy", "Kuchnia"],
        // Rozrywka
        "rozrywka/film": ["Film", "Kino", "Netflix"],
        "rozrywka/muzyka": ["Muzyka", "Koncert", "Album"],
        "rozrywka/seriale": ["Serial", "HBO", "Netflix"],
        "rozrywka/gwiazdy": ["Gwiazdy", "Celebryci"],
        // Zdrowie
        "zdrowie/dieta": ["Dieta", "Odżywianie", "Odchudzanie"],
        "zdrowie/fitness": ["Fitness", "Trening", "Ćwiczenia"],
        // Nauka
        "nauka/kosmos": ["Kosmos", "Astronomia", "NASA", "Kometa", "Gwiazda"],
        "nauka/historia": ["Historia"],
        "nauka/ekologia": ["Ekologia", "Klimat", "Środowisko"]
      };
      let categoryNames: string[] = [];
      if (subCategory) {
        // Use subcategory filter
        categoryNames = subcategoryMap[activeCategory] || [];
      } else {
        // Use main category filter
        categoryNames = categoryMap[mainCategory] || [];
      }
      if (categoryNames.length > 0) {
        articles = articles.filter(a => categoryNames.some(cat => a.category?.toLowerCase().includes(cat.toLowerCase()) || a.title?.toLowerCase().includes(cat.toLowerCase())));
      }
    }
    return articles;
  }, [rssArticles, dbArticles, activeCategory]);

  // Personalize articles for logged-in users
  const personalizedArticles = useMemo(() => {
    if (!user || userPreferences.length === 0 && recentCategories.length === 0) {
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
      return {
        article,
        score
      };
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
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Floating Category Bar */}
      <CategoryBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      {/* Floating Refresh Button */}
      <FloatingRefreshButton onClick={handleRefresh} isLoading={isRefreshing || rssLoading || dbLoading} />

      <main className="container py-4 sm:py-6">
        {/* Top Ad Banner */}
        <div className="mb-6">
          <AdBanner variant="horizontal" className="w-full" />
        </div>

        {/* Main Content - Ad + 4x3 Grid pattern */}
        <div className="space-y-6 sm:space-y-8">
          {articleGrids.map((gridArticles, gridIndex) => <div key={`grid-${gridIndex}`}>
              {/* 3x4 Article Grid (12 articles) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gridArticles.map((article, articleIndex) => <NewsCard key={`${article.id}-${gridIndex}-${articleIndex}`} id={article.id} title={article.title} category={article.category} image={article.image} timestamp={article.timestamp} badge={article.badge} source={article.source} sourceUrl={article.sourceUrl} variant="default" />)}
              </div>

              {/* Ad Banner after each grid of 12 articles */}
              <div className="mt-6 sm:mt-8">
                {gridIndex === 0 ? (
                  <AdBanner variant="horizontal" className="w-full" />
                ) : (
                  <AdCarousel className="w-full" />
                )}
              </div>
            </div>)}

          {/* Load more trigger - infinite scroll */}
          <div ref={loadMoreRef} className="py-8 flex justify-center min-h-[200px] sm:min-h-[180px] md:min-h-[150px]" style={{
          touchAction: 'pan-y'
        }}>
            {isLoading && <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin" />
                <span className="text-senior-base">Ładowanie...</span>
              </div>}
          </div>
        </div>

      </main>

      <Footer />
    </div>;
};
export default Index;