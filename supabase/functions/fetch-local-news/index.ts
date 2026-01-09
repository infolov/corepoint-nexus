import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map for voivodeship name normalization
const voivodeshipNormalize: Record<string, string> = {
  'mazowieckie': 'mazowieckie',
  'pomorskie': 'pomorskie',
  'małopolskie': 'malopolskie',
  'malopolskie': 'malopolskie',
  'śląskie': 'slaskie',
  'slaskie': 'slaskie',
  'wielkopolskie': 'wielkopolskie',
  'dolnośląskie': 'dolnoslaskie',
  'dolnoslaskie': 'dolnoslaskie',
  'łódzkie': 'lodzkie',
  'lodzkie': 'lodzkie',
  'zachodniopomorskie': 'zachodniopomorskie',
  'kujawsko-pomorskie': 'kujawsko-pomorskie',
  'lubelskie': 'lubelskie',
  'podkarpackie': 'podkarpackie',
  'podlaskie': 'podlaskie',
  'warmińsko-mazurskie': 'warminsko-mazurskie',
  'warminsko-mazurskie': 'warminsko-mazurskie',
  'lubuskie': 'lubuskie',
  'świętokrzyskie': 'swietokrzyskie',
  'swietokrzyskie': 'swietokrzyskie',
  'opolskie': 'opolskie',
};

// HTML entity decoder
function decodeHTMLEntities(text: string): string {
  if (!text) return text;
  
  const entities: Record<string, string> = {
    '&quot;': '"', '&#34;': '"', '&amp;': '&', '&#38;': '&',
    '&lt;': '<', '&#60;': '<', '&gt;': '>', '&#62;': '>',
    '&apos;': "'", '&#39;': "'", '&nbsp;': ' ', '&#160;': ' ',
    '&ndash;': '\u2013', '&#8211;': '\u2013', '&mdash;': '\u2014', '&#8212;': '\u2014',
    '&lsquo;': '\u2018', '&rsquo;': '\u2019', '&ldquo;': '\u201C', '&rdquo;': '\u201D',
    '&hellip;': '\u2026', '&#8230;': '\u2026',
    '&oacute;': '\u00F3', '&Oacute;': '\u00D3', '&aogon;': '\u0105', '&Aogon;': '\u0104',
    '&eogon;': '\u0119', '&Eogon;': '\u0118', '&sacute;': '\u015B', '&Sacute;': '\u015A',
    '&cacute;': '\u0107', '&Cacute;': '\u0106', '&nacute;': '\u0144', '&Nacute;': '\u0143',
    '&zacute;': '\u017A', '&Zacute;': '\u0179', '&zdot;': '\u017C', '&Zdot;': '\u017B',
    '&lstrok;': '\u0142', '&Lstrok;': '\u0141',
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return decoded;
}

// Simple hash function
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

interface LocalArticle {
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

interface SourceFromDB {
  id: string;
  url: string;
  source_name: string;
  voivodeship: string;
  source_type: string;
  is_active: boolean;
}

function parseRSSItem(item: string, source: string, voivodeship: string): LocalArticle | null {
  try {
    const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
    const descMatch = item.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    const contentMatch = item.match(/<content:encoded>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/content:encoded>/s);
    
    // Find image
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
      image = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=500&fit=crop';
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
      category: 'Lokalne',
      region: voivodeship,
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

async function fetchRSSFeed(feedUrl: string, source: string, voivodeship: string): Promise<LocalArticle[]> {
  try {
    console.log(`Fetching local RSS from: ${feedUrl}`);
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
    
    const articles: LocalArticle[] = [];
    for (const item of items.slice(0, 15)) {
      const article = parseRSSItem(item, source, voivodeship);
      if (article) {
        articles.push(article);
      }
    }

    console.log(`Fetched ${articles.length} local articles from ${source}`);
    return articles;
  } catch (error) {
    console.error(`Error fetching ${feedUrl}:`, error);
    return [];
  }
}

// IP to location using free service
async function getLocationFromIP(ip: string): Promise<string | null> {
  try {
    // Skip private/local IPs
    if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.') || ip === '::1') {
      return null;
    }
    
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Map Polish regions from IP data
    const regionName = data.region?.toLowerCase() || '';
    
    // Try to match to voivodeship
    for (const [key, value] of Object.entries(voivodeshipNormalize)) {
      if (regionName.includes(key.replace('skie', '').replace('ie', ''))) {
        return value;
      }
    }
    
    return null;
  } catch (e) {
    console.error('IP geolocation error:', e);
    return null;
  }
}

// Fetch sources from database
async function fetchSourcesFromDB(
  supabaseUrl: string, 
  supabaseKey: string, 
  voivodeship: string,
  userId?: string
): Promise<Array<{ url: string; source: string }>> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Base query for all active sources in the voivodeship
    const { data: sources, error } = await supabase
      .from('local_news_sources')
      .select('id, url, source_name')
      .eq('voivodeship', voivodeship)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching sources from DB:', error);
      return [];
    }

    if (!sources || sources.length === 0) {
      console.log(`No sources found in DB for ${voivodeship}`);
      return [];
    }

    // If user is provided, filter by their preferences
    if (userId) {
      const { data: userPrefs } = await supabase
        .from('user_local_sources')
        .select('source_id, is_enabled')
        .eq('user_id', userId);

      if (userPrefs && userPrefs.length > 0) {
        const disabledSourceIds = new Set(
          userPrefs.filter(p => !p.is_enabled).map(p => p.source_id)
        );
        
        return sources
          .filter(s => !disabledSourceIds.has(s.id))
          .map(s => ({ url: s.url, source: s.source_name }));
      }
    }

    return sources.map(s => ({ url: s.url, source: s.source_name }));
  } catch (e) {
    console.error('Error in fetchSourcesFromDB:', e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { voivodeship, clientIP, userId } = await req.json().catch(() => ({}));
    
    let targetVoivodeship = voivodeship;
    
    // Normalize voivodeship
    if (targetVoivodeship) {
      targetVoivodeship = voivodeshipNormalize[targetVoivodeship.toLowerCase()] || targetVoivodeship.toLowerCase();
    }
    
    // Try to get location from IP if no voivodeship provided
    if (!targetVoivodeship && clientIP) {
      const ipLocation = await getLocationFromIP(clientIP);
      if (ipLocation) {
        targetVoivodeship = ipLocation;
        console.log(`Detected voivodeship from IP: ${targetVoivodeship}`);
      }
    }
    
    // If still no location, return empty
    if (!targetVoivodeship) {
      return new Response(JSON.stringify({ 
        articles: [], 
        voivodeship: null,
        message: 'No location provided or detected' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    // Fetch sources from database
    let sources = await fetchSourcesFromDB(supabaseUrl, supabaseKey, targetVoivodeship, userId);
    
    // Log the result
    console.log(`Found ${sources.length} sources in DB for ${targetVoivodeship}`);
    
    if (sources.length === 0) {
      return new Response(JSON.stringify({ 
        articles: [], 
        voivodeship: targetVoivodeship,
        message: `No sources available for ${targetVoivodeship}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Fetching local news for: ${targetVoivodeship} from ${sources.length} sources`);
    
    const fetchPromises = sources.map(({ url, source }) =>
      fetchRSSFeed(url, source, targetVoivodeship)
    );

    const results = await Promise.allSettled(fetchPromises);
    
    let allArticles: LocalArticle[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles = [...allArticles, ...result.value];
      } else {
        console.error(`Failed to fetch from ${sources[index].source}:`, result.reason);
      }
    });

    // Sort by publication date (newest first)
    allArticles.sort((a, b) => b.pubDateMs - a.pubDateMs);

    console.log(`Total local articles fetched for ${targetVoivodeship}: ${allArticles.length}`);

    return new Response(JSON.stringify({ 
      articles: allArticles, 
      voivodeship: targetVoivodeship,
      count: allArticles.length,
      sourcesCount: sources.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in fetch-local-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, articles: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
