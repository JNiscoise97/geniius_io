# `rebond.exemplaires`

Instances physiques ou numériques d'une unité documentaire — ex. plusieurs
numérisations du même acte, ou sa version conservée dans deux dépôts
différents. Chaque citation pointe vers un exemplaire précis, pas vers
l'unité documentaire abstraite.

**Renommée depuis `public.ref_exemplaires`** (même raison que
`unites_documentaires` : ce n'est pas un référentiel).

## Colonnes principales

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `unite_documentaire_id` | uuid | not null, FK → `unites_documentaires` | Unité documentaire concernée |
| `depot_id` | uuid | not null, FK → `ref_depots` | Dépôt de conservation |
| `nature_ref` | uuid | nullable, FK cross-schema | Nature de l'exemplaire |
| `support_ref` | uuid | nullable, FK cross-schema | Support physique |
| `pagination_type_ref` | uuid | nullable, FK → `ref_pagination_type` | Système de pagination |
| `physical_condition_ref` | uuid | nullable, FK → `ref_physical_condition` | État physique |
| `document_damage_kinds_ids` / `document_readability_features_ids` | uuid[] | nullable | Voir note |
| `parent_exemplaire_id` / `source_exemplaire_id` | uuid | nullable, FK → elle-même | Hiérarchie/dérivation d'exemplaires |
| `cote_locale`, `identifiant_interne`, `localisation_interne`, `conditionnement` | text | nullable | Localisation et conditionnement |
| `couverture_label`, `couverture_sort_start`, `couverture_sort_end` | — | nullable | Couverture temporelle, CHECK cohérence start/end |
| `nb_pages` | integer | nullable | Nombre de pages |
| `dans_table` / `dans_registre` | boolean | nullable | Appartenance à un répertoire/registre |
| `note` / `description` | text | nullable | Notes libres |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `unite_documentaire_id` → **`rebond.unites_documentaires.id`** (ce même lot), `CASCADE`.
- `depot_id` → `rebond.ref_depots.id`, `RESTRICT`.
- `pagination_type_ref`, `physical_condition_ref` → déjà dans `rebond`.
- `nature_ref` → cross-schema `public.ref_natures.id` (pas encore migrée).
- `support_ref` → cross-schema `public.ref_supports.id` (pas encore migrée).
- `parent_exemplaire_id`, `source_exemplaire_id` → elle-même.
- Référencée par `rebond.citations.exemplaire_id` (`RESTRICT`) et par
  `rebond.ref_acces_numeriques.exemplaire_id` (`RESTRICT`, FK corrigée dans
  ce même lot, voir `20260806100047_repoint_fks_previous_batches.sql`).

## Trigger

`trg_exemplaires_updated_at` → réutilise `public.fn_set_updated_at()`.

## Écarts vs `public.ref_exemplaires`

Renommage de la table uniquement. Noms d'index alignés sur le nouveau nom.

## Note (non corrigée)

`document_damage_kinds_ids`/`document_readability_features_ids` sont des
tableaux de uuid, sans intégrité référentielle possible en Postgres (même
limitation que `type_acte_ids` sur `etat_civil_repertoires`).
