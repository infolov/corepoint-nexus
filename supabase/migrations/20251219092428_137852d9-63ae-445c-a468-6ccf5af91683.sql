
-- Create function to grant admin credits
CREATE OR REPLACE FUNCTION public.grant_admin_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When admin role is assigned, grant 999999 credits
  IF NEW.role = 'admin' THEN
    INSERT INTO public.advertiser_credits (user_id, balance)
    VALUES (NEW.user_id, 999999)
    ON CONFLICT (user_id) 
    DO UPDATE SET balance = 999999, updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new admin role assignments
CREATE TRIGGER on_admin_role_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_admin_credits();

-- Grant credits to existing admin accounts
INSERT INTO public.advertiser_credits (user_id, balance)
SELECT ur.user_id, 999999
FROM public.user_roles ur
WHERE ur.role = 'admin'
ON CONFLICT (user_id) 
DO UPDATE SET balance = 999999, updated_at = now();
