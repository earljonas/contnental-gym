create table gym_private.security_settings (
  singleton boolean primary key default true check (singleton),
  staff_mfa_required boolean not null default false
);
insert into gym_private.security_settings (singleton) values (true);

create or replace function public.staff_mfa_required()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select staff_mfa_required from gym_private.security_settings where singleton), true)
    and exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('SUPER_ADMIN', 'BRANCH_ADMIN'))
    and coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2';
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select not public.staff_mfa_required() and exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'SUPER_ADMIN'
  );
$$;

create or replace function public.is_branch_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select not public.staff_mfa_required() and exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'BRANCH_ADMIN'
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_super_admin() or public.is_branch_admin();
$$;

revoke execute on function public.staff_mfa_required() from public, anon;
grant execute on function public.staff_mfa_required() to authenticated;

grant insert on public.branches to authenticated;
grant usage on sequence public.branches_id_seq to authenticated;
create unique index if not exists branches_unique_normalized_name on public.branches(lower(btrim(name)));
