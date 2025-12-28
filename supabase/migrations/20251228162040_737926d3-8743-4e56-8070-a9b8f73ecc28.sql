-- Create RSS sources table
CREATE TABLE public.rss_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    source_name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;

-- Anyone can view active sources
CREATE POLICY "Anyone can view active RSS sources" 
ON public.rss_sources 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all sources
CREATE POLICY "Admins can manage RSS sources" 
ON public.rss_sources 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_rss_sources_updated_at
BEFORE UPDATE ON public.rss_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default RSS sources
INSERT INTO public.rss_sources (url, source_name, category) VALUES
-- WIADOMOŚCI
('https://www.polsatnews.pl/rss/wszystkie.xml', 'Polsat News', 'Wiadomości'),
('https://tvn24.pl/najnowsze.xml', 'TVN24', 'Wiadomości'),
('https://wiadomosci.wp.pl/rss.xml', 'Wirtualna Polska', 'Wiadomości'),
('https://www.gazetaprawna.pl/rss.xml', 'Gazeta Prawna', 'Wiadomości'),
('https://www.rmf24.pl/fakty/feed', 'RMF24', 'Wiadomości'),
('https://www.se.pl/rss/', 'Super Express', 'Wiadomości'),
('https://natemat.pl/rss/wszystko', 'NaTemat', 'Wiadomości'),
('https://wydarzenia.interia.pl/rss', 'Interia', 'Wiadomości'),
('https://wiadomosci.gazeta.pl/pub/rss/wiadomosci.xml', 'Gazeta.pl', 'Wiadomości'),
('https://www.o2.pl/rss/wiadomosci.xml', 'O2.pl', 'Wiadomości'),
-- BIZNES
('https://www.bankier.pl/rss/wiadomosci.xml', 'Bankier.pl', 'Biznes'),
('https://www.money.pl/rss/rss.xml', 'Money.pl', 'Biznes'),
('https://www.pb.pl/rss/wszystko.xml', 'Puls Biznesu', 'Biznes'),
('https://biznes.interia.pl/rss', 'Interia Biznes', 'Biznes'),
('https://finanse.wp.pl/rss.xml', 'WP Finanse', 'Biznes'),
('https://www.forbes.pl/rss', 'Forbes PL', 'Biznes'),
-- SPORT
('https://sportowefakty.wp.pl/rss.xml', 'Sportowe Fakty', 'Sport'),
('https://www.sport.pl/rss.xml', 'Sport.pl', 'Sport'),
('https://sport.interia.pl/rss', 'Interia Sport', 'Sport'),
('https://www.meczyki.pl/rss.xml', 'Meczyki.pl', 'Sport'),
('https://www.goal.pl/feeds/rss', 'Goal.pl', 'Sport'),
('https://sport.onet.pl/rss.xml', 'Onet Sport', 'Sport'),
('https://www.weszlo.com/feed/', 'Weszło', 'Sport'),
('https://pilkanozna.pl/feed/', 'PilkaNozna.pl', 'Sport'),
-- TECHNOLOGIA
('https://www.chip.pl/feed', 'Chip.pl', 'Technologia'),
('https://tech.wp.pl/rss.xml', 'WP Tech', 'Technologia'),
('https://www.dobreprogramy.pl/rss.xml', 'Dobreprogramy', 'Technologia'),
('https://www.benchmark.pl/rss/aktualnosci.xml', 'Benchmark', 'Technologia'),
('https://www.spidersweb.pl/feed', 'Spider''s Web', 'Technologia'),
('https://antyweb.pl/feed/', 'Antyweb', 'Technologia'),
('https://www.tabletowo.pl/feed/', 'Tabletowo', 'Technologia'),
('https://android.com.pl/feed/', 'Android.com.pl', 'Technologia'),
('https://ithardware.pl/rss.xml', 'ITHardware', 'Technologia'),
-- ROZRYWKA
('https://www.pudelek.pl/rss.xml', 'Pudelek', 'Rozrywka'),
('https://www.eska.pl/rss/hotplota.xml', 'Eska', 'Rozrywka'),
('https://www.o2.pl/rss/rozrywka.xml', 'O2 Rozrywka', 'Rozrywka'),
('https://plotek.pl/feed', 'Plotek', 'Rozrywka'),
-- ZDROWIE
('https://zdrowie.wp.pl/rss.xml', 'WP Zdrowie', 'Zdrowie'),
('https://www.poradnikzdrowie.pl/rss.xml', 'Poradnik Zdrowie', 'Zdrowie'),
('https://www.mp.pl/rss/pediatria.xml', 'Medycyna Praktyczna', 'Zdrowie'),
('https://www.o2.pl/rss/zdrowie.xml', 'O2 Zdrowie', 'Zdrowie'),
('https://kobieta.wp.pl/rss.xml', 'WP Kobieta', 'Lifestyle'),
-- KULTURA
('https://kultura.wp.pl/rss.xml', 'WP Kultura', 'Kultura'),
('https://www.filmweb.pl/feed/news/latest', 'Filmweb', 'Kultura'),
('https://kultura.gazeta.pl/pub/rss/kultura.xml', 'Gazeta Kultura', 'Kultura'),
('https://www.polskieradio.pl/8/rss.xml', 'Polskie Radio Dwójka', 'Kultura'),
('https://kulturalnemedia.pl/feed/', 'Kulturalne Media', 'Kultura'),
('https://www.o2.pl/rss/kultura.xml', 'O2 Kultura', 'Kultura'),
-- NAUKA
('https://naukawpolsce.pl/rss.xml', 'Nauka w Polsce', 'Nauka'),
('https://kopalniawiedzy.pl/rss.xml', 'Kopalnia Wiedzy', 'Nauka'),
('https://innpoland.pl/rss', 'InnPoland', 'Nauka'),
('https://geekweek.pl/feed/', 'GeekWeek', 'Nauka'),
('https://www.o2.pl/rss/nauka.xml', 'O2 Nauka', 'Nauka'),
('https://naukawpolsce.pap.pl/rss', 'PAP Nauka', 'Nauka'),
('https://www.polskieradio.pl/23/rss.xml', 'PR Nauka', 'Nauka'),
-- MOTORYZACJA
('https://moto.wp.pl/rss.xml', 'WP Moto', 'Motoryzacja'),
('https://autokult.pl/feed/', 'Autokult', 'Motoryzacja'),
('https://www.moto.pl/rss.xml', 'Moto.pl', 'Motoryzacja'),
('https://www.autocentrum.pl/rss.xml', 'Autocentrum', 'Motoryzacja'),
('https://elektrowoz.pl/feed/', 'Elektrowóz', 'Motoryzacja'),
('https://www.o2.pl/rss/moto.xml', 'O2 Moto', 'Motoryzacja'),
('https://moto.interia.pl/rss', 'Interia Moto', 'Motoryzacja');