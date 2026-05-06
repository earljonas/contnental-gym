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
