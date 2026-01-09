-- Create table for local news sources (user-customizable and system-defined)
CREATE TABLE public.local_news_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  voivodeship TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'rss' CHECK (source_type IN ('rss', 'scrape')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(url, voivodeship)
);

-- Create index for faster queries by voivodeship
CREATE INDEX idx_local_news_sources_voivodeship ON public.local_news_sources(voivodeship);
CREATE INDEX idx_local_news_sources_active ON public.local_news_sources(is_active);

-- Enable RLS
ALTER TABLE public.local_news_sources ENABLE ROW LEVEL SECURITY;

-- Everyone can read active sources
CREATE POLICY "Anyone can read active sources"
ON public.local_news_sources
FOR SELECT
USING (is_active = true);

-- Admin can do everything
CREATE POLICY "Admins can manage all sources"
ON public.local_news_sources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Users can add their own sources (non-system)
CREATE POLICY "Users can add their own sources"
ON public.local_news_sources
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND is_system = false 
  AND added_by = auth.uid()
);

-- Create table for user's preferred local sources
CREATE TABLE public.user_local_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.local_news_sources(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_id)
);

-- Create indexes
CREATE INDEX idx_user_local_sources_user ON public.user_local_sources(user_id);
CREATE INDEX idx_user_local_sources_source ON public.user_local_sources(source_id);

-- Enable RLS
ALTER TABLE public.user_local_sources ENABLE ROW LEVEL SECURITY;

-- Users can only see their own preferences
CREATE POLICY "Users can view their own source preferences"
ON public.user_local_sources
FOR SELECT
USING (auth.uid() = user_id);

-- Users can manage their own preferences
CREATE POLICY "Users can manage their own source preferences"
ON public.user_local_sources
FOR ALL
USING (auth.uid() = user_id);

-- Create function to auto-add sources for a user based on voivodeship
CREATE OR REPLACE FUNCTION public.auto_add_local_sources_for_user(
  p_user_id UUID,
  p_voivodeship TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  added_count INTEGER := 0;
BEGIN
  -- Insert user preferences for all active sources in the voivodeship
  INSERT INTO public.user_local_sources (user_id, source_id, is_enabled)
  SELECT p_user_id, id, true
  FROM public.local_news_sources
  WHERE voivodeship = p_voivodeship
    AND is_active = true
  ON CONFLICT (user_id, source_id) DO NOTHING;
  
  GET DIAGNOSTICS added_count = ROW_COUNT;
  RETURN added_count;
END;
$$;

-- Create trigger to auto-add sources when user updates their voivodeship
CREATE OR REPLACE FUNCTION public.on_user_voivodeship_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If voivodeship changed and is not null, auto-add sources
  IF NEW.voivodeship IS NOT NULL AND 
     (OLD.voivodeship IS NULL OR NEW.voivodeship != OLD.voivodeship) THEN
    PERFORM public.auto_add_local_sources_for_user(NEW.user_id, NEW.voivodeship);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_add_local_sources
AFTER INSERT OR UPDATE OF voivodeship ON public.user_site_settings
FOR EACH ROW
EXECUTE FUNCTION public.on_user_voivodeship_change();

-- Update timestamp trigger
CREATE TRIGGER update_local_news_sources_updated_at
BEFORE UPDATE ON public.local_news_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();