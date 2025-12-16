import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedArticle {
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

// News sources to scrape (sites without working RSS)
const SCRAPE_SOURCES = [
  // ===== ROZRYWKA =====
  { 
    url: 'https://www.pudelek.pl/', 
    source: 'Pudelek', 
    category: 'Rozrywka',
    selectors: {
      articles: '.news-item, .article-item, [data-type="article"]',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, .excerpt, p'
    }
  },
  { 
    url: 'https://www.fakt.pl/rozrywka', 
    source: 'Fakt', 
    category: 'Rozrywka',
    selectors: {
      articles: '.article-item, .news-box, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://www.se.pl/rozrywka/', 
    source: 'Super Express', 
    category: 'Rozrywka',
    selectors: {
      articles: '.article-item, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://www.pomponik.pl/', 
    source: 'Pomponik', 
    category: 'Rozrywka',
    selectors: {
      articles: '.article-tile, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://www.kozaczek.pl/', 
    source: 'Kozaczek', 
    category: 'Rozrywka',
    selectors: {
      articles: '.article-item, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://plotek.pl/', 
    source: 'Plotek', 
    category: 'Rozrywka',
    selectors: {
      articles: '.article-tile, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  // ===== ZDROWIE =====
  { 
    url: 'https://www.medonet.pl/', 
    source: 'Medonet', 
    category: 'Zdrowie',
    selectors: {
      articles: '.article-tile, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, .description, p'
    }
  },
  { 
    url: 'https://zdrowie.radiozet.pl/', 
    source: 'Radio ZET Zdrowie', 
    category: 'Zdrowie',
    selectors: {
      articles: '.article-tile, .news-item, article',
      title: 'h2, h3',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://www.poradnikzdrowie.pl/', 
    source: 'Poradnik Zdrowie', 
    category: 'Zdrowie',
    selectors: {
      articles: '.article-tile, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://www.mp.pl/pacjent/', 
    source: 'Medycyna Praktyczna', 
    category: 'Zdrowie',
    selectors: {
      articles: '.article-item, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://www.abczdrowie.pl/', 
    source: 'ABC Zdrowie', 
    category: 'Zdrowie',
    selectors: {
      articles: '.article-tile, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://polki.pl/zdrowie/', 
    source: 'Polki.pl Zdrowie', 
    category: 'Zdrowie',
    selectors: {
      articles: '.article-tile, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  // ===== KULTURA =====
  { 
    url: 'https://kultura.onet.pl/', 
    source: 'Onet Kultura', 
    category: 'Kultura',
    selectors: {
      articles: '.itemBox, .news-item, article',
      title: 'h2, h3, .title, .itemTitle',
      link: 'a',
      image: 'img',
      excerpt: '.itemLead, .lead, p'
    }
  },
  { 
    url: 'https://www.filmweb.pl/news', 
    source: 'Filmweb', 
    category: 'Kultura',
    selectors: {
      articles: '.newsItem, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://www.e-teatr.pl/', 
    source: 'E-Teatr', 
    category: 'Kultura',
    selectors: {
      articles: '.article-item, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://www.rp.pl/kultura', 
    source: 'Rzeczpospolita Kultura', 
    category: 'Kultura',
    selectors: {
      articles: '.article-tile, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://natemat.pl/kultura', 
    source: 'NaTemat Kultura', 
    category: 'Kultura',
    selectors: {
      articles: '.article-tile, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
  { 
    url: 'https://www.dwutygodnik.com/', 
    source: 'Dwutygodnik', 
    category: 'Kultura',
    selectors: {
      articles: '.article-item, .news-item, article',
      title: 'h2, h3, .title',
      link: 'a',
      image: 'img',
      excerpt: '.lead, p'
    }
  },
];

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function extractTextContent(html: string, selector: string): string {
  // Simple regex-based extraction for common patterns
  const patterns: Record<string, RegExp[]> = {
    'h2': [/<h2[^>]*>(.*?)<\/h2>/gis],
    'h3': [/<h3[^>]*>(.*?)<\/h3>/gis],
    '.title': [/<[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/[^>]*>/gis],
    '.lead': [/<[^>]*class="[^"]*lead[^"]*"[^>]*>(.*?)<\/[^>]*>/gis],
    'p': [/<p[^>]*>(.*?)<\/p>/gis],
  };

  const selectors = selector.split(',').map(s => s.trim());
  
  for (const sel of selectors) {
    const regexes = patterns[sel];
    if (regexes) {
      for (const regex of regexes) {
        const match = regex.exec(html);
        if (match && match[1]) {
          return match[1].replace(/<[^>]+>/g, '').trim();
        }
      }
    }
  }
  
  return '';
}

function extractLinks(html: string, baseUrl: string): string[] {
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
  const links: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    if (href.startsWith('/')) {
      const url = new URL(baseUrl);
      href = `${url.protocol}//${url.host}${href}`;
    }
    if (href.startsWith('http') && !href.includes('#')) {
      links.push(href);
    }
  }
  
  return [...new Set(links)];
}

function extractImages(html: string): string[] {
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  const images: string[] = [];
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (src.startsWith('http') && (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp'))) {
      images.push(src);
    }
  }
  
  return images;
}

function extractArticlesFromHTML(html: string, source: string, category: string, baseUrl: string): ScrapedArticle[] {
  const articles: ScrapedArticle[] = [];
  
  // Extract article blocks using various patterns
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]*class="[^"]*(?:article|news|item|tile)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<li[^>]*class="[^"]*(?:article|news|item)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
  ];
  
  const seenTitles = new Set<string>();
  
  for (const pattern of articlePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && articles.length < 10) {
      const articleHtml = match[1];
      
      // Extract title
      const titleMatch = articleHtml.match(/<h[23][^>]*>(.*?)<\/h[23]>/is) ||
                         articleHtml.match(/<a[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/a>/is);
      
      if (!titleMatch) continue;
      
      const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
      if (!title || title.length < 10 || seenTitles.has(title)) continue;
      seenTitles.add(title);
      
      // Extract link
      const linkMatch = articleHtml.match(/<a[^>]*href=["']([^"']+)["']/i);
      let link = linkMatch ? linkMatch[1] : '';
      if (link.startsWith('/')) {
        const url = new URL(baseUrl);
        link = `${url.protocol}//${url.host}${link}`;
      }
      
      if (!link.startsWith('http')) continue;
      
      // Extract image
      const imgMatch = articleHtml.match(/<img[^>]*src=["']([^"']+)["']/i) ||
                       articleHtml.match(/data-src=["']([^"']+)["']/i) ||
                       articleHtml.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/i);
      
      let image = imgMatch ? imgMatch[1] : '';
      if (!image || !image.startsWith('http')) {
        // Fallback images
        const fallbacks: Record<string, string> = {
          'Rozrywka': 'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=800&h=500&fit=crop',
          'Zdrowie': 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&h=500&fit=crop',
          'Kultura': 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=500&fit=crop',
        };
        image = fallbacks[category] || fallbacks['Rozrywka'];
      }
      
      // Extract excerpt
      const excerptMatch = articleHtml.match(/<p[^>]*class="[^"]*(?:lead|excerpt|desc)[^"]*"[^>]*>(.*?)<\/p>/is) ||
                          articleHtml.match(/<p[^>]*>(.*?)<\/p>/is);
      const excerpt = excerptMatch ? excerptMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 200) : '';
      
      const id = simpleHash(link) + simpleHash(title.substring(0, 20));
      
      articles.push({
        id,
        title,
        excerpt: excerpt || title.substring(0, 100) + '...',
        category,
        image,
        source,
        sourceUrl: link,
        timestamp: 'Przed chwilą',
        content: excerpt || title,
        pubDateMs: Date.now() - (articles.length * 60000), // Stagger timestamps
      });
    }
  }
  
  return articles;
}

async function scrapeSource(sourceConfig: typeof SCRAPE_SOURCES[0]): Promise<ScrapedArticle[]> {
  try {
    console.log(`Scraping: ${sourceConfig.url}`);
    
    const response = await fetch(sourceConfig.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${sourceConfig.url}: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    const articles = extractArticlesFromHTML(html, sourceConfig.source, sourceConfig.category, sourceConfig.url);
    
    console.log(`Scraped ${articles.length} articles from ${sourceConfig.source}`);
    return articles;
  } catch (error) {
    console.error(`Error scraping ${sourceConfig.url}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting news scraping...');
    
    // Scrape all sources in parallel
    const results = await Promise.allSettled(
      SCRAPE_SOURCES.map(source => scrapeSource(source))
    );
    
    let allArticles: ScrapedArticle[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles = [...allArticles, ...result.value];
      } else {
        console.error(`Failed to scrape ${SCRAPE_SOURCES[index].source}:`, result.reason);
      }
    });
    
    // Sort by timestamp
    allArticles.sort((a, b) => b.pubDateMs - a.pubDateMs);
    
    console.log(`Total scraped articles: ${allArticles.length}`);
    
    return new Response(JSON.stringify({ articles: allArticles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in scrape-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, articles: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
