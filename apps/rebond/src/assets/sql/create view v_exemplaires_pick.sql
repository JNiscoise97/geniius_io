create or replace view public.v_exemplaires_pick as
with
  best_url as (
    select
      e_1.id as exemplaire_id,
      an.url_base,
      p.code as plateforme_code
    from
      ref_exemplaires e_1
      left join lateral (
        select
          an1.id,
          an1.exemplaire_id,
          an1.plateforme_id,
          an1.url_base,
          an1.schema_deep_link,
          an1.restrictions,
          an1.last_checked_at,
          an1.note,
          an1.created_at,
          an1.updated_at
        from
          ref_acces_numeriques an1
        where
          an1.exemplaire_id = e_1.id
        order by
          (
            case
              when an1.url_base is not null
                   and length(trim(both from an1.url_base)) > 0
                then 0
              else 1
            end
          ),
          an1.updated_at desc
        limit 1
      ) an on true
      left join ref_plateformes p on p.id = an.plateforme_id
  ),

  agg_bureaux as (
    select
      rub.unite_id,
      array_agg(b.id order by b.nom) as bureau_ids,
      array_agg(
        case
          when b.departement is not null
               and length(trim(both from b.departement)) > 0
            then (b.nom || ' (' || b.departement || ')')
          else b.nom
        end
        order by b.nom
      ) as bureau_labels
    from
      ref_unites_documentaires_bureaux rub
      join etat_civil_bureaux b on b.id = rub.bureau_id
    group by
      rub.unite_id
  ),

  agg_types_actes as (
    select
      ruta.unite_id,
      array_agg(t.id order by t.label) as type_acte_ids,
      array_agg(t.label order by t.label) as type_acte_labels
    from
      ref_unites_documentaires_types_actes ruta
      join ref_ec_type_acte t on t.id = ruta.type_acte_id
    group by
      ruta.unite_id
  )

select
  -- ✅ remplace manifestation_id
  e.id as exemplaire_id,

  -- flags utiles pour les filtres UI (onlyOnline etc.)
  d.is_online as depot_is_online,
  d.is_physical as depot_is_physical,

  -- exemplaire (nouveau modèle)
  e.unite_documentaire_id as unite_id,
  e.depot_id,
  e.nature_ref,
  n.label as nature_label,
  n.code as nature_code,
  e.support_ref,
  sup.label as support_label,
  sup.code as support_code,
  e.source_exemplaire_id,
  e.cote_locale,
  e.identifiant_interne,
  e.localisation_interne,
  e.conditionnement,
  e.pagination_type_ref,
  e.nb_pages,
  e.couverture_label as exemplaire_couverture_label,
  e.couverture_sort_start as exemplaire_couverture_sort_start,
  e.couverture_sort_end as exemplaire_couverture_sort_end,
  e.description as exemplaire_description,
  e.note as exemplaire_note,

  -- unité documentaire
  u.type_unite_ref,
  u.titre as unite_titre,
  u.identifiant_interne as unite_identifiant_interne,
  u.serie_ref,
  s.code as serie_code,
  s.label as serie_label,

  -- couverture “effective” : exemplaire prioritaire, sinon unité
  coalesce(
    nullif(trim(both from e.couverture_label), ''),
    nullif(trim(both from u.couverture_label), '')
  ) as couverture_label,
  coalesce(e.couverture_sort_start, u.couverture_sort_start) as couverture_sort_start,
  coalesce(e.couverture_sort_end, u.couverture_sort_end) as couverture_sort_end,

  -- agrégats (inchangés)
  ab.bureau_ids,
  ab.bureau_labels,
  ata.type_acte_ids,
  ata.type_acte_labels,

  -- dépôt + institution (nouveau modèle)
  d.nom as depot_nom,
  i.nom as institution_nom,
  i.sigle as institution_sigle,

  -- URL / plateforme (best url)
  bu.url_base,
  bu.plateforme_code

from
  ref_exemplaires e
  join ref_unites_documentaires u on u.id = e.unite_documentaire_id
  left join ref_series_documentaires s on s.id = u.serie_ref
  join ref_depots d on d.id = e.depot_id
  join ref_institutions i on i.id = d.institution_id
  left join ref_natures n on n.id = e.nature_ref
  left join ref_supports sup on sup.id = e.support_ref
  left join best_url bu on bu.exemplaire_id = e.id
  left join agg_bureaux ab on ab.unite_id = u.id
  left join agg_types_actes ata on ata.unite_id = u.id;