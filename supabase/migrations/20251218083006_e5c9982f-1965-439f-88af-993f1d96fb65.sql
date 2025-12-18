-- Allow public to insert into campaign_stats for tracking impressions/clicks
CREATE POLICY "Anyone can insert campaign stats for tracking"
ON public.campaign_stats
FOR INSERT
WITH CHECK (true);

-- Allow public to update campaign_stats for incrementing counters
CREATE POLICY "Anyone can update campaign stats for tracking"
ON public.campaign_stats
FOR UPDATE
USING (true);