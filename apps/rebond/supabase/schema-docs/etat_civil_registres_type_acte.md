# `rebond.etat_civil_registres_type_acte`

Table pivot : types d'acte contenus dans un registre (many-to-many — un
registre peut contenir plusieurs types d'actes, ex. un registre mixte
naissances + reconnaissances).

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `registre_id` | uuid | PK (composite), FK → `etat_civil_registres` | Registre |
| `type_acte_id` | uuid | PK (composite), FK → `ref_etat_civil_type_acte` | Type d'acte |
| `created_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `registre_id` → `rebond.etat_civil_registres.id`, `CASCADE`.
- `type_acte_id` → `rebond.ref_etat_civil_type_acte.id`, `RESTRICT`.

## Écarts vs `public.etat_civil_registres_type_acte`

Aucun changement de colonnes. Index `idx_ec_registres_type_acte_*` renommés
`idx_etat_civil_registres_type_acte_*` pour cohérence de préfixe.
