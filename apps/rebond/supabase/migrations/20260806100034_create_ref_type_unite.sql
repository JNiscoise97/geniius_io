-- Référentiel des types d'unité documentaire (pièce, dossier, registre...).
--
-- Écart volontaire vs public.ref_type_unite (voir schema-docs/ref_type_unite.md) :
-- index idx_ref_type_unite_code supprimé, redondant avec l'index automatique
-- de la contrainte unique sur code.
--
-- Référencée par public.ref_unites_documentaires.type_unite_ref (table pas
-- encore migrée, référence par valeur d'id scalaire, pas de jointure
-- embarquée dans le code actuel).

create table if not exists rebond.ref_type_unite (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  note text null,
  description text null,
  position integer not null default 9999,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_type_unite_pkey primary key (id),
  constraint ref_type_unite_code_key unique (code)
);

comment on table rebond.ref_type_unite is
  'Référentiel des types d''unité documentaire. Voir apps/rebond/supabase/schema-docs/ref_type_unite.md';
