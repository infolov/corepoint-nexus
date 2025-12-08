import { useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { TrendingWidget } from "@/components/widgets/TrendingWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { useArticles } from "@/hooks/useArticles";

const categoryMap: Record<string, { title: string; dbCategory: string }> = {
  news: { title: "Wiadomości", dbCategory: "news" },
  sport: { title: "Sport", dbCategory: "sport" },
  business: { title: "Biznes", dbCategory: "biznes" },
  entertainment: { title: "Rozrywka", dbCategory: "rozrywka" },
  tech: { title: "Technologia", dbCategory: "tech" },
};

export default function Category() {
  const location = useLocation();
  const pathCategory = location.pathname.slice(1); // Remove leading slash
  const categoryInfo = categoryMap[pathCategory] || null;
  const { data: articles, isLoading } = useArticles(categoryInfo?.dbCategory);

  if (!categoryInfo) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8">
          <h1 className="text-2xl font-bold">Kategoria nie znaleziona</h1>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-6">{categoryInfo.title}</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(9)].map((_, i) => (
                    <Skeleton key={i} className="h-72 rounded-xl" />
                  ))}
                </div>
              ) : articles && articles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {articles.map((article) => (
                    <NewsCard
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      excerpt={article.excerpt || ""}
                      category={article.category}
                      image={article.image}
                      timestamp={article.timestamp}
                      badge={article.badge === "trending" ? "trending" : article.badge === "new" ? "local" : undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Brak artykułów w tej kategorii</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <WeatherWidget />
              <TrendingWidget />
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
