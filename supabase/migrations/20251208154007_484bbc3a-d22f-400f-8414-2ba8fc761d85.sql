-- Create articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  badge TEXT CHECK (badge IN ('hot', 'trending', 'new')),
  author_id UUID REFERENCES auth.users(id),
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "Anyone can view published articles"
ON public.articles
FOR SELECT
USING (is_published = true);

-- Admins can manage all articles
CREATE POLICY "Admins can manage all articles"
ON public.articles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data
INSERT INTO public.articles (title, excerpt, content, category, image, badge, is_featured) VALUES
('Nowe przepisy podatkowe wchodzą w życie od przyszłego roku', 'Ministerstwo Finansów ogłosiło szczegóły zmian w systemie podatkowym. Sprawdź, co się zmieni.', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 'Wiadomości', 'https://images.unsplash.com/photo-554224155-8d04cb21cd6c?w=800&h=500&fit=crop', 'hot', true),
('Szczyt klimatyczny: kluczowe decyzje dla przyszłości planety', 'Światowi liderzy spotkali się, aby omówić przyszłość naszej planety.', 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.', 'Wiadomości', 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=400&h=300&fit=crop', NULL, false),
('Reforma edukacji: co czeka uczniów i nauczycieli?', 'Nowe zmiany w systemie edukacji mają wejść w życie już od września.', 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.', 'Wiadomości', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop', NULL, false),
('Protesty w centrum stolicy - tysiące na ulicach', 'Mieszkańcy wyszli na ulice, aby wyrazić swój sprzeciw.', 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', 'Wiadomości', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop', 'trending', false),
('GPW bije rekordy - indeksy na historycznych szczytach', 'Polski rynek kapitałowy przeżywa boom. Analitycy komentują sytuację i prognozują dalsze wzrosty.', 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.', 'Biznes', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=500&fit=crop', 'trending', true),
('Kurs złotego najsilniejszy od 5 lat', 'Polska waluta umacnia się względem euro i dolara.', 'Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.', 'Biznes', 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=300&fit=crop', NULL, false),
('Nowa siedziba polskiego giganta technologicznego', 'Firma ogłosiła plany budowy nowoczesnego kompleksu biurowego.', 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.', 'Biznes', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop', NULL, false),
('Startup z Krakowa pozyskał 50 mln USD', 'Polska firma technologiczna przyciągnęła uwagę zagranicznych inwestorów.', 'Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.', 'Biznes', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop', 'new', false),
('Lewandowski z hat-trickiem! Barcelona demoluje rywala', 'Polski napastnik w znakomitej formie strzelił trzy bramki w meczu ligowym.', 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.', 'Sport', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=500&fit=crop', 'hot', true),
('Świątek w półfinale turnieju WTA', 'Polska tenisistka kontynuuje świetną passę w tym sezonie.', 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.', 'Sport', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop', NULL, false),
('Reprezentacja poznała rywali w eliminacjach', 'Losowanie grup przyniosło interesujące rozstrzygnięcia.', 'Doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.', 'Sport', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=300&fit=crop', NULL, false),
('Formuła 1: Verstappen z pole position', 'Holenderski kierowca dominuje w kwalifikacjach.', 'Et quasi architecto beatae vitae dicta sunt explicabo.', 'Sport', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop', NULL, false),
('Apple prezentuje nową generację iPhone - rewolucja w fotografii', 'Najnowszy model wprowadza przełomowe rozwiązania w dziedzinie fotografii mobilnej.', 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.', 'Technologia', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=500&fit=crop', 'new', true),
('ChatGPT dostaje nową funkcję - rozmowy głosowe', 'OpenAI rozszerza możliwości swojego chatbota o interakcje głosowe.', 'Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.', 'Technologia', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop', 'trending', false),
('Tesla otwiera fabrykę w Polsce - 5000 nowych miejsc pracy', 'Amerykański gigant motoryzacyjny inwestuje w naszym kraju.', 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.', 'Technologia', 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop', NULL, false),
('Polska firma tworzy konkurenta dla Starlink', 'Innowacyjna technologia satelitarna z Polski.', 'Consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt.', 'Technologia', 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=400&h=300&fit=crop', NULL, false),
('10 najlepszych miejsc na jesienną wycieczkę w Polsce', 'Odkryj piękno polskiej jesieni. Przedstawiamy najciekawsze destynacje na weekend.', 'Ut labore et dolore magnam aliquam quaerat voluptatem.', 'Lifestyle', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop', NULL, false),
('Nowy trend w dietetyce: czy warto go wypróbować?', 'Eksperci oceniają najnowsze trendy żywieniowe.', 'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.', 'Lifestyle', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop', NULL, false),
('Jak zorganizować idealne home office?', 'Praktyczne porady dotyczące pracy zdalnej.', 'Nisi ut aliquid ex ea commodi consequatur.', 'Lifestyle', 'https://images.unsplash.com/photo-1486946255434-2466348c2166?w=400&h=300&fit=crop', NULL, false),
('Przełomowa decyzja UE w sprawie regulacji AI', 'Unia Europejska przyjęła nowe przepisy dotyczące AI.', 'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse.', 'Technologia', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop', 'hot', true),
('Rekordowe wzrosty na giełdach światowych', 'Indeksy giełdowe biją kolejne rekordy.', 'Quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas.', 'Biznes', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop', 'trending', true),
('Reprezentacja Polski w drodze do finału', 'Polscy sportowcy pokazali klasę w półfinałowych zmaganiach.', 'Nulla pariatur excepteur sint occaecat cupidatat non proident.', 'Sport', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=600&fit=crop', 'new', true);