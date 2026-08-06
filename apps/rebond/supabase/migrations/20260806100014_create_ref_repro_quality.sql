-- Table de référence : qualité de reproduction (numérisation/photo) d'un exemplaire.
--
-- Écarts volontaires vs public.ref_repro_quality (voir schema-docs/ref_repro_quality.md) :
--   - Contraintes renommées ref_ec_repro_qualities_* -> ref_repro_quality_*
--     (même résidu de renommage que ref_physical_condition)
--   - Index idx_ref_repro_quality_code et idx_ref_ec_repro_qualities_code
--     supprimés : les DEUX étaient redondants avec l'index automatique de la
--     contrainte unique sur code (et dupliqués l'un de l'autre).

create table if not exists rebond.ref_repro_quality (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  description text null,
  note text null,
  position integer null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_repro_quality_pkey primary key (id),
  constraint ref_repro_quality_code_uniq unique (code),
  constraint ref_repro_quality_code_upper_chk check (code = upper(code))
);

create index if not exists idx_ref_repro_quality_position
  on rebond.ref_repro_quality using btree (position);

comment on table rebond.ref_repro_quality is
  'Référentiel des qualités de reproduction. Voir apps/rebond/supabase/schema-docs/ref_repro_quality.md';
