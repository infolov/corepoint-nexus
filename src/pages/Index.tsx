import { useState, useCallback, useMemo, useEffect, useRef } from "react";
// ZAKOMENTOWANE: Header i Footer są renderowane globalnie - duplikacja powodowała mruganie
// import { Header } from "@/components/layout/Header";
// import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/navigation/CategoryBar";
import { NewsCard } from "@/components/news/NewsCard";
import { useNavigationCategories } from "@/hooks/use-navigation-categories";
import { AuctionAdSlot } from "@/components/widgets/AuctionAdSlot";
import { FeedBannerCarousel, formatBannersForCarousel } from "@/components/widgets/FeedBannerCarousel";
import { FeedTileAdCard } from "@/components/widgets/FeedTileAdCard";

import { DailySummaryFloatingButton } from "@/components/widgets/DailySummaryFloatingButton";
import { AlertTicker } from "@/components/widgets/AlertTicker";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { useAuth } from "@/hooks/use-auth";
import { useCarouselBanners } from "@/hooks/use-carousel-banners";
import { useFeedTileAds } from "@/hooks/use-feed-tile-ads";
// ZAKOMENTOWANE: useLocalNews powodowało race condition z useArticles - nadpisywanie stanu
// import { useLocalNews, formatLocalArticleForCard } from "@/hooks/use-local-news";
import { useContentRatio, interleaveArticlesByRatio } from "@/hooks/use-content-ratio";
import { useUserSettings } from "@/hooks/use-user-settings";
import { Loader2 } from "lucide-react";
import { useArticles, formatArticleForCard } from "@/hooks/use-articles";
import { useRSSArticles, formatRSSArticleForCard } from "@/hooks/use-rss-articles";

import { supabase } from "@/integrations/supabase/client";

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
  const { user } = useAuth();
  const { getCarouselForPosition } = useCarouselBanners();
  const { getAdForPosition, trackImpression, trackClick } = useFeedTileAds();
  const { activeCategoryNames } = useNavigationCategories();
  
  // Content ratio preferences (Local/Sport)
  const { preferences: contentRatioPrefs } = useContentRatio();
  const { settings: userSettings } = useUserSettings();
  
  // ZAKOMENTOWANE: useLocalNews powodowało race condition - trzy źródła danych jednocześnie
  // const { 
  //   articles: localNewsArticles, 
  //   loading: localNewsLoading,
  //   hasLocation 
  // } = useLocalNews({ limit: 100 });
  
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      refetchRSS();
      refetchDB();
    }, 5 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refetchDB, refetchRSS]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchDB(), refetchRSS()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchDB, refetchRSS]);

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

  // Merge RSS + DB articles, deduplicate, and sort
  const allArticles = useMemo(() => {
    // Format RSS articles
    const formattedRSSArticles = rssArticles.map(article => ({
      ...formatRSSArticleForCard(article),
      viewCount: 0,
      pubDateMs: article.pubDateMs || Date.now(),
      createdAt: article.timestamp,
    }));

    // Format DB articles
    const formattedDbArticles = dbArticles.map(article => ({
      ...formatArticleForCard(article),
      viewCount: article.view_count || 0,
      createdAt: article.created_at,
    }));

    // Merge and deduplicate by title similarity
    const seenTitles = new Set<string>();
    const merged = [...formattedRSSArticles, ...formattedDbArticles].filter(article => {
      const normalizedTitle = article.title?.toLowerCase().trim().slice(0, 60) || "";
      if (seenTitles.has(normalizedTitle)) return false;
      seenTitles.add(normalizedTitle);

      // Filter out articles from hidden categories
      if (activeCategoryNames) {
        const articleCat = article.category?.toLowerCase() || "";
        // Check if article's category matches any active category (by name or slug)
        const isActiveCategory = activeCategoryNames.has(articleCat) ||
          // Also check partial matches for categories like "Nauka i Technologia" vs "tech-nauka"
          [...activeCategoryNames].some(name => articleCat.includes(name) || name.includes(articleCat));
        if (!isActiveCategory && articleCat !== "" && articleCat !== "all") {
          return false;
        }
      }

      return true;
    });

    // Sort by date (newest first)
    let articles = sortByPopularityAndDate(merged);

    // Filter by category if not "all"
    if (activeCategory !== "all") {
      const [mainCategory, subCategory] = activeCategory.split("/");
      
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
      
      const subcategoryKeywords: Record<string, string[]> = {
        "wiadomosci/polska": ["Polska", "Polski", "Polskie"],
        "wiadomosci/swiat": ["Świat", "USA", "Europa", "Chiny", "Rosja", "Ukraina"],
        "wiadomosci/polityka": ["Polityka", "Sejm", "Rząd", "Minister", "Premier", "Prezydent"],
        "wiadomosci/spoleczenstwo": ["Społeczeństwo", "Społeczny"],
        "sport/pilka-nozna": ["Piłka nożna", "Ekstraklasa", "Liga", "UEFA", "Lech", "Legia", "Real", "Barcelona", "Messi", "Ronaldo"],
        "sport/koszykowka": ["Koszykówka", "NBA", "Euroliga"],
        "sport/siatkowka": ["Siatkówka", "PlusLiga"],
        "sport/tenis": ["Tenis", "ATP", "WTA", "Wimbledon", "Roland Garros"],
        "sport/sporty-motorowe": ["F1", "MotoGP", "Rajdy", "Żużel", "Formuła"],
        "sport/sporty-walki": ["MMA", "UFC", "KSW", "Boks"],
        "sport/e-sport": ["E-sport", "CS2", "League of Legends", "Valorant"],
        "biznes/finanse-osobiste": ["Finanse osobiste", "Oszczędności", "Kredyt"],
        "biznes/gielda": ["Giełda", "GPW", "Akcje", "Inwestycje"],
        "biznes/nieruchomosci": ["Nieruchomości", "Mieszkania", "Dom"],
        "biznes/gospodarka": ["Gospodarka", "PKB", "Inflacja"],
        "biznes/kryptowaluty": ["Kryptowaluty", "Bitcoin", "Crypto", "Ethereum"],
        "technologia/smartfony": ["Smartfon", "iPhone", "Samsung", "Telefon", "Android"],
        "technologia/gaming": ["Gaming", "Gry", "PlayStation", "Xbox", "PC"],
        "technologia/ai": ["AI", "Sztuczna inteligencja", "ChatGPT", "GPT", "OpenAI"],
        "technologia/cyberbezpieczenstwo": ["Cyberbezpieczeństwo", "Haker", "Bezpieczeństwo"],
        "lifestyle/moda": ["Moda", "Fashion"],
        "lifestyle/podroze": ["Podróże", "Turystyka", "Wakacje"],
        "lifestyle/gotowanie": ["Gotowanie", "Przepisy", "Kuchnia"],
        "rozrywka/film": ["Film", "Kino", "Netflix", "Marvel"],
        "rozrywka/muzyka": ["Muzyka", "Koncert", "Album"],
        "rozrywka/seriale": ["Serial", "HBO", "Netflix"],
        "rozrywka/gwiazdy": ["Gwiazdy", "Celebryci"],
        "zdrowie/dieta": ["Dieta", "Odżywianie", "Odchudzanie"],
        "zdrowie/fitness": ["Fitness", "Trening", "Ćwiczenia"],
        "nauka/kosmos": ["Kosmos", "Astronomia", "NASA", "Kometa", "Gwiazda", "Mars"],
        "nauka/historia": ["Historia", "Historyczne"],
        "nauka/ekologia": ["Ekologia", "Klimat", "Środowisko"]
      };
      
      if (subCategory) {
        const mainCategoryNames = categoryMap[mainCategory] || [];
        const keywords = subcategoryKeywords[activeCategory] || [];
        
        articles = articles.filter(a => {
          const matchesCategory = mainCategoryNames.some(cat => 
            a.category?.toLowerCase() === cat.toLowerCase()
          );
          if (!matchesCategory) return false;
          if (keywords.length > 0) {
            return keywords.some(keyword => 
              a.title?.toLowerCase().includes(keyword.toLowerCase())
            );
          }
          return true;
        });
      } else {
        const categoryNames = categoryMap[mainCategory] || [];
        if (categoryNames.length > 0) {
          articles = articles.filter(a => 
            categoryNames.some(cat => a.category?.toLowerCase() === cat.toLowerCase())
          );
        }
      }
    }
    return articles;
  }, [dbArticles, rssArticles, activeCategory, activeCategoryNames]);

  // Personalize articles for logged-in users - FILTER by selected categories
  const personalizedArticles = useMemo(() => {
    if (!user || userPreferences.length === 0) {
      return allArticles;
    }

    // Map preference slugs to article category names (preferences are stored as slugs)
    const categoryMap: Record<string, string[]> = {
      "wiadomosci": ["wiadomości", "wiadomosci", "news"],
      "sport": ["sport"],
      "biznes": ["biznes", "business"],
      "tech": ["technologia", "tech", "technology"],
      "technologia": ["technologia", "tech", "technology"],
      "lifestyle": ["lifestyle"],
      "rozrywka": ["rozrywka", "entertainment"],
      "zdrowie": ["zdrowie", "health"],
      "nauka": ["nauka", "science"],
      "motoryzacja": ["motoryzacja", "auto"],
      "kultura": ["kultura", "culture"],
    };

    // Filter articles to show ONLY from selected categories
    const filteredArticles = allArticles.filter(article => {
      const articleCategory = article.category?.toLowerCase() || "";
      
      return userPreferences.some(pref => {
        const prefLower = pref.toLowerCase();
        // Check direct match
        if (articleCategory === prefLower || articleCategory.includes(prefLower)) {
          return true;
        }
        // Check mapped categories
        const mappedCategories = categoryMap[pref] || [];
        return mappedCategories.some(mapped => 
          articleCategory.includes(mapped.toLowerCase())
        );
      });
    });

    // If no articles match preferences, show all (fallback)
    if (filteredArticles.length === 0) {
      return allArticles;
    }

    // Score by recency within filtered articles
    const scoredArticles = filteredArticles.map(article => {
      let score = 0;
      const articleCategory = article.category?.toLowerCase() || "";
      
      // Higher score for categories that appear first in preferences
      userPreferences.forEach((pref, index) => {
        if (articleCategory.includes(pref.toLowerCase())) {
          score += (userPreferences.length - index) * 2;
        }
      });
      
      // Bonus for recently viewed categories
      recentCategories.forEach((cat, index) => {
        if (articleCategory.includes(cat.toLowerCase())) {
          score += (recentCategories.length - index);
        }
      });
      
      return { article, score };
    });

    // Sort by score (highest first)
    scoredArticles.sort((a, b) => b.score - a.score);
    
    return scoredArticles.map(s => s.article);
  }, [allArticles, user, userPreferences, recentCategories]);

  // Filter sport articles from all articles
  const sportArticles = useMemo(() => {
    return allArticles.filter(article => {
      const category = article.category?.toLowerCase() || "";
      return category.includes("sport");
    });
  }, [allArticles]);

  // ZAKOMENTOWANE: Local news wyłączony - race condition
  // const formattedLocalArticles = useMemo(() => {
  //   return localNewsArticles.map(article => ({
  //     ...formatLocalArticleForCard(article),
  //     viewCount: 50,
  //     pubDateMs: article.pubDateMs,
  //   }));
  // }, [localNewsArticles]);

  // ZAKOMENTOWANE: Interleaved feed wyłączony - zależał od useLocalNews (race condition)
  // const interleavedFeed = useMemo(() => {
  //   if (activeCategory !== "all") return null;
  //   let localPool = formattedLocalArticles;
  //   if (!hasLocation || localPool.length === 0) {
  //     localPool = allArticles.filter(article => {
  //       const category = article.category?.toLowerCase() || "";
  //       return category.includes("wiadomości") || category.includes("wiadomosci");
  //     });
  //   }
  //   const sportPool = sportArticles;
  //   if (localPool.length === 0 && sportPool.length === 0) return null;
  //   const totalNeeded = visibleGrids * ARTICLES_PER_GRID;
  //   return interleaveArticlesByRatio(localPool, sportPool, totalNeeded, contentRatioPrefs.localRatio);
  // }, [activeCategory, formattedLocalArticles, sportArticles, allArticles, visibleGrids, contentRatioPrefs.localRatio, hasLocation]);
  const interleavedFeed = null;

  // Generate enough articles for infinite scroll by cycling
  const getArticlesForDisplay = useMemo(() => {
    // Use interleaved feed if available (only for "all" category)
    if (interleavedFeed && interleavedFeed.length > 0) {
      const totalNeeded = visibleGrids * ARTICLES_PER_GRID;
      const result = [];
      for (let i = 0; i < totalNeeded; i++) {
        result.push(interleavedFeed[i % interleavedFeed.length]);
      }
      return result;
    }

    // Otherwise use personalized or all articles
    const articlesToUse = user ? personalizedArticles : allArticles;
    if (articlesToUse.length === 0) return [];
    
    const totalNeeded = visibleGrids * ARTICLES_PER_GRID;
    const result = [];
    for (let i = 0; i < totalNeeded; i++) {
      result.push(articlesToUse[i % articlesToUse.length]);
    }
    return result;
  }, [allArticles, personalizedArticles, interleavedFeed, visibleGrids, user]);

  // Split feed articles into grids of 12
  const articleGrids = [];
  for (let i = 0; i < visibleGrids; i++) {
    const startIndex = i * ARTICLES_PER_GRID;
    const gridArticles = getArticlesForDisplay.slice(startIndex, startIndex + ARTICLES_PER_GRID);
    if (gridArticles.length > 0) {
      articleGrids.push(gridArticles);
    }
  }
  return <div className="w-full">
      
      {/* Floating Category Bar */}
      <CategoryBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />


      <main className="w-full px-2 sm:px-4 md:container py-3 sm:py-4 md:py-6">
        {/* Top Ad Banner - Using Auction Engine */}
        <div className="mb-4">
          <AuctionAdSlot variant="horizontal" placementSlug="top-banner" className="w-full" slotIndex={0} />
        </div>

        {/* Alert Ticker - Emergency notifications (full-bleed on desktop too) */}
        <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen mb-6">
          <AlertTicker />
        </div>

        {/* Main Content - Ad + 4x3 Grid pattern */}
        <div className="space-y-6 sm:space-y-8">
          {articleGrids.map((gridArticles, gridIndex) => <div key={`grid-${gridIndex}`}>
              {/* 3x4 Article Grid (12 articles) - with feed-tile ads replacing specific positions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gridArticles.map((article, articleIndex) => {
                  // Check if there's an ad for this position (1-indexed)
                  const tilePosition = articleIndex + 1;
                  const adForPosition = getAdForPosition(tilePosition);
                  
                  if (adForPosition) {
                    return (
                      <FeedTileAdCard
                        key={`ad-tile-${gridIndex}-${tilePosition}`}
                        id={adForPosition.id}
                        contentUrl={adForPosition.contentUrl}
                        targetUrl={adForPosition.targetUrl}
                        name={adForPosition.name}
                        onImpression={trackImpression}
                        onClick={trackClick}
                      />
                    );
                  }
                  
                  return (
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
                  );
                })}
              </div>

              {/* Carousel Banner after each grid of 12 items */}
              <div className="mt-6 sm:mt-8">
                {(() => {
                  // Check if there's a carousel group for this position
                  const carouselGroup = getCarouselForPosition(gridIndex + 1);
                  
                  if (carouselGroup && carouselGroup.banners.length > 0) {
                    // Use the carousel with banners from the database
                    const formattedBanners = formatBannersForCarousel(carouselGroup.banners);
                    return (
                      <FeedBannerCarousel
                        banners={formattedBanners}
                        className="w-full"
                      />
                    );
                  }
                  
                  // Fallback to auction ad slot if no carousel configured
                  return (
                    <AuctionAdSlot 
                      variant="horizontal" 
                      placementSlug="feed-carousel"
                      className="w-full" 
                      slotIndex={gridIndex + 1}
                    />
                  );
                })()}
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

      {/* Floating Daily Summary Button */}
      <DailySummaryFloatingButton />
    </div>;
};
export default Index;