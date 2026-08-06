create or replace function public.jsonb_diff(a jsonb, b jsonb)
returns jsonb language sql immutable as $$
  select jsonb_object_agg(k, to_jsonb((a->k)) || jsonb_build_object('→', b->k))
  from (
    select key as k
    from jsonb_each(a)
    union
    select key from jsonb_each(b)
  ) keys
  where coalesce(a->k, 'null'::jsonb) <> coalesce(b->k, 'null'::jsonb)
$$;
