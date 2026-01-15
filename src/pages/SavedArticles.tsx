import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bookmark, BookmarkX, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSavedArticles } from "@/hooks/use-saved-articles";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function SavedArticles() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { savedArticles, loading, unsaveArticle } = useSavedArticles();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Powrót</span>
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bookmark className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Zapisane artykuły
              </h1>
              <p className="text-muted-foreground">
                {savedArticles.length} {savedArticles.length === 1 ? "artykuł" : 
                  savedArticles.length > 1 && savedArticles.length < 5 ? "artykuły" : "artykułów"}
              </p>
            </div>
          </div>

          {savedArticles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Bookmark className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Brak zapisanych artykułów</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Zapisuj interesujące artykuły, aby móc do nich wrócić później. 
                  Kliknij ikonę zakładki przy artykule, aby go zapisać.
                </p>
                <Button onClick={() => navigate("/")}>
                  Przeglądaj artykuły
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {savedArticles.map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    {article.article_image && (
                      <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
                        <img
                          src={article.article_image}
                          alt={article.article_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {article.article_category && (
                            <span className="text-xs font-medium text-primary uppercase tracking-wider">
                              {article.article_category}
                            </span>
                          )}
                          <h3 className="font-semibold text-foreground line-clamp-2 mt-1">
                            {article.article_title}
                          </h3>
                          {article.article_excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {article.article_excerpt}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Zapisano {format(new Date(article.saved_at), "d MMMM yyyy, HH:mm", { locale: pl })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {article.article_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={article.article_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unsaveArticle(article.article_id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <BookmarkX className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
