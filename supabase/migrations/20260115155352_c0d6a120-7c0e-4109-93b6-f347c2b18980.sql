-- Create journalists table
CREATE TABLE public.journalists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialization TEXT[] DEFAULT '{}',
  bio TEXT,
  avatar_url TEXT,
  price_per_article NUMERIC NOT NULL DEFAULT 500,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journalists ENABLE ROW LEVEL SECURITY;

-- Policies for journalists
CREATE POLICY "Anyone can view active journalists"
ON public.journalists
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage journalists"
ON public.journalists
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create sponsored articles orders table
CREATE TABLE public.sponsored_article_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  journalist_id UUID REFERENCES public.journalists(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  price NUMERIC NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sponsored_article_orders ENABLE ROW LEVEL SECURITY;

-- Policies for sponsored article orders
CREATE POLICY "Users can view their own orders"
ON public.sponsored_article_orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
ON public.sponsored_article_orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders"
ON public.sponsored_article_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_journalists_updated_at
BEFORE UPDATE ON public.journalists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sponsored_article_orders_updated_at
BEFORE UPDATE ON public.sponsored_article_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();