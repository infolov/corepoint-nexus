-- Drop old constraint and add new one for tile positions 1-24
-- (1-3 are blocked in UI, 4-12 first section, 13-24 second section)
ALTER TABLE public.ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_tile_position_check;

ALTER TABLE public.ad_campaigns 
ADD CONSTRAINT ad_campaigns_tile_position_check 
CHECK (tile_position IS NULL OR (tile_position >= 1 AND tile_position <= 24));