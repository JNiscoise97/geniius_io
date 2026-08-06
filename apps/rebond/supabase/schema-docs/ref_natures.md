# `rebond.ref_natures`

Référentiel des natures d'un exemplaire (ex. original, copie, minute,
duplicata...). Interrogée via le picker générique `RefSinglePickerSmart`.

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

Référencée par `rebond.exemplaires.nature_ref` (`SET NULL`, FK corrigée dans
ce lot — pointait vers `public.ref_natures`). Également jointe dans les vues
`v_sources` et `v_exemplaires_pick` (désormais en interne à `rebond`, dernière
trace de cross-schema levée sur ces deux vues).

## Écarts vs `public.ref_natures`

Aucun.
