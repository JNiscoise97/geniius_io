-- Affinage du module Extraction après premier test réel (2026-08-08) :
-- - les entités documentaires ont désormais un type (personne vs document),
--   pour que les faits propres à l'acte (date, lieu, heure, type de document,
--   lecture) ne soient plus attribués par erreur à l'officiant qui le rédige ;
-- - renommage drafting_date/drafting_place -> act_date/act_place (plus
--   neutre : "rédaction" présuppose un concept qui n'est pas toujours le
--   bon) ; UPDATE sur la ligne existante, pas de suppression, pour ne pas
--   casser les FK des assertions déjà créées ;
-- - nouveaux prédicats identifiés sur un acte de naissance réel : titres de
--   civilité, qualité distincte de la profession, heures spécialisées par
--   type d'événement, présentation d'enfant, déclaration de prénom, type de
--   document, qualificatifs de lieu (section/hameau/circonscription),
--   déclaration générique, interpellation à signer ;
-- - "time" déprécié (trop ambigu, cf. schema-docs) au profit des heures
--   spécialisées — conservé en base (FK RESTRICT) mais retiré du vocabulaire
--   proposé à l'agent IA.

alter table rebond.transcription_entities
  add column if not exists entity_type text not null default 'person';

do $$
begin
  alter table rebond.transcription_entities
    add constraint chk_transcription_entities_type check (entity_type in ('person', 'document'));
exception when duplicate_object then null;
end $$;

update rebond.ref_assertion_predicates set code = 'act_date', label = 'Date de l''acte' where code = 'drafting_date';
update rebond.ref_assertion_predicates set code = 'act_place', label = 'Lieu de l''acte' where code = 'drafting_place';
update rebond.ref_assertion_predicates set label = 'Heure (déprécié — voir act_time / birth_time / death_time / marriage_time)' where code = 'time';

insert into rebond.ref_assertion_predicates (code, label, ordre) values
  ('title', 'Titre de civilité (sieur, dame...)', 42),
  ('quality', 'Qualité / statut (distinct de la profession)', 43),
  ('act_time', 'Heure de l''acte', 44),
  ('birth_time', 'Heure de naissance', 45),
  ('death_time', 'Heure de décès', 46),
  ('marriage_time', 'Heure de mariage', 47),
  ('presentation', 'Présentation d''une personne (ex. un enfant présenté)', 48),
  ('naming_declaration', 'Déclaration de prénom(s)', 49),
  ('document_type', 'Type de document', 50),
  ('section', 'Section (lieu-dit)', 51),
  ('hamlet', 'Hameau', 52),
  ('administrative_area', 'Circonscription administrative', 53),
  ('declares', 'Déclare (action générique, hors cas déjà catégorisés)', 54),
  ('is_asked_to_sign', 'Interpellé de signer', 55)
on conflict (code) do nothing;

comment on column rebond.transcription_entities.entity_type is
  'person | document — les faits propres à l''acte (date, lieu, heure, type, lecture) doivent être rattachés à l''entité document, pas à une personne.';
