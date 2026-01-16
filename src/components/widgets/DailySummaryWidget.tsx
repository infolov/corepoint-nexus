import { useState, useEffect } from "react";
import { Newspaper, ChevronRight, Globe, MapPin, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation } from "@/hooks/use-geolocation";
import { DAILY_SUMMARY_SECTIONS } from "@/data/categories";

interface SummaryArticle {
  id: string;
  title: string;
  category: string;
  url?: string;
}

type SummarySection = "polska" | "swiat" | "mix";

export function DailySummaryWidget() {
  const [articles, setArticles] = useState<Record<SummarySection, SummaryArticle[]>>({
    polska: [],
    swiat: [],
    mix: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SummarySection>("polska");
  const { location } = useGeolocation();

  useEffect(() => {
    const fetchTopArticles = async () => {
      setLoading(true);

      try {
        // Fetch top articles for each section
        const [polskaData, swiatData, mixData] = await Promise.all([
          // Polska - domestic news
          supabase
            .from("articles")
            .select("id, title, category")
            .eq("is_published", true)
            .in("category", ["Wiadomości", "wiadomosci"])
            .order("view_count", { ascending: false })
            .limit(5),
          
          // Świat - international news
          supabase
            .from("articles")
            .select("id, title, category")
            .eq("is_published", true)
            .in("category", ["Świat", "swiat"])
            .order("view_count", { ascending: false })
            .limit(5),
          
          // MIX - business, tech, sport
          supabase
            .from("articles")
            .select("id, title, category")
            .eq("is_published", true)
            .in("category", ["Biznes", "biznes", "Technologia", "technologia", "Sport", "sport"])
            .order("view_count", { ascending: false })
            .limit(5),
        ]);

        const formatArticles = (data: any[] | null): SummaryArticle[] => {
          if (!data) return [];
          return data.map(a => ({
            id: a.id,
            title: a.title,
            category: a.category,
            url: `/artykul/${a.id}`,
          }));
        };

        setArticles({
          polska: formatArticles(polskaData.data) || getMockArticles("polska"),
          swiat: formatArticles(swiatData.data) || getMockArticles("swiat"),
          mix: formatArticles(mixData.data) || getMockArticles("mix"),
        });
      } catch (error) {
        console.error("Error fetching summary:", error);
        setArticles({
          polska: getMockArticles("polska"),
          swiat: getMockArticles("swiat"),
          mix: getMockArticles("mix"),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTopArticles();
  }, []);

  const getMockArticles = (section: SummarySection): SummaryArticle[] => {
    const mocks: Record<SummarySection, SummaryArticle[]> = {
      polska: [
        { id: "1", title: "Rząd przedstawił nowy budżet na 2025 rok", category: "Wiadomości" },
        { id: "2", title: "Zmiany w systemie podatkowym od stycznia", category: "Wiadomości" },
        { id: "3", title: "Nowe przepisy drogowe wchodzą w życie", category: "Wiadomości" },
        { id: "4", title: "Rekordowa inflacja w grudniu", category: "Wiadomości" },
        { id: "5", title: "Wybory samorządowe - najnowsze sondaże", category: "Wiadomości" },
      ],
      swiat: [
        { id: "6", title: "Szczyt NATO w Waszyngtonie", category: "Świat" },
        { id: "7", title: "Wybory prezydenckie w USA - wyniki", category: "Świat" },
        { id: "8", title: "Konflikt na Bliskim Wschodzie eskaluje", category: "Świat" },
        { id: "9", title: "UE wprowadza nowe sankcje", category: "Świat" },
        { id: "10", title: "Chiny: rekordowy wzrost gospodarczy", category: "Świat" },
      ],
      mix: [
        { id: "11", title: "GPW: rekordowe wzrosty indeksów", category: "Biznes" },
        { id: "12", title: "OpenAI prezentuje nowy model GPT-5", category: "Technologia" },
        { id: "13", title: "Polska wygrała mecz z Niemcami", category: "Sport" },
        { id: "14", title: "Ceny mieszkań spadły o 10%", category: "Biznes" },
        { id: "15", title: "Apple pokazuje nowego iPhone'a", category: "Technologia" },
      ],
    };
    return mocks[section];
  };

  const getSectionIcon = (section: SummarySection) => {
    switch (section) {
      case "polska":
        return <MapPin className="h-4 w-4" />;
      case "swiat":
        return <Globe className="h-4 w-4" />;
      case "mix":
        return <Zap className="h-4 w-4" />;
    }
  };

  const currentArticles = articles[activeSection];

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">Skrót dnia</h3>
        <span className="text-xs text-muted-foreground ml-auto">Top 10</span>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1">
        {(["polska", "swiat", "mix"] as SummarySection[]).map((section) => {
          const sectionConfig = DAILY_SUMMARY_SECTIONS.find(s => s.slug === section);
          return (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                activeSection === section
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {getSectionIcon(section)}
              <span>{sectionConfig?.name || section}</span>
            </button>
          );
        })}
      </div>

      {/* Articles list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))
        ) : currentArticles.length > 0 ? (
          currentArticles.map((article, index) => (
            <a
              key={article.id}
              href={article.url || "#"}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
            </a>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Brak artykułów w tej sekcji
          </p>
        )}
      </div>

      {/* Local section hint */}
      {location?.voivodeship && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>Lokalne wiadomości: {location.voivodeship}</span>
            <a href="/lokalne" className="text-primary hover:underline ml-auto">
              Zobacz więcej →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
