-- Create table for local ad placements with regional pricing
CREATE TABLE public.local_ad_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  placement_type TEXT NOT NULL CHECK (placement_type IN ('sponsored_tile', 'regional_banner', 'local_sidebar')),
  dimensions TEXT,
  base_cpm_pln DECIMAL(10,2) NOT NULL DEFAULT 5.00, -- Base cost per 1000 impressions
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for regional pricing multipliers
CREATE TABLE public.regional_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_type TEXT NOT NULL CHECK (region_type IN ('voivodeship', 'city')),
  region_name TEXT NOT NULL,
  region_slug TEXT NOT NULL,
  parent_voivodeship TEXT, -- For cities, reference to parent voivodeship
  population_tier TEXT CHECK (population_tier IN ('tier_1', 'tier_2', 'tier_3', 'tier_4')), -- tier_1 = largest cities
  cpm_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00, -- Multiplier for base CPM
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(region_type, region_slug)
);

-- Create table for local ad campaigns
CREATE TABLE public.local_ad_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  placement_id UUID NOT NULL REFERENCES public.local_ad_placements(id),
  name TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('image', 'text', 'html')),
  content_url TEXT, -- Image URL
  content_text TEXT, -- Text content
  target_url TEXT NOT NULL, -- Click destination
  -- Targeting
  target_regions JSONB NOT NULL DEFAULT '[]', -- Array of {type, slug, name}
  -- Budget & Pricing
  budget_credits INTEGER NOT NULL, -- Total credits allocated
  spent_credits INTEGER DEFAULT 0,
  cpm_rate DECIMAL(10,2) NOT NULL, -- Calculated CPM rate
  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'rejected')),
  rejection_reason TEXT,
  -- Stats
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for local campaign daily stats
CREATE TABLE public.local_campaign_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.local_ad_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  region_slug TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  credits_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, date, region_slug)
);

-- Enable RLS
ALTER TABLE public.local_ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_campaign_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for local_ad_placements (public read)
CREATE POLICY "Anyone can view active local ad placements"
ON public.local_ad_placements FOR SELECT
USING (is_active = true);

-- RLS Policies for regional_pricing (public read)
CREATE POLICY "Anyone can view regional pricing"
ON public.regional_pricing FOR SELECT
USING (is_active = true);

-- RLS Policies for local_ad_campaigns
CREATE POLICY "Users can view their own local campaigns"
ON public.local_ad_campaigns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own local campaigns"
ON public.local_ad_campaigns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own local campaigns"
ON public.local_ad_campaigns FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for local_campaign_stats
CREATE POLICY "Users can view stats for their campaigns"
ON public.local_campaign_stats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.local_ad_campaigns 
    WHERE id = campaign_id AND user_id = auth.uid()
  )
);

-- Insert default local ad placements
INSERT INTO public.local_ad_placements (name, slug, description, placement_type, dimensions, base_cpm_pln) VALUES
('Kafelek Sponsorowany', 'sponsored-tile', 'Kafelek w feedzie artykułów - wyświetlany użytkownikom z wybranego regionu', 'sponsored_tile', '16:9, 300x169px', 8.00),
('Banner Regionalny', 'regional-banner', 'Banner wyświetlany przy artykułach z danego regionu', 'regional_banner', '728x90px', 6.00),
('Sidebar Lokalny', 'local-sidebar', 'Reklama w sidebarze dla użytkowników z wybranego regionu', 'local_sidebar', '300x250px', 5.00);

-- Insert voivodeships with pricing multipliers
INSERT INTO public.regional_pricing (region_type, region_name, region_slug, population_tier, cpm_multiplier) VALUES
('voivodeship', 'Mazowieckie', 'mazowieckie', 'tier_1', 1.50),
('voivodeship', 'Małopolskie', 'malopolskie', 'tier_1', 1.30),
('voivodeship', 'Śląskie', 'slaskie', 'tier_1', 1.25),
('voivodeship', 'Wielkopolskie', 'wielkopolskie', 'tier_2', 1.20),
('voivodeship', 'Dolnośląskie', 'dolnoslaskie', 'tier_2', 1.15),
('voivodeship', 'Łódzkie', 'lodzkie', 'tier_2', 1.10),
('voivodeship', 'Pomorskie', 'pomorskie', 'tier_2', 1.15),
('voivodeship', 'Kujawsko-Pomorskie', 'kujawsko-pomorskie', 'tier_3', 1.00),
('voivodeship', 'Lubelskie', 'lubelskie', 'tier_3', 0.95),
('voivodeship', 'Podkarpackie', 'podkarpackie', 'tier_3', 0.90),
('voivodeship', 'Zachodniopomorskie', 'zachodniopomorskie', 'tier_3', 1.00),
('voivodeship', 'Warmińsko-Mazurskie', 'warminsko-mazurskie', 'tier_4', 0.85),
('voivodeship', 'Świętokrzyskie', 'swietokrzyskie', 'tier_4', 0.80),
('voivodeship', 'Podlaskie', 'podlaskie', 'tier_4', 0.85),
('voivodeship', 'Lubuskie', 'lubuskie', 'tier_4', 0.80),
('voivodeship', 'Opolskie', 'opolskie', 'tier_4', 0.85);

-- Insert major cities with higher multipliers
INSERT INTO public.regional_pricing (region_type, region_name, region_slug, parent_voivodeship, population_tier, cpm_multiplier) VALUES
('city', 'Warszawa', 'warszawa', 'mazowieckie', 'tier_1', 2.00),
('city', 'Kraków', 'krakow', 'malopolskie', 'tier_1', 1.80),
('city', 'Wrocław', 'wroclaw', 'dolnoslaskie', 'tier_1', 1.60),
('city', 'Poznań', 'poznan', 'wielkopolskie', 'tier_1', 1.55),
('city', 'Gdańsk', 'gdansk', 'pomorskie', 'tier_1', 1.50),
('city', 'Łódź', 'lodz', 'lodzkie', 'tier_2', 1.40),
('city', 'Katowice', 'katowice', 'slaskie', 'tier_2', 1.35),
('city', 'Szczecin', 'szczecin', 'zachodniopomorskie', 'tier_2', 1.30),
('city', 'Lublin', 'lublin', 'lubelskie', 'tier_2', 1.25),
('city', 'Bydgoszcz', 'bydgoszcz', 'kujawsko-pomorskie', 'tier_3', 1.20),
('city', 'Białystok', 'bialystok', 'podlaskie', 'tier_3', 1.15),
('city', 'Gdynia', 'gdynia', 'pomorskie', 'tier_3', 1.25),
('city', 'Sopot', 'sopot', 'pomorskie', 'tier_3', 1.40),
('city', 'Zakopane', 'zakopane', 'malopolskie', 'tier_3', 1.50),
('city', 'Toruń', 'torun', 'kujawsko-pomorskie', 'tier_3', 1.15),
('city', 'Rzeszów', 'rzeszow', 'podkarpackie', 'tier_3', 1.10),
('city', 'Kielce', 'kielce', 'swietokrzyskie', 'tier_3', 1.05),
('city', 'Olsztyn', 'olsztyn', 'warminsko-mazurskie', 'tier_3', 1.05);

-- Trigger to update updated_at
CREATE TRIGGER update_local_ad_campaigns_updated_at
BEFORE UPDATE ON public.local_ad_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();