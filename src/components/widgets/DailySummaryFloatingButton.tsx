import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Newspaper, ChevronRight, Globe, MapPin, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DAILY_SUMMARY_SECTIONS } from "@/data/categories";

interface SummaryArticle {
  id: string;
  title: string;
  category: string;
  url?: string;
}

type SummarySection = "polska" | "swiat" | "mix";

export function DailySummaryFloatingButton() {
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [articles, setArticles] = useState<Record<SummarySection, SummaryArticle[]>>({
    polska: [],
    swiat: [],
    mix: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SummarySection>("polska");
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchTopArticles = async () => {
      setLoading(true);

      try {
        const [polskaData, swiatData, mixData] = await Promise.all([
          supabase
            .from("articles")
            .select("id, title, category")
            .eq("is_published", true)
            .in("category", ["Wiadomości", "wiadomosci"])
            .order("view_count", { ascending: false })
            .limit(5),
          
          supabase
            .from("articles")
            .select("id, title, category")
            .eq("is_published", true)
            .in("category", ["Świat", "swiat"])
            .order("view_count", { ascending: false })
            .limit(5),
          
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
          polska: formatArticles(polskaData.data) || [],
          swiat: formatArticles(swiatData.data) || [],
          mix: formatArticles(mixData.data) || [],
        });
      } catch (error) {
        console.error("Error fetching summary:", error);
        setArticles({
          polska: [],
          swiat: [],
          mix: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTopArticles();
  }, []);

  // No mock fallback - show empty state when no data available

  const getSectionIcon = (section: SummarySection) => {
    switch (section) {
      case "polska":
        return <MapPin className="h-3.5 w-3.5" />;
      case "swiat":
        return <Globe className="h-3.5 w-3.5" />;
      case "mix":
        return <Zap className="h-3.5 w-3.5" />;
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top,
        right: window.innerWidth - rect.left + 8,
      });
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  const handleButtonClick = () => {
    navigate("/skrot-dnia");
  };

  const currentArticles = articles[activeSection];

  return (
    <>
      {/* Floating Button */}
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed right-4 bottom-20 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
      >
        <Newspaper className="h-5 w-5" />
        <span className="font-medium text-sm">Skrót Dnia</span>
      </button>

      {/* Dropdown on hover - using portal */}
      {isHovered && createPortal(
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top - 200}px`,
            right: `${dropdownPosition.right}px`,
          }}
          className="z-[100] w-80 bg-card border border-border rounded-xl shadow-xl animate-in fade-in slide-in-from-right-2 duration-200"
        >
          {/* Header */}
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <Newspaper className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">Skrót dnia</h3>
            <span className="text-xs text-muted-foreground ml-auto">Top 5</span>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 p-2 bg-muted/50">
            {(["polska", "swiat", "mix"] as SummarySection[]).map((section) => {
              const sectionConfig = DAILY_SUMMARY_SECTIONS.find(s => s.slug === section);
              return (
                <button
                  key={section}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSection(section);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                    activeSection === section
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {getSectionIcon(section)}
                  <span>{sectionConfig?.name || section}</span>
                </button>
              );
            })}
          </div>

          {/* Articles list */}
          <div className="p-2 max-h-64 overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2">
                  <Skeleton className="w-5 h-5 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            ) : currentArticles.length > 0 ? (
              currentArticles.map((article, index) => (
                <a
                  key={article.id}
                  href={article.url || "#"}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted transition-colors group"
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
                Brak artykułów
              </p>
            )}
          </div>

          {/* Footer - link to full page */}
          <div className="p-3 border-t border-border bg-muted/30">
            <button
              onClick={handleButtonClick}
              className="w-full text-center text-sm text-primary hover:underline font-medium"
            >
              Zobacz pełny skrót dnia →
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
