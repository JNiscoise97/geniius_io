create or replace function get_deces(ind_id uuid)
returns table(date text, lieu text)
language sql
as $$
  with defunt as (
    select
      to_char(trim(b.deces_date)::date, 'DD/MM/YYYY') as date,
      trim(b.deces_lieux) as lieu
    from v_acteurs_enrichis b
    where b.individu_id = ind_id
      and lower(coalesce(b.role, '')) = 'défunt'
      and b.deces_date is not null
    limit 1
  ),
  morts_estimes as (
    select
      'avant le ' || to_char(a.acte_date::date, 'DD/MM/YYYY') as date,
      'lieu indéterminé' as lieu,
      a.acte_date
    from v_acteurs_enrichis a
    where a.individu_id = ind_id
      and (a.age = 'dcd' or a.est_vivant = false)
      and a.acte_date is not null
    order by a.acte_date asc
    limit 1
  )
  select d.date, coalesce(d.lieu, 'lieu indéterminé')
  from defunt d

  union all

  select m.date, m.lieu
  from morts_estimes m
  where not exists (select 1 from defunt)

  union all

  select 'date indéterminée', 'lieu indéterminé'
  where not exists (select 1 from defunt)
    and not exists (select 1 from morts_estimes);
$$;
