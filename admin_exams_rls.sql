-- Allow Admin to VIEW all exam results for dashboard stats
CREATE POLICY "Admins can view all exam results" 
ON exam_results 
FOR SELECT 
USING (auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d');
