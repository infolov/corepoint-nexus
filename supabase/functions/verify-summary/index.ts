import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  title: string;
  originalContent: string;
  aiSummary: string;
  attemptNumber?: number;
}

interface VerificationResult {
  isValid: boolean;
  status: 'verified' | 'rejected';
  errors: string[];
  correctedSummary?: string;
  verificationDetails: {
    claimsChecked: number;
    claimsVerified: number;
    claimsRejected: number;
    fabricatedClaims: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, originalContent, aiSummary, attemptNumber = 1 }: VerificationRequest = await req.json();

    if (!originalContent || !aiSummary) {
      return new Response(
        JSON.stringify({ error: "originalContent and aiSummary are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Verifying summary for: ${title?.substring(0, 50)}... (attempt ${attemptNumber})`);

    // Step 1: Fact-checking - verify all claims in summary against source
    const verificationPrompt = `# ROLA: Tolerancyjny Redaktor Weryfikacyjny

Jesteś życzliwym redaktorem sprawdzającym podsumowania. Twoim celem jest przepuszczenie poprawnych podsumowań, a nie szukanie błędów na siłę.

# ORYGINALNA TREŚĆ ARTYKUŁU:
${originalContent.substring(0, 15000)}

# PODSUMOWANIE DO WERYFIKACJI:
${aiSummary}

# TYTUŁ: ${title}

# FILOZOFIA WERYFIKACJI:
Podsumowanie jest DOBRE jeśli oddaje GŁÓWNY SENS artykułu. Nie szukaj drobnych różnic!

# JEDYNE PRAWDZIWE BŁĘDY TO:
1. **Zmieniona liczba** - np. "15" zamienione na "20" (ale "15 mln" = "piętnaście milionów" to OK)
2. **Przekręcone nazwisko** - np. "Kowalski" → "Nowalski" (ale "Kowalski" → "Kowalskiego" to OK!)
3. **Wymyślona informacja** - coś czego KOMPLETNIE nie ma w źródle
4. **Odwrócony sens** - np. "wygrał" zamiast "przegrał"

# TO NIE SĄ BŁĘDY - IGNORUJ:
- "stopni Celsjusza" vs "st. C" vs "°C" - to to samo!
- "od -18/-20 do -15" vs "od -18 do -15°C" - to samo!
- "Hurkacz" vs "Hurkacza" - odmiana, OK!
- "mln zł" vs "milionów złotych" - to samo!
- Parafrazy zachowujące sens
- Pominięcie mniej ważnych szczegółów
- Zmiana szyku zdania
- "jest niebezpieczne" vs "może być niebezpieczne" - OK
- Inna interpunkcja lub formatowanie
- Dodanie słów "także", "również", "ponadto" - OK
- Skrócenie lub rozwinięcie tekstu - OK
- Zmiana formy z cytatu na stwierdzenie faktu - OK
- Pominięcie słów takich jak "kolejne", "meteorologiczne" itp. - OK

# PROCEDURA:
1. Przeczytaj źródło CAŁE
2. Sprawdź czy GŁÓWNY PRZEKAZ podsumowania jest zgodny ze źródłem
3. Jeśli sens się zgadza - ZATWIERDŹ (is_valid: true)
4. Zgłoś TYLKO poważne błędy zmieniające fakty

# ODPOWIEDŹ JSON:

Jeśli podsumowanie jest OK (sens się zgadza):
{"is_valid": true, "errors": [], "claimsChecked": X, "claimsVerified": X, "claimsRejected": 0, "fabricatedClaims": []}

Jeśli są POWAŻNE błędy merytoryczne:
{
  "is_valid": false,
  "errors": ["Tylko poważny błąd - np. 'Zmieniona kwota z 15 mln na 20 mln'"],
  "claimsChecked": X,
  "claimsVerified": Y,
  "claimsRejected": Z,
  "fabricatedClaims": ["tylko całkowicie wymyślone informacje"]
}

BĄDŹ TOLERANCYJNY! Celem jest przepuszczenie dobrych podsumowań.
ODPOWIEDZ TYLKO CZYSTYM JSONEM:`;

    const verificationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: verificationPrompt }],
        max_tokens: 800,
        temperature: 0.1,
      }),
    });

    if (!verificationResponse.ok) {
      if (verificationResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", retryAfter: 5 }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI verification failed: ${verificationResponse.status}`);
    }

    const verificationData = await verificationResponse.json();
    const verificationText = verificationData.choices?.[0]?.message?.content || '';
    
    console.log(`Verification response: ${verificationText.substring(0, 300)}...`);

    // Parse JSON from response
    let verificationResult: any;
    try {
      const jsonMatch = verificationText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in verification response');
      }
    } catch (parseError) {
      console.error('Failed to parse verification result:', parseError);
      return new Response(
        JSON.stringify({
          isValid: false,
          status: 'pending',
          errors: ['Verification parsing failed'],
          verificationDetails: {
            claimsChecked: 0,
            claimsVerified: 0,
            claimsRejected: 0,
            fabricatedClaims: [],
          },
          rawResponse: verificationText,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check is_valid flag from AI response
    const isValid = verificationResult.is_valid === true || verificationResult.isValid === true;
    const errors = verificationResult.errors || [];
    
    // Filter out false positive errors (grammar differences, paraphrasing, etc.)
    const realErrors = errors.filter((error: string) => {
      const lowerError = error.toLowerCase();
      // Ignore false positives - grammar, formatting, paraphrasing
      const falsePositivePatterns = [
        'forma gramatyczna', 'odmiana', 'identyczne', 'takie samo',
        'stopni celsjusza', 'st. c', '°c', // temperature formatting
        'mln zł', 'milion', // money formatting
        'pomija słowo', 'pominięto', 'brak słowa', // minor omissions
        'zmiana formy', 'forma wypowiedzi', // speech form changes
        'uproszczenie', 'skrócenie', // simplification
        'stwierdzenie faktu', // indirect to direct speech
        'kolejne', 'meteorologiczne', // minor word omissions
        'dla formalności', // AI self-doubt
        'między innymi', 'w tym', // equivalent phrases
        'jest już', 'są już', // minor additions
        'zmiana kontekstu', 'kontekst', // context changes that keep meaning
        'powtórzenie', // repeated words
      ];
      
      for (const pattern of falsePositivePatterns) {
        if (lowerError.includes(pattern)) {
          console.log(`Filtering false positive error: ${error.substring(0, 100)}`);
          return false;
        }
      }
      return true;
    });

    const result: VerificationResult = {
      isValid: isValid || realErrors.length === 0,
      status: (isValid || realErrors.length === 0) ? 'verified' : 'rejected',
      errors: realErrors,
      verificationDetails: {
        claimsChecked: verificationResult.claimsChecked || 0,
        claimsVerified: verificationResult.claimsVerified || 0,
        claimsRejected: realErrors.length,
        fabricatedClaims: verificationResult.fabricatedClaims || [],
      },
    };

    // If rejected and we haven't exceeded retry limit, generate corrected summary
    if (!result.isValid && attemptNumber < 3 && realErrors.length > 0) {
      console.log(`Summary rejected with ${realErrors.length} real errors. Generating correction...`);
      
      const correctionPrompt = `# ZADANIE: Napisz poprawione podsumowanie artykułu

Poprzednie podsumowanie zawierało błędy:
${realErrors.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n')}

# ORYGINALNA TREŚĆ:
${originalContent.substring(0, 12000)}

# TYTUŁ: ${title}

# WYMAGANIA:
- 3-8 zdań podsumowania
- TYLKO fakty z oryginalnego tekstu
- **Pogrubienie** dla kluczowych informacji (nazwisk, liczb, dat)
- Nie dodawaj żadnych informacji spoza źródła

POPRAWIONE PODSUMOWANIE:`;

      const correctionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: correctionPrompt }],
          max_tokens: 500,
          temperature: 0.2,
        }),
      });

      if (correctionResponse.ok) {
        const correctionData = await correctionResponse.json();
        result.correctedSummary = correctionData.choices?.[0]?.message?.content || undefined;
        console.log(`Generated corrected summary, length: ${result.correctedSummary?.length || 0}`);
      }
    }

    console.log(`Verification complete. Status: ${result.status}, Valid: ${result.isValid}, Errors: ${realErrors.length}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('verify-summary error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isValid: false,
        status: 'pending',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
