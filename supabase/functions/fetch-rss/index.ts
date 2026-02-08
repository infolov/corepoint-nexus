import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Decode HTML entities to proper characters
function decodeHTMLEntities(text: string): string {
  if (!text) return text;
  
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&#34;': '"',
    '&amp;': '&',
    '&#38;': '&',
    '&lt;': '<',
    '&#60;': '<',
    '&gt;': '>',
    '&#62;': '>',
    '&apos;': "'",
    '&#39;': "'",
    '&nbsp;': ' ',
    '&#160;': ' ',
    '&ndash;': '\u2013',
    '&#8211;': '\u2013',
    '&mdash;': '\u2014',
    '&#8212;': '\u2014',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
    '&hellip;': '\u2026',
    '&#8230;': '\u2026',
    // Polish characters
    '&oacute;': '\u00F3',
    '&Oacute;': '\u00D3',
    '&aogon;': '\u0105',
    '&Aogon;': '\u0104',
    '&eogon;': '\u0119',
    '&Eogon;': '\u0118',
    '&sacute;': '\u015B',
    '&Sacute;': '\u015A',
    '&cacute;': '\u0107',
    '&Cacute;': '\u0106',
    '&nacute;': '\u0144',
    '&Nacute;': '\u0143',
    '&zacute;': '\u017A',
    '&Zacute;': '\u0179',
    '&zdot;': '\u017C',
    '&Zdot;': '\u017B',
    '&lstrok;': '\u0142',
    '&Lstrok;': '\u0141',
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }
  
  // Handle decimal numeric entities like &#243; (ó)
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  
  // Handle hexadecimal numeric entities like &#xF3; (ó)
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return decoded;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Hardcoded fallback sources (used only if DB query fails)
const FALLBACK_SOURCES = [
  { url: 'https://www.polsatnews.pl/rss/wszystkie.xml', source_name: 'Polsat News', category: 'Wiadomości' },
  { url: 'https://tvn24.pl/najnowsze.xml', source_name: 'TVN24', category: 'Wiadomości' },
  { url: 'https://www.rmf24.pl/fakty/feed', source_name: 'RMF24', category: 'Wiadomości' },
  { url: 'https://www.bankier.pl/rss/wiadomosci.xml', source_name: 'Bankier.pl', category: 'Biznes' },
  { url: 'https://sportowefakty.wp.pl/rss.xml', source_name: 'Sportowe Fakty', category: 'Sport' },
  { url: 'https://www.chip.pl/feed', source_name: 'Chip.pl', category: 'Technologia' },
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

// Fallback images by category
const FALLBACK_IMAGES: Record<string, string> = {
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

function parseRSSItem(item: string, source: string, category: string): Article | null {
  try {
    const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
    const descMatch = item.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    const contentMatch = item.match(/<content:encoded>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/content:encoded>/s);
    
    // Try to find image from various sources
    let image = '';
    const enclosureMatch = item.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/);
    const mediaMatch = item.match(/<media:content[^>]*url=["']([^"']+)["']/);
    const imgMatch = item.match(/<img[^>]*src=["']([^"']+)["']/);
    const mediaThumbMatch = item.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/);
    
    if (enclosureMatch) image = enclosureMatch[1];
    else if (mediaMatch) image = mediaMatch[1];
    else if (mediaThumbMatch) image = mediaThumbMatch[1];
    else if (imgMatch) image = imgMatch[1];
    
    if (!image) {
      image = FALLBACK_IMAGES[category] || FALLBACK_IMAGES['Wiadomości'];
    }

    const title = decodeHTMLEntities(titleMatch?.[1]?.trim() || '');
    const link = linkMatch?.[1]?.trim() || '';
    const description = decodeHTMLEntities(descMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || '');
    const content = decodeHTMLEntities(contentMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || description);
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
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

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
    console.error(`Error fetching ${feedUrl}:`, error);
    return [];
  }
}

// Fetch RSS sources from the database with flexible column mapping
async function fetchSourcesFromDB(): Promise<RSSSource[]> {
  console.log('Fetching sources from rss_sources table...');
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: sources, error } = await supabase
      .from('rss_sources')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching from rss_sources:', error.message);
      return [];
    }

    console.log('Found sources:', sources?.length);

    if (!sources || sources.length === 0) {
      console.warn('No active sources found in rss_sources table');
      return [];
    }

    // Flexible column mapping to handle potential column name variations
    const mapped: RSSSource[] = sources.map((source: Record<string, unknown>) => {
      const url = (source.url || source.feed_url || source.link || source.address) as string;
      const name = (source.source_name || source.name || source.title) as string;
      const category = (source.category || source.feed_category || source.type || 'Wiadomości') as string;

      return { url, source_name: name, category };
    }).filter((s: RSSSource) => s.url && s.source_name);

    console.log(`Mapped ${mapped.length} valid sources from DB`);
    
    // Log first 3 sources for debugging
    mapped.slice(0, 3).forEach((s: RSSSource) => {
      console.log(`  - [${s.category}] ${s.source_name}: ${s.url}`);
    });

    return mapped;
  } catch (err) {
    console.error('Unexpected error fetching sources from DB:', err);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting RSS fetch...');
    
    // 1. Try to load sources from the database
    let rssSources = await fetchSourcesFromDB();
    
    // 2. Fall back to hardcoded sources if DB returned nothing
    if (rssSources.length === 0) {
      console.warn('No sources from DB, using fallback hardcoded sources');
      rssSources = FALLBACK_SOURCES;
    }

    console.log(`Will fetch from ${rssSources.length} sources`);

    // 3. Fetch from all sources in parallel
    const fetchPromises = rssSources.map(({ url, source_name, category }) =>
      fetchRSSFeed(url, source_name, category)
    );

    const results = await Promise.allSettled(fetchPromises);
    
    let allArticles: Article[] = [];
    let successCount = 0;
    let failCount = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles = [...allArticles, ...result.value];
        if (result.value.length > 0) successCount++;
      } else {
        failCount++;
        console.error(`Failed to fetch from ${rssSources[index].source_name}:`, result.reason);
      }
    });

    // Sort by publication date (newest first)
    allArticles.sort((a, b) => b.pubDateMs - a.pubDateMs);

    console.log(`Total articles fetched: ${allArticles.length} (${successCount} sources OK, ${failCount} failed)`);

    return new Response(JSON.stringify({ 
      articles: allArticles,
      meta: {
        sourcesTotal: rssSources.length,
        sourcesOk: successCount,
        sourcesFailed: failCount,
        articlesTotal: allArticles.length,
        fromDatabase: rssSources !== FALLBACK_SOURCES,
      }
    }), {
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
