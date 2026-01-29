-- Add subscription columns to profiles if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_end_date timestamptz,
ADD COLUMN IF NOT EXISTS subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) NOT NULL,
    amount numeric NOT NULL,
    status text NOT NULL, -- pending, approved, rejected, cancelled
    external_id text, -- ID from Mercado Pago
    type text NOT NULL, -- 'subscription' or 'one_time'
    created_at timestamptz DEFAULT now()
);

-- RLS Policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own payments
CREATE POLICY "Users can view own payments" 
ON payments FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins to view all payments (using the app metadata or specific admin ID check)
-- Assuming the same admin ID as used elsewhere or a role-based approach. 
-- For simplicity, if we rely on the specific ADMIN_ID content validation in frontend, 
-- we might want a stricter RLS here if safety is paramount, but often reading is less risky.
-- Let's stick to the standard check or create a policy that allows the service role (which admin usually uses indirectly via app logic or dashboard if implemented with service role client)
-- But since we are using client-side calls in the Admin Dashboard, we need a policy for the Admin user.
-- Replace '426d48bb-fc97-4461-acc9-a8a59445b72d' with the actual Admin ID if known, or use a role.
CREATE POLICY "Admins can view all payments" 
ON payments FOR SELECT 
USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d'); -- Updating with the ID seen in Sidebar.tsx

-- Grant access to authenticated users
GRANT ALL ON payments TO authenticated;
GRANT ALL ON payments TO service_role;
