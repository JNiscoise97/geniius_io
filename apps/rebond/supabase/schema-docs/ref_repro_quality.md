# `rebond.ref_repro_quality`

Référentiel de la qualité de reproduction (numérisation, photographie) d'un
exemplaire (ex. bonne qualité, floue, sous-exposée...). Utilisé dans l'écran
d'enrichissement d'un exemplaire d'acte.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null, `= upper(code)` | Code stable, forcé en majuscules |
| `label` | text | not null | Libellé affiché |
| `description` | text | nullable | Description longue |
| `note` | text | nullable | Note libre |
| `position` | integer | nullable | Ordre d'affichage manuel |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

Aucune — table de référence autonome, interrogée directement (picker
générique `RefSinglePickerSmart`).

## Écarts vs `public.ref_repro_quality`

- Contraintes renommées `ref_ec_repro_qualities_*` → `ref_repro_quality_*`
  (même résidu de renommage que `ref_physical_condition`).
- Index `idx_ref_repro_quality_code` **et** `idx_ref_ec_repro_qualities_code`
  supprimés : les deux étaient redondants avec l'index automatique de la
  contrainte unique sur `code` — et en plus dupliqués l'un de l'autre (créés
  à deux moments différents, jamais nettoyés).

Aucun changement de colonnes ni de comportement.
