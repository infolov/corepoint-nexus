

# Usuniecie nieaktywnego zrodla RSS biznes.interia.pl

## Co sie zmieni

Zrodlo RSS **Interia Biznes** (`https://biznes.interia.pl/rss`) zwraca blad 404, co oznacza ze feed nie jest juz dostepny. Zostanie ono usuniete z tabeli `rss_sources` w bazie danych.

## Sekcja techniczna

### Operacja

Usuniecie jednego rekordu z tabeli `rss_sources`:

- **ID**: `e4bc1bc8-28ba-49ae-9d30-fbce41953a96`
- **Nazwa**: Interia Biznes
- **URL**: `https://biznes.interia.pl/rss`
- **Status**: aktywne (ale zwraca 404)

Wykonana zostanie operacja SQL:
```text
DELETE FROM rss_sources WHERE id = 'e4bc1bc8-28ba-49ae-9d30-fbce41953a96';
```

Zadne pliki kodu nie wymagaja zmian - zrodla RSS sa pobierane dynamicznie z bazy.

