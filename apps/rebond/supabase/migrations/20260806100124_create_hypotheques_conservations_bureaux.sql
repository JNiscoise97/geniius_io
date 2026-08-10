-- Niveau territorial/administratif du domaine Hypothèques — deux niveaux
-- distincts sur demande explicite de l'utilisateur (2026-08-10), même si les
-- deux désignent souvent le même office réel dans les sources (cotes
-- quasi identiques pour "Conservation de Basse-Terre" / "Bureau de
-- Basse-Terre" au FRAD971) : la source d'archives les distingue parfois,
-- parfois non (cas de Saint-Paul/Saint-Pierre à La Réunion, où seule la
-- Conservation apparaît) — dans ce dernier cas, un bureau est quand même créé
-- au même nom que sa conservation (convention actée), pour garder un seul
-- chemin de parenté (bureau_id) partout en aval.
--
-- region reste une simple colonne texte (comme etat_civil_bureaux.region),
-- pas une table dédiée : le projet couvrira Guadeloupe et La Réunion dans la
-- même base, region sert uniquement à les distinguer/regrouper.

create table if not exists rebond.hypotheques_conservations (
  id uuid not null default gen_random_uuid(),
  nom text not null,
  region text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint hypotheques_conservations_pkey primary key (id),
  constraint hypotheques_conservations_unique unique (nom, region)
);

comment on table rebond.hypotheques_conservations is
  'Conservations des hypothèques (niveau territorial). Voir échange utilisateur du 2026-08-10.';

create table if not exists rebond.hypotheques_bureaux (
  id uuid not null default gen_random_uuid(),
  conservation_id uuid not null,
  nom text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint hypotheques_bureaux_pkey primary key (id),
  constraint hypotheques_bureaux_unique unique (conservation_id, nom),
  constraint hypotheques_bureaux_conservation_id_fkey
    foreign key (conservation_id) references rebond.hypotheques_conservations (id) on delete cascade
);

create index if not exists idx_hypotheques_bureaux_conservation_id
  on rebond.hypotheques_bureaux using btree (conservation_id);

comment on table rebond.hypotheques_bureaux is
  'Bureaux (offices) de conservation des hypothèques. Équivalent hypothèques de etat_civil_bureaux.';
