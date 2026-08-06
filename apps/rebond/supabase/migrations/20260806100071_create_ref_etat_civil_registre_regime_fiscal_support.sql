-- Référentiel : régime fiscal et probatoire du support du registre d'état
-- civil (timbré/non timbré/mixte). Renommée depuis
-- public.ref_registre_regime_fiscal_support. Écart : index redondant
-- supprimé (idem lot).
--
-- Utilisée par rebond.create_registre_label (voir migration dédiée pour la
-- mise à jour de cette fonction, qui pointait en cross-schema vers
-- public.ref_registre_regime_fiscal_support).

create table if not exists rebond.ref_etat_civil_registre_regime_fiscal_support (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_etat_civil_registre_regime_fiscal_support_pkey primary key (id),
  constraint ref_etat_civil_registre_regime_fiscal_support_code_uk unique (code)
);

comment on table rebond.ref_etat_civil_registre_regime_fiscal_support is
  'Régime fiscal et probatoire du support du registre. Voir apps/rebond/supabase/schema-docs/ref_etat_civil_registre_regime_fiscal_support.md';
