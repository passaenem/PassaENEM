create table if not exists feedbacks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  admin_response text,
  response_at timestamp with time zone
);

alter table feedbacks enable row level security;

-- Policy: Everyone can read feedbacks (public board)
create policy "Public feedbacks are viewable by everyone"
  on feedbacks for select
  using ( true );

-- Policy: Authenticated users can insert their own feedback
create policy "Users can insert their own feedback"
  on feedbacks for insert
  with check ( auth.uid() = user_id );

-- Policy: Only Admin can update (to add responses)
-- Replacing with your specific Admin ID for simplicity, or using a role check if you have one.
-- Giving update access to the specific admin ID found in your codebase: 426d48bb-fc97-4461-acc9-a8a59445b72d
create policy "Admin can update feedbacks"
  on feedbacks for update
  using ( auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d' )
  with check ( auth.uid() = '426d48bb-fc97-4461-acc9-a8a59445b72d' );
