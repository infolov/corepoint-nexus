-- Create storage bucket for ad campaigns
INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-campaigns', 'ad-campaigns', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to ad-campaigns bucket
CREATE POLICY "Authenticated users can upload ad creatives"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ad-campaigns');

-- Allow public read access to ad creatives
CREATE POLICY "Anyone can view ad creatives"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ad-campaigns');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own ad creatives"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'ad-campaigns' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own ad creatives"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'ad-campaigns' AND auth.uid()::text = (storage.foldername(name))[1]);