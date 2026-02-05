-- Step 2: Migrate existing 'advertiser' roles to 'partner'
UPDATE public.user_roles 
SET role = 'partner'::app_role 
WHERE role = 'advertiser'::app_role;