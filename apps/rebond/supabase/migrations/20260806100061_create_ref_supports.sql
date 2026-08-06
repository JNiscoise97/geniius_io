-- Référentiel des supports physiques d'exemplaire (papier, parchemin,
-- microfilm...). Portée à l'identique depuis public.ref_supports, aucun écart.

create table if not exists rebond.ref_supports (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_supports_pkey primary key (id),
  constraint ref_supports_code_uk unique (code)
);

comment on table rebond.ref_supports is
  'Référentiel des supports physiques d''exemplaire. Voir apps/rebond/supabase/schema-docs/ref_supports.md';
