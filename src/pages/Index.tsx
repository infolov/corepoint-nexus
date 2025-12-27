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
    // Give RSS articles priority since they have real sources
    const formattedRSSArticles = rssArticles.map(article => ({
      ...formatRSSArticleForCard(article),
      viewCount: 100, // Give RSS articles priority over DB articles
      pubDateMs: article.pubDateMs || Date.now(),
    }));

    // Format DB articles with viewCount and createdAt for sorting
    const formattedDbArticles = dbArticles.map(article => ({
      ...formatArticleForCard(article),
      viewCount: article.view_count || 0,
      createdAt: article.created_at,
    }));

    // Prioritize RSS articles, then add DB articles
    let articles = [];
    if (formattedRSSArticles.length > 0) {
      // RSS has priority - sort by date, add DB articles at end
      const sortedRSS = sortByPopularityAndDate(formattedRSSArticles);
      const sortedDB = sortByPopularityAndDate(formattedDbArticles);
      articles = [...sortedRSS, ...sortedDB];
    } else if (formattedDbArticles.length > 0) {
      articles = sortByPopularityAndDate(formattedDbArticles);
    } else {
      // Use mock data as fallback
      articles = sortByPopularityAndDate(allMockArticles.map(a => ({ ...a, viewCount: 0 })));
    }

    // Filter by category if not "all"
    if (activeCategory !== "all") {
      // Check if it's a subcategory (format: category/subcategory)
      const [mainCategory, subCategory] = activeCategory.split("/");
      
      // Map slugs to exact category names from RSS feeds
      const categoryMap: Record<string, string[]> = {
        wiadomosci: ["Wiadomości"],
        biznes: ["Biznes"],
        sport: ["Sport"],
        technologia: ["Technologia"],
        lifestyle: ["Lifestyle"],
        rozrywka: ["Rozrywka"],
        zdrowie: ["Zdrowie"],
        nauka: ["Nauka"],
        motoryzacja: ["Motoryzacja"],
        kultura: ["Kultura"]
      };
      
      // Subcategory keywords for title search (only for subcategories)
      const subcategoryKeywords: Record<string, string[]> = {
        // Wiadomości
        "wiadomosci/polska": ["Polska", "Polski", "Polskie"],
        "wiadomosci/swiat": ["Świat", "USA", "Europa", "Chiny", "Rosja", "Ukraina"],
        "wiadomosci/polityka": ["Polityka", "Sejm", "Rząd", "Minister", "Premier", "Prezydent"],
        "wiadomosci/spoleczenstwo": ["Społeczeństwo", "Społeczny"],
        // Sport
        "sport/pilka-nozna": ["Piłka nożna", "Ekstraklasa", "Liga", "UEFA", "Lech", "Legia", "Real", "Barcelona", "Messi", "Ronaldo"],
        "sport/koszykowka": ["Koszykówka", "NBA", "Euroliga"],
        "sport/siatkowka": ["Siatkówka", "PlusLiga"],
        "sport/tenis": ["Tenis", "ATP", "WTA", "Wimbledon", "Roland Garros"],
        "sport/sporty-motorowe": ["F1", "MotoGP", "Rajdy", "Żużel", "Formuła"],
        "sport/sporty-walki": ["MMA", "UFC", "KSW", "Boks"],
        "sport/e-sport": ["E-sport", "CS2", "League of Legends", "Valorant"],
        // Biznes
        "biznes/finanse-osobiste": ["Finanse osobiste", "Oszczędności", "Kredyt"],
        "biznes/gielda": ["Giełda", "GPW", "Akcje", "Inwestycje"],
        "biznes/nieruchomosci": ["Nieruchomości", "Mieszkania", "Dom"],
        "biznes/gospodarka": ["Gospodarka", "PKB", "Inflacja"],
        "biznes/kryptowaluty": ["Kryptowaluty", "Bitcoin", "Crypto", "Ethereum"],
        // Technologia
        "technologia/smartfony": ["Smartfon", "iPhone", "Samsung", "Telefon", "Android"],
        "technologia/gaming": ["Gaming", "Gry", "PlayStation", "Xbox", "PC"],
        "technologia/ai": ["AI", "Sztuczna inteligencja", "ChatGPT", "GPT", "OpenAI"],
        "technologia/cyberbezpieczenstwo": ["Cyberbezpieczeństwo", "Haker", "Bezpieczeństwo"],
        // Lifestyle
        "lifestyle/moda": ["Moda", "Fashion"],
        "lifestyle/podroze": ["Podróże", "Turystyka", "Wakacje"],
        "lifestyle/gotowanie": ["Gotowanie", "Przepisy", "Kuchnia"],
        // Rozrywka
        "rozrywka/film": ["Film", "Kino", "Netflix", "Marvel"],
        "rozrywka/muzyka": ["Muzyka", "Koncert", "Album"],
        "rozrywka/seriale": ["Serial", "HBO", "Netflix"],
        "rozrywka/gwiazdy": ["Gwiazdy", "Celebryci"],
        // Zdrowie
        "zdrowie/dieta": ["Dieta", "Odżywianie", "Odchudzanie"],
        "zdrowie/fitness": ["Fitness", "Trening", "Ćwiczenia"],
        // Nauka
        "nauka/kosmos": ["Kosmos", "Astronomia", "NASA", "Kometa", "Gwiazda", "Mars"],
        "nauka/historia": ["Historia", "Historyczne"],
        "nauka/ekologia": ["Ekologia", "Klimat", "Środowisko"]
      };
      
      if (subCategory) {
        // For subcategories: first filter by main category, then by title keywords
        const mainCategoryNames = categoryMap[mainCategory] || [];
        const keywords = subcategoryKeywords[activeCategory] || [];
        
        articles = articles.filter(a => {
          // Must match main category
          const matchesCategory = mainCategoryNames.some(cat => 
            a.category?.toLowerCase() === cat.toLowerCase()
          );
          if (!matchesCategory) return false;
          
          // Then check title for subcategory keywords
          if (keywords.length > 0) {
            return keywords.some(keyword => 
              a.title?.toLowerCase().includes(keyword.toLowerCase())
            );
          }
          return true;
        });
      } else {
        // For main categories: exact category match only
        const categoryNames = categoryMap[mainCategory] || [];
        if (categoryNames.length > 0) {
          articles = articles.filter(a => 
            categoryNames.some(cat => a.category?.toLowerCase() === cat.toLowerCase())
          );
        }
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
    if (articlesToUse.length === 0) return [];
    
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