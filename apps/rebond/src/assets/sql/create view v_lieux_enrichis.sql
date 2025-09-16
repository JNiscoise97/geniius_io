create or replace view public.v_lieux_enrichis as
select
  -- id de la mention (clé primaire logique de la vue)
  mt.id,

  -- acteur
  mt.acteur_id,
  va.nom_complet,
  va.qualite,
  va.sexe,

  -- acte + source
  mt.acte_id,
  mt.source_table,
  va.acte_label,
  va.acte_statut,
  va.acte_date,

  -- toponyme mentionné
  mt.toponyme_id,
  mt.fonction,
  mt.forme_originale,
  mt.note,
  mt.path_toponyme_ids,
  mt.path_labels,

  -- rattachements lieu/toponyme
  t.lieu_id,
  t.libelle as toponyme_libelle,
  t.is_principal,
  l.type   as lieu_type,
  l.parent_id

from public.mentions_toponymes mt
left join public.v_acteurs_enrichis va on va.id = mt.acteur_id
left join public.toponymes t          on t.id  = mt.toponyme_id
left join public.lieux l              on l.id  = t.lieu_id;
