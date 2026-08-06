# `rebond.ref_institution_type`

Référentiel des types d'institution détentrices de patrimoine documentaire
(ex. Archives départementales, mairie, société savante, bibliothèque
municipale...). Utilisé pour catégoriser chaque ligne de `ref_institutions`.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null | Code stable, utilisé côté code (ex. filtres) |
| `label` | text | not null | Libellé affiché |
| `categorie` | text | not null | Regroupement de types (ex. "publique", "privée") |
| `note` | text | nullable | Note libre |
| `description` | text | nullable | Description longue |
| `position` | integer | nullable | Ordre d'affichage manuel |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- Référencée par `rebond.ref_institutions.type_institution_ref` (`RESTRICT` à la
  suppression : on ne peut pas supprimer un type encore utilisé par une
  institution).

## Écarts vs `public.ref_institution_type`

Aucun — portée à l'identique.

## Index

- `idx_ref_institution_type_code`, `idx_ref_institution_type_categorie`,
  `idx_ref_institution_type_position` — repris de `public`.
