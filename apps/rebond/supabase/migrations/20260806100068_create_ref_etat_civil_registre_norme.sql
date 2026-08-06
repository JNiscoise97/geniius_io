-- Référentiel : degré de conformité aux normes légales du registre d'état
-- civil. Renommée depuis public.ref_registre_norme. Écart : index redondant
-- supprimé (idem lot).

create table if not exists rebond.ref_etat_civil_registre_norme (
  id uuid not null default gen_random_uuid(),
  code text not null,
  label text not null,
  note text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_etat_civil_registre_norme_pkey primary key (id),
  constraint ref_etat_civil_registre_norme_code_uk unique (code)
);

comment on table rebond.ref_etat_civil_registre_norme is
  'Degré de conformité aux normes légales du registre. Voir apps/rebond/supabase/schema-docs/ref_etat_civil_registre_norme.md';
