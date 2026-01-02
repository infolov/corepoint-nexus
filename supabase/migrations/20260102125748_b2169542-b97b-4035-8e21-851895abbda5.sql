-- Table for managing site-wide and category partners
CREATE TABLE public.partner_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  logo_text TEXT,
  target_url TEXT,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('site', 'category')),
  category_slug TEXT, -- NULL for site partner, category slug for category partners
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for managing carousel banner groups
CREATE TABLE public.carousel_banner_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  placement_position INTEGER NOT NULL DEFAULT 1, -- Which slot in the feed (every 12 items)
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for individual banners in a carousel group (max 4 per group)
CREATE TABLE public.carousel_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.carousel_banner_groups(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,
  local_campaign_id UUID REFERENCES public.local_ad_campaigns(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_campaign_source CHECK (
    (campaign_id IS NOT NULL AND local_campaign_id IS NULL) OR
    (campaign_id IS NULL AND local_campaign_id IS NOT NULL)
  ),
  CONSTRAINT check_display_order CHECK (display_order >= 1 AND display_order <= 4)
);

-- Enable RLS
ALTER TABLE public.partner_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_banner_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_campaigns
CREATE POLICY "Public can view active partner campaigns" 
ON public.partner_campaigns 
FOR SELECT 
USING (is_active = true AND now() BETWEEN start_date AND end_date);

CREATE POLICY "Authenticated users can manage their own partner campaigns" 
ON public.partner_campaigns 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for carousel_banner_groups
CREATE POLICY "Public can view active carousel groups" 
ON public.carousel_banner_groups 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage their own carousel groups" 
ON public.carousel_banner_groups 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for carousel_banners
CREATE POLICY "Public can view carousel banners" 
ON public.carousel_banners 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage banners in their groups" 
ON public.carousel_banners 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.carousel_banner_groups 
    WHERE id = carousel_banners.group_id 
    AND user_id = auth.uid()
  )
);

-- Create updated_at trigger for partner_campaigns
CREATE TRIGGER update_partner_campaigns_updated_at
BEFORE UPDATE ON public.partner_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for carousel_banner_groups
CREATE TRIGGER update_carousel_banner_groups_updated_at
BEFORE UPDATE ON public.carousel_banner_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_partner_campaigns_type ON public.partner_campaigns(partner_type);
CREATE INDEX idx_partner_campaigns_category ON public.partner_campaigns(category_slug);
CREATE INDEX idx_partner_campaigns_active ON public.partner_campaigns(is_active, start_date, end_date);
CREATE INDEX idx_carousel_groups_position ON public.carousel_banner_groups(placement_position);
CREATE INDEX idx_carousel_banners_group ON public.carousel_banners(group_id);