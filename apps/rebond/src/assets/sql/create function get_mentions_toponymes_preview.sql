create or replace function get_mentions_toponymes_preview(p_forme_originale text)
returns table (
  mention_acte_id uuid,
  mention_acte_label text,
  mention_acte_date date,
  mention_source_table text,
  acteur_id uuid,
  acteur_nom_complet text,
  fonction text
)
language sql
as $$
  select v.acte_id, v.acte_label, v.acte_date, v.source_table, v.id, v.nom_complet, 'naissance'
  from transcription_entites_acteurs a
  join v_acteurs_enrichis v on a.id = v.id
  where a.naissance_lieux = p_forme_originale

  union all

  select v.acte_id, v.acte_label, v.acte_date, v.source_table, v.id, v.nom_complet, 'deces'
  from transcription_entites_acteurs a
  join v_acteurs_enrichis v on a.id = v.id
  where a.deces_lieux = p_forme_originale

  union all

  select v.acte_id, v.acte_label, v.acte_date, v.source_table, v.id, v.nom_complet, 'domicile'
  from transcription_entites_acteurs a
  join v_acteurs_enrichis v on a.id = v.id
  where a.domicile = p_forme_originale

  union all

  select v.acte_id, v.acte_label, v.acte_date, v.source_table, v.id, v.nom_complet, 'origine'
  from transcription_entites_acteurs a
  join v_acteurs_enrichis v on a.id = v.id
  where a.origine = p_forme_originale;
$$;