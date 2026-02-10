
# Artykuly sponsorowane: pelna tresc + pozycjonowanie w feedzie

## Co sie zmieni

### 1. Artykuly sponsorowane pokazuja pelna tresc zamiast podsumowania AI
Na stronie artykulu (`/artykul/:id`), jesli artykul ma flage `is_sponsored = true`, zamiast komponentu `ArticleSummary` (podsumowanie AI) wyswietlona zostanie pelna tresc artykulu (`content`). Dotyczy to rowniez modalu podgladu (`ArticlePreviewModal`).

### 2. Pozycjonowanie sponsorowanych artykulow w feedzie
Artykuly sponsorowane moga pojawiac sie **od pozycji 4 wzwyz** w siatce na stronie glownej. Pozycje 1, 2 i 3 sa zarezerwowane wylacznie dla administratora (artykuly dodane recznie przez admina).

---

## Sekcja techniczna

### Krok 1: Rozszerzenie interfejsu Article o flage `is_sponsored`

**Plik: `src/hooks/use-articles.tsx`**
- Dodanie `is_sponsored` do interfejsu `Article` i zapytania SELECT
- Przekazanie flagi w `formatArticleForCard`

### Krok 2: Warunkowe wyswietlanie tresci na stronie artykulu

**Plik: `src/pages/Article.tsx`**
- Pobieranie flagi `is_sponsored` z danych artykulu (cache lub RSS)
- Jesli `is_sponsored === true`: wyswietlenie pelnej tresci (`content`) w formacie HTML/tekst zamiast komponentu `ArticleSummary`
- Jesli nie sponsorowany: zachowanie obecnego zachowania (podsumowanie AI)

### Krok 3: Warunkowe wyswietlanie w modalu podgladu

**Plik: `src/components/article/ArticlePreviewModal.tsx`**
- Dodanie propa `isSponsored` do interfejsu
- Jesli sponsorowany: wyswietlenie pelnej tresci zamiast generowania podsumowania AI

### Krok 4: Pozycjonowanie w feedzie

**Plik: `src/pages/Index.tsx`**
- Przy budowaniu siatki artykulow: artykuly z `is_sponsored = true` nie moga zajmowac pozycji 1-3 (indeksy 0-2)
- Logika: rozdzielenie artykulow na sponsorowane i regularne, wstawienie sponsorowanych dopiero od pozycji 4
- Pozycje 1-3 wypelniane wylacznie artykulami nie-sponsorowanymi (te sa kontrolowane przez admina)

### Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/hooks/use-articles.tsx` | Dodanie `is_sponsored` do interfejsu i query |
| `src/pages/Article.tsx` | Warunkowe: tresc sponsorowana vs AI summary |
| `src/components/article/ArticlePreviewModal.tsx` | Prop `isSponsored` + warunkowa tresc |
| `src/pages/Index.tsx` | Rezerwacja pozycji 1-3 dla admina, sponsorowane od 4+ |
| `src/components/news/NewsCard.tsx` | Przekazanie flagi `isSponsored` do localStorage cache |
