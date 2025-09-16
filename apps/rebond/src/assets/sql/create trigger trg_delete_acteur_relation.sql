drop trigger if exists trg_delete_acteur_relation on transcription_entites_acteurs;

create trigger trg_delete_acteur_relation
after delete on transcription_entites_acteurs
for each row
execute procedure handle_delete_acteur_relation();
