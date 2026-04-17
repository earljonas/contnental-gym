-- =============================================
-- Run AFTER creating the 4 admin users in
-- Supabase Dashboard → Authentication → Users
-- =============================================

-- Set super admin role
update public.profiles
set role = 'SUPER_ADMIN'
where id = (select id from auth.users where email = 'admin@contnental.com');

insert into public.user_roles (user_id, role, branch_id)
values (
  (select id from auth.users where email = 'admin@contnental.com'),
  'SUPER_ADMIN',
  null
)
on conflict (user_id) do update
set role = excluded.role,
    branch_id = excluded.branch_id,
    updated_at = now();

-- Set branch admin roles + assign branches
-- Ecoland = branch_id 1
update public.profiles
set role = 'BRANCH_ADMIN', branch_id = 1
where id = (select id from auth.users where email = 'ecoland@contnental.com');

insert into public.user_roles (user_id, role, branch_id)
values (
  (select id from auth.users where email = 'ecoland@contnental.com'),
  'BRANCH_ADMIN',
  1
)
on conflict (user_id) do update
set role = excluded.role,
    branch_id = excluded.branch_id,
    updated_at = now();

-- Torres = branch_id 2
update public.profiles
set role = 'BRANCH_ADMIN', branch_id = 2
where id = (select id from auth.users where email = 'torres@contnental.com');

insert into public.user_roles (user_id, role, branch_id)
values (
  (select id from auth.users where email = 'torres@contnental.com'),
  'BRANCH_ADMIN',
  2
)
on conflict (user_id) do update
set role = excluded.role,
    branch_id = excluded.branch_id,
    updated_at = now();

-- Lanang = branch_id 3
update public.profiles
set role = 'BRANCH_ADMIN', branch_id = 3
where id = (select id from auth.users where email = 'lanang@contnental.com');

insert into public.user_roles (user_id, role, branch_id)
values (
  (select id from auth.users where email = 'lanang@contnental.com'),
  'BRANCH_ADMIN',
  3
)
on conflict (user_id) do update
set role = excluded.role,
    branch_id = excluded.branch_id,
    updated_at = now();
