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
