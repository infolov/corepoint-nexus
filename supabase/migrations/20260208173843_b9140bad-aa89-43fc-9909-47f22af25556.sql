-- Fix RESTRICTIVE RLS policies on categories table (same issue as articles)
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active categories"
ON public.categories
FOR SELECT
TO public
USING (is_active = true);