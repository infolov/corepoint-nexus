-- Create table for user site settings (location and language)
CREATE TABLE public.user_site_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    region text DEFAULT 'Polska',
    voivodeship text,
    county text,
    city text,
    locality text,
    language text DEFAULT 'pl',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_site_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own site settings"
ON public.user_site_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own site settings"
ON public.user_site_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own site settings"
ON public.user_site_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_site_settings_updated_at
BEFORE UPDATE ON public.user_site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();