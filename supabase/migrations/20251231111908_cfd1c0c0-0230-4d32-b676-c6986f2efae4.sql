-- Add powiat and gmina targeting columns to ad_campaigns
ALTER TABLE public.ad_campaigns 
ADD COLUMN target_powiat text,
ADD COLUMN target_gmina text;

-- Add comment for clarity
COMMENT ON COLUMN public.ad_campaigns.region IS 'Voivodeship (województwo) targeting';
COMMENT ON COLUMN public.ad_campaigns.target_powiat IS 'County (powiat) targeting';
COMMENT ON COLUMN public.ad_campaigns.target_gmina IS 'Commune (gmina) targeting';