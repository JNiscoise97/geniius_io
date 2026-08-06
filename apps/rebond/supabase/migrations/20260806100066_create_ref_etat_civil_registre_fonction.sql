-- Référentiel : rôle administratif du registre d'état civil. Renommée depuis
-- public.ref_registre_fonction (préfixe etat_civil ajouté — usage confirmé
-- exclusif à etat_civil_registres, notaire_registres n'a aucune colonne
-- correspondante).
-- Écart : index ref_registre_fonction_code_idx supprimé, redondant avec
-- l'index automatique de la contrainte unique sur code.

create table if not exists rebond.ref_etat_civil_registre_fonction (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_etat_civil_registre_fonction_pkey primary key (id),
  constraint ref_etat_civil_registre_fonction_code_uk unique (code)
);

comment on table rebond.ref_etat_civil_registre_fonction is
  'Rôle administratif du registre d''état civil. Voir apps/rebond/supabase/schema-docs/ref_etat_civil_registre_fonction.md';
