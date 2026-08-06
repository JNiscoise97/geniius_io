-- Pivot unités documentaires <-> bureaux d'état civil. Renommée depuis
-- public.ref_unites_documentaires_bureaux : même logique que
-- unites_documentaires (pas un référentiel, préfixe ref_ retiré).
-- Les deux FK sont désormais entièrement internes à rebond.

create table if not exists rebond.unites_documentaires_bureaux (
  unite_id uuid not null,
  bureau_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint unites_documentaires_bureaux_pkey primary key (unite_id, bureau_id),
  constraint unites_documentaires_bureaux_bureau_fk
    foreign key (bureau_id) references rebond.etat_civil_bureaux (id) on delete restrict,
  constraint unites_documentaires_bureaux_unite_fk
    foreign key (unite_id) references rebond.unites_documentaires (id) on delete cascade
);

create index if not exists idx_unites_documentaires_bureaux_unite
  on rebond.unites_documentaires_bureaux using btree (unite_id);

create index if not exists idx_unites_documentaires_bureaux_bureau
  on rebond.unites_documentaires_bureaux using btree (bureau_id);

comment on table rebond.unites_documentaires_bureaux is
  'Pivot unités documentaires <-> bureaux d''état civil. Voir apps/rebond/supabase/schema-docs/unites_documentaires_bureaux.md';
