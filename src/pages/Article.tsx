import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Share2, ExternalLink, Loader2, ThumbsUp, ThumbsDown, ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ArticleSummary } from "@/components/article/ArticleSummary";
import { useRSSArticles } from "@/hooks/use-rss-articles";
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

// Helper function to decode HTML entities
const decodeHTMLEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-4 md:py-6">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <Home className="h-4 w-4" />
                    <span>Strona główna</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/kategoria/${article.category.toLowerCase()}`} className="text-muted-foreground hover:text-foreground">
                    {article.category}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                  {decodeHTMLEntities(article.title)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Main Article Content */}
          <article>
            {/* Article Title */}
            <h1 className="text-xl md:text-2xl lg:text-3xl font-medium text-foreground mb-4 leading-tight">
              {decodeHTMLEntities(article.title)}
            </h1>

            {/* Publication Time & Category */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{(article as any).timestamp || "Dzisiaj"}</span>
              </div>
              <Badge variant="outline">{article.category}</Badge>
            </div>

            {/* Featured Image */}
            <div className="relative w-full rounded-xl overflow-hidden mb-6">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-auto max-h-[400px] object-cover"
              />
            </div>

            {/* AI Summary */}
            <ArticleSummary 
              title={article.title}
              content={content}
              category={article.category}
            />

            {/* Action Buttons - Thumbs up/down & Share */}
            <div className="flex items-center justify-between border-t border-b border-border py-4 my-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Podoba mi się</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-1">
                  <ThumbsDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Nie podoba mi się</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                <Share2 className="h-4 w-4" />
                Udostępnij
              </Button>
            </div>

            {/* Source Link */}
            <div className="p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-foreground">
                      {source.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Źródło artykułu</p>
                    <p className="font-semibold text-foreground">{source}</p>
                  </div>
                </div>
                
                {sourceUrl ? (
                  <a 
                    href={sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="default" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Czytaj oryginał
                    </Button>
                  </a>
                ) : (
                  <Button size="default" variant="secondary" disabled>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Brak odnośnika
                  </Button>
                )}
              </div>
            </div>

            {/* Back Button */}
            <div className="mt-6 flex justify-center">
              <Button 
                variant="outline" 
                size="default" 
                className="gap-2"
                onClick={handleGoBack}
              >
                <ArrowLeft className="h-4 w-4" />
                Wróć do listy artykułów
              </Button>
            </div>
          </article>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Article;