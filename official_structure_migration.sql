-- Add 'type' column to official_exams if not exists (to distinguish old PDF-only vs Structured, though we might migrate all)
ALTER TABLE official_exams ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'structured'; -- 'pdf_only' or 'structured'

-- Create official_questions table
CREATE TABLE IF NOT EXISTS official_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES official_exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  statement TEXT NOT NULL,
  alternatives JSONB NOT NULL, -- Array of strings ["A...", "B..."]
  correct_answer TEXT, -- "A", "B", "C", "D", "E"
  area TEXT, -- Linguagens, Humanas, Natureza, Matemática
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE official_questions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage official questions" 
ON official_questions 
FOR ALL 
USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d');

CREATE POLICY "Users can view official questions" 
ON official_questions 
FOR SELECT 
TO authenticated 
USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_official_questions_exam_id ON official_questions(exam_id);
