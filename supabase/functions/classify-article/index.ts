import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pełna lista kategorii i podkategorii dostępnych w serwisie
const AVAILABLE_CATEGORIES = {
  "Wiadomości": ["Najważniejsze", "Polityka i rząd", "Społeczeństwo", "Prawo i sądy", "Bezpieczeństwo", "Edukacja"],
  "Świat": ["Europa", "USA", "Ukraina/Rosja", "Bliski Wschód", "Azja", "Afryka"],
  "Biznes": ["Gospodarka i rynek", "Firmy i branże", "Ceny i inflacja", "Energetyka i paliwa", "Rynek pracy", "Nieruchomości"],
  "Finanse": ["Kredyty i banki", "Kursy walut", "ZUS i emerytury", "Dofinansowania", "Leasing", "Rynek finansowy", "Ubezpieczenia"],
  "Prawo": ["Zmiany w prawie", "PIT/VAT/CIT", "Obowiązki firm i obywateli", "KSeF"],
  "Nauka i Technologia": ["AI", "Cyberbezpieczeństwo", "Internet i platformy", "Nowe technologie", "Odkrycia", "Kosmos", "Środowisko i klimat"],
  "Motoryzacja": ["Ceny paliw", "Przepisy i mandaty", "Nowości/testy", "Elektromobilność"],
  "Sport": [
    "Piłka nożna (Ekstraklasa, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Liga Mistrzów, Liga Europy, Reprezentacja, Transfery)",
    "Koszykówka (NBA, Euroliga, PLK)",
    "Siatkówka (PlusLiga, Liga Mistrzów Siatkówki, Reprezentacja)",
    "Tenis (ATP, WTA, Wielki Szlem)",
    "Sporty Motorowe (Formuła 1, MotoGP, Rajdy WRC, Żużel)",
    "Sporty Walki (MMA, UFC, KSW, Boks)",
    "Hokej (NHL, Liga Europejska)",
    "E-sport (CS2, League of Legends, Valorant)",
    "Lekkoatletyka",
    "Sporty Zimowe (Skoki Narciarskie, Biegi Narciarskie, Biathlon)"
  ],
  "Kultura": ["Kino", "Seriale", "Muzyka", "Eventy i koncerty", "Popkultura"],
  "Lifestyle": ["Zdrowie i wellbeing", "Zdrowe odżywianie", "Styl życia", "Rodzina i relacje", "Podróże", "Moda"],
  "Lokalne": ["Wypadki", "Utrudnienia", "Miasto i samorząd", "Inwestycje i remonty", "Bezpieczeństwo", "Kultura lokalna", "Sport lokalny"]
};

// Płaska lista wszystkich podkategorii
const ALL_SUBCATEGORIES = Object.entries(AVAILABLE_CATEGORIES).flatMap(([main, subs]) =>
  subs.map(sub => `${main} → ${sub}`)
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, snippet } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Brak tytułu artykułu" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const articleText = content || snippet || "";
    
    const systemPrompt = `Rola: Jesteś precyzyjnym klasyfikatorem treści. Twoim zadaniem jest kategoryzacja artykułów newsowych przy użyciu wyłącznie istniejących na stronie kategorii.

DOSTĘPNE KATEGORIE I PODKATEGORIE:
${Object.entries(AVAILABLE_CATEGORIES).map(([main, subs]) => 
  `${main}:\n${subs.map(s => `  - ${s}`).join('\n')}`
).join('\n\n')}

ZASADY KLASYFIKACJI (Rygorystyczne):
1. Bez wyjątków: Musisz wybrać dokładnie jedną z powyższych podkategorii.
2. Brak kategorii "Inne": Zabrania się używania kategorii "Inne", "General" lub tworzenia własnych nazw. Jeśli artykuł jest niejednoznaczny, Twoim obowiązkiem jest analiza kontekstu i przypisanie go do jednej z istniejących kategorii, do której mu najbliżej (tzw. "best fit").
3. Hierarchia ważności: Jeśli artykuł dotyczy wielu tematów, wybierz ten, który stanowi główny wątek (np. informacja o regulacjach prawnych AI to "Prawo/Zmiany w prawie", a nie "Nauka i Technologia/AI", jeśli tekst skupia się na procesie legislacyjnym).
4. Dla sportu: Określ konkretną dyscyplinę i ligę/rozgrywki jeśli to możliwe.
5. Dla wiadomości lokalnych: Przypisz do "Lokalne" tylko jeśli artykuł wyraźnie dotyczy konkretnego miasta, gminy lub regionu Polski.

FORMAT WYJŚCIOWY (JSON):
Zwróć WYŁĄCZNIE poprawny obiekt JSON bez żadnego dodatkowego tekstu:
{
  "main_category": "Dokładna nazwa głównej kategorii z listy",
  "subcategory": "Dokładna nazwa podkategorii z listy",
  "match_reasoning": "Jedno zdanie wyjaśniające, dlaczego ta kategoria jest najbardziej trafna",
  "confidence_index": 0.0-1.0
}`;

    const userPrompt = `Sklasyfikuj poniższy artykuł:

Tytuł: ${title}

Treść/Snippet: ${articleText.substring(0, 1500)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1, // Niska temperatura dla spójnych klasyfikacji
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Spróbuj ponownie za chwilę." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Brak środków na koncie AI. Doładuj kredyty." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content_text = aiResponse.choices?.[0]?.message?.content;

    if (!content_text) {
      throw new Error("Brak odpowiedzi od AI");
    }

    // Parse JSON from AI response
    let classification;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content_text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        classification = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content_text);
      throw new Error("Nie udało się sparsować odpowiedzi AI");
    }

    // Validate classification has required fields
    if (!classification.main_category || !classification.subcategory) {
      throw new Error("Niepełna klasyfikacja");
    }

    // Map to slug format for frontend use
    const categorySlugMap: Record<string, string> = {
      "Wiadomości": "wiadomosci",
      "Świat": "swiat",
      "Biznes": "biznes",
      "Finanse": "finanse",
      "Prawo": "prawo",
      "Nauka i Technologia": "tech-nauka",
      "Motoryzacja": "motoryzacja",
      "Sport": "sport",
      "Kultura": "kultura",
      "Lifestyle": "lifestyle",
      "Lokalne": "lokalne",
    };

    const mainCategorySlug = categorySlugMap[classification.main_category] || classification.main_category.toLowerCase();

    return new Response(
      JSON.stringify({
        ...classification,
        main_category_slug: mainCategorySlug,
        raw_response: content_text,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Classification error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        fallback_category: "wiadomosci",
        fallback_subcategory: "Najważniejsze"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
