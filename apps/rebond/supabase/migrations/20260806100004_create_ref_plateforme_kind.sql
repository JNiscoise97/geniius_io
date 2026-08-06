-- Table de référence : familles de plateformes (portail d'archives, réseau
-- généalogique collaboratif, moteur de recherche d'actes, etc.)
-- Portée à l'identique depuis public.ref_plateforme_kind, aucun écart.

create table if not exists rebond.ref_plateforme_kind (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  categorie text not null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_plateforme_kind_pkey primary key (id),
  constraint ref_plateforme_kind_code_key unique (code)
);

create index if not exists idx_ref_plateforme_kind_code
  on rebond.ref_plateforme_kind using btree (code);

create index if not exists idx_ref_plateforme_kind_categorie
  on rebond.ref_plateforme_kind using btree (categorie);

comment on table rebond.ref_plateforme_kind is
  'Référentiel des familles de plateformes numériques. Voir apps/rebond/supabase/schema-docs/ref_plateforme_kind.md';
