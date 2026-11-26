-- Apply after the baseline, or after the eleven legacy setup scripts and their grants.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone)
  values (new.id, coalesce(new.email, ''), left(coalesce(new.raw_user_meta_data->>'first_name', ''), 80),
    left(coalesce(new.raw_user_meta_data->>'last_name', ''), 80), left(new.raw_user_meta_data->>'phone', 32));
  return new;
end;
$$;

revoke insert, update, delete on public.profiles, public.user_roles, public.memberships, public.payments, public.attendance
  from public, anon, authenticated, service_role;
revoke update (branch_id, role) on public.profiles from public, anon, authenticated, service_role;
grant update (first_name, last_name, phone, avatar_url, updated_at) on public.profiles to authenticated;
drop policy if exists "Auto-insert profile on signup" on public.profiles;
drop policy if exists "Branch admins can update unassigned members" on public.profiles;
drop policy if exists "Users can insert own memberships" on public.memberships;
drop policy if exists "Branch admins can view all member profiles for check-in" on public.profiles;
drop policy if exists "Branch admins can view all member memberships for check-in" on public.memberships;
drop policy if exists "Branch admins can view attendance for duplicate check-in" on public.attendance;
drop policy if exists "Branch admins can manage branch attendance" on public.attendance;
create policy "Branch admins can read visits at their branch" on public.attendance for select to authenticated
  using (public.is_branch_admin() and branch_id = public.my_branch_id());
drop policy if exists "Branch admins can manage branch payments" on public.payments;
drop policy if exists "Admins can view all sessions" on public.workout_sessions;

create or replace function public.branch_admin_update_member_profile(member_id uuid, new_first_name text, new_last_name text, new_phone text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not public.branch_admin_can_manage_member(member_id)
    or nullif(btrim(new_first_name), '') is null or length(new_first_name) > 80
    or nullif(btrim(new_last_name), '') is null or length(new_last_name) > 80 or length(new_phone) > 32 then
    return false;
  end if;
  update public.profiles set first_name = btrim(new_first_name), last_name = btrim(new_last_name),
    phone = nullif(btrim(new_phone), ''), updated_at = now()
  where id = member_id and role = 'MEMBER' and branch_id = public.my_branch_id();
  return found;
end;
$$;

drop policy if exists "Branch admins can view live announcements" on public.announcements;
drop policy if exists "Members can view live announcements" on public.announcements;
create policy "Read published announcements for own branch" on public.announcements for select to authenticated
  using (auth.uid() is not null and status = 'SENT' and coalesce(publish_at, created_at) <= now()
    and (all_branches or public.my_branch_id() = any(audience_branch_ids)));

drop policy if exists "Anyone can view plans" on public.membership_plans;
create policy "Anyone can view active plans" on public.membership_plans for select to anon, authenticated
  using (is_active is true);
create policy "Staff can read historical plans" on public.membership_plans for select to authenticated
  using (public.is_admin());
create policy "Members can read their historical plans" on public.membership_plans for select to authenticated
  using (exists (select 1 from public.memberships m where m.user_id = auth.uid() and m.plan_id = membership_plans.id));
grant select on public.membership_plans to anon;

create or replace function public.gym_business_date(at_time timestamptz default now())
returns date language sql immutable set search_path = '' as $$
  select (at_time at time zone 'Asia/Manila')::date;
$$;

alter table public.memberships add column if not exists quoted_price numeric(10,2) check (quoted_price >= 0);
alter table public.memberships add column if not exists quoted_duration integer check (quoted_duration > 0);

create or replace function public.enroll_member(requested_plan integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  member uuid := auth.uid();
  membership integer;
  offer public.membership_plans%rowtype;
begin
  perform 1 from public.profiles where id = member and role = 'MEMBER' for update;
  if not found or not exists (select 1 from auth.users where id = member and email_confirmed_at is not null) then
    raise exception 'Verify your email before selecting a plan' using errcode = '42501';
  end if;
  select id into membership from public.memberships where user_id = member and status = 'PENDING' and plan_id = requested_plan order by id desc limit 1;
  if found then return membership; end if;
  if exists (select 1 from public.memberships where user_id = member and
    (status = 'PENDING' or (status = 'ACTIVE' and public.gym_business_date() between start_date and end_date))) then
    raise exception 'You already have a pending or active membership' using errcode = 'P0001';
  end if;
  select * into offer from public.membership_plans where id = requested_plan and is_active for share;
  if not found then raise exception 'This plan is no longer available' using errcode = 'P0001'; end if;
  insert into public.memberships (user_id, plan_id, status, quoted_price, quoted_duration)
  values (member, requested_plan, 'PENDING', offer.price, offer.duration) returning id into membership;
  return membership;
end;
$$;

alter table public.payments add column if not exists settled_in_app boolean not null default false;
create unique index if not exists payments_one_app_settlement on public.payments (membership_id)
  where settled_in_app and status = 'CONFIRMED' and membership_id is not null;
alter table public.attendance add column if not exists business_date date;
alter table public.attendance add column if not exists check_in_method text check (check_in_method in ('QR', 'Manual'));
create unique index if not exists attendance_one_app_visit on public.attendance(user_id, business_date) where business_date is not null;

create or replace function public.settle_membership(
  target_member uuid, method text, reference text default null, target_membership integer default null,
  target_plan integer default null, collection_branch integer default null, pending_payment integer default null
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  is_super boolean := public.is_super_admin();
  branch integer := case when is_super then collection_branch else public.my_branch_id() end;
  target public.profiles%rowtype;
  membership public.memberships%rowtype;
  plan public.membership_plans%rowtype;
  payment public.payments%rowtype;
  existing_count integer;
  day date := public.gym_business_date();
  receipt integer;
  amount_due numeric(10,2);
  access_days integer;
  ref text := nullif(btrim(reference), '');
begin
  if actor is null or not (is_super or public.is_branch_admin()) then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  if pending_payment is not null then
    select * into payment from public.payments where id = pending_payment;
    if not found or payment.membership_id is null or (not is_super and payment.branch_id is distinct from branch) then
      raise exception 'Payment cannot be confirmed by this branch' using errcode = '42501';
    end if;
    branch := payment.branch_id;
    target_member := payment.user_id;
    target_membership := payment.membership_id;
    method := coalesce(method, payment.payment_method);
    ref := coalesce(ref, payment.reference_number);
  end if;
  if branch is null or not exists (select 1 from public.branches where id = branch) then
    raise exception 'Select an existing collection branch' using errcode = 'P0001';
  end if;
  if method is null or method not in ('CASH', 'GCASH') or (method = 'GCASH' and (ref is null or length(ref) > 80)) then
    raise exception 'Choose cash or enter a valid GCash reference' using errcode = 'P0001';
  end if;
  if method = 'CASH' then ref := null; end if;

  select * into target from public.profiles where id = target_member and role = 'MEMBER' for update;
  if not found or (not is_super and target.branch_id is not null and target.branch_id <> branch) then
    raise exception 'This member must be handled by their home branch' using errcode = '42501';
  end if;
  if not is_super and exists (select 1 from auth.users where id = target.id and
    raw_app_meta_data ? 'walk_in_branch' and raw_app_meta_data->>'walk_in_branch' is distinct from branch::text) and target.branch_id is null then
    raise exception 'This registration belongs to another branch' using errcode = '42501';
  end if;

  select * into membership from public.memberships m where m.user_id = target_member
    and (target_membership is null or m.id = target_membership)
    order by (m.status = 'PENDING') desc, m.id desc limit 1 for update;
  if not found then
    if target_plan is null or target_membership is not null or exists (select 1 from public.memberships where user_id = target_member) then
      raise exception 'There is no pending membership to activate' using errcode = 'P0001';
    end if;
    select * into plan from public.membership_plans where id = target_plan and is_active for share;
    if not found then raise exception 'This plan is no longer available' using errcode = 'P0001'; end if;
    insert into public.memberships(user_id, plan_id, quoted_price, quoted_duration)
    values (target_member, target_plan, plan.price, plan.duration) returning * into membership;
  elsif target_plan is not null and membership.plan_id <> target_plan then
    raise exception 'Registration already has a different plan' using errcode = 'P0001';
  end if;

  select count(*), min(id) into existing_count, receipt from public.payments where membership_id = membership.id and status = 'CONFIRMED';
  if existing_count > 0 then
    if existing_count = 1 and membership.status = 'ACTIVE' and exists (select 1 from public.payments p where p.id = receipt
      and p.branch_id = branch and p.payment_method = method and p.reference_number is not distinct from ref
      and (pending_payment is null or p.id = pending_payment)) then return receipt; end if;
    raise exception 'Membership already has a confirmed payment. Reconcile before trying again.' using errcode = 'P0001';
  end if;
  if membership.status <> 'PENDING' then
    raise exception 'Membership is not pending. Review its ledger before recording payment.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.memberships where user_id = target_member and id <> membership.id and status = 'ACTIVE'
    and day between start_date and end_date) then
    raise exception 'Member already has an active membership' using errcode = 'P0001';
  end if;
  select * into plan from public.membership_plans where id = membership.plan_id for share;
  amount_due := coalesce(membership.quoted_price, plan.price);
  access_days := coalesce(membership.quoted_duration, plan.duration);
  if not found or amount_due < 0 or access_days < 1 then raise exception 'Plan settings are invalid' using errcode = 'P0001'; end if;

  if pending_payment is null then
    if exists (select 1 from public.payments where membership_id = membership.id and status = 'PENDING') then
      raise exception 'Confirm the existing pending payment' using errcode = 'P0001';
    end if;
    insert into public.payments(user_id, membership_id, branch_id, amount, payment_method, status, reference_number, confirmed_by, confirmed_at, settled_in_app)
    values (target_member, membership.id, branch, amount_due, method, 'CONFIRMED', ref, actor, now(), true) returning id into receipt;
  else
    update public.payments set status = 'CONFIRMED', amount = amount_due, payment_method = method, reference_number = ref,
      confirmed_by = actor, confirmed_at = now(), settled_in_app = true
    where id = pending_payment and user_id = target_member and membership_id = membership.id and branch_id = branch and status = 'PENDING'
    returning id into receipt;
    if not found then raise exception 'Pending payment changed. Refresh and try again.' using errcode = 'P0001'; end if;
  end if;
  if target.branch_id is null then update public.profiles set branch_id = branch, updated_at = now() where id = target_member; end if;
  update public.memberships set status = 'ACTIVE', start_date = day, end_date = day + access_days - 1,
    quoted_price = amount_due, quoted_duration = access_days where id = membership.id;
  return receipt;
end;
$$;

create or replace function public.checkin_directory(member_filter uuid default null, name_filter text default null)
returns table(id uuid, first_name text, last_name text, membership_status text, last_visit_at timestamptz, last_visit_branch text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.first_name, p.last_name, coalesce(m.status, 'NONE'), visit.check_in_time, visit.name
  from public.profiles p
  left join lateral (
    select case when v.status = 'ACTIVE' and (v.start_date is null or v.end_date is null or v.end_date < public.gym_business_date()) then 'EXPIRED'
      when v.status = 'ACTIVE' and v.start_date > public.gym_business_date() then 'PENDING' else v.status end as status
    from public.memberships v where v.user_id = p.id
    order by (v.status = 'ACTIVE' and public.gym_business_date() between coalesce(v.start_date, 'infinity') and coalesce(v.end_date, '-infinity')) desc, v.id desc limit 1
  ) m on true
  left join lateral (
    select a.check_in_time, b.name from public.attendance a join public.branches b on b.id = a.branch_id
    where member_filter is not null and a.user_id = p.id order by a.check_in_time desc limit 1
  ) visit on true
  where public.is_branch_admin() and public.my_branch_id() is not null and p.role = 'MEMBER'
    and (p.branch_id is not null or (member_filter is not null and p.id = member_filter))
    and (member_filter is null or p.id = member_filter)
    and (member_filter is not null or (length(btrim(name_filter)) between 2 and 80
      and strpos(lower(p.first_name || ' ' || p.last_name), lower(btrim(name_filter))) > 0))
  order by p.first_name, p.last_name, p.id limit 25;
$$;

create or replace function public.branch_visit_log(day date)
returns table(id integer, member_name text, check_in_time timestamptz, method text)
language sql stable security definer set search_path = '' as $$
  select a.id, btrim(p.first_name || ' ' || p.last_name), a.check_in_time,
    coalesce(a.check_in_method, case when a.checked_in_by is null then 'QR' else 'Manual' end)
  from public.attendance a join public.profiles p on p.id = a.user_id
  where public.is_branch_admin() and a.branch_id = public.my_branch_id()
    and a.check_in_time >= (day::timestamp at time zone 'Asia/Manila')
    and a.check_in_time < ((day + 1)::timestamp at time zone 'Asia/Manila')
  order by a.check_in_time desc;
$$;

create or replace function public.record_gym_visit(target_member uuid, visit_method text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  branch integer := public.my_branch_id();
  checked_at timestamptz := now();
  day date := public.gym_business_date(checked_at);
  existing_visit integer;
  member_status text;
begin
  if not public.is_branch_admin() or branch is null then raise exception 'Branch staff access required' using errcode = '42501'; end if;
  if visit_method is null or visit_method not in ('QR', 'Manual') then raise exception 'Unknown check-in method' using errcode = 'P0001'; end if;
  perform 1 from public.profiles where id = target_member and role = 'MEMBER' for update;
  if not found then return 'NONE'; end if;
  select membership_status into member_status from public.checkin_directory(target_member);
  if member_status is distinct from 'ACTIVE' then return coalesce(member_status, 'NONE'); end if;
  select id into existing_visit from public.attendance where user_id = target_member
    and check_in_time >= (day::timestamp at time zone 'Asia/Manila')
    and check_in_time < ((day + 1)::timestamp at time zone 'Asia/Manila') limit 1;
  if found then return 'DUPLICATE'; end if;
  insert into public.attendance(user_id, branch_id, checked_in_by, check_in_time, business_date, check_in_method)
  values (target_member, branch, auth.uid(), checked_at, day, visit_method)
  on conflict (user_id, business_date) where business_date is not null do nothing;
  return case when found then 'RECORDED' else 'DUPLICATE' end;
end;
$$;

create or replace function public.set_member_suspended(target_member uuid, suspend boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare membership integer;
begin
  if not public.is_super_admin() then raise exception 'Super admin access required' using errcode = '42501'; end if;
  perform 1 from public.profiles where id = target_member and role = 'MEMBER' for update;
  if not found then return false; end if;
  select id into membership from public.memberships m where m.user_id = target_member
    and m.status = case when suspend then 'ACTIVE' else 'CANCELLED' end
    and public.gym_business_date() between m.start_date and m.end_date
    and exists (select 1 from public.payments p where p.membership_id = m.id and p.status = 'CONFIRMED')
    order by id desc limit 1;
  if not found then return false; end if;
  update public.memberships set status = case when suspend then 'CANCELLED' else 'ACTIVE' end where id = membership;
  return found;
end;
$$;

revoke execute on function public.handle_new_user(), public.sync_user_role_from_profile() from public, anon, authenticated;
revoke execute on function public.enroll_member(integer), public.settle_membership(uuid, text, text, integer, integer, integer, integer),
  public.checkin_directory(uuid, text), public.record_gym_visit(uuid, text), public.set_member_suspended(uuid, boolean),
  public.branch_admin_update_member_profile(uuid, text, text, text), public.branch_visit_log(date) from public, anon;
grant execute on function public.enroll_member(integer), public.settle_membership(uuid, text, text, integer, integer, integer, integer),
  public.checkin_directory(uuid, text), public.record_gym_visit(uuid, text), public.set_member_suspended(uuid, boolean),
  public.branch_admin_update_member_profile(uuid, text, text, text), public.branch_visit_log(date) to authenticated;
