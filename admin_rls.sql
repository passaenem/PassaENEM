-- Enable RLS (Should be already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Allow Admin to VIEW all profiles
CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d');

-- 2. Allow Admin to UPDATE all profiles (for Credits)
CREATE POLICY "Admins can update all profiles" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d');

-- Optional: If you want to delete existing strict policies first:
-- DROP POLICY IF EXISTS "Users can only view own profile" ON profiles;
-- (But usually adding the Admin policy is enough as policies are OR-ed)
