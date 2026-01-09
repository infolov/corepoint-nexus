import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/navigation/CategoryBar";
import { NewsCard } from "@/components/news/NewsCard";
import { useLocalNews, formatLocalArticleForCard } from "@/hooks/use-local-news";
import { useUserSettings } from "@/hooks/use-user-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { AuctionAdSlot } from "@/components/widgets/AuctionAdSlot";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const voivodeshipNames: Record<string, string> = {
  'mazowieckie': 'Mazowieckie',
  'pomorskie': 'Pomorskie',
  'malopolskie': 'Małopolskie',
  'slaskie': 'Śląskie',
  'wielkopolskie': 'Wielkopolskie',
  'dolnoslaskie': 'Dolnośląskie',
  'lodzkie': 'Łódzkie',
  'zachodniopomorskie': 'Zachodniopomorskie',
  'kujawsko-pomorskie': 'Kujawsko-Pomorskie',
  'lubelskie': 'Lubelskie',
  'podkarpackie': 'Podkarpackie',
  'podlaskie': 'Podlaskie',
  'warminsko-mazurskie': 'Warmińsko-Mazurskie',
  'lubuskie': 'Lubuskie',
  'swietokrzyskie': 'Świętokrzyskie',
  'opolskie': 'Opolskie',
};

export default function LocalNews() {
  const [searchParams] = useSearchParams();
  const regionParam = searchParams.get('region');
  const { settings } = useUserSettings();
  const { articles, loading, error, refetch, detectedVoivodeship, hasLocation } = useLocalNews();
  const [activeCategory, setActiveCategory] = useState("lokalne");

  const currentRegion = detectedVoivodeship || settings.voivodeship;
  const regionDisplayName = currentRegion ? voivodeshipNames[currentRegion] || currentRegion : null;

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryBar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
      
      <main className="container py-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Wiadomości Lokalne</h1>
              {regionDisplayName ? (
                <p className="text-muted-foreground">
                  Region: <span className="font-medium text-foreground">{regionDisplayName}</span>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Ustaw lokalizację, aby zobaczyć lokalne wiadomości
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Odśwież
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ustawienia">
                <Settings className="h-4 w-4 mr-2" />
                Zmień region
              </Link>
            </Button>
          </div>
        </div>

        {/* Region Selector for users without location */}
        {!hasLocation && (
          <div className="bg-muted/50 rounded-lg p-6 mb-6 border border-border">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Wybierz swój region</h3>
                <p className="text-sm text-muted-foreground">
                  Aby zobaczyć wiadomości lokalne, wybierz województwo lub włącz lokalizację w ustawieniach.
                </p>
              </div>
              <Select>
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="Wybierz województwo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(voivodeshipNames).map(([slug, name]) => (
                    <SelectItem key={slug} value={slug}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Ad Banner */}
        <div className="mb-6">
          <AuctionAdSlot variant="horizontal" className="w-full" slotIndex={0} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refetch}>Spróbuj ponownie</Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brak wiadomości lokalnych</h3>
            <p className="text-muted-foreground mb-4">
              {hasLocation 
                ? "Nie znaleźliśmy wiadomości dla Twojego regionu. Spróbuj później."
                : "Ustaw swoją lokalizację, aby zobaczyć lokalne wiadomości."
              }
            </p>
            {!hasLocation && (
              <Button asChild>
                <Link to="/ustawienia">Ustaw lokalizację</Link>
              </Button>
            )}
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <div key={article.id}>
                <NewsCard {...formatLocalArticleForCard(article)} />
                {/* Inject ad after every 6 articles */}
                {(index + 1) % 6 === 0 && index < articles.length - 1 && (
                  <div className="mt-6">
                    <AuctionAdSlot 
                      variant="horizontal" 
                      className="w-full" 
                      slotIndex={Math.floor((index + 1) / 6)} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom Ad */}
        <div className="mt-8">
          <AuctionAdSlot variant="horizontal" className="w-full" slotIndex={3} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
