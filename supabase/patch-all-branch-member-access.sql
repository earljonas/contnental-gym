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
