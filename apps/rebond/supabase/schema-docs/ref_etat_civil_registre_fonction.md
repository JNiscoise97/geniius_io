# `rebond.ref_etat_civil_registre_fonction`

Référentiel du rôle administratif d'un registre d'état civil (ex. registre
principal, registre de secours, duplicata...). Qualifie
`etat_civil_registres.registre_fonction_ref`.

**Renommée depuis `public.ref_registre_fonction`** — préfixe `etat_civil`
ajouté : usage confirmé exclusif à `etat_civil_registres`
(`notaire_registres` n'a aucune colonne correspondante, vérifié).

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

Référencée par `rebond.etat_civil_registres.registre_fonction_ref`
(`SET NULL`, FK corrigée dans ce lot).

## Trigger

`trg_ref_etat_civil_registre_fonction_updated_at` → réutilise
`public.set_updated_at()` (nom différent de `public.fn_set_updated_at()`
utilisée ailleurs — probable incohérence de convention côté base d'origine,
même hypothèse de fonction générique schéma-agnostique).

## Écarts vs `public.ref_registre_fonction`

Renommage de la table. Index `ref_registre_fonction_code_idx` supprimé,
redondant avec l'index automatique de la contrainte unique sur `code`.
