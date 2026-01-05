import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare EdgeRuntime for background tasks
declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Create a hash from article title for cache lookup
function createTitleHash(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Generate AI summary for a single article (background job)
async function generateSummaryForArticle(
  supabase: ReturnType<typeof getSupabaseClient>,
  article: Article
): Promise<void> {
  const titleHash = createTitleHash(article.title);
  
  // Check if summary already exists
  const { data: existingSummary } = await supabase
    .from('article_summaries')
    .select('id')
    .eq('title_hash', titleHash)
    .single();
  
  if (existingSummary) {
    console.log(`Summary already exists for: ${article.title.substring(0, 50)}...`);
    return;
  }
  
  console.log(`Generating summary for: ${article.title.substring(0, 50)}...`);
  
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY is not configured");
    return;
  }
  
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Jesteś ekspertem od streszczania wiadomości dla polskiego portalu informacyjnego. Tworzysz zwięzłe, obiektywne streszczenia artykułów w języku polskim.

KRYTYCZNE ZASADY:
- ZAWSZE zachowuj pełny kontekst i sens artykułu
- Zacznij od NAJWAŻNIEJSZEJ informacji (kto, co, gdzie, kiedy)
- Wyjaśnij DLACZEGO to jest istotne
- NIE pomijaj kluczowych szczegółów jak nazwy, liczby, daty
- Używaj prostego, zrozumiałego języka
- NIE dodawaj własnych opinii ani komentarzy
- NIE zaczynaj od "Artykuł opisuje..." ani podobnych fraz
- Pisz w czasie teraźniejszym lub przeszłym dokonanym`
          },
          {
            role: "user",
            content: `Przygotuj podsumowanie tego artykułu z kategorii "${article.category}".

TYTUŁ: ${article.title}

PEŁNA TREŚĆ ARTYKUŁU:
${(article.content || article.excerpt || '').substring(0, 25000)}

Pamiętaj: Zachowaj pełny kontekst i najważniejsze fakty. Podsumowanie musi być samodzielne i zrozumiałe bez czytania całego artykułu.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.25,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`Rate limited while generating summary for: ${article.id}`);
        return;
      }
      if (response.status === 402) {
        console.warn(`No AI credits while generating summary for: ${article.id}`);
        return;
      }
      console.error(`AI gateway error for ${article.id}:`, response.status);
      return;
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content;

    if (!summary) {
      console.error(`No summary generated for: ${article.id}`);
      return;
    }

    // Save summary to cache
    const { error: insertError } = await supabase
      .from('article_summaries')
      .upsert({
        article_id: article.id,
        title_hash: titleHash,
        summary: summary,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'title_hash'
      });

    if (insertError) {
      console.error(`Failed to cache summary for ${article.id}:`, insertError);
    } else {
      console.log(`Summary generated and cached for: ${article.title.substring(0, 50)}...`);
    }
  } catch (error) {
    console.error(`Error generating summary for ${article.id}:`, error);
  }
}

// Background job to generate summaries for new articles
async function generateSummariesInBackground(
  supabase: ReturnType<typeof getSupabaseClient>,
  articles: Article[]
): Promise<void> {
  console.log(`Starting background summary generation for ${articles.length} articles...`);
  
  // Process articles in batches of 5 to speed up generation
  const batchSize = 5;
  const delayBetweenBatches = 1500; // 1.5 seconds between batches
  
  for (let i = 0; i < Math.min(articles.length, 30); i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    
    // Process batch in parallel
    await Promise.allSettled(
      batch.map(article => generateSummaryForArticle(supabase, article))
    );
    
    // Wait between batches to avoid rate limiting
    if (i + batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  console.log('Background summary generation completed');
}

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

    // Track if we fetched fresh articles (for background summary generation)
    let freshArticlesForSummary: Article[] = [];

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
        freshArticlesForSummary = [...freshArticlesForSummary, ...rssArticles];
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
        freshArticlesForSummary = [...freshArticlesForSummary, ...scraperArticles];
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

    // Start background summary generation for fresh articles (using EdgeRuntime.waitUntil)
    if (freshArticlesForSummary.length > 0) {
      console.log(`Scheduling background summary generation for ${freshArticlesForSummary.length} fresh articles`);
      EdgeRuntime.waitUntil(generateSummariesInBackground(supabase, freshArticlesForSummary));
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
