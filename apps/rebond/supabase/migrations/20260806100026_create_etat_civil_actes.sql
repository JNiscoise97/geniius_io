-- Actes d'état civil individuels (naissance, mariage, décès...).
-- Écart volontaire vs public.etat_civil_actes (voir schema-docs/etat_civil_actes.md) :
-- created_at/updated_at passés en not null, même correctif que sur bureaux/registres
-- (déjà défaut now(), aucun impact réel). FK
-- status/auteur_institutionnel_ref/preferred_transcription_id cross-schema
-- vers public.* (tables pas encore migrées).

create table if not exists rebond.etat_civil_actes (
  id uuid not null default gen_random_uuid(),
  bureau_id uuid not null,
  annee integer null,
  transcription text null,
  source text null,
  reference text null,
  numero_acte text null,
  multi text null,
  type_acte text null,
  date date null,
  mentions_marginales text null,
  comparution_mairie boolean null,
  comparution_observations text null,
  contrat_mariage text null,
  enfants_legitimes text null,
  enfants_nombre integer null,
  label text null,
  registre_id uuid null,
  heure text null,
  lieu_situation text null,
  lieu_transport_raison text null,
  type_acte_ref uuid null,
  redaction_bureau_id uuid null,
  auteur_institutionnel_ref uuid null,
  preferred_transcription_id uuid null,
  status text not null default 'TO_TRANSCRIBE',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint etat_civil_actes_pkey primary key (id),
  constraint etat_civil_actes_bureau_id_fkey
    foreign key (bureau_id) references rebond.etat_civil_bureaux (id) on delete cascade,
  constraint etat_civil_actes_redaction_bureau_id_fkey
    foreign key (redaction_bureau_id) references rebond.etat_civil_bureaux (id) on delete set null,
  constraint etat_civil_actes_registre_id_fkey
    foreign key (registre_id) references rebond.etat_civil_registres (id) on delete cascade,
  constraint etat_civil_actes_type_acte_ref_fkey
    foreign key (type_acte_ref) references rebond.ref_etat_civil_type_acte (id) on delete restrict,
  -- Cross-schema, tables pas encore migrées :
  constraint fk_etat_civil_actes_status
    foreign key (status) references public.ref_transcription_status (key)
    on update cascade on delete restrict,
  constraint etat_civil_actes_auteur_institutionnel_ref_fkey
    foreign key (auteur_institutionnel_ref) references public.ref_auteur_institutionnel (id) on delete restrict,
  constraint fk_etat_civil_actes_preferred_transcription
    foreign key (preferred_transcription_id) references public.ec_transcriptions (id) on delete set null
);

create index if not exists idx_etat_civil_actes_type_acte_ref
  on rebond.etat_civil_actes using btree (type_acte_ref);

create index if not exists idx_etat_civil_actes_redaction_bureau_id
  on rebond.etat_civil_actes using btree (redaction_bureau_id);

create index if not exists idx_etat_civil_actes_auteur_institutionnel_ref
  on rebond.etat_civil_actes using btree (auteur_institutionnel_ref);

create index if not exists idx_etat_civil_actes_status
  on rebond.etat_civil_actes using btree (status);

create index if not exists idx_etat_civil_actes_preferred_transcription
  on rebond.etat_civil_actes using btree (preferred_transcription_id);

comment on table rebond.etat_civil_actes is
  'Actes d''état civil individuels. Voir apps/rebond/supabase/schema-docs/etat_civil_actes.md';
