-- Indeks kompozytowy dla głównego zapytania o artykuły
CREATE INDEX IF NOT EXISTS idx_articles_published_category_created 
ON public.articles (is_published, category, created_at DESC);

-- Indeks dla filtrowania po regionie
CREATE INDEX IF NOT EXISTS idx_articles_published_region 
ON public.articles (is_published, region);

-- Indeks dla user_site_settings - szybkie pobieranie ustawień użytkownika
CREATE INDEX IF NOT EXISTS idx_user_site_settings_user_id 
ON public.user_site_settings (user_id);