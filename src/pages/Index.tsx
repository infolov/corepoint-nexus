import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSlider } from "@/components/news/HeroSlider";
import { NewsSection } from "@/components/sections/NewsSection";
import { NewsCard } from "@/components/news/NewsCard";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { TrendingWidget } from "@/components/widgets/TrendingWidget";
import { AdBanner } from "@/components/widgets/AdBanner";
import { useArticles, Article } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: newsArticles = [], isLoading: newsLoading } = useArticles("Wiadomości");
  const { data: businessArticles = [], isLoading: businessLoading } = useArticles("Biznes");
  const { data: sportArticles = [], isLoading: sportLoading } = useArticles("Sport");
  const { data: techArticles = [], isLoading: techLoading } = useArticles("Technologia");
  const { data: lifestyleArticles = [], isLoading: lifestyleLoading } = useArticles("Lifestyle");
  const { data: allArticles = [] } = useArticles();

  const recommendedArticles = allArticles.slice(0, 4);

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
            {newsLoading ? (
              <NewsSectionSkeleton />
            ) : (
              <NewsSection
                title="Najnowsze wiadomości"
                category="news"
                articles={newsArticles}
              />
            )}

            {businessLoading ? (
              <NewsSectionSkeleton />
            ) : (
              <NewsSection
                title="Biznes i finanse"
                category="business"
                articles={businessArticles}
              />
            )}

            {sportLoading ? (
              <NewsSectionSkeleton />
            ) : (
              <NewsSection
                title="Sport"
                category="sport"
                articles={sportArticles}
              />
            )}

            {techLoading ? (
              <NewsSectionSkeleton />
            ) : (
              <NewsSection
                title="Technologia"
                category="tech"
                articles={techArticles}
              />
            )}

            {lifestyleLoading ? (
              <NewsSectionSkeleton />
            ) : (
              <NewsSection
                title="Lifestyle"
                category="lifestyle"
                articles={lifestyleArticles}
              />
            )}
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
                    id={article.id}
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

function NewsSectionSkeleton() {
  return (
    <section className="mb-10">
      <Skeleton className="h-8 w-48 mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl overflow-hidden shadow-sm">
            <Skeleton className="aspect-[16/10]" />
            <div className="p-4">
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-3" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Index;
