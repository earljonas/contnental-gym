-- Fresh Supabase baseline. Squashed from the eleven legacy setup scripts.

-- schema.sql

-- =============================================
-- Contnental Fitness Gym — Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. BRANCHES (must be first — referenced by profiles)
create table public.branches (
  id serial primary key,
  name text not null,
  location text,
  created_at timestamptz default now()
);

-- 2. PROFILES (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  role text not null default 'MEMBER' check (role in ('MEMBER', 'BRANCH_ADMIN', 'SUPER_ADMIN')),
  branch_id int references public.branches(id),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. MEMBERSHIP PLANS
create table public.membership_plans (
  id serial primary key,
  name text not null,
  price decimal(10,2) not null,
  duration int not null default 30,
  features text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. MEMBERSHIPS (subscriptions)
create table public.memberships (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_id int references public.membership_plans(id) not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- 5. PAYMENTS
create table public.payments (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  membership_id int references public.memberships(id),
  amount decimal(10,2) not null,
  payment_method text not null default 'CASH' check (payment_method in ('CASH', 'GCASH')),
  status text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED')),
  reference_number text,
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  created_at timestamptz default now()
);

-- 6. ATTENDANCE
create table public.attendance (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  branch_id int references public.branches(id) not null,
  checked_in_by uuid references public.profiles(id),
  check_in_time timestamptz default now()
);

-- 7. WORKOUT LOGS
create table public.workout_logs (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  workout_date date not null default current_date,
  details text,
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;
alter table public.workout_logs enable row level security;

-- Helper: check if current user is super admin
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

-- ── BRANCHES ──
create policy "Anyone can view branches" on public.branches
  for select using (true);

create policy "Super admins can manage branches" on public.branches
  for all using (public.is_super_admin());

-- ── PROFILES ──
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Auto-insert profile on signup" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Super admins can view all profiles" on public.profiles
  for select using (public.is_super_admin());

create policy "Super admins can update all profiles" on public.profiles
  for update using (public.is_super_admin());

create policy "Branch admins can view branch profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'BRANCH_ADMIN'
        and p.branch_id = profiles.branch_id
    )
  );

-- ── MEMBERSHIP PLANS ──
create policy "Anyone can view plans" on public.membership_plans
  for select using (true);

create policy "Super admins can manage plans" on public.membership_plans
  for all using (public.is_super_admin());

-- ── MEMBERSHIPS ──
create policy "Users can view own memberships" on public.memberships
  for select using (auth.uid() = user_id);

create policy "Users can insert own memberships" on public.memberships
  for insert with check (auth.uid() = user_id);

create policy "Super admins can manage all memberships" on public.memberships
  for all using (public.is_super_admin());

create policy "Branch admins can view branch memberships" on public.memberships
  for select using (
    exists (
      select 1 from public.profiles admin_p
      where admin_p.id = auth.uid()
        and admin_p.role = 'BRANCH_ADMIN'
        and admin_p.branch_id = (
          select branch_id from public.profiles where id = memberships.user_id
        )
    )
  );

create policy "Branch admins can update branch memberships" on public.memberships
  for update using (
    exists (
      select 1 from public.profiles admin_p
      where admin_p.id = auth.uid()
        and admin_p.role = 'BRANCH_ADMIN'
        and admin_p.branch_id = (
          select branch_id from public.profiles where id = memberships.user_id
        )
    )
  );

-- ── PAYMENTS ──
create policy "Users can view own payments" on public.payments
  for select using (auth.uid() = user_id);

create policy "Super admins can manage all payments" on public.payments
  for all using (public.is_super_admin());

create policy "Branch admins can manage branch payments" on public.payments
  for all using (
    exists (
      select 1 from public.profiles admin_p
      where admin_p.id = auth.uid()
        and admin_p.role = 'BRANCH_ADMIN'
        and admin_p.branch_id = (
          select branch_id from public.profiles where id = payments.user_id
        )
    )
  );

-- ── ATTENDANCE ──
create policy "Users can view own attendance" on public.attendance
  for select using (auth.uid() = user_id);

create policy "Super admins can manage all attendance" on public.attendance
  for all using (public.is_super_admin());

create policy "Branch admins can manage branch attendance" on public.attendance
  for all using (
    exists (
      select 1 from public.profiles admin_p
      where admin_p.id = auth.uid()
        and admin_p.role = 'BRANCH_ADMIN'
        and admin_p.branch_id = attendance.branch_id
    )
  );

-- ── WORKOUT LOGS ──
create policy "Users can manage own workout logs" on public.workout_logs
  for all using (auth.uid() = user_id);

-- =============================================
-- SEED DATA
-- =============================================

-- 3 branches (update names/locations to your actual branches)
insert into public.branches (name, location) values
  ('Contnental Fitness Gym — Ecoland', 'Ecoland, Davao City'),
  ('Contnental Fitness Gym — Torres', 'Torres, Davao City'),
  ('Contnental Fitness Gym — Lanang', 'Lanang, Davao City');

-- Membership plans
insert into public.membership_plans (name, price, duration, features) values
  ('BASIC', 1500.00, 30, ARRAY['Full gym floor access', 'Locker room and showers', 'Open daily 6AM – 10PM', 'Equipment walkthrough on signup']),
  ('ELITE', 2500.00, 30, ARRAY['Everything in Basic', 'Group training sessions', 'Coached technique clinics', 'Priority equipment booking', '1 guest pass per month']),
  ('PREMIUM', 4000.00, 30, ARRAY['Everything in Elite', 'Monthly personal programming', 'Body composition check-ins', '24/7 facility access', 'Recovery area access']);

-- =============================================
-- FUNCTION: Auto-create profile on signup
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'MEMBER')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: runs after every signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- patch-fix-role-routing.sql

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

-- patch-branch-admin-walkups.sql

-- =============================================
-- Patch: Allow branch admins to see + activate walkup members
-- Run this in your Supabase SQL Editor
-- =============================================

-- Branch admins need to see members who registered online (branch_id IS NULL)
-- so they can activate them via the walkup queue.

CREATE OR REPLACE FUNCTION public.branch_admin_can_manage_member(member_id uuid)
RETURNS boolean AS $$
  SELECT public.is_branch_admin()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = member_id
        AND p.role = 'MEMBER'
        AND p.branch_id = public.my_branch_id()
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 1. Allow branch admins to VIEW unassigned members (the walkup queue)
DROP POLICY IF EXISTS "Branch admins can view unassigned members" ON public.profiles;
CREATE POLICY "Branch admins can view unassigned members" ON public.profiles
  FOR SELECT USING (
    public.is_branch_admin()
    AND profiles.branch_id IS NULL
    AND profiles.role = 'MEMBER'
  );

-- 2. Allow branch admins to UPDATE unassigned members (to assign branch_id)
DROP POLICY IF EXISTS "Branch admins can update unassigned members" ON public.profiles;
CREATE POLICY "Branch admins can update unassigned members" ON public.profiles
  FOR UPDATE USING (
    public.is_branch_admin()
    AND profiles.branch_id IS NULL
    AND profiles.role = 'MEMBER'
  )
  WITH CHECK (
    public.is_branch_admin()
    AND profiles.branch_id = public.my_branch_id()
    AND profiles.role = 'MEMBER'
  );

-- 3. Allow branch admins to view memberships of unassigned members
DROP POLICY IF EXISTS "Branch admins can view unassigned memberships" ON public.memberships;
CREATE POLICY "Branch admins can view unassigned memberships" ON public.memberships
  FOR SELECT USING (
    public.is_branch_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = memberships.user_id
        AND p.branch_id IS NULL
        AND p.role = 'MEMBER'
    )
  );

-- 4. Allow branch admins to update memberships of unassigned members (to activate)
DROP POLICY IF EXISTS "Branch admins can update unassigned memberships" ON public.memberships;
CREATE POLICY "Branch admins can update unassigned memberships" ON public.memberships
  FOR UPDATE USING (
    public.is_branch_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = memberships.user_id
        AND p.branch_id IS NULL
        AND p.role = 'MEMBER'
    )
  );

-- 5. Allow branch admins to insert payments for any member they can see
DROP POLICY IF EXISTS "Branch admins can insert payments" ON public.payments;
CREATE POLICY "Branch admins can insert payments" ON public.payments
  FOR INSERT WITH CHECK (
    public.is_branch_admin()
  );

-- 6. Allow branch admins to finish activation after a member has been assigned
-- to their branch.
DROP POLICY IF EXISTS "Branch admins can view assigned member memberships" ON public.memberships;
CREATE POLICY "Branch admins can view assigned member memberships" ON public.memberships
  FOR SELECT USING (
    public.branch_admin_can_manage_member(memberships.user_id)
  );

DROP POLICY IF EXISTS "Branch admins can update assigned member memberships" ON public.memberships;
CREATE POLICY "Branch admins can update assigned member memberships" ON public.memberships
  FOR UPDATE USING (
    public.branch_admin_can_manage_member(memberships.user_id)
  )
  WITH CHECK (
    public.branch_admin_can_manage_member(memberships.user_id)
  );

DROP POLICY IF EXISTS "Branch admins can insert assigned member payments" ON public.payments;
CREATE POLICY "Branch admins can insert assigned member payments" ON public.payments
  FOR INSERT WITH CHECK (
    public.branch_admin_can_manage_member(payments.user_id)
  );

-- patch-fix-branch-activation-rls.sql

-- =============================================
-- Patch: Fix branch admin activation of pending members
-- Run this in your Supabase SQL Editor
-- =============================================

-- Branch admins activate online registrations by changing profiles.branch_id
-- from NULL to their own branch. The update policy must allow both the old
-- row (unassigned member) and the new row (member assigned to my branch).

CREATE OR REPLACE FUNCTION public.branch_admin_can_manage_member(member_id uuid)
RETURNS boolean AS $$
  SELECT public.is_branch_admin()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = member_id
        AND p.role = 'MEMBER'
        AND p.branch_id = public.my_branch_id()
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Branch admins can update unassigned members" ON public.profiles;
CREATE POLICY "Branch admins can update unassigned members" ON public.profiles
  FOR UPDATE USING (
    public.is_branch_admin()
    AND profiles.branch_id IS NULL
    AND profiles.role = 'MEMBER'
  )
  WITH CHECK (
    public.is_branch_admin()
    AND profiles.branch_id = public.my_branch_id()
    AND profiles.role = 'MEMBER'
  );

DROP POLICY IF EXISTS "Branch admins can view assigned member memberships" ON public.memberships;
CREATE POLICY "Branch admins can view assigned member memberships" ON public.memberships
  FOR SELECT USING (
    public.branch_admin_can_manage_member(memberships.user_id)
  );

DROP POLICY IF EXISTS "Branch admins can update assigned member memberships" ON public.memberships;
CREATE POLICY "Branch admins can update assigned member memberships" ON public.memberships
  FOR UPDATE USING (
    public.branch_admin_can_manage_member(memberships.user_id)
  )
  WITH CHECK (
    public.branch_admin_can_manage_member(memberships.user_id)
  );

DROP POLICY IF EXISTS "Branch admins can insert assigned member payments" ON public.payments;
CREATE POLICY "Branch admins can insert assigned member payments" ON public.payments
  FOR INSERT WITH CHECK (
    public.branch_admin_can_manage_member(payments.user_id)
  );

-- Repair rows from failed/partial activations: if payment was already
-- confirmed but the membership stayed PENDING, make it ACTIVE.
UPDATE public.memberships m
SET
  status = 'ACTIVE',
  start_date = COALESCE(m.start_date, p.confirmed_at::date, CURRENT_DATE),
  end_date = COALESCE(
    m.end_date,
    COALESCE(m.start_date, p.confirmed_at::date, CURRENT_DATE) + mp.duration
  )
FROM public.payments p
JOIN public.membership_plans mp ON true
JOIN public.profiles member_profile ON true
WHERE p.membership_id = m.id
  AND mp.id = m.plan_id
  AND member_profile.id = m.user_id
  AND p.status = 'CONFIRMED'
  AND m.status = 'PENDING'
  AND member_profile.branch_id IS NOT NULL;

-- patch-all-branch-member-access.sql

-- =============================================
-- Patch: Allow all branches to check in all active members
-- Run this in your Supabase SQL Editor
-- =============================================

-- Members can use any location, so branch admins need read access to member
-- profiles and memberships outside their assigned branch for check-in lookup.

DROP POLICY IF EXISTS "Branch admins can view all member profiles for check-in" ON public.profiles;
CREATE POLICY "Branch admins can view all member profiles for check-in" ON public.profiles
  FOR SELECT USING (
    public.is_branch_admin()
    AND profiles.role = 'MEMBER'
  );

CREATE OR REPLACE FUNCTION public.branch_admin_update_member_profile(
  member_id uuid,
  new_first_name text,
  new_last_name text,
  new_phone text
)
RETURNS boolean AS $$
BEGIN
  IF NOT public.is_branch_admin() THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET
    first_name = btrim(new_first_name),
    last_name = btrim(new_last_name),
    phone = NULLIF(btrim(new_phone), ''),
    updated_at = now()
  WHERE id = member_id
    AND role = 'MEMBER';

  RETURN found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Branch admins can view all member memberships for check-in" ON public.memberships;
CREATE POLICY "Branch admins can view all member memberships for check-in" ON public.memberships
  FOR SELECT USING (
    public.is_branch_admin()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = memberships.user_id
        AND p.role = 'MEMBER'
    )
  );

-- This lets the server action detect same-day check-ins across branches.
DROP POLICY IF EXISTS "Branch admins can view attendance for duplicate check-in" ON public.attendance;
CREATE POLICY "Branch admins can view attendance for duplicate check-in" ON public.attendance
  FOR SELECT USING (
    public.is_branch_admin()
  );

-- patch-collection-branch-billing.sql

-- =============================================
-- Patch: Track the branch that collected each payment
-- Run this in your Supabase SQL Editor
-- =============================================

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS branch_id int REFERENCES public.branches(id);

-- Backfill older rows using the member's current home/activation branch.
UPDATE public.payments p
SET branch_id = member_profile.branch_id
FROM public.profiles member_profile
WHERE member_profile.id = p.user_id
  AND p.branch_id IS NULL
  AND member_profile.branch_id IS NOT NULL;

DROP POLICY IF EXISTS "Branch admins can view collected branch payments" ON public.payments;
CREATE POLICY "Branch admins can view collected branch payments" ON public.payments
  FOR SELECT USING (
    public.is_branch_admin()
    AND payments.branch_id = public.my_branch_id()
  );

DROP POLICY IF EXISTS "Branch admins can update collected branch payments" ON public.payments;
CREATE POLICY "Branch admins can update collected branch payments" ON public.payments
  FOR UPDATE USING (
    public.is_branch_admin()
    AND payments.branch_id = public.my_branch_id()
  )
  WITH CHECK (
    public.is_branch_admin()
    AND payments.branch_id = public.my_branch_id()
  );

DROP POLICY IF EXISTS "Branch admins can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Branch admins can insert assigned member payments" ON public.payments;
DROP POLICY IF EXISTS "Branch admins can insert collected branch payments" ON public.payments;
CREATE POLICY "Branch admins can insert collected branch payments" ON public.payments
  FOR INSERT WITH CHECK (
    public.is_branch_admin()
    AND payments.branch_id = public.my_branch_id()
  );

-- patch-membership-plan-labels.sql

-- =============================================
-- Patch: Align membership plan labels with duration-based pricing
-- Run this in your Supabase SQL Editor
-- =============================================

UPDATE public.membership_plans
SET
  name = '1 Month',
  price = 1000.00,
  duration = 30
WHERE id = 1;

UPDATE public.membership_plans
SET
  name = '3 Months',
  price = 2700.00,
  duration = 90
WHERE id = 2;

UPDATE public.membership_plans
SET
  name = '6 Months',
  price = 5100.00,
  duration = 180
WHERE id = 3;

INSERT INTO public.membership_plans (name, price, duration, features, is_active)
SELECT '12 Months', 9600.00, 365, ARRAY[]::text[], true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.membership_plans
  WHERE name = '12 Months'
);

-- patch-workout-sessions.sql

-- =============================================
-- Workout Sessions & Routines — Migration
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. ROUTINES (saved workout templates)
create table if not exists public.routines (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  days text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. ROUTINE EXERCISES (exercises inside a routine)
create table if not exists public.routine_exercises (
  id serial primary key,
  routine_id int references public.routines(id) on delete cascade not null,
  exercise_id text not null,
  exercise_name text not null,
  target_muscle text,
  default_sets int default 3,
  default_reps int default 10,
  default_weight decimal(10,2) default 0,
  sort_order int default 0
);

-- 3. WORKOUT SESSIONS (completed session logs with full set data)
create table if not exists public.workout_sessions (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  routine_id int references public.routines(id) on delete set null,
  routine_name text,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  total_volume decimal(10,2) default 0,
  exercises jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workout_sessions enable row level security;

-- ── ROUTINES ──
create policy "Users can manage own routines" on public.routines
  for all using (auth.uid() = user_id);

-- ── ROUTINE EXERCISES ──
create policy "Users can manage own routine exercises" on public.routine_exercises
  for all using (
    exists (
      select 1 from public.routines
      where routines.id = routine_exercises.routine_id
        and routines.user_id = auth.uid()
    )
  );

-- ── WORKOUT SESSIONS ──
create policy "Users can manage own sessions" on public.workout_sessions
  for all using (auth.uid() = user_id);

-- Admins can view all sessions (for analytics)
create policy "Admins can view all sessions" on public.workout_sessions
  for select using (public.is_admin());

-- patch-body-metrics.sql

-- =============================================
-- Body Metrics — Migration
-- Run this in your Supabase SQL Editor
-- =============================================

create table if not exists public.body_metrics (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  logged_at date not null default current_date,
  weight_kg decimal(5,2),
  body_fat_pct decimal(4,1),
  chest_cm decimal(5,1),
  waist_cm decimal(5,1),
  arm_cm decimal(5,1),
  leg_cm decimal(5,1),
  created_at timestamptz default now()
);

alter table public.body_metrics enable row level security;

create policy "Users can manage own body metrics" on public.body_metrics
  for all using (auth.uid() = user_id);

-- patch-announcements.sql

-- =============================================
-- Patch: Add announcements for super admin and branch admin
-- Run this in your Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id serial PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  all_branches boolean NOT NULL DEFAULT false,
  audience_branch_ids int[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'SENT' CHECK (status IN ('DRAFT', 'SENT')),
  publish_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS all_branches boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS audience_branch_ids int[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'SENT',
  ADD COLUMN IF NOT EXISTS publish_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.announcements
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN body SET NOT NULL,
  ALTER COLUMN all_branches SET DEFAULT false,
  ALTER COLUMN audience_branch_ids SET DEFAULT '{}',
  ALTER COLUMN status SET DEFAULT 'SENT';

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_status_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_status_check
  CHECK (status IN ('DRAFT', 'SENT'));

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage announcements" ON public.announcements;
CREATE POLICY "Super admins can manage announcements" ON public.announcements
  FOR ALL USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Branch admins can view live announcements" ON public.announcements;
CREATE POLICY "Branch admins can view live announcements" ON public.announcements
  FOR SELECT USING (
    public.is_branch_admin()
    AND status = 'SENT'
  );

DROP POLICY IF EXISTS "Members can view live announcements" ON public.announcements;
CREATE POLICY "Members can view live announcements" ON public.announcements
  FOR SELECT USING (
    status = 'SENT'
    AND EXISTS (
      SELECT 1
      FROM public.profiles member_profile
      WHERE member_profile.id = auth.uid()
        AND member_profile.role = 'MEMBER'
    )
  );

-- From this point forward, announcements are global for all members and
-- branch admins. Normalize any existing branch-targeted rows.
UPDATE public.announcements
SET
  all_branches = true,
  audience_branch_ids = '{}'
WHERE all_branches = false
  OR audience_branch_ids <> '{}';

-- patch-walk-in-registration-support.sql

-- =============================================
-- Patch: Support branch-admin walk-in registration
-- Run this in your Supabase SQL Editor
-- =============================================

-- The app creates walk-in members from a server action using
-- SUPABASE_SERVICE_ROLE_KEY. Keep that key server-only. Do not expose it as
-- NEXT_PUBLIC_*.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS branch_id int REFERENCES public.branches(id);

CREATE INDEX IF NOT EXISTS idx_profiles_role_branch
  ON public.profiles(role, branch_id);

CREATE INDEX IF NOT EXISTS idx_memberships_user_created
  ON public.memberships(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_branch_created
  ON public.payments(branch_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_user_check_in
  ON public.attendance(user_id, check_in_time DESC);

CREATE INDEX IF NOT EXISTS idx_membership_plans_active_duration
  ON public.membership_plans(is_active, duration);

-- Explicit Data API grants

grant usage on schema public to authenticated, service_role;

grant select on public.branches, public.profiles, public.user_roles,
  public.membership_plans, public.memberships, public.payments, public.attendance,
  public.routines, public.routine_exercises, public.workout_sessions,
  public.body_metrics, public.announcements to authenticated;

grant insert on public.membership_plans, public.memberships, public.payments,
  public.attendance, public.routines, public.routine_exercises,
  public.workout_sessions, public.body_metrics, public.announcements to authenticated;
grant update on public.branches, public.membership_plans, public.memberships,
  public.payments, public.routines to authenticated;
grant update (first_name, last_name, phone, avatar_url, branch_id, updated_at)
  on public.profiles to authenticated;
grant delete on public.routines, public.routine_exercises, public.body_metrics,
  public.announcements to authenticated;
grant usage on sequence public.membership_plans_id_seq, public.memberships_id_seq,
  public.payments_id_seq, public.attendance_id_seq, public.routines_id_seq,
  public.routine_exercises_id_seq, public.workout_sessions_id_seq,
  public.body_metrics_id_seq, public.announcements_id_seq to authenticated;
grant execute on function public.is_super_admin(), public.is_branch_admin(),
  public.is_admin(), public.my_branch_id(),
  public.branch_admin_can_manage_member(uuid),
  public.branch_admin_update_member_profile(uuid, text, text, text) to authenticated;

grant select, insert, update on public.profiles to service_role;
grant select, insert, delete on public.memberships to service_role;
grant insert on public.payments to service_role;
grant usage on sequence public.memberships_id_seq, public.payments_id_seq to service_role;
