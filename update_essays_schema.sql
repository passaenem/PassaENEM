-- Add missing columns for detailed feedback storage
ALTER TABLE essays 
ADD COLUMN IF NOT EXISTS competency_feedback JSONB,
ADD COLUMN IF NOT EXISTS overall_impression TEXT,
ADD COLUMN IF NOT EXISTS inline_comments JSONB;
