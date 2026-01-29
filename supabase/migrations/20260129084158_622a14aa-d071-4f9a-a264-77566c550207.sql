-- Add category column to daily_summaries table for category-specific summaries
ALTER TABLE public.daily_summaries 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;

-- Add index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_daily_summaries_category ON public.daily_summaries(category);

-- Add unique constraint for date + region + category combination
ALTER TABLE public.daily_summaries 
DROP CONSTRAINT IF EXISTS daily_summaries_unique_date_region_category;

ALTER TABLE public.daily_summaries 
ADD CONSTRAINT daily_summaries_unique_date_region_category 
UNIQUE (summary_date, region, category);