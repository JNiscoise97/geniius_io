# `rebond.unites_documentaires_types_actes`

Pivot reliant une unité documentaire aux types d'acte qu'elle concerne
(many-to-many).

**Renommée depuis `public.ref_unites_documentaires_types_actes`** (même
logique que `unites_documentaires`).

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `unite_id` | uuid | PK (composite), FK → `unites_documentaires` | Unité documentaire |
| `type_acte_id` | uuid | PK (composite), FK → `ref_etat_civil_type_acte` | Type d'acte concerné |
| `created_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `unite_id` → `rebond.unites_documentaires.id`, `CASCADE`.
- `type_acte_id` → `rebond.ref_etat_civil_type_acte.id`, `RESTRICT`.

Utilisée par la vue `rebond.v_exemplaires_pick` (CTE `agg_types_actes`).

## Écarts vs `public.ref_unites_documentaires_types_actes`

Renommage de la table, et adaptation de la FK vers
`ref_etat_civil_type_acte` (elle-même renommée depuis `ref_ec_type_acte`).
