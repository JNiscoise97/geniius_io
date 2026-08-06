-- Corrige v_sources.conditions_communication : reproduite jusqu'ici à
-- l'identique du bug de l'originale (toujours null, jamais branchée alors
-- que ref_depots.conditions_communication existe). Sur demande explicite,
-- vraiment branchée ici — via best_exemplaire, qui a déjà le dépôt en jointure.
-- CREATE OR REPLACE VIEW : liste de colonnes de sortie inchangée, donc sûr.

create or replace view rebond.v_sources as
with
  best_url as (
    select distinct on (an.exemplaire_id)
      an.exemplaire_id,
      an.url_base,
      an.type_acces_id
    from rebond.ref_acces_numeriques an
    where an.url_base is not null
      and length(trim(both from an.url_base)) > 0
    order by an.exemplaire_id, an.updated_at desc
  ),
  copies_count as (
    select
      e.unite_documentaire_id,
      count(*) as copies_connues
    from rebond.exemplaires e
    group by e.unite_documentaire_id
  ),
  docs_stats as (
    select
      u.parent_ud_id,
      count(*) as total_documents,
      count(*) filter (where u.statut_document = 'transcrit') as transcris,
      count(*) filter (where u.statut_document = 'en_cours') as en_cours,
      count(*) filter (where u.statut_document <> all (array['transcrit', 'en_cours'])) as a_traiter
    from rebond.unites_documentaires u
    where u.parent_ud_id is not null
    group by u.parent_ud_id
  ),
  best_exemplaire as (
    select distinct on (e.unite_documentaire_id)
      e.id as exemplaire_id,
      e.unite_documentaire_id,
      e.depot_id,
      e.cote_locale,
      e.note as exemplaire_note,
      n.label as nature,
      phc.label as etat_conservation,
      d.nom as depot_nom,
      d.conditions_communication,
      coalesce(dt.is_online, false) as is_online,
      not coalesce(dt.is_online, false) as is_physical,
      i.id as institution_id,
      i.nom as institution_conservation,
      i.sigle as institution_sigle,
      i.commune as ville,
      i.pays
    from rebond.exemplaires e
      join rebond.ref_depots d on d.id = e.depot_id
      left join rebond.ref_depot_type dt on dt.id = d.type_ref
      join rebond.ref_institutions i on i.id = d.institution_id
      left join public.ref_natures n on n.id = e.nature_ref
      left join rebond.ref_physical_condition phc on phc.id = e.physical_condition_ref
    order by e.unite_documentaire_id, (coalesce(dt.is_online, false)) desc, e.created_at
  )
select
  u.id as unite_documentaire_id,
  be.exemplaire_id,
  u.titre as nom,
  u.type_unite_ref,
  u.statut_source as statut,
  u.statut_document as workflow_statut,
  u.niveau_fiabilite,
  u.couverture_label as periode,
  u.couverture_sort_start,
  u.couverture_sort_end,
  u.parent_ud_id,
  u.metadonnees,
  u.created_at,
  greatest(u.updated_at, u.created_at) as derniere_activite,
  be.cote_locale as cote,
  be.exemplaire_note as note,
  be.nature,
  be.etat_conservation,
  be.depot_id,
  be.depot_nom,
  be.is_physical,
  be.is_online,
  be.ville,
  be.pays,
  be.conditions_communication,
  be.institution_id,
  be.institution_conservation,
  be.institution_sigle,
  case
    when be.ville is not null and be.pays is not null then be.ville || ', ' || be.pays
    when be.ville is not null then be.ville
    when be.pays is not null then be.pays
    else null::text
  end as localisation,
  bu.url_base,
  bu.url_base as url,
  bu.type_acces_id,
  case
    when be.is_online is true then 'en_ligne'
    when be.is_physical is true then 'physique'
    else 'numerique'
  end as acces,
  coalesce(cc.copies_connues, 0::bigint)::integer as copies_connues,
  coalesce(ds.total_documents, 0::bigint)::integer as total_documents,
  coalesce(ds.transcris, 0::bigint)::integer as transcris,
  coalesce(ds.en_cours, 0::bigint)::integer as en_cours,
  coalesce(ds.a_traiter, 0::bigint)::integer as a_traiter
from rebond.unites_documentaires u
  left join best_exemplaire be on be.unite_documentaire_id = u.id
  left join best_url bu on bu.exemplaire_id = be.exemplaire_id
  left join copies_count cc on cc.unite_documentaire_id = u.id
  left join docs_stats ds on ds.parent_ud_id = u.id;
