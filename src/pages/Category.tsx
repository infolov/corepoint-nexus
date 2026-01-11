import { useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { TrendingWidget } from "@/components/widgets/TrendingWidget";
import { AdBanner } from "@/components/widgets/AdBanner";
import { AuctionAdSlot } from "@/components/widgets/AuctionAdSlot";
import { FeedBannerCarousel, formatBannersForCarousel } from "@/components/widgets/FeedBannerCarousel";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { useCarouselBanners } from "@/hooks/use-carousel-banners";
import { Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  newsArticles,
  businessArticles,
  sportArticles,
  techArticles,
  lifestyleArticles,
  Article,
} from "@/data/mockNews";

// Categories with subcategories
const categoriesMenu = [
  {
    name: "Wiadomości",
    slug: "wiadomosci",
    subcategories: [
      { name: "Polityka krajowa", slug: "polityka-krajowa" },
      { name: "Polityka zagraniczna", slug: "polityka-zagraniczna" },
      { name: "Społeczeństwo", slug: "spoleczenstwo" },
      { name: "Gospodarka", slug: "gospodarka" },
    ],
  },
  {
    name: "Sport",
    slug: "sport",
    subcategories: [
      { name: "Piłka nożna", slug: "pilka-nozna" },
      { name: "Koszykówka", slug: "koszykowka" },
      { name: "Siatkówka", slug: "siatkowka" },
      { name: "Tenis", slug: "tenis" },
      { name: "F1", slug: "f1" },
    ],
  },
  {
    name: "Biznes",
    slug: "biznes",
    subcategories: [
      { name: "Finanse", slug: "finanse" },
      { name: "Giełda", slug: "gielda" },
      { name: "Nieruchomości", slug: "nieruchomosci" },
      { name: "Startupy", slug: "startupy" },
    ],
  },
  {
    name: "Technologia",
    slug: "technologia",
    subcategories: [
      { name: "AI", slug: "ai" },
      { name: "Smartfony", slug: "smartfony" },
      { name: "Gaming", slug: "gaming" },
      { name: "Cyberbezpieczeństwo", slug: "cyberbezpieczenstwo" },
    ],
  },
  {
    name: "Lifestyle",
    slug: "lifestyle",
    subcategories: [
      { name: "Zdrowie", slug: "zdrowie" },
      { name: "Moda", slug: "moda" },
      { name: "Podróże", slug: "podroze" },
      { name: "Kuchnia", slug: "kuchnia" },
    ],
  },
  {
    name: "Rozrywka",
    slug: "rozrywka",
    subcategories: [
      { name: "Film", slug: "film" },
      { name: "Muzyka", slug: "muzyka" },
      { name: "Gwiazdy", slug: "gwiazdy" },
      { name: "TV", slug: "tv" },
    ],
  },
];

// Combine all articles from all categories
const getAllArticles = (): Article[] => {
  const allBaseArticles = [
    ...newsArticles,
    ...businessArticles,
    ...sportArticles,
    ...techArticles,
    ...lifestyleArticles,
  ];
  
  // Shuffle and generate more articles for infinite scroll
  const shuffled = allBaseArticles.sort(() => Math.random() - 0.5);
  const additionalArticles: Article[] = [];
  
  for (let cycle = 0; cycle < 5; cycle++) {
    shuffled.forEach((article, i) => {
      additionalArticles.push({
        ...article,
        id: `${article.id}-cycle-${cycle}-${i}`,
        title: cycle === 0 ? article.title : `${article.title} ${cycle > 0 ? `#${cycle + 1}` : ''}`,
        timestamp: `${(cycle * shuffled.length) + i + 1} godz. temu`,
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { getCarouselForPosition } = useCarouselBanners();
  
  const allArticles = getAllArticles();
  
  const [visibleCount, setVisibleCount] = useState(getInitialCount);
  
  const hasMore = visibleCount < allArticles.length;
  
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + ARTICLES_PER_LOAD, allArticles.length));
  }, [allArticles.length]);

  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);
  
  const heroArticle = allArticles[0];
  const gridArticles = allArticles.slice(1, visibleCount);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Category Navigation Menu */}
      <div className="bg-card border-b border-border sticky top-12 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {categoriesMenu.map((cat) => (
              <div 
                key={cat.slug}
                className="relative"
                onMouseEnter={() => setOpenDropdown(cat.slug)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                    "hover:bg-muted text-foreground",
                    openDropdown === cat.slug && "bg-muted"
                  )}
                >
                  {cat.name}
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    openDropdown === cat.slug && "rotate-180"
                  )} />
                </button>
                
                {/* Dropdown */}
                {openDropdown === cat.slug && (
                  <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg py-2 min-w-[180px] z-50">
                    <Link
                      to={`/${cat.slug}`}
                      className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Wszystkie {cat.name}
                    </Link>
                    <div className="border-t border-border my-1" />
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.slug}
                        to={`/${cat.slug}/${sub.slug}`}
                        className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Top Ad Banner - National/Local */}
        <div className="mb-6">
          <AuctionAdSlot variant="horizontal" className="w-full" slotIndex={0} />
        </div>

        {/* Page Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 text-senior">
          Wszystkie Artykuły
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