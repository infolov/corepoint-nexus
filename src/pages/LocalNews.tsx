import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { useLocalNews, formatLocalArticleForCard } from "@/hooks/use-local-news";
import { useUserSettings } from "@/hooks/use-user-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, RefreshCw, Settings, Building2, Map, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AuctionAdSlot } from "@/components/widgets/AuctionAdSlot";
import { LocalLocationSelector } from "@/components/local/LocalLocationSelector";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LOCAL_SUBCATEGORIES } from "@/data/categories";
import { UserLocation } from "@/hooks/use-geolocation";

const voivodeshipNames: Record<string, string> = {
  'mazowieckie': 'Mazowieckie',
  'pomorskie': 'Pomorskie',
  'malopolskie': 'Małopolskie',
  'małopolskie': 'Małopolskie',
  'slaskie': 'Śląskie',
  'śląskie': 'Śląskie',
  'wielkopolskie': 'Wielkopolskie',
  'dolnoslaskie': 'Dolnośląskie',
  'dolnośląskie': 'Dolnośląskie',
  'lodzkie': 'Łódzkie',
  'łódzkie': 'Łódzkie',
  'zachodniopomorskie': 'Zachodniopomorskie',
  'kujawsko-pomorskie': 'Kujawsko-Pomorskie',
  'lubelskie': 'Lubelskie',
  'podkarpackie': 'Podkarpackie',
  'podlaskie': 'Podlaskie',
  'warminsko-mazurskie': 'Warmińsko-Mazurskie',
  'warmińsko-mazurskie': 'Warmińsko-Mazurskie',
  'lubuskie': 'Lubuskie',
  'swietokrzyskie': 'Świętokrzyskie',
  'świętokrzyskie': 'Świętokrzyskie',
  'opolskie': 'Opolskie',
};

export default function LocalNews() {
  const { refreshSettings } = useUserSettings();
  const { 
    articles, 
    loading, 
    error, 
    refetch, 
    hasLocation,
    locationLevel,
    mixStats,
    displayLocation,
    userSettings,
  } = useLocalNews();
  const [activeCategory, setActiveCategory] = useState("lokalne");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
  };

  const handleLocationSet = useCallback((location: UserLocation) => {
    // Refresh settings to reload with new location
    refreshSettings();
  }, [refreshSettings]);

  // Get display name for current location
  const getLocationDisplayName = () => {
    if (userSettings.city) return userSettings.city;
    if (userSettings.county) return userSettings.county;
    if (userSettings.voivodeship) {
      return voivodeshipNames[userSettings.voivodeship] || userSettings.voivodeship;
    }
    return displayLocation ? voivodeshipNames[displayLocation] || displayLocation : null;
  };

  // Get location level icon
  const getLocationIcon = () => {
    switch (locationLevel) {
      case "city": return <Building2 className="h-4 w-4" />;
      case "county": return <Map className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  // Get location level label
  const getLocationLevelLabel = () => {
    switch (locationLevel) {
      case "city": return "Miasto";
      case "county": return "Powiat";
      default: return "Województwo";
    }
  };

  // Filter articles by subcategory
  const filteredArticles = activeSubcategory
    ? articles.filter(article => {
        const title = article.title.toLowerCase();
        const excerpt = article.excerpt?.toLowerCase() || "";
        const keywords = LOCAL_SUBCATEGORIES.find(s => s.slug === activeSubcategory)?.slug || "";
        return title.includes(keywords) || excerpt.includes(keywords);
      })
    : articles;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6">
        {/* Show location selector if no location is set */}
        {!hasLocation ? (
          <div className="max-w-lg mx-auto py-12">
            <LocalLocationSelector 
              onLocationSet={handleLocationSet}
              onSkip={() => {
                // Optionally allow skipping - could show all regions
              }}
            />
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">Wiadomości Lokalne</h1>
                    <Badge variant="secondary" className="gap-1">
                      {getLocationIcon()}
                      {getLocationLevelLabel()}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {getLocationDisplayName()}
                    {locationLevel === "city" && (
                      <span className="text-xs ml-2 text-muted-foreground">
                        (80% miasto • 15% powiat • 5% woj.)
                      </span>
                    )}
                    {locationLevel === "county" && (
                      <span className="text-xs ml-2 text-muted-foreground">
                        (85% powiat • 15% woj.)
                      </span>
                    )}
                  </p>
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
                    Zmień lokalizację
                  </Link>
                </Button>
              </div>
            </div>

            {/* Local Subcategories */}
            <div className="mb-6 overflow-x-auto pb-2">
              <Tabs 
                value={activeSubcategory || "all"} 
                onValueChange={(v) => setActiveSubcategory(v === "all" ? null : v)}
              >
                <TabsList className="bg-muted/50 h-auto flex-wrap gap-1 p-1">
                  <TabsTrigger value="all" className="text-xs px-3 py-1.5">
                    Wszystkie
                  </TabsTrigger>
                  {LOCAL_SUBCATEGORIES.map((sub) => (
                    <TabsTrigger 
                      key={sub.slug} 
                      value={sub.slug}
                      className="text-xs px-3 py-1.5"
                    >
                      {sub.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Compact location changer */}
            {hasLocation && (
              <div className="mb-6">
                <LocalLocationSelector 
                  onLocationSet={handleLocationSet}
                  compact
                />
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

            {/* Empty State */}
            {!loading && !error && filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Brak wiadomości lokalnych</h3>
                <p className="text-muted-foreground mb-4">
                  {activeSubcategory 
                    ? "Nie znaleźliśmy wiadomości w tej kategorii. Spróbuj innej."
                    : "Nie znaleźliśmy wiadomości dla Twojego regionu. Spróbuj później."
                  }
                </p>
                {activeSubcategory && (
                  <Button variant="outline" onClick={() => setActiveSubcategory(null)}>
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
                    <div className="relative">
                      {article.locationLevel && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge 
                            variant="secondary" 
                            className="text-[10px] bg-background/80 backdrop-blur-sm"
                          >
                            {article.locationLevel === "city" && "Miasto"}
                            {article.locationLevel === "county" && "Powiat"}
                            {article.locationLevel === "voivodeship" && "Województwo"}
                          </Badge>
                        </div>
                      )}
                      <NewsCard {...formatLocalArticleForCard(article)} />
                    </div>
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

            {/* Mix Stats (Debug - can remove in production) */}
            {!loading && mixStats && mixStats.total > 0 && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                <div className="flex gap-4 justify-center">
                  <span>Miasto: {mixStats.actualCounts.city}</span>
                  <span>Powiat: {mixStats.actualCounts.county}</span>
                  <span>Województwo: {mixStats.actualCounts.voivodeship}</span>
                  <span>Razem: {mixStats.total}</span>
                </div>
              </div>
            )}

            {/* Bottom Ad */}
            <div className="mt-8">
              <AuctionAdSlot variant="horizontal" placementSlug="footer" className="w-full" slotIndex={3} />
            </div>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
