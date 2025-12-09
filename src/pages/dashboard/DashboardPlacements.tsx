import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Monitor, 
  Smartphone, 
  Square, 
  FileText, 
  Video, 
  CreditCard,
  Eye,
  ArrowRight
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
  "sidebar-square": Square,
  "sponsored-article": FileText,
  "footer": Monitor,
  "popup": Square,
  "mobile-banner": Smartphone,
  "sponsored-video": Video,
};

const placementPreviews: Record<string, string> = {
  "top-banner": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=200&fit=crop",
  "sidebar-square": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=300&fit=crop",
  "sponsored-article": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop",
  "mobile-banner": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=100&fit=crop",
};

export default function DashboardPlacements() {
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);

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
          Wybierz format reklamy, który najlepiej pasuje do Twojej kampanii.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-muted rounded-t-lg" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placements.map((placement) => {
            const Icon = placementIcons[placement.slug] || Monitor;
            const preview = placementPreviews[placement.slug];

            return (
              <Card key={placement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Preview */}
                <div className="relative h-40 bg-muted">
                  {preview ? (
                    <img 
                      src={preview} 
                      alt={placement.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {placement.credit_cost} kredytów
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{placement.name}</CardTitle>
                  </div>
                  {placement.dimensions && (
                    <CardDescription>{placement.dimensions}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {placement.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {placement.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Podgląd
                    </Button>
                    <Link to={`/dashboard/campaigns/new?placement=${placement.id}`} className="flex-1">
                      <Button variant="gradient" size="sm" className="w-full">
                        Zarezerwuj
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Jak działają miejsca reklamowe?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Każde miejsce ma określony koszt w kredytach za dzień wyświetlania</li>
            <li>• Po wybraniu miejsca określasz daty kampanii</li>
            <li>• Twoja reklama przechodzi weryfikację przed publikacją</li>
            <li>• Statystyki wyświetleń i kliknięć dostępne w czasie rzeczywistym</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
