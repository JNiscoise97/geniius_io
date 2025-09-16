create or replace function associer_mentions_toponymes(
  p_forme_originale text,
  p_toponyme_id uuid,
  p_path_toponyme_ids uuid[]
) returns void
language plpgsql
as $$
declare
  v_path_labels text[];
begin
  -- Récupérer les labels dans l'ordre du chemin
  select array_agg(t.libelle order by idx) into v_path_labels
  from unnest(p_path_toponyme_ids) with ordinality as u(id, idx)
  join toponymes t on t.id = u.id;

  -- Insérer les lignes
  insert into mentions_toponymes (
    toponyme_id,
    path_toponyme_ids,
    path_labels,
    acte_id,
    source_table,
    acteur_id,
    fonction,
    forme_originale
  )
  select
    p_toponyme_id,
    p_path_toponyme_ids,
    v_path_labels,
    v.acte_id,
    v.source_table,
    v.id,
    f.fonction,
    p_forme_originale
  from (
    select a.id as acteur_id, 'naissance' as fonction
    from transcription_entites_acteurs a where a.naissance_lieux = p_forme_originale
    union all
    select a.id, 'deces' from transcription_entites_acteurs a where a.deces_lieux = p_forme_originale
    union all
    select a.id, 'domicile' from transcription_entites_acteurs a where a.domicile = p_forme_originale
    union all
    select a.id, 'origine' from transcription_entites_acteurs a where a.origine = p_forme_originale
  ) f
  join v_acteurs_enrichis v on v.id = f.acteur_id;
end;
$$;
