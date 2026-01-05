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
            role: "system",
            content: `Jesteś ekspertem od streszczania wiadomości dla polskiego portalu informacyjnego. Tworzysz zwięzłe, obiektywne streszczenia artykułów w języku polskim.

KRYTYCZNE ZASADY:
- ZAWSZE zachowuj pełny kontekst i sens artykułu
- Zacznij od NAJWAŻNIEJSZEJ informacji (kto, co, gdzie, kiedy)
- Wyjaśnij DLACZEGO to jest istotne
- NIE pomijaj kluczowych szczegółów jak nazwy, liczby, daty
- Używaj prostego, zrozumiałego języka
- NIE dodawaj własnych opinii ani komentarzy
- NIE zaczynaj od "Artykuł opisuje..." ani podobnych fraz
- Pisz w czasie teraźniejszym lub przeszłym dokonanym`
          },
          {
            role: "user",
            content: `Przygotuj podsumowanie tego artykułu z kategorii "${category}".

TYTUŁ: ${title}

PEŁNA TREŚĆ ARTYKUŁU:
${content.substring(0, 25000)}

Pamiętaj: Zachowaj pełny kontekst i najważniejsze fakty. Podsumowanie musi być samodzielne i zrozumiałe bez czytania całego artykułu.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.25,
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
