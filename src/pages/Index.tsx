import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSlider } from "@/components/news/HeroSlider";
import { NewsSection } from "@/components/sections/NewsSection";
import { AdBanner } from "@/components/widgets/AdBanner";
import { WeatherPanel } from "@/components/widgets/WeatherPanel";
import { FinanceWidget } from "@/components/widgets/FinanceWidget";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
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

// Base sections that cycle infinitely
const baseSections = [
  { title: "Najnowsze wiadomości", category: "wiadomosci", articles: newsArticles },
  { title: "Biznes i finanse", category: "biznes", articles: businessArticles },
  { title: "Sport", category: "sport", articles: sportArticles },
  { title: "Technologia", category: "technologia", articles: techArticles },
  { title: "Lifestyle", category: "lifestyle", articles: lifestyleArticles },
];

// Responsive initial sections based on device
const INITIAL_SECTIONS = 3;
const SECTIONS_PER_LOAD = 2;

// Generate sections dynamically for infinite scroll
const generateSections = (count: number) => {
  const sections = [];
  for (let i = 0; i < count; i++) {
    const baseIndex = i % baseSections.length;
    const cycle = Math.floor(i / baseSections.length);
    const base = baseSections[baseIndex];
    sections.push({
      id: `${base.category}-${i}`,
      title: cycle === 0 ? base.title : `${base.title} #${cycle + 1}`,
      category: base.category,
      articles: base.articles,
    });
  }
  return sections;
};

const Index = () => {
  const [visibleSections, setVisibleSections] = useState(INITIAL_SECTIONS);
  const { settings } = useUserSettings();
  const { articles: dbArticles, loading: articlesLoading } = useArticles({ limit: 50 });
  
  // Always has more - infinite scroll
  const hasMore = true;
  
  const loadMore = useCallback(() => {
    setVisibleSections((prev) => prev + SECTIONS_PER_LOAD);
  }, []);

  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);

  // Use database articles if available, otherwise use mock data
  const formattedDbArticles = dbArticles.map(formatArticleForCard);
  
  // Group database articles by category
  const articlesByCategory = formattedDbArticles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, typeof formattedDbArticles>);

  // Create sections with DB articles if available, fallback to mock data
  const getSectionArticles = (category: string, mockArticles: typeof newsArticles) => {
    const dbCategoryArticles = articlesByCategory[category];
    return dbCategoryArticles && dbCategoryArticles.length > 0 ? dbCategoryArticles : mockArticles;
  };

  const sectionsToShow = generateSections(visibleSections);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Hero Section */}
        <section className="mb-8">
          <HeroSlider />
        </section>

        {/* Weather Panel, Finance Widget & Ad Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <WeatherPanel />
          <FinanceWidget />
          <AdBanner variant="vertical" className="w-full h-full min-h-[300px]" />
        </div>

        {/* Region indicator */}
        {settings.voivodeship && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Artykuły dla regionu: <strong className="text-foreground">{regionLabels[settings.voivodeship] || settings.voivodeship}</strong></span>
          </div>
        )}

        {/* Main Content - Full width news sections */}
        <div className="space-y-8">
          {sectionsToShow.map((section, index) => {
            // Get articles for this section - prefer DB articles
            const sectionArticles = getSectionArticles(section.category, section.articles);
            
            return (
              <div key={section.id}>
                <NewsSection
                  title={section.title}
                  category={section.category}
                  articles={sectionArticles}
                />
                {/* Insert ad every 2 sections */}
                {(index + 1) % 2 === 0 && index !== sectionsToShow.length - 1 && (
                  <div className="my-8">
                    <AdBanner variant="horizontal" className="w-full" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Load more trigger - infinite scroll */}
          <div 
            ref={loadMoreRef} 
            className="py-8 sm:py-10 md:py-12 flex justify-center min-h-[80px]"
          >
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                <span className="text-sm sm:text-base">Ładowanie więcej artykułów...</span>
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
