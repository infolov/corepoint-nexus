import { useState, useEffect, useMemo } from "react";
import { Newspaper, ChevronRight, Globe, MapPin, Zap, ArrowLeft, Volume2, Pause, Play, Loader2, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DAILY_SUMMARY_SECTIONS } from "@/data/categories";
import { DateNavigator } from "@/components/widgets/DateNavigator";
import { useDailySummary, useAvailableSummaryDates } from "@/hooks/use-daily-summary";
import { useRSSArticles } from "@/hooks/use-rss-articles";
import { useRef } from "react";

interface SummaryArticle {
  id: string;
  title: string;
  category: string;
  excerpt?: string;
  image?: string;
  url?: string;
  source?: string;
}

type SummarySection = "polska" | "swiat" | "mix";

export default function DailySummary() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [articles, setArticles] = useState<Record<SummarySection, SummaryArticle[]>>({
    polska: [],
    swiat: [],
    mix: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SummarySection>("polska");
  
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get available dates for the date navigator
  const { dates: availableDates } = useAvailableSummaryDates();
  
  // Get AI summary for the selected date
  const { nationalSummary, loading: summaryLoading } = useDailySummary(undefined, selectedDate);
  
  // Get RSS articles for linking
  const { articles: rssArticles } = useRSSArticles();

  // Session cache for article data
  const articleCache = useRef<Map<string, Record<SummarySection, SummaryArticle[]>>>(new Map());

  useEffect(() => {
    const fetchTopArticles = async () => {
      // Check cache first
      const cacheKey = selectedDate;
      if (articleCache.current.has(cacheKey)) {
        setArticles(articleCache.current.get(cacheKey)!);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [polskaData, swiatData, mixData] = await Promise.all([
          supabase
            .from("articles")
            .select("id, title, category, excerpt, image")
            .eq("is_published", true)
            .in("category", ["Wiadomości", "wiadomosci"])
            .gte("created_at", `${selectedDate}T00:00:00`)
            .lte("created_at", `${selectedDate}T23:59:59`)
            .order("view_count", { ascending: false })
            .limit(10),
          
          supabase
            .from("articles")
            .select("id, title, category, excerpt, image")
            .eq("is_published", true)
            .in("category", ["Świat", "swiat"])
            .gte("created_at", `${selectedDate}T00:00:00`)
            .lte("created_at", `${selectedDate}T23:59:59`)
            .order("view_count", { ascending: false })
            .limit(10),
          
          supabase
            .from("articles")
            .select("id, title, category, excerpt, image")
            .eq("is_published", true)
            .in("category", ["Biznes", "biznes", "Technologia", "technologia", "Sport", "sport"])
            .gte("created_at", `${selectedDate}T00:00:00`)
            .lte("created_at", `${selectedDate}T23:59:59`)
            .order("view_count", { ascending: false })
            .limit(10),
        ]);

        const formatArticles = (data: any[] | null): SummaryArticle[] => {
          if (!data || data.length === 0) return [];
          return data.map(a => ({
            id: a.id,
            title: a.title,
            category: a.category,
            excerpt: a.excerpt,
            image: a.image,
            url: `/artykul/${a.id}`,
          }));
        };

        // If no DB articles, try to use RSS articles
        let formattedPolska = formatArticles(polskaData.data);
        let formattedSwiat = formatArticles(swiatData.data);
        let formattedMix = formatArticles(mixData.data);

        // Supplement with RSS if empty (for today only)
        if (selectedDate === today && rssArticles.length > 0) {
          if (formattedPolska.length === 0) {
            formattedPolska = rssArticles
              .filter(a => a.category?.toLowerCase().includes("wiadomości") || a.category?.toLowerCase() === "wiadomosci")
              .slice(0, 10)
              .map(a => ({
                id: a.id,
                title: a.title,
                category: a.category,
                excerpt: (a as any).excerpt,
                image: a.image,
                url: `/artykul/${a.id}`,
                source: (a as any).source,
              }));
          }
          if (formattedMix.length === 0) {
            formattedMix = rssArticles
              .filter(a => ["biznes", "technologia", "sport", "nauka", "tech"].some(cat => 
                a.category?.toLowerCase().includes(cat)
              ))
              .slice(0, 10)
              .map(a => ({
                id: a.id,
                title: a.title,
                category: a.category,
                excerpt: (a as any).excerpt,
                image: a.image,
                url: `/artykul/${a.id}`,
                source: (a as any).source,
              }));
          }
        }

        const result = {
          polska: formattedPolska,
          swiat: formattedSwiat,
          mix: formattedMix,
        };

        // Cache the result
        articleCache.current.set(cacheKey, result);
        setArticles(result);
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopArticles();
  }, [selectedDate, today, rssArticles]);

  // Stop audio when date changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, [selectedDate]);

  const togglePlayback = async () => {
    if (!nationalSummary?.audio_url) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setAudioLoading(true);
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.error("Playback error:", err);
        } finally {
          setAudioLoading(false);
        }
      }
    } else {
      setAudioLoading(true);
      const audio = new Audio(nationalSummary.audio_url);
      audioRef.current = audio;
      
      audio.onended = () => setIsPlaying(false);
      audio.oncanplaythrough = () => setAudioLoading(false);

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Playback error:", err);
        setAudioLoading(false);
      }
    }
  };

  const handleArticleClick = (article: SummaryArticle) => {
    // Cache article data for instant load on article page
    localStorage.setItem(`article_${article.id}`, JSON.stringify({
      id: article.id,
      title: article.title,
      category: article.category,
      excerpt: article.excerpt,
      image: article.image,
      source: article.source || "Informacje.pl",
    }));
    navigate(article.url || `/artykul/${article.id}`);
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Skrót Dnia</h1>
            <p className="text-muted-foreground">Top 10 najważniejszych artykułów</p>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="mb-6 p-4 bg-card rounded-xl border border-border">
          <DateNavigator
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            availableDates={availableDates}
          />
        </div>

        {/* AI Summary Card (if available) */}
        {nationalSummary && (
          <div className="mb-6 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Podsumowanie AI</h2>
              {nationalSummary.audio_url && (
                <Button
                  onClick={togglePlayback}
                  variant="outline"
                  size="sm"
                  className="ml-auto gap-2"
                  disabled={audioLoading}
                >
                  {audioLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {audioLoading ? "Ładowanie..." : isPlaying ? "Pauza" : "Słuchaj"}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
              {nationalSummary.summary_text}
            </p>
          </div>
        )}

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

        {/* Articles grid - FIXED: Now clickable with proper navigation */}
        <div className="grid gap-4 md:gap-6">
          {loading || summaryLoading ? (
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
              <button
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all group text-left w-full"
              >
                {/* Position number */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 text-primary text-xl font-bold flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {index + 1}
                </div>
                
                {/* Thumbnail (if available) */}
                {article.image && (
                  <div className="hidden sm:block w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={article.image} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.excerpt.replace(/<[^>]*>/g, '')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                    {article.source && (
                      <span className="text-xs text-muted-foreground">
                        {article.source}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-center" />
              </button>
            ))
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Brak artykułów dla wybranej daty
              </p>
              {selectedDate !== today && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSelectedDate(today)}
                >
                  Wróć do dzisiaj
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
