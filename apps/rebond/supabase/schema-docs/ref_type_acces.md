# `rebond.ref_type_acces`

Référentiel des types d'accès à un exemplaire (ex. URL en ligne, salle de
lecture, sur demande auprès du dépôt...).

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null, CHECK `~ '^[A-Z_]+$'` | Code stable (majuscules et underscores uniquement) |
| `label` | text | not null | Libellé affiché |
| `description` | text | nullable | Description longue |
| `note` | text | nullable | Note libre |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

Référencée par `rebond.ref_acces_numeriques.type_acces_id` (`RESTRICT`, FK
corrigée dans ce lot).

## Écarts vs `public.ref_type_acces`

- Contrainte `ref_type_acces_code_chk` simplifiée : l'originale vérifiait
  à la fois `code = upper(code)` et `code ~ '^[A-Z_]+$'` — la seconde
  implique strictement la première, la garder seule ne change aucun
  comportement de validation.
- Index `idx_ref_type_acces_code` supprimé, redondant avec l'index
  automatique de la contrainte unique sur `code`.
