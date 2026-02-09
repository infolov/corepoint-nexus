import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  Building2,
  FolderTree,
  Settings,
  Activity,
  BarChart3,
  Shield,
  ChevronRight,
  RefreshCw,
  Globe,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DashboardAdminHome() {
  const { user } = useAuth();
  const [isRssLoading, setIsRssLoading] = useState(false);
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);

  const handleForceRss = async () => {
    setIsRssLoading(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-rss', { body: {} });
      if (error) throw error;
      toast.success("Pobieranie RSS uruchomione. Sprawdź bazę danych za kilka chwil.");
    } catch (err: any) {
      toast.error(err.message || "Błąd podczas wywoływania fetch-rss");
    } finally {
      setIsRssLoading(false);
    }
  };

  const handleForceScraping = async () => {
    setIsScrapingLoading(true);
    try {
      const { error } = await supabase.functions.invoke('scrape-news', { body: {} });
      if (error) throw error;
      toast.success("Scrapowanie uruchomione. Sprawdź bazę danych za kilka chwil.");
    } catch (err: any) {
      toast.error(err.message || "Błąd podczas wywoływania scrape-news");
    } finally {
      setIsScrapingLoading(false);
    }
  };
  const adminSections = [
    {
      title: "Użytkownicy i Partnerzy",
      items: [
        { title: "Lista użytkowników", href: "/dashboard/admin/users", icon: Users },
        { title: "Partnerzy", href: "/dashboard/admin/partners", icon: Building2 },
        { title: "Zgłoszenia", href: "/dashboard/admin/applications", icon: Shield },
      ]
    },
    {
      title: "Zarządzanie treścią",
      items: [
        { title: "Weryfikacja artykułów", href: "/dashboard/admin/article-review", icon: Shield },
        { title: "Kategorie", href: "/dashboard/admin/categories", icon: FolderTree },
        { title: "Karuzele", href: "/dashboard/admin/carousels", icon: FolderTree },
      ]
    },
    {
      title: "System",
      items: [
        { title: "Statystyki platformy", href: "/dashboard/admin/stats", icon: BarChart3 },
        { title: "Ustawienia", href: "/dashboard/admin/settings", icon: Settings },
        { title: "Logi", href: "/dashboard/admin/logs", icon: Activity },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold">
          Panel Administratora
        </h1>
        <p className="text-muted-foreground mt-1">
          Witaj, {user?.user_metadata?.full_name || "Administratorze"}! Zarządzaj platformą.
        </p>
      </div>

      {/* Content Ingestion Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diagnostyka pobierania treści</CardTitle>
          <CardDescription>
            Ręczne wyzwalanie pipeline'u ingestion w celu debugowania brakujących artykułów.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={handleForceRss}
            disabled={isRssLoading}
            variant="outline"
          >
            {isRssLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Force RSS Fetch
          </Button>
          <Button
            onClick={handleForceScraping}
            disabled={isScrapingLoading}
            variant="outline"
          >
            {isScrapingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Force Web Scraping
          </Button>
        </CardContent>
      </Card>

      {/* Admin sections */}
      {adminSections.map((section) => (
        <div key={section.title}>
          <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}>
                  <Card className="hover:border-primary/50 transition-colors group cursor-pointer">
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
