import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Scrape full article content using Firecrawl
async function scrapeFullContent(sourceUrl: string): Promise<string | null> {
  try {
    const apiKey = Deno.env.get('Firecrawl') || Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.log('Firecrawl API key not configured, skipping scrape');
      return null;
    }

    console.log(`Scraping full content from: ${sourceUrl}`);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: sourceUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl failed for ${sourceUrl}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.data?.markdown || data.markdown || '';
    
    if (content && content.length > 200) {
      console.log(`Successfully scraped ${content.length} characters`);
      return content;
    }
    
    console.log('Scraped content too short or empty');
    return null;
  } catch (error) {
    console.error('Error scraping full content:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, category, articleId, sourceUrl } = await req.json();
    
    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Title and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate title hash for cache lookup
    const titleHash = createTitleHash(title);
    const effectiveArticleId = articleId || titleHash;

    console.log(`Checking cache for article: ${effectiveArticleId}, titleHash: ${titleHash}`);

    // Check if summary already exists in cache
    const { data: cachedSummary, error: cacheError } = await supabase
      .from('article_summaries')
      .select('summary')
      .eq('title_hash', titleHash)
      .single();

    if (cachedSummary && !cacheError) {
      console.log(`Cache HIT for article: ${effectiveArticleId}`);
      
      // Try to parse cached data (new format has title+summary JSON)
      try {
        const parsed = JSON.parse(cachedSummary.summary);
        if (parsed.title && parsed.summary) {
          // Check if summary itself contains raw JSON/markdown (corrupted cache)
          let cleanSummary = parsed.summary;
          if (typeof cleanSummary === 'string' && (cleanSummary.startsWith('```') || cleanSummary.startsWith('{'))) {
            try {
              const innerJson = cleanSummary.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              const innerParsed = JSON.parse(innerJson);
              if (innerParsed.summary) {
                cleanSummary = innerParsed.summary;
              }
            } catch {
              // Not nested JSON, use as-is but strip markdown
              cleanSummary = cleanSummary.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            }
          }
          return new Response(
            JSON.stringify({ 
              title: parsed.title, 
              summary: cleanSummary, 
              fromCache: true 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        // Old format - just summary text
      }
      
      return new Response(
        JSON.stringify({ summary: cachedSummary.summary, fromCache: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Cache MISS for article: ${effectiveArticleId}, generating summary...`);

    // Try to get full content if content is too short (less than 500 chars)
    let fullContent = content;
    let contentSource = 'rss';
    
    if (content.length < 500 && sourceUrl) {
      console.log(`Content too short (${content.length} chars), attempting to scrape full article...`);
      const scrapedContent = await scrapeFullContent(sourceUrl);
      
      if (scrapedContent && scrapedContent.length > content.length) {
        fullContent = scrapedContent;
        contentSource = 'firecrawl';
        console.log(`Using scraped content (${fullContent.length} chars) instead of RSS content`);
      }
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `# ROLE

Jesteś starszym redaktorem newsowym (Senior News Editor) w czołowym polskim portalu informacyjnym. Twoim zadaniem jest:
1. Stworzyć nowy, lepszy tytuł artykułu
2. Przygotować obiektywne, konkretne podsumowanie TL;DR

# ABSOLUTNIE KRYTYCZNE ZASADY:

1. **NIGDY NIE DODAWAJ INFORMACJI** których nie ma w podanej treści artykułu. Jeśli czegoś nie wiesz z tekstu - NIE WYMYŚLAJ. Nie dodawaj dat, miejsc, liczb, nazwisk które nie są wyraźnie podane w źródle.

2. **NIE MIESZAJ RÓŻNYCH WYDARZEŃ.** Tworzysz podsumowanie TYLKO i WYŁĄCZNIE tego jednego konkretnego artykułu. Nie dodawaj kontekstu z innych meczów, wydarzeń czy artykułów.

3. **JEŚLI TREŚĆ JEST KRÓTKA** (mniej niż 3-4 zdania), stwórz proporcjonalnie krótkie podsumowanie (1-2 zdania). Nie "rozbudowuj" krótkiego tekstu.

4. **NIE UŻYWAJ PLACEHOLDER'ÓW** typu [data], [miejsce], [nazwa]. Jeśli nie znasz informacji - pomiń ją całkowicie.

# ZASADY DLA TYTUŁU:

1. Tytuł musi być ZWIĘZŁY (max 80 znaków), KONKRETNY i INFORMACYJNY
2. Tytuł musi oddawać esencję artykułu - co jest najważniejsze?
3. Unikaj clickbaitów, pytań retorycznych i wykrzykników
4. Nie używaj cudzysłowów chyba że cytujesz kogoś
5. Pisz w czasie teraźniejszym dla większej dynamiki

# KRYTYCZNE ZASADY DLA PODSUMOWANIA:

1. LEAD: Pierwsze zdanie musi zawierać esencję wydarzenia (Kto? Co? Gdzie? Kiedy?) - ALE TYLKO jeśli te informacje są w tekście.

2. KONTEKST I SKUTKI: Wyjaśnij powody lub potencjalne następstwa opisywanej sytuacji TYLKO na podstawie faktów z tekstu.

3. PRECYZJA: Używaj TYLKO liczb, dat, nazw własnych i nazwisk które są WYRAŹNIE podane w artykule.

4. STYL: Używaj języka przezroczystego i informacyjnego. Pisz w czasie teraźniejszym lub przeszłym dokonanym.

5. ZAKAZY: 
   - Absolutny zakaz używania fraz typu: "Artykuł opisuje", "W tekście czytamy", "Autor wspomina".
   - Brak własnych opinii, komentarzy i przymiotników wartościujących (np. "szokujący", "niesamowity").
   - Podsumowanie musi być tekstem ciągłym (nie używaj list punktowanych).
   - ABSOLUTNY ZAKAZ dodawania informacji spoza tekstu źródłowego.

# SPECYFIKACJA TECHNICZNA:

- Tytuł: max 80 znaków
- Podsumowanie: 1-6 zdań, proporcjonalnie do długości źródła
- Formatowanie podsumowania: Używaj pogrubienia (**text**) dla kluczowych podmiotów, nazwisk, dat lub kluczowych liczb

# FORMAT ODPOWIEDZI:

Odpowiedz DOKŁADNIE w tym formacie JSON (bez dodatkowego tekstu):
{"title": "Tutaj nowy tytuł", "summary": "Tutaj podsumowanie"}

# ZADANIE DO WYKONANIA:

Przygotuj tytuł i podsumowanie WYŁĄCZNIE na podstawie poniższego artykułu:

KATEGORIA: ${category}

ORYGINALNY TYTUŁ (do przepisania): ${title}

TREŚĆ ARTYKUŁU: 
${fullContent}`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1200,
          temperature: 0,
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zbyt wiele żądań. Spróbuj ponownie za chwilę." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Brak dostępnych kredytów AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON response
    let generatedTitle = title;
    let summary = "Nie udało się wygenerować podsumowania.";
    
    try {
      // Clean up the response - use regex to extract JSON object robustly
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in AI response");
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title) {
        generatedTitle = parsed.title;
      }
      if (parsed.summary) {
        summary = parsed.summary;
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError, "Raw:", rawContent.substring(0, 200));
      // Fallback: strip markdown and use as plain text
      summary = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }

    // Save to cache with both title and summary
    const { error: insertError } = await supabase
      .from('article_summaries')
      .upsert({
        article_id: effectiveArticleId,
        title_hash: titleHash,
        summary: JSON.stringify({ title: generatedTitle, summary }),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'title_hash'
      });

    if (insertError) {
      console.error("Failed to cache summary:", insertError);
    } else {
      console.log(`Summary cached for article: ${effectiveArticleId}`);
    }

    return new Response(
      JSON.stringify({ 
        title: generatedTitle,
        summary, 
        fromCache: false, 
        contentSource,
        contentLength: fullContent.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("summarize-article error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
