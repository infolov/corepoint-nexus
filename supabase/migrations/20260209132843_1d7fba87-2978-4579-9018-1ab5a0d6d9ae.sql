
-- Drop old check constraint that enforces local_ratio + sport_ratio = 100
ALTER TABLE user_notification_preferences
  DROP CONSTRAINT IF EXISTS check_ratio_sum;

-- Add general_ratio column
ALTER TABLE user_notification_preferences
  ADD COLUMN general_ratio integer NOT NULL DEFAULT 40;

-- Update existing records to new 3-way defaults
UPDATE user_notification_preferences
SET general_ratio = 40,
    local_ratio = 35,
    sport_ratio = 25;

-- Update defaults
ALTER TABLE user_notification_preferences
  ALTER COLUMN local_ratio SET DEFAULT 35,
  ALTER COLUMN sport_ratio SET DEFAULT 25;

-- Add new check constraint for 3-way sum
ALTER TABLE user_notification_preferences
  ADD CONSTRAINT check_ratio_sum CHECK (general_ratio + local_ratio + sport_ratio = 100);
