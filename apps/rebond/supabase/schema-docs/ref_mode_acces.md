# `rebond.ref_mode_acces`

Référentiel des modes d'accès à un dépôt (ex. accès libre, sur rendez-vous,
accès restreint aux chercheurs, accès en ligne uniquement...).

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

- Référencée par `rebond.ref_depots.mode_acces_ref` (`RESTRICT` à la
  suppression, rendu explicite — voir doc `ref_depots.md`).

## Écarts vs `public.ref_mode_acces`

Aucun — portée à l'identique.
