-- Ensure PROFILES has necessary columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 20;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_end_date TIMESTAMP WITH TIME ZONE;

-- Create PAYMENTS table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL, -- 'approved', 'pending'
  type TEXT NOT NULL, -- 'one_time', 'subscription'
  external_id TEXT, -- MercadoPago ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payments" 
ON payments FOR SELECT 
USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d');

CREATE POLICY "Users can view own payments" 
ON payments FOR SELECT 
USING (auth.uid() = user_id);
