import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback sources if database is empty
const FALLBACK_SOURCES = [
  { url: 'https://tvn24.pl/najnowsze.xml', source: 'TVN24', category: 'Wiadomości' },
  { url: 'https://www.rmf24.pl/fakty/feed', source: 'RMF24', category: 'Wiadomości' },
  { url: 'https://sportowefakty.wp.pl/rss.xml', source: 'Sportowe Fakty', category: 'Sport' },
  { url: 'https://www.chip.pl/feed', source: 'Chip.pl', category: 'Technologia' },
];

interface RSSSource {
  url: string;
  source_name: string;
  category: string;
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

// Simple hash function for stable ID generation
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function parseRSSItem(item: string, source: string, category: string): Article | null {
  try {
    const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
    const descMatch = item.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    const contentMatch = item.match(/<content:encoded>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/content:encoded>/s);
    
    let image = '';
    const enclosureMatch = item.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/);
    const mediaMatch = item.match(/<media:content[^>]*url=["']([^"']+)["']/);
    const imgMatch = item.match(/<img[^>]*src=["']([^"']+)["']/);
    const mediaThumbMatch = item.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/);
    
    if (enclosureMatch) image = enclosureMatch[1];
    else if (mediaMatch) image = mediaMatch[1];
    else if (mediaThumbMatch) image = mediaThumbMatch[1];
    else if (imgMatch) image = imgMatch[1];
    
    const fallbackImages: Record<string, string> = {
      'Wiadomości': 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop',
      'Biznes': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop',
      'Sport': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop',
      'Technologia': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop',
      'Lifestyle': 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=500&fit=crop',
      'Rozrywka': 'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=800&h=500&fit=crop',
      'Zdrowie': 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&h=500&fit=crop',
      'Kultura': 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=500&fit=crop',
      'Nauka': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=500&fit=crop',
      'Motoryzacja': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=500&fit=crop',
    };
    
    if (!image) {
      image = fallbackImages[category] || fallbackImages['Wiadomości'];
    }

    const title = titleMatch?.[1]?.trim() || '';
    const link = linkMatch?.[1]?.trim() || '';
    const description = descMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
    const content = contentMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || description;
    const pubDateStr = pubDateMatch?.[1] || '';

    if (!title || !link) return null;

    const id = simpleHash(link) + simpleHash(title.substring(0, 20));

    let pubDateMs = Date.now();
    let timestamp = 'Przed chwilą';
    
    try {
      if (pubDateStr) {
        const date = new Date(pubDateStr);
        if (!isNaN(date.getTime())) {
          pubDateMs = date.getTime();
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);

          if (diffMins < 1) {
            timestamp = 'Przed chwilą';
          } else if (diffMins < 60) {
            timestamp = `${diffMins} min temu`;
          } else if (diffHours < 24) {
            timestamp = `${diffHours} godz. temu`;
          } else if (diffDays < 30) {
            timestamp = `${diffDays} dni temu`;
          } else {
            timestamp = date.toLocaleDateString('pl-PL');
          }
        }
      }
    } catch (e) {
      console.error('Date parsing error:', e);
    }

    return {
      id,
      title,
      excerpt: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
      category,
      image,
      source,
      sourceUrl: link,
      timestamp,
      content,
      pubDateMs,
    };
  } catch (error) {
    console.error('Error parsing RSS item:', error);
    return null;
  }
}

async function fetchRSSFeed(feedUrl: string, source: string, category: string): Promise<Article[]> {
  try {
    console.log(`Fetching RSS from: ${feedUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Failed to fetch ${feedUrl}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
    
    const articles: Article[] = [];
    for (const item of items.slice(0, 10)) {
      const article = parseRSSItem(item, source, category);
      if (article) {
        articles.push(article);
      }
    }

    console.log(`Fetched ${articles.length} articles from ${source}`);
    return articles;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Timeout fetching ${feedUrl}`);
    } else {
      console.error(`Error fetching ${feedUrl}:`, error);
    }
    return [];
  }
}

async function getRSSSources(): Promise<RSSSource[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('rss_sources')
      .select('url, source_name, category')
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching RSS sources from database:', error);
      return [];
    }
    
    console.log(`Loaded ${data?.length || 0} RSS sources from database`);
    return data || [];
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting RSS fetch...');
    
    // Get sources from database
    let sources = await getRSSSources();
    
    // Use fallback if no sources in database
    if (sources.length === 0) {
      console.log('No sources in database, using fallback sources');
      sources = FALLBACK_SOURCES.map(s => ({
        url: s.url,
        source_name: s.source,
        category: s.category
      }));
    }
    
    // Fetch from all sources in parallel
    const fetchPromises = sources.map(({ url, source_name, category }) =>
      fetchRSSFeed(url, source_name, category)
    );

    const results = await Promise.allSettled(fetchPromises);
    
    let allArticles: Article[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles = [...allArticles, ...result.value];
      } else {
        console.error(`Failed to fetch from ${sources[index].source_name}:`, result.reason);
      }
    });

    allArticles.sort((a, b) => b.pubDateMs - a.pubDateMs);

    console.log(`Total articles fetched: ${allArticles.length}`);

    return new Response(JSON.stringify({ articles: allArticles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in fetch-rss function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, articles: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
