-- Référentiel des natures d'exemplaire (original, copie, minute...).
-- Portée à l'identique depuis public.ref_natures, aucun écart.

create table if not exists rebond.ref_natures (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_natures_pkey primary key (id),
  constraint ref_natures_code_uk unique (code)
);

comment on table rebond.ref_natures is
  'Référentiel des natures d''exemplaire. Voir apps/rebond/supabase/schema-docs/ref_natures.md';
