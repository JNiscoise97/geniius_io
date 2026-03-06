create or replace function public.submit_answer(
  p_event_id uuid,
  p_team_id uuid,
  p_zone_id text,
  p_question_id text,
  p_question_type text,
  p_answer_json jsonb,
  p_status text default 'submitted',
  p_storage_bucket text default null,
  p_storage_path text default null,
  p_mime_type text default null,
  p_size_bytes int default null,
  p_tier_value int default null,
  p_note text default null,
  p_max_attempts int default null   -- ✅ NEW (1 ou 2)
)
returns table (attempt_no int)
language plpgsql
as $$
declare
  v_attempt int;
  v_current int;
begin
  -- ensure current row exists
  insert into public.answers_current(event_id, team_id, zone_id, question_id, question_type)
  values (p_event_id, p_team_id, p_zone_id, p_question_id, p_question_type)
  on conflict (event_id, team_id, zone_id, question_id) do nothing;

  -- lock current row
  select attempt_count
    into v_current
  from public.answers_current
  where event_id = p_event_id
    and team_id = p_team_id
    and zone_id = p_zone_id
    and question_id = p_question_id
  for update;

  -- ✅ enforce max attempts if provided
  if p_max_attempts is not null and v_current >= p_max_attempts then
    raise exception 'MAX_ATTEMPTS_REACHED';
  end if;

  v_attempt := v_current + 1;

  -- history
  insert into public.answer_attempts(
    event_id, team_id, zone_id, question_id, question_type,
    attempt_no, answer_json, status,
    storage_bucket, storage_path, mime_type, size_bytes, tier_value, note
  )
  values (
    p_event_id, p_team_id, p_zone_id, p_question_id, p_question_type,
    v_attempt, p_answer_json, p_status,
    p_storage_bucket, p_storage_path, p_mime_type, p_size_bytes, p_tier_value, p_note
  );

  -- current
  update public.answers_current
  set
    status = p_status,
    attempt_count = v_attempt,
    answer_json = p_answer_json,
    submitted_at = now(),
    storage_bucket = p_storage_bucket,
    storage_path = p_storage_path,
    mime_type = p_mime_type,
    size_bytes = p_size_bytes,
    tier_value = p_tier_value,
    note = p_note
  where event_id = p_event_id
    and team_id = p_team_id
    and zone_id = p_zone_id
    and question_id = p_question_id;

  return query select v_attempt;
end;
$$;