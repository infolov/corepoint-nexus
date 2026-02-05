-- Add content ratio preferences to user_notification_preferences table
ALTER TABLE public.user_notification_preferences
ADD COLUMN IF NOT EXISTS local_ratio integer NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS sport_ratio integer NOT NULL DEFAULT 40;

-- Add constraint to ensure ratios sum to 100
ALTER TABLE public.user_notification_preferences
ADD CONSTRAINT check_ratio_sum CHECK (local_ratio + sport_ratio = 100);

-- Add constraint to ensure ratios are between 0 and 100
ALTER TABLE public.user_notification_preferences
ADD CONSTRAINT check_local_ratio_range CHECK (local_ratio >= 0 AND local_ratio <= 100),
ADD CONSTRAINT check_sport_ratio_range CHECK (sport_ratio >= 0 AND sport_ratio <= 100);