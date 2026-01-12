-- Create table for regional pricing of ad placements
CREATE TABLE public.ad_placement_regional_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placement_id UUID NOT NULL REFERENCES public.ad_placements(id) ON DELETE CASCADE,
  region_slug TEXT NOT NULL,
  region_name TEXT NOT NULL,
  credit_cost INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(placement_id, region_slug)
);

-- Enable RLS
ALTER TABLE public.ad_placement_regional_pricing ENABLE ROW LEVEL SECURITY;

-- Anyone can view regional pricing
CREATE POLICY "Anyone can view regional pricing"
ON public.ad_placement_regional_pricing
FOR SELECT
USING (true);

-- Admins can manage regional pricing
CREATE POLICY "Admins can manage regional pricing"
ON public.ad_placement_regional_pricing
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_ad_placement_regional_pricing_updated_at
BEFORE UPDATE ON public.ad_placement_regional_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();