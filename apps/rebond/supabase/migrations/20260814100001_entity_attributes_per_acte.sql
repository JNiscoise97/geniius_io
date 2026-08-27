-- Onglet "Informations à valider" (module Individu rapatrié) — ajout d'un
-- niveau par-acte : jusqu'ici rebond.entity_attributes ne portait qu'une
-- valeur GLOBALE par (entité, attribut), synthétisée en agrégeant les faits
-- de tous les actes. L'utilisateur veut désormais pouvoir d'abord
-- reconstituer, acte par acte, une fiche structurée (façon "acteur" de
-- l'ancien modèle) où chaque champ est sourcé sur un fait précis de CET
-- acte — la synthèse cross-actes (niveau existant) reste utile mais devient
-- un second niveau, pas remplacé.
--
-- version_id (nullable) distingue les deux niveaux :
--   - null      : valeur globale à l'entité (comportement historique inchangé)
--   - renseigné : valeur propre à cet acte précis (rebond.transcription_versions.id)
--
-- L'ancienne contrainte unique (entity_id, attribute_code) ne suffit plus
-- (il peut désormais exister une ligne globale ET une ligne par acte pour le
-- même attribut) — remplacée par un index unique sur (entity_id,
-- attribute_code, coalesce(version_id, uuid nul)) pour que les deux lignes
-- globales ne puissent jamais coexister (NULL n'est pas distinct de NULL
-- dans cet index, contrairement au comportement par défaut d'unique()).

alter table rebond.entity_attributes
  drop constraint if exists uq_entity_attributes_entity_code;

alter table rebond.entity_attributes
  add column if not exists version_id uuid null;

alter table rebond.entity_attributes
  drop constraint if exists fk_entity_attributes_version;

alter table rebond.entity_attributes
  add constraint fk_entity_attributes_version
    foreign key (version_id) references rebond.transcription_versions (id) on delete cascade;

create unique index if not exists uq_entity_attributes_scope
  on rebond.entity_attributes (entity_id, attribute_code, coalesce(version_id, '00000000-0000-0000-0000-000000000000'::uuid));

comment on column rebond.entity_attributes.version_id is
  'Acte source de cette valeur (rebond.transcription_versions.id). Null = valeur globale à l''entité (synthèse cross-actes) ; renseigné = valeur propre à cet acte précis (fiche acteur par acte, onglet "Informations à valider" > "Par acte").';
