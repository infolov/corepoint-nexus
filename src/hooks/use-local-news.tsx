import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useAuth } from "@/hooks/use-auth";
import { useLocalContentMixer, type LocalArticle } from "@/hooks/use-local-content-mixer";

export type { LocalArticle };

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

  // Apply content mixing based on location settings
  const { mixedArticles, locationLevel, mixStats } = useLocalContentMixer(
    articles,
    {
      voivodeship: settings.voivodeship,
      county: settings.county,
      city: settings.city,
    },
    limit
  );

  const fetchLocalNews = useCallback(async (showLoading = true) => {
    // Wait for settings to load
    if (settingsLoading) return;
    
    // If user has no location set, don't fetch
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
          county: settings.county,
          city: settings.city,
          clientIP,
          userId: user?.id
        },
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data?.articles) {
        setArticles(data.articles);
        setDetectedVoivodeship(data.voivodeship);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching local news:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [settings.voivodeship, settings.county, settings.city, settingsLoading, user?.id]);

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

  // Check if user has any location set
  const hasLocation = !!settings.voivodeship || !!detectedVoivodeship;

  // Build display location string
  const getDisplayLocation = () => {
    if (settings.city) return settings.city;
    if (settings.county) return settings.county;
    if (settings.voivodeship) return settings.voivodeship;
    if (detectedVoivodeship) return detectedVoivodeship;
    return null;
  };

  return {
    articles: mixedArticles,
    rawArticles: articles,
    loading,
    error,
    refetch,
    lastUpdated,
    detectedVoivodeship,
    hasLocation,
    locationLevel,
    mixStats,
    displayLocation: getDisplayLocation(),
    userSettings: {
      voivodeship: settings.voivodeship,
      county: settings.county,
      city: settings.city,
    },
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
    locationLevel: article.locationLevel,
  };
}
