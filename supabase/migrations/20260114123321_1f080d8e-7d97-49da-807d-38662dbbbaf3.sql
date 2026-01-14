-- Add section 2 pricing for feed tile placements
-- Section 1 (positions 4-12) uses base credit_cost
-- Section 2 (positions 13-24) uses section2_credit_cost (cheaper due to lower visibility)

ALTER TABLE public.ad_placements 
ADD COLUMN section2_credit_cost INTEGER DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN public.ad_placements.section2_credit_cost IS 'Cost for section 2 tile positions (13-24). If NULL, uses base credit_cost. Lower visibility = lower price.';

-- Update existing feed-tile placement with a default section 2 price (e.g., 70% of base cost)
UPDATE public.ad_placements 
SET section2_credit_cost = GREATEST(ROUND(credit_cost * 0.7), 1)
WHERE slug = 'feed-tile';