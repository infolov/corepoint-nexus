-- Create global site settings table
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read site settings" ON public.site_settings
  FOR SELECT USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.site_settings (setting_key, setting_value, description) VALUES
  ('site_name', '"WiadomościPL"', 'Nazwa strony wyświetlana w nagłówku'),
  ('site_description', '"Portal informacyjny"', 'Opis strony dla SEO'),
  ('maintenance_mode', 'false', 'Tryb konserwacji - blokuje dostęp dla zwykłych użytkowników'),
  ('registration_enabled', 'true', 'Czy rejestracja nowych użytkowników jest włączona'),
  ('default_region', '"mazowieckie"', 'Domyślny region dla nowych użytkowników'),
  ('max_articles_per_page', '20', 'Maksymalna liczba artykułów na stronie'),
  ('featured_articles_count', '5', 'Liczba wyróżnionych artykułów na stronie głównej'),
  ('auto_verify_articles', 'true', 'Automatyczna weryfikacja AI dla nowych artykułów'),
  ('ad_refresh_interval', '30', 'Interwał odświeżania reklam w sekundach'),
  ('weather_widget_enabled', 'true', 'Czy widget pogody jest włączony');