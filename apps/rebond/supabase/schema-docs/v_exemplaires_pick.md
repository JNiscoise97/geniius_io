# `rebond.v_exemplaires_pick`

Vue de sélection enrichie d'un exemplaire — utilisée partout où l'app doit
afficher/choisir un exemplaire avec son contexte complet (dépôt, institution,
série documentaire, bureaux d'état civil associés, types d'actes associés,
meilleure URL d'accès).

## Composition

- `best_url` : meilleure URL d'accès par exemplaire (via `LATERAL JOIN` sur
  `ref_acces_numeriques`, priorité aux URL non vides puis les plus récentes),
  avec le code de la plateforme associée.
- `agg_bureaux` : bureaux d'état civil liés à l'unité documentaire (tableau
  d'ids + libellés formatés `"Nom (Département)"`).
- `agg_types_actes` : types d'actes liés à l'unité documentaire.

## Dépendances

Tables `rebond` : `exemplaires`, `unites_documentaires`,
`ref_series_documentaires`, `ref_depots`, `ref_depot_type`, `ref_institutions`,
`ref_institution_type`, `ref_pagination_type`, `ref_physical_condition`,
`ref_acces_numeriques`, `ref_plateformes`, `etat_civil_bureaux`,
`ref_etat_civil_type_acte`.

Cross-schema vers `public` (pas encore migrées) : `ref_natures`, `ref_supports`.

`unites_documentaires_bureaux` et `unites_documentaires_types_actes` (les
pivots `agg_bureaux`/`agg_types_actes`) sont maintenant dans `rebond` — la
vue a été mise à jour pour les utiliser (voir
`20260806100058_update_view_v_exemplaires_pick_pivots.sql`) après leur
migration ultérieure ; elles étaient d'abord référencées en cross-schema
vers `public.ref_unites_documentaires_*` avant de recevoir leur définition.

## Écarts vs `public.v_exemplaires_pick`

Adaptée aux tables renommées (`unites_documentaires`, `exemplaires`,
`ref_etat_civil_type_acte`). Aucun changement de logique ni de colonnes de
sortie.
