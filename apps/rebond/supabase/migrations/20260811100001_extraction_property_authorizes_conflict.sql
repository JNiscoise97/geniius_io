-- Extraction : quatre extensions demandées explicitement par l'utilisateur
-- après revue critique du run "Lacour" (178→149 assertions, 2026-08-11),
-- toutes actées avec un "ok" explicite point par point (voir mémoire agent
-- project_extraction_module) :
--
-- 1. entity_type "property" — un bien (terrain, portion de terre, parcelle,
--    maison, immeuble) est distinct d'un lieu géographique/administratif
--    nommé (commune, section, hameau) : le premier est l'OBJET d'une vente/
--    succession et peut être situé sur un lieu (voir located_on ci-dessous),
--    le second sert de circonscription. Jusqu'ici les deux étaient confondus
--    sous "place", perdant cette distinction dans le vocabulaire de sortie.
--
-- 2. Prédicats promus depuis "other" (revient sur le choix du 2026-08-10,
--    migration 20260806100131, qui les avait délibérément laissés en
--    attente "tant que le besoin ne s'est pas confirmé sur plusieurs actes"
--    — désormais confirmé sur l'acte Lacour, décision explicite de les
--    ajouter maintenant) :
--    - authorizes : une personne autorise une autre à agir (ex. un mari
--      autorise son épouse à vendre) — jusqu'ici mal capturé (consentement
--      de la personne autorisée pris pour le sujet de l'action).
--    - marriage_date / marriage_place : marriage_time ("Heure de mariage")
--      était détourné pour stocker des ANNÉES/DATES de mariage (1910,
--      1930-03-01...) faute de prédicat dédié — marriage_time reste réservé
--      à une véritable heure du jour (rare), désormais explicite.
--    - document_date / document_number / document_volume : équivalents
--      génériques d'act_date/registration_* pour un document AUTRE que
--      l'acte notarié lui-même mentionné dans le texte (ex. une décision
--      administrative citée, "Décision du Gouverneur autorisant la vente")
--      — jusqu'ici act_date/registration_number étaient réutilisés à tort
--      sur ce document secondaire, ambigus avec ceux du document principal.
--    - located_on : un bien bâti (maison, immeuble) situé sur un autre bien/
--      lieu (ex. une maison édifiée sur une portion de terre) — jusqu'ici
--      administrative_area (circonscription/juridiction) était détourné
--      pour exprimer cette relation purement physique.
--
-- 3. Statut "conflicting" + colonne conflict_group_id : quand deux
--    assertions distinctes (citations différentes) portent le même
--    (subject, predicate) avec des valeurs qui SE CONTREDISENT (ex. prix de
--    vente annoncé à seize mille francs à un endroit du texte, puis précisé
--    à un autre montant ailleurs), les deux doivent rester visibles et être
--    tranchées par un humain plutôt que d'en garder une silencieusement
--    (déduplication existante) ou de laisser les deux se noyer parmi les
--    assertions normales sans lien visible entre elles. conflict_group_id
--    relie les assertions d'un même conflit ; la détection elle-même reste
--    côté application (extraction.service.ts), pas dans cette migration.

alter table rebond.transcription_entities drop constraint if exists chk_transcription_entities_type;

alter table rebond.transcription_entities
  add constraint chk_transcription_entities_type check (entity_type in ('person', 'document', 'place', 'event', 'property'));

comment on column rebond.transcription_entities.entity_type is
  'person | document | place | event | property — property = un bien précis (terrain, maison...), objet d''une vente/succession, distinct d''un lieu géographique/administratif (place) ; voir located_on pour les relier.';

insert into rebond.ref_assertion_predicates (code, label, ordre) values
  ('authorizes', 'Autorise (ex: époux autorise l''épouse à vendre)', 74),
  ('marriage_date', 'Date de mariage', 75),
  ('marriage_place', 'Lieu de mariage', 76),
  ('document_date', 'Date d''un document autre que l''acte lui-même', 77),
  ('document_number', 'Numéro d''un document autre que l''acte lui-même', 78),
  ('document_volume', 'Volume d''un document autre que l''acte lui-même', 79),
  ('located_on', 'Situé sur (bien bâti -> bien/lieu qui le porte)', 80)
on conflict (code) do nothing;

update rebond.ref_assertion_predicates set label = 'Heure de mariage (rare — pour une date/année, voir marriage_date)' where code = 'marriage_time';

alter table rebond.transcription_assertions drop constraint if exists chk_transcription_assertions_status;

alter table rebond.transcription_assertions
  add constraint chk_transcription_assertions_status check (status in ('pending', 'validated', 'rejected', 'conflicting'));

alter table rebond.transcription_assertions
  add column if not exists conflict_group_id uuid null;

comment on column rebond.transcription_assertions.conflict_group_id is
  'Regroupe les assertions en conflit de valeur (même subject+predicate, valeurs différentes trouvées à deux endroits du texte) — null hors conflit. Voir status=''conflicting''.';
