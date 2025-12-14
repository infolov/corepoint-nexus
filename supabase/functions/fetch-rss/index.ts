import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Polish RSS news sources
const RSS_SOURCES = [
  { url: 'https://www.polsatnews.pl/rss/wszystkie.xml', source: 'Polsat News', category: 'Wiadomości' },
  { url: 'https://tvn24.pl/najnowsze.xml', source: 'TVN24', category: 'Wiadomości' },
  { url: 'https://www.rp.pl/rss/1061-swiat', source: 'Rzeczpospolita', category: 'Wiadomości' },
  { url: 'https://wiadomosci.onet.pl/rss/kraj', source: 'Onet', category: 'Wiadomości' },
  { url: 'https://wiadomosci.wp.pl/rss.xml', source: 'Wirtualna Polska', category: 'Wiadomości' },
  { url: 'https://fakty.interia.pl/rss', source: 'Interia', category: 'Wiadomości' },
  { url: 'https://sport.onet.pl/rss/pilka-nozna', source: 'Onet Sport', category: 'Sport' },
  { url: 'https://sport.interia.pl/rss', source: 'Interia Sport', category: 'Sport' },
  { url: 'https://www.bankier.pl/rss/wiadomosci.xml', source: 'Bankier.pl', category: 'Biznes' },
  { url: 'https://www.money.pl/rss/rss.xml', source: 'Money.pl', category: 'Biznes' },
  { url: 'https://biznes.interia.pl/rss', source: 'Interia Biznes', category: 'Biznes' },
  { url: 'https://sportowefakty.wp.pl/rss.xml', source: 'Sportowe Fakty', category: 'Sport' },
  { url: 'https://www.chip.pl/feed', source: 'Chip.pl', category: 'Technologia' },
  { url: 'https://www.dobreprogramy.pl/feed', source: 'Dobreprogramy', category: 'Technologia' },
  { url: 'https://tech.wp.pl/rss.xml', source: 'WP Tech', category: 'Technologia' },
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
    };
    
    if (!image) {
      image = fallbackImages[category] || fallbackImages['Wiadomości'];
    }

    const title = titleMatch?.[1]?.trim() || '';
    const link = linkMatch?.[1]?.trim() || '';
    const description = descMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
    const content = contentMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || description;
    const pubDate = pubDateMatch?.[1] || new Date().toISOString();

    if (!title || !link) return null;

    // Generate unique ID from link - use full base64 encoding for uniqueness
    const id = btoa(encodeURIComponent(link)).replace(/[^a-zA-Z0-9]/g, '');

    // Format timestamp
    let timestamp = 'Przed chwilą';
    try {
      const date = new Date(pubDate);
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

    // Sort by most recent (based on timestamp parsing would be better, but for now shuffle)
    allArticles = allArticles.sort(() => Math.random() - 0.5);

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
