create or replace function public.search_documents(query text)
returns table (
  acte_id uuid,
  source_table text,
  acte_label text,
  acte_statut text,
  acte_type text,
  acte_date date,
  numero_acte text,
  acte_source text,
  bureau_nom text,
  bureau_commune text,
  bureau_departement text,
  bureau_region text,
  notaire_id uuid,
  notaire_nom text,
  notaire_prenom text,
  notaire_titre text,
  notaire_lieu_exercice text,
  registre_type_acte text,
  registre_statut_juridique text,
  created_at timestamp
) as $$
begin
  return query
  select *
  from (
    -- Bloc état civil
    select
      ac.id::uuid as acte_id,
      'etat_civil_actes'::text as source_table,
      ac.label::text as acte_label,
      ac.statut::text as acte_statut,
      ac.type_acte::text as acte_type,
      ac.date::date as acte_date,
      ac.numero_acte::text as numero_acte,
      ac.source::text as acte_source,
      b.nom::text as bureau_nom,
      b.commune::text as bureau_commune,
      b.departement::text as bureau_departement,
      b.region::text as bureau_region,
      null::uuid as notaire_id,
      null::text as notaire_nom,
      null::text as notaire_prenom,
      null::text as notaire_titre,
      null::text as notaire_lieu_exercice,
      r.type_acte::text as registre_type_acte,
      r.statut_juridique::text as registre_statut_juridique,
      ac.created_at::timestamp
    from etat_civil_actes ac
    left join etat_civil_bureaux b on b.id = ac.bureau_id
    left join etat_civil_registres r on r.id = ac.registre_id
    where ac.label ilike '%' || query || '%'

    union all

    -- Bloc actes notariés
    select
      ac2.id::uuid as acte_id,
      'actes'::text as source_table,
      ac2.label::text as acte_label,
      ac2.statut::text as acte_statut,
      array_to_string(ac2.type_operation, '|')::text as acte_type,
      (
        select (s.date->>'exact')::date
        from seances s
        where s.acte_id = ac2.id and s.date ? 'exact'
        order by (s.date->>'exact')::date asc
        limit 1
      ) as acte_date,
      ac2.numero_acte::text as numero_acte,
      ac2.source::text as acte_source,
      null::text as bureau_nom,
      null::text as bureau_commune,
      null::text as bureau_departement,
      null::text as bureau_region,
      n.id::uuid as notaire_id,
      n.nom::text as notaire_nom,
      n.prenom::text as notaire_prenom,
      n.titre::text as notaire_titre,
      n.lieu_exercice::text as notaire_lieu_exercice,
      null::text as registre_type_acte,
      null::text as registre_statut_juridique,
      ac2.created_at::timestamp
    from actes ac2
    left join actes_notaires an on an.acte_id = ac2.id and an.role = 'principal'
    left join notaires n on n.id = an.notaire_id
    where ac2.label ilike '%' || query || '%'
  ) as unioned
  order by acte_date nulls last
  limit 10;
end;
$$ language plpgsql stable;
