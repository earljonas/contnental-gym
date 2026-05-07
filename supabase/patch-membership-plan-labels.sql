-- =============================================
-- Patch: Align membership plan labels with duration-based pricing
-- Run this in your Supabase SQL Editor
-- =============================================

UPDATE public.membership_plans
SET
  name = '1 Month',
  price = 1000.00,
  duration = 30
WHERE id = 1;

UPDATE public.membership_plans
SET
  name = '3 Months',
  price = 2700.00,
  duration = 90
WHERE id = 2;

UPDATE public.membership_plans
SET
  name = '6 Months',
  price = 5100.00,
  duration = 180
WHERE id = 3;

INSERT INTO public.membership_plans (name, price, duration, features, is_active)
SELECT '12 Months', 9600.00, 365, ARRAY[]::text[], true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.membership_plans
  WHERE name = '12 Months'
);

