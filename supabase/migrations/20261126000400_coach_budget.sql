create schema if not exists gym_private;
revoke all on schema gym_private from public, anon, authenticated;

create table gym_private.coach_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  branch_id integer,
  reserved_micros integer not null,
  actual_micros integer,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on gym_private.coach_requests(started_at);
create index on gym_private.coach_requests(member_id, started_at);

create or replace function public.reserve_coach_request(member uuid, max_micros integer, daily_budget integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  reservation uuid;
  member_branch integer;
  minute_start timestamptz := now() - interval '1 minute';
  day_start timestamptz := public.gym_business_date()::timestamp at time zone 'Asia/Manila';
begin
  if max_micros is null or max_micros < 0 or daily_budget is null or daily_budget < 0 then return null; end if;
  select branch_id into member_branch from public.profiles where id = member and role = 'MEMBER';
  if not found then return null; end if;
  perform pg_advisory_xact_lock(20261126, 11);
  delete from gym_private.coach_requests where started_at < day_start - interval '1 day';
  if (select count(*) from gym_private.coach_requests where started_at >= minute_start) >= 60
    or (member_branch is not null and (select count(*) from gym_private.coach_requests where branch_id = member_branch and started_at >= minute_start) >= 20)
    or (select count(*) from gym_private.coach_requests where member_id = member and started_at >= minute_start) >= 3
    or (select count(*) from gym_private.coach_requests where member_id = member and started_at >= day_start) >= 12
    or exists (select 1 from gym_private.coach_requests where member_id = member and finished_at is null and started_at > now() - interval '45 seconds')
    or (select coalesce(sum(coalesce(actual_micros, reserved_micros)), 0) from gym_private.coach_requests where started_at >= day_start) + max_micros > daily_budget then
    return null;
  end if;
  insert into gym_private.coach_requests(member_id, branch_id, reserved_micros) values (member, member_branch, max_micros) returning id into reservation;
  return reservation;
end;
$$;

create or replace function public.finish_coach_request(request_key uuid, actual_cost integer default null)
returns void language sql security definer set search_path = '' as $$
  update gym_private.coach_requests set finished_at = now(), actual_micros = case when actual_cost >= 0 then actual_cost end
  where id = request_key and finished_at is null;
$$;

revoke execute on function public.reserve_coach_request(uuid, integer, integer), public.finish_coach_request(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.reserve_coach_request(uuid, integer, integer), public.finish_coach_request(uuid, integer)
  to service_role;
