import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSlider } from "@/components/news/HeroSlider";
import { NewsSection } from "@/components/sections/NewsSection";
import { NewsCard } from "@/components/news/NewsCard";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { TrendingWidget } from "@/components/widgets/TrendingWidget";
import { AdBanner } from "@/components/widgets/AdBanner";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { Loader2 } from "lucide-react";
import {
  newsArticles,
  businessArticles,
  sportArticles,
  techArticles,
  lifestyleArticles,
  recommendedArticles,
} from "@/data/mockNews";

// Define all available sections
const allSections = [
  { id: "news", title: "Najnowsze wiadomości", category: "wiadomosci", articles: newsArticles },
  { id: "business", title: "Biznes i finanse", category: "biznes", articles: businessArticles },
  { id: "sport", title: "Sport", category: "sport", articles: sportArticles },
  { id: "tech", title: "Technologia", category: "technologia", articles: techArticles },
  { id: "lifestyle", title: "Lifestyle", category: "lifestyle", articles: lifestyleArticles },
  // Additional sections for infinite scroll
  { id: "news2", title: "Więcej wiadomości", category: "wiadomosci", articles: newsArticles },
  { id: "business2", title: "Więcej z biznesu", category: "biznes", articles: businessArticles },
  { id: "sport2", title: "Więcej ze sportu", category: "sport", articles: sportArticles },
  { id: "tech2", title: "Więcej z technologii", category: "technologia", articles: techArticles },
  { id: "lifestyle2", title: "Więcej z lifestyle", category: "lifestyle", articles: lifestyleArticles },
];

const INITIAL_SECTIONS = 3;
const SECTIONS_PER_LOAD = 2;

const Index = () => {
  const [visibleSections, setVisibleSections] = useState(INITIAL_SECTIONS);
  
  const hasMore = visibleSections < allSections.length;
  
  const loadMore = useCallback(() => {
    setVisibleSections((prev) => Math.min(prev + SECTIONS_PER_LOAD, allSections.length));
  }, []);

  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);

  const sectionsToShow = allSections.slice(0, visibleSections);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Hero Section */}
        <section className="mb-8">
          <HeroSlider />
        </section>

        {/* Ad Banner */}
        <div className="mb-8">
          <AdBanner variant="horizontal" className="w-full" />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left/Main Column - News */}
          <div className="lg:col-span-2 space-y-8">
            {sectionsToShow.map((section, index) => (
              <div key={section.id}>
                <NewsSection
                  title={section.title}
                  category={section.category}
                  articles={section.articles}
                />
                {/* Insert ad every 2 sections */}
                {(index + 1) % 2 === 0 && index !== sectionsToShow.length - 1 && (
                  <div className="my-8">
                    <AdBanner variant="horizontal" className="w-full" />
                  </div>
                )}
              </div>
            ))}

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Ładowanie...</span>
                </div>
              )}
              {!hasMore && (
                <p className="text-muted-foreground text-sm">
                  To już wszystkie wiadomości
                </p>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            {/* Weather */}
            <WeatherWidget />

            {/* Ad */}
            <AdBanner variant="square" />

            {/* Trending */}
            <TrendingWidget />

            {/* Recommended */}
            <div className="bg-card rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Polecane dla Ciebie</h3>
              <div className="space-y-1">
                {recommendedArticles.map((article) => (
                  <NewsCard
                    key={article.id}
                    title={article.title}
                    category={article.category}
                    image={article.image}
                    timestamp={article.timestamp}
                    variant="compact"
                  />
                ))}
              </div>
            </div>

            {/* Vertical Ad */}
            <AdBanner variant="vertical" />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
