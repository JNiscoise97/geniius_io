-- "Qualité de la transcription" : métadonnées sur la fiabilité/le contexte
-- de lecture, génériques à tous les types de documents (pas seulement les
-- actes d'état civil) — colonnes directement sur rebond.transcriptions
-- (relation 1:1, pas besoin d'historique dessus, contrairement au contenu).
--
-- Volontairement plus simple que l'ancien ec_transcriptions (9 champs) :
-- pas de "confiance dans la langue" ni de raison d'incomplétude en enum
-- fermé — un champ note libre suffit pour expliquer une complétude ou une
-- réserve, plutôt que de figer une liste de raisons.

alter table rebond.transcriptions
  add column if not exists source_lecture_kind text null,
  add column if not exists langue_ref uuid null,
  add column if not exists ecriture_ref uuid null,
  add column if not exists handwriting_legibility_ref uuid null,
  add column if not exists completeness text not null default 'complete',
  add column if not exists completeness_note text null,
  add column if not exists reserve_level text not null default 'aucune',
  add column if not exists reserve_reason text null;

do $$
begin
  alter table rebond.transcriptions
    add constraint chk_transcriptions_source_lecture_kind
    check (source_lecture_kind is null or source_lecture_kind in ('image_originale', 'microfilm', 'transcription_secondaire', 'autre'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table rebond.transcriptions
    add constraint chk_transcriptions_completeness
    check (completeness in ('complete', 'partielle', 'fragment'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table rebond.transcriptions
    add constraint chk_transcriptions_reserve_level
    check (reserve_level in ('aucune', 'mineure', 'majeure'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table rebond.transcriptions
    add constraint fk_transcriptions_langue
    foreign key (langue_ref) references rebond.ref_langues (id) on delete set null;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table rebond.transcriptions
    add constraint fk_transcriptions_ecriture
    foreign key (ecriture_ref) references rebond.ref_ecritures (id) on delete set null;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table rebond.transcriptions
    add constraint fk_transcriptions_handwriting_legibility
    foreign key (handwriting_legibility_ref) references rebond.ref_handwriting_legibility (id) on delete set null;
exception when duplicate_object then null;
end $$;
