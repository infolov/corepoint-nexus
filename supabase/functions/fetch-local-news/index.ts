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

// Map of naszemiasto.pl city subdomains to proper Polish names
const naszeMiastoCityNameMap: Record<string, string> = {
  'warszawa': 'Warszawa', 'krakow': 'Kraków', 'wroclaw': 'Wrocław',
  'gdansk': 'Gdańsk', 'poznan': 'Poznań', 'lodz': 'Łódź',
  'katowice': 'Katowice', 'szczecin': 'Szczecin', 'lublin': 'Lublin',
  'bialystok': 'Białystok', 'olsztyn': 'Olsztyn', 'opole': 'Opole',
  'rzeszow': 'Rzeszów', 'kielce': 'Kielce', 'zielonagora': 'Zielona Góra',
  'gorzowwielkopolski': 'Gorzów Wlkp.', 'bydgoszcz': 'Bydgoszcz',
  'torun': 'Toruń', 'radom': 'Radom', 'czestochowa': 'Częstochowa',
};

function getNaszeMiastoCity(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    const nmMatch = hostname.match(/^([a-z]+)\.naszemiasto\.pl$/i);
    if (nmMatch) return nmMatch[1].toLowerCase();
  } catch { /* ignore */ }
  return null;
}

function deriveSourceFromUrl(url: string, fallbackSource: string): string {
  const city = getNaszeMiastoCity(url);
  if (city) {
    const cityName = naszeMiastoCityNameMap[city] || city.charAt(0).toUpperCase() + city.slice(1);
    return `Nasze Miasto ${cityName}`;
  }
  return fallbackSource;
}

/**
 * Checks if a naszemiasto.pl article belongs to the given voivodeship.
 * Returns true if article should be KEPT (non-naszemiasto articles always pass).
 */
function isArticleInVoivodeship(articleUrl: string, voivodeship: string): boolean {
  const city = getNaszeMiastoCity(articleUrl);
  if (!city) return true; // not naszemiasto.pl — keep

  // Look up the city in cityToVoivodeship map
  const articleVoivodeship = cityToVoivodeship[city];
  
  // If unknown city, keep it (benefit of the doubt — it came from a regional feed)
  if (!articleVoivodeship) return true;

  // Normalize the requested voivodeship for comparison
  const normalizedRequested = voivodeshipNormalize[voivodeship] || voivodeship;
  
  // Only reject if we KNOW it's from a different voivodeship
  if (articleVoivodeship !== normalizedRequested) {
    console.log(`Rejecting naszemiasto article from ${city} (${articleVoivodeship}) — expected ${normalizedRequested}`);
    return false;
  }
  return true;
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

    // Derive actual source name from the article's URL instead of using the feed name
    const actualSource = deriveSourceFromUrl(link, source);

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
      source: actualSource,
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
    let filtered = 0;
    for (const item of items.slice(0, 50)) {
      const article = parseRSSItem(item, source, voivodeship);
      if (article) {
        // Filter out naszemiasto.pl articles from cities outside the requested voivodeship
        if (!isArticleInVoivodeship(article.sourceUrl, voivodeship)) {
          filtered++;
          continue;
        }
        articles.push(article);
      }
    }

    if (filtered > 0) {
      console.log(`Filtered out ${filtered} out-of-region articles from ${source}`);
    }
    console.log(`Fetched ${articles.length} local articles from ${source}`);
    return articles;
  } catch (error) {
    console.error(`Error fetching ${feedUrl}:`, error);
    return [];
  }
}

// Map English region names to Polish voivodeships (from IP geolocation services)
// Includes variations from ip-api.com, ipapi.co, and other services
const regionToVoivodeship: Record<string, string> = {
  // Mazowieckie
  'masovia': 'mazowieckie',
  'masovian': 'mazowieckie',
  'mazovia': 'mazowieckie',
  'mazowieckie': 'mazowieckie',
  'masovian voivodeship': 'mazowieckie',
  'mazowieckie voivodeship': 'mazowieckie',
  'województwo mazowieckie': 'mazowieckie',
  '14': 'mazowieckie', // region code
  
  // Małopolskie
  'lesser poland': 'malopolskie',
  'małopolskie': 'malopolskie',
  'malopolskie': 'malopolskie',
  'lesser poland voivodeship': 'malopolskie',
  'małopolskie voivodeship': 'malopolskie',
  'województwo małopolskie': 'malopolskie',
  '12': 'malopolskie',
  
  // Pomorskie
  'pomerania': 'pomorskie',
  'pomeranian': 'pomorskie',
  'pomorskie': 'pomorskie',
  'pomeranian voivodeship': 'pomorskie',
  'pomorskie voivodeship': 'pomorskie',
  'województwo pomorskie': 'pomorskie',
  '22': 'pomorskie',
  
  // Śląskie
  'silesia': 'slaskie',
  'silesian': 'slaskie',
  'śląskie': 'slaskie',
  'slaskie': 'slaskie',
  'silesian voivodeship': 'slaskie',
  'śląskie voivodeship': 'slaskie',
  'województwo śląskie': 'slaskie',
  '24': 'slaskie',
  
  // Wielkopolskie
  'greater poland': 'wielkopolskie',
  'wielkopolskie': 'wielkopolskie',
  'greater poland voivodeship': 'wielkopolskie',
  'wielkopolskie voivodeship': 'wielkopolskie',
  'województwo wielkopolskie': 'wielkopolskie',
  '30': 'wielkopolskie',
  
  // Dolnośląskie
  'lower silesia': 'dolnoslaskie',
  'lower silesian': 'dolnoslaskie',
  'dolnośląskie': 'dolnoslaskie',
  'dolnoslaskie': 'dolnoslaskie',
  'lower silesian voivodeship': 'dolnoslaskie',
  'dolnośląskie voivodeship': 'dolnoslaskie',
  'województwo dolnośląskie': 'dolnoslaskie',
  '02': 'dolnoslaskie',
  
  // Łódzkie
  'łódzkie': 'lodzkie',
  'lodzkie': 'lodzkie',
  'lodz': 'lodzkie',
  'łódź voivodeship': 'lodzkie',
  'łódzkie voivodeship': 'lodzkie',
  'województwo łódzkie': 'lodzkie',
  '10': 'lodzkie',
  
  // Zachodniopomorskie
  'west pomerania': 'zachodniopomorskie',
  'west pomeranian': 'zachodniopomorskie',
  'zachodniopomorskie': 'zachodniopomorskie',
  'west pomeranian voivodeship': 'zachodniopomorskie',
  'zachodniopomorskie voivodeship': 'zachodniopomorskie',
  'województwo zachodniopomorskie': 'zachodniopomorskie',
  '32': 'zachodniopomorskie',
  
  // Kujawsko-pomorskie
  'kuyavia-pomerania': 'kujawsko-pomorskie',
  'kuyavian-pomeranian': 'kujawsko-pomorskie',
  'kujawsko-pomorskie': 'kujawsko-pomorskie',
  'kuyavian-pomeranian voivodeship': 'kujawsko-pomorskie',
  'kujawsko-pomorskie voivodeship': 'kujawsko-pomorskie',
  'województwo kujawsko-pomorskie': 'kujawsko-pomorskie',
  '04': 'kujawsko-pomorskie',
  
  // Lubelskie
  'lublin': 'lubelskie',
  'lubelskie': 'lubelskie',
  'lublin voivodeship': 'lubelskie',
  'lubelskie voivodeship': 'lubelskie',
  'województwo lubelskie': 'lubelskie',
  '06': 'lubelskie',
  
  // Podkarpackie
  'subcarpathia': 'podkarpackie',
  'subcarpathian': 'podkarpackie',
  'podkarpackie': 'podkarpackie',
  'subcarpathian voivodeship': 'podkarpackie',
  'podkarpackie voivodeship': 'podkarpackie',
  'województwo podkarpackie': 'podkarpackie',
  '18': 'podkarpackie',
  
  // Podlaskie
  'podlaskie': 'podlaskie',
  'podlasie': 'podlaskie',
  'podlaskie voivodeship': 'podlaskie',
  'województwo podlaskie': 'podlaskie',
  '20': 'podlaskie',
  
  // Warmińsko-mazurskie
  'warmia-masuria': 'warminsko-mazurskie',
  'warmian-masurian': 'warminsko-mazurskie',
  'warmińsko-mazurskie': 'warminsko-mazurskie',
  'warminsko-mazurskie': 'warminsko-mazurskie',
  'warmian-masurian voivodeship': 'warminsko-mazurskie',
  'warmińsko-mazurskie voivodeship': 'warminsko-mazurskie',
  'województwo warmińsko-mazurskie': 'warminsko-mazurskie',
  '28': 'warminsko-mazurskie',
  
  // Lubuskie
  'lubusz': 'lubuskie',
  'lubuskie': 'lubuskie',
  'lubusz voivodeship': 'lubuskie',
  'lubuskie voivodeship': 'lubuskie',
  'województwo lubuskie': 'lubuskie',
  '08': 'lubuskie',
  
  // Świętokrzyskie
  'holy cross': 'swietokrzyskie',
  'świętokrzyskie': 'swietokrzyskie',
  'swietokrzyskie': 'swietokrzyskie',
  'holy cross voivodeship': 'swietokrzyskie',
  'świętokrzyskie voivodeship': 'swietokrzyskie',
  'województwo świętokrzyskie': 'swietokrzyskie',
  '26': 'swietokrzyskie',
  
  // Opolskie
  'opole': 'opolskie',
  'opolskie': 'opolskie',
  'opole voivodeship': 'opolskie',
  'opolskie voivodeship': 'opolskie',
  'województwo opolskie': 'opolskie',
  '16': 'opolskie',
};

// City to voivodeship mapping for major Polish cities
const cityToVoivodeship: Record<string, string> = {
  // Mazowieckie
  'warsaw': 'mazowieckie', 'warszawa': 'mazowieckie', 'radom': 'mazowieckie', 
  'płock': 'mazowieckie', 'plock': 'mazowieckie', 'siedlce': 'mazowieckie',
  'pruszków': 'mazowieckie', 'pruszkow': 'mazowieckie', 'legionowo': 'mazowieckie',
  'ostrołęka': 'mazowieckie', 'ostroleka': 'mazowieckie',
  
  // Małopolskie
  'krakow': 'malopolskie', 'kraków': 'malopolskie', 'cracow': 'malopolskie',
  'tarnów': 'malopolskie', 'tarnow': 'malopolskie', 'nowy sącz': 'malopolskie',
  'nowy sacz': 'malopolskie', 'nowysacz': 'malopolskie', 'oświęcim': 'malopolskie', 'oswiecim': 'malopolskie',
  
  // Pomorskie
  'gdansk': 'pomorskie', 'gdańsk': 'pomorskie', 'gdynia': 'pomorskie', 
  'sopot': 'pomorskie', 'słupsk': 'pomorskie', 'slupsk': 'pomorskie',
  'tczew': 'pomorskie', 'wejherowo': 'pomorskie',
  
  // Śląskie
  'katowice': 'slaskie', 'gliwice': 'slaskie', 'sosnowiec': 'slaskie',
  'zabrze': 'slaskie', 'bytom': 'slaskie', 'ruda śląska': 'slaskie',
  'ruda slaska': 'slaskie', 'rudaslaska': 'slaskie', 'tychy': 'slaskie',
  'dąbrowa górnicza': 'slaskie', 'dabrowa gornicza': 'slaskie', 'dabrowagórnicza': 'slaskie',
  'dabrowagornicza': 'slaskie', 'chorzów': 'slaskie', 'chorzow': 'slaskie',
  'bielsko-biała': 'slaskie', 'bielsko-biala': 'slaskie', 'bielskobiala': 'slaskie',
  'częstochowa': 'slaskie', 'czestochowa': 'slaskie',
  
  // Wielkopolskie
  'poznan': 'wielkopolskie', 'poznań': 'wielkopolskie', 'kalisz': 'wielkopolskie',
  'konin': 'wielkopolskie', 'piła': 'wielkopolskie', 'pila': 'wielkopolskie',
  'leszno': 'wielkopolskie', 'gniezno': 'wielkopolskie',
  
  // Dolnośląskie
  'wroclaw': 'dolnoslaskie', 'wrocław': 'dolnoslaskie', 'legnica': 'dolnoslaskie',
  'wałbrzych': 'dolnoslaskie', 'walbrzych': 'dolnoslaskie', 'jelenia góra': 'dolnoslaskie',
  'jelenia gora': 'dolnoslaskie', 'jeleniagora': 'dolnoslaskie',
  
  // Łódzkie
  'lodz': 'lodzkie', 'łódź': 'lodzkie', 'piotrków trybunalski': 'lodzkie',
  'piotrkow trybunalski': 'lodzkie', 'piotrkowtrybunalski': 'lodzkie',
  'pabianice': 'lodzkie', 'tomaszów mazowiecki': 'lodzkie',
  'tomaszow mazowiecki': 'lodzkie', 'tomaszowmazowiecki': 'lodzkie', 'zgierz': 'lodzkie',
  
  // Zachodniopomorskie
  'szczecin': 'zachodniopomorskie', 'koszalin': 'zachodniopomorskie',
  'stargard': 'zachodniopomorskie', 'świnoujście': 'zachodniopomorskie',
  'swinoujscie': 'zachodniopomorskie',
  
  // Kujawsko-pomorskie
  'bydgoszcz': 'kujawsko-pomorskie', 'torun': 'kujawsko-pomorskie', 'toruń': 'kujawsko-pomorskie',
  'włocławek': 'kujawsko-pomorskie', 'wloclawek': 'kujawsko-pomorskie',
  'grudziądz': 'kujawsko-pomorskie', 'grudziadz': 'kujawsko-pomorskie',
  'inowrocław': 'kujawsko-pomorskie', 'inowroclaw': 'kujawsko-pomorskie',
  
  // Lubelskie
  'lublin': 'lubelskie', 'zamość': 'lubelskie', 'zamosc': 'lubelskie',
  'chełm': 'lubelskie', 'chelm': 'lubelskie', 'biała podlaska': 'lubelskie',
  'biala podlaska': 'lubelskie', 'bialapodlaska': 'lubelskie',
  'puławy': 'lubelskie', 'pulawy': 'lubelskie',
  
  // Podkarpackie
  'rzeszow': 'podkarpackie', 'rzeszów': 'podkarpackie', 'przemyśl': 'podkarpackie',
  'przemysl': 'podkarpackie', 'stalowa wola': 'podkarpackie', 'stalowawola': 'podkarpackie',
  'mielec': 'podkarpackie', 'tarnobrzeg': 'podkarpackie', 'krosno': 'podkarpackie',
  
  // Podlaskie
  'bialystok': 'podlaskie', 'białystok': 'podlaskie', 'suwałki': 'podlaskie',
  'suwalki': 'podlaskie', 'łomża': 'podlaskie', 'lomza': 'podlaskie',
  
  // Warmińsko-mazurskie
  'olsztyn': 'warminsko-mazurskie', 'elbląg': 'warminsko-mazurskie', 'elblag': 'warminsko-mazurskie',
  'ełk': 'warminsko-mazurskie', 'elk': 'warminsko-mazurskie', 'ostróda': 'warminsko-mazurskie',
  'ostroda': 'warminsko-mazurskie', 'pasłęk': 'warminsko-mazurskie', 'paslek': 'warminsko-mazurskie',
  'iława': 'warminsko-mazurskie', 'ilawa': 'warminsko-mazurskie', 'giżycko': 'warminsko-mazurskie',
  'gizycko': 'warminsko-mazurskie', 'mrągowo': 'warminsko-mazurskie', 'mragowo': 'warminsko-mazurskie',
  'kętrzyn': 'warminsko-mazurskie', 'ketrzyn': 'warminsko-mazurskie', 'bartoszyce': 'warminsko-mazurskie',
  'braniewo': 'warminsko-mazurskie', 'szczytno': 'warminsko-mazurskie', 'pisz': 'warminsko-mazurskie',
  'nidzica': 'warminsko-mazurskie', 'działdowo': 'warminsko-mazurskie', 'dzialdowo': 'warminsko-mazurskie',
  'lidzbark': 'warminsko-mazurskie', 'morąg': 'warminsko-mazurskie', 'morag': 'warminsko-mazurskie',
  'tolkmicko': 'warminsko-mazurskie', 'młynary': 'warminsko-mazurskie', 'mlynary': 'warminsko-mazurskie',
  
  // Lubuskie
  'zielona gora': 'lubuskie', 'zielona góra': 'lubuskie', 'zielonagora': 'lubuskie',
  'gorzow': 'lubuskie', 'gorzów wielkopolski': 'lubuskie', 'gorzow wielkopolski': 'lubuskie',
  'gorzowwielkopolski': 'lubuskie',
  'nowa sól': 'lubuskie', 'nowa sol': 'lubuskie',
  
  // Świętokrzyskie
  'kielce': 'swietokrzyskie', 'ostrowiec świętokrzyski': 'swietokrzyskie',
  'ostrowiec swietokrzyski': 'swietokrzyskie', 'starachowice': 'swietokrzyskie',
  'skarżysko-kamienna': 'swietokrzyskie', 'skarzysko-kamienna': 'swietokrzyskie',
  
  // Opolskie
  'opole': 'opolskie', 'nysa': 'opolskie', 'kędzierzyn-koźle': 'opolskie',
  'kedzierzyn-kozle': 'opolskie', 'brzeg': 'opolskie',
};

// IP to location using multiple fallback services
async function getLocationFromIP(ip: string): Promise<string | null> {
  try {
    // Skip private/local IPs
    if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.') || 
        ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') ||
        ip.startsWith('172.19.') || ip.startsWith('172.2') || ip.startsWith('172.30.') ||
        ip.startsWith('172.31.') || ip === '::1' || ip === 'localhost') {
      console.log(`Skipping private/local IP: ${ip}`);
      return null;
    }
    
    // Try ip-api.com first (45 req/min, returns full region names)
    console.log(`Attempting geolocation for IP: ${ip}`);
    
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city`);
      if (response.ok) {
        const data = await response.json();
        console.log(`ip-api.com response for ${ip}:`, JSON.stringify(data));
        
        if (data.status === 'success' && data.country === 'Poland') {
          const regionName = data.regionName?.toLowerCase().trim() || '';
          const city = data.city?.toLowerCase().trim() || '';
          
          // Try region name mapping
          if (regionToVoivodeship[regionName]) {
            console.log(`ip-api.com: Matched region "${regionName}" to ${regionToVoivodeship[regionName]}`);
            return regionToVoivodeship[regionName];
          }
          
          // Try partial region matching
          for (const [key, value] of Object.entries(regionToVoivodeship)) {
            if (regionName.includes(key) || key.includes(regionName)) {
              console.log(`ip-api.com: Partial match "${regionName}" to ${value} via "${key}"`);
              return value;
            }
          }
          
          // Try city fallback
          if (cityToVoivodeship[city]) {
            console.log(`ip-api.com: Matched city "${city}" to ${cityToVoivodeship[city]}`);
            return cityToVoivodeship[city];
          }
          
          console.log(`ip-api.com: Could not match region="${regionName}", city="${city}"`);
        }
      }
    } catch (e) {
      console.warn('ip-api.com failed, trying fallback:', e);
    }
    
    // Fallback to ipwho.is (free, no rate limit advertised)
    try {
      const response = await fetch(`https://ipwho.is/${ip}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`ipwho.is response for ${ip}:`, JSON.stringify(data));
        
        if (data.success && data.country === 'Poland') {
          const regionName = data.region?.toLowerCase().trim() || '';
          const city = data.city?.toLowerCase().trim() || '';
          
          if (regionToVoivodeship[regionName]) {
            console.log(`ipwho.is: Matched region "${regionName}" to ${regionToVoivodeship[regionName]}`);
            return regionToVoivodeship[regionName];
          }
          
          for (const [key, value] of Object.entries(regionToVoivodeship)) {
            if (regionName.includes(key) || key.includes(regionName)) {
              console.log(`ipwho.is: Partial match "${regionName}" to ${value} via "${key}"`);
              return value;
            }
          }
          
          if (cityToVoivodeship[city]) {
            console.log(`ipwho.is: Matched city "${city}" to ${cityToVoivodeship[city]}`);
            return cityToVoivodeship[city];
          }
        }
      }
    } catch (e) {
      console.warn('ipwho.is failed:', e);
    }
    
    // Final fallback to ipapi.co (limited to 1000/day)
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      if (response.ok) {
        const data = await response.json();
        console.log(`ipapi.co response for ${ip}:`, JSON.stringify(data));
        
        if (data.country_name === 'Poland' || data.country === 'PL') {
          const regionName = data.region?.toLowerCase().trim() || '';
          const city = data.city?.toLowerCase().trim() || '';
          
          if (regionToVoivodeship[regionName]) {
            console.log(`ipapi.co: Matched region "${regionName}" to ${regionToVoivodeship[regionName]}`);
            return regionToVoivodeship[regionName];
          }
          
          for (const [key, value] of Object.entries(regionToVoivodeship)) {
            if (regionName.includes(key) || key.includes(regionName)) {
              console.log(`ipapi.co: Partial match "${regionName}" to ${value} via "${key}"`);
              return value;
            }
          }
          
          if (cityToVoivodeship[city]) {
            console.log(`ipapi.co: Matched city "${city}" to ${cityToVoivodeship[city]}`);
            return cityToVoivodeship[city];
          }
        }
      }
    } catch (e) {
      console.warn('ipapi.co failed:', e);
    }
    
    console.log(`All geolocation services failed for IP: ${ip}`);
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
