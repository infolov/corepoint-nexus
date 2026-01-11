import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ExternalLink, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/use-admin';

interface FirecrawlStatusAlertProps {
  onDismiss?: () => void;
}

export function FirecrawlStatusAlert({ onDismiss }: FirecrawlStatusAlertProps) {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [hasCreditsIssue, setHasCreditsIssue] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkFirecrawlStatus = async () => {
    setChecking(true);
    try {
      // Trigger a background process to check status
      const { data, error } = await supabase.functions.invoke('process-news-background');
      
      if (error) {
        console.error('Error checking Firecrawl status:', error);
        return;
      }
      
      // Check if the response indicates credit exhaustion
      if (data?.firecrawlCreditsExhausted || data?.adminWarning?.includes('kredyt')) {
        setHasCreditsIssue(true);
      } else {
        setHasCreditsIssue(false);
      }
      
      setLastChecked(new Date());
    } catch (err) {
      console.error('Error checking Firecrawl status:', err);
    } finally {
      setChecking(false);
    }
  };

  // Check on mount if admin
  useEffect(() => {
    // Check localStorage for persistent credit issue flag
    const storedIssue = localStorage.getItem('firecrawl_credits_issue');
    if (storedIssue === 'true') {
      setHasCreditsIssue(true);
    }
  }, []);

  // Persist credit issue status
  useEffect(() => {
    if (hasCreditsIssue) {
      localStorage.setItem('firecrawl_credits_issue', 'true');
    }
  }, [hasCreditsIssue]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.removeItem('firecrawl_credits_issue');
    onDismiss?.();
  };

  // Don't show if not admin, loading, or dismissed
  if (adminLoading || !isAdmin || dismissed || !hasCreditsIssue) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10 relative">
      <AlertTriangle className="h-4 w-4 text-orange-500" />
      <AlertTitle className="text-orange-600 dark:text-orange-400 pr-8">
        ⚠️ Kredyty Firecrawl wyczerpane
      </AlertTitle>
      <AlertDescription className="text-orange-600/80 dark:text-orange-400/80">
        <p className="mb-2">
          System przetwarzania artykułów działa w trybie awaryjnym. 
          Streszczenia są generowane tylko na podstawie tytułów RSS, bez pobierania pełnej treści artykułów.
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
            asChild
          >
            <a href="https://firecrawl.dev/pricing" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Uzupełnij kredyty
            </a>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={checkFirecrawlStatus}
            disabled={checking}
            className="text-orange-600 hover:bg-orange-500/10"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${checking ? 'animate-spin' : ''}`} />
            Sprawdź ponownie
          </Button>
          {lastChecked && (
            <span className="text-xs text-muted-foreground">
              Sprawdzono: {lastChecked.toLocaleTimeString('pl-PL')}
            </span>
          )}
        </div>
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 text-orange-500 hover:bg-orange-500/10"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}