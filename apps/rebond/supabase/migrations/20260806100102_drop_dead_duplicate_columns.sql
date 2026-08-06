-- Nettoyage de 4 colonnes dupliquées entre unites_documentaires et
-- exemplaires dont un seul côté était réellement utilisé par le code (voir
-- audit du 2026-08-06) :
--   - identifiant_interne : gardé côté exemplaire (jamais écrit avant ce
--     lot, va devenir le seul et vrai emplacement), supprimé côté UD (posé
--     via "Décrire" jusqu'ici — 0 ligne avec valeur en prod, rien à migrer).
--   - description : gardé côté exemplaire ("Description physique", utilisé),
--     supprimé côté UD (jamais écrit par le code actuel — 2 lignes de seed/
--     démo avaient une valeur, perdues intentionnellement, cf. discussion).
--   - couverture_sort_start / couverture_sort_end : gardés côté UD (tri
--     chronologique des sources, utilisé), supprimés côté exemplaire (jamais
--     écrits — 0 ligne avec valeur en prod). La vue v_exemplaires_pick a été
--     mise à jour dans la migration précédente pour ne plus les référencer.

alter table rebond.unites_documentaires drop column if exists identifiant_interne;
alter table rebond.unites_documentaires drop column if exists description;

alter table rebond.exemplaires drop constraint if exists exemplaires_couverture_sort_chk;
alter table rebond.exemplaires drop column if exists couverture_sort_start;
alter table rebond.exemplaires drop column if exists couverture_sort_end;
