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
