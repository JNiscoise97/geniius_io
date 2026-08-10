-- Registres hypothécaires — un volume physique, qu'il porte des formalités
-- (dépôt/transcription/inscription) ou qu'il soit un registre d'ordre (table
-- alphabétique, répertoire des formalités). numero_volume remplace la notion
-- d'"année" d'etat_civil_registres : les hypothèques s'organisent par
-- numérotation de volume continue, pas par année (voir échange utilisateur
-- du 2026-08-10). periode_debut/periode_fin (années, pas de dates précises —
-- l'info disponible sur les registres est typiquement juste des bornes
-- d'années) restent le repli de tri/affichage, comme etat_civil_registres.annee
-- pour la hiérarchie de l'atelier documentaire.
--
-- Contrairement à etat_civil_registres, pas de pivot type_acte many-to-many :
-- type_registre_ref suffit (un registre a UN SEUL type, pas plusieurs formalités
-- mélangées) — le label peut donc se calculer directement à l'insertion, sans
-- second appel RPC après coup (voir 20260806100128 pour le trigger).

create table if not exists rebond.hypotheques_registres (
  id uuid not null default gen_random_uuid(),
  bureau_id uuid not null,
  type_registre_ref uuid not null,
  numero_volume integer not null,
  periode_debut integer null,
  periode_fin integer null,
  label text null,
  unite_documentaire_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint hypotheques_registres_pkey primary key (id),
  constraint hypotheques_registres_unique unique (bureau_id, type_registre_ref, numero_volume),
  constraint hypotheques_registres_periode_check
    check (periode_fin is null or periode_debut is null or periode_fin >= periode_debut),
  constraint hypotheques_registres_bureau_id_fkey
    foreign key (bureau_id) references rebond.hypotheques_bureaux (id) on delete cascade,
  constraint hypotheques_registres_type_registre_ref_fkey
    foreign key (type_registre_ref) references rebond.ref_hypotheques_type_registre (id) on delete restrict,
  constraint hypotheques_registres_unite_documentaire_id_fkey
    foreign key (unite_documentaire_id) references rebond.unites_documentaires (id) on delete set null
);

create index if not exists idx_hypotheques_registres_bureau_type
  on rebond.hypotheques_registres using btree (bureau_id, type_registre_ref);

create index if not exists idx_hypotheques_registres_ud_id
  on rebond.hypotheques_registres using btree (unite_documentaire_id);

comment on table rebond.hypotheques_registres is
  'Registres hypothécaires (volumes) — formalités ou registres d''ordre. Équivalent hypothèques de etat_civil_registres.';
