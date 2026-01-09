import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  title: string;
  originalContent: string;  // Single Source of Truth
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
    const verificationPrompt = `# ROLA: Fact-Checker / Weryfikator faktów

Jesteś profesjonalnym fact-checkerem pracującym dla renomowanej agencji prasowej. Twoim zadaniem jest RYGORYSTYCZNA weryfikacja podsumowania artykułu.

# ZASADA NADRZĘDNA - Single Source of Truth (SSOT):
ORYGINALNA TREŚĆ ARTYKUŁU jest JEDYNYM źródłem prawdy. Każda informacja w podsumowaniu MUSI mieć bezpośrednie potwierdzenie w oryginalnym tekście.

# KRYTERIA ODRZUCENIA (każde z poniższych skutkuje statusem REJECTED):
1. FABRYKACJA: Informacja w podsumowaniu nie występuje w oryginalnym tekście
2. PRZEKŁAMANIE: Liczby, daty, nazwiska, nazwy miejsc różnią się od oryginału
3. NADINTERPRETACJA: Wyciąganie wniosków, których autor artykułu nie przedstawił
4. SPEKULACJA: Dodawanie przypuszczeń niewystępujących w źródle
5. ZMIANA KONTEKSTU: Przedstawienie informacji w innym kontekście niż w oryginale

# INSTRUKCJA ANALIZY:
1. Zidentyfikuj KAŻDE stwierdzenie faktyczne w podsumowaniu
2. Znajdź DOKŁADNE potwierdzenie w oryginalnym tekście
3. Jeśli nie można znaleźć potwierdzenia - oznacz jako FABRYKACJA

# FORMAT ODPOWIEDZI (ŚCIŚLE JSON):
{
  "isValid": true/false,
  "status": "verified" lub "rejected",
  "claimsChecked": [liczba sprawdzonych twierdzeń],
  "claimsVerified": [liczba zweryfikowanych pozytywnie],
  "claimsRejected": [liczba odrzuconych],
  "fabricatedClaims": ["lista sfabrykowanych/nieprawdziwych twierdzeń"],
  "errors": ["lista wszystkich błędów znalezionych w podsumowaniu"]
}

---

TYTUŁ ARTYKUŁU:
${title}

ORYGINALNA TREŚĆ (SSOT - Single Source of Truth):
${originalContent.substring(0, 15000)}

---

PODSUMOWANIE DO WERYFIKACJI:
${aiSummary}

---

WYNIK WERYFIKACJI (tylko JSON):`;

    const verificationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: verificationPrompt }],
        max_tokens: 1000,
        temperature: 0,
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
    
    console.log(`Verification response: ${verificationText.substring(0, 500)}...`);

    // Parse JSON from response
    let verificationResult: any;
    try {
      // Extract JSON from response (might be wrapped in markdown)
      const jsonMatch = verificationText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in verification response');
      }
    } catch (parseError) {
      console.error('Failed to parse verification result:', parseError);
      // Default to pending if can't parse
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

    const result: VerificationResult = {
      isValid: verificationResult.isValid === true && verificationResult.status === 'verified',
      status: verificationResult.status === 'verified' ? 'verified' : 'rejected',
      errors: verificationResult.errors || [],
      verificationDetails: {
        claimsChecked: verificationResult.claimsChecked || 0,
        claimsVerified: verificationResult.claimsVerified || 0,
        claimsRejected: verificationResult.claimsRejected || 0,
        fabricatedClaims: verificationResult.fabricatedClaims || [],
      },
    };

    // If rejected and we haven't exceeded retry limit, generate corrected summary
    if (!result.isValid && attemptNumber < 3) {
      console.log(`Summary rejected. Generating correction (attempt ${attemptNumber + 1})...`);
      
      const correctionPrompt = `# ROLA: Profesjonalny redaktor

Poprzednie podsumowanie artykułu zostało ODRZUCONE przez system fact-checking z powodu następujących błędów:

BŁĘDY WYKRYTE:
${result.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

SFABRYKOWANE TWIERDZENIA (informacje NIE występujące w oryginalnym tekście):
${result.verificationDetails.fabricatedClaims.map((c, i) => `${i + 1}. ${c}`).join('\n') || 'Brak'}

# ZADANIE:
Napisz NOWE, POPRAWIONE podsumowanie, które:
1. Zawiera WYŁĄCZNIE informacje z oryginalnego tekstu
2. NIE zawiera żadnych sfabrykowanych informacji
3. Koryguje wszystkie wykryte błędy
4. Zachowuje format: 3-10 zdań, **pogrubienia** dla kluczowych informacji

# ORYGINALNA TREŚĆ (JEDYNE ŹRÓDŁO PRAWDY):
${originalContent.substring(0, 12000)}

# TYTUŁ:
${title}

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
          max_tokens: 600,
          temperature: 0,
        }),
      });

      if (correctionResponse.ok) {
        const correctionData = await correctionResponse.json();
        result.correctedSummary = correctionData.choices?.[0]?.message?.content || undefined;
        console.log(`Generated corrected summary, length: ${result.correctedSummary?.length || 0}`);
      }
    }

    console.log(`Verification complete. Status: ${result.status}, Valid: ${result.isValid}`);

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
