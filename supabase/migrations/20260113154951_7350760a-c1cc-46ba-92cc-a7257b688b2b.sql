-- Drop the old constraint and add updated one with tile_position values
ALTER TABLE public.ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_ad_type_check;

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
  'rotation_slot_5'::text,
  'tile_position_1'::text,
  'tile_position_2'::text,
  'tile_position_3'::text,
  'tile_position_4'::text,
  'tile_position_5'::text,
  'tile_position_6'::text,
  'tile_position_7'::text,
  'tile_position_8'::text,
  'tile_position_9'::text,
  'tile_position_10'::text,
  'tile_position_11'::text,
  'tile_position_12'::text
]));