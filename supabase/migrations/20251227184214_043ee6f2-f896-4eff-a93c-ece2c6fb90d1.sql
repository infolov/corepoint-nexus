-- Create table for caching AI-generated article summaries
CREATE TABLE public.article_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT NOT NULL UNIQUE,
  title_hash TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.article_summaries ENABLE ROW LEVEL SECURITY;

-- Public read access (summaries are not sensitive)
CREATE POLICY "Anyone can read article summaries"
ON public.article_summaries
FOR SELECT
USING (true);

-- Only backend (service role) can insert/update
CREATE POLICY "Service role can manage summaries"
ON public.article_summaries
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Index for faster lookups
CREATE INDEX idx_article_summaries_article_id ON public.article_summaries(article_id);
CREATE INDEX idx_article_summaries_title_hash ON public.article_summaries(title_hash);