-- Table de référence : type d'écriture d'un document (manuscrite, imprimée...).
-- Portée à l'identique depuis public.ref_ecritures, aucun écart.

create table if not exists rebond.ref_ecritures (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_ecritures_pkey primary key (id),
  constraint ref_ecritures_code_uk unique (code)
);

comment on table rebond.ref_ecritures is
  'Référentiel des types d''écriture. Voir apps/rebond/supabase/schema-docs/ref_ecritures.md';
