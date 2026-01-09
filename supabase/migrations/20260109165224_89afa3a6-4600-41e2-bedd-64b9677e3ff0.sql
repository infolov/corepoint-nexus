-- Dodanie kolumn weryfikacyjnych do tabeli articles
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_feedback JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS generation_attempts INTEGER DEFAULT 0;

-- Indeks dla szybkich zapytań o artykuły do weryfikacji
CREATE INDEX IF NOT EXISTS idx_articles_verification_status ON articles(ai_verification_status);