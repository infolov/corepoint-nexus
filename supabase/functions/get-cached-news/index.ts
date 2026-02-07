import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Cache configuration - TTL per category
const CACHE_TTL_CONFIG: Record<string, number> = {
  'wiadomosci': 15,  // News category - fresher content needed
  'default': 30      // Default TTL for other categories
};

// Get TTL for a specific category
function getCacheTTL(category?: string | null): number {
  if (category && CACHE_TTL_CONFIG[category.toLowerCase()]) {
    return CACHE_TTL_CONFIG[category.toLowerCase()];
  }
  return CACHE_TTL_CONFIG['default'];
}

interface Article {
  id: string;
  title: string;
  aiTitle?: string | null;
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
function isCacheFresh(lastFetchedAt: string, category?: string | null): boolean {
  const lastFetched = new Date(lastFetchedAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastFetched.getTime()) / (1000 * 60);
  const ttl = getCacheTTL(category);
  return diffMinutes < ttl;
}

// Fetch articles from cache
async function getFromCache(supabase: ReturnType<typeof getSupabaseClient>, sourceKey: string, category?: string): Promise<{ articles: Article[], isFresh: boolean } | null> {
  console.log(`Checking cache for: ${sourceKey}`);
  
  const { data, error } = await supabase
    .from('news_cache')
    .select('content, last_fetched_at, category')
    .eq('source_url', sourceKey)
    .single();

  if (error || !data) {
    console.log(`No cache found for: ${sourceKey}`);
    return null;
  }

  const isFresh = isCacheFresh(data.last_fetched_at, category || data.category);
  const ttl = getCacheTTL(category || data.category);
  console.log(`Cache found for ${sourceKey}, fresh: ${isFresh}, TTL: ${ttl}min, last fetched: ${data.last_fetched_at}`);
  
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

// Timeout wrapper for sub-function calls
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => {
        console.log(`Sub-function call timed out after ${timeoutMs}ms, using fallback`);
        resolve(fallback);
      }, timeoutMs);
    }),
  ]);
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
    return new Response('ok', { headers: corsHeaders });
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
    } else if (rssCache) {
      // Have stale cache - return it immediately and try refresh with timeout
      console.log('Using stale RSS cache, attempting background refresh...');
      rssArticles = rssCache.articles;
      fromCache.rss = true;
      
      // Try to refresh with 8s timeout, update cache in background
      withTimeout(fetchFromRSS(), 8000, [] as Article[]).then(freshArticles => {
        if (freshArticles.length > 0) {
          updateCache(supabase, 'rss-aggregated', freshArticles, null).catch(err => 
            console.error('Background cache update failed for RSS:', err)
          );
        }
      }).catch(err => console.error('Background RSS refresh failed:', err));
    } else {
      // No cache at all - must wait for fetch (with timeout)
      console.log('No RSS cache, fetching with timeout...');
      rssArticles = await withTimeout(fetchFromRSS(), 10000, [] as Article[]);
      
      if (rssArticles.length > 0) {
        updateCache(supabase, 'rss-aggregated', rssArticles, null).catch(err => 
          console.error('Background cache update failed for RSS:', err)
        );
      }
    }

    // Handle scraper articles
    if (scraperCache && scraperCache.isFresh) {
      console.log('Using fresh scraper cache');
      scraperArticles = scraperCache.articles;
      fromCache.scraper = true;
    } else if (scraperCache) {
      // Have stale cache - return it immediately
      console.log('Using stale scraper cache, attempting background refresh...');
      scraperArticles = scraperCache.articles;
      fromCache.scraper = true;
      
      withTimeout(fetchFromScraper(), 8000, [] as Article[]).then(freshArticles => {
        if (freshArticles.length > 0) {
          updateCache(supabase, 'scraper-aggregated', freshArticles, null).catch(err => 
            console.error('Background cache update failed for scraper:', err)
          );
        }
      }).catch(err => console.error('Background scraper refresh failed:', err));
    } else {
      // No cache at all - must wait
      console.log('No scraper cache, fetching with timeout...');
      scraperArticles = await withTimeout(fetchFromScraper(), 10000, [] as Article[]);
      
      if (scraperArticles.length > 0) {
        updateCache(supabase, 'scraper-aggregated', scraperArticles, null).catch(err => 
          console.error('Background cache update failed for scraper:', err)
        );
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

    // Enrich articles with AI titles from processed_articles
    const articleUrls = uniqueArticles
      .map(a => a.sourceUrl)
      .filter(url => url && url.length > 0);
    
    if (articleUrls.length > 0) {
      console.log(`Looking up AI titles for ${articleUrls.length} articles...`);
      
      const { data: processedData } = await supabase
        .from('processed_articles')
        .select('url, ai_title')
        .in('url', articleUrls)
        .not('ai_title', 'is', null);
      
      if (processedData && processedData.length > 0) {
        const aiTitleMap = new Map(processedData.map(p => [p.url, p.ai_title]));
        console.log(`Found ${processedData.length} AI titles`);
        
        // Enrich articles with AI titles
        for (const article of uniqueArticles) {
          const aiTitle = aiTitleMap.get(article.sourceUrl);
          if (aiTitle) {
            article.aiTitle = aiTitle;
          }
        }
      }
    }

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
        cacheTTL: CACHE_TTL_CONFIG
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
