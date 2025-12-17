-- Drop old constraint and add new one with emission types
ALTER TABLE public.ad_campaigns DROP CONSTRAINT ad_campaigns_ad_type_check;

ALTER TABLE public.ad_campaigns ADD CONSTRAINT ad_campaigns_ad_type_check 
CHECK (ad_type = ANY (ARRAY[
  'image'::text, 
  'text'::text, 
  'link'::text, 
  'video'::text,
  'exclusive'::text,
  'rotation_slot_1'::text,
  'rotation_slot_2'::text,
  'rotation_slot_3'::text,
  'rotation_slot_4'::text,
  'rotation_slot_5'::text
]));