import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { batchSize = 20, dryRun = false } = await req.json();

    console.log(`Starting batch reverification. Batch size: ${batchSize}, Dry run: ${dryRun}`);

    // Fetch rejected articles
    const { data: rejectedArticles, error: fetchError } = await supabase
      .from('processed_articles')
      .select('id, title, ai_summary, full_content')
      .eq('ai_verification_status', 'rejected')
      .not('ai_summary', 'is', null)
      .not('full_content', 'is', null)
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    console.log(`Found ${rejectedArticles?.length || 0} rejected articles to reverify`);

    if (!rejectedArticles || rejectedArticles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No rejected articles to reverify",
          processed: 0,
          verified: 0,
          stillRejected: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({ 
          message: "Dry run - would process these articles",
          count: rejectedArticles.length,
          articles: rejectedArticles.map(a => ({ id: a.id, title: a.title?.substring(0, 50) }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let verified = 0;
    let stillRejected = 0;
    let errors = 0;
    const results: any[] = [];

    // Process articles one by one with delay to avoid rate limits
    for (const article of rejectedArticles) {
      try {
        console.log(`Verifying: ${article.title?.substring(0, 50)}...`);

        // Call verify-summary function
        const verificationPrompt = `# ROLA: Tolerancyjny Redaktor Weryfikacyjny

Jesteś życzliwym redaktorem sprawdzającym podsumowania. Twoim celem jest przepuszczenie poprawnych podsumowań, a nie szukanie błędów na siłę.

# ORYGINALNA TREŚĆ ARTYKUŁU:
${article.full_content?.substring(0, 15000)}

# PODSUMOWANIE DO WERYFIKACJI:
${article.ai_summary}

# TYTUŁ: ${article.title}

# FILOZOFIA WERYFIKACJI:
Podsumowanie jest DOBRE jeśli oddaje GŁÓWNY SENS artykułu. Nie szukaj drobnych różnic!

# JEDYNE PRAWDZIWE BŁĘDY TO:
1. **Zmieniona liczba** - np. "15" zamienione na "20" (ale "15 mln" = "piętnaście milionów" to OK)
2. **Przekręcone nazwisko** - np. "Kowalski" → "Nowalski" (ale "Kowalski" → "Kowalskiego" to OK!)
3. **Wymyślona informacja** - coś czego KOMPLETNIE nie ma w źródle
4. **Odwrócony sens** - np. "wygrał" zamiast "przegrał"

# TO NIE SĄ BŁĘDY - IGNORUJ:
- Różnice w formatowaniu temperatur, kwot, dat
- Odmiany gramatyczne (Hurkacz/Hurkacza)
- Parafrazy zachowujące sens
- Pominięcie mniej ważnych szczegółów
- Zmiana formy z cytatu na stwierdzenie faktu
- Drobne pominięcia słów

# ODPOWIEDŹ JSON:
{"is_valid": true/false, "errors": [], "claimsChecked": X, "claimsVerified": X, "claimsRejected": 0}

BĄDŹ TOLERANCYJNY! ODPOWIEDZ TYLKO CZYSTYM JSONEM:`;

        const verificationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: verificationPrompt }],
            max_tokens: 500,
            temperature: 0.1,
          }),
        });

        if (!verificationResponse.ok) {
          if (verificationResponse.status === 429) {
            console.log('Rate limited, stopping batch');
            break;
          }
          throw new Error(`AI verification failed: ${verificationResponse.status}`);
        }

        const verificationData = await verificationResponse.json();
        const verificationText = verificationData.choices?.[0]?.message?.content || '';
        
        // Parse result
        let isValid = false;
        let realErrors: string[] = [];
        
        try {
          const jsonMatch = verificationText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            isValid = parsed.is_valid === true || parsed.isValid === true;
            
            // Filter false positives - ensure errors are strings
            const errors = (parsed.errors || []).filter((e: any) => typeof e === 'string');
            realErrors = errors.filter((error: string) => {
              const lowerError = error.toLowerCase();
              const falsePositivePatterns = [
                'forma gramatyczna', 'odmiana', 'identyczne', 'takie samo',
                'stopni celsjusza', 'st. c', '°c', 'mln zł', 'milion',
                'pomija słowo', 'pominięto', 'brak słowa', 'zmiana formy',
                'forma wypowiedzi', 'uproszczenie', 'skrócenie', 'stwierdzenie faktu',
                'kolejne', 'meteorologiczne', 'dla formalności', 'między innymi',
                'w tym', 'jest już', 'są już', 'zmiana kontekstu', 'kontekst', 'powtórzenie'
              ];
              for (const pattern of falsePositivePatterns) {
                if (lowerError.includes(pattern)) return false;
              }
              return true;
            });
            
            isValid = isValid || realErrors.length === 0;
          }
        } catch (e) {
          console.error('Parse error:', e);
        }

        const newStatus = isValid ? 'verified' : 'rejected';
        
        // Update article status
        const { error: updateError } = await supabase
          .from('processed_articles')
          .update({ 
            ai_verification_status: newStatus,
            verification_logs: [{
              attempt: 1,
              timestamp: new Date().toISOString(),
              status: newStatus,
              errors: realErrors,
              details: { reVerified: true }
            }]
          })
          .eq('id', article.id);

        if (updateError) {
          console.error(`Failed to update article ${article.id}:`, updateError);
          errors++;
        } else {
          if (isValid) {
            verified++;
            console.log(`✅ VERIFIED: ${article.title?.substring(0, 40)}`);
          } else {
            stillRejected++;
            console.log(`❌ Still rejected: ${article.title?.substring(0, 40)} - ${realErrors.length} errors`);
          }
        }

        results.push({
          id: article.id,
          title: article.title?.substring(0, 50),
          newStatus,
          errors: realErrors.length
        });

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (articleError) {
        console.error(`Error processing article ${article.id}:`, articleError);
        errors++;
      }
    }

    const summary = {
      message: "Batch reverification complete",
      processed: rejectedArticles.length,
      verified,
      stillRejected,
      errors,
      verificationRate: `${Math.round((verified / rejectedArticles.length) * 100)}%`,
      results
    };

    console.log(`Batch complete: ${verified} verified, ${stillRejected} still rejected, ${errors} errors`);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('batch-reverify error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
