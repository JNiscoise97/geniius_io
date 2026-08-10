-- Deuxième affinage du module Extraction (2026-08-08, même jour) : ajoute
-- "place" à entity_type. Les lieux nommés récurrents (commune, section,
-- hameau) portent parfois leurs propres faits (ex. Caféyère est à la fois
-- une section et un hameau, situé dans la commune de Deshayes) — les
-- modéliser en texte libre uniquement perdait cette structure. Reste
-- volontairement minimal (pas de hiérarchie géographique imposée, pas de
-- référentiel géographique externe) : voir schema-docs/transcription_assertions.md.

alter table rebond.transcription_entities drop constraint if exists chk_transcription_entities_type;

alter table rebond.transcription_entities
  add constraint chk_transcription_entities_type check (entity_type in ('person', 'document', 'place'));

comment on column rebond.transcription_entities.entity_type is
  'person | document | place — les faits propres à l''acte doivent être rattachés à l''entité document ; les lieux nommés porteurs de leurs propres faits (section, hameau...) à une entité place, pas dupliqués en texte libre.';
