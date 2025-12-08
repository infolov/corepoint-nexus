import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { TrendingWidget } from "@/components/widgets/TrendingWidget";
import { useArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Flame } from "lucide-react";

const Index = () => {
  const { data: allArticles = [], isLoading } = useArticles();
  const { data: newsArticles = [] } = useArticles("Wiadomości");
  const { data: businessArticles = [] } = useArticles("Biznes");
  const { data: sportArticles = [] } = useArticles("Sport");
  const { data: techArticles = [] } = useArticles("Technologia");

  // Combine all articles for the feed
  const feedArticles = [...allArticles].slice(0, 20);
  const heroArticle = feedArticles[0];
  const sideArticles = feedArticles.slice(1, 4);
  const gridArticles = feedArticles.slice(4, 12);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <LoadingSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Hero Section - MSN Style Grid */}
        <section className="mb-8">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Large Hero Card */}
            <div className="lg:col-span-2">
              {heroArticle && (
                <NewsCard
                  id={heroArticle.id}
                  title={heroArticle.title}
                  category={heroArticle.category}
                  image={heroArticle.image}
                  timestamp={heroArticle.timestamp}
                  variant="large"
                  badge="trending"
                />
              )}
            </div>

            {/* Side Cards */}
            <div className="space-y-4">
              {sideArticles.map((article) => (
                <NewsCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  category={article.category}
                  image={article.image}
                  timestamp={article.timestamp}
                  variant="horizontal"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Feed - 3 columns */}
          <div className="lg:col-span-3">
            {/* Article Grid - MSN masonry-like */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gridArticles.map((article, index) => (
                <NewsCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.category}
                  image={article.image}
                  timestamp={article.timestamp}
                  badge={index === 0 ? "trending" : index === 2 ? "local" : undefined}
                />
              ))}
            </div>

            {/* More Articles Section */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Więcej wiadomości
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...newsArticles, ...businessArticles, ...sportArticles]
                  .slice(0, 6)
                  .map((article) => (
                    <NewsCard
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      category={article.category}
                      image={article.image}
                      timestamp={article.timestamp}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            {/* Top Stories Widget */}
            <div className="bg-card rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                Najważniejsze
              </h3>
              <div className="space-y-0">
                {allArticles.slice(0, 5).map((article) => (
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

            {/* Trending Widget */}
            <TrendingWidget />

            {/* Tech Section */}
            {techArticles.length > 0 && (
              <div className="bg-card rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold mb-4">Technologia</h3>
                <div className="space-y-0">
                  {techArticles.slice(0, 3).map((article) => (
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
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

function LoadingSkeleton() {
  return (
    <>
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <Skeleton className="aspect-[16/9] rounded-xl" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-40 h-28 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card rounded-xl overflow-hidden">
            <Skeleton className="aspect-[16/10]" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Index;
