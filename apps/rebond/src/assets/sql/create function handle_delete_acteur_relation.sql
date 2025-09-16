create or replace function handle_delete_acteur_relation()
returns trigger as $$
begin
  -- Cas 1 : suppression si acteur supprimé était un acteur_source
  delete from staging_transcription_acteurs_relations
  where acteur_source_id = old.id;

  -- Cas 2 : mise à jour si acteur supprimé était un acteur_cible
  update staging_transcription_acteurs_relations
  set acteur_cible_id = null,
      statut = 'introuvable'
  where acteur_cible_id = old.id;

  return null;
end;
$$ language plpgsql;
