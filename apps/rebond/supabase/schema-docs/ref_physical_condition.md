# `rebond.ref_physical_condition`

Référentiel de l'état physique du support d'un exemplaire (ex. bon état,
fragile, déchiré, taché...). Utilisé dans l'écran d'enrichissement d'un
exemplaire d'acte.

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

## Écarts vs `public.ref_physical_condition`

- Contraintes renommées `ref_ec_physical_conditions_*` → `ref_physical_condition_*`.
  La table s'appelait visiblement `ref_ec_physical_conditions` avant d'être
  renommée en `ref_physical_condition` — le renommage n'avait jamais été
  répercuté sur les noms de contraintes/index, ce qui rendait leur recherche
  confuse (chercher "ref_physical_condition" dans le nom des contraintes ne
  trouvait rien).
- Index `idx_ref_ec_physical_conditions_code` supprimé : `code` porte déjà une
  contrainte `unique`, qui crée automatiquement son propre index — l'index
  explicite était une pure redondance.

Aucun changement de colonnes ni de comportement.
