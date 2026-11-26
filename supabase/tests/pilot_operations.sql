begin;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000001', 'member@example.invalid', now(), '{"first_name":"Fictional","last_name":"Member"}'),
  ('00000000-0000-4000-8000-000000000002', 'frontdesk-a@example.invalid', now(), '{}'),
  ('00000000-0000-4000-8000-000000000003', 'frontdesk-b@example.invalid', now(), '{}'),
  ('00000000-0000-4000-8000-000000000004', 'owner@example.invalid', now(), '{}'),
  ('00000000-0000-4000-8000-000000000005', 'unverified@example.invalid', null, '{}');
update public.profiles set role = 'BRANCH_ADMIN', branch_id = 1 where id = '00000000-0000-4000-8000-000000000002';
update public.profiles set role = 'BRANCH_ADMIN', branch_id = 2 where id = '00000000-0000-4000-8000-000000000003';
update public.profiles set role = 'SUPER_ADMIN' where id = '00000000-0000-4000-8000-000000000004';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
do $$
declare first_request integer;
begin
  if public.is_admin() or public.my_branch_id() is not null then raise exception 'Signup produced staff privileges'; end if;
  if has_column_privilege('authenticated', 'public.profiles', 'branch_id', 'UPDATE')
    or has_table_privilege('authenticated', 'public.memberships', 'INSERT')
    or has_table_privilege('authenticated', 'public.payments', 'INSERT')
    or has_table_privilege('authenticated', 'public.attendance', 'INSERT') then raise exception 'Raw write privileges still present'; end if;
  first_request := public.enroll_member(1);
  if first_request <> public.enroll_member(1) then raise exception 'Enrollment not idempotent'; end if;
  update public.profiles set phone = '00000000000' where id = auth.uid();
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000005', true);
do $$
begin
  begin
    perform public.enroll_member(1);
    raise exception 'Unverified member enrolled';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
reset role;
update public.membership_plans set price = 1300, duration = 31 where id = 1;
set local role authenticated;
do $$
declare
  member uuid := '00000000-0000-4000-8000-000000000001';
  receipt integer;
begin
  if public.record_gym_visit(member, 'Manual') <> 'PENDING' then raise exception 'Pending membership can enter'; end if;
  receipt := public.settle_membership(member, 'GCASH', 'AUDIT-1234');
  if receipt <> public.settle_membership(member, 'GCASH', 'AUDIT-1234') then raise exception 'Settlement retry returned another receipt'; end if;
  if (select count(*) from public.payments where user_id = member and status = 'CONFIRMED') <> 1 then raise exception 'Unexpected payment count'; end if;
  if (select amount from public.payments where id = receipt) <> 1000 then raise exception 'Quoted price changed at payment'; end if;
  if (select end_date - start_date from public.memberships where user_id = member) <> 29 then raise exception 'Quoted duration changed at payment'; end if;
  if public.record_gym_visit(member, 'QR') <> 'RECORDED' then raise exception 'Member could not check in'; end if;
  if not exists (select 1 from public.attendance where branch_id = 1 and checked_in_by = auth.uid() and check_in_method = 'QR') then
    raise exception 'Visit attribution is incorrect';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
do $$
declare member uuid := '00000000-0000-4000-8000-000000000001';
begin
  if exists (select 1 from public.profiles where id = member) or exists (select 1 from public.payments where user_id = member) then
    raise exception 'Cross-branch profile or ledger visible';
  end if;
  if not exists (select 1 from public.checkin_directory(name_filter => 'Fictional') where id = member) then raise exception 'Cross-branch lookup unavailable'; end if;
  if public.record_gym_visit(member, 'Manual') <> 'DUPLICATE' then raise exception 'Same-day visit was not deduplicated'; end if;
  if public.branch_admin_update_member_profile(member, 'Other', 'Name', null) then raise exception 'Cross-branch edit permitted'; end if;
  if public.gym_business_date('2026-11-26 15:59:59+00') <> '2026-11-26'::date
    or public.gym_business_date('2026-11-26 16:00:00+00') <> '2026-11-27'::date then raise exception 'Manila day boundary incorrect'; end if;
end;
$$;

reset role;
update public.memberships set start_date = public.gym_business_date() - 30, end_date = public.gym_business_date() - 1;
set local role authenticated;
do $$
begin
  if public.record_gym_visit('00000000-0000-4000-8000-000000000001', 'Manual') <> 'EXPIRED' then raise exception 'Expired membership can enter'; end if;
end;
$$;

reset role;
insert into public.announcements(title, body, all_branches, audience_branch_ids, status, publish_at) values
  ('Open', 'Fictional notice', true, '{}', 'SENT', now() - interval '1 minute'),
  ('Other branch', 'Fictional notice', false, '{2}', 'SENT', now() - interval '1 minute'),
  ('Scheduled', 'Fictional notice', true, '{}', 'SENT', now() + interval '1 day');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
do $$
declare saved integer;
begin
  if (select array_agg(title) from public.announcements) is distinct from array['Open'] then raise exception 'Unexpected announcement audience'; end if;
  saved := public.save_gym_routine(null, 'Fictional routine', array['Mon'],
    '[{"exercise_id":"bench","exercise_name":"Bench Press","default_sets":3,"default_reps":8,"default_weight":25}]');
  begin
    perform public.save_gym_routine(saved, 'An invalid routine', array['Mon'],
      '[{"exercise_id":"bench","exercise_name":"Bench Press","default_sets":-1,"default_reps":8,"default_weight":25}]');
    raise exception 'Invalid exercise accepted' using errcode = 'XX000';
  exception when raise_exception then null;
  end;
  if not exists (select 1 from public.routines where id = saved and name = 'Fictional routine')
    or (select count(*) from public.routine_exercises where routine_id = saved) <> 1 then raise exception 'Routine lost after failed save'; end if;
  insert into public.workout_sessions(user_id, routine_id, started_at, ended_at, client_session_id)
    values (auth.uid(), saved, now(), now(), '00000000-0000-4000-8000-000000000099');
  insert into public.workout_sessions(user_id, routine_id, started_at, ended_at, client_session_id)
    values (auth.uid(), saved, now(), now(), '00000000-0000-4000-8000-000000000099') on conflict (user_id, client_session_id) do nothing;
  delete from public.routines where id = saved;
  if (select count(*) from public.workout_sessions where user_id = auth.uid() and routine_id is null) <> 1 then
    raise exception 'Workout save retry or routine-history retention failed';
  end if;
end;
$$;

reset role;
set local role service_role;
do $$
declare request_key uuid;
  member uuid := '00000000-0000-4000-8000-000000000001';
begin
  request_key := public.reserve_coach_request(member, 100, 150);
  if request_key is null then raise exception 'Coach reservation failed'; end if;
  if public.reserve_coach_request(member, 0, 150) is not null then raise exception 'Concurrent coach stream allowed'; end if;
  perform public.finish_coach_request(request_key, null);
  if public.reserve_coach_request(member, 51, 150) is not null then raise exception 'Missing usage refunded the cost reservation'; end if;
  if public.reserve_coach_request(member, 50, 150) is null then raise exception 'Remaining coach budget was not usable'; end if;
end;
$$;

reset role;
update gym_private.security_settings set staff_mfa_required = true;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
do $$
begin
  if not public.staff_mfa_required() or public.is_branch_admin() then raise exception 'Staff has AAL1 access with MFA required'; end if;
  perform set_config('request.jwt.claim.aal', 'aal2', true);
  if public.staff_mfa_required() or not public.is_branch_admin() then raise exception 'Staff MFA did not restore access'; end if;
end;
$$;
rollback;
