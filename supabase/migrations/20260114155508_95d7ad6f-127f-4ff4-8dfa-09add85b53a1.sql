-- Create alerts table for emergency notifications
CREATE TABLE public.emergency_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  region TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Everyone can read active alerts
CREATE POLICY "Anyone can view active alerts"
ON public.emergency_alerts
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Only admins can manage alerts
CREATE POLICY "Admins can manage alerts"
ON public.emergency_alerts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add alert_ticker_enabled setting if not exists
INSERT INTO public.site_settings (setting_key, setting_value, description)
VALUES ('alert_ticker_enabled', 'true', 'Enable/disable emergency alert ticker on homepage')
ON CONFLICT (setting_key) DO NOTHING;