import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSlider } from "@/components/news/HeroSlider";
import { NewsSection } from "@/components/sections/NewsSection";
import { NewsCard } from "@/components/news/NewsCard";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { TrendingWidget } from "@/components/widgets/TrendingWidget";
import { AdBanner } from "@/components/widgets/AdBanner";
import {
  newsArticles,
  businessArticles,
  sportArticles,
  techArticles,
  lifestyleArticles,
  recommendedArticles,
} from "@/data/mockNews";

const Index = () => {
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
            <NewsSection
              title="Najnowsze wiadomości"
              category="wiadomosci"
              articles={newsArticles}
            />

            <NewsSection
              title="Biznes i finanse"
              category="biznes"
              articles={businessArticles}
            />

            <NewsSection
              title="Sport"
              category="sport"
              articles={sportArticles}
            />

            <NewsSection
              title="Technologia"
              category="technologia"
              articles={techArticles}
            />

            <NewsSection
              title="Lifestyle"
              category="lifestyle"
              articles={lifestyleArticles}
            />
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
