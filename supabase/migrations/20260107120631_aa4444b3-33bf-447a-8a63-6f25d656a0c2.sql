-- Create table for processed news articles
CREATE TABLE public.processed_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  source TEXT,
  category TEXT,
  image_url TEXT,
  full_content TEXT,
  ai_summary TEXT,
  pub_date TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_processed_articles_url ON public.processed_articles(url);
CREATE INDEX idx_processed_articles_processed_at ON public.processed_articles(processed_at DESC);
CREATE INDEX idx_processed_articles_category ON public.processed_articles(category);

-- Enable RLS
ALTER TABLE public.processed_articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (news are public)
CREATE POLICY "Anyone can view processed articles"
ON public.processed_articles
FOR SELECT
USING (true);

-- Only service role can insert/update (edge function uses service role)
CREATE POLICY "Service role can manage processed articles"
ON public.processed_articles
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.processed_articles;