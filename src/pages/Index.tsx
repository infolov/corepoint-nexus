import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EditorialCard } from "@/components/news/EditorialCard";
import { ArticleDrawer } from "@/components/article/ArticleDrawer";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useRSSArticles, formatRSSArticleForCard } from "@/hooks/use-rss-articles";
import { supabase } from "@/integrations/supabase/client";
import { newsArticles, businessArticles, sportArticles, techArticles, lifestyleArticles } from "@/data/mockNews";

// Combine all mock articles as fallback
const allMockArticles = [...newsArticles, ...businessArticles, ...sportArticles, ...techArticles, ...lifestyleArticles];

// Sort articles by date
const sortByDate = <T extends { pubDateMs?: number; createdAt?: string }>(array: T[]): T[] => {
  return [...array].sort((a, b) => {
    const dateA = a.pubDateMs || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const dateB = b.pubDateMs || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return dateB - dateA;
  });
};

const ARTICLES_PER_PAGE = 10;

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const { articles: rssArticles, loading: rssLoading, refetch: refetchRSS } = useRSSArticles();
  const { user } = useAuth();
  
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      refetchRSS();
    }, 5 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refetchRSS]);

  // Load user preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) {
        setUserPreferences([]);
        return;
      }
      try {
        const { data: prefData } = await supabase
          .from("user_notification_preferences")
          .select("categories")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (prefData?.categories) {
          setUserPreferences(prefData.categories);
        }
      } catch (error) {
        console.error("Error loading user preferences:", error);
      }
    };
    loadUserPreferences();
  }, [user]);

  // Combine and format articles
  const allArticles = useMemo(() => {
    const formattedRSSArticles = rssArticles.map(article => ({
      ...formatRSSArticleForCard(article),
      pubDateMs: article.pubDateMs || Date.now(),
      excerpt: article.content?.slice(0, 200) || "",
    }));

    if (formattedRSSArticles.length > 0) {
      return sortByDate(formattedRSSArticles);
    }
    
    // Fallback to mock data
    return allMockArticles.map(a => ({ ...a, pubDateMs: Date.now() }));
  }, [rssArticles]);

  // Filter by user preferences if logged in
  const displayArticles = useMemo(() => {
    if (!user || userPreferences.length === 0) {
      return allArticles;
    }

    const categoryMap: Record<string, string[]> = {
      "wiadomosci": ["wiadomości", "wiadomosci", "news"],
      "sport": ["sport"],
      "biznes": ["biznes", "business"],
      "technologia": ["technologia", "tech"],
      "lifestyle": ["lifestyle"],
      "rozrywka": ["rozrywka", "entertainment"],
      "zdrowie": ["zdrowie", "health"],
      "nauka": ["nauka", "science"],
    };

    const filtered = allArticles.filter(article => {
      const articleCategory = article.category?.toLowerCase() || "";
      return userPreferences.some(pref => {
        const prefLower = pref.toLowerCase();
        if (articleCategory === prefLower || articleCategory.includes(prefLower)) {
          return true;
        }
        const mapped = categoryMap[pref] || [];
        return mapped.some(m => articleCategory.includes(m.toLowerCase()));
      });
    });

    return filtered.length > 0 ? filtered : allArticles;
  }, [allArticles, user, userPreferences]);

  const hasMore = visibleCount < displayArticles.length;
  
  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + ARTICLES_PER_PAGE);
  }, []);
  
  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);

  const handleArticleClick = (article: any) => {
    // Store in localStorage for full page access
    if (article.id) {
      localStorage.setItem(`article_${article.id}`, JSON.stringify(article));
    }
    setSelectedArticle(article);
    setIsDrawerOpen(true);
  };

  const visibleArticles = displayArticles.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Editorial Feed */}
      <main className="py-8 md:py-12">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6">
          {/* Feed */}
          <div className="space-y-0">
            {visibleArticles.map((article, index) => (
              <EditorialCard
                key={`${article.id}-${index}`}
                id={article.id}
                title={article.title}
                excerpt={article.excerpt}
                category={article.category}
                image={article.image}
                timestamp={article.timestamp}
                source={article.source}
                sourceUrl={article.sourceUrl}
                onClick={() => handleArticleClick(article)}
              />
            ))}
          </div>

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="py-12 flex justify-center">
            {isLoading && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Ładowanie...</span>
              </div>
            )}
          </div>

          {/* Empty state */}
          {!rssLoading && visibleArticles.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Brak artykułów do wyświetlenia</p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Article Side Drawer */}
      <ArticleDrawer
        article={selectedArticle}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default Index;
