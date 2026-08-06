# `rebond.ref_type_unite`

Référentiel des types d'unité documentaire (pièce, dossier, registre...).
Qualifie `ref_unites_documentaires.type_unite_ref`.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null | Code stable |
| `label` | text | not null | Libellé affiché |
| `note` | text | nullable | Note libre |
| `description` | text | nullable | Description longue |
| `position` | integer | not null, défaut `9999` | Ordre d'affichage (valeur haute par défaut = trie les non positionnés en dernier) |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

Référencée par `public.ref_unites_documentaires.type_unite_ref` (table pas
encore migrée) — par valeur d'id scalaire, aucune jointure embarquée dans le
code actuel.

## Écarts vs `public.ref_type_unite`

Index `idx_ref_type_unite_code` supprimé : redondant avec l'index
automatique de la contrainte unique sur `code`.
