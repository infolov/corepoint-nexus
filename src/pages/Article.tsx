import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Share2, Bookmark, ExternalLink, Volume2, VolumeX, Square, Loader2 } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ArticleSummary } from "@/components/article/ArticleSummary";
import { SourcesCarousel } from "@/components/article/SourcesCarousel";
import { useRSSArticles, formatRSSArticleForCard, RSSArticle } from "@/hooks/use-rss-articles";
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
  const { trackArticleView } = useRecentlyViewed();
  const { articles: rssArticles, loading: rssLoading } = useRSSArticles();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

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

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlayAudio = (text: string) => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL';
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    setSpeechUtterance(utterance);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleStopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

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
      
      <main className="container py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Strona główna
          </Link>
          <span>/</span>
          <Link 
            to={`/${article.category.toLowerCase()}`} 
            className="hover:text-primary transition-colors"
          >
            {article.category}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
        </nav>

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
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
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

            {/* Featured Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* AI Summary */}
            <ArticleSummary 
              title={article.title}
              content={content}
              category={article.category}
            />

            {/* Audio Controls */}
            {content && (
              <div className="flex items-center gap-2 mb-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePlayAudio(content)}
                  className="gap-2"
                >
                  {isPlaying ? (
                    <>
                      <VolumeX className="h-4 w-4" />
                      Pauza
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Odsłuchaj artykuł
                    </>
                  )}
                </Button>
                {isPlaying && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleStopAudio}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Sources Carousel */}
            <SourcesCarousel 
              mainSource={source}
              mainSourceUrl={sourceUrl}
              category={article.category}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2">
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

            {/* Article Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <h2 className="text-xl font-bold mt-4 mb-4 text-foreground">
                Treść artykułu
              </h2>
              {content ? (
                content.split('\n\n').map((paragraph, index) => {
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-xl font-bold mt-8 mb-4 text-foreground">
                        {paragraph.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (paragraph.trim()) {
                    return (
                      <p key={index} className="text-foreground/90 leading-relaxed mb-4">
                        {paragraph}
                      </p>
                    );
                  }
                  return null;
                })
              ) : (
                <p className="text-muted-foreground italic">
                  Treść artykułu nie jest dostępna. Odwiedź oryginalny artykuł, aby przeczytać więcej.
                </p>
              )}
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

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-bold text-xl mb-6">Powiązane artykuły</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedArticles.map((related) => (
                    <NewsCard
                      key={related.id}
                      {...related}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Back to Home */}
            <div className="mt-8">
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Wróć do strony głównej
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