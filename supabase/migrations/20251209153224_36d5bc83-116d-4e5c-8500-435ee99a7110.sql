-- Biznes subcategories
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Finanse osobiste', 'finanse-osobiste', 'Biznes', 1),
('Budżetowanie', 'budzetowanie', 'Finanse osobiste', 1),
('Oszczędzanie', 'oszczedzanie-biznes', 'Finanse osobiste', 2),
('Inwestowanie', 'inwestowanie', 'Finanse osobiste', 3),
('Emerytury', 'emerytury', 'Finanse osobiste', 4),

('Rynki finansowe', 'rynki-finansowe', 'Biznes', 2),
('Giełda polska', 'gielda-polska', 'Rynki finansowe', 1),
('Giełdy światowe', 'gieldy-swiatowe', 'Rynki finansowe', 2),
('Surowce', 'surowce', 'Rynki finansowe', 3),
('Obligacje', 'obligacje', 'Rynki finansowe', 4),

('Przedsiębiorczość', 'przedsiebiorczosc', 'Biznes', 3),
('Startupy', 'startupy', 'Przedsiębiorczość', 1),
('Własny biznes', 'wlasny-biznes', 'Przedsiębiorczość', 2),
('Franczyza', 'franczyza', 'Przedsiębiorczość', 3),
('E-commerce', 'e-commerce', 'Przedsiębiorczość', 4),

('Kariera', 'kariera', 'Biznes', 4),
('Rynek pracy', 'rynek-pracy-biznes', 'Kariera', 1),
('Wynagrodzenia', 'wynagrodzenia', 'Kariera', 2),
('Rozwój zawodowy', 'rozwoj-zawodowy', 'Kariera', 3),
('Rekrutacja', 'rekrutacja', 'Kariera', 4),

('Nieruchomości', 'nieruchomosci', 'Biznes', 5),
('Rynek mieszkaniowy', 'rynek-mieszkaniowy', 'Nieruchomości', 1),
('Kredyty hipoteczne', 'kredyty-hipoteczne', 'Nieruchomości', 2),
('Wynajem', 'wynajem', 'Nieruchomości', 3),
('Inwestycje w nieruchomości', 'inwestycje-nieruchomosci', 'Nieruchomości', 4);

-- Lifestyle subcategories
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Zdrowie', 'zdrowie', 'Lifestyle', 1),
('Dieta i odżywianie', 'dieta-odzywanie', 'Zdrowie', 1),
('Fitness', 'fitness', 'Zdrowie', 2),
('Zdrowie psychiczne', 'zdrowie-psychiczne', 'Zdrowie', 3),
('Medycyna naturalna', 'medycyna-naturalna', 'Zdrowie', 4),

('Uroda', 'uroda', 'Lifestyle', 2),
('Pielęgnacja', 'pielegnacja', 'Uroda', 1),
('Makijaż', 'makijaz', 'Uroda', 2),
('Włosy', 'wlosy', 'Uroda', 3),
('Trendy beauty', 'trendy-beauty', 'Uroda', 4),

('Moda', 'moda', 'Lifestyle', 3),
('Trendy', 'trendy-moda', 'Moda', 1),
('Street style', 'street-style', 'Moda', 2),
('Luksus', 'luksus', 'Moda', 3),
('Sustainable fashion', 'sustainable-fashion', 'Moda', 4),

('Dom i wnętrza', 'dom-wnetrza', 'Lifestyle', 4),
('Aranżacje', 'aranzacje', 'Dom i wnętrza', 1),
('DIY', 'diy', 'Dom i wnętrza', 2),
('Ogród', 'ogrod', 'Dom i wnętrza', 3),
('Smart home', 'smart-home', 'Dom i wnętrza', 4),

('Podróże', 'podroze', 'Lifestyle', 5),
('Polska', 'podroze-polska', 'Podróże', 1),
('Europa', 'podroze-europa', 'Podróże', 2),
('Egzotyka', 'egzotyka', 'Podróże', 3),
('Porady podróżnicze', 'porady-podroznicze', 'Podróże', 4),

('Kuchnia', 'kuchnia', 'Lifestyle', 6),
('Przepisy', 'przepisy', 'Kuchnia', 1),
('Restauracje', 'restauracje', 'Kuchnia', 2),
('Kuchnie świata', 'kuchnie-swiata', 'Kuchnia', 3),
('Wino i alkohole', 'wino-alkohole', 'Kuchnia', 4),

('Rodzina', 'rodzina', 'Lifestyle', 7),
('Dzieci', 'dzieci', 'Rodzina', 1),
('Wychowanie', 'wychowanie', 'Rodzina', 2),
('Związki', 'zwiazki', 'Rodzina', 3),
('Edukacja domowa', 'edukacja-domowa', 'Rodzina', 4);

-- Rozrywka subcategories
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
('Film', 'film', 'Rozrywka', 1),
('Nowości kinowe', 'nowosci-kinowe', 'Film', 1),
('Recenzje filmów', 'recenzje-filmow', 'Film', 2),
('Seriale', 'seriale', 'Film', 3),
('Streaming', 'streaming', 'Film', 4),
('Klasyki', 'klasyki-film', 'Film', 5),

('Muzyka', 'muzyka', 'Rozrywka', 2),
('Nowości muzyczne', 'nowosci-muzyczne', 'Muzyka', 1),
('Koncerty i festiwale', 'koncerty-festiwale', 'Muzyka', 2),
('Wywiady z artystami', 'wywiady-artysci', 'Muzyka', 3),
('Rankingi i playlisty', 'rankingi-playlisty', 'Muzyka', 4),

('Gry', 'gry', 'Rozrywka', 3),
('Gry PC', 'gry-pc', 'Gry', 1),
('Konsole', 'konsole', 'Gry', 2),
('Gry mobilne', 'gry-mobilne', 'Gry', 3),
('Nowości i zapowiedzi', 'nowosci-gry', 'Gry', 4),
('Recenzje gier', 'recenzje-gier', 'Gry', 5),

('Celebryci', 'celebryci', 'Rozrywka', 4),
('Polscy celebryci', 'polscy-celebryci', 'Celebryci', 1),
('Hollywood', 'hollywood', 'Celebryci', 2),
('Plotki', 'plotki', 'Celebryci', 3),
('Wywiady', 'wywiady-celebryci', 'Celebryci', 4),

('TV', 'tv', 'Rozrywka', 5),
('Programy rozrywkowe', 'programy-rozrywkowe', 'TV', 1),
('Reality show', 'reality-show', 'TV', 2),
('Talk show', 'talk-show', 'TV', 3),
('Dokumenty', 'dokumenty', 'TV', 4),

('Książki', 'ksiazki', 'Rozrywka', 6),
('Bestsellery', 'bestsellery', 'Książki', 1),
('Recenzje książek', 'recenzje-ksiazek', 'Książki', 2),
('Wywiady z autorami', 'wywiady-autorzy', 'Książki', 3),
('Audiobooki', 'audiobooki', 'Książki', 4),

('Wydarzenia', 'wydarzenia', 'Rozrywka', 7),
('Premiery', 'premiery', 'Wydarzenia', 1),
('Gale i nagrody', 'gale-nagrody', 'Wydarzenia', 2),
('Festiwale', 'festiwale', 'Wydarzenia', 3),
('Eventy kulturalne', 'eventy-kulturalne', 'Wydarzenia', 4);