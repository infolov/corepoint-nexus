

# Rozbudowa preferencji feedu: Wszystkie / Lokalne / Sport

## Cel
Zamiana obecnego suwaka 2-kategoriowego (Lokalne/Sport) na system 3 kategorii: **Wszystkie** (wiadomosci ogolne), **Lokalne**, **Sport** -- razem sumujace sie do 100%.

## Obecny stan
- Suwak w panelu uzytkownika pozwala ustawic proporcje Lokalne/Sport (domyslnie 60/40)
- Baza danych przechowuje `local_ratio` i `sport_ratio` w tabeli `user_notification_preferences`
- Feed interleaving jest **wylaczony** (zakomentowany w Index.tsx) -- artykuly nie sa mieszane wedlug proporcji
- Brak kolumny na "ogolne" wiadomosci w bazie

## Plan zmian

### 1. Migracja bazy danych
Dodanie kolumny `general_ratio` (domyslnie 40) do tabeli `user_notification_preferences`. Aktualizacja istniejacych rekordow tak, aby suma trzech wartosci wynosila 100 (np. domyslnie: Wszystkie 40%, Lokalne 35%, Sport 25%).

```sql
ALTER TABLE user_notification_preferences
  ADD COLUMN general_ratio integer NOT NULL DEFAULT 40;

-- Przeliczenie istniejacych rekordow:
-- local_ratio + sport_ratio = 100 -> rozdzielamy na 3 czesci
UPDATE user_notification_preferences
SET general_ratio = 40,
    local_ratio = 35,
    sport_ratio = 25;
```

### 2. Hook `use-content-ratio.tsx`
- Rozszerzenie interfejsu `ContentRatioPreferences` o pole `generalRatio`
- Zmiana domyslnych wartosci: `{ generalRatio: 40, localRatio: 35, sportRatio: 25 }`
- Nowa funkcja `setRatios(general, local, sport)` zamiast `setLocalRatio`
- Walidacja: suma musi wynosic 100
- Zapis/odczyt `general_ratio` z bazy danych
- Aktualizacja helpera `interleaveArticlesByRatio` do obslugi 3 kategorii

### 3. Komponent `ContentRatioSlider.tsx` -- nowy UI
Zamiana jednego suwaka na trzy niezalezne kontrolki (np. suwaki lub pola numeryczne), ktore razem sumuja sie do 100%.

Proponowany uklad:
- Trzy wiersze, kazdy z ikona, nazwa kategorii i suwakiem
  - Newspaper icon + "Wszystkie" + suwak + wartosc %
  - MapPin icon + "Lokalne" + suwak + wartosc %
  - Trophy icon + "Sport" + suwak + wartosc %
- Pasek wizualizacji (3 kolory) na dole
- Logika: przy zmianie jednego suwaka, pozostale dwa dostosowuja sie proporcjonalnie (zachowujac wzajemna proporcje)

### 4. Aktywacja feed interleaving w `Index.tsx`
Odkomentowanie i rozbudowa logiki mieszania artykulow:
- Pula "Wszystkie": artykuly nie-lokalne i nie-sportowe (Wiadomosci, Biznes, Technologia, itd.)
- Pula "Lokalne": artykuly z regionu uzytkownika (lub krajowe jako fallback)
- Pula "Sport": artykuly z kategorii Sport
- Mieszanie wedlug proporcji z preferencji uzytkownika
- Nowa funkcja `interleaveThreeWay(generalArticles, localArticles, sportArticles, ratios)`

### 5. Helper interleaving (`use-content-ratio.tsx`)
Nowa funkcja `interleaveArticlesByThreeRatios`:

```text
interleaveArticlesByThreeRatios(
  generalArticles,
  localArticles,
  sportArticles,
  targetCount,
  { generalRatio, localRatio, sportRatio }
)
```

Algorytm: oblicza ile artykulow z kazdej puli, a nastepnie przeplata je rownomiernie.

## Sekcja techniczna

### Pliki do zmiany
| Plik | Zmiana |
|------|--------|
| Migracja SQL | Dodanie kolumny `general_ratio` |
| `src/hooks/use-content-ratio.tsx` | Rozszerzenie o `generalRatio`, nowy interleaver 3-kategoriowy |
| `src/components/settings/ContentRatioSlider.tsx` | Nowy UI z trzema suwakami, logika wyrownywania do 100% |
| `src/pages/Index.tsx` | Aktywacja interleaved feed z 3 pulami artykulow |

### Logika wyrownywania suwaków
Gdy uzytkownik zmienia wartosc jednego suwaka:
1. Oblicz reszte: `remaining = 100 - zmienionaWartosc`
2. Przelicz dwa pozostale proporcjonalnie do ich obecnych wartosci
3. Jesli oba pozostale sa na 0, rozdziel reszte rowno
4. Zaokraglij do pelnych liczb, korygujac ewentualna roznice (zeby suma = 100)

### Domyslne wartosci
- Wszystkie: 40%
- Lokalne: 35%
- Sport: 25%

