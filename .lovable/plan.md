

# Naprawa podsumowań AI + zmiana klucza Firecrawl

## Zdiagnozowane problemy

### 1. Obcięte podsumowania (KRYTYCZNY BUG)
Logi edge function potwierdzają przyczynę:
- Gemini 2.5 Flash zużywa tokeny na "myślenie" (thinking), które liczą się do limitu `maxOutputTokens: 1200`
- Po "myśleniu" zostaje za mało tokenów na odpowiedź -- JSON jest obcinany w połowie
- Regex `/\{[\s\S]*\}/` nie znajduje zamykającego `}`, parsing się wysypuje
- Do bazy trafia surowy, obcięty tekst zamiast czystego podsumowania
- Wszystkie ostatnie wpisy w `article_summaries` zawierają uszkodzone dane (podwójnie zagnieżdżony, obcięty JSON)

### 2. Klucz Firecrawl
Użytkownik chce zmienić klucz API. Obecny sekret nosi nazwę `Firecrawl_API_KEY`.

---

## Plan naprawy

### Krok 1: Zmiana klucza Firecrawl
Użycie narzędzia do aktualizacji sekretu `Firecrawl_API_KEY` -- użytkownik zostanie poproszony o podanie nowej wartości.

### Krok 2: Naprawa edge function `summarize-article`
Zmiany w `supabase/functions/summarize-article/index.ts`:

**a) Zwiększenie limitu tokenów i wyłączenie "thinking":**
- Zwiększenie `maxOutputTokens` z 1200 na 4096
- Dodanie `thinkingConfig: { thinkingBudget: 0 }` aby Gemini nie zużywał tokenów na wewnętrzne rozumowanie (to prosta generacja JSON, thinking nie jest potrzebny)

**b) Wzmocnienie parsowania odpowiedzi AI:**
- Dodanie fallbacku: jeśli regex nie znajdzie kompletnego JSON, próba naprawy przez dołączenie brakujących znaków `"}`
- Lepsze logowanie surowej odpowiedzi do debugowania

### Krok 3: Czyszczenie uszkodzonego cache
Uruchomienie migracji SQL, która usunie wszystkie uszkodzone wpisy z tabeli `article_summaries` (te zawierające zagnieżdżony JSON w polu `summary`). Dzięki temu podsumowania zostaną wygenerowane od nowa w poprawnym formacie.

```sql
DELETE FROM article_summaries 
WHERE summary LIKE '%"summary": "{%'
   OR summary LIKE '%\"summary\": \"{%';
```

### Krok 4: Test end-to-end
Wywołanie edge function z artykułem testowym i weryfikacja, że:
- JSON jest kompletny (nie obcięty)
- Podsumowanie jest czytelnym tekstem, a nie surowym JSON
- Cache zapisuje poprawne dane

---

## Sekcja techniczna

### Zmiana w konfiguracji Gemini (kluczowa poprawka)
```typescript
// PRZED (bug):
generationConfig: {
  maxOutputTokens: 1200,
  temperature: 0,
}

// PO (poprawka):
generationConfig: {
  maxOutputTokens: 4096,
  temperature: 0,
  thinkingConfig: { thinkingBudget: 0 },
}
```

### Pliki do zmiany
| Plik | Zmiana |
|------|--------|
| `supabase/functions/summarize-article/index.ts` | Zwiększenie tokenów, wyłączenie thinking, lepszy parsing |
| Migracja SQL | Usunięcie uszkodzonych wpisów cache |
| Sekret `Firecrawl_API_KEY` | Aktualizacja wartości klucza |

