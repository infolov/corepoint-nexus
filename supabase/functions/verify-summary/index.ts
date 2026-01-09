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
    const verificationPrompt = `# ROLA: Moduł Kontroli Jakości Agregatora (Zero Fantazjowania)

Jesteś modułem kontroli jakości zintegrowanym z systemem agregatora. Twoim zadaniem jest RYGORYSTYCZNY AUDYT.

# KONTEKST OPERACYJNY:
Otrzymujesz obiekt zawierający current_summary oraz source_data. Twój jedyny cel to weryfikacja zgodności.

# INSTRUKCJE RYGORU (ZERO FANTAZJOWANIA):

## 1. WERYFIKACJA TOŻSAMOŚCI (CRITICAL):
- Sprawdź, czy KAŻDA osoba wymieniona w current_summary jest IDENTYCZNIE nazwana w source_data
- Jeśli w źródle jest "Jan Kowalski", a w podsumowaniu "Adam Kowalski" → CRITICAL_ERROR, ODRZUĆ
- Każda literówka w nazwisku = CRITICAL_ERROR

## 2. WERYFIKACJA LICZB (CRITICAL):
- Wyodrębnij WSZYSTKIE: daty, kwoty, procenty, statystyki, wartości liczbowe
- Porównaj ZNAK PO ZNAKU z source_data
- Jeśli JAKAKOLWIEK liczba różni się od tej w source_data → CRITICAL_ERROR, ODRZUĆ
- Przykład: źródło "15 mln zł" vs podsumowanie "15,5 mln zł" = CRITICAL_ERROR

## 3. ZAKAZ WZBOGACANIA (CRITICAL):
- NIE POZWALAJ na dodawanie kontekstu z wiedzy ogólnej AI
- Jeśli w źródle NIE MA informacji, że firma jest "liderem rynku", a podsumowanie tak twierdzi → ODRZUĆ
- Każda informacja BEZ bezpośredniego potwierdzenia w source_data = FABRYKACJA

## 4. ZAKAZ INTERPRETACJI:
- NIE POZWALAJ na wyciąganie wniosków, których autor NIE przedstawił
- NIE POZWALAJ na spekulacje, przypuszczenia, domysły
- NIE POZWALAJ na zmianę kontekstu lub tonu wypowiedzi

# PROCEDURA AUDYTU:
1. Dla KAŻDEGO zdania w current_summary:
   a) Znajdź DOKŁADNE potwierdzenie w source_data
   b) Jeśli brak potwierdzenia → mismatch_details += "FABRYKACJA: [treść]"
2. Dla KAŻDEJ liczby/daty/nazwy:
   a) Porównaj znak po znaku
   b) Jeśli różnica → mismatch_details += "CRITICAL_ERROR: [oczekiwane] vs [znalezione]"

# FORMAT ODPOWIEDZI (ŚCIŚLE JSON):
{
  "is_valid": true/false,
  "status": "verified" lub "rejected",
  "mismatch_details": [
    {
      "type": "CRITICAL_ERROR" | "FABRYKACJA" | "NADINTERPRETACJA" | "WZBOGACENIE",
      "claim_in_summary": "dokładna treść z podsumowania",
      "source_evidence": "dokładny cytat ze źródła lub null jeśli brak",
      "explanation": "krótkie wyjaśnienie problemu"
    }
  ],
  "claimsChecked": [liczba],
  "claimsVerified": [liczba],
  "claimsRejected": [liczba],
  "fabricatedClaims": ["lista sfabrykowanych twierdzeń"],
  "errors": ["lista błędów w formacie tekstowym"]
}

---

TYTUŁ ARTYKUŁU:
${title}

SOURCE_DATA (JEDYNE ŹRÓDŁO PRAWDY - SSOT):
${originalContent.substring(0, 15000)}

---

CURRENT_SUMMARY DO AUDYTU:
${aiSummary}

---

WYNIK AUDYTU (tylko JSON, żadnego dodatkowego tekstu):`;

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

    // Handle both is_valid and isValid for compatibility
    const isValid = verificationResult.is_valid === true || verificationResult.isValid === true;
    const statusValue = verificationResult.status === 'verified' ? 'verified' : 'rejected';

    const result: VerificationResult = {
      isValid: isValid && statusValue === 'verified',
      status: statusValue,
      errors: verificationResult.errors || 
        (verificationResult.mismatch_details || []).map((d: any) => 
          `[${d.type}] ${d.claim_in_summary} - ${d.explanation}`
        ),
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
