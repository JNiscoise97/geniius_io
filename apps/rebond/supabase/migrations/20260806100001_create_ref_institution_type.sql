-- Table de référence : types d'institutions (Archives départementales, mairie, etc.)
-- Portée à l'identique depuis public.ref_institution_type, aucun écart.

create table if not exists rebond.ref_institution_type (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  categorie text not null,
  note text null,
  description text null,
  position integer null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_institution_type_pkey primary key (id),
  constraint ref_institution_type_code_key unique (code)
);

create index if not exists idx_ref_institution_type_code
  on rebond.ref_institution_type using btree (code);

create index if not exists idx_ref_institution_type_categorie
  on rebond.ref_institution_type using btree (categorie);

create index if not exists idx_ref_institution_type_position
  on rebond.ref_institution_type using btree (position);

comment on table rebond.ref_institution_type is
  'Référentiel des types d''institution détentrices de patrimoine documentaire. Voir apps/rebond/supabase/schema-docs/ref_institution_type.md';
