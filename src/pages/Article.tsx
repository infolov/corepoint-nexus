import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
// Header i Footer renderowane globalnie przez MainLayout
// import { Header } from "@/components/layout/Header";
// import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Clock, Share2, ExternalLink, Loader2, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck, Home } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ArticleSummary } from "@/components/article/ArticleSummary";
import { useRSSArticles } from "@/hooks/use-rss-articles";
import { AuctionAdSlot } from "@/components/widgets/AuctionAdSlot";
import { toast } from "sonner";
import { useRelatedArticles } from "@/hooks/use-related-articles";
import { RecommendedArticles } from "@/components/article/RecommendedArticles";
import { NextArticlePreview } from "@/components/article/NextArticlePreview";
const Article = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trackArticleView } = useRecentlyViewed();
  const { articles: rssArticles, loading: rssLoading } = useRSSArticles();
  const [isSaved, setIsSaved] = useState(false);
  const [cachedArticle, setCachedArticle] = useState<any>(null);
  const [aiGeneratedTitle, setAiGeneratedTitle] = useState<string | null>(null);

  // Load cached article from localStorage FIRST (instant load)
  useEffect(() => {
    if (id) {
      // Try localStorage first (set when clicking on NewsCard)
      const cached = localStorage.getItem(`article_${id}`);
      if (cached) {
        try {
          setCachedArticle(JSON.parse(cached));
          return;
        } catch (e) {
          console.error("Error parsing cached article:", e);
        }
      }
    }
  }, [id]);

  // Check if article is saved
  useEffect(() => {
    const saved = localStorage.getItem('savedArticles');
    if (saved && id) {
      const savedArticles = JSON.parse(saved);
      setIsSaved(savedArticles.includes(id));
    }
  }, [id]);

  // Handle save article
  const handleSaveArticle = () => {
    const saved = localStorage.getItem('savedArticles');
    let savedArticles = saved ? JSON.parse(saved) : [];
    
    if (isSaved) {
      savedArticles = savedArticles.filter((articleId: string) => articleId !== id);
      toast.success("Usunięto z zapisanych");
    } else {
      savedArticles.push(id);
      toast.success("Zapisano na później");
    }
    
    localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
    setIsSaved(!isSaved);
  };

  // Handle back navigation - go back in history to preserve scroll position
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Find article: cache first, then RSS
  const rssArticle = rssArticles.find((a) => a.id === id);
  const article = cachedArticle || rssArticle;

  // Get article content - try multiple fields for RSS articles
  const content = article?.content || article?.fullContent || article?.description || article?.excerpt || article?.title || "";
  const sourceUrl = article?.sourceUrl || article?.url || article?.link;
  const source = article?.source || "Informacje.pl";

  // Get related articles using intelligent matching (category + keywords + named entities)
  // MUST be called before any early returns to follow Rules of Hooks
  const relatedArticles = useRelatedArticles({
    currentArticle: article ? {
      id: article.id || id || '',
      title: article.title,
      category: article.category,
      image: article.image,
      excerpt: article.excerpt || (article as any).description,
      content: content
    } : null,
    allArticles: rssArticles.map(a => ({
      id: a.id,
      title: a.title,
      category: a.category,
      image: a.image,
      timestamp: (a as any).timestamp,
      source: (a as any).source,
      excerpt: (a as any).excerpt || (a as any).description
    })),
    limit: 4
  });
  
  // Track article view for logged-in users
  useEffect(() => {
    if (article && id) {
      trackArticleView(id, article.category);
    }
  }, [id, article?.category]);

  // Show loading while RSS is still loading and no article in cache
  // Also show loading if RSS loaded but has 0 articles (still fetching from edge function)
  const isStillLoading = rssLoading || (rssArticles.length === 0 && !cachedArticle);
  
  if (isStillLoading && !cachedArticle) {
    return (
      <div className="min-h-[50vh]">
        <main className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }
  
  if (!article) {
    return (
      <div className="min-h-[50vh]">
        <main className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Artykuł nie znaleziony</h1>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wróć do strony głównej
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div>
      
      <main className="container py-4 md:py-6">
        {/* Top Ad Banner */}
        <div className="mb-6">
          <AuctionAdSlot variant="horizontal" placementSlug="article-top" className="w-full" slotIndex={0} />
        </div>

        {/* Navigation Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span>Strona główna</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/kategoria/${article.category.toLowerCase()}`}>
                  {article.category}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[200px]">
                {aiGeneratedTitle || article.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="max-w-3xl mx-auto">
          {/* Main Article Content */}
          <article>
            {/* Article Title */}
            <h1 className="text-xl md:text-2xl lg:text-3xl font-medium text-foreground mb-4 leading-tight">
              {aiGeneratedTitle || article.title}
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

            {/* Ad Banner between image and AI Summary */}
            <div className="mb-6">
              <AuctionAdSlot variant="horizontal" placementSlug="article-middle" className="w-full" slotIndex={2} />
            </div>

            {/* AI Summary */}
            <ArticleSummary 
              title={article.title}
              content={content}
              category={article.category}
              sourceUrl={sourceUrl}
              onTitleGenerated={(newTitle) => setAiGeneratedTitle(newTitle)}
            />

            {/* Action Buttons - Thumbs up/down, Save & Share */}
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1"
                  onClick={handleSaveArticle}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{isSaved ? "Zapisano" : "Zapisz"}</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                <Share2 className="h-4 w-4" />
                Udostępnij
              </Button>
            </div>

            {/* Middle Ad Banner */}
            <div className="mb-6">
              <AuctionAdSlot variant="horizontal" placementSlug="article-bottom" className="w-full" slotIndex={1} />
            </div>

            {/* Source Link */}
            <div className="pt-4 mt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Źródło:</span>
                {sourceUrl ? (
                  <a 
                    href={sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary hover:underline transition-colors"
                  >
                    {source}
                  </a>
                ) : (
                  <span className="text-foreground">{source}</span>
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

        {/* Ad slot between article and recommendations */}
        <div className="max-w-3xl mx-auto mt-8">
          <AuctionAdSlot 
            variant="horizontal" 
            placementSlug="article-bottom" 
            className="w-full" 
            slotIndex={3} 
          />
        </div>

        {/* Recommended Articles Section */}
        {relatedArticles.length > 0 && (
          <RecommendedArticles 
            articles={relatedArticles.map(a => ({
              ...a,
              timestamp: (a as any).timestamp,
              source: (a as any).source
            }))} 
          />
        )}

        {/* Next Article Preview - Engagement Loop */}
        {relatedArticles.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <NextArticlePreview 
              article={relatedArticles[0] ? {
                ...relatedArticles[0],
                excerpt: (relatedArticles[0] as any).excerpt,
                timestamp: (relatedArticles[0] as any).timestamp
              } : null} 
            />
          </div>
        )}

        {/* Bottom ad slot */}
        <div className="mt-8">
          <AuctionAdSlot 
            variant="horizontal" 
            placementSlug="footer" 
            className="w-full" 
            slotIndex={4} 
          />
        </div>
      </main>
    </div>
  );
};

export default Article;
