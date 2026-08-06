-- Statuts de workflow d'une transcription (à transcrire, en cours,
-- validée...). Renommée depuis public.ref_transcription_status : seule
-- consommatrice est ec_transcriptions.status (état civil), suit la même
-- logique de préfixe que ref_etat_civil_registre_*. PK sur `key` (text, pas
-- uuid) conservée telle quelle : volontaire dans l'originale, référencée par
-- ec_transcriptions.status en ON UPDATE CASCADE.

create table if not exists rebond.ref_etat_civil_transcription_status (
  key text not null,
  label text not null,
  color_border text not null,
  color_bg text not null,
  color_text text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_etat_civil_transcription_status_pkey primary key (key)
);

comment on table rebond.ref_etat_civil_transcription_status is
  'Statuts de workflow des transcriptions. Voir apps/rebond/supabase/schema-docs/ref_etat_civil_transcription_status.md';
