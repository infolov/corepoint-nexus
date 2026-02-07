import { useState } from 'react';
import { useProcessedArticles, ProcessedArticle } from '@/hooks/use-processed-articles';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Clock, ExternalLink, Newspaper, Loader2, CheckCircle, XCircle, AlertCircle, ChevronDown, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
// Header i Footer renderowane globalnie przez MainLayout
// import { Header } from '@/components/layout/Header';
// import { Footer } from '@/components/layout/Footer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { VerificationStatus, VerificationLog } from '@/hooks/use-processed-articles';
import { useAdmin } from '@/hooks/use-admin';

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

  const getVerificationIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getVerificationLabel = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return 'Zweryfikowane';
      case 'rejected':
        return 'Odrzucone';
      default:
        return 'Oczekuje';
    }
  };

  const getVerificationBadgeVariant = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return 'default' as const;
      case 'rejected':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
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
          <div className="absolute top-3 left-3 flex gap-2">
            {article.category && (
              <Badge className="bg-primary/90 hover:bg-primary">
                {article.category}
              </Badge>
            )}
          </div>
          {/* Verification Status Badge */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-3 right-3">
                  <Badge 
                    variant={getVerificationBadgeVariant(article.ai_verification_status)}
                    className="flex items-center gap-1 cursor-help"
                  >
                    {getVerificationIcon(article.ai_verification_status)}
                    <span className="text-xs">{getVerificationLabel(article.ai_verification_status)}</span>
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="text-sm">
                  <p className="font-semibold mb-1">Status weryfikacji faktów</p>
                  {article.ai_verification_status === 'verified' && (
                    <p>Podsumowanie zostało zweryfikowane - wszystkie fakty są zgodne z oryginalnym źródłem.</p>
                  )}
                  {article.ai_verification_status === 'rejected' && (
                    <p>Podsumowanie zawiera informacje niezgodne z oryginalnym źródłem.</p>
                  )}
                  {article.ai_verification_status === 'pending' && (
                    <p>Weryfikacja w toku lub wystąpił błąd podczas sprawdzania.</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
  const { isAdmin } = useAdmin();
  const [isProcessing, setIsProcessing] = useState(false);
  const [firecrawlWarning, setFirecrawlWarning] = useState<string | null>(null);

  // Calculate verification stats
  const verificationStats = {
    total: articles.length,
    verified: articles.filter(a => a.ai_verification_status === 'verified').length,
    rejected: articles.filter(a => a.ai_verification_status === 'rejected').length,
    pending: articles.filter(a => a.ai_verification_status === 'pending').length,
  };

  const handleManualProcess = async () => {
    setIsProcessing(true);
    setFirecrawlWarning(null);
    try {
      const result = await triggerBackgroundProcess();
      
      // Check for Firecrawl credits exhaustion warning
      if (result?.firecrawlCreditsExhausted || result?.adminWarning) {
        setFirecrawlWarning(result.adminWarning || 'Kredyty Firecrawl wyczerpane - artykuły przetwarzane tylko na podstawie danych RSS');
      }
      
      setTimeout(() => refetch(), 2000);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col">
      
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

        {/* Firecrawl Credits Warning - Admin Only */}
        {isAdmin && firecrawlWarning && (
          <Alert variant="destructive" className="mb-6 border-orange-500/50 bg-orange-500/10">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertTitle className="text-orange-600 dark:text-orange-400">
              Ostrzeżenie: Brak kredytów Firecrawl
            </AlertTitle>
            <AlertDescription className="text-orange-600/80 dark:text-orange-400/80">
              {firecrawlWarning}
              <br />
              <span className="text-sm mt-1 block">
                Artykuły są przetwarzane w trybie awaryjnym - generowanie streszczeń tylko na podstawie tytułów RSS. 
                Uzupełnij kredyty na <a href="https://firecrawl.dev/pricing" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-orange-500">firecrawl.dev</a>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Stats with Verification Info */}
        {!loading && articles.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Wyświetlanie <span className="font-semibold text-foreground">{articles.length}</span> automatycznie przetworzonych artykułów
              </span>
              
              {/* Verification Stats */}
              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-md cursor-help">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {verificationStats.verified}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Zweryfikowane artykuły</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-md cursor-help">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          {verificationStats.rejected}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Odrzucone artykuły</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 rounded-md cursor-help">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                          {verificationStats.pending}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Oczekujące na weryfikację</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Badge variant="secondary">
                  Aktualizacja co 30 min
                </Badge>
              </div>
            </div>
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
    </div>
  );
}
