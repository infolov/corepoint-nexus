import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY")!;

const POLISH_VOIVODESHIPS = [
  "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie",
  "łódzkie", "małopolskie", "mazowieckie", "opolskie",
  "podkarpackie", "podlaskie", "pomorskie", "śląskie",
  "świętokrzyskie", "warmińsko-mazurskie", "wielkopolskie", "zachodniopomorskie"
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

async function getTopArticles(
  supabase: SupabaseClient,
  region: string | null,
  limit: number = 5
): Promise<Article[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let query = supabase
    .from("articles")
    .select("id, title, excerpt, category, view_count, region, ai_summary")
    .eq("is_published", true)
    .gte("created_at", today.toISOString())
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

async function generateSummaryText(articles: Article[], region: string | null): Promise<string> {
  if (articles.length === 0) {
    return region 
      ? `Brak najważniejszych wiadomości z regionu ${region} na dzisiaj.`
      : "Brak najważniejszych wiadomości krajowych na dzisiaj.";
  }

  const articlesList = articles.map((a, i) => 
    `${i + 1}. ${a.title}${a.ai_summary ? ` - ${a.ai_summary}` : (a.excerpt ? ` - ${a.excerpt}` : "")}`
  ).join("\n");

  const regionText = region ? `regionu ${region}` : "Polski";
  const today = new Date().toLocaleDateString("pl-PL", { 
    weekday: "long", 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  });

  const prompt = `Jesteś polskim prezenterem wiadomości. Stwórz krótkie, profesjonalne podsumowanie dnia (${today}) dla ${regionText}.

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

  try {
    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
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
      console.error("AI API error:", await response.text());
      return `Podsumowanie dnia ${today} dla ${regionText}:\n\n${articlesList}`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || `Podsumowanie dnia ${today}:\n\n${articlesList}`;
  } catch (error) {
    console.error("Error generating summary:", error);
    return `Podsumowanie dnia ${today} dla ${regionText}:\n\n${articlesList}`;
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
  region: string | null
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  
  // Check if summary already exists
  let existingQuery = supabase
    .from("daily_summaries")
    .select("id")
    .eq("summary_date", today);
  
  if (region === null) {
    existingQuery = existingQuery.is("region", null);
  } else {
    existingQuery = existingQuery.eq("region", region);
  }

  const { data: existing } = await existingQuery.single();

  if (existing) {
    console.log(`Summary already exists for ${region || "national"} on ${today}`);
    return;
  }

  const articles = await getTopArticles(supabase, region);
  
  if (articles.length === 0) {
    console.log(`No articles found for ${region || "national"} on ${today}`);
    return;
  }

  const summaryText = await generateSummaryText(articles, region);
  
  const audioFileName = `${today}-${region || "national"}.mp3`;
  const audioUrl = await generateAudio(summaryText, supabase, audioFileName);

  const insertData: Record<string, unknown> = {
    summary_date: today,
    region: region,
    summary_text: summaryText,
    audio_url: audioUrl,
    article_ids: articles.map(a => a.id),
    view_count_total: articles.reduce((sum, a) => sum + a.view_count, 0),
  };

  const { error } = await supabase.from("daily_summaries").insert(insertData);

  if (error) {
    console.error(`Error saving summary for ${region || "national"}:`, error);
  } else {
    console.log(`Created summary for ${region || "national"} on ${today}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    let targetRegion: string | null = null;
    let generateAll = true;
    
    try {
      const body = await req.json();
      if (body.region !== undefined) {
        targetRegion = body.region;
        generateAll = false;
      }
      if (body.all !== undefined) {
        generateAll = body.all;
      }
    } catch {
      // No body, generate all summaries
    }

    const results: { region: string | null; status: string }[] = [];

    if (generateAll) {
      await createDailySummary(supabase, null);
      results.push({ region: null, status: "generated" });

      for (const voivodeship of POLISH_VOIVODESHIPS) {
        await createDailySummary(supabase, voivodeship);
        results.push({ region: voivodeship, status: "generated" });
      }
    } else {
      await createDailySummary(supabase, targetRegion);
      results.push({ region: targetRegion, status: "generated" });
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
