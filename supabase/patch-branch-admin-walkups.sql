-- =============================================
-- Patch: Allow branch admins to see + activate walkup members
-- Run this in your Supabase SQL Editor
-- =============================================

-- Branch admins need to see members who registered online (branch_id IS NULL)
-- so they can activate them via the walkup queue.

-- 1. Allow branch admins to VIEW unassigned members (the walkup queue)
CREATE POLICY "Branch admins can view unassigned members" ON public.profiles
  FOR SELECT USING (
    public.is_branch_admin()
    AND profiles.branch_id IS NULL
    AND profiles.role = 'MEMBER'
  );

-- 2. Allow branch admins to UPDATE unassigned members (to assign branch_id)
CREATE POLICY "Branch admins can update unassigned members" ON public.profiles
  FOR UPDATE USING (
    public.is_branch_admin()
    AND profiles.branch_id IS NULL
    AND profiles.role = 'MEMBER'
  );

-- 3. Allow branch admins to view memberships of unassigned members
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
CREATE POLICY "Branch admins can insert payments" ON public.payments
  FOR INSERT WITH CHECK (
    public.is_branch_admin()
  );
