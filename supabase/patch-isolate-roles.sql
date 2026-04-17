-- =============================================
-- Patch: Isolate Roles to prevent Recursion
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Create a dedicated user_roles table to brutally terminate any possibility of recursion
create table if not exists public.user_roles (
  user_id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'MEMBER' check (role in ('MEMBER', 'BRANCH_ADMIN', 'SUPER_ADMIN')),
  branch_id int references public.branches(id)
);
alter table public.user_roles enable row level security;

-- 2. Everyone can view their own role
drop policy if exists "Users can view own role" on public.user_roles;
create policy "Users can view own role" on public.user_roles
  for select using (user_id = auth.uid());

-- 3. Migrate existing roles from profiles to user_roles
insert into public.user_roles (user_id, role, branch_id)
select id, role, branch_id from public.profiles
on conflict (user_id) do update 
set role = excluded.role, branch_id = excluded.branch_id;

-- 4. Redefine the helper functions to query user_roles INSTEAD of profiles!
create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'SUPER_ADMIN'
  );
$$ language sql security definer;

create or replace function public.my_branch_id()
returns int as $$
  select branch_id from public.user_roles where user_id = auth.uid();
$$ language sql security definer;

create or replace function public.is_branch_admin()
returns boolean as $$
  select exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'BRANCH_ADMIN'
  );
$$ language sql security definer;

-- 5. Drop old recursive policies
drop policy if exists "Super admins can view all profiles" on public.profiles;
drop policy if exists "Super admins can update all profiles" on public.profiles;

-- 6. Add new non-recursive policies
create policy "Super admins can view all profiles" on public.profiles
  for select using (public.is_super_admin());

create policy "Super admins can update all profiles" on public.profiles
  for update using (public.is_super_admin());

-- 7. Update the trigger so new users get correctly mirrored in both tables
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert into profiles (for the UI)
  insert into public.profiles (id, email, first_name, last_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'MEMBER')
  );
  
  -- Insert into user_roles (for the backend RLS security checks)
  insert into public.user_roles (user_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'MEMBER')
  );
  
  return new;
end;
$$ language plpgsql security definer;
