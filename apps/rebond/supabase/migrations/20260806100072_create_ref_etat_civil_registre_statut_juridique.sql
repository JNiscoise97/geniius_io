-- Référentiel : cadre juridique et population concernée par le registre
-- d'état civil. Renommée depuis public.ref_registre_statut_juridique.
-- Écart : index redondant supprimé (idem lot).

create table if not exists rebond.ref_etat_civil_registre_statut_juridique (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_etat_civil_registre_statut_juridique_pkey primary key (id),
  constraint ref_etat_civil_registre_statut_juridique_code_uk unique (code)
);

comment on table rebond.ref_etat_civil_registre_statut_juridique is
  'Cadre juridique et population concernée par le registre. Voir apps/rebond/supabase/schema-docs/ref_etat_civil_registre_statut_juridique.md';
