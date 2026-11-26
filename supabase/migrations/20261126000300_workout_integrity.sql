alter table public.workout_sessions add column if not exists client_session_id uuid;
create unique index if not exists workout_session_retry_key on public.workout_sessions (user_id, client_session_id);

create or replace function public.save_gym_routine(routine_key integer, routine_name text, routine_days text[], exercise_rows jsonb)
returns integer language plpgsql security invoker set search_path = '' as $$
declare saved_id integer;
begin
  if auth.uid() is null then raise exception 'Sign in to save a routine' using errcode = '42501'; end if;
  if nullif(btrim(routine_name), '') is null or length(routine_name) > 100 or cardinality(routine_days) > 7
    or jsonb_typeof(exercise_rows) is distinct from 'array' or jsonb_array_length(exercise_rows) > 40 then
    raise exception 'Routine details are invalid' using errcode = 'P0001';
  end if;
  if exists (select 1 from jsonb_to_recordset(exercise_rows) as x(exercise_id text, exercise_name text,
    default_sets integer, default_reps integer, default_weight numeric) where nullif(x.exercise_id, '') is null
    or nullif(btrim(x.exercise_name), '') is null or length(x.exercise_name) > 150
    or (x.default_sets between 1 and 30) is not true or (x.default_reps between 1 and 500) is not true
    or (x.default_weight between 0 and 2000) is not true) then
    raise exception 'Use valid exercises, sets, reps, and weights' using errcode = 'P0001';
  end if;

  if routine_key is null then
    insert into public.routines(user_id, name, days) values (auth.uid(), btrim(routine_name), routine_days) returning id into saved_id;
  else
    update public.routines set name = btrim(routine_name), days = routine_days, updated_at = now()
    where id = routine_key and user_id = auth.uid() returning id into saved_id;
    if not found then raise exception 'Routine not found' using errcode = '42501'; end if;
    delete from public.routine_exercises where routine_id = saved_id;
  end if;
  insert into public.routine_exercises(routine_id, exercise_id, exercise_name, target_muscle, default_sets, default_reps, default_weight, sort_order)
  select saved_id, exercise->>'exercise_id', exercise->>'exercise_name', exercise->>'target_muscle',
    (exercise->>'default_sets')::integer, (exercise->>'default_reps')::integer, (exercise->>'default_weight')::numeric, ordinal - 1
  from jsonb_array_elements(exercise_rows) with ordinality as rows(exercise, ordinal);
  return saved_id;
end;
$$;

revoke execute on function public.save_gym_routine(integer, text, text[], jsonb) from public, anon;
grant execute on function public.save_gym_routine(integer, text, text[], jsonb) to authenticated;
