import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Monitor, 
  Smartphone, 
  Square, 
  FileText, 
  Video, 
  ArrowRight,
  Calendar,
  Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface AdPlacement {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  dimensions: string | null;
  credit_cost: number;
  is_active: boolean;
}

const placementIcons: Record<string, any> = {
  "top-banner": Monitor,
  "article-top": Monitor,
  "article-middle": FileText,
  "article-bottom": Monitor,
  "feed-tile": Square,
  "feed-carousel": Video,
};

// Site layout visualization showing ad placements
function SiteLayoutPreview({ highlightedPlacement }: { highlightedPlacement: string | null }) {
  const isHighlighted = (slug: string) => highlightedPlacement === slug;
  const baseClasses = "border-2 rounded flex items-center justify-center text-xs transition-colors";
  const activeClasses = "bg-primary/20 border-primary text-primary font-medium";
  const inactiveClasses = "bg-muted border-dashed border-muted-foreground/30 text-muted-foreground";

  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
      <p className="text-xs text-muted-foreground text-center mb-2">Strona główna</p>
      
      {/* Header */}
      <div className="bg-background border rounded h-6 flex items-center px-2 text-[10px] text-muted-foreground">
        Nagłówek (Partner Serwisu)
      </div>
      
      {/* Top Banner */}
      <div className={`${baseClasses} h-10 ${isHighlighted("top-banner") ? activeClasses : inactiveClasses}`}>
        Baner Górny
      </div>
      
      {/* Feed with tiles and carousel */}
      <div className="grid grid-cols-3 gap-1">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-background border rounded h-8" />
        ))}
        {/* Feed Carousel slot */}
        <div className={`col-span-3 ${baseClasses} h-12 ${isHighlighted("feed-carousel") ? activeClasses : inactiveClasses}`}>
          Karuzela w Feedzie
        </div>
        {[7,8,9,10,11].map(i => (
          <div key={i} className="bg-background border rounded h-8" />
        ))}
        {/* Feed Tile slot */}
        <div className={`${baseClasses} h-8 ${isHighlighted("feed-tile") ? activeClasses : inactiveClasses}`}>
          Kafelek
        </div>
      </div>

      <div className="border-t pt-3 mt-3">
        <p className="text-xs text-muted-foreground text-center mb-2">Strona artykułu</p>
        
        {/* Article Top */}
        <div className={`${baseClasses} h-8 mb-2 ${isHighlighted("article-top") ? activeClasses : inactiveClasses}`}>
          Baner Górny (Artykuł)
        </div>
        
        {/* Article content */}
        <div className="bg-background border rounded h-12 mb-2 flex items-center justify-center text-[10px] text-muted-foreground">
          Treść artykułu
        </div>
        
        {/* Article Middle */}
        <div className={`${baseClasses} h-8 mb-2 ${isHighlighted("article-middle") ? activeClasses : inactiveClasses}`}>
          Baner Środkowy
        </div>
        
        {/* More content */}
        <div className="bg-background border rounded h-12 mb-2" />
        
        {/* Article Bottom */}
        <div className={`${baseClasses} h-8 ${isHighlighted("article-bottom") ? activeClasses : inactiveClasses}`}>
          Baner Dolny
        </div>
      </div>
    </div>
  );
}

export default function DashboardPlacements() {
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPlacement, setHoveredPlacement] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const { data, error } = await supabase
          .from("ad_placements")
          .select("*")
          .eq("is_active", true)
          .order("credit_cost", { ascending: true });

        if (error) throw error;
        setPlacements(data || []);
      } catch (error) {
        console.error("Error fetching placements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlacements();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Miejsca reklamowe</h1>
        <p className="text-muted-foreground mt-1">
          Wybierz miejsce reklamowe, aby rozpocząć rezerwację w kalendarzu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placements List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : placements.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Brak dostępnych miejsc reklamowych</p>
              </CardContent>
            </Card>
          ) : (
            placements.map((placement) => {
              const Icon = placementIcons[placement.slug] || Monitor;

              return (
                <Card 
                  key={placement.id} 
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredPlacement(placement.slug)}
                  onMouseLeave={() => setHoveredPlacement(null)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{placement.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {placement.dimensions && (
                              <span>{placement.dimensions}</span>
                            )}
                            {placement.description && (
                              <>
                                <span>•</span>
                                <span className="line-clamp-1">{placement.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">od</p>
                          <p className="font-bold text-lg">35 PLN<span className="text-sm font-normal text-muted-foreground">/dzień</span></p>
                        </div>
                        <Link to={`/dashboard/campaigns/new?placement=${placement.id}`}>
                          <Button>
                            <Calendar className="h-4 w-4 mr-2" />
                            Rezerwuj
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Site Preview */}
        <div className="hidden lg:block">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Podgląd lokalizacji
              </CardTitle>
              <CardDescription>
                Najedź na miejsce reklamowe, aby zobaczyć jego położenie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SiteLayoutPreview highlightedPlacement={hoveredPlacement} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-1">Wyłączność</h4>
            <p className="text-sm text-muted-foreground">
              100% widoczności, Twoja reklama zawsze na pierwszym planie
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Rotacja</h4>
            <p className="text-sm text-muted-foreground">
              Niższa cena, reklama rotuje z innymi co odsłonę strony
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-1">Pakiety</h4>
            <p className="text-sm text-muted-foreground">
              1 dzień, 1 tydzień, 1 miesiąc - stałe ceny, bez niespodzianek
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
