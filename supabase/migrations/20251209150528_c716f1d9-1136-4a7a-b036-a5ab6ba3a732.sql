-- Create sport_subcategories table
CREATE TABLE public.sport_subcategories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    parent_category text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sport_subcategories ENABLE ROW LEVEL SECURITY;

-- Anyone can view active subcategories
CREATE POLICY "Anyone can view active subcategories"
ON public.sport_subcategories
FOR SELECT
USING (is_active = true);

-- Admins can manage subcategories
CREATE POLICY "Admins can manage subcategories"
ON public.sport_subcategories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user_recently_viewed table to track article views
CREATE TABLE public.user_recently_viewed (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    category text NOT NULL,
    viewed_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, article_id)
);

-- Enable RLS
ALTER TABLE public.user_recently_viewed ENABLE ROW LEVEL SECURITY;

-- Users can view own history
CREATE POLICY "Users can view own history"
ON public.user_recently_viewed
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own history
CREATE POLICY "Users can insert own history"
ON public.user_recently_viewed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete own history
CREATE POLICY "Users can delete own history"
ON public.user_recently_viewed
FOR DELETE
USING (auth.uid() = user_id);

-- Add subcategory to articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS subcategory text;

-- Insert sport subcategories
INSERT INTO public.sport_subcategories (name, slug, parent_category, display_order) VALUES
-- Piłka nożna
('Piłka nożna', 'pilka-nozna', NULL, 1),
('Ekstraklasa', 'ekstraklasa', 'pilka-nozna', 2),
('Premier League', 'premier-league', 'pilka-nozna', 3),
('La Liga', 'la-liga', 'pilka-nozna', 4),
('Serie A', 'serie-a', 'pilka-nozna', 5),
('Bundesliga', 'bundesliga', 'pilka-nozna', 6),
('Ligue 1', 'ligue-1', 'pilka-nozna', 7),
('Liga Mistrzów', 'liga-mistrzow', 'pilka-nozna', 8),
('Liga Europy', 'liga-europy', 'pilka-nozna', 9),
('Reprezentacje', 'reprezentacje-pilka', 'pilka-nozna', 10),
('Transfery', 'transfery', 'pilka-nozna', 11),
('Wyniki na żywo', 'wyniki-na-zywo', 'pilka-nozna', 12),

-- Koszykówka
('Koszykówka', 'koszykowka', NULL, 13),
('NBA', 'nba', 'koszykowka', 14),
('Euroliga', 'euroliga', 'koszykowka', 15),
('Polska Liga Koszykówki', 'plk', 'koszykowka', 16),
('Reprezentacje', 'reprezentacje-kosz', 'koszykowka', 17),

-- Siatkówka
('Siatkówka', 'siatkowka', NULL, 18),
('PlusLiga', 'plusliga', 'siatkowka', 19),
('Liga Mistrzów w siatkówce', 'liga-mistrzow-siatkowka', 'siatkowka', 20),
('Reprezentacje', 'reprezentacje-siatkowka', 'siatkowka', 21),

-- Tenis
('Tenis', 'tenis', NULL, 22),
('ATP', 'atp', 'tenis', 23),
('WTA', 'wta', 'tenis', 24),
('Wielki Szlem', 'wielki-szlem', 'tenis', 25),
('Rankingi', 'rankingi-tenis', 'tenis', 26),

-- Sporty Motorowe
('Sporty Motorowe', 'sporty-motorowe', NULL, 27),
('F1', 'f1', 'sporty-motorowe', 28),
('MotoGP', 'motogp', 'sporty-motorowe', 29),
('Rajdy (WRC)', 'wrc', 'sporty-motorowe', 30),
('Żużel', 'zuzel', 'sporty-motorowe', 31),

-- Sporty Walki
('Sporty Walki', 'sporty-walki', NULL, 32),
('MMA (UFC, KSW)', 'mma', 'sporty-walki', 33),
('Boks', 'boks', 'sporty-walki', 34),

-- Hokej
('Hokej', 'hokej', NULL, 35),
('NHL', 'nhl', 'hokej', 36),
('Europejskie ligi', 'hokej-europa', 'hokej', 37),
('Reprezentacje', 'reprezentacje-hokej', 'hokej', 38),

-- Lekkoatletyka
('Lekkoatletyka', 'lekkoatletyka', NULL, 39),
('Mistrzostwa Europy', 'me-lekkoatletyka', 'lekkoatletyka', 40),
('Mistrzostwa Świata', 'ms-lekkoatletyka', 'lekkoatletyka', 41),
('Diamentowa Liga', 'diamentowa-liga', 'lekkoatletyka', 42),

-- Sporty Zimowe
('Sporty Zimowe', 'sporty-zimowe', NULL, 43),
('Skoki narciarskie', 'skoki-narciarskie', 'sporty-zimowe', 44),
('Biegi narciarskie', 'biegi-narciarskie', 'sporty-zimowe', 45),
('Biathlon', 'biathlon', 'sporty-zimowe', 46),
('Łyżwiarstwo', 'lyzwiarstwo', 'sporty-zimowe', 47),

-- E-sport
('E-sport', 'esport', NULL, 48),
('CS2', 'cs2', 'esport', 49),
('League of Legends', 'lol', 'esport', 50),
('Valorant', 'valorant', 'esport', 51),
('Turnieje międzynarodowe', 'turnieje-esport', 'esport', 52),

-- Inne sporty
('Inne sporty', 'inne-sporty', NULL, 53),
('Golf', 'golf', 'inne-sporty', 54),
('Kolarstwo', 'kolarstwo', 'inne-sporty', 55),
('Rugby', 'rugby', 'inne-sporty', 56),
('Żeglarstwo', 'zeglarstwo', 'inne-sporty', 57),
('Triathlon', 'triathlon', 'inne-sporty', 58);