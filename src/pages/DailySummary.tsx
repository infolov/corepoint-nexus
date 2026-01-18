import { useState, useEffect } from "react";
import { Newspaper, ChevronRight, Globe, MapPin, Zap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DAILY_SUMMARY_SECTIONS } from "@/data/categories";

interface SummaryArticle {
  id: string;
  title: string;
  category: string;
  excerpt?: string;
  image?: string;
  url?: string;
}

type SummarySection = "polska" | "swiat" | "mix";

export default function DailySummary() {
  const [articles, setArticles] = useState<Record<SummarySection, SummaryArticle[]>>({
    polska: [],
    swiat: [],
    mix: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SummarySection>("polska");

  useEffect(() => {
    const fetchTopArticles = async () => {
      setLoading(true);

      try {
        const [polskaData, swiatData, mixData] = await Promise.all([
          supabase
            .from("articles")
            .select("id, title, category, excerpt, image")
            .eq("is_published", true)
            .in("category", ["Wiadomości", "wiadomosci"])
            .order("view_count", { ascending: false })
            .limit(10),
          
          supabase
            .from("articles")
            .select("id, title, category, excerpt, image")
            .eq("is_published", true)
            .in("category", ["Świat", "swiat"])
            .order("view_count", { ascending: false })
            .limit(10),
          
          supabase
            .from("articles")
            .select("id, title, category, excerpt, image")
            .eq("is_published", true)
            .in("category", ["Biznes", "biznes", "Technologia", "technologia", "Sport", "sport"])
            .order("view_count", { ascending: false })
            .limit(10),
        ]);

        const formatArticles = (data: any[] | null): SummaryArticle[] => {
          if (!data) return [];
          return data.map(a => ({
            id: a.id,
            title: a.title,
            category: a.category,
            excerpt: a.excerpt,
            image: a.image,
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
        { id: "1", title: "Rząd przedstawił nowy budżet na 2025 rok", category: "Wiadomości", excerpt: "Nowy budżet zakłada wzrost wydatków na obronność i zdrowie." },
        { id: "2", title: "Zmiany w systemie podatkowym od stycznia", category: "Wiadomości", excerpt: "Nowe progi podatkowe wchodzą w życie." },
        { id: "3", title: "Nowe przepisy drogowe wchodzą w życie", category: "Wiadomości", excerpt: "Wyższe mandaty za przekroczenie prędkości." },
        { id: "4", title: "Rekordowa inflacja w grudniu", category: "Wiadomości", excerpt: "Ceny wzrosły o 5% w porównaniu do roku poprzedniego." },
        { id: "5", title: "Wybory samorządowe - najnowsze sondaże", category: "Wiadomości", excerpt: "Kto prowadzi w wyścigu o fotel prezydenta?" },
        { id: "6", title: "Nowe inwestycje w infrastrukturę", category: "Wiadomości", excerpt: "Budowa nowych dróg ekspresowych." },
        { id: "7", title: "Reforma edukacji zatwierdzona", category: "Wiadomości", excerpt: "Zmiany w programie nauczania od września." },
        { id: "8", title: "Wzrost płacy minimalnej", category: "Wiadomości", excerpt: "Od stycznia nowa stawka minimalna." },
        { id: "9", title: "Nowe dopłaty dla rolników", category: "Wiadomości", excerpt: "Wsparcie dla sektora rolniczego." },
        { id: "10", title: "Modernizacja kolei", category: "Wiadomości", excerpt: "Nowe pociągi na trasach krajowych." },
      ],
      swiat: [
        { id: "11", title: "Szczyt NATO w Waszyngtonie", category: "Świat", excerpt: "Kluczowe decyzje dotyczące bezpieczeństwa." },
        { id: "12", title: "Wybory prezydenckie w USA - wyniki", category: "Świat", excerpt: "Nowy prezydent wybrany." },
        { id: "13", title: "Konflikt na Bliskim Wschodzie eskaluje", category: "Świat", excerpt: "Napięcia w regionie rosną." },
        { id: "14", title: "UE wprowadza nowe sankcje", category: "Świat", excerpt: "Restrykcje wobec kolejnych podmiotów." },
        { id: "15", title: "Chiny: rekordowy wzrost gospodarczy", category: "Świat", excerpt: "Ekonomia kraju rośnie w siłę." },
        { id: "16", title: "Szczyt klimatyczny ONZ", category: "Świat", excerpt: "Nowe zobowiązania krajów." },
        { id: "17", title: "Kryzys migracyjny w Europie", category: "Świat", excerpt: "Rosnąca liczba uchodźców." },
        { id: "18", title: "Nowy rząd w Niemczech", category: "Świat", excerpt: "Koalicja sformowana." },
        { id: "19", title: "Trzęsienie ziemi w Japonii", category: "Świat", excerpt: "Akcja ratunkowa trwa." },
        { id: "20", title: "Rekordowe upały w Australii", category: "Świat", excerpt: "Temperatury przekraczają normy." },
      ],
      mix: [
        { id: "21", title: "GPW: rekordowe wzrosty indeksów", category: "Biznes", excerpt: "WIG20 na historycznych maksimach." },
        { id: "22", title: "OpenAI prezentuje nowy model GPT-5", category: "Technologia", excerpt: "Nowa era sztucznej inteligencji." },
        { id: "23", title: "Polska wygrała mecz z Niemcami", category: "Sport", excerpt: "Historyczne zwycięstwo 2:1." },
        { id: "24", title: "Ceny mieszkań spadły o 10%", category: "Biznes", excerpt: "Rynek nieruchomości się ochładza." },
        { id: "25", title: "Apple pokazuje nowego iPhone'a", category: "Technologia", excerpt: "Premiera flagowego smartfona." },
        { id: "26", title: "Liga Mistrzów - wyniki", category: "Sport", excerpt: "Polskie kluby w europejskich pucharach." },
        { id: "27", title: "Kryptowaluty rosną", category: "Biznes", excerpt: "Bitcoin przekracza 100 tys. USD." },
        { id: "28", title: "Tesla prezentuje nowy model", category: "Technologia", excerpt: "Elektryczny samochód przyszłości." },
        { id: "29", title: "Igrzyska Olimpijskie - medale", category: "Sport", excerpt: "Polscy sportowcy z sukcesami." },
        { id: "30", title: "Fuzja gigantów technologicznych", category: "Biznes", excerpt: "Największa transakcja roku." },
      ],
    };
    return mocks[section];
  };

  const getSectionIcon = (section: SummarySection) => {
    switch (section) {
      case "polska":
        return <MapPin className="h-5 w-5" />;
      case "swiat":
        return <Globe className="h-5 w-5" />;
      case "mix":
        return <Zap className="h-5 w-5" />;
    }
  };

  const currentArticles = articles[activeSection];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 w-full px-4 md:container py-6 md:py-10">
        {/* Back link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Powrót do strony głównej</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Skrót Dnia</h1>
            <p className="text-muted-foreground">Top 10 najważniejszych artykułów</p>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 mb-8 bg-muted rounded-xl p-1.5 max-w-md">
          {(["polska", "swiat", "mix"] as SummarySection[]).map((section) => {
            const sectionConfig = DAILY_SUMMARY_SECTIONS.find(s => s.slug === section);
            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeSection === section
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                )}
              >
                {getSectionIcon(section)}
                <span>{sectionConfig?.name || section}</span>
              </button>
            );
          })}
        </div>

        {/* Articles grid */}
        <div className="grid gap-4 md:gap-6">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))
          ) : currentArticles.length > 0 ? (
            currentArticles.map((article, index) => (
              <Link
                key={article.id}
                to={article.url || "#"}
                className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all group"
              >
                {/* Position number */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 text-primary text-xl font-bold flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {index + 1}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-center" />
              </Link>
            ))
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Brak artykułów w tej sekcji</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
