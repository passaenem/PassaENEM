-- Secure Credits Column via Trigger
-- This ensures that even if a user has UPDATE permission on their profile, 
-- they solely cannot change their credit balance. Only the Service Role (API) can.

create or replace function public.prevent_credit_update()
returns trigger as $$
begin
  -- Check if the current user is NOT the service role (admin)
  -- Supabase 'service_role' key has the role 'service_role'
  if (auth.jwt() ->> 'role') != 'service_role' then
    if new.credits is distinct from old.credits then
      raise exception 'Você não tem permissão para alterar seus créditos manualmente.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to allow re-running
drop trigger if exists check_credits_update on public.profiles;

-- Create Trigger
create trigger check_credits_update
before update on public.profiles
for each row
execute function public.prevent_credit_update();
