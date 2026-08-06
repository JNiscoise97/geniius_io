-- Table de référence : modes d'accès à un dépôt (sur place, sur rendez-vous, en ligne...)
-- Portée à l'identique depuis public.ref_mode_acces, aucun écart.

create table if not exists rebond.ref_mode_acces (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_mode_acces_pkey primary key (id),
  constraint ref_mode_acces_code_uk unique (code)
);

comment on table rebond.ref_mode_acces is
  'Référentiel des modes d''accès à un dépôt. Voir apps/rebond/supabase/schema-docs/ref_mode_acces.md';
