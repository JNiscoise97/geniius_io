# `rebond.ref_langues`

Référentiel des langues dans lesquelles un document est rédigé (ex. français,
latin, breton...). Utilisé dans l'écran d'enrichissement d'un exemplaire d'acte.

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

Aucune — table de référence autonome, interrogée directement (picker
générique `RefSinglePickerSmart`).

## Écarts vs `public.ref_langues`

Aucun — portée à l'identique.
