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
