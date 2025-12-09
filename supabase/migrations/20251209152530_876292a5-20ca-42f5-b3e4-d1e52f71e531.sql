-- Insert News subcategories into sport_subcategories table (reusing for all category subcategories)
-- We'll use parent_category to distinguish between different main categories

-- 1. Polska
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Polska', 'polska', 'Wiadomości', 1),
('Polityka krajowa', 'polityka-krajowa', 'Polska', 1),
('Społeczeństwo', 'spoleczenstwo', 'Polska', 2),
('Samorządy', 'samorzady', 'Polska', 3),
('Służba zdrowia', 'sluzba-zdrowia', 'Polska', 4),
('Edukacja', 'edukacja', 'Polska', 5),
('Służby i bezpieczeństwo', 'sluzby-bezpieczenstwo', 'Polska', 6),
('Wypadki i zdarzenia', 'wypadki-zdarzenia', 'Polska', 7);

-- 2. Świat
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Świat', 'swiat', 'Wiadomości', 2),
('Europa', 'europa', 'Świat', 1),
('Ameryka Północna', 'ameryka-polnocna', 'Świat', 2),
('Ameryka Południowa', 'ameryka-poludniowa', 'Świat', 3),
('Azja', 'azja', 'Świat', 4),
('Afryka', 'afryka', 'Świat', 5),
('Bliski Wschód', 'bliski-wschod', 'Świat', 6),
('Konflikty zbrojne', 'konflikty-zbrojne', 'Świat', 7),
('Geopolityka', 'geopolityka', 'Świat', 8);

-- 3. Polityka
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Polityka', 'polityka', 'Wiadomości', 3),
('Wybory', 'wybory', 'Polityka', 1),
('Partie polityczne', 'partie-polityczne', 'Polityka', 2),
('Parlament / Sejm / Senat', 'parlament', 'Polityka', 3),
('Rząd i ministrowie', 'rzad-ministrowie', 'Polityka', 4),
('Polityka międzynarodowa', 'polityka-miedzynarodowa', 'Polityka', 5),
('Dyplomacja', 'dyplomacja', 'Polityka', 6);

-- 4. Biznes & Gospodarka
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Biznes & Gospodarka', 'biznes-gospodarka', 'Wiadomości', 4),
('Rynek pracy', 'rynek-pracy', 'Biznes & Gospodarka', 1),
('Inflacja i ceny', 'inflacja-ceny', 'Biznes & Gospodarka', 2),
('Prawo i podatki', 'prawo-podatki-biznes', 'Biznes & Gospodarka', 3),
('Firmy i korporacje', 'firmy-korporacje', 'Biznes & Gospodarka', 4),
('Raporty ekonomiczne', 'raporty-ekonomiczne', 'Biznes & Gospodarka', 5),
('Inwestycje publiczne', 'inwestycje-publiczne', 'Biznes & Gospodarka', 6),
('Energetyka', 'energetyka', 'Biznes & Gospodarka', 7);

-- 5. Finanse
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Finanse', 'finanse', 'Wiadomości', 5),
('Banki', 'banki', 'Finanse', 1),
('Podatki i prawo', 'podatki-prawo', 'Finanse', 2),
('Giełda', 'gielda', 'Finanse', 3),
('Waluty', 'waluty', 'Finanse', 4),
('Kryptowaluty', 'kryptowaluty', 'Finanse', 5),
('Kredyty i pożyczki', 'kredyty-pozyczki', 'Finanse', 6),
('Oszczędzanie', 'oszczedzanie', 'Finanse', 7);

-- 6. Nauka
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Nauka', 'nauka', 'Wiadomości', 6),
('Badania i odkrycia', 'badania-odkrycia', 'Nauka', 1),
('Kosmos', 'kosmos', 'Nauka', 2),
('Medycyna', 'medycyna', 'Nauka', 3),
('Technologia naukowa', 'technologia-naukowa', 'Nauka', 4);

-- 7. Technologia
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Technologia', 'technologia', 'Wiadomości', 7),
('AI / sztuczna inteligencja', 'ai-sztuczna-inteligencja', 'Technologia', 1),
('Nowe technologie', 'nowe-technologie', 'Technologia', 2),
('Urządzenia i sprzęt', 'urzadzenia-sprzet', 'Technologia', 3),
('Internet i cyberbezpieczeństwo', 'internet-cyberbezpieczenstwo', 'Technologia', 4),
('Social media', 'social-media', 'Technologia', 5);

-- 8. Pogoda
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Pogoda', 'pogoda', 'Wiadomości', 8),
('Prognozy', 'prognozy', 'Pogoda', 1),
('Ostrzeżenia meteorologiczne', 'ostrzezenia-meteorologiczne', 'Pogoda', 2),
('Katastrofy naturalne', 'katastrofy-naturalne', 'Pogoda', 3);

-- 9. Opinie i komentarze
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Opinie i komentarze', 'opinie-komentarze', 'Wiadomości', 9),
('Publicystyka', 'publicystyka', 'Opinie i komentarze', 1),
('Felietony', 'felietony', 'Opinie i komentarze', 2),
('Analizy', 'analizy', 'Opinie i komentarze', 3);

-- 10. Reportaże i artykuły specjalne
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Reportaże i artykuły specjalne', 'reportaze-artykuly-specjalne', 'Wiadomości', 10),
('Długie formy', 'dlugie-formy', 'Reportaże i artykuły specjalne', 1),
('Wywiady', 'wywiady', 'Reportaże i artykuły specjalne', 2),
('Historie ludzi', 'historie-ludzi', 'Reportaże i artykuły specjalne', 3);