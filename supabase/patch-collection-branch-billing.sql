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
