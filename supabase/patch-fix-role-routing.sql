-- =============================================
-- Patch: Fix role routing + remove profiles RLS recursion
-- Run this in your Supabase SQL Editor
-- =============================================

create table if not exists public.user_roles (
  user_id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'MEMBER' check (role in ('MEMBER', 'BRANCH_ADMIN', 'SUPER_ADMIN')),
  branch_id int references public.branches(id),
  updated_at timestamptz default now()
);

alter table public.user_roles enable row level security;
alter table public.user_roles add column if not exists updated_at timestamptz default now();

drop policy if exists "Users can view own role" on public.user_roles;
create policy "Users can view own role" on public.user_roles
  for select using (user_id = auth.uid());

insert into public.user_roles (user_id, role, branch_id)
select id, role, branch_id from public.profiles
on conflict (user_id) do update
set role = excluded.role,
    branch_id = excluded.branch_id,
    updated_at = now();

create or replace function public.sync_user_role_from_profile()
returns trigger as $$
begin
  insert into public.user_roles (user_id, role, branch_id, updated_at)
  values (new.id, new.role, new.branch_id, now())
  on conflict (user_id) do update
  set role = excluded.role,
      branch_id = excluded.branch_id,
      updated_at = now();

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_profile_role_changed on public.profiles;
create trigger on_profile_role_changed
  after insert or update of role, branch_id on public.profiles
  for each row execute function public.sync_user_role_from_profile();

create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'SUPER_ADMIN'
  );
$$ language sql security definer set search_path = public;

create or replace function public.is_branch_admin()
returns boolean as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'BRANCH_ADMIN'
  );
$$ language sql security definer set search_path = public;

create or replace function public.my_branch_id()
returns int as $$
  select branch_id
  from public.user_roles
  where user_id = auth.uid();
$$ language sql security definer set search_path = public;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('SUPER_ADMIN', 'BRANCH_ADMIN')
  );
$$ language sql security definer set search_path = public;

drop policy if exists "Super admins can view all profiles" on public.profiles;
drop policy if exists "Super admins can update all profiles" on public.profiles;
drop policy if exists "Branch admins can view branch profiles" on public.profiles;
create policy "Super admins can view all profiles" on public.profiles
  for select using (public.is_super_admin());
create policy "Super admins can update all profiles" on public.profiles
  for update using (public.is_super_admin());
create policy "Branch admins can view branch profiles" on public.profiles
  for select using (
    public.is_branch_admin()
    and branch_id = public.my_branch_id()
  );

drop policy if exists "Branch admins can view branch memberships" on public.memberships;
drop policy if exists "Branch admins can update branch memberships" on public.memberships;
create policy "Branch admins can view branch memberships" on public.memberships
  for select using (
    public.is_branch_admin()
    and exists (
      select 1
      from public.user_roles member_role
      where member_role.user_id = memberships.user_id
        and member_role.branch_id = public.my_branch_id()
    )
  );
create policy "Branch admins can update branch memberships" on public.memberships
  for update using (
    public.is_branch_admin()
    and exists (
      select 1
      from public.user_roles member_role
      where member_role.user_id = memberships.user_id
        and member_role.branch_id = public.my_branch_id()
    )
  );

drop policy if exists "Branch admins can manage branch payments" on public.payments;
create policy "Branch admins can manage branch payments" on public.payments
  for all using (
    public.is_branch_admin()
    and exists (
      select 1
      from public.user_roles member_role
      where member_role.user_id = payments.user_id
        and member_role.branch_id = public.my_branch_id()
    )
  );

drop policy if exists "Branch admins can manage branch attendance" on public.attendance;
create policy "Branch admins can manage branch attendance" on public.attendance
  for all using (
    public.is_branch_admin()
    and attendance.branch_id = public.my_branch_id()
  );

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone, role, branch_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'MEMBER'),
    nullif(new.raw_user_meta_data->>'branch_id', '')::int
  );

  insert into public.user_roles (user_id, role, branch_id, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'MEMBER'),
    nullif(new.raw_user_meta_data->>'branch_id', '')::int,
    now()
  )
  on conflict (user_id) do update
  set role = excluded.role,
      branch_id = excluded.branch_id,
      updated_at = now();

  return new;
end;
$$ language plpgsql security definer set search_path = public;
