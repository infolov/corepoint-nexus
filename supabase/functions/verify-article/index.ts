import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationFeedback {
  attempt: number;
  timestamp: string;
  status: 'verified' | 'rejected' | 'pending';
  errors: string[];
  mismatchDetails?: Array<{
    type: string;
    claimInSummary: string;
    sourceEvidence: string | null;
    explanation: string;
  }>;
  claimsChecked: number;
  claimsVerified: number;
  claimsRejected: number;
}

interface ArticleVerificationRequest {
  articleId: string;
  forceRegenerate?: boolean;
}

const MAX_ATTEMPTS = 3;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!lovableApiKey) {
    return new Response(
      JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { articleId, forceRegenerate = false }: ArticleVerificationRequest = await req.json();

    if (!articleId) {
      return new Response(
        JSON.stringify({ error: 'articleId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch article from database
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (fetchError || !article) {
      return new Response(
        JSON.stringify({ error: 'Article not found', details: fetchError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const originalContent = article.content;
    const title = article.title;
    let currentSummary = article.ai_summary;
    let currentAttempts = article.generation_attempts || 0;
    let feedbackHistory: VerificationFeedback[] = article.verification_feedback || [];

    // Check if already verified and not forcing regeneration
    if (article.ai_verification_status === 'verified' && !forceRegenerate) {
      return new Response(
        JSON.stringify({ 
          message: 'Article already verified',
          status: article.ai_verification_status,
          summary: currentSummary 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if max attempts reached
    if (currentAttempts >= MAX_ATTEMPTS && article.ai_verification_status === 'manual_review') {
      return new Response(
        JSON.stringify({ 
          message: 'Article requires manual review - max attempts exceeded',
          status: 'manual_review',
          attempts: currentAttempts,
          feedbackHistory 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no summary exists, generate initial summary
    if (!currentSummary || forceRegenerate) {
      console.log(`Generating initial summary for article: ${articleId}`);
      currentSummary = await generateSummary(title, originalContent, article.category, lovableApiKey);
      currentAttempts = 0;
      feedbackHistory = [];
    }

    // Verification loop
    let verificationResult: any = null;
    let finalStatus: 'verified' | 'rejected' | 'manual_review' | 'pending' = 'pending';

    while (currentAttempts < MAX_ATTEMPTS) {
      currentAttempts++;
      console.log(`Verification attempt ${currentAttempts}/${MAX_ATTEMPTS} for article: ${articleId}`);

      // Call verification
      verificationResult = await verifySummary(title, originalContent, currentSummary, currentAttempts, lovableApiKey);

      // Build feedback entry
      const feedbackEntry: VerificationFeedback = {
        attempt: currentAttempts,
        timestamp: new Date().toISOString(),
        status: verificationResult.isValid ? 'verified' : 'rejected',
        errors: verificationResult.errors || [],
        mismatchDetails: verificationResult.mismatchDetails,
        claimsChecked: verificationResult.verificationDetails?.claimsChecked || 0,
        claimsVerified: verificationResult.verificationDetails?.claimsVerified || 0,
        claimsRejected: verificationResult.verificationDetails?.claimsRejected || 0,
      };
      feedbackHistory.push(feedbackEntry);

      if (verificationResult.isValid) {
        finalStatus = 'verified';
        console.log(`Article ${articleId} VERIFIED on attempt ${currentAttempts}`);
        break;
      }

      // If rejected and more attempts available, generate corrected summary
      if (currentAttempts < MAX_ATTEMPTS) {
        console.log(`Article ${articleId} REJECTED. Generating correction (attempt ${currentAttempts + 1})...`);
        
        // Generate corrected summary with feedback
        currentSummary = await generateCorrectedSummary(
          title, 
          originalContent, 
          article.category,
          feedbackEntry.errors,
          verificationResult.verificationDetails?.fabricatedClaims || [],
          lovableApiKey
        );
      } else {
        // Max attempts reached
        finalStatus = 'manual_review';
        console.log(`Article ${articleId} requires MANUAL_REVIEW after ${MAX_ATTEMPTS} attempts`);
      }

      // Update database after each attempt
      await supabase
        .from('articles')
        .update({
          ai_summary: currentSummary,
          ai_verification_status: currentAttempts >= MAX_ATTEMPTS && !verificationResult.isValid ? 'manual_review' : 'pending',
          verification_feedback: feedbackHistory,
          generation_attempts: currentAttempts,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId);
    }

    // Final database update
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        ai_summary: currentSummary,
        ai_verification_status: finalStatus,
        verification_feedback: feedbackHistory,
        generation_attempts: currentAttempts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId);

    if (updateError) {
      console.error('Failed to update article:', updateError);
    }

    return new Response(
      JSON.stringify({
        articleId,
        status: finalStatus,
        attempts: currentAttempts,
        summary: currentSummary,
        feedbackHistory,
        lastVerification: verificationResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('verify-article error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Generate initial summary
async function generateSummary(
  title: string, 
  content: string, 
  category: string | null,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{
        role: 'user',
        content: `# ROLE

Jesteś starszym redaktorem newsowym (Senior News Editor) w czołowym polskim portalu informacyjnym. Twoim zadaniem jest tworzenie obiektywnych, konkretnych i profesjonalnych streszczeń typu "TL;DR" (Too Long; Didn't Read).

# KRYTYCZNE ZASADY KONSTRUKCJI:

1. LEAD: Pierwsze zdanie musi zawierać esencję wydarzenia (Kto? Co? Gdzie? Kiedy?).

2. KONTEKST I SKUTKI: Wyjaśnij powody lub potencjalne następstwa opisywanej sytuacji na podstawie faktów z tekstu.

3. PRECYZJA: Nigdy nie pomijaj kluczowych liczb, dat, nazw własnych i nazwisk. KOPIUJ JE DOKŁADNIE ZE ŹRÓDŁA.

4. STYL: Używaj języka przezroczystego i informacyjnego. Pisz w czasie teraźniejszym lub przeszłym dokonanym.

5. ZAKAZY: 
   - Absolutny zakaz używania fraz typu: "Artykuł opisuje", "W tekście czytamy", "Autor wspomina".
   - Brak własnych opinii, komentarzy i przymiotników wartościujących (np. "szokujący", "niesamowity").
   - NIE DODAWAJ informacji, których NIE MA w oryginalnym tekście.
   - NIE INTERPRETUJ - tylko RELACJONUJ fakty.
   - Podsumowanie musi być tekstem ciągłym (nie używaj list punktowanych).

# SPECYFIKACJA TECHNICZNA:

- Długość: 3-10 gęstych merytorycznie zdań, w zależności od złożoności tematu.
- Formatowanie: Używaj pogrubienia (**text**) dla kluczowych podmiotów, nazwisk, dat lub kluczowych liczb.

# ZADANIE DO WYKONANIA:

Przygotuj podsumowanie dla poniższego artykułu.

KATEGORIA: ${category || 'news'}

TYTUŁ: ${title}

TREŚĆ ARTYKUŁU: 
${content?.substring(0, 12000) || ''}

PODSUMOWANIE:`
      }],
      max_tokens: 600,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate summary: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Verify summary against source
async function verifySummary(
  title: string,
  originalContent: string,
  aiSummary: string,
  attemptNumber: number,
  apiKey: string
): Promise<any> {
  const verificationPrompt = `# ROLA: Rygorystyczny Inspektor Danych

Jesteś precyzyjnym inspektorem danych. Twoje jedyne zadanie to wykrycie KAŻDEJ różnicy między źródłem a podsumowaniem.

# ŹRÓDŁO PRAWDY (SSOT):
${originalContent?.substring(0, 15000) || ''}

# TEKST DO SPRAWDZENIA:
${aiSummary}

# ZADANIE:
Znajdź KAŻDĄ różnicę między źródłem a podsumowaniem.

# DEFINICJA BŁĘDU - każde z poniższych to błąd krytyczny:

1. ZMIANA CYFRY: Zmiana choćby jednej cyfry w dacie lub kwocie
   - Źródło: "15 mln zł" → Podsumowanie: "15,5 mln zł" = BŁĄD
   - Źródło: "2024" → Podsumowanie: "2025" = BŁĄD

2. ZMIANA LITERY: Zmiana litery w nazwisku lub nazwie własnej
   - Źródło: "Jan Kowalski" → Podsumowanie: "Jan Kowalsky" = BŁĄD
   - Źródło: "Warszawa" → Podsumowanie: "Waszawa" = BŁĄD

3. HALUCYNACJA: Dodanie informacji, której NIE MA w tekście źródłowym
   - Jeśli podsumowanie twierdzi coś, czego nie można znaleźć w źródle = BŁĄD
   - Przykład: Źródło nie wspomina o "liderze rynku", a podsumowanie tak twierdzi = BŁĄD

4. POMINIĘCIE KONTEKSTU: Pominięcie kluczowego kontekstu, który zmienia znaczenie liczby
   - Źródło: "spadek o 15% w porównaniu do zeszłego roku" → Podsumowanie: "spadek o 15%" (bez kontekstu) = BŁĄD

# PROCEDURA INSPEKCJI:

1. Wyodrębnij WSZYSTKIE liczby, daty, kwoty z podsumowania
2. Dla KAŻDEJ znajdź odpowiednik w źródle i porównaj ZNAK PO ZNAKU
3. Wyodrębnij WSZYSTKIE nazwiska i nazwy własne z podsumowania
4. Dla KAŻDEGO znajdź odpowiednik w źródle i porównaj LITERA PO LITERZE
5. Dla KAŻDEGO twierdzenia w podsumowaniu znajdź potwierdzenie w źródle
6. Jeśli brak potwierdzenia = HALUCYNACJA

# FORMAT WYJŚCIA (ŚCIŚLE JSON):

Jeśli tekst jest idealny (zero różnic):
{"is_valid": true, "errors": []}

Jeśli są błędy:
{
  "is_valid": false,
  "errors": [
    "ZMIANA CYFRY: W źródle '15 mln zł', w podsumowaniu '15,5 mln zł'",
    "HALUCYNACJA: Twierdzenie 'lider rynku' nie występuje w źródle",
    "ZMIANA LITERY: W źródle 'Kowalski', w podsumowaniu 'Kowalsky'"
  ]
}

# TYTUŁ ARTYKUŁU (dla kontekstu):
${title}

# PRÓBA WERYFIKACJI: ${attemptNumber}

WYNIK INSPEKCJI (TYLKO JSON, żadnego tekstu przed ani po):`;



  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: verificationPrompt }],
      max_tokens: 1000,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`Verification failed: ${response.status}`);
  }

  const data = await response.json();
  const verificationText = data.choices?.[0]?.message?.content || '';

  // Parse JSON from response
  let verificationResult: any;
  try {
    const jsonMatch = verificationText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      verificationResult = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in verification response');
    }
  } catch {
    return {
      isValid: false,
      status: 'pending',
      errors: ['Verification parsing failed'],
      verificationDetails: {
        claimsChecked: 0,
        claimsVerified: 0,
        claimsRejected: 0,
        fabricatedClaims: [],
      },
    };
  }

  const isValid = verificationResult.is_valid === true || verificationResult.isValid === true;
  const statusValue = verificationResult.status === 'verified' ? 'verified' : 'rejected';

  return {
    isValid: isValid && statusValue === 'verified',
    status: statusValue,
    errors: verificationResult.errors || 
      (verificationResult.mismatch_details || []).map((d: any) => 
        `[${d.type}] ${d.claim_in_summary} - ${d.explanation}`
      ),
    mismatchDetails: verificationResult.mismatch_details,
    verificationDetails: {
      claimsChecked: verificationResult.claimsChecked || 0,
      claimsVerified: verificationResult.claimsVerified || 0,
      claimsRejected: verificationResult.claimsRejected || 0,
      fabricatedClaims: verificationResult.fabricatedClaims || 
        (verificationResult.mismatch_details || [])
          .filter((d: any) => d.type === 'FABRYKACJA' || d.type === 'WZBOGACENIE')
          .map((d: any) => d.claim_in_summary),
    },
  };
}

// Generate corrected summary with feedback
async function generateCorrectedSummary(
  title: string,
  originalContent: string,
  category: string | null,
  errors: string[],
  fabricatedClaims: string[],
  apiKey: string
): Promise<string> {
  const correctionPrompt = `# ROLA: Profesjonalny Redaktor - Tryb Korekty

Poprzednie podsumowanie artykułu zostało ODRZUCONE przez system fact-checking. Musisz napisać NOWE podsumowanie.

# WYKRYTE BŁĘDY DO NAPRAWIENIA:
${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

# SFABRYKOWANE TWIERDZENIA (CAŁKOWICIE USUŃ):
${fabricatedClaims.map((c, i) => `${i + 1}. ${c}`).join('\n') || 'Brak zidentyfikowanych'}

# INSTRUKCJA KOREKTY:
1. PRZECZYTAJ DOKŁADNIE oryginalny tekst poniżej
2. ZIGNORUJ poprzednie podsumowanie - zacznij od nowa
3. KOPIUJ dosłownie wszystkie: nazwiska, daty, liczby, nazwy własne
4. NIE DODAWAJ żadnych informacji spoza oryginalnego tekstu
5. NIE INTERPRETUJ - tylko RELACJONUJ fakty
6. Zachowaj format: 3-10 zdań, **pogrubienia** dla kluczowych informacji

# ORYGINALNA TREŚĆ (JEDYNE ŹRÓDŁO PRAWDY - SSOT):
${originalContent?.substring(0, 12000) || ''}

# TYTUŁ:
${title}

# KATEGORIA:
${category || 'news'}

NOWE, POPRAWIONE PODSUMOWANIE:`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: correctionPrompt }],
      max_tokens: 600,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate corrected summary: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
