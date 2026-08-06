-- Pivot unités documentaires <-> types d'acte d'état civil. Renommée depuis
-- public.ref_unites_documentaires_types_actes : même logique que
-- unites_documentaires (pas un référentiel, préfixe ref_ retiré). FK vers
-- ref_ec_type_acte adaptée au renommage en ref_etat_civil_type_acte.
-- Les deux FK sont désormais entièrement internes à rebond.

create table if not exists rebond.unites_documentaires_types_actes (
  unite_id uuid not null,
  type_acte_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint unites_documentaires_types_actes_pkey primary key (unite_id, type_acte_id),
  constraint unites_documentaires_types_actes_type_acte_fk
    foreign key (type_acte_id) references rebond.ref_etat_civil_type_acte (id) on delete restrict,
  constraint unites_documentaires_types_actes_unite_fk
    foreign key (unite_id) references rebond.unites_documentaires (id) on delete cascade
);

create index if not exists idx_unites_documentaires_types_actes_unite
  on rebond.unites_documentaires_types_actes using btree (unite_id);

create index if not exists idx_unites_documentaires_types_actes_type_acte
  on rebond.unites_documentaires_types_actes using btree (type_acte_id);

comment on table rebond.unites_documentaires_types_actes is
  'Pivot unités documentaires <-> types d''acte. Voir apps/rebond/supabase/schema-docs/unites_documentaires_types_actes.md';
