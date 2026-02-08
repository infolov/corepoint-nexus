-- Drop all existing restrictive policies on articles
DROP POLICY IF EXISTS "Admins can manage all articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;
DROP POLICY IF EXISTS "Publishers can create sponsored articles" ON public.articles;
DROP POLICY IF EXISTS "Publishers can update their own sponsored articles" ON public.articles;
DROP POLICY IF EXISTS "Publishers can view their own sponsored articles" ON public.articles;

-- Recreate as PERMISSIVE policies (default, any one passing = allowed)
CREATE POLICY "Admins can manage all articles"
ON public.articles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published articles"
ON public.articles
FOR SELECT
TO public
USING (is_published = true);

CREATE POLICY "Publishers can create sponsored articles"
ON public.articles
FOR INSERT
TO authenticated
WITH CHECK (
  (is_sponsored = true)
  AND (sponsor_user_id = auth.uid())
  AND has_role(auth.uid(), 'publisher'::app_role)
);

CREATE POLICY "Publishers can update their own sponsored articles"
ON public.articles
FOR UPDATE
TO authenticated
USING (
  (is_sponsored = true)
  AND (sponsor_user_id = auth.uid())
  AND has_role(auth.uid(), 'publisher'::app_role)
)
WITH CHECK (
  (is_sponsored = true)
  AND (sponsor_user_id = auth.uid())
  AND has_role(auth.uid(), 'publisher'::app_role)
);

CREATE POLICY "Publishers can view their own sponsored articles"
ON public.articles
FOR SELECT
TO authenticated
USING (
  (is_published = true)
  OR ((is_sponsored = true) AND (sponsor_user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);