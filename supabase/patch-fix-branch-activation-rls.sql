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
