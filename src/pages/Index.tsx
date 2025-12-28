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
  const [userSubcategories, setUserSubcategories] = useState<string[]>([]);
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
        } = await supabase.from("user_notification_preferences").select("categories, tags").eq("user_id", user.id).maybeSingle();
        if (prefData?.categories) {
          setUserPreferences(prefData.categories);
        }
        if (prefData?.tags) {
          setUserSubcategories(prefData.tags);
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

  // Personalize articles for logged-in users - FILTER by selected categories AND subcategories
  const personalizedArticles = useMemo(() => {
    // If no user or no preferences, show all articles
    if (!user || (userPreferences.length === 0 && userSubcategories.length === 0)) {
      return allArticles;
    }

    // If no articles yet, return empty
    if (allArticles.length === 0) {
      return [];
    }

    // Map user preference slugs to RSS category names
    const slugToRSSCategory: Record<string, string> = {
      "wiadomosci": "wiadomości",
      "sport": "sport",
      "biznes": "biznes",
      "technologia": "technologia",
      "tech": "technologia",
      "lifestyle": "lifestyle",
      "rozrywka": "rozrywka",
      "zdrowie": "zdrowie",
      "kultura": "kultura",
      "nauka": "nauka",
      "motoryzacja": "motoryzacja",
    };

    // Map subcategory IDs to keywords for matching article titles/content
    const subcategoryKeywords: Record<string, string[]> = {
      // Wiadomości
      "wiadomosci-polska": ["polska", "polski", "polskie", "warszawa", "kraków", "gdańsk"],
      "wiadomosci-swiat": ["świat", "świato", "międzynarodow", "europa", "usa", "chiny"],
      "wiadomosci-polityka": ["polity", "sejm", "senat", "rząd", "prezydent", "minister"],
      "wiadomosci-gospodarka": ["gospodar", "ekonom", "pkb", "inflacja", "nbp"],
      "wiadomosci-spoleczenstwo": ["społecz", "obywatel", "protest", "manifestacja"],
      // Biznes
      "biznes-finanse": ["finans", "bank", "kredyt", "pożyczk", "oszczędnoś"],
      "biznes-gielda": ["giełd", "akcj", "wig", "inwestycj", "notowani"],
      "biznes-startupy": ["startup", "innowacj", "venture", "fundusz"],
      "biznes-nieruchomosci": ["nieruchom", "mieszkan", "dom", "działk"],
      "biznes-praca": ["prac", "zatrudnien", "rekrutacj", "pensj", "wynagrodzeni"],
      // Sport
      "sport-pilka-nozna": ["piłk", "football", "liga", "ekstraklasa", "bramk", "mecz"],
      "sport-koszykowka": ["koszykówk", "nba", "basket"],
      "sport-siatkowka": ["siatkówk", "volley"],
      "sport-tenis": ["tenis", "wimbledon", "rakiet"],
      "sport-sporty-motorowe": ["f1", "formuła", "wyścig", "motor", "rally"],
      "sport-sporty-walki": ["boks", "mma", "ufc", "walka"],
      "sport-hokej": ["hokej", "nhl", "krążek"],
      "sport-lekkoatletyka": ["lekkoatletyk", "bieg", "maraton", "sprint"],
      "sport-sporty-zimowe": ["narciar", "snowboard", "łyżw", "zimow"],
      "sport-esport": ["esport", "gaming", "gra", "e-sport"],
      // Technologia
      "tech-ai": ["ai", "sztuczn", "inteligenc", "machine learning", "chatgpt", "gpt"],
      "tech-smartfony": ["smartfon", "telefon", "iphone", "android", "samsung"],
      "tech-gaming": ["gam", "gra", "playstation", "xbox", "nintendo"],
      "tech-software": ["oprogramowan", "aplikacj", "software", "program"],
      "tech-hardware": ["sprzęt", "hardware", "procesor", "karta graficzna"],
      // Lifestyle
      "lifestyle-moda": ["moda", "fashion", "styl", "ubrania"],
      "lifestyle-uroda": ["urod", "kosmetyk", "makijaż", "pielęgnacj"],
      "lifestyle-podroze": ["podróż", "wakacj", "turyst", "zwiedzani"],
      "lifestyle-jedzenie": ["jedzen", "kuchni", "przepis", "restauracj", "gotowani"],
      "lifestyle-design": ["design", "wnętrz", "architektur", "dekoracj"],
      // Rozrywka
      "rozrywka-filmy": ["film", "kino", "reżyser", "aktor"],
      "rozrywka-seriale": ["serial", "netflix", "hbo", "odcin"],
      "rozrywka-muzyka": ["muzyk", "koncert", "piosenk", "album"],
      "rozrywka-gwiazdy": ["gwiazd", "celebryt", "influencer"],
      "rozrywka-streaming": ["stream", "netflix", "disney", "hbo", "amazon"],
      // Nauka
      "nauka-kosmos": ["kosmos", "nasa", "spacex", "planet", "galaktyk"],
      "nauka-medycyna": ["medycyn", "lekar", "szpital", "zdrowi", "chorob"],
      "nauka-fizyka": ["fizyk", "kwantow", "cząstk", "atom"],
      "nauka-biologia": ["biolog", "komórk", "dna", "ewolucj"],
      "nauka-ekologia": ["ekolog", "klimat", "środowisk", "zieloni"],
      // Zdrowie
      "zdrowie-dieta": ["diet", "odchudzani", "kalori", "żywieni"],
      "zdrowie-fitness": ["fitness", "trening", "ćwiczen", "siłowni"],
      "zdrowie-psychologia": ["psycholog", "mental", "depresj", "stres"],
      "zdrowie-choroby": ["chorob", "wirus", "bakteria", "infekcj"],
      "zdrowie-profilaktyka": ["profilaktyk", "szczepien", "badani", "prewencj"],
      // Kultura
      "kultura-sztuka": ["sztuk", "obraz", "malarstw", "rzeźb"],
      "kultura-teatr": ["teatr", "spektakl", "przedstawieni"],
      "kultura-ksiazki": ["książk", "literatur", "powieść", "autor"],
      "kultura-muzea": ["muze", "wystawka", "eksponat", "galeri"],
      "kultura-festiwale": ["festiwal", "wydarzeni", "imprez"],
      // Motoryzacja
      "moto-samochody": ["samochód", "auto", "pojazd", "silnik"],
      "moto-motocykle": ["motocykl", "jednoślad", "skuter"],
      "moto-elektryczne": ["elektryczn", "ev", "tesla", "hybryd", "bateria"],
      "moto-testy": ["test", "recenzj", "porównani"],
      "moto-porady": ["porad", "wskazówk", "jak ", "instrukcj"],
    };

    // Build a set of allowed category names
    const allowedCategories = new Set<string>();
    userPreferences.forEach(pref => {
      const prefLower = pref.toLowerCase().trim();
      const mappedCategory = slugToRSSCategory[prefLower];
      if (mappedCategory) {
        allowedCategories.add(mappedCategory);
      } else {
        allowedCategories.add(prefLower);
      }
    });

    // Get subcategory keywords for filtering
    const activeKeywords: string[] = [];
    userSubcategories.forEach(subId => {
      const keywords = subcategoryKeywords[subId];
      if (keywords) {
        activeKeywords.push(...keywords);
      }
    });

    console.log("User preferences:", userPreferences);
    console.log("User subcategories:", userSubcategories);
    console.log("Allowed categories:", Array.from(allowedCategories));
    console.log("Active keywords:", activeKeywords.slice(0, 10));

    // Filter articles
    const filteredArticles = allArticles.filter(article => {
      const articleCategory = (article.category || "").toLowerCase().trim();
      const articleTitle = (article.title || "").toLowerCase();
      
      // First check: article must be in an allowed category
      const isCategoryAllowed = allowedCategories.has(articleCategory);
      
      if (!isCategoryAllowed) {
        return false;
      }

      // If no subcategories selected, allow all articles from allowed categories
      if (userSubcategories.length === 0) {
        return true;
      }

      // If subcategories selected, prioritize articles matching keywords
      // But still show articles from allowed categories even without keyword match
      const hasKeywordMatch = activeKeywords.some(keyword => 
        articleTitle.includes(keyword.toLowerCase())
      );
      
      // We'll use keyword matching for scoring, not filtering
      return true;
    });

    console.log(`Filtered ${filteredArticles.length} articles from ${allArticles.length} total`);

    if (filteredArticles.length === 0) {
      console.log("No articles match user preferences - showing empty");
      return [];
    }

    // Sort by preference order, subcategory match, and recency
    const scoredArticles = filteredArticles.map(article => {
      let score = 0;
      const articleCategory = (article.category || "").toLowerCase();
      const articleTitle = (article.title || "").toLowerCase();
      
      // Higher score for categories that appear first in preferences
      userPreferences.forEach((pref, index) => {
        const prefLower = pref.toLowerCase();
        const mappedCategory = slugToRSSCategory[prefLower] || prefLower;
        
        if (articleCategory === mappedCategory) {
          score += (userPreferences.length - index) * 10;
        }
      });
      
      // Bonus for matching subcategory keywords
      activeKeywords.forEach(keyword => {
        if (articleTitle.includes(keyword.toLowerCase())) {
          score += 25; // High bonus for subcategory match
        }
      });
      
      // Bonus for recently viewed categories
      recentCategories.forEach((cat, index) => {
        if (articleCategory === cat.toLowerCase()) {
          score += (recentCategories.length - index);
        }
      });
      
      return { article, score };
    });

    scoredArticles.sort((a, b) => b.score - a.score);
    
    return scoredArticles.map(s => s.article);
  }, [allArticles, user, userPreferences, userSubcategories, recentCategories]);

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