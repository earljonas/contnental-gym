-- =============================================
-- Patch: REBUILD POLICIES TO FIX RECURSION
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Drop the policies that depend on the functions
-- This allows us to safely drop and recreate the functions
drop policy if exists "Super admins can manage branches" on public.branches;
drop policy if exists "Super admins can view all profiles" on public.profiles;
drop policy if exists "Super admins can update all profiles" on public.profiles;
drop policy if exists "Super admins can manage plans" on public.membership_plans;
drop policy if exists "Super admins can manage all memberships" on public.memberships;
drop policy if exists "Super admins can manage all payments" on public.payments;
drop policy if exists "Super admins can manage all attendance" on public.attendance;

-- 2. Drop the original SQL functions
drop function if exists public.is_super_admin();
drop function if exists public.my_branch_id();
drop function if exists public.is_admin();

-- 3. Recreate them securely as PLPGSQL to prevent recursion
create or replace function public.is_super_admin()
returns boolean as $$
declare
  is_admin boolean;
begin
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'SUPER_ADMIN'
  ) into is_admin;
  return is_admin;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.my_branch_id()
returns int as $$
declare
  b_id int;
begin
  select branch_id from public.profiles where id = auth.uid() into b_id;
  return b_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_admin()
returns boolean as $$
declare
  has_admin boolean;
begin
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('SUPER_ADMIN', 'BRANCH_ADMIN')
  ) into has_admin;
  return has_admin;
end;
$$ language plpgsql security definer set search_path = public;

-- 4. Recreate all the dropped policies
create policy "Super admins can manage branches" on public.branches
  for all using (public.is_super_admin());

create policy "Super admins can view all profiles" on public.profiles
  for select using (public.is_super_admin());

create policy "Super admins can update all profiles" on public.profiles
  for update using (public.is_super_admin());

create policy "Super admins can manage plans" on public.membership_plans
  for all using (public.is_super_admin());

create policy "Super admins can manage all memberships" on public.memberships
  for all using (public.is_super_admin());

create policy "Super admins can manage all payments" on public.payments
  for all using (public.is_super_admin());

create policy "Super admins can manage all attendance" on public.attendance
  for all using (public.is_super_admin());
