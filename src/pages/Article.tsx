import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Share2, Bookmark, ExternalLink, Loader2, ThumbsUp, ThumbsDown, ChevronRight, Home } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ArticleSummary } from "@/components/article/ArticleSummary";
import { useRSSArticles, formatRSSArticleForCard } from "@/hooks/use-rss-articles";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  newsArticles,
  businessArticles,
  sportArticles,
  techArticles,
  lifestyleArticles,
} from "@/data/mockNews";

// Combine all mock articles for lookup
const allMockArticles = [
  ...newsArticles,
  ...businessArticles,
  ...sportArticles,
  ...techArticles,
  ...lifestyleArticles,
];

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trackArticleView } = useRecentlyViewed();
  const { articles: rssArticles, loading: rssLoading } = useRSSArticles();

  // Handle back navigation - go back in history to preserve scroll position
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Find article from RSS or mock data
  const rssArticle = rssArticles.find((a) => a.id === id);
  const mockArticle = allMockArticles.find((a) => a.id === id);
  
  const article = rssArticle || mockArticle;

  // Track article view for logged-in users
  useEffect(() => {
    if (article && id) {
      trackArticleView(id, article.category);
    }
  }, [id, article?.category]);

  // Show loading while fetching RSS
  if (rssLoading && !mockArticle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Artykuł nie znaleziony</h1>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wróć do strony głównej
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Get article content
  const content = rssArticle?.content || (mockArticle as any)?.content || article.excerpt || "";
  const sourceUrl = rssArticle?.sourceUrl || (mockArticle as any)?.sourceUrl;
  const source = rssArticle?.source || (mockArticle as any)?.source || "Informacje.pl";

  // Get related articles from same category
  const relatedRSSArticles = rssArticles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 4)
    .map(formatRSSArticleForCard);

  const relatedMockArticles = allMockArticles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 4 - relatedRSSArticles.length);

  const relatedArticles = [...relatedRSSArticles, ...relatedMockArticles].slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-4 md:py-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-4 md:mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Strona główna</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/${article.category.toLowerCase()}`}>
                  {article.category}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[150px] sm:max-w-[300px]">
                {article.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="max-w-4xl mx-auto">
          {/* Main Article Content */}
          <article>
            {/* Article Header */}
            <header className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                {(article as any).badge && (
                  <Badge variant={(article as any).badge === "hot" ? "destructive" : (article as any).badge}>
                    {(article as any).badge === "hot" ? "🔥 Gorące" : (article as any).badge === "trending" ? "📈 Popularne" : "✨ Nowe"}
                  </Badge>
                )}
                <Badge variant="outline">{article.category}</Badge>
              </div>
              
              <h1 className="text-xl md:text-2xl lg:text-3xl font-medium text-foreground mb-4 leading-tight">
                {article.title}
              </h1>
              
              {article.excerpt && (
                <p className="text-lg text-muted-foreground mb-4">
                  {article.excerpt}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border pb-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{(article as any).timestamp || "Dzisiaj"}</span>
                </div>
              </div>
            </header>

            {/* Featured Image - proper sizing and centering */}
            <div className="relative w-full max-w-3xl mx-auto rounded-xl overflow-hidden mb-6">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-auto max-h-[350px] object-contain mx-auto"
              />
            </div>

            {/* AI Summary with Audio Controls */}
            <ArticleSummary 
              title={article.title}
              content={content}
              category={article.category}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Bookmark className="h-4 w-4 mr-1" />
                  Zapisz
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Udostępnij
                </Button>
              </div>
            </div>

            {/* Source Link - After Article Content */}
            <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-lg font-bold text-primary-foreground">
                      {source.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Źródło artykułu</p>
                    <p className="font-semibold text-foreground text-lg">{source}</p>
                  </div>
                </div>
                
                {sourceUrl ? (
                  <a 
                    href={sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Przeczytaj oryginalny artykuł
                    </Button>
                  </a>
                ) : (
                  <Button size="lg" variant="secondary" disabled>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Brak odnośnika
                  </Button>
                )}
              </div>
            </div>

            {/* Back Button - before related articles */}
            <div className="mt-8 flex justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={handleGoBack}
              >
                <ArrowLeft className="h-4 w-4" />
                Wróć do listy artykułów
              </Button>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-semibold text-xl md:text-2xl mb-6">Powiązane artykuły</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {relatedArticles.map((related) => (
                    <NewsCard
                      key={related.id}
                      {...related}
                      variant="default"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Back to Home - bottom */}
            <div className="mt-8 text-center">
              <Link to="/">
                <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                  <Home className="h-4 w-4" />
                  Strona główna
                </Button>
              </Link>
            </div>
          </article>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Article;