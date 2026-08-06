create or replace function get_distinct_roles()
returns table (role text)
language sql
as $$
  select distinct role
  from public.transcription_entites_acteurs
  where role is not null
    and trim(role) <> ''
  order by role;
$$;
