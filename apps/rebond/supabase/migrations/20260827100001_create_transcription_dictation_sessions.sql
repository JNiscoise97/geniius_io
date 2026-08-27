-- Dictée vocale (Atelier documentaire, 2026-08-27) — résumé d'une session
-- de dictée : compteurs de segments + référence vers l'enregistrement audio
-- complet uploadé en filet de sécurité (bucket storage rebond-dictation-audio,
-- voir migration dictation_audio_storage). Une transcription peut accumuler
-- plusieurs sessions de dictée dans le temps, d'où une table à part plutôt
-- que des colonnes sur rebond.transcriptions.
--
-- v1 volontairement simple (voir plan) : un seul enregistrement audio par
-- session, uploadé uniquement à l'arrêt explicite de la dictée (pas d'upload
-- progressif) ; l'audio par segment n'est pas persisté (retry en mémoire
-- navigateur uniquement, pour la durée de la session).

create table if not exists rebond.transcription_dictation_sessions (
  id uuid not null default gen_random_uuid(),
  transcription_id uuid not null,
  storage_path text not null,
  started_at timestamp with time zone not null default now(),
  ended_at timestamp with time zone null,
  segments_total integer not null default 0,
  segments_committed integer not null default 0,
  segments_error integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint transcription_dictation_sessions_pkey primary key (id),
  constraint fk_dictation_sessions_transcription
    foreign key (transcription_id) references rebond.transcriptions (id) on delete cascade
);

create index if not exists idx_dictation_sessions_transcription
  on rebond.transcription_dictation_sessions using btree (transcription_id);

create trigger trg_dictation_sessions_touch
  before update on rebond.transcription_dictation_sessions
  for each row execute function public.fn_touch_updated_at();

comment on table rebond.transcription_dictation_sessions is
  'Résumé par session de dictée vocale (compteurs de segments + chemin storage de l''enregistrement audio complet, filet de sécurité). Voir apps/rebond/src/features/atelier/dictation/.';
