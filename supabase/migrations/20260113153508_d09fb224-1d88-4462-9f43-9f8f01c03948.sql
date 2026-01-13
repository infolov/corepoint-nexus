-- Add tile_position column for feed-tile ad campaigns
-- This allows advertisers to select a specific position (1-12) within the article grid
ALTER TABLE public.ad_campaigns 
ADD COLUMN tile_position integer DEFAULT NULL;

-- Add constraint to ensure tile_position is between 1 and 12
ALTER TABLE public.ad_campaigns 
ADD CONSTRAINT ad_campaigns_tile_position_check 
CHECK (tile_position IS NULL OR (tile_position >= 1 AND tile_position <= 12));

-- Add comment for documentation
COMMENT ON COLUMN public.ad_campaigns.tile_position IS 'Position (1-12) in the news grid for feed-tile placements';