-- Add missing UPDATE policy for user_schedules
create policy "Users can update their own schedules"
  on user_schedules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
