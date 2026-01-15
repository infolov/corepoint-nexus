-- Add sponsored article fields to articles table
ALTER TABLE public.articles 
ADD COLUMN is_sponsored BOOLEAN DEFAULT false,
ADD COLUMN sponsor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN sponsor_status TEXT DEFAULT 'draft',
ADD COLUMN target_url TEXT;

-- Create index for sponsored articles
CREATE INDEX idx_articles_sponsored ON public.articles(is_sponsored, sponsor_status) WHERE is_sponsored = true;

-- Add RLS policy for publishers to manage their own sponsored articles
CREATE POLICY "Publishers can create sponsored articles"
ON public.articles
FOR INSERT
WITH CHECK (
  is_sponsored = true 
  AND sponsor_user_id = auth.uid() 
  AND has_role(auth.uid(), 'publisher'::app_role)
);

CREATE POLICY "Publishers can update their own sponsored articles"
ON public.articles
FOR UPDATE
USING (
  is_sponsored = true 
  AND sponsor_user_id = auth.uid() 
  AND has_role(auth.uid(), 'publisher'::app_role)
)
WITH CHECK (
  is_sponsored = true 
  AND sponsor_user_id = auth.uid() 
  AND has_role(auth.uid(), 'publisher'::app_role)
);

CREATE POLICY "Publishers can view their own sponsored articles"
ON public.articles
FOR SELECT
USING (
  (is_published = true) 
  OR (is_sponsored = true AND sponsor_user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);