-- Add column for AI-generated title
ALTER TABLE public.processed_articles 
ADD COLUMN IF NOT EXISTS ai_title TEXT;