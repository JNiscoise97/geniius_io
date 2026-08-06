create or replace function get_filiation(p_individu_id uuid)
returns table (
  source_table text,
  acte_id uuid,
  acte_date date,
  role text,
  filiation text
)
language sql
as $$
  select
    source_table,
    acte_id,
    acte_date,
    role,
    filiation
  from public.v_acteurs_enrichis
  where individu_id = p_individu_id
    and filiation is not null
  order by acte_date;
$$;
