import { useState } from 'react';
import { useProcessedArticles, ProcessedArticle } from '@/hooks/use-processed-articles';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Clock, ExternalLink, Newspaper, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

function ArticleCard({ article }: { article: ProcessedArticle }) {
  const formattedDate = article.pub_date 
    ? formatDistanceToNow(new Date(article.pub_date), { addSuffix: true, locale: pl })
    : formatDistanceToNow(new Date(article.processed_at), { addSuffix: true, locale: pl });

  // Convert <b> tags to <strong> for proper rendering
  const formatSummary = (summary: string | null) => {
    if (!summary) return '';
    return summary
      .replace(/<b>/g, '<strong>')
      .replace(/<\/b>/g, '</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {article.image_url && (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          {article.category && (
            <Badge className="absolute top-3 left-3 bg-primary/90 hover:bg-primary">
              {article.category}
            </Badge>
          )}
        </div>
      )}
      
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold leading-tight line-clamp-2 hover:text-primary transition-colors">
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            {article.title}
          </a>
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {article.source && (
            <span className="font-medium text-primary/80">{article.source}</span>
          )}
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formattedDate}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        {article.ai_summary ? (
          <div 
            className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formatSummary(article.ai_summary) }}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Podsumowanie w trakcie generowania...
          </p>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 border-t">
        <Button variant="ghost" size="sm" asChild className="w-full">
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            Czytaj więcej
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

function ArticleCardSkeleton() {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <Skeleton className="aspect-video" />
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

export default function AutoNews() {
  const { articles, loading, error, lastUpdate, refetch, triggerBackgroundProcess } = useProcessedArticles(100);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleManualProcess = async () => {
    setIsProcessing(true);
    try {
      await triggerBackgroundProcess();
      setTimeout(() => refetch(), 2000);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Newspaper className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Automatyczne Streszczenia</h1>
              <p className="text-muted-foreground">
                Newsy przetworzone przez AI w tle
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4" />
                <span>
                  Ostatnia aktualizacja:{' '}
                  <span className="font-medium text-foreground">
                    {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: pl })}
                  </span>
                </span>
              </div>
            )}
            
            <Button 
              onClick={handleManualProcess} 
              disabled={isProcessing}
              variant="outline"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {isProcessing ? 'Przetwarzam...' : 'Odśwież teraz'}
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Stats */}
        {!loading && articles.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Wyświetlanie <span className="font-semibold text-foreground">{articles.length}</span> automatycznie przetworzonych artykułów
            </span>
            <Badge variant="secondary">
              Aktualizacja co 30 min
            </Badge>
          </div>
        )}

        {/* Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Brak artykułów</h2>
            <p className="text-muted-foreground mb-4">
              Kliknij przycisk poniżej, aby rozpocząć automatyczne przetwarzanie newsów.
            </p>
            <Button onClick={handleManualProcess} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Rozpocznij przetwarzanie
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
