-- Cinquième affinage du module Extraction (2026-08-08, même jour) :
-- "section" et "hamlet" faisaient doublon avec "quality" pour décrire la
-- nature d'un lieu (Claude utilisait tantôt section=Caféyère, tantôt
-- quality=hameau pour le même genre de fait) — retenu : une seule logique,
-- quality pour la nature d'un lieu ("Caféyère -- quality --> section").
-- Dépréciés comme "time" en son temps : conservés en base (RESTRICT sur les
-- assertions existantes), retirés du vocabulaire proposé à l'agent.

update rebond.ref_assertion_predicates
  set label = 'Section (déprécié — utiliser quality)'
  where code = 'section';

update rebond.ref_assertion_predicates
  set label = 'Hameau (déprécié — utiliser quality)'
  where code = 'hamlet';
