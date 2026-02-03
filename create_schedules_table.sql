-- Create a table to store generated study schedules
create table if not exists user_schedules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  week_number integer not null,
  schedule_data jsonb not null, -- Stores the AI generated JSON
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure unique schedule per user per week to prevent duplicates
  unique(user_id, week_number)
);

-- Add RLS policies
alter table user_schedules enable row level security;

create policy "Users can view their own schedules"
  on user_schedules for select
  using (auth.uid() = user_id);

create policy "Users can insert their own schedules"
  on user_schedules for insert
  with check (auth.uid() = user_id);
