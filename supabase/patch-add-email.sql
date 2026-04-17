-- =============================================
-- Patch: Add email to public.profiles
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Add the email column (allow null initially so it doesn't break existing rows)
alter table public.profiles add column if not exists email text;

-- 2. Backfill existing profiles with their email from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id;

-- 3. Now that all existing rows have emails, make the column NOT NULL
alter table public.profiles alter column email set not null;

-- 4. Update the trigger so future signups copy the email automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone, role)
  values (
    new.id,
    new.email, -- copies email from auth.users
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'MEMBER')
  );
  return new;
end;
$$ language plpgsql security definer;
