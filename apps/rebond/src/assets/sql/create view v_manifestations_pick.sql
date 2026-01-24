create view public.v_manifestations_pick as
with
  best_url as (
    select
      m_1.id as manifestation_id,
      an.url_base,
      p.code as plateforme_code
    from
      ref_manifestations m_1
      left join lateral (
        select
          an1.id,
          an1.manifestation_id,
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
          an1.manifestation_id = m_1.id
        order by
          (
            case
              when an1.url_base is not null
              and length(
                TRIM(
                  both
                  from
                    an1.url_base
                )
              ) > 0 then 0
              else 1
            end
          ),
          an1.updated_at desc
        limit
          1
      ) an on true
      left join ref_plateformes p on p.id = an.plateforme_id
  ),
  agg_bureaux as (
    select
      rub.unite_id,
      array_agg(
        b.id
        order by
          b.nom
      ) as bureau_ids,
      array_agg(
        case
          when b.departement is not null
          and length(
            TRIM(
              both
              from
                b.departement
            )
          ) > 0 then ((b.nom || ' ('::text) || b.departement) || ')'::text
          else b.nom
        end
        order by
          b.nom
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
      array_agg(
        t.id
        order by
          t.label
      ) as type_acte_ids,
      array_agg(
        t.label
        order by
          t.label
      ) as type_acte_labels
    from
      ref_unites_documentaires_types_actes ruta
      join ref_ec_type_acte t on t.id = ruta.type_acte_id
    group by
      ruta.unite_id
  )
select
  m.id as manifestation_id,
  m.type_manifestation,
  u.id as unite_id,
  u.titre as unite_titre,
  u.cote as unite_cote,
  u.pagination_type,
  u.serie_ref,
  s.code as serie_code,
  s.label as serie_label,
  u.couverture_label,
  u.couverture_sort_start,
  u.couverture_sort_end,
  ab.bureau_ids,
  ab.bureau_labels,
  ata.type_acte_ids,
  ata.type_acte_labels,
  COALESCE(d_online.nom, d_unit.nom) as depot_nom,
  COALESCE(d_online.type_depot, d_unit.type_depot) as depot_type,
  i.nom as institution_nom,
  i.sigle as institution_sigle,
  bu.url_base,
  bu.plateforme_code
from
  ref_manifestations m
  join ref_unites_documentaires u on u.id = m.unite_documentaire_id
  left join ref_series_documentaires s on s.id = u.serie_ref
  join ref_depots d_unit on d_unit.id = u.depot_id
  join ref_institutions i on i.id = d_unit.institution_id
  left join ref_depots d_online on d_online.institution_id = i.id
  and d_online.type_depot = 'en_ligne'::text
  and m.type_manifestation = 'numerisation'::text
  left join best_url bu on bu.manifestation_id = m.id
  left join agg_bureaux ab on ab.unite_id = u.id
  left join agg_types_actes ata on ata.unite_id = u.id;