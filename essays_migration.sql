-- Create essays table
CREATE TABLE IF NOT EXISTS essays (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    theme text NOT NULL,
    content text NOT NULL,
    score_final integer NOT NULL,
    score_breakdown jsonb NOT NULL, -- { comprehension: 20, structure: 15, ... }
    feedback text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own essays
CREATE POLICY "Users can insert own essays" 
ON essays FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own essays
CREATE POLICY "Users can view own essays" 
ON essays FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all (Optional, using same ID as before)
CREATE POLICY "Admins can view all essays" 
ON essays FOR SELECT 
USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d');

-- Grant permissions
GRANT ALL ON essays TO authenticated;
GRANT ALL ON essays TO service_role;
