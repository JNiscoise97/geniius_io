create or replace function public.get_documents_sorted()
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
  registre_type_acte text,
  registre_statut_juridique text,
  notaire_id uuid,
  notaire_nom text,
  notaire_prenom text,
  notaire_titre text,
  notaire_lieu_exercice text,
  created_at timestamp
) as $$
begin
  return query
  select
    ac.id as acte_id,
    'etat_civil_actes' as source_table,
    ac.label as acte_label,
    ac.statut as acte_statut,
    ac.type_acte as acte_type,
    ac.date as acte_date,
    ac.numero_acte,
    ac.source,
    b.nom as bureau_nom,
    b.commune as bureau_commune,
    b.departement as bureau_departement,
    b.region as bureau_region,
    r.type_acte as registre_type_acte,
    r.statut_juridique as registre_statut_juridique,
    null::uuid as notaire_id,
    null::text as notaire_nom,
    null::text as notaire_prenom,
    null::text as notaire_titre,
    null::text as notaire_lieu_exercice,
    ac.created_at
  from etat_civil_actes ac
  left join etat_civil_bureaux b on b.id = ac.bureau_id
  left join etat_civil_registres r on r.id = ac.registre_id

  union all

  select
    ac2.id as acte_id,
    'actes' as source_table,
    ac2.label,
    ac2.statut,
    array_to_string(ac2.type_operation, '|'),
    (
      select (s.date->>'exact')::date
      from seances s
      where s.acte_id = ac2.id and s.date ? 'exact'
      order by (s.date->>'exact') asc
      limit 1
    ) as acte_date,
    ac2.numero_acte,
    ac2.source,
    null,
    null,
    null,
    null,
    null,
    null,
    n.id,
    n.nom,
    n.prenom,
    n.titre,
    n.lieu_exercice,
    ac2.created_at
  from actes ac2
  left join actes_notaires an on an.acte_id = ac2.id and an.role = 'principal'
  left join notaires n on n.id = an.notaire_id

  order by acte_date nulls last;
end;
$$ language plpgsql stable;
