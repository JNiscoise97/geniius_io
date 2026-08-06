-- Table de référence : état physique d'un support (exemplaire d'acte).
--
-- Écarts volontaires vs public.ref_physical_condition (voir
-- schema-docs/ref_physical_condition.md) :
--   - Contraintes renommées ref_ec_physical_conditions_* -> ref_physical_condition_*
--     (résidu d'un renommage de table jamais répercuté sur les noms de contraintes)
--   - Index idx_ref_ec_physical_conditions_code supprimé : redondant avec
--     l'index automatique de la contrainte unique sur code.

create table if not exists rebond.ref_physical_condition (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  description text null,
  note text null,
  position integer null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_physical_condition_pkey primary key (id),
  constraint ref_physical_condition_code_uniq unique (code),
  constraint ref_physical_condition_code_upper_chk check (code = upper(code))
);

create index if not exists idx_ref_physical_condition_position
  on rebond.ref_physical_condition using btree (position);

comment on table rebond.ref_physical_condition is
  'Référentiel des états physiques de support. Voir apps/rebond/supabase/schema-docs/ref_physical_condition.md';
