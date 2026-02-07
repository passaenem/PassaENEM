-- Create is_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d'; -- Hardcoded Admin ID
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    credits INTEGER NOT NULL DEFAULT 15,
    active BOOLEAN DEFAULT true,
    usage_limit INTEGER, -- NULL means unlimited
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create coupons usage table
CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(coupon_id, user_id) -- Prevent double redemption
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Policies for coupons
CREATE POLICY "Admins can view all coupons" ON coupons
    FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert coupons" ON coupons
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update coupons" ON coupons
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete coupons" ON coupons
    FOR DELETE
    USING (public.is_admin());

-- Users need to read coupons to redeem them (specifically by code)
CREATE POLICY "Users can view active coupons" ON coupons
    FOR SELECT
    USING (active = true);


-- Policies for coupon_usages
CREATE POLICY "Admins can view all coupon usages" ON coupon_usages
    FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can view their own coupon usages" ON coupon_usages
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert coupon usages" ON coupon_usages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Optional: Function to increment usage safely
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = coupon_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Function to add credits safely (reused from potential previous scripts or newly created)
CREATE OR REPLACE FUNCTION add_user_credits(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credits = COALESCE(credits, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
