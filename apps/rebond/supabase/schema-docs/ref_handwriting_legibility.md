# `rebond.ref_handwriting_legibility`

Référentiel des niveaux de lisibilité d'une écriture manuscrite (ex. très
lisible, difficilement lisible, illisible...). Utilisé dans l'écran
d'enrichissement d'un exemplaire d'acte.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null, `= upper(code)` | Code stable, forcé en majuscules |
| `label` | text | not null | Libellé affiché |
| `position` | numeric | **unique**, nullable | Ordre d'affichage — voir note |
| `note` | text | nullable | Note libre |
| `description` | text | nullable | Description longue |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

Aucune — table de référence autonome, interrogée directement (picker
générique `RefSinglePickerSmart`).

## Écarts vs `public.ref_handwriting_legibility`

Aucun — portée à l'identique.

## Note

Seule table du lot où `position` est à la fois en `numeric` (pas `integer`)
et soumise à une contrainte `unique`. Choix volontaire (déjà présent dans
`public`) : le type `numeric` permet d'insérer une position fractionnaire
(ex. `1.5` entre `1` et `2`) pour réordonner une ligne sans avoir à
renuméroter toute la table.
