import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/navigation/CategoryBar";
import { NewsCard } from "@/components/news/NewsCard";
import { AuctionAdSlot } from "@/components/widgets/AuctionAdSlot";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { Loader2 } from "lucide-react";
import { useArticles, formatArticleForCard } from "@/hooks/use-articles";
import { useRSSArticles, formatRSSArticleForCard } from "@/hooks/use-rss-articles";
import { CATEGORIES, getCategoryBySlug, CATEGORY_KEYWORDS } from "@/data/categories";

// Responsive initial count based on device
const getInitialCount = () => {
  if (typeof window === "undefined") return 12;
  if (window.innerWidth < 640) return 6;
  if (window.innerWidth < 1024) return 9;
  return 12;
};

const ARTICLES_PER_LOAD = 6;

// Sort articles by date (newest first)
const sortByDate = <T extends { pubDateMs?: number; createdAt?: string }>(array: T[]): T[] => {
  return [...array].sort((a, b) => {
    const dateA = a.pubDateMs || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const dateB = b.pubDateMs || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return dateB - dateA;
  });
};

export default function Category() {
  const { category, subcategory } = useParams<{ category: string; subcategory?: string }>();
  const [searchParams] = useSearchParams();
  const subFromQuery = searchParams.get("sub");
  const subSubFromQuery = searchParams.get("subsub");
  
  const { settings: displaySettings } = useDisplayMode();
  const isCompact = displaySettings.mode === "compact" || displaySettings.dataSaver;
  
  // Fetch real articles
  const {
    articles: dbArticles,
    loading: dbLoading,
  } = useArticles({ limit: 100 });
  
  const {
    articles: rssArticles,
    loading: rssLoading,
  } = useRSSArticles();
  
  const [visibleCount, setVisibleCount] = useState(getInitialCount);

  // Determine current category/subcategory
  const currentCategorySlug = category || "all";
  const currentSubcategorySlug = subcategory || subFromQuery || null;
  
  // Get category info for display
  const categoryInfo = getCategoryBySlug(currentCategorySlug);
  const categoryName = categoryInfo?.name || currentCategorySlug;
  
  // Get subcategory name
  const subcategoryInfo = currentSubcategorySlug 
    ? categoryInfo?.subcategories.find(s => s.slug === currentSubcategorySlug)
    : null;
  const subcategoryName = subcategoryInfo?.name || currentSubcategorySlug;

  // Build active category slug for CategoryBar
  const activeCategory = useMemo(() => {
    if (currentSubcategorySlug) {
      return `${currentCategorySlug}/${currentSubcategorySlug}`;
    }
    return currentCategorySlug;
  }, [currentCategorySlug, currentSubcategorySlug]);

  // Combine and filter articles
  const filteredArticles = useMemo(() => {
    // Format RSS articles
    const formattedRSSArticles = rssArticles.map(article => ({
      ...formatRSSArticleForCard(article),
      pubDateMs: article.pubDateMs || Date.now(),
    }));

    // Format DB articles
    const formattedDbArticles = dbArticles.map(article => ({
      ...formatArticleForCard(article),
      createdAt: article.created_at,
    }));

    // Combine - RSS has priority
    let articles = formattedRSSArticles.length > 0 
      ? [...sortByDate(formattedRSSArticles), ...sortByDate(formattedDbArticles)]
      : sortByDate(formattedDbArticles);

    // If showing all, return everything
    if (currentCategorySlug === "all") {
      return articles;
    }

    // Category mapping - match article categories to our slugs
    const categoryMap: Record<string, string[]> = {
      wiadomosci: ["wiadomości", "wiadomosci", "news", "polska"],
      swiat: ["świat", "swiat", "world", "usa", "europa"],
      biznes: ["biznes", "business", "gospodarka", "economy"],
      finanse: ["finanse", "finance", "pieniądze"],
      prawo: ["prawo", "law", "sąd"],
      "tech-nauka": ["technologia", "tech", "nauka", "science", "technology"],
      motoryzacja: ["motoryzacja", "auto", "samochody", "automotive"],
      sport: ["sport", "sports"],
      kultura: ["kultura", "culture", "rozrywka", "entertainment"],
      lifestyle: ["lifestyle", "zdrowie", "health", "moda"],
    };

    // Subcategory keywords for filtering by title
    const subcategoryKeywords: Record<string, string[]> = {
      // Wiadomości
      "wiadomosci/najwazniejsze": ["ważne", "pilne", "breaking"],
      "wiadomosci/polityka-rzad": ["polityka", "sejm", "rząd", "minister", "premier", "prezydent", "partia"],
      "wiadomosci/spoleczenstwo": ["społeczeństwo", "społeczny", "ludzie"],
      "wiadomosci/bezpieczenstwo": ["policja", "bezpieczeństwo", "kradzież", "przestępstwo"],
      // Świat
      "swiat/europa": ["europa", "unia europejska", "niemcy", "francja", "włochy"],
      "swiat/usa": ["usa", "ameryka", "stany zjednoczone", "biden", "trump"],
      "swiat/ukraina-rosja": ["ukraina", "rosja", "putin", "kijów", "wojna"],
      // Biznes
      "biznes/gospodarka-rynek": ["gospodarka", "rynek", "pkb"],
      "biznes/firmy-branze": ["firma", "branża", "przedsiębiorstwo"],
      "biznes/ceny-inflacja": ["ceny", "inflacja", "podwyżka", "drożeje"],
      // Sport
      "sport/pilka-nozna": ["piłka nożna", "ekstraklasa", "liga", "uefa", "lech", "legia", "real", "barcelona"],
      "sport/siatkowka": ["siatkówka", "plusliga"],
      "sport/tenis": ["tenis", "atp", "wta", "wimbledon"],
      "sport/sporty-walki": ["mma", "ufc", "ksw", "boks"],
      // Tech + Nauka
      "tech-nauka/ai": ["ai", "sztuczna inteligencja", "chatgpt", "openai"],
      "tech-nauka/cyberbezpieczenstwo": ["cyberbezpieczeństwo", "haker", "cyberatak"],
      "tech-nauka/kosmos": ["kosmos", "astronomia", "nasa", "kometa", "mars"],
      // Kultura
      "kultura/kino": ["film", "kino", "netflix", "marvel"],
      "kultura/seriale": ["serial", "hbo", "netflix"],
      "kultura/muzyka": ["muzyka", "koncert", "album", "piosenkarz"],
      // Lifestyle
      "lifestyle/zdrowie-wellbeing": ["zdrowie", "wellbeing", "medycyna"],
      "lifestyle/podroze": ["podróże", "turystyka", "wakacje", "urlop"],
      "lifestyle/moda": ["moda", "fashion", "ubrania"],
    };

    // Get category names to match
    const categoryNames = categoryMap[currentCategorySlug] || [currentCategorySlug];
    const keywords = CATEGORY_KEYWORDS[currentCategorySlug] || [];

    // Filter by main category first
    let filtered = articles.filter(article => {
      const articleCategory = (article.category || "").toLowerCase();
      
      // Direct category match
      const directMatch = categoryNames.some(cat => 
        articleCategory === cat.toLowerCase() || 
        articleCategory.includes(cat.toLowerCase())
      );
      
      if (directMatch) return true;
      
      // Keyword match in title
      const titleLower = (article.title || "").toLowerCase();
      return keywords.some(keyword => 
        titleLower.includes(keyword.toLowerCase())
      );
    });

    // If subcategory is selected, filter further by title keywords
    if (currentSubcategorySlug) {
      const subKey = `${currentCategorySlug}/${currentSubcategorySlug}`;
      const subKeywords = subcategoryKeywords[subKey] || [];
      
      if (subKeywords.length > 0) {
        filtered = filtered.filter(article => {
          const titleLower = (article.title || "").toLowerCase();
          return subKeywords.some(keyword => 
            titleLower.includes(keyword.toLowerCase())
          );
        });
      }
    }

    return filtered;
  }, [rssArticles, dbArticles, currentCategorySlug, currentSubcategorySlug]);

  // Infinite scroll
  const hasMore = visibleCount < filteredArticles.length;
  
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + ARTICLES_PER_LOAD, filteredArticles.length));
  }, [filteredArticles.length]);

  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(getInitialCount());
  }, [currentCategorySlug, currentSubcategorySlug]);

  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const heroArticle = visibleArticles[0];
  const gridArticles = visibleArticles.slice(1);

  const isLoadingData = rssLoading || dbLoading;

  // Build page title
  const pageTitle = subcategoryName 
    ? `${categoryName} › ${subcategoryName}`
    : categoryName;

  return (
    <div className="min-h-screen bg-background w-full overflow-x-clip">
      <Header />
      
      {/* Floating Category Bar */}
      <CategoryBar activeCategory={activeCategory} />
      
      <main className="w-full px-2 sm:px-4 md:container py-3 sm:py-4 md:py-6">
        {/* Top Ad Banner */}
        <div className="mb-4 sm:mb-6">
          <AuctionAdSlot variant="horizontal" className="w-full" slotIndex={0} />
        </div>

        {/* Page Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6">
          {pageTitle}
        </h1>

        {/* Loading State */}
        {isLoadingData && filteredArticles.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Ładowanie artykułów...</span>
          </div>
        )}

        {/* No Articles State */}
        {!isLoadingData && filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              Brak artykułów w kategorii "{pageTitle}"
            </p>
            <Link 
              to="/" 
              className="text-primary hover:underline"
            >
              ← Wróć do strony głównej
            </Link>
          </div>
        )}

        {/* Articles Grid */}
        {filteredArticles.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            {/* Hero Article - hidden in compact mode */}
            {heroArticle && !isCompact && (
              <NewsCard
                id={heroArticle.id}
                title={heroArticle.title}
                excerpt={heroArticle.excerpt}
                category={heroArticle.category}
                image={heroArticle.image}
                timestamp={heroArticle.timestamp}
                source={heroArticle.source}
                sourceUrl={'sourceUrl' in heroArticle ? heroArticle.sourceUrl : undefined}
                badge={'badge' in heroArticle ? heroArticle.badge : undefined}
                variant="hero"
                className="h-[250px] sm:h-[350px] lg:h-[400px]"
              />
            )}

            {/* Compact mode - list view */}
            {isCompact ? (
              <div className="space-y-1">
                {visibleArticles.map((article, index) => (
                  <NewsCard
                    key={`${article.id}-${index}`}
                    id={article.id}
                    title={article.title}
                    category={article.category}
                    image={article.image}
                    timestamp={article.timestamp}
                    source={article.source}
                    sourceUrl={'sourceUrl' in article ? article.sourceUrl : undefined}
                    badge={'badge' in article ? article.badge : undefined}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              /* Grid of Articles */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {gridArticles.map((article, index) => (
                  <NewsCard
                    key={`${article.id}-${index}`}
                    id={article.id}
                    title={article.title}
                    category={article.category}
                    image={article.image}
                    timestamp={article.timestamp}
                    source={article.source}
                    sourceUrl={'sourceUrl' in article ? article.sourceUrl : undefined}
                    badge={'badge' in article ? article.badge : undefined}
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
              {isLoading && hasMore && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                  <span className="text-sm sm:text-base">Ładowanie więcej artykułów...</span>
                </div>
              )}
              
              {!hasMore && filteredArticles.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  To wszystkie artykuły w tej kategorii
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
