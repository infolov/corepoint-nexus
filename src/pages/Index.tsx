import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSlider } from "@/components/news/HeroSlider";
import { NewsCard } from "@/components/news/NewsCard";
import { TrendingWidget } from "@/components/widgets/TrendingWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { useArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Flame } from "lucide-react";

const Index = () => {
  const { data: allArticles = [], isLoading } = useArticles();
  const { data: newsArticles = [] } = useArticles("Wiadomości");
  const { data: sportArticles = [] } = useArticles("Sport");
  const { data: techArticles = [] } = useArticles("Technologia");

  // Get articles for different sections
  const gridArticles = allArticles.slice(0, 6);
  const topStories = allArticles.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-4">
        {/* Hero Section - MSN Grid Style */}
        <section className="mb-6">
          <HeroSlider />
        </section>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* News Grid - MSN Style */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg overflow-hidden">
                    <Skeleton className="aspect-[16/10]" />
                    <div className="p-3">
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gridArticles.map((article, index) => (
                  <NewsCard
                    key={article.id}
                    id={article.id}
                    title={article.title}
                    category={article.category}
                    image={article.image}
                    timestamp={article.timestamp}
                    badge={index === 0 ? "trending" : undefined}
                    variant="medium"
                  />
                ))}
              </div>
            )}

            {/* News Section */}
            {newsArticles.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Wiadomości
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {newsArticles.slice(0, 4).map((article) => (
                    <NewsCard
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      category={article.category}
                      image={article.image}
                      timestamp={article.timestamp}
                      variant="small"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Sport Section */}
            {sportArticles.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Sport</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sportArticles.slice(0, 4).map((article) => (
                    <NewsCard
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      category={article.category}
                      image={article.image}
                      timestamp={article.timestamp}
                      variant="small"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Tech Section */}
            {techArticles.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Technologia</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {techArticles.slice(0, 4).map((article) => (
                    <NewsCard
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      category={article.category}
                      image={article.image}
                      timestamp={article.timestamp}
                      variant="small"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <aside className="space-y-4">
            {/* Top Stories Widget */}
            <div className="bg-card rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top stories
              </h3>
              <div className="divide-y divide-border">
                {topStories.map((article) => (
                  <NewsCard
                    key={article.id}
                    id={article.id}
                    title={article.title}
                    category={article.category}
                    image={article.image}
                    timestamp={article.timestamp}
                    variant="list"
                  />
                ))}
              </div>
            </div>

            {/* Weather Widget */}
            <WeatherWidget />

            {/* Trending Widget */}
            <TrendingWidget />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
