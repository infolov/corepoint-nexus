-- Add INSERT policy for admins (the existing "Admins can manage all articles" is FOR ALL but let's ensure it works)
-- Also add a policy for admins to delete articles
DROP POLICY IF EXISTS "Admins can manage all articles" ON public.articles;

CREATE POLICY "Admins can manage all articles"
ON public.articles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));