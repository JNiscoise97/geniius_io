-- Répertoires de dépouillement (tables décennales/annuelles/générales) d'un
-- bureau d'état civil. Renommée depuis public.ec_tables : préfixe abrégé
-- uniformisé, et "tables" évité (ambigu avec "table SQL") au profit du terme
-- archivistique standard "répertoire" — voir
-- schema-docs/etat_civil_repertoires.md.
--
-- unite_documentaire_id reste cross-schema vers public.ref_unites_documentaires
-- (pas encore migrée).

create table if not exists rebond.etat_civil_repertoires (
  id uuid not null default gen_random_uuid(),
  unite_documentaire_id uuid null,
  bureau_id uuid null,
  periodicite text not null,
  classement text null,
  annee_debut integer not null,
  annee_fin integer null,
  type_acte_ids uuid[] not null default '{}',
  label text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint etat_civil_repertoires_pkey primary key (id),
  constraint etat_civil_repertoires_bureau_id_fkey
    foreign key (bureau_id) references rebond.etat_civil_bureaux (id) on delete set null,
  constraint etat_civil_repertoires_unite_documentaire_id_fkey
    foreign key (unite_documentaire_id) references public.ref_unites_documentaires (id) on delete set null,
  constraint etat_civil_repertoires_annees_chk
    check (annee_fin is null or annee_fin >= annee_debut),
  constraint etat_civil_repertoires_classement_chk
    check (classement is null or classement = any (array['alphabetique', 'chronologique'])),
  constraint etat_civil_repertoires_periodicite_chk
    check (periodicite = any (array['annuelle', 'decennale', 'generale']))
);

create index if not exists idx_etat_civil_repertoires_unite_documentaire_id
  on rebond.etat_civil_repertoires using btree (unite_documentaire_id);

create index if not exists idx_etat_civil_repertoires_bureau_id
  on rebond.etat_civil_repertoires using btree (bureau_id);

create index if not exists idx_etat_civil_repertoires_annee_debut_annee_fin
  on rebond.etat_civil_repertoires using btree (annee_debut, annee_fin);

comment on table rebond.etat_civil_repertoires is
  'Répertoires (tables décennales/annuelles/générales) de dépouillement. Voir apps/rebond/supabase/schema-docs/etat_civil_repertoires.md';
