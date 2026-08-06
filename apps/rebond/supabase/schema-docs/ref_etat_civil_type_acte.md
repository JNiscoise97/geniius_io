# `rebond.ref_etat_civil_type_acte`

Référentiel des types d'acte d'état civil (naissance, mariage, décès,
reconnaissance, affranchissement, jugement...). Utilisé pour qualifier le
contenu d'un registre (`etat_civil_registres_type_acte`) et d'un acte
individuel (`etat_civil_actes.type_acte_ref`).

**Renommée depuis `public.ref_ec_type_acte`.**

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null | Code stable (ex. `NAISSANCE`) |
| `label` | text | not null | Libellé au singulier |
| `label_pluriel` | text | nullable | Libellé au pluriel (ex. "naissances") |
| `description` | text | nullable | Description longue |
| `note` | text | nullable | Note libre |
| `color` | text | not null, défaut `'gray'` | Couleur d'affichage |
| `position` | integer | nullable, défaut `0`, `>= 0` | Ordre d'affichage |
| `categorie` | text | not null, défaut `'autre'` | Regroupement de types |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | **Nouveau** — horodatage |

## Relations

- Référencée par `rebond.etat_civil_registres_type_acte.type_acte_id` (`RESTRICT`).
- Référencée par `rebond.etat_civil_actes.type_acte_ref` (`RESTRICT`).

## Écarts vs `public.ref_ec_type_acte`

- **Renommage** : préfixe `ec_` uniformisé en `etat_civil_` (voir décision
  globale du lot).
- `created_at`/`updated_at` ajoutés (absents de l'originale). Initialisés à
  `now()` lors de la migration, faute de mieux.
- Index `idx_ref_ec_type_acte_color` renommé `idx_ref_etat_civil_type_acte_color`.

## Impact du renommage sur l'audit

`fn_map_table_to_entity_kind` (utilisée par le trigger d'audit générique) ne
référence pas cette table — elle tombait déjà dans le cas `else 'autre'`
avant et après renommage. Aucune mise à jour nécessaire.
