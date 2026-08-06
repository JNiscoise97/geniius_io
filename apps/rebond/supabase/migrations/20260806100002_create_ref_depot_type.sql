-- Table de référence : types de dépôt (salle de lecture, service en ligne, etc.)
--
-- Écarts volontaires vs public.ref_depot_type (voir schema-docs/ref_depot_type.md) :
--   + created_at, updated_at, note, description
--     -> alignement sur les 3 autres tables "type/kind" du même lot
--        (ref_institution_type, ref_mode_acces, ref_plateforme_kind), qui ont
--        toutes ces 4 colonnes. public.ref_depot_type ne les avait pas.

create table if not exists rebond.ref_depot_type (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  is_online boolean not null default false,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_depot_type_pkey primary key (id),
  constraint ref_depot_type_code_uk unique (code)
);

comment on table rebond.ref_depot_type is
  'Référentiel des types de dépôt. Voir apps/rebond/supabase/schema-docs/ref_depot_type.md — colonnes note/description/created_at/updated_at ajoutées vs public pour cohérence avec les autres tables type/kind.';
