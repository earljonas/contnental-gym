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
