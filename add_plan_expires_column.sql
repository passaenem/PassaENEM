-- Add plan_expires_at column to profiles if it doesn't exist
alter table profiles 
add column if not exists plan_expires_at timestamp with time zone default null;
