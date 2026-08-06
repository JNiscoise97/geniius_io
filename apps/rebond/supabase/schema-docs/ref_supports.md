# `rebond.ref_supports`

Référentiel des supports physiques d'un exemplaire (ex. papier, parchemin,
microfilm...). Interrogée via le picker générique `RefSinglePickerSmart`.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null | Code stable |
| `label` | text | not null | Libellé affiché |
| `note` | text | nullable | Note libre |
| `description` | text | nullable | Description longue |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

Référencée par `rebond.exemplaires.support_ref` (`SET NULL`, FK corrigée
dans ce lot — pointait vers `public.ref_supports`). Également jointe dans
`v_exemplaires_pick` (désormais en interne à `rebond`).

## Écarts vs `public.ref_supports`

Aucun.
