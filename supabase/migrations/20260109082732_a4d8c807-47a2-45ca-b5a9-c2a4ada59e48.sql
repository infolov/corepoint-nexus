-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create cron job to call process-news-background every 15 minutes
SELECT cron.schedule(
  'process-news-background-job',
  '*/15 * * * *',
  $$
  SELECT extensions.http_post(
    'https://qnogxpskedsyaddijbwq.supabase.co/functions/v1/process-news-background',
    '{}',
    'application/json',
    ARRAY[extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFub2d4cHNrZWRzeWFkZGlqYndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzA0OTUsImV4cCI6MjA4MDYwNjQ5NX0.X6fZTiXts5lte-b41kjl75M14BXUhUcdDwzbbKmJqxk')]
  );
  $$
);