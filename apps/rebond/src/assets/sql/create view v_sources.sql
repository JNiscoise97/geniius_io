create or replace view public.v_sources as
with
  best_url as (
    select distinct on (an.exemplaire_id)
      an.exemplaire_id,
      an.url_base,
      an.type_acces_id
    from ref_acces_numeriques an
    where an.url_base is not null and length(trim(both from an.url_base)) > 0
    order by an.exemplaire_id, an.updated_at desc
  ),

  copies_count as (
    select unite_documentaire_id, count(*) as copies_connues
    from ref_exemplaires
    group by unite_documentaire_id
  ),

  docs_stats as (
    select
      parent_ud_id,
      count(*)                                                         as total_documents,
      count(*) filter (where workflow_statut = 'transcrit')            as transcris,
      count(*) filter (where workflow_statut = 'en_cours')             as en_cours,
      count(*) filter (where workflow_statut not in ('transcrit', 'en_cours')) as a_traiter
    from ref_unites_documentaires
    where parent_ud_id is not null
    group by parent_ud_id
  ),

  -- un seul exemplaire par UD, en privilégiant les exemplaires en ligne
  best_exemplaire as (
    select distinct on (e.unite_documentaire_id)
      e.id                              as exemplaire_id,
      e.unite_documentaire_id,
      e.depot_id,
      e.cote_locale,
      e.note                            as exemplaire_note,
      n.label                           as nature,
      phc.label                         as etat_conservation,
      d.nom                             as depot_nom,
      coalesce(dt.is_online, false)     as is_online,
      not coalesce(dt.is_online, false) as is_physical,
      i.id                              as institution_id,
      i.nom                             as institution_conservation,
      i.sigle                           as institution_sigle,
      i.commune                         as ville,
      i.pays
    from ref_exemplaires e
    join  ref_depots               d   on d.id  = e.depot_id
    left join ref_depot_type       dt  on dt.id = d.type_ref
    join  ref_institutions         i   on i.id  = d.institution_id
    left join ref_natures          n   on n.id  = e.nature_ref
    left join ref_physical_condition phc on phc.id = e.physical_condition_ref
    order by
      e.unite_documentaire_id,
      coalesce(dt.is_online, false) desc,
      e.created_at asc
  )

select
  -- identifiants
  u.id                                    as unite_documentaire_id,
  be.exemplaire_id,

  -- unité documentaire
  u.titre                                 as nom,
  u.type_unite_ref,
  u.statut,
  u.workflow_statut,
  u.niveau_fiabilite,
  u.couverture_label                      as periode,
  u.couverture_sort_start,
  u.couverture_sort_end,
  u.parent_ud_id,
  u.metadonnees,
  u.created_at,
  greatest(u.updated_at, u.created_at)   as derniere_activite,

  -- exemplaire (peut être null si aucun exemplaire)
  be.cote_locale                          as cote,
  be.exemplaire_note                      as note,
  be.nature,
  be.etat_conservation,
  be.depot_id,
  be.depot_nom,
  be.is_physical,
  be.is_online,
  be.ville,
  be.pays,
  null::text                              as conditions_communication,
  be.institution_id,
  be.institution_conservation,
  be.institution_sigle,
  case
    when be.ville is not null and be.pays is not null then be.ville || ', ' || be.pays
    when be.ville is not null                         then be.ville
    when be.pays  is not null                         then be.pays
    else null
  end                                     as localisation,

  -- accès numérique
  bu.url_base,
  bu.url_base                             as url,
  bu.type_acces_id,
  case
    when be.is_online  is true then 'en_ligne'
    when be.is_physical is true then 'physique'
    else 'numerique'
  end                                     as acces,

  -- agrégats
  coalesce(cc.copies_connues, 0)::integer  as copies_connues,
  coalesce(ds.total_documents, 0)::integer as total_documents,
  coalesce(ds.transcris, 0)::integer       as transcris,
  coalesce(ds.en_cours, 0)::integer        as en_cours,
  coalesce(ds.a_traiter, 0)::integer       as a_traiter

from ref_unites_documentaires u
left join best_exemplaire be on be.unite_documentaire_id = u.id
left join best_url        bu on bu.exemplaire_id = be.exemplaire_id
left join copies_count    cc on cc.unite_documentaire_id = u.id
left join docs_stats      ds on ds.parent_ud_id = u.id;
