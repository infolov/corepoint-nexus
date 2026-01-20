import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AVAILABLE_CATEGORIES = {
  "wiadomosci": { name: "Wiadomości", subcategories: ["Polska", "Fakty", "Wywiady"] },
  "swiat": { name: "Świat", subcategories: ["Europa", "USA", "Azja", "Bliski Wschód", "Afryka", "Ameryka Łacińska"] },
  "biznes": { name: "Biznes", subcategories: ["Gospodarka", "Firmy", "Rynki", "Startupy", "Praca"] },
  "finanse": { name: "Finanse", subcategories: ["Giełda", "Kryptowaluty", "Bankowość", "Podatki", "Inwestycje"] },
  "prawo": { name: "Prawo", subcategories: ["Legislacja", "Sądy", "Prawa Obywatelskie", "Prawo Gospodarcze"] },
  "nauka": { name: "Nauka i Technologia", subcategories: ["AI", "Kosmos", "Medycyna", "Badania", "Innowacje", "Gadżety"] },
  "motoryzacja": { name: "Motoryzacja", subcategories: ["Samochody", "Elektryki", "Motocykle", "Testy", "Nowości"] },
  "sport": { 
    name: "Sport", 
    subcategories: [
      "Piłka nożna", "Koszykówka", "NBA", "Siatkówka", "Tenis", 
      "F1", "MMA", "Boks", "Hokej", "NHL", "E-sport", 
      "Lekkoatletyka", "Kolarstwo", "Sporty zimowe"
    ] 
  },
  "kultura": { name: "Kultura", subcategories: ["Film", "Muzyka", "Sztuka", "Książki", "Teatr", "Gry"] },
  "lifestyle": { name: "Lifestyle", subcategories: ["Moda", "Zdrowie", "Podróże", "Jedzenie", "Dom", "Relacje"] },
  "lokalne": { name: "Lokalne", subcategories: ["Mazowieckie", "Małopolskie", "Śląskie", "Wielkopolskie", "Dolnośląskie", "Łódzkie", "Pomorskie", "Zachodniopomorskie", "Kujawsko-Pomorskie", "Lubelskie", "Podkarpackie", "Warmińsko-Mazurskie", "Świętokrzyskie", "Opolskie", "Lubuskie", "Podlaskie"] },
};

async function classifyArticle(title: string, content: string, apiKey: string): Promise<{
  main_category: string;
  subcategory: string | null;
  main_category_slug: string;
  confidence_index: number;
} | null> {
  const categoriesDescription = Object.entries(AVAILABLE_CATEGORIES)
    .map(([slug, cat]) => `- ${cat.name} (slug: ${slug}): ${cat.subcategories.join(", ")}`)
    .join("\n");

  const systemPrompt = `Jesteś precyzyjnym klasyfikatorem treści. Twoim zadaniem jest kategoryzacja artykułów newsowych przy użyciu wyłącznie istniejących kategorii.

DOSTĘPNE KATEGORIE:
${categoriesDescription}

ZASADY KLASYFIKACJI:
1. Musisz wybrać dokładnie jedną z istniejących kategorii głównych i opcjonalnie podkategorię.
2. Zabrania się używania kategorii "Inne", "General" lub tworzenia własnych nazw.
3. Jeśli artykuł jest niejednoznaczny, przypisz go do kategorii najbliższej ("best fit").
4. Jeśli artykuł dotyczy wielu tematów, wybierz główny wątek.

FORMAT ODPOWIEDZI (tylko JSON):
{
  "main_category": "Dokładna nazwa kategorii głównej",
  "main_category_slug": "slug kategorii",
  "subcategory": "Podkategoria lub null",
  "confidence_index": 0.0-1.0
}`;

  const userPrompt = `Sklasyfikuj artykuł:
Tytuł: ${title}
Treść/Snippet: ${content?.substring(0, 500) || "brak"}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error(`AI error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content_response = data.choices?.[0]?.message?.content;

    if (!content_response) return null;

    const jsonMatch = content_response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Classification error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { 
      limit = 50, 
      offset = 0, 
      table = "processed_articles",
      only_unclassified = true,
      dry_run = false 
    } = body;

    // Fetch articles to classify
    let query = supabase.from(table).select("*");
    
    if (table === "processed_articles") {
      if (only_unclassified) {
        query = query.or("category.is.null,category.eq.pending");
      }
      query = query.order("processed_at", { ascending: false });
    } else if (table === "articles") {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: articles, error: fetchError } = await query;

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch articles", details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No articles to classify", 
          processed: 0,
          total_found: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: {
      id: string;
      title: string;
      old_category: string | null;
      new_category: string | null;
      subcategory: string | null;
      confidence: number;
      status: "success" | "failed" | "skipped";
    }[] = [];

    let successCount = 0;
    let failedCount = 0;

    // Process articles with rate limiting (delay between requests)
    for (const article of articles) {
      const title = article.title || article.ai_title || "";
      const content = article.full_content || article.ai_summary || article.content || article.excerpt || "";

      if (!title) {
        results.push({
          id: article.id,
          title: "Unknown",
          old_category: article.category,
          new_category: null,
          subcategory: null,
          confidence: 0,
          status: "skipped",
        });
        continue;
      }

      // Add delay between API calls to avoid rate limiting
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const classification = await classifyArticle(title, content, lovableApiKey);

      if (classification) {
        results.push({
          id: article.id,
          title: title.substring(0, 100),
          old_category: article.category,
          new_category: classification.main_category_slug,
          subcategory: classification.subcategory,
          confidence: classification.confidence_index,
          status: "success",
        });

        // Update in database if not dry run
        if (!dry_run) {
          const updateData: Record<string, unknown> = {
            category: classification.main_category_slug,
          };

          // For articles table, also update subcategory if column exists
          if (table === "articles" && classification.subcategory) {
            updateData.subcategory = classification.subcategory;
          }

          const { error: updateError } = await supabase
            .from(table)
            .update(updateData)
            .eq("id", article.id);

          if (updateError) {
            console.error(`Update error for ${article.id}:`, updateError);
            results[results.length - 1].status = "failed";
            failedCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } else {
        results.push({
          id: article.id,
          title: title.substring(0, 100),
          old_category: article.category,
          new_category: null,
          subcategory: null,
          confidence: 0,
          status: "failed",
        });
        failedCount++;
      }
    }

    // Get total count of unclassified articles
    let totalQuery = supabase.from(table).select("id", { count: "exact", head: true });
    if (only_unclassified && table === "processed_articles") {
      totalQuery = totalQuery.or("category.is.null,category.eq.pending");
    }
    const { count: totalRemaining } = await totalQuery;

    return new Response(
      JSON.stringify({
        message: dry_run ? "Dry run completed" : "Batch classification completed",
        dry_run,
        table,
        processed: articles.length,
        success: successCount,
        failed: failedCount,
        total_remaining: totalRemaining || 0,
        next_offset: offset + limit,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Batch classify error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
