import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface VerificationLog {
  attempt: number;
  timestamp: string;
  status: VerificationStatus;
  isValid: boolean;
  errors: string[];
  details: {
    claimsChecked: number;
    claimsVerified: number;
    claimsRejected: number;
    fabricatedClaims: string[];
  };
}

export interface ProcessedArticle {
  id: string;
  url: string;
  title: string;
  ai_title: string | null;
  source: string | null;
  category: string | null;
  image_url: string | null;
  full_content: string | null;
  ai_summary: string | null;
  pub_date: string | null;
  processed_at: string;
  created_at: string;
  ai_verification_status: VerificationStatus;
  verification_logs: VerificationLog[];
}

export function useProcessedArticles(limit = 50) {
  const [articles, setArticles] = useState<ProcessedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('processed_articles')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(limit);

      if (queryError) {
        throw queryError;
      }

      // Map data to correct types
      const mappedArticles: ProcessedArticle[] = (data || []).map(item => ({
        ...item,
        ai_verification_status: (item.ai_verification_status as VerificationStatus) || 'pending',
        verification_logs: (Array.isArray(item.verification_logs) 
          ? item.verification_logs 
          : []) as unknown as VerificationLog[],
      }));

      setArticles(mappedArticles);
      
      // Get last update time
      if (data && data.length > 0) {
        setLastUpdate(new Date(data[0].processed_at));
      }
    } catch (err) {
      console.error('Error fetching processed articles:', err);
      setError(err instanceof Error ? err.message : 'Błąd pobierania artykułów');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchArticles();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('processed_articles_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'processed_articles',
        },
        (payload) => {
          console.log('New article processed:', payload.new);
          setArticles(prev => [payload.new as ProcessedArticle, ...prev]);
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchArticles]);

  interface BackgroundProcessResult {
    success: boolean;
    processed?: number;
    verified?: number;
    errors?: number;
    adminWarning?: string;
    firecrawlCreditsExhausted?: boolean;
    error?: string;
  }

  const triggerBackgroundProcess = async (): Promise<BackgroundProcessResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('process-news-background');
      if (error) throw error;
      console.log('Background process triggered:', data);
      return data as BackgroundProcessResult;
    } catch (err) {
      console.error('Error triggering background process:', err);
      throw err;
    }
  };

  return { 
    articles, 
    loading, 
    error, 
    lastUpdate, 
    refetch: fetchArticles,
    triggerBackgroundProcess 
  };
}
