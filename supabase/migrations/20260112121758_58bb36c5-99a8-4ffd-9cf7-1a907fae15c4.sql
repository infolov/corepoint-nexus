-- Create table for daily summaries
CREATE TABLE public.daily_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_date DATE NOT NULL,
  region VARCHAR(100), -- NULL means national
  summary_text TEXT NOT NULL,
  audio_url TEXT, -- URL to audio file in storage
  article_ids UUID[] NOT NULL DEFAULT '{}',
  view_count_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(summary_date, region)
);

-- Enable RLS
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Everyone can read summaries (public content)
CREATE POLICY "Daily summaries are publicly readable"
ON public.daily_summaries
FOR SELECT
USING (true);

-- Only service role can insert/update (edge function)
CREATE POLICY "Service role can manage summaries"
ON public.daily_summaries
FOR ALL
USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX idx_daily_summaries_date_region ON public.daily_summaries(summary_date DESC, region);

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('daily-audio', 'daily-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to audio files
CREATE POLICY "Public can read daily audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'daily-audio');

-- Service role can upload audio
CREATE POLICY "Service role can upload daily audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'daily-audio');

-- Add trigger for updated_at
CREATE TRIGGER update_daily_summaries_updated_at
BEFORE UPDATE ON public.daily_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();