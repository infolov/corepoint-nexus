import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useAuth } from "@/hooks/use-auth";

export interface LocalArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  region: string;
  image: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
  content: string;
  pubDateMs: number;
}

interface UseLocalNewsOptions {
  limit?: number;
  autoFetch?: boolean;
}

export function useLocalNews(options: UseLocalNewsOptions = {}) {
  const { limit = 50, autoFetch = true } = options;
  const { settings, loading: settingsLoading } = useUserSettings();
  const { user } = useAuth();
  const [articles, setArticles] = useState<LocalArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [detectedVoivodeship, setDetectedVoivodeship] = useState<string | null>(null);

  const fetchLocalNews = useCallback(async (showLoading = true) => {
    // Wait for settings to load
    if (settingsLoading) return;
    
    // If user has no location set, try IP-based detection
    const voivodeship = settings.voivodeship;
    
    if (showLoading) setLoading(true);
    setError(null);

    try {
      // Get client IP for fallback geolocation
      let clientIP: string | undefined;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        clientIP = ipData.ip;
      } catch (e) {
        console.warn('Could not get client IP:', e);
      }

      const { data, error: fetchError } = await supabase.functions.invoke('fetch-local-news', {
        body: { 
          voivodeship, 
          clientIP,
          userId: user?.id // Pass user ID to filter by preferences
        },
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data?.articles) {
        setArticles(data.articles.slice(0, limit));
        setDetectedVoivodeship(data.voivodeship);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching local news:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [settings.voivodeship, settingsLoading, limit, user?.id]);

  useEffect(() => {
    if (autoFetch && !settingsLoading) {
      fetchLocalNews();
    }
  }, [autoFetch, settingsLoading, fetchLocalNews]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (!autoFetch) return;
    
    const interval = setInterval(() => {
      fetchLocalNews(false);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoFetch, fetchLocalNews]);

  const refetch = () => fetchLocalNews(true);

  return {
    articles,
    loading,
    error,
    refetch,
    lastUpdated,
    detectedVoivodeship,
    hasLocation: !!settings.voivodeship || !!detectedVoivodeship,
  };
}

// Format local article for NewsCard component
export function formatLocalArticleForCard(article: LocalArticle) {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    subcategory: article.region,
    image: article.image,
    timestamp: article.timestamp,
    source: article.source,
    sourceUrl: article.sourceUrl,
    region: article.region,
  };
}
