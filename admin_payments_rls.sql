-- 1. Allow Admin to VIEW all payments
CREATE POLICY "Admins can view all payments" 
ON payments 
FOR SELECT 
USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d');

-- Optional: If you need to update payments status manually
CREATE POLICY "Admins can update all payments" 
ON payments 
FOR UPDATE 
USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d');
