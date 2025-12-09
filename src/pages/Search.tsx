import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { useArticles, formatArticleForCard } from "@/hooks/use-articles";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);
  const { articles, loading } = useArticles({ limit: 100 });

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const filteredArticles = articles.filter((article) => {
    const searchLower = query.toLowerCase();
    return (
      article.title.toLowerCase().includes(searchLower) ||
      article.excerpt?.toLowerCase().includes(searchLower) ||
      article.category.toLowerCase().includes(searchLower)
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        {/* Search Header */}
        <div className="mb-8">
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
          
          {query && (
            <p className="mt-4 text-muted-foreground">
              {loading ? (
                "Wyszukiwanie..."
              ) : (
                <>
                  Znaleziono <span className="font-semibold text-foreground">{filteredArticles.length}</span> wyników dla "{query}"
                </>
              )}
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArticles.map((article) => (
              <NewsCard key={article.id} {...formatArticleForCard(article)} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Brak wyników</h2>
            <p className="text-muted-foreground mb-6">
              Nie znaleziono artykułów dla "{query}". Spróbuj innych słów kluczowych.
            </p>
            <Link to="/">
              <Button variant="outline">Wróć na stronę główną</Button>
            </Link>
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

      <Footer />
    </div>
  );
}
