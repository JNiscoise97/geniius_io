-- Table de référence : types de pagination/numérotation d'un exemplaire.
-- Portée à l'identique depuis public.ref_pagination_type, aucun écart.

create table if not exists rebond.ref_pagination_type (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_pagination_type_pkey primary key (id),
  constraint ref_pagination_type_code_key unique (code)
);

create index if not exists idx_ref_pagination_type_code
  on rebond.ref_pagination_type using btree (code);

comment on table rebond.ref_pagination_type is
  'Référentiel des types de pagination d''un exemplaire. Voir apps/rebond/supabase/schema-docs/ref_pagination_type.md';
