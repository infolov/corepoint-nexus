-- Drop the non-unique index and create a unique one for title_hash
DROP INDEX IF EXISTS idx_article_summaries_title_hash;
CREATE UNIQUE INDEX idx_article_summaries_title_hash ON public.article_summaries(title_hash);