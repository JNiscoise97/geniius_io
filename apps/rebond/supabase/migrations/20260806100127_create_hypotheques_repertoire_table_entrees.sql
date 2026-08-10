-- Contenu structuré des REGISTRES D'ORDRE (instruments de recherche, pas des
-- actes) — demandé explicitement par l'utilisateur le 2026-08-10 plutôt que de
-- les laisser en unites_documentaires génériques comme les tables décennales
-- d'état civil aujourd'hui.
--
-- hypotheques_repertoire_entrees : une ligne = une formalité indexée dans un
-- volume de "répertoire des formalités hypothécaires" (registre de type
-- repertoire_formalites). type_formalite_ref n'est PAS contraint en base à la
-- famille 'formalites' de ref_hypotheques_type_registre (Postgres ne permet
-- pas une FK conditionnelle simple sur une autre colonne) — convention
-- applicative à respecter, même choix déjà fait pour etat_civil_repertoires.type_acte_ids
-- (voir schema-docs/etat_civil_repertoires.md, "Note non corrigée").
--
-- hypotheques_table_entrees / hypotheques_table_entree_refs : une ligne de
-- table alphabétique (un nom) peut avoir PLUSIEURS renvois vers le répertoire
-- (un même nom impliqué dans plusieurs formalités) — d'où une table de
-- jointure séparée plutôt qu'une colonne unique, décidé explicitement.
-- repertoire_entree_id reste nullable : le renvoi peut être saisi (volume_brut/
-- case_brute, texte libre) avant que la ligne de répertoire correspondante
-- n'ait été elle-même créée en base — résolution ultérieure, même logique que
-- object_entity_id/value_text dans le module Extraction.

create table if not exists rebond.hypotheques_repertoire_entrees (
  id uuid not null default gen_random_uuid(),
  registre_id uuid not null,
  case_numero text not null,
  type_formalite_ref uuid not null,
  description_courte text null,
  acte_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint hypotheques_repertoire_entrees_pkey primary key (id),
  constraint hypotheques_repertoire_entrees_unique unique (registre_id, case_numero),
  constraint hypotheques_repertoire_entrees_registre_id_fkey
    foreign key (registre_id) references rebond.hypotheques_registres (id) on delete cascade,
  constraint hypotheques_repertoire_entrees_type_formalite_ref_fkey
    foreign key (type_formalite_ref) references rebond.ref_hypotheques_type_registre (id) on delete restrict,
  constraint hypotheques_repertoire_entrees_acte_id_fkey
    foreign key (acte_id) references rebond.hypotheques_actes (id) on delete set null
);

create index if not exists idx_hypotheques_repertoire_entrees_registre_id
  on rebond.hypotheques_repertoire_entrees using btree (registre_id);

create index if not exists idx_hypotheques_repertoire_entrees_acte_id
  on rebond.hypotheques_repertoire_entrees using btree (acte_id);

comment on table rebond.hypotheques_repertoire_entrees is
  'Lignes d''un répertoire des formalités hypothécaires (registre d''ordre). Voir échange utilisateur du 2026-08-10.';

create table if not exists rebond.hypotheques_table_entrees (
  id uuid not null default gen_random_uuid(),
  registre_id uuid not null,
  nom text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint hypotheques_table_entrees_pkey primary key (id),
  constraint hypotheques_table_entrees_registre_id_fkey
    foreign key (registre_id) references rebond.hypotheques_registres (id) on delete cascade
);

create index if not exists idx_hypotheques_table_entrees_registre_id
  on rebond.hypotheques_table_entrees using btree (registre_id);

create index if not exists idx_hypotheques_table_entrees_nom
  on rebond.hypotheques_table_entrees using btree (nom);

comment on table rebond.hypotheques_table_entrees is
  'Lignes (noms) d''une table alphabétique hypothécaire (registre d''ordre). Voir échange utilisateur du 2026-08-10.';

create table if not exists rebond.hypotheques_table_entree_refs (
  id uuid not null default gen_random_uuid(),
  table_entree_id uuid not null,
  repertoire_entree_id uuid null,
  volume_brut integer null,
  case_brute text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint hypotheques_table_entree_refs_pkey primary key (id),
  constraint hypotheques_table_entree_refs_table_entree_id_fkey
    foreign key (table_entree_id) references rebond.hypotheques_table_entrees (id) on delete cascade,
  constraint hypotheques_table_entree_refs_repertoire_entree_id_fkey
    foreign key (repertoire_entree_id) references rebond.hypotheques_repertoire_entrees (id) on delete set null
);

create index if not exists idx_hypotheques_table_entree_refs_table_entree_id
  on rebond.hypotheques_table_entree_refs using btree (table_entree_id);

create index if not exists idx_hypotheques_table_entree_refs_repertoire_entree_id
  on rebond.hypotheques_table_entree_refs using btree (repertoire_entree_id);

comment on table rebond.hypotheques_table_entree_refs is
  'Renvoi(s) d''une entrée de table alphabétique vers une ou plusieurs lignes du répertoire des formalités.';
