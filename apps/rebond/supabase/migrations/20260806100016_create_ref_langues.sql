-- Table de référence : langues des documents.
-- Portée à l'identique depuis public.ref_langues, aucun écart.

create table if not exists rebond.ref_langues (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_langues_pkey primary key (id),
  constraint ref_langues_code_uk unique (code)
);

comment on table rebond.ref_langues is
  'Référentiel des langues des documents. Voir apps/rebond/supabase/schema-docs/ref_langues.md';
