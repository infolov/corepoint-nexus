-- Role użytkowników: user, advertiser, admin
CREATE TYPE public.app_role AS ENUM ('user', 'advertiser', 'admin');

-- Tabela ról użytkowników (KRYTYCZNE: role w osobnej tabeli!)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Funkcja sprawdzająca rolę (SECURITY DEFINER - unika rekurencji RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profil użytkownika
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    company_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Miejsca reklamowe
CREATE TABLE public.ad_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    credit_cost INTEGER NOT NULL DEFAULT 10,
    dimensions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pakiety kredytów do zakupu
CREATE TABLE public.credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    price_pln DECIMAL(10,2) NOT NULL,
    price_eur DECIMAL(10,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Saldo kredytów reklamodawcy
CREATE TABLE public.advertiser_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Historia transakcji kredytowych
CREATE TABLE public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'spend', 'refund', 'admin_add')),
    description TEXT,
    package_id UUID REFERENCES public.credit_packages(id),
    campaign_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Kampanie reklamowe
CREATE TABLE public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    placement_id UUID REFERENCES public.ad_placements(id) NOT NULL,
    name TEXT NOT NULL,
    ad_type TEXT NOT NULL CHECK (ad_type IN ('image', 'text', 'link', 'video')),
    content_url TEXT,
    content_text TEXT,
    target_url TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_credits INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'rejected', 'completed', 'cancelled')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Statystyki kampanii
CREATE TABLE public.campaign_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (campaign_id, date)
);

-- Trigger do aktualizacji updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertiser_credits_updated_at
    BEFORE UPDATE ON public.advertiser_credits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_campaigns_updated_at
    BEFORE UPDATE ON public.ad_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger do tworzenia profilu i salda kredytów po rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_stats ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Ad placements - publiczne do odczytu
CREATE POLICY "Anyone can view active placements" ON public.ad_placements
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage placements" ON public.ad_placements
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Credit packages - publiczne do odczytu
CREATE POLICY "Anyone can view active packages" ON public.credit_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage packages" ON public.credit_packages
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Advertiser credits
CREATE POLICY "Users can view own credits" ON public.advertiser_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credits" ON public.advertiser_credits
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Credit transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON public.credit_transactions
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Ad campaigns
CREATE POLICY "Users can view own campaigns" ON public.ad_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create campaigns" ON public.ad_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON public.ad_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all campaigns" ON public.ad_campaigns
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Campaign stats
CREATE POLICY "Users can view own campaign stats" ON public.campaign_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ad_campaigns 
            WHERE id = campaign_stats.campaign_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all stats" ON public.campaign_stats
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Dane początkowe: miejsca reklamowe
INSERT INTO public.ad_placements (name, slug, description, credit_cost, dimensions) VALUES
    ('Top Banner', 'top-banner', 'Główny banner na górze strony', 50, '728x90'),
    ('Sidebar Square', 'sidebar-square', 'Kwadrat w prawej kolumnie', 30, '300x250'),
    ('Artykuł Sponsorowany', 'sponsored-article', 'Pełny artykuł sponsorowany', 100, 'pełna strona'),
    ('Stopka', 'footer', 'Banner w stopce strony', 20, '728x90'),
    ('Pop-up', 'popup', 'Wyskakujące okienko', 80, '600x400'),
    ('Mobile Banner', 'mobile-banner', 'Banner na urządzeniach mobilnych', 25, '320x50');

-- Dane początkowe: pakiety kredytów
INSERT INTO public.credit_packages (name, credits, price_pln, price_eur) VALUES
    ('Starter', 100, 99.00, 22.00),
    ('Business', 500, 449.00, 99.00),
    ('Premium', 1000, 799.00, 179.00);