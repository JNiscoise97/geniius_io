-- Référentiel des types d'acte d'état civil (naissance, mariage, décès...).
-- Renommée depuis public.ref_ec_type_acte : préfixe abrégé "ec_" uniformisé
-- en "etat_civil_" avec le reste du domaine (voir
-- schema-docs/ref_etat_civil_type_acte.md pour le détail des autres écarts).

create table if not exists rebond.ref_etat_civil_type_acte (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  label_pluriel text null,
  description text null,
  note text null,
  color text not null default 'gray',
  position integer null default 0,
  categorie text not null default 'autre',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_etat_civil_type_acte_pkey primary key (id),
  constraint ref_etat_civil_type_acte_code_key unique (code),
  constraint ref_etat_civil_type_acte_position_check check (position >= 0)
);

create index if not exists idx_ref_etat_civil_type_acte_color
  on rebond.ref_etat_civil_type_acte using btree (color);

comment on table rebond.ref_etat_civil_type_acte is
  'Référentiel des types d''acte d''état civil. Voir apps/rebond/supabase/schema-docs/ref_etat_civil_type_acte.md';
