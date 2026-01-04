-- Create news_cache table for caching RSS and scraped articles
CREATE TABLE public.news_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on source_url for fast lookups
CREATE INDEX idx_news_cache_source_url ON public.news_cache(source_url);

-- Create index on last_fetched_at for cache expiry checks
CREATE INDEX idx_news_cache_last_fetched ON public.news_cache(last_fetched_at);

-- Create composite index for category filtering
CREATE INDEX idx_news_cache_category ON public.news_cache(category);

-- Enable RLS
ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (news is public content)
CREATE POLICY "News cache is publicly readable"
ON public.news_cache
FOR SELECT
USING (true);

-- Only service role can insert/update (edge functions)
CREATE POLICY "Service role can manage news cache"
ON public.news_cache
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');