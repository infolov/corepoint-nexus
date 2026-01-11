-- Add notification toggle columns to user_notification_preferences
ALTER TABLE public.user_notification_preferences 
ADD COLUMN IF NOT EXISTS breaking_news boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_digest boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS personalized boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS font_size text DEFAULT 'normal';