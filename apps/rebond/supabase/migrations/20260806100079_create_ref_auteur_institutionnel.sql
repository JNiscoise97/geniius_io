-- Référentiel des auteurs institutionnels (ex. institution ayant produit un
-- document, un acte...). Portée à l'identique depuis
-- public.ref_auteur_institutionnel, aucun écart.

create table if not exists rebond.ref_auteur_institutionnel (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  categorie text not null,
  position integer null,
  description text null,
  note text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_auteur_institutionnel_pkey primary key (id),
  constraint ref_auteur_institutionnel_code_uk unique (code)
);

create index if not exists idx_ref_auteur_institutionnel_categorie
  on rebond.ref_auteur_institutionnel using btree (categorie);

create index if not exists idx_ref_auteur_institutionnel_position
  on rebond.ref_auteur_institutionnel using btree (position);

create index if not exists idx_ref_auteur_institutionnel_label
  on rebond.ref_auteur_institutionnel using btree (label);

comment on table rebond.ref_auteur_institutionnel is
  'Référentiel des auteurs institutionnels. Voir apps/rebond/supabase/schema-docs/ref_auteur_institutionnel.md';
