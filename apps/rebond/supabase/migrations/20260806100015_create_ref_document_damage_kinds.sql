-- Table de référence : types de dommages/dégradations constatés sur un document.
-- Portée à l'identique depuis public.ref_document_damage_kinds, aucun écart.

create table if not exists rebond.ref_document_damage_kinds (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  categorie text not null,
  position integer null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_document_damage_kinds_pkey primary key (id),
  constraint ref_document_damage_kinds_code_uk unique (code)
);

comment on table rebond.ref_document_damage_kinds is
  'Référentiel des types de dommages constatés sur un document. Voir apps/rebond/supabase/schema-docs/ref_document_damage_kinds.md';
