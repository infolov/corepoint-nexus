-- 1. Create categories table with keywords support (extending the existing category system)
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    parent_slug text,
    keywords text[] DEFAULT '{}',
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Create source_type enum
CREATE TYPE public.source_type AS ENUM ('rss', 'scraping');

-- 3. Create content_sources table for RSS feeds and scraping configurations
CREATE TABLE public.content_sources (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name text NOT NULL,
    url text NOT NULL,
    type source_type NOT NULL DEFAULT 'rss',
    is_active boolean DEFAULT true,
    selector text,
    last_fetched_at timestamp with time zone,
    fetch_interval_minutes integer DEFAULT 30,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for content_sources
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_sources
CREATE POLICY "Anyone can view active sources"
ON public.content_sources FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage sources"
ON public.content_sources FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Add trigger for updated_at on categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Add trigger for updated_at on content_sources
CREATE TRIGGER update_content_sources_updated_at
BEFORE UPDATE ON public.content_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create indexes for better query performance
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent ON public.categories(parent_slug);
CREATE INDEX idx_content_sources_category ON public.content_sources(category_id);
CREATE INDEX idx_content_sources_active ON public.content_sources(is_active) WHERE is_active = true;

-- 7. Add keywords column to existing sport_subcategories for consistency
ALTER TABLE public.sport_subcategories 
ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}';