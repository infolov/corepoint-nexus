import { useState, useEffect } from "react";
import { TrendingUp, ArrowUp, ArrowDown, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  trend: "up" | "down" | "stable";
  count: number;
  url?: string;
}

type TimeFilter = "24h" | "7d";

export function TrendingWidget() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      
      // Calculate date range based on filter
      const now = new Date();
      const startDate = new Date();
      if (timeFilter === "24h") {
        startDate.setHours(startDate.getHours() - 24);
      } else {
        startDate.setDate(startDate.getDate() - 7);
      }

      try {
        // Fetch most viewed articles in the time range
        const { data: articles, error } = await supabase
          .from("articles")
          .select("id, title, category, view_count, created_at")
          .eq("is_published", true)
          .gte("created_at", startDate.toISOString())
          .order("view_count", { ascending: false })
          .limit(10);

        if (error) throw error;

        if (articles && articles.length > 0) {
          const trendingTopics: TrendingTopic[] = articles.map((article, index) => ({
            id: article.id,
            title: article.title,
            category: article.category,
            trend: article.view_count > 100 ? "up" : article.view_count > 50 ? "stable" : "down",
            count: article.view_count,
            url: `/artykul/${article.id}`,
          }));
          setTopics(trendingTopics);
        } else {
          // Fallback to mock data if no articles
          setTopics(getMockTrending());
        }
      } catch (error) {
        console.error("Error fetching trending:", error);
        setTopics(getMockTrending());
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [timeFilter]);

  const getMockTrending = (): TrendingTopic[] => [
    { id: "1", title: "Zmiany w podatkach 2025", category: "Finanse", trend: "up", count: 125000 },
    { id: "2", title: "Nowa ustawa o KSeF", category: "Prawo", trend: "up", count: 98000 },
    { id: "3", title: "Ceny paliw w górę", category: "Motoryzacja", trend: "up", count: 76000 },
    { id: "4", title: "Mecz Polska-Niemcy", category: "Sport", trend: "up", count: 54000 },
    { id: "5", title: "AI w biznesie", category: "Tech + Nauka", trend: "stable", count: 43000 },
  ];

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm">
      {/* Header with filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Trendy</h3>
        </div>
        
        {/* Time filter */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setTimeFilter("24h")}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
              timeFilter === "24h"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="h-3 w-3" />
            24h
          </button>
          <button
            onClick={() => setTimeFilter("7d")}
            className={cn(
              "px-2 py-1 rounded text-xs font-medium transition-colors",
              timeFilter === "7d"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            7 dni
          </button>
        </div>
      </div>

      {/* Topics list */}
      <div className="space-y-3">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="w-6 h-6 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))
        ) : (
          topics.map((topic, index) => (
            <a
              key={topic.id}
              href={topic.url || "#"}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-card-hover cursor-pointer transition-colors group"
            >
              <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {topic.title}
                </h4>
                <span className="text-xs text-muted-foreground">{topic.category}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                {topic.trend === "up" ? (
                  <ArrowUp className="h-4 w-4 text-badge-new" />
                ) : topic.trend === "down" ? (
                  <ArrowDown className="h-4 w-4 text-badge-hot" />
                ) : (
                  <span className="h-4 w-4 text-muted-foreground">–</span>
                )}
                <span className="text-muted-foreground">{formatCount(topic.count)}</span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
