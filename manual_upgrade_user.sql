-- Manual Upgrade for User leandro.nunes
-- This script manually sets the plan to PRO and gives 350 credits.

UPDATE profiles
SET 
  plan_type = 'pro',
  credits = 350,
  plan_end_date = (now() + interval '30 days'),
  updated_at = now()
WHERE id IN (
  SELECT id FROM auth.users WHERE email LIKE 'leandro.nunes%'
);

-- Verify the update (Optional, will show affected rows)
-- SELECT * FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email LIKE 'leandro.nunes%');
