import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RSS Sources - removed Focus.pl (404 error)
const RSS_SOURCES = [
  { url: 'https://www.polsatnews.pl/rss/wszystkie.xml', source: 'Polsat News', category: 'Wiadomości' },
  { url: 'https://tvn24.pl/najnowsze.xml', source: 'TVN24', category: 'Wiadomości' },
  { url: 'https://wiadomosci.wp.pl/rss.xml', source: 'Wirtualna Polska', category: 'Wiadomości' },
  { url: 'https://www.rmf24.pl/fakty/feed', source: 'RMF24', category: 'Wiadomości' },
  { url: 'https://www.bankier.pl/rss/wiadomosci.xml', source: 'Bankier.pl', category: 'Biznes' },
  { url: 'https://www.money.pl/rss/rss.xml', source: 'Money.pl', category: 'Biznes' },
  { url: 'https://sportowefakty.wp.pl/rss.xml', source: 'Sportowe Fakty', category: 'Sport' },
  { url: 'https://www.chip.pl/feed', source: 'Chip.pl', category: 'Technologia' },
  { url: 'https://tech.wp.pl/rss.xml', source: 'WP Tech', category: 'Technologia' },
];

// Decode HTML entities
function decodeHTMLEntities(text: string): string {
  if (!text) return text;
  
  const entities: Record<string, string> = {
    '&quot;': '"', '&#34;': '"', '&amp;': '&', '&#38;': '&',
    '&lt;': '<', '&#60;': '<', '&gt;': '>', '&#62;': '>',
    '&apos;': "'", '&#39;': "'", '&nbsp;': ' ', '&#160;': ' ',
    '&ndash;': '\u2013', '&#8211;': '\u2013', '&mdash;': '\u2014',
    '&#8212;': '\u2014', '&hellip;': '\u2026', '&#8230;': '\u2026',
    '&oacute;': 'ó', '&Oacute;': 'Ó', '&aogon;': 'ą', '&Aogon;': 'Ą',
    '&eogon;': 'ę', '&Eogon;': 'Ę', '&sacute;': 'ś', '&Sacute;': 'Ś',
    '&cacute;': 'ć', '&Cacute;': 'Ć', '&nacute;': 'ń', '&Nacute;': 'Ń',
    '&zacute;': 'ź', '&Zacute;': 'Ź', '&zdot;': 'ż', '&Zdot;': 'Ż',
    '&lstrok;': 'ł', '&Lstrok;': 'Ł',
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return decoded;
}

// Parse RSS item
interface RSSItem {
  title: string;
  url: string;
  source: string;
  category: string;
  imageUrl: string;
  pubDate: Date | null;
  description?: string;
}

function parseRSSItem(item: string, source: string, category: string): RSSItem | null {
  try {
    const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    const descriptionMatch = item.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
    
    let image = '';
    const enclosureMatch = item.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/);
    const mediaMatch = item.match(/<media:content[^>]*url=["']([^"']+)["']/);
    const mediaThumbMatch = item.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/);
    
    if (enclosureMatch) image = enclosureMatch[1];
    else if (mediaMatch) image = mediaMatch[1];
    else if (mediaThumbMatch) image = mediaThumbMatch[1];
    
    const fallbackImages: Record<string, string> = {
      'Wiadomości': 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop',
      'Biznes': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop',
      'Sport': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop',
      'Technologia': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop',
      'Nauka': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=500&fit=crop',
    };
    
    if (!image) {
      image = fallbackImages[category] || fallbackImages['Wiadomości'];
    }

    const title = decodeHTMLEntities(titleMatch?.[1]?.trim() || '');
    const url = linkMatch?.[1]?.trim() || '';
    const description = decodeHTMLEntities(descriptionMatch?.[1]?.trim() || '');
    
    if (!title || !url) return null;
    
    let pubDate: Date | null = null;
    if (pubDateMatch?.[1]) {
      const date = new Date(pubDateMatch[1]);
      if (!isNaN(date.getTime())) {
        pubDate = date;
      }
    }

    return { title, url, source, category, imageUrl: image, pubDate, description };
  } catch (error) {
    console.error('Error parsing RSS item:', error);
    return null;
  }
}

// Fetch RSS feed
async function fetchRSSFeed(feedUrl: string, source: string, category: string): Promise<RSSItem[]> {
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
    
    const articles: RSSItem[] = [];
    for (const item of items.slice(0, 5)) { // Limit to 5 per source
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

// Scrape result with status
interface ScrapeResult {
  content: string | null;
  creditExhausted: boolean;
}

// Scrape full content using Firecrawl
async function scrapeWithFirecrawl(url: string): Promise<ScrapeResult> {
  const firecrawlApiKey = Deno.env.get('Firecrawl');
  if (!firecrawlApiKey) {
    console.error('FIRECRAWL_API_KEY not configured');
    return { content: null, creditExhausted: false };
  }

  try {
    console.log(`Scraping URL with Firecrawl: ${url}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    // Check for credit exhaustion (402 Payment Required)
    if (response.status === 402) {
      console.warn(`⚠️ Firecrawl credits exhausted (402) for ${url}`);
      return { content: null, creditExhausted: true };
    }

    if (!response.ok) {
      console.error(`Firecrawl error for ${url}: ${response.status}`);
      return { content: null, creditExhausted: false };
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || null;
    
    if (markdown) {
      console.log(`Successfully scraped ${url}, content length: ${markdown.length}`);
    }
    
    return { content: markdown, creditExhausted: false };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return { content: null, creditExhausted: false };
  }
}

// Helper function for delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Verification result interface
interface VerificationResult {
  isValid: boolean;
  status: 'verified' | 'rejected' | 'pending';
  errors: string[];
  correctedSummary?: string;
  verificationDetails: {
    claimsChecked: number;
    claimsVerified: number;
    claimsRejected: number;
    fabricatedClaims: string[];
  };
}

// Verify summary against original content (SSOT - Single Source of Truth)
async function verifySummary(
  title: string,
  originalContent: string,
  aiSummary: string,
  attemptNumber: number = 1
): Promise<VerificationResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  try {
    console.log(`Calling verify-summary for: ${title.substring(0, 40)}... (attempt ${attemptNumber})`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/verify-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        title,
        originalContent,
        aiSummary,
        attemptNumber,
      }),
    });

    if (!response.ok) {
      console.error(`Verification request failed: ${response.status}`);
      return {
        isValid: false,
        status: 'pending',
        errors: [`Verification service error: ${response.status}`],
        verificationDetails: {
          claimsChecked: 0,
          claimsVerified: 0,
          claimsRejected: 0,
          fabricatedClaims: [],
        },
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Verification error:', error);
    return {
      isValid: false,
      status: 'pending',
      errors: [error instanceof Error ? error.message : 'Unknown verification error'],
      verificationDetails: {
        claimsChecked: 0,
        claimsVerified: 0,
        claimsRejected: 0,
        fabricatedClaims: [],
      },
    };
  }
}

// Result interface for title + summary generation
interface GenerationResult {
  title: string;
  summary: string;
}

// Generate AI title and summary using Lovable AI (full content mode)
async function generateTitleAndSummaryWithRetry(
  originalTitle: string, 
  content: string, 
  category: string,
  maxRetries: number = 3
): Promise<GenerationResult | null> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return null;
  }

  const prompt = `Jesteś profesjonalnym redaktorem newsowym. Twoim zadaniem jest:
1. Stworzyć nowy, lepszy tytuł artykułu
2. Przygotować zwięzłe streszczenie

KATEGORIA: ${category}

ORYGINALNY TYTUŁ (do przepisania): ${originalTitle}

TREŚĆ ARTYKUŁU:
${content.substring(0, 8000)}

ZASADY DLA TYTUŁU:
- Max 80 znaków, ZWIĘZŁY i KONKRETNY
- Oddaj esencję artykułu - co jest najważniejsze?
- Unikaj clickbaitów, pytań retorycznych i wykrzykników
- Pisz w czasie teraźniejszym dla większej dynamiki

ZASADY DLA PODSUMOWANIA:
- Zacznij od LEADU - odpowiedz na pytania: Kto? Co? Gdzie? Kiedy? Dlaczego?
- NIE PISZ wstępów typu "Artykuł omawia..." - od razu przejdź do faktów
- Użyj znaczników <b></b> do wyróżnienia najważniejszych faktów
- Długość: 3-10 gęstych merytorycznie zdań
- Pisz w języku polskim, profesjonalnie, obiektywnie

FORMAT ODPOWIEDZI (DOKŁADNIE w tym formacie JSON, bez dodatkowego tekstu):
{"title": "Tutaj nowy tytuł", "summary": "Tutaj podsumowanie"}`;

  return await callLovableAI(prompt, originalTitle, maxRetries);
}

// Generate AI title and summary from RSS data only (fallback mode)
async function generateTitleAndSummaryFromRSS(
  originalTitle: string, 
  description: string,
  category: string,
  source: string,
  maxRetries: number = 3
): Promise<GenerationResult | null> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return null;
  }

  const prompt = `Jesteś profesjonalnym redaktorem newsowym. Na podstawie OGRANICZONYCH danych z RSS:

KATEGORIA: ${category}
ŹRÓDŁO: ${source}

ORYGINALNY TYTUŁ: ${originalTitle}

OPIS Z RSS (jeśli dostępny): ${description || 'Brak opisu'}

⚠️ UWAGA: Masz dostęp TYLKO do tytułu i krótkiego opisu z RSS. NIE MASZ pełnej treści artykułu.

ZADANIE:
1. Przepisz tytuł na bardziej czytelny i konkretny (max 80 znaków)
2. Na podstawie tytułu i opisu napisz KRÓTKIE streszczenie (2-3 zdania)

ZASADY:
- NIE WYMYŚLAJ faktów których nie ma w tytule/opisie
- Jeśli opis jest pusty, streszczenie powinno być prostą parafrazą tytułu
- Użyj znaczników <b></b> dla kluczowych pojęć
- Bądź ostrożny - lepiej napisać mniej niż zmyślać

FORMAT ODPOWIEDZI (DOKŁADNIE w tym formacie JSON):
{"title": "Tutaj nowy tytuł", "summary": "Tutaj krótkie podsumowanie"}`;

  return await callLovableAI(prompt, originalTitle, maxRetries);
}

// Common function to call Lovable AI
async function callLovableAI(prompt: string, originalTitle: string, maxRetries: number): Promise<GenerationResult | null> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) return null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Lovable AI attempt ${attempt}/${maxRetries} for: ${originalTitle.substring(0, 40)}...`);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 800,
          temperature: 0,
        }),
      });

      // Handle rate limit (429)
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 3000;
        console.log(`Rate limited (429). Waiting ${waitTime / 1000}s before retry...`);
        await delay(waitTime);
        continue;
      }

      // Handle other errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Lovable AI error: ${response.status} - ${errorText}`);
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await delay(waitTime);
          continue;
        }
        return null;
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      
      if (rawContent) {
        try {
          // Clean up the response - remove markdown code blocks if present
          let jsonContent = rawContent.trim();
          if (jsonContent.startsWith('```json')) {
            jsonContent = jsonContent.slice(7);
          } else if (jsonContent.startsWith('```')) {
            jsonContent = jsonContent.slice(3);
          }
          if (jsonContent.endsWith('```')) {
            jsonContent = jsonContent.slice(0, -3);
          }
          jsonContent = jsonContent.trim();
          
          const parsed = JSON.parse(jsonContent);
          if (parsed.title && parsed.summary) {
            console.log(`Generated title+summary on attempt ${attempt}`);
            return {
              title: parsed.title,
              summary: parsed.summary,
            };
          }
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON, using raw content as summary');
          // Fallback: use raw content as summary, keep original title
          return {
            title: originalTitle,
            summary: rawContent,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error on attempt ${attempt}:`, error);
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await delay(waitTime);
        continue;
      }
      return null;
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Starting background news processing...');
    
    // Track Firecrawl credit status
    let firecrawlCreditsExhausted = false;
    let firecrawlExhaustedAt: string | null = null;
    
    // 1. Fetch RSS from all sources
    const fetchPromises = RSS_SOURCES.map(({ url, source, category }) =>
      fetchRSSFeed(url, source, category)
    );
    const results = await Promise.allSettled(fetchPromises);
    
    let allArticles: RSSItem[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allArticles = [...allArticles, ...result.value];
      }
    });
    
    console.log(`Total RSS articles fetched: ${allArticles.length}`);
    
    // 2. Get existing URLs to avoid duplicates
    const { data: existingArticles } = await supabase
      .from('processed_articles')
      .select('url');
    
    const existingUrls = new Set(existingArticles?.map(a => a.url) || []);
    console.log(`Existing articles in DB: ${existingUrls.size}`);
    
    // 3. Filter new articles
    const newArticles = allArticles.filter(a => !existingUrls.has(a.url));
    console.log(`New articles to process: ${newArticles.length}`);
    
    // 4. Process new articles (limit to 10 per run to avoid timeouts)
    const articlesToProcess = newArticles.slice(0, 10);
    let processedCount = 0;
    let failedCount = 0;
    let rateLimitedCount = 0;
    let fallbackModeCount = 0;
    
    for (let i = 0; i < articlesToProcess.length; i++) {
      const article = articlesToProcess[i];
      
      try {
        console.log(`Processing [${i + 1}/${articlesToProcess.length}]: ${article.title.substring(0, 50)}...`);
        
        let fullContent: string | null = null;
        let usedFallbackMode = false;
        
        // Try to scrape full content (unless credits already exhausted)
        if (!firecrawlCreditsExhausted) {
          const scrapeResult = await scrapeWithFirecrawl(article.url);
          
          if (scrapeResult.creditExhausted) {
            firecrawlCreditsExhausted = true;
            firecrawlExhaustedAt = new Date().toISOString();
            console.warn('🚨 Firecrawl credits exhausted! Switching to RSS-only mode for remaining articles.');
          } else {
            fullContent = scrapeResult.content;
          }
        }
        
        // Small delay between requests
        const preApiDelay = 500 + (i * 200);
        console.log(`Waiting ${preApiDelay}ms before AI call...`);
        await delay(preApiDelay);
        
        let generationResult: GenerationResult | null = null;
        
        if (fullContent && fullContent.length >= 100) {
          // Full content available - use standard generation
          generationResult = await generateTitleAndSummaryWithRetry(article.title, fullContent, article.category);
        } else {
          // No full content - use RSS fallback mode
          console.log(`Using RSS-only fallback mode for: ${article.title.substring(0, 40)}...`);
          usedFallbackMode = true;
          fallbackModeCount++;
          generationResult = await generateTitleAndSummaryFromRSS(
            article.title, 
            article.description || '', 
            article.category,
            article.source
          );
        }
        
        if (!generationResult) {
          console.log(`Skipping ${article.url} - failed to generate title+summary after retries`);
          failedCount++;
          rateLimitedCount++;
          continue;
        }

        const aiTitle = generationResult.title;
        let aiSummary = generationResult.summary;

        // === FACT-CHECKING SYSTEM ===
        const verificationLogs: any[] = [];
        let verificationStatus: 'pending' | 'verified' | 'rejected' = 'pending';
        let finalSummary = aiSummary;
        
        // Only verify if we have full content
        if (fullContent && fullContent.length >= 100) {
          const maxVerificationAttempts = 3;

          for (let attempt = 1; attempt <= maxVerificationAttempts; attempt++) {
            console.log(`Verification attempt ${attempt}/${maxVerificationAttempts} for: ${article.title.substring(0, 40)}...`);
            
            await delay(300); // Small delay before verification
            
            const verificationResult = await verifySummary(
              article.title,
              fullContent,
              finalSummary,
              attempt
            );

            // Log verification attempt
            verificationLogs.push({
              attempt,
              timestamp: new Date().toISOString(),
              status: verificationResult.status,
              isValid: verificationResult.isValid,
              errors: verificationResult.errors,
              details: verificationResult.verificationDetails,
            });

            if (verificationResult.isValid && verificationResult.status === 'verified') {
              // Summary passed verification
              verificationStatus = 'verified';
              console.log(`✅ Summary VERIFIED on attempt ${attempt}`);
              break;
            }

            if (verificationResult.status === 'rejected') {
              console.log(`❌ Summary REJECTED on attempt ${attempt}. Errors: ${verificationResult.errors.join(', ')}`);
              
              // If we have a corrected summary, use it for next verification
              if (verificationResult.correctedSummary && attempt < maxVerificationAttempts) {
                console.log(`Using corrected summary for next attempt...`);
                finalSummary = verificationResult.correctedSummary;
                await delay(500); // Delay before next attempt
              } else if (attempt === maxVerificationAttempts) {
                // Max attempts reached, mark as rejected
                verificationStatus = 'rejected';
                console.log(`🚫 Max verification attempts reached. Status: REJECTED`);
              }
            } else {
              // Status is 'pending' (verification service error)
              console.log(`⚠️ Verification pending (service issue) on attempt ${attempt}`);
              if (attempt === maxVerificationAttempts) {
                verificationStatus = 'pending';
              }
            }
          }
        } else {
          // No full content - mark as pending with note
          verificationStatus = 'pending';
          verificationLogs.push({
            attempt: 0,
            timestamp: new Date().toISOString(),
            status: 'pending',
            isValid: false,
            errors: ['Brak pełnej treści artykułu - wygenerowano na podstawie danych RSS'],
            details: {
              claimsChecked: 0,
              claimsVerified: 0,
              claimsRejected: 0,
              fabricatedClaims: [],
              fallbackMode: true,
            },
          });
        }

        // Save to database with verification status and AI title
        const { error: insertError } = await supabase
          .from('processed_articles')
          .insert({
            url: article.url,
            title: article.title,
            ai_title: aiTitle,
            source: article.source,
            category: article.category,
            image_url: article.imageUrl,
            full_content: fullContent ? fullContent.substring(0, 50000) : null, // May be null in fallback mode
            ai_summary: finalSummary,
            pub_date: article.pubDate?.toISOString() || null,
            ai_verification_status: verificationStatus,
            verification_logs: verificationLogs,
          });
        
        if (insertError) {
          console.error(`Error inserting article: ${insertError.message}`);
          failedCount++;
        } else {
          processedCount++;
          const modeLabel = usedFallbackMode ? ' [RSS-ONLY]' : '';
          console.log(`✅ Saved: ${article.title.substring(0, 50)}... [${verificationStatus.toUpperCase()}]${modeLabel}`);
        }
        
      } catch (error) {
        console.error(`Error processing article ${article.url}:`, error);
        failedCount++;
      }
    }
    
    const result = {
      success: true,
      totalFetched: allArticles.length,
      newArticles: newArticles.length,
      processed: processedCount,
      failed: failedCount,
      rateLimited: rateLimitedCount,
      fallbackModeUsed: fallbackModeCount,
      firecrawlCreditsExhausted,
      firecrawlExhaustedAt,
      timestamp: new Date().toISOString(),
      // Admin warning message
      adminWarning: firecrawlCreditsExhausted 
        ? `⚠️ UWAGA: Kredyty Firecrawl zostały wyczerpane! ${fallbackModeCount} artykułów przetworzono w trybie awaryjnym (tylko dane z RSS). Uzupełnij kredyty na firecrawl.dev/pricing aby uzyskać pełne streszczenia.`
        : null,
    };
    
    console.log('Processing complete:', result);
    
    if (firecrawlCreditsExhausted) {
      console.warn('='.repeat(60));
      console.warn('⚠️ ADMIN ALERT: Firecrawl credits exhausted!');
      console.warn(`Fallback mode used for ${fallbackModeCount} articles.`);
      console.warn('Please top up at: https://firecrawl.dev/pricing');
      console.warn('='.repeat(60));
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in process-news-background:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
