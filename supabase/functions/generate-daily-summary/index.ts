import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY") || "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

const POLISH_VOIVODESHIPS = [
  "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie",
  "łódzkie", "małopolskie", "mazowieckie", "opolskie",
  "podkarpackie", "podlaskie", "pomorskie", "śląskie",
  "świętokrzyskie", "warmińsko-mazurskie", "wielkopolskie", "zachodniopomorskie"
];

// Categories that support daily summaries
const SUMMARY_CATEGORIES = [
  { slug: "wiadomosci", name: "Wiadomości", keywords: ["wiadomości", "wiadomosci", "news", "polska", "polityka"] },
  { slug: "swiat", name: "Świat", keywords: ["świat", "swiat", "world", "europa", "usa"] },
  { slug: "biznes", name: "Biznes", keywords: ["biznes", "business", "gospodarka", "firma"] },
  { slug: "finanse", name: "Finanse", keywords: ["finanse", "finance", "bank", "kredyt"] },
  { slug: "tech-nauka", name: "Technologia i Nauka", keywords: ["tech", "technologia", "nauka", "ai", "kosmos"] },
  { slug: "sport", name: "Sport", keywords: ["sport", "piłka", "mecz", "liga"] },
  { slug: "kultura", name: "Kultura", keywords: ["kultura", "film", "muzyka", "kino"] },
  { slug: "motoryzacja", name: "Motoryzacja", keywords: ["motoryzacja", "auto", "samochód", "paliwo"] },
];

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  view_count: number;
  region: string | null;
  ai_summary: string | null;
}

interface ProcessedArticle {
  id: string;
  title: string;
  ai_summary: string | null;
  category: string | null;
  source: string | null;
}

async function getTopArticlesForCategory(
  supabase: SupabaseClient,
  category: { slug: string; keywords: string[] },
  limit: number = 5
): Promise<(Article | ProcessedArticle)[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lookbackDate = new Date(today);
  lookbackDate.setDate(lookbackDate.getDate() - 3);

  // First try processed_articles (RSS sourced)
  const { data: processedData } = await supabase
    .from("processed_articles")
    .select("id, title, ai_summary, category, source")
    .gte("created_at", lookbackDate.toISOString())
    .or(category.keywords.map(k => `category.ilike.%${k}%`).join(","))
    .order("created_at", { ascending: false })
    .limit(limit);

  // Then try regular articles
  const { data: articlesData } = await supabase
    .from("articles")
    .select("id, title, excerpt, category, view_count, region, ai_summary")
    .eq("is_published", true)
    .gte("created_at", lookbackDate.toISOString())
    .or(category.keywords.map(k => `category.ilike.%${k}%`).join(","))
    .order("view_count", { ascending: false })
    .limit(limit);

  // Combine and deduplicate
  const combined = [...(processedData || []), ...(articlesData || [])];
  const seen = new Set<string>();
  const unique = combined.filter(a => {
    const key = a.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, limit);
}

async function getTopArticles(
  supabase: SupabaseClient,
  region: string | null,
  limit: number = 5
): Promise<Article[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lookbackDate = new Date(today);
  lookbackDate.setDate(lookbackDate.getDate() - 3);

  let query = supabase
    .from("articles")
    .select("id, title, excerpt, category, view_count, region, ai_summary")
    .eq("is_published", true)
    .gte("created_at", lookbackDate.toISOString())
    .order("view_count", { ascending: false })
    .limit(limit);

  if (region) {
    query = query.eq("region", region);
  } else {
    query = query.or("region.is.null,region.eq.Polska");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching articles:", error);
    return [];
  }

  return data || [];
}

async function getAllTopArticles(
  supabase: SupabaseClient,
  limit: number = 10
): Promise<(Article | ProcessedArticle)[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lookbackDate = new Date(today);
  lookbackDate.setDate(lookbackDate.getDate() - 3);

  // Get from processed_articles (RSS)
  const { data: processedData } = await supabase
    .from("processed_articles")
    .select("id, title, ai_summary, category, source")
    .gte("created_at", lookbackDate.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  // Get from articles
  const { data: articlesData } = await supabase
    .from("articles")
    .select("id, title, excerpt, category, view_count, region, ai_summary")
    .eq("is_published", true)
    .gte("created_at", lookbackDate.toISOString())
    .order("view_count", { ascending: false })
    .limit(limit);

  // Combine and deduplicate
  const combined = [...(processedData || []), ...(articlesData || [])];
  const seen = new Set<string>();
  const unique = combined.filter(a => {
    const key = a.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, limit);
}

async function generateSummaryText(
  articles: (Article | ProcessedArticle)[], 
  context: { region?: string | null; category?: { slug: string; name: string; keywords: string[] } | null }
): Promise<string> {
  if (articles.length === 0) {
    if (context.category) {
      return `Brak najważniejszych wiadomości z kategorii ${context.category.name} na dzisiaj.`;
    }
    if (context.region) {
      return `Brak najważniejszych wiadomości z regionu ${context.region} na dzisiaj.`;
    }
    return "Brak najważniejszych wiadomości na dzisiaj.";
  }

  const articlesList = articles.map((a, i) => {
    const summary = a.ai_summary || ('excerpt' in a ? a.excerpt : null) || "";
    return `${i + 1}. ${a.title}${summary ? ` - ${summary}` : ""}`;
  }).join("\n");

  let contextText = "wszystkich kategorii";
  if (context.category) {
    contextText = `kategorii ${context.category.name}`;
  } else if (context.region) {
    contextText = `regionu ${context.region}`;
  }

  const today = new Date().toLocaleDateString("pl-PL", { 
    weekday: "long", 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  });

  const prompt = `Jesteś polskim prezenterem wiadomości. Stwórz krótkie, profesjonalne podsumowanie dnia (${today}) dla ${contextText}.

Najważniejsze wiadomości do podsumowania:
${articlesList}

Wymagania:
- Zacznij od powitania i daty
- Przedstaw każdą wiadomość w 1-2 zdaniach
- Użyj naturalnego, dziennikarskiego języka
- Zakończ pozdrowieniem
- Całość powinna trwać około 1-2 minuty przy czytaniu na głos
- Pisz w języku polskim

Podsumowanie:`;

  const fallbackText = `Podsumowanie dnia ${today} dla ${contextText}:\n\n${articlesList}`;

  // Try Gemini API directly first (own key, no credit limits)
  if (GEMINI_API_KEY) {
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1000 },
          }),
        }
      );

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        console.error("Gemini API error:", await geminiResponse.text());
      }
    } catch (err) {
      console.error("Gemini API fetch error:", err);
    }
  }

  // Fallback to Lovable AI gateway
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error("Lovable AI API error:", await response.text());
      return fallbackText;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || fallbackText;
  } catch (error) {
    console.error("Error generating summary:", error);
    return fallbackText;
  }
}

async function generateAudio(text: string, supabase: SupabaseClient, fileName: string): Promise<string | null> {
  try {
    const voiceId = "onwK4e9ZLuTAKqWW03F9"; // Daniel - Polish voice
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("ElevenLabs error:", await response.text());
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    
    const { error } = await supabase.storage
      .from("daily-audio")
      .upload(fileName, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("daily-audio")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error generating audio:", error);
    return null;
  }
}

async function createDailySummary(
  supabase: SupabaseClient,
  options: { region?: string | null; category?: { slug: string; name: string; keywords: string[] } | null }
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const { region = null, category = null } = options;
  
  // Check if summary already exists (for upsert)
  let existingQuery = supabase
    .from("daily_summaries")
    .select("id")
    .eq("summary_date", today);
  
  if (region === null) {
    existingQuery = existingQuery.is("region", null);
  } else {
    existingQuery = existingQuery.eq("region", region);
  }

  if (category === null) {
    existingQuery = existingQuery.is("category", null);
  } else {
    existingQuery = existingQuery.eq("category", category.slug);
  }

  const { data: existing } = await existingQuery.maybeSingle();
  const existingId = existing?.id || null;

  let articles: (Article | ProcessedArticle)[];
  
  if (category) {
    // Category-specific summary
    articles = await getTopArticlesForCategory(supabase, category);
  } else if (region) {
    // Regional summary
    articles = await getTopArticles(supabase, region);
  } else {
    // National/all summary
    articles = await getAllTopArticles(supabase);
  }
  
  if (articles.length === 0) {
    console.log(`No articles found for ${category?.name || region || "national"} on ${today}`);
    return;
  }

  const summaryText = await generateSummaryText(articles, { region, category });
  
  const fileNamePart = category?.slug || region || "national";
  const audioFileName = `${today}-${fileNamePart}.mp3`;
  const audioUrl = await generateAudio(summaryText, supabase, audioFileName);

  const summaryData: Record<string, unknown> = {
    summary_date: today,
    region: region,
    category: category?.slug || null,
    summary_text: summaryText,
    audio_url: audioUrl,
    article_ids: articles.map(a => a.id),
    view_count_total: articles.reduce((sum, a) => sum + ('view_count' in a ? a.view_count : 0), 0),
    updated_at: new Date().toISOString(),
  };

  if (existingId) {
    // Update existing summary (for scheduled re-runs at 7:30, 12:30, 18:30)
    const { error } = await supabase
      .from("daily_summaries")
      .update(summaryData)
      .eq("id", existingId);

    if (error) {
      console.error(`Error updating summary for ${category?.name || region || "national"}:`, error);
    } else {
      console.log(`Updated summary for ${category?.name || region || "national"} on ${today}`);
    }
  } else {
    // Insert new summary
    const { error } = await supabase.from("daily_summaries").insert(summaryData);

    if (error) {
      console.error(`Error saving summary for ${category?.name || region || "national"}:`, error);
    } else {
      console.log(`Created summary for ${category?.name || region || "national"} on ${today}`);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    let targetRegion: string | null = null;
    let targetCategory: string | null = null;
    let generateAll = true;
    let generateCategories = true;
    
    try {
      const body = await req.json();
      if (body.region !== undefined) {
        targetRegion = body.region;
        generateAll = false;
      }
      if (body.category !== undefined) {
        targetCategory = body.category;
        generateAll = false;
        generateCategories = false;
      }
      if (body.all !== undefined) {
        generateAll = body.all;
      }
      if (body.categories !== undefined) {
        generateCategories = body.categories;
      }
    } catch {
      // No body, generate all summaries
    }

    const results: { type: string; name: string | null; status: string }[] = [];

    if (generateAll) {
      // Generate main summary (all categories combined)
      await createDailySummary(supabase, {});
      results.push({ type: "national", name: null, status: "generated" });

      // Generate category-specific summaries
      if (generateCategories) {
        for (const category of SUMMARY_CATEGORIES) {
          await createDailySummary(supabase, { category });
          results.push({ type: "category", name: category.name, status: "generated" });
        }
      }

      // Generate regional summaries
      for (const voivodeship of POLISH_VOIVODESHIPS) {
        await createDailySummary(supabase, { region: voivodeship });
        results.push({ type: "regional", name: voivodeship, status: "generated" });
      }
    } else if (targetCategory) {
      const category = SUMMARY_CATEGORIES.find(c => c.slug === targetCategory);
      if (category) {
        await createDailySummary(supabase, { category });
        results.push({ type: "category", name: category.name, status: "generated" });
      }
    } else {
      await createDailySummary(supabase, { region: targetRegion });
      results.push({ type: "regional", name: targetRegion, status: "generated" });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Daily summaries generated",
        results 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error in generate-daily-summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
