import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache configuration - 30 minutes freshness
const CACHE_TTL_MINUTES = 30;

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
  content: string;
  pubDateMs: number;
}

interface CacheEntry {
  source_url: string;
  content: Article[];
  last_fetched_at: string;
  category: string | null;
}

// Initialize Supabase client with service role for cache management
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Check if cache is fresh (within TTL)
function isCacheFresh(lastFetchedAt: string): boolean {
  const lastFetched = new Date(lastFetchedAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastFetched.getTime()) / (1000 * 60);
  return diffMinutes < CACHE_TTL_MINUTES;
}

// Fetch articles from cache
async function getFromCache(supabase: ReturnType<typeof getSupabaseClient>, sourceKey: string): Promise<{ articles: Article[], isFresh: boolean } | null> {
  console.log(`Checking cache for: ${sourceKey}`);
  
  const { data, error } = await supabase
    .from('news_cache')
    .select('content, last_fetched_at')
    .eq('source_url', sourceKey)
    .single();

  if (error || !data) {
    console.log(`No cache found for: ${sourceKey}`);
    return null;
  }

  const isFresh = isCacheFresh(data.last_fetched_at);
  console.log(`Cache found for ${sourceKey}, fresh: ${isFresh}, last fetched: ${data.last_fetched_at}`);
  
  return {
    articles: data.content as Article[],
    isFresh
  };
}

// Update cache with new articles
async function updateCache(
  supabase: ReturnType<typeof getSupabaseClient>, 
  sourceKey: string, 
  articles: Article[], 
  category: string | null
): Promise<void> {
  console.log(`Updating cache for: ${sourceKey} with ${articles.length} articles`);
  
  const { error } = await supabase
    .from('news_cache')
    .upsert({
      source_url: sourceKey,
      content: articles,
      last_fetched_at: new Date().toISOString(),
      category
    }, {
      onConflict: 'source_url'
    });

  if (error) {
    console.error(`Failed to update cache for ${sourceKey}:`, error);
  } else {
    console.log(`Cache updated successfully for: ${sourceKey}`);
  }
}

// Fetch from RSS edge function
async function fetchFromRSS(): Promise<Article[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  console.log('Fetching fresh data from RSS sources...');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/fetch-rss`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`RSS fetch failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`Fetched ${data.articles?.length || 0} articles from RSS`);
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching from RSS:', error);
    return [];
  }
}

// Fetch from scraper edge function
async function fetchFromScraper(): Promise<Article[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  console.log('Fetching fresh data from scraper...');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/scrape-news`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Scraper fetch failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`Fetched ${data.articles?.length || 0} articles from scraper`);
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching from scraper:', error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    console.log('=== Starting cached news fetch ===');
    
    const supabase = getSupabaseClient();
    
    // Check cache for both RSS and scraper sources
    const [rssCache, scraperCache] = await Promise.all([
      getFromCache(supabase, 'rss-aggregated'),
      getFromCache(supabase, 'scraper-aggregated')
    ]);

    let rssArticles: Article[] = [];
    let scraperArticles: Article[] = [];
    let fromCache = { rss: false, scraper: false };

  // Handle RSS articles
    if (rssCache && rssCache.isFresh) {
      console.log('Using fresh RSS cache');
      rssArticles = rssCache.articles;
      fromCache.rss = true;
    } else {
      // Fetch fresh data from RSS
      rssArticles = await fetchFromRSS();
      
      // Update cache (don't await to speed up response)
      if (rssArticles.length > 0) {
        updateCache(supabase, 'rss-aggregated', rssArticles, null).catch(err => 
          console.error('Background cache update failed for RSS:', err)
        );
      } else if (rssCache) {
        // Use stale cache as fallback
        console.log('Using stale RSS cache as fallback');
        rssArticles = rssCache.articles;
        fromCache.rss = true;
      }
    }

    // Handle scraper articles
    if (scraperCache && scraperCache.isFresh) {
      console.log('Using fresh scraper cache');
      scraperArticles = scraperCache.articles;
      fromCache.scraper = true;
    } else {
      // Fetch fresh data from scraper
      scraperArticles = await fetchFromScraper();
      
      // Update cache (don't await to speed up response)
      if (scraperArticles.length > 0) {
        updateCache(supabase, 'scraper-aggregated', scraperArticles, null).catch(err => 
          console.error('Background cache update failed for scraper:', err)
        );
      } else if (scraperCache) {
        // Use stale scraper cache as fallback
        console.log('Using stale scraper cache as fallback');
        scraperArticles = scraperCache.articles;
        fromCache.scraper = true;
      }
    }

    // Merge and deduplicate articles
    const allArticles = [...rssArticles, ...scraperArticles];
    
    // Remove duplicates by ID
    const seenIds = new Set<string>();
    const uniqueArticles = allArticles.filter(article => {
      if (seenIds.has(article.id)) return false;
      seenIds.add(article.id);
      return true;
    });

    // Sort by publication date (newest first)
    uniqueArticles.sort((a, b) => (b.pubDateMs || 0) - (a.pubDateMs || 0));

    const elapsed = Date.now() - startTime;
    
    console.log(`=== Cached news fetch complete ===`);
    console.log(`Total articles: ${uniqueArticles.length}`);
    console.log(`From cache: RSS=${fromCache.rss}, Scraper=${fromCache.scraper}`);
    console.log(`Time elapsed: ${elapsed}ms`);

    return new Response(JSON.stringify({ 
      articles: uniqueArticles,
      meta: {
        total: uniqueArticles.length,
        fromCache,
        elapsed,
        cacheTTL: CACHE_TTL_MINUTES
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in get-cached-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, articles: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
