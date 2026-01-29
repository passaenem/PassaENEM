-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  position integer NOT NULL, -- 1, 2, or 3
  prize_amount text NOT NULL,
  status text DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'pending', 'paid')),
  user_whatsapp text,
  user_name text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Admins can view and update everything
CREATE POLICY "Admins can do everything on rewards"
  ON rewards
  FOR ALL
  USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d');

-- Users can view their own rewards
CREATE POLICY "Users can view their own rewards"
  ON rewards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (claim) their own rewards
CREATE POLICY "Users can update their own rewards"
  ON rewards
  FOR UPDATE
  USING (auth.uid() = user_id);
