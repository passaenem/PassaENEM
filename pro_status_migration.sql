-- Add plan_started_at column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMP WITH TIME ZONE;
