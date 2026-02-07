import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
// Header i Footer renderowane globalnie przez MainLayout
// import { Header } from "@/components/layout/Header";
// import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { useArticles, formatArticleForCard } from "@/hooks/use-articles";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { Search as SearchIcon, Filter, X, TrendingUp, Clock, Calendar, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  { value: "all", label: "Wszystkie kategorie" },
  { value: "Wiadomości", label: "Wiadomości" },
  { value: "Sport", label: "Sport" },
  { value: "Biznes", label: "Biznes" },
  { value: "Tech", label: "Tech" },
  { value: "Lifestyle", label: "Lifestyle" },
  { value: "Rozrywka", label: "Rozrywka" },
];

const dateFilters = [
  { value: "all", label: "Dowolna data", icon: Calendar },
  { value: "today", label: "Dzisiaj", days: 0 },
  { value: "week", label: "Ostatni tydzień", days: 7 },
  { value: "month", label: "Ostatni miesiąc", days: 30 },
  { value: "year", label: "Ostatni rok", days: 365 },
];

const sortOptions = [
  { value: "newest", label: "Najnowsze", icon: Clock },
  { value: "oldest", label: "Najstarsze", icon: Clock },
  { value: "popular", label: "Najpopularniejsze", icon: TrendingUp },
];

const ARTICLES_PER_LOAD = 12;

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);
  const { articles, loading } = useArticles({ limit: 500 });

  // Filters state
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_LOAD);

  useEffect(() => {
    setSearchInput(query);
    setVisibleCount(ARTICLES_PER_LOAD); // Reset on new search
  }, [query]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ARTICLES_PER_LOAD);
  }, [categoryFilter, dateFilter, sortBy]);

  const filteredAndSortedArticles = useMemo(() => {
    let results = articles.filter((article) => {
      const searchLower = query.toLowerCase();
      const matchesSearch = 
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt?.toLowerCase().includes(searchLower) ||
        article.category.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Category filter
      if (categoryFilter !== "all" && article.category !== categoryFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== "all") {
        const articleDate = new Date(article.created_at);
        const now = new Date();
        const filterConfig = dateFilters.find(f => f.value === dateFilter);
        
        if (filterConfig && 'days' in filterConfig) {
          const daysAgo = new Date();
          daysAgo.setDate(now.getDate() - (filterConfig.days || 0));
          daysAgo.setHours(0, 0, 0, 0);
          
          if (dateFilter === "today") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (articleDate < today) return false;
          } else if (articleDate < daysAgo) {
            return false;
          }
        }
      }

      return true;
    });

    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "popular":
          return (b.view_count || 0) - (a.view_count || 0);
        default:
          return 0;
      }
    });

    return results;
  }, [articles, query, categoryFilter, dateFilter, sortBy]);

  const visibleArticles = filteredAndSortedArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSortedArticles.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + ARTICLES_PER_LOAD, filteredAndSortedArticles.length));
  }, [filteredAndSortedArticles.length]);

  const { loadMoreRef, isLoading: isLoadingMore } = useInfiniteScroll(loadMore, hasMore);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const clearFilters = () => {
    setCategoryFilter("all");
    setDateFilter("all");
    setSortBy("newest");
  };

  const hasActiveFilters = categoryFilter !== "all" || dateFilter !== "all" || sortBy !== "newest";

  return (
    <div className="flex flex-col">
      
      <main className="flex-1 container py-8">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Wyniki wyszukiwania</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Wpisz słowa kluczowe..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="gradient">
              Szukaj
            </Button>
          </form>
        </div>

        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          {/* Filter Toggle & Active Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtry
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  !
                </Badge>
              )}
            </Button>

            {/* Active filter badges */}
            {hasActiveFilters && (
              <>
                {categoryFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categories.find(c => c.value === categoryFilter)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setCategoryFilter("all")}
                    />
                  </Badge>
                )}
                {dateFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {dateFilters.find(d => d.value === dateFilter)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setDateFilter("all")}
                    />
                  </Badge>
                )}
                {sortBy !== "newest" && (
                  <Badge variant="secondary" className="gap-1">
                    {sortOptions.find(s => s.value === sortBy)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setSortBy("newest")}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Wyczyść wszystkie
                </Button>
              </>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-card rounded-xl border border-border">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Kategoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Data publikacji</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz zakres dat" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFilters.map((date) => (
                      <SelectItem key={date.value} value={date.value}>
                        {date.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Sortowanie</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sortuj według" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {query && (
          <p className="mb-6 text-muted-foreground">
            {loading ? (
              "Wyszukiwanie..."
            ) : (
              <>
                Znaleziono <span className="font-semibold text-foreground">{filteredAndSortedArticles.length}</span> wyników dla "{query}"
              </>
            )}
          </p>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleArticles.map((article) => (
                <NewsCard key={article.id} {...formatArticleForCard(article)} />
              ))}
            </div>
            
            {/* Infinite scroll trigger */}
            <div 
              ref={loadMoreRef} 
              className="py-6 sm:py-8 flex justify-center min-h-[60px]"
            >
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                  <span className="text-sm sm:text-base">Ładowanie więcej artykułów...</span>
                </div>
              )}
            </div>
          </>
        ) : query ? (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Brak wyników</h2>
            <p className="text-muted-foreground mb-6">
              Nie znaleziono artykułów dla "{query}"{hasActiveFilters && " z wybranymi filtrami"}. Spróbuj innych słów kluczowych lub zmień filtry.
            </p>
            <div className="flex gap-3 justify-center">
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Wyczyść filtry
                </Button>
              )}
              <Link to="/">
                <Button variant="outline">Wróć na stronę główną</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Wyszukaj artykuły</h2>
            <p className="text-muted-foreground">
              Wpisz słowa kluczowe w pole wyszukiwania powyżej
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
