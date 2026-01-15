-- Create saved_articles table
CREATE TABLE public.saved_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id TEXT NOT NULL,
  article_title TEXT NOT NULL,
  article_image TEXT,
  article_category TEXT,
  article_excerpt TEXT,
  article_url TEXT,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX idx_saved_articles_user_article ON public.saved_articles(user_id, article_id);

-- Create index for faster lookups
CREATE INDEX idx_saved_articles_user_id ON public.saved_articles(user_id);

-- Enable RLS
ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own saved articles"
ON public.saved_articles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save articles"
ON public.saved_articles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved articles"
ON public.saved_articles FOR DELETE
USING (auth.uid() = user_id);