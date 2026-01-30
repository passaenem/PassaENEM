-- Create table for Official Exams
CREATE TABLE IF NOT EXISTS official_exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE official_exams ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can do everything
CREATE POLICY "Admins can manage official exams" 
ON official_exams 
FOR ALL 
USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d');

-- Policy: Public can view (Authenticated Users)
CREATE POLICY "Users can view official exams" 
ON official_exams 
FOR SELECT 
TO authenticated 
USING (true);

-- Storage Bucket Setup
-- Note: Creating buckets via SQL is supported in Supabase but often requires the storage schema extension.
-- We will try to insert into storage.buckets if it exists, otherwise assume the user might need to create it manually or via dashboard if this fails.
-- Ideally proper storage setup is done via the dashboard or specific storage API, but inserting into storage.buckets works for self-hosted or standard postgres access if permissions allow.

INSERT INTO storage.buckets (id, name, public)
VALUES ('official-exams', 'official-exams', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- 1. Allow Public Read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'official-exams' );

-- 2. Allow Admin Upload/Delete
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'official-exams' AND auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d' );

CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'official-exams' AND auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d' );
