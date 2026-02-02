-- Add columns for Anti-Cheating and Time Tracking
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER,
ADD COLUMN IF NOT EXISTS cheat_events INTEGER DEFAULT 0;

-- Optional: Add a comment to explain the columns
COMMENT ON COLUMN exam_results.time_taken_seconds IS 'Duration of the exam in seconds';
COMMENT ON COLUMN exam_results.cheat_events IS 'Number of security violations during the exam';
