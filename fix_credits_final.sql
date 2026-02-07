-- 1. Drop the function to ensure clean state
DROP FUNCTION IF EXISTS public.add_user_credits(uuid, integer);

-- 2. Recreate the function with SECURITY DEFINER (runs as creator/admin)
CREATE OR REPLACE FUNCTION public.add_user_credits(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Update credits safely
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Explicitly GRANT EXECUTE to all users (public) and authenticated users
GRANT EXECUTE ON FUNCTION public.add_user_credits(uuid, integer) TO public;
GRANT EXECUTE ON FUNCTION public.add_user_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_credits(uuid, integer) TO service_role;

-- 4. Ensure profiles table has proper policies for updates (Fallback)
-- Allow users to update their OWN profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Force enable RLS if not already
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
