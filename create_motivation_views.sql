-- Create a table to track if a user has seen the daily motivation
create table if not exists daily_motivation_views (
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null default current_date,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Composite primary key ensures one record per user per day
  primary key (user_id, date)
);

-- RLS Policies
alter table daily_motivation_views enable row level security;

-- Users can view their own view records (to check if they saw it)
create policy "Users can select own views"
  on daily_motivation_views for select
  using (auth.uid() = user_id);

-- Users can insert their own view records (when they see the modal)
create policy "Users can insert own views"
  on daily_motivation_views for insert
  with check (auth.uid() = user_id);
