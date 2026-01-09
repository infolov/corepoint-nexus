-- Add verification columns to processed_articles table
ALTER TABLE public.processed_articles 
ADD COLUMN ai_verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (ai_verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN verification_logs JSONB DEFAULT '[]'::jsonb;

-- Create index for filtering by verification status
CREATE INDEX idx_processed_articles_verification_status ON public.processed_articles(ai_verification_status);

-- Comment for documentation
COMMENT ON COLUMN public.processed_articles.ai_verification_status IS 'Status weryfikacji faktów: pending (oczekuje), verified (zweryfikowane), rejected (odrzucone)';
COMMENT ON COLUMN public.processed_articles.verification_logs IS 'Logi weryfikacji zawierające historię prób, błędy i poprawki';