-- Add DELETE policy for admins on ad_campaigns
-- The existing "Admins can manage all campaigns" policy with FOR ALL should already cover DELETE
-- but let's also add DELETE for campaign_stats

-- Allow admins to delete campaign stats
CREATE POLICY "Admins can delete campaign stats"
ON public.campaign_stats
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));