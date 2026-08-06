# `rebond.citations`

Pointeur reliant un exemplaire à une cible qu'il documente — ex. un acte
d'état civil (`target_type='ec_acte'`), une future entité généalogique, etc.
`target_type`/`target_id` est une association polymorphe volontaire (pas de
FK possible par construction, le type de la cible varie).

## Colonnes principales

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `exemplaire_id` | uuid | not null, FK → `exemplaires` | Exemplaire cité |
| `target_type` | text | not null, CHECK non vide | Type de la cible (polymorphe) |
| `target_id` | uuid | not null | Identifiant de la cible |
| `repro_quality_ref` | uuid | nullable, FK → `ref_repro_quality` | Qualité de reproduction |
| `is_missing`, `lacune`, `lacune_note` | — | nullable | Absence/lacune documentaire |
| `locating` | jsonb | not null, défaut `{}` | Localisation précise dans l'exemplaire |
| `marginalia` | jsonb | not null, défaut `{}` | Mentions marginales |
| `writing` | jsonb | not null, défaut `{}` | Métadonnées d'écriture |
| `marks` | text | nullable | Marques/annotations |
| `note` | text | nullable | Note libre |
| `sort_order` | integer | not null, défaut `0` | Ordre d'affichage |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `exemplaire_id` → `rebond.exemplaires.id` (ce lot), `RESTRICT`.
- `repro_quality_ref` → `rebond.ref_repro_quality.id` (déjà migrée), `RESTRICT`.

Plus aucune FK cross-schema sur cette table.

## Trigger

`trg_citations_updated_at` → réutilise `public.fn_set_updated_at()`.

## Écarts vs `public.citations`

Aucun.
