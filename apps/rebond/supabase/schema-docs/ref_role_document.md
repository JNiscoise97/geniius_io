# `rebond.ref_role_document`

Référentiel des rôles qu'un document peut jouer dans la chaîne de
connaissance (ex. acte primaire, instrument de recherche, registre compilé).
Qualifie `ref_unites_documentaires.role_document_ref`.

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

Référencée par `rebond.unites_documentaires.role_document_ref` (renommée
depuis `public.ref_unites_documentaires`, voir schema-docs/unites_documentaires.md)
— y compris via une jointure embarquée PostgREST
(`ref_role_document!role_document_ref(...)`) dans `patrimoine.service.ts`,
qui s'exécute désormais entièrement contre le schéma `rebond`.

## Trigger

`trg_ref_role_document_updated_at` (`BEFORE UPDATE`) → réutilise
`public.fn_set_updated_at()` telle quelle (non dupliquée — hypothèse de
fonction générique schéma-agnostique, non vérifiée sur son code source).

## Écarts vs `public.ref_role_document`

Aucun.
