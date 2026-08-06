-- Copie les données existantes de public.* vers rebond.* pour ce lot.
-- Additive, réversible : public.* inchangé. Idempotent (ON CONFLICT (id) DO NOTHING).
-- Ordre : respecte les dépendances (unites_documentaires est auto-référencée
-- mais copiée en un seul INSERT...SELECT, donc l'ordre des lignes n'a pas
-- d'importance ; exemplaires dépend de unites_documentaires ; citations
-- dépend de exemplaires ; corpus est indépendante).
--
-- Trigger de normalisation du titre désactivé le temps de la copie pour
-- garantir une copie fidèle de titre_norm plutôt qu'un recalcul (identique
-- en pratique, fonction pure, mais cohérence avec le principe de copie miroir).

alter table rebond.unites_documentaires disable trigger trg_unites_documentaires_titre_norm;

-- 1) unites_documentaires (ex ref_unites_documentaires) — statut -> statut_source,
--    workflow_statut -> statut_document
insert into rebond.unites_documentaires
  (id, titre, titre_norm, identifiant_interne, description, couverture_label,
   couverture_sort_start, couverture_sort_end, type_unite_ref, statut_source,
   statut_document, niveau_fiabilite, producteur_ref, parent_ud_id, metadonnees,
   role_document_ref, langue_ref, serie_ref, created_at, updated_at)
select
  id, titre, titre_norm, identifiant_interne, description, couverture_label,
  couverture_sort_start, couverture_sort_end, type_unite_ref, statut,
  workflow_statut, niveau_fiabilite, producteur_ref, parent_ud_id, metadonnees,
  role_document_ref, langue_ref, serie_ref, created_at, updated_at
from public.ref_unites_documentaires
on conflict (id) do nothing;

alter table rebond.unites_documentaires enable trigger trg_unites_documentaires_titre_norm;

-- 2) exemplaires (ex ref_exemplaires, dépend de unites_documentaires ci-dessus)
insert into rebond.exemplaires
  (id, unite_documentaire_id, depot_id, nature_ref, support_ref, cote_locale,
   identifiant_interne, localisation_interne, conditionnement, description, note,
   nb_pages, source_exemplaire_id, couverture_label, couverture_sort_start,
   couverture_sort_end, pagination_type_ref, physical_condition_ref,
   document_damage_kinds_ids, document_readability_features_ids,
   parent_exemplaire_id, dans_table, dans_registre, created_at, updated_at)
select
  id, unite_documentaire_id, depot_id, nature_ref, support_ref, cote_locale,
  identifiant_interne, localisation_interne, conditionnement, description, note,
  nb_pages, source_exemplaire_id, couverture_label, couverture_sort_start,
  couverture_sort_end, pagination_type_ref, physical_condition_ref,
  document_damage_kinds_ids, document_readability_features_ids,
  parent_exemplaire_id, dans_table, dans_registre, created_at, updated_at
from public.ref_exemplaires
on conflict (id) do nothing;

-- 3) citations (dépend de exemplaires ci-dessus)
insert into rebond.citations
  (id, exemplaire_id, target_type, target_id, is_missing, lacune, lacune_note,
   locating, note, repro_quality_ref, marks, marginalia, writing, sort_order,
   created_at, updated_at)
select
  id, exemplaire_id, target_type, target_id, is_missing, lacune, lacune_note,
  locating, note, repro_quality_ref, marks, marginalia, writing, sort_order,
  created_at, updated_at
from public.citations
on conflict (id) do nothing;

-- 4) corpus (indépendante)
insert into rebond.corpus
  (id, nom, description, type, created_by, created_at, updated_at)
select
  id, nom, description, type, created_by, created_at, updated_at
from public.corpus
on conflict (id) do nothing;

-- Vérification manuelle après exécution :
-- select 'unites_documentaires', (select count(*) from public.ref_unites_documentaires), (select count(*) from rebond.unites_documentaires)
-- union all select 'exemplaires', (select count(*) from public.ref_exemplaires), (select count(*) from rebond.exemplaires)
-- union all select 'citations', (select count(*) from public.citations), (select count(*) from rebond.citations)
-- union all select 'corpus', (select count(*) from public.corpus), (select count(*) from rebond.corpus);
