# `rebond.ref_document_damage_kinds`

Référentiel des types de dommages/dégradations constatés sur un document
(ex. déchirure, moisissure, encre effacée...). Utilisé dans l'écran
d'enrichissement d'un exemplaire d'acte (sélection multiple).

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null | Code stable |
| `label` | text | not null | Libellé affiché |
| `categorie` | text | not null | Regroupement de types |
| `position` | integer | nullable | Ordre d'affichage manuel |
| `note` | text | nullable | Note libre |
| `description` | text | nullable | Description longue |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

Aucune — table de référence autonome, interrogée directement (picker
générique `RefSinglePickerSmart`, en mode multi-sélection).

## Écarts vs `public.ref_document_damage_kinds`

Aucun — portée à l'identique.

## Note

Contrairement à `ref_physical_condition`/`ref_repro_quality`/
`ref_handwriting_legibility`, `code` n'est pas contraint à être en majuscules
(`= upper(code)`) ici. Incohérence mineure du lot d'origine, non corrigée par
prudence (pas de visibilité sur la casse réelle des données existantes).
