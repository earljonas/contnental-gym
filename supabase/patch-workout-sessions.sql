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
