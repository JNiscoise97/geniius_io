create or replace view public.v_toponymes_enrichis as
select
  t.id,
  t.lieu_id,
  t.libelle         as toponyme_libelle,
  t.is_principal,
  t.note            as toponyme_note,
  l.type            as lieu_type,
  l.parent_id,
  public.get_lieu_path_ids(t.lieu_id)                                   as path_ids,
  public.get_labels_from_path_ids(public.get_lieu_path_ids(t.lieu_id))  as path_labels,

  -- nouveaux champs agrégés depuis mentions_toponymes
  coalesce(m.mentions_count, 0)                    as mentions_count,
  coalesce(m.distinct_acte_source_count, 0)      as distinct_acte_source_count

from public.toponymes t
left join public.lieux l on l.id = t.lieu_id
left join (
  select
    toponyme_id,
    count(*) as mentions_count,
    count(distinct (acte_id, source_table)) as distinct_acte_source_count
  from public.mentions_toponymes
  group by toponyme_id
) m on m.toponyme_id = t.id;