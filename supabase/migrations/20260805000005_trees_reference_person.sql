-- ===================================================
-- TREES.REFERENCE_PERSON_ID — personne "source" (racine Sosa) de l'arbre.
--
-- L'app avait jusqu'ici un seul ID de référence codé en dur (celui de
-- Jordan, "7351"), utilisé pour centrer l'arbre par défaut et calculer les
-- statistiques de parenté. Chaque arbre importé a besoin du sien — stocké
-- ici plutôt que dans une table à part, un arbre n'ayant qu'une seule
-- personne de référence à la fois.
--
-- text, pas uuid : les ID de personnes viennent du GEDCOM (ex. "7351"), pas
-- de la base — même format que persons.id.
-- ===================================================

alter table public.trees
  add column if not exists reference_person_id text;
