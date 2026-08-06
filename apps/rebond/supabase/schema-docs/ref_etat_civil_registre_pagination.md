# `rebond.ref_etat_civil_registre_pagination`

Référentiel du système de repérage interne (pagination) d'un registre d'état
civil. Qualifie `etat_civil_registres.registre_pagination_ref`.

**Renommée depuis `public.ref_registre_pagination`** — voir
`ref_etat_civil_registre_fonction.md` pour le raisonnement du renommage.
Distincte de `ref_pagination_type` (déjà migrée), qui qualifie un
**exemplaire**, pas un registre — ne pas confondre.

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

Référencée par `rebond.etat_civil_registres.registre_pagination_ref`
(`SET NULL`).

## Trigger

`trg_ref_etat_civil_registre_pagination_updated_at` → réutilise
`public.set_updated_at()`.

## Écarts vs `public.ref_registre_pagination`

Renommage de la table. Index redondant supprimé.
