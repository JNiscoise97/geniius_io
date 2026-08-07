-- Historise qui a marqué une transcription comme "transcrit" et quand.
-- Distinct de created_by/updated_by (qui bougent à chaque auto-save) : ces
-- colonnes ne changent que sur l'action explicite "Marquer comme transcrit".
-- L'email est dupliqué (snapshot) faute de table de profils pour résoudre
-- un id utilisateur en nom affichable côté client.

alter table rebond.transcriptions
  add column if not exists marque_transcrit_par uuid null,
  add column if not exists marque_transcrit_par_email text null,
  add column if not exists marque_transcrit_le timestamp with time zone null;

do $$
begin
  alter table rebond.transcriptions
    add constraint fk_transcriptions_marque_transcrit_par
    foreign key (marque_transcrit_par) references auth.users (id) on delete set null;
exception when duplicate_object then null;
end $$;
