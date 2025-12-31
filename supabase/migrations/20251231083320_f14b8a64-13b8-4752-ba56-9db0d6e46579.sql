-- Add regional targeting columns to ad_campaigns
ALTER TABLE public.ad_campaigns 
ADD COLUMN is_global boolean NOT NULL DEFAULT false,
ADD COLUMN region text;

-- Create optimized upsert function for tracking impressions
CREATE OR REPLACE FUNCTION public.increment_campaign_impression(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.campaign_stats (campaign_id, date, impressions, clicks)
  VALUES (p_campaign_id, CURRENT_DATE, 1, 0)
  ON CONFLICT (campaign_id, date) 
  DO UPDATE SET impressions = campaign_stats.impressions + 1;
END;
$$;

-- Create optimized upsert function for tracking clicks
CREATE OR REPLACE FUNCTION public.increment_campaign_click(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.campaign_stats (campaign_id, date, impressions, clicks)
  VALUES (p_campaign_id, CURRENT_DATE, 0, 1)
  ON CONFLICT (campaign_id, date) 
  DO UPDATE SET clicks = campaign_stats.clicks + 1;
END;
$$;

-- Add unique constraint for upsert to work
ALTER TABLE public.campaign_stats 
ADD CONSTRAINT campaign_stats_campaign_date_unique UNIQUE (campaign_id, date);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_campaign_impression(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_campaign_click(uuid) TO anon, authenticated;