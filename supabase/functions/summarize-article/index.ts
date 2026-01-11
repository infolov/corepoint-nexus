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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, category, articleId } = await req.json();
    
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
      return new Response(
        JSON.stringify({ summary: cachedSummary.summary, fromCache: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Cache MISS for article: ${effectiveArticleId}, generating summary...`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
            role: "user",
            content: `# ROLE

Jesteś starszym redaktorem newsowym (Senior News Editor) w czołowym polskim portalu informacyjnym. Twoim zadaniem jest tworzenie obiektywnych, konkretnych i profesjonalnych streszczeń typu "TL;DR" (Too Long; Didn't Read).

# ABSOLUTNIE KRYTYCZNE ZASADY:

1. **NIGDY NIE DODAWAJ INFORMACJI** których nie ma w podanej treści artykułu. Jeśli czegoś nie wiesz z tekstu - NIE WYMYŚLAJ. Nie dodawaj dat, miejsc, liczb, nazwisk które nie są wyraźnie podane w źródle.

2. **NIE MIESZAJ RÓŻNYCH WYDARZEŃ.** Tworzysz podsumowanie TYLKO i WYŁĄCZNIE tego jednego konkretnego artykułu. Nie dodawaj kontekstu z innych meczów, wydarzeń czy artykułów.

3. **JEŚLI TREŚĆ JEST KRÓTKA** (mniej niż 3-4 zdania), stwórz proporcjonalnie krótkie podsumowanie (1-2 zdania). Nie "rozbudowuj" krótkiego tekstu.

4. **NIE UŻYWAJ PLACEHOLDER'ÓW** typu [data], [miejsce], [nazwa]. Jeśli nie znasz informacji - pomiń ją całkowicie.

# KRYTYCZNE ZASADY KONSTRUKCJI:

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

- Długość: 1-6 zdań, proporcjonalnie do długości źródła. Krótkie źródło = krótkie podsumowanie.
- Formatowanie: Używaj pogrubienia (**text**) dla kluczowych podmiotów, nazwisk, dat lub kluczowych liczb, aby ułatwić szybkie skanowanie wzrokiem.

# ZADANIE DO WYKONANIA:

Przygotuj podsumowanie WYŁĄCZNIE na podstawie poniższego artykułu. Nie dodawaj ŻADNYCH informacji z zewnątrz.

KATEGORIA: ${category}

TYTUŁ: ${title}

TREŚĆ ARTYKUŁU: 
${content}

PODSUMOWANIE (oparte TYLKO na powyższej treści):`
          }
        ],
        max_tokens: 1000,
        temperature: 0,
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
    const summary = data.choices?.[0]?.message?.content || "Nie udało się wygenerować podsumowania.";

    // Save summary to cache
    const { error: insertError } = await supabase
      .from('article_summaries')
      .upsert({
        article_id: effectiveArticleId,
        title_hash: titleHash,
        summary: summary,
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
      JSON.stringify({ summary, fromCache: false }),
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
