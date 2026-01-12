-- Add policy to allow public SELECT access to active ad campaigns
-- This is needed so ads display for all visitors, not just logged-in users

CREATE POLICY "Anyone can view active campaigns for display"
ON public.ad_campaigns
FOR SELECT
USING (status = 'active');