-- Table de référence : niveau de lisibilité d'un manuscrit.
-- Portée à l'identique depuis public.ref_handwriting_legibility, aucun écart.
--
-- Particularité (volontaire, déjà présente dans public) : `position` est en
-- `numeric` (pas `integer` comme les autres tables du lot) ET soumis à une
-- contrainte unique — permet d'insérer une position fractionnaire (ex. 1.5
-- entre 1 et 2) pour réordonner sans renuméroter toute la table.

create table if not exists rebond.ref_handwriting_legibility (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  position numeric null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_handwriting_legibility_pkey primary key (id),
  constraint ref_handwriting_legibility_code_uk unique (code),
  constraint ref_handwriting_legibility_position_key unique (position),
  constraint ref_handwriting_legibility_code_chk check (code = upper(code))
);

comment on table rebond.ref_handwriting_legibility is
  'Référentiel des niveaux de lisibilité manuscrite. Voir apps/rebond/supabase/schema-docs/ref_handwriting_legibility.md';
