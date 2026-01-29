-- Enable RLS on tables if not already enabled (good practice, though usually on by default)
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- POLICY: Allow everyone to view exam_results (needed for Leaderboards)
-- We drop existing policies to avoid conflicts or duplication
DROP POLICY IF EXISTS "Public can view all exam results" ON exam_results;
DROP POLICY IF EXISTS "Users can only see their own exam results" ON exam_results;

CREATE POLICY "Public can view all exam results" 
ON exam_results FOR SELECT 
TO authenticated, anon 
USING (true);

-- POLICY: Allow everyone to view profiles (needed for Leaderboard Names)
-- We drop existing policies just in case
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles; 
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
TO authenticated, anon 
USING (true);

-- Keep insert/update secure
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);
