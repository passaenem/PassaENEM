-- Create table for Daily Motivations
CREATE TABLE IF NOT EXISTS daily_motivations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT daily_motivations_date_key UNIQUE (date)
);

-- Policy to allow read access to authenticated users
ALTER TABLE daily_motivations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON daily_motivations
  FOR SELECT USING (true);

-- Policy to allow service role (API) to insert
-- We generally rely on service role keys for the API backend, but if RLS is strict:
CREATE POLICY "Allow insert for service role" ON daily_motivations
  FOR INSERT WITH CHECK (true);
