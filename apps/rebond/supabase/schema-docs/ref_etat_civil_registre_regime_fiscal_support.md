# `rebond.ref_etat_civil_registre_regime_fiscal_support`

Référentiel du régime fiscal et probatoire du support d'un registre d'état
civil (timbré / non timbré / mixte). Qualifie
`etat_civil_registres.registre_regime_fiscal_support_ref`.

**Renommée depuis `public.ref_registre_regime_fiscal_support`** — voir
`ref_etat_civil_registre_fonction.md` pour le raisonnement du renommage.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null | Code stable (ex. `TIMBRE`, `NON_TIMBRE`, `MIXTE`) |
| `label` | text | not null | Libellé affiché |
| `note` | text | nullable | Note libre |
| `description` | text | nullable | Description longue |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

Référencée par `rebond.etat_civil_registres.registre_regime_fiscal_support_ref`
(`SET NULL`), et par `rebond.create_registre_label()` (utilisée pour préfixer
le libellé auto-généré d'un registre : "Registre timbré des...").

## Trigger

`trg_ref_etat_civil_registre_regime_fiscal_support_updated_at` → réutilise
`public.set_updated_at()`.

## Écarts vs `public.ref_registre_regime_fiscal_support`

Renommage de la table. Index redondant supprimé.
`rebond.create_registre_label()` mise à jour pour l'utiliser (voir
`20260806100077_update_function_create_registre_label_regime_fiscal.sql`),
levant la dernière trace de cross-schema de cette fonction.
