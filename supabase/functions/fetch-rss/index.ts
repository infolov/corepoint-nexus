import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Polish RSS news sources
const RSS_SOURCES = [
  // ===== WIADOMOŚCI =====
  { url: 'https://www.polsatnews.pl/rss/wszystkie.xml', source: 'Polsat News', category: 'Wiadomości' },
  { url: 'https://tvn24.pl/najnowsze.xml', source: 'TVN24', category: 'Wiadomości' },
  { url: 'https://wiadomosci.wp.pl/rss.xml', source: 'Wirtualna Polska', category: 'Wiadomości' },
  { url: 'https://www.rp.pl/rss/1019-kraj.xml', source: 'Rzeczpospolita', category: 'Wiadomości' },
  { url: 'https://www.gazetaprawna.pl/rss.xml', source: 'Gazeta Prawna', category: 'Wiadomości' },
  { url: 'https://www.rmf24.pl/fakty/feed', source: 'RMF24', category: 'Wiadomości' },
  { url: 'https://www.se.pl/rss/', source: 'Super Express', category: 'Wiadomości' },
  { url: 'https://www.fakt.pl/rss.xml', source: 'Fakt', category: 'Wiadomości' },
  { url: 'https://natemat.pl/rss/wszystko', source: 'NaTemat', category: 'Wiadomości' },
  { url: 'https://wydarzenia.interia.pl/rss', source: 'Interia', category: 'Wiadomości' },
  { url: 'https://wiadomosci.gazeta.pl/pub/rss/wiadomosci.xml', source: 'Gazeta.pl', category: 'Wiadomości' },
  { url: 'https://www.o2.pl/rss/wiadomosci.xml', source: 'O2.pl', category: 'Wiadomości' },
  
  // ===== BIZNES =====
  { url: 'https://www.bankier.pl/rss/wiadomosci.xml', source: 'Bankier.pl', category: 'Biznes' },
  { url: 'https://www.money.pl/rss/rss.xml', source: 'Money.pl', category: 'Biznes' },
  { url: 'https://www.rp.pl/rss/1006-ekonomia.xml', source: 'Rzeczpospolita Ekonomia', category: 'Biznes' },
  { url: 'https://www.pb.pl/rss/wszystko.xml', source: 'Puls Biznesu', category: 'Biznes' },
  { url: 'https://biznes.interia.pl/rss', source: 'Interia Biznes', category: 'Biznes' },
  { url: 'https://forsal.pl/rss.xml', source: 'Forsal', category: 'Biznes' },
  { url: 'https://finanse.wp.pl/rss.xml', source: 'WP Finanse', category: 'Biznes' },
  { url: 'https://www.gazetaprawna.pl/rss/biznes.xml', source: 'Gazeta Prawna Biznes', category: 'Biznes' },
  { url: 'https://businessinsider.com.pl/rss', source: 'Business Insider PL', category: 'Biznes' },
  { url: 'https://www.forbes.pl/rss', source: 'Forbes PL', category: 'Biznes' },
  
  // ===== SPORT =====
  { url: 'https://sportowefakty.wp.pl/rss.xml', source: 'Sportowe Fakty', category: 'Sport' },
  { url: 'https://sport.tvp.pl/rss/sport.xml', source: 'TVP Sport', category: 'Sport' },
  { url: 'https://www.sport.pl/rss.xml', source: 'Sport.pl', category: 'Sport' },
  { url: 'https://sport.interia.pl/rss', source: 'Interia Sport', category: 'Sport' },
  { url: 'https://www.meczyki.pl/rss.xml', source: 'Meczyki.pl', category: 'Sport' },
  { url: 'https://www.goal.pl/feeds/rss', source: 'Goal.pl', category: 'Sport' },
  { url: 'https://www.przegladysportowy.pl/rss.xml', source: 'Przegląd Sportowy', category: 'Sport' },
  { url: 'https://sport.onet.pl/rss.xml', source: 'Onet Sport', category: 'Sport' },
  { url: 'https://www.weszlo.com/feed/', source: 'Weszło', category: 'Sport' },
  { url: 'https://pilkanozna.pl/feed/', source: 'PilkaNozna.pl', category: 'Sport' },
  
  // ===== TECHNOLOGIA =====
  { url: 'https://www.chip.pl/feed', source: 'Chip.pl', category: 'Technologia' },
  { url: 'https://tech.wp.pl/rss.xml', source: 'WP Tech', category: 'Technologia' },
  { url: 'https://www.dobreprogramy.pl/rss.xml', source: 'Dobreprogramy', category: 'Technologia' },
  { url: 'https://www.benchmark.pl/rss/aktualnosci.xml', source: 'Benchmark', category: 'Technologia' },
  { url: 'https://www.komputerswiat.pl/rss.xml', source: 'Komputer Świat', category: 'Technologia' },
  { url: 'https://www.spidersweb.pl/feed', source: 'Spider\'s Web', category: 'Technologia' },
  { url: 'https://antyweb.pl/feed/', source: 'Antyweb', category: 'Technologia' },
  { url: 'https://www.tabletowo.pl/feed/', source: 'Tabletowo', category: 'Technologia' },
  { url: 'https://android.com.pl/feed/', source: 'Android.com.pl', category: 'Technologia' },
  { url: 'https://ithardware.pl/rss.xml', source: 'ITHardware', category: 'Technologia' },
  
  // ===== ROZRYWKA =====
  { url: 'https://plejada.pl/rss.xml', source: 'Plejada', category: 'Rozrywka' },
  { url: 'https://rozrywka.wp.pl/rss.xml', source: 'WP Rozrywka', category: 'Rozrywka' },
  { url: 'https://www.pudelek.pl/rss.xml', source: 'Pudelek', category: 'Rozrywka' },
  
  // ===== ZDROWIE =====
  { url: 'https://zdrowie.wp.pl/rss.xml', source: 'WP Zdrowie', category: 'Zdrowie' },
  { url: 'https://www.medonet.pl/rss.xml', source: 'Medonet', category: 'Zdrowie' },
  { url: 'https://kobieta.wp.pl/rss.xml', source: 'WP Kobieta', category: 'Lifestyle' },
  
  // ===== KULTURA =====
  { url: 'https://kultura.wp.pl/rss.xml', source: 'WP Kultura', category: 'Kultura' },
  { url: 'https://www.culture.pl/pl/rss', source: 'Culture.pl', category: 'Kultura' },
];

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
    hash = hash & hash; // Convert to 32bit integer
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
    
    // Fallback images by category
    const fallbackImages: Record<string, string> = {
      'Wiadomości': 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop',
      'Biznes': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop',
      'Sport': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop',
      'Technologia': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop',
      'Lifestyle': 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=500&fit=crop',
      'Rozrywka': 'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=800&h=500&fit=crop',
      'Zdrowie': 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&h=500&fit=crop',
      'Kultura': 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=500&fit=crop',
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

    // Generate stable unique ID using hash of the link
    const id = simpleHash(link) + simpleHash(title.substring(0, 20));

    // Parse publication date
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

          if (diffMins < 60) {
            timestamp = `${diffMins} min temu`;
          } else if (diffHours < 24) {
            timestamp = `${diffHours} godz. temu`;
          } else if (diffDays < 7) {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting RSS fetch...');
    
    // Fetch from all sources in parallel
    const fetchPromises = RSS_SOURCES.map(({ url, source, category }) =>
      fetchRSSFeed(url, source, category)
    );

    const results = await Promise.allSettled(fetchPromises);
    
    let allArticles: Article[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles = [...allArticles, ...result.value];
      } else {
        console.error(`Failed to fetch from ${RSS_SOURCES[index].source}:`, result.reason);
      }
    });

    // Sort by publication date (newest first) - deterministic ordering
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
