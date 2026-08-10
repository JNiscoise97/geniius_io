-- Troisième affinage du module Extraction (2026-08-08, même jour) : ajoute
-- "event" à entity_type. Certaines actions documentaires impliquent
-- plusieurs personnes avec des rôles distincts (qui accomplit l'action, en
-- présence de qui, devant qui) que le triplet subject/predicate/value seul
-- ne capturait pas bien ("présent" restait "présent à quoi ?"). Une entité
-- event (comparution, présentation, déclaration de prénom, lecture,
-- signature...) sert de point d'ancrage commun. Coexiste avec les
-- prédicats de rôle existants (comparant, declarant, witness, signs...),
-- ne les remplace pas.

alter table rebond.transcription_entities drop constraint if exists chk_transcription_entities_type;

alter table rebond.transcription_entities
  add constraint chk_transcription_entities_type check (entity_type in ('person', 'document', 'place', 'event'));

comment on column rebond.transcription_entities.entity_type is
  'person | document | place | event — event sert d''ancrage commun pour les actions impliquant plusieurs personnes (voir prédicats actor/before_person/presented_person/present_at).';

insert into rebond.ref_assertion_predicates (code, label, ordre) values
  ('actor', 'Acteur de l''événement (subject=event, object=personne)', 56),
  ('before_person', 'Devant qui (subject=event, object=personne)', 57),
  ('presented_person', 'Personne présentée (subject=event, object=personne)', 58),
  ('present_at', 'Présent lors de (subject=personne, object=event)', 59)
on conflict (code) do nothing;
