# `rebond.ref_pagination_type`

Référentiel des types de pagination/numérotation d'un exemplaire (ex. folio
recto-verso, page simple, vue numérique...). Utilisé dans l'écran
d'enrichissement d'un exemplaire d'acte pour qualifier son système de repérage.

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

Aucune FK entrante ni sortante — table de référence autonome, interrogée
directement (pas de jointure) par l'écran d'enrichissement d'exemplaire.

## Écarts vs `public.ref_pagination_type`

Aucun — portée à l'identique. Design cohérent avec les autres tables "type"
déjà migrées (même forme que `ref_mode_acces`).
