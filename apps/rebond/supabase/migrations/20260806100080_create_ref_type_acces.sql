-- Référentiel des types d'accès à un exemplaire (ex. URL, salle de lecture,
-- sur demande...). Portée depuis public.ref_type_acces.
--
-- Écarts volontaires (voir schema-docs/ref_type_acces.md) :
--   - Contrainte ref_type_acces_code_chk simplifiée : l'originale vérifiait
--     à la fois `code = upper(code)` ET `code ~ '^[A-Z_]+$'` — la seconde
--     implique strictement la première (une chaîne composée uniquement de
--     majuscules et underscores est déjà égale à sa version upper()).
--   - Index idx_ref_type_acces_code supprimé, redondant avec l'index
--     automatique de la contrainte unique sur code.

create table if not exists rebond.ref_type_acces (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  description text null,
  note text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_type_acces_pkey primary key (id),
  constraint ref_type_acces_code_key unique (code),
  constraint ref_type_acces_code_chk check (code ~ '^[A-Z_]+$')
);

comment on table rebond.ref_type_acces is
  'Référentiel des types d''accès à un exemplaire. Voir apps/rebond/supabase/schema-docs/ref_type_acces.md';
