import { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/navigation/CategoryBar";
import { NewsCard } from "@/components/news/NewsCard";
import { useLocalNews, formatLocalArticleForCard } from "@/hooks/use-local-news";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useLocalContentMixer, getLocationLevel } from "@/hooks/use-local-content-mixer";
import { LocalLocationSelector } from "@/components/geolocation/LocalLocationSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, RefreshCw, Settings, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useSearchParams } from "react-router-dom";
import { AuctionAdSlot } from "@/components/widgets/AuctionAdSlot";
import { LOCAL_SUBCATEGORIES, LocalSubCategory } from "@/data/categories";
import { UserLocation } from "@/hooks/use-geolocation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const voivodeshipNames: Record<string, string> = {
  'mazowieckie': 'Mazowieckie',
  'pomorskie': 'Pomorskie',
  'małopolskie': 'Małopolskie',
  'śląskie': 'Śląskie',
  'wielkopolskie': 'Wielkopolskie',
  'dolnośląskie': 'Dolnośląskie',
  'łódzkie': 'Łódzkie',
  'zachodniopomorskie': 'Zachodniopomorskie',
  'kujawsko-pomorskie': 'Kujawsko-Pomorskie',
  'lubelskie': 'Lubelskie',
  'podkarpackie': 'Podkarpackie',
  'podlaskie': 'Podlaskie',
  'warmińsko-mazurskie': 'Warmińsko-Mazurskie',
  'lubuskie': 'Lubuskie',
  'świętokrzyskie': 'Świętokrzyskie',
  'opolskie': 'Opolskie',
};

export default function LocalNews() {
  const [searchParams] = useSearchParams();
  const regionParam = searchParams.get('region');
  const { settings, refreshSettings } = useUserSettings();
  const { articles, loading, error, refetch, detectedVoivodeship, hasLocation } = useLocalNews();
  const [activeCategory, setActiveCategory] = useState("lokalne");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  // Build user location context
  const userLocation = useMemo(() => ({
    voivodeship: settings.voivodeship,
    county: settings.county,
    city: settings.city,
  }), [settings.voivodeship, settings.county, settings.city]);

  // Apply content mixing algorithm
  const { articles: mixedArticles, mixConfig, selectedLevel, stats } = useLocalContentMixer(
    articles,
    userLocation,
    50
  );

  // Filter by subcategory if selected
  const filteredArticles = useMemo(() => {
    if (!selectedSubcategory) return mixedArticles;
    
    const subcategory = LOCAL_SUBCATEGORIES.find(s => s.slug === selectedSubcategory);
    if (!subcategory) return mixedArticles;

    return mixedArticles.filter(article => {
      const content = `${article.title} ${article.excerpt}`.toLowerCase();
      return subcategory.keywords.some(keyword => content.includes(keyword.toLowerCase()));
    });
  }, [mixedArticles, selectedSubcategory]);

  const currentRegion = detectedVoivodeship || settings.voivodeship;
  const regionDisplayName = currentRegion ? voivodeshipNames[currentRegion] || currentRegion : null;
  const locationLevel = getLocationLevel(userLocation);

  // Get location display string
  const getLocationDisplay = () => {
    if (settings.city) return `${settings.city}, ${settings.county}`;
    if (settings.county) return `${settings.county}, ${regionDisplayName}`;
    return regionDisplayName;
  };

  // Handle location set from selector
  const handleLocationSet = (location: UserLocation) => {
    setShowLocationSelector(false);
    refreshSettings();
    refetch();
  };

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
              {hasLocation ? (
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">
                    {getLocationDisplay()}
                  </p>
                  {locationLevel !== "voivodeship" && locationLevel !== "none" && (
                    <Badge variant="secondary" className="text-xs">
                      {locationLevel === "city" ? "miasto" : "powiat"}
                    </Badge>
                  )}
                </div>
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLocationSelector(!showLocationSelector)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Zmień region
            </Button>
          </div>
        </div>

        {/* Location Selector - shown if no location or user wants to change */}
        {(!hasLocation || showLocationSelector) && (
          <div className="mb-6">
            <LocalLocationSelector 
              onLocationSet={handleLocationSet}
              compact={hasLocation}
            />
          </div>
        )}

        {/* Content Mix Info - only show if has location */}
        {hasLocation && selectedLevel !== "none" && (
          <div className="bg-muted/30 rounded-lg p-3 mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                Miks treści: 
                {mixConfig.cityPercentage > 0 && (
                  <span className="ml-1">
                    <Badge variant="default" className="text-xs mr-1">{stats.cityCount}</Badge>
                    miasto
                  </span>
                )}
                {mixConfig.countyPercentage > 0 && (
                  <span className="ml-1">
                    <Badge variant="secondary" className="text-xs mr-1">{stats.countyCount}</Badge>
                    powiat
                  </span>
                )}
                {mixConfig.voivodeshipPercentage > 0 && (
                  <span className="ml-1">
                    <Badge variant="outline" className="text-xs mr-1">{stats.voivodeshipCount}</Badge>
                    województwo
                  </span>
                )}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Łącznie: {stats.totalCount} artykułów
            </span>
          </div>
        )}

        {/* Subcategory Filter */}
        {hasLocation && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Kategorie lokalne:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedSubcategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSubcategory(null)}
              >
                Wszystkie
              </Button>
              {LOCAL_SUBCATEGORIES.map((subcat) => (
                <Button
                  key={subcat.slug}
                  variant={selectedSubcategory === subcat.slug ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSubcategory(subcat.slug)}
                >
                  {subcat.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Ad Banner */}
        <div className="mb-6">
          <AuctionAdSlot variant="horizontal" placementSlug="top-banner" className="w-full" slotIndex={0} />
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

        {/* Empty State - No Location */}
        {!loading && !error && !hasLocation && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ustaw lokalizację</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Aby zobaczyć wiadomości lokalne, wybierz swoją lokalizację powyżej.
              Im dokładniej ją określisz, tym bardziej spersonalizowane będą treści.
            </p>
          </div>
        )}

        {/* Empty State - No Articles */}
        {!loading && !error && hasLocation && filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brak wiadomości lokalnych</h3>
            <p className="text-muted-foreground mb-4">
              {selectedSubcategory 
                ? "Nie znaleźliśmy wiadomości w tej kategorii. Spróbuj innej lub wyświetl wszystkie."
                : "Nie znaleźliśmy wiadomości dla Twojego regionu. Spróbuj później."
              }
            </p>
            {selectedSubcategory && (
              <Button variant="outline" onClick={() => setSelectedSubcategory(null)}>
                Pokaż wszystkie
              </Button>
            )}
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && filteredArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, index) => (
              <div key={article.id}>
                <NewsCard {...formatLocalArticleForCard(article)} />
                {/* Inject ad after every 6 articles */}
                {(index + 1) % 6 === 0 && index < filteredArticles.length - 1 && (
                  <div className="mt-6">
                    <AuctionAdSlot 
                      variant="horizontal" 
                      placementSlug="feed-tile"
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
          <AuctionAdSlot variant="horizontal" placementSlug="footer" className="w-full" slotIndex={3} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
