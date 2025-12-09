-- Add region column to articles table for filtering by voivodeship
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS region text DEFAULT NULL;

-- Create index for faster region-based queries
CREATE INDEX IF NOT EXISTS idx_articles_region ON public.articles(region);

-- Insert some sample articles with different regions for testing
UPDATE public.articles 
SET region = CASE 
  WHEN random() < 0.1 THEN 'mazowieckie'
  WHEN random() < 0.2 THEN 'malopolskie'
  WHEN random() < 0.3 THEN 'slaskie'
  WHEN random() < 0.4 THEN 'wielkopolskie'
  WHEN random() < 0.5 THEN 'pomorskie'
  WHEN random() < 0.6 THEN 'dolnoslaskie'
  WHEN random() < 0.7 THEN 'lodzkie'
  WHEN random() < 0.8 THEN 'podkarpackie'
  WHEN random() < 0.9 THEN 'lubelskie'
  ELSE NULL -- NULL means national/all regions
END
WHERE region IS NULL;