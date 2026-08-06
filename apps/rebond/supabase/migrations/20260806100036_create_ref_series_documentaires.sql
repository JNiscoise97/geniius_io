-- Séries documentaires (classification archivistique de haut niveau, ex.
-- ETAT_CIVIL, NOTARIAT, CADASTRE...). Portée à l'identique depuis
-- public.ref_series_documentaires, aucun écart de colonnes.
--
-- Écart volontaire : index idx_ref_series_documentaires_code supprimé,
-- redondant avec l'index automatique de la contrainte unique sur code.
--
-- Référencée par public.ref_unites_documentaires.serie_ref (table pas encore
-- migrée, référence par valeur d'id scalaire).

create table if not exists rebond.ref_series_documentaires (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  description text null,
  note text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_series_documentaires_pkey primary key (id),
  constraint ref_series_documentaires_code_uk unique (code),
  constraint ref_series_documentaires_code_chk check (code ~ '^[A-Z0-9]+(_[A-Z0-9]+)*$')
);

comment on table rebond.ref_series_documentaires is
  'Séries documentaires. Voir apps/rebond/supabase/schema-docs/ref_series_documentaires.md';
