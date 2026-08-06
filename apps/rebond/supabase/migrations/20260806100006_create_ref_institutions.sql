-- Institutions détentrices de patrimoine documentaire (Archives départementales,
-- mairies, sociétés savantes...). Dépend de rebond.ref_institution_type et
-- rebond.ref_plateformes.
--
-- Écart volontaire vs public.ref_institutions (voir schema-docs/ref_institutions.md) :
--   + ON DELETE RESTRICT rendu explicite sur plateforme_ref (était implicite,
--     comportement par défaut NO ACTION dans public — inchangé fonctionnellement,
--     juste documenté, pour cohérence avec type_institution_ref qui, lui,
--     déclarait déjà RESTRICT explicitement).

create table if not exists rebond.ref_institutions (
  id uuid not null default gen_random_uuid(),
  nom text not null,
  sigle text null,
  pays text null,
  region text null,
  departement text null,
  commune text null,
  site_web text null,
  note text null,
  type_institution_ref uuid not null,
  plateforme_ref uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ref_institutions_pkey primary key (id),
  constraint ref_institutions_nom_uk unique (nom),
  constraint ref_institutions_type_institution_ref_fk
    foreign key (type_institution_ref) references rebond.ref_institution_type (id)
    on update cascade on delete restrict,
  constraint ref_institutions_plateforme_ref_fkey
    foreign key (plateforme_ref) references rebond.ref_plateformes (id)
    on delete restrict
);

comment on table rebond.ref_institutions is
  'Institutions détentrices de patrimoine documentaire. Voir apps/rebond/supabase/schema-docs/ref_institutions.md';
