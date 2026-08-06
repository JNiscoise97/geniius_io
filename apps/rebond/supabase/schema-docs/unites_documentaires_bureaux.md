# `rebond.unites_documentaires_bureaux`

Pivot reliant une unité documentaire aux bureaux d'état civil qu'elle
concerne (many-to-many — ex. un répertoire peut couvrir plusieurs bureaux).

**Renommée depuis `public.ref_unites_documentaires_bureaux`** (même logique
que `unites_documentaires` : ce n'est pas un référentiel).

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `unite_id` | uuid | PK (composite), FK → `unites_documentaires` | Unité documentaire |
| `bureau_id` | uuid | PK (composite), FK → `etat_civil_bureaux` | Bureau concerné |
| `created_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `unite_id` → `rebond.unites_documentaires.id`, `CASCADE`.
- `bureau_id` → `rebond.etat_civil_bureaux.id`, `RESTRICT`.

Utilisée par la vue `rebond.v_exemplaires_pick` (CTE `agg_bureaux`) pour
lister les bureaux associés à un exemplaire.

## Écarts vs `public.ref_unites_documentaires_bureaux`

Renommage de la table uniquement.
