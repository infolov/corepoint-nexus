import { useState } from "react";
import { Monitor, Smartphone, Tablet, RotateCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DynamicHeaderBranding } from "@/components/layout/DynamicHeaderBranding";
import { FeedBannerCarousel } from "@/components/widgets/FeedBannerCarousel";

const categories = [
  { slug: "home", name: "Strona główna" },
  { slug: "wiadomosci", name: "Wiadomości" },
  { slug: "sport", name: "Sport" },
  { slug: "biznes", name: "Biznes" },
  { slug: "technologia", name: "Technologia" },
  { slug: "lifestyle", name: "Lifestyle" },
  { slug: "rozrywka", name: "Rozrywka" },
];

// Mock banner data for preview
const mockBanners = [
  {
    id: "1",
    campaignId: "mock-1",
    imageUrl: null,
    text: "Przykładowy Baner 1 - Reklama Ogólnokrajowa",
    targetUrl: "#",
    isLocal: false,
  },
  {
    id: "2",
    campaignId: "mock-2",
    imageUrl: null,
    text: "Przykładowy Baner 2 - Reklama Lokalna",
    targetUrl: "#",
    isLocal: true,
  },
  {
    id: "3",
    campaignId: "mock-3",
    imageUrl: null,
    text: "Przykładowy Baner 3 - Promocja",
    targetUrl: "#",
    isLocal: false,
  },
];

export default function DashboardPreview() {
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewCategory, setPreviewCategory] = useState("home");
  const [key, setKey] = useState(0);

  const deviceSizes = {
    desktop: "w-full",
    tablet: "max-w-[768px]",
    mobile: "max-w-[375px]",
  };

  const resetPreview = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Podgląd Reklam
          </h1>
          <p className="text-muted-foreground">
            Zobacz jak Twoje reklamy wyglądają na różnych urządzeniach
          </p>
        </div>
        <Button variant="outline" onClick={resetPreview}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Odśwież podgląd
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Ustawienia podglądu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Device selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Urządzenie:</span>
              <div className="flex gap-1">
                <Button
                  variant={deviceView === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeviceView("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={deviceView === "tablet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeviceView("tablet")}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={deviceView === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeviceView("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Category selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Strona:</span>
              <Select value={previewCategory} onValueChange={setPreviewCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Wybierz stronę" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Tabs */}
      <Tabs defaultValue="header" className="space-y-4">
        <TabsList>
          <TabsTrigger value="header">Nagłówek (Rotacja Partnera)</TabsTrigger>
          <TabsTrigger value="carousel">Karuzela Banerów</TabsTrigger>
          <TabsTrigger value="full">Pełna Strona</TabsTrigger>
        </TabsList>

        {/* Header Preview */}
        <TabsContent value="header">
          <Card>
            <CardHeader>
              <CardTitle>Podgląd Nagłówka</CardTitle>
              <CardDescription>
                {previewCategory 
                  ? `Na stronie kategorii "${categories.find(c => c.slug === previewCategory)?.name}" nagłówek będzie rotował co 10 sekund między Partnerem Serwisu a Partnerem Kategorii (jeśli aktywny)`
                  : "Na stronie głównej wyświetlany jest statycznie Partner Serwisu"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("mx-auto transition-all", deviceSizes[deviceView])}>
                <div className="bg-nav text-nav-foreground p-4 rounded-lg" key={key}>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "font-bold tracking-tight",
                      deviceView === "mobile" ? "text-lg" : "text-2xl"
                    )}>
                      informacje<span className="text-primary">.pl</span>
                    </span>
                    {/* Simulated branding - in real app this would be DynamicHeaderBranding */}
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 border-l border-nav-foreground/20",
                      deviceView === "mobile" && "text-xs"
                    )}>
                      <span className="text-nav-foreground/60">
                        {previewCategory ? "Partner Kategorii:" : "Partner Serwisu:"}
                      </span>
                      <div className={cn(
                        "bg-nav-foreground/10 rounded flex items-center justify-center",
                        deviceView === "mobile" ? "h-6 w-16" : "h-10 w-28"
                      )}>
                        <span className={cn(
                          "text-nav-foreground/50",
                          deviceView === "mobile" ? "text-[8px]" : "text-sm"
                        )}>
                          Logo partnera
                        </span>
                      </div>
                    </div>
                  </div>
                  {previewCategory && (
                    <p className="text-xs text-nav-foreground/60 mt-2">
                      ⟳ Rotacja co 10 sekund między Partnerem Serwisu a Partnerem Kategorii
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carousel Preview */}
        <TabsContent value="carousel">
          <Card>
            <CardHeader>
              <CardTitle>Podgląd Karuzeli Banerów</CardTitle>
              <CardDescription>
                Karuzela wyświetla 1-4 banery. Przy jednym banerze nawigacja jest ukryta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={cn("mx-auto transition-all", deviceSizes[deviceView])}>
                {/* Preview with multiple banners */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Karuzela z 3 banerami (auto-rotacja):</p>
                    <FeedBannerCarousel 
                      banners={mockBanners} 
                      key={`carousel-3-${key}`}
                    />
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Karuzela z 1 banerem (bez nawigacji):</p>
                    <FeedBannerCarousel 
                      banners={[mockBanners[0]]} 
                      key={`carousel-1-${key}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Full Page Preview */}
        <TabsContent value="full">
          <Card>
            <CardHeader>
              <CardTitle>Podgląd Pełnej Strony</CardTitle>
              <CardDescription>
                Symulacja wyglądu strony z karuzelami co 12 kafelków
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "mx-auto border rounded-lg overflow-hidden bg-background",
                deviceSizes[deviceView]
              )}>
                {/* Header simulation */}
                <div className="bg-nav text-nav-foreground p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={deviceView === "mobile" ? "text-sm font-bold" : "text-xl font-bold"}>
                        informacje<span className="text-primary">.pl</span>
                      </span>
                      <div className="flex items-center gap-1 px-2 py-1 border-l border-nav-foreground/20">
                        <span className="text-[10px] text-nav-foreground/60">Partner:</span>
                        <div className="h-5 w-12 bg-nav-foreground/10 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content simulation */}
                <div className="p-4 space-y-4">
                  {/* Top banner */}
                  <div className="w-full h-16 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                    Top Banner (Ogólnokrajowy)
                  </div>

                  {/* Articles grid simulation */}
                  <div className={cn(
                    "grid gap-2",
                    deviceView === "mobile" ? "grid-cols-1" : deviceView === "tablet" ? "grid-cols-2" : "grid-cols-3"
                  )}>
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="aspect-video bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        Artykuł {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Carousel after 12 items */}
                  <div className="relative">
                    <FeedBannerCarousel banners={mockBanners.slice(0, 2)} />
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      ↑ Karuzela po 12 kafelkach
                    </p>
                  </div>

                  {/* More articles */}
                  <div className={cn(
                    "grid gap-2",
                    deviceView === "mobile" ? "grid-cols-1" : deviceView === "tablet" ? "grid-cols-2" : "grid-cols-3"
                  )}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-video bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        Artykuł {i + 13}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Wskazówki</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Rotacja partnera w nagłówku działa tylko na stronach kategorii z aktywnym partnerem</li>
                <li>• Karuzela automatycznie ukrywa nawigację gdy ma tylko 1 baner</li>
                <li>• Banery lokalne są oznaczone etykietą "Lokalne" i wyświetlane użytkownikom z odpowiedniego regionu</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
