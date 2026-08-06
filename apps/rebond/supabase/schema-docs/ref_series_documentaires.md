# `rebond.ref_series_documentaires`

Séries documentaires — classification archivistique de haut niveau (ex.
`ETAT_CIVIL`, `NOTARIAT`, `CADASTRE`, `PAROISSIAL`...). Qualifie
`ref_unites_documentaires.serie_ref`, utilisée par l'assistant de
référencement pour adapter son vocabulaire selon la série choisie.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null, CHECK format `^[A-Z0-9]+(_[A-Z0-9]+)*$` | Code stable (majuscules/chiffres/underscore) |
| `label` | text | not null | Libellé affiché |
| `description` | text | nullable | Description longue |
| `note` | text | nullable | Note libre |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

Référencée par `public.ref_unites_documentaires.serie_ref` (table pas encore
migrée) — par valeur d'id scalaire, aucune jointure embarquée dans le code
actuel.

## Trigger

`trg_ref_series_documentaires_updated_at` (`BEFORE UPDATE`) → réutilise
`public.fn_set_updated_at()` telle quelle (même hypothèse que
`ref_role_document`).

## Écarts vs `public.ref_series_documentaires`

Index `idx_ref_series_documentaires_code` supprimé : redondant avec l'index
automatique de la contrainte unique sur `code`.
