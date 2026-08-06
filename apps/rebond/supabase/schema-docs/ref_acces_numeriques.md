# `rebond.ref_acces_numeriques`

Accès numérique (URL) à un exemplaire, éventuellement via une plateforme
identifiée (ex. lien direct vers un acte numérisé sur un portail d'archives).
Table entité (pas un pur référentiel), écrite activement par l'assistant de
référencement.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `exemplaire_id` | uuid | not null, FK cross-schema | Exemplaire concerné |
| `plateforme_id` | uuid | nullable, FK → `ref_plateformes` | Plateforme d'accès |
| `type_acces_id` | uuid | not null, FK cross-schema | Type d'accès |
| `url_base` | text | not null | URL d'accès |
| `schema_deep_link` | text | nullable | Gabarit de lien profond |
| `permalink` | text | nullable | Permalien résolu |
| `restrictions` | text | nullable | Restrictions d'accès |
| `last_checked_at` | timestamptz | nullable | Dernière vérification du lien |
| `note` | text | nullable | Note libre |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `plateforme_id` → **`rebond.ref_plateformes.id`** (déjà migrée, même schéma), `SET NULL`.
- `exemplaire_id` → cross-schema `public.ref_exemplaires.id` (pas encore migrée), `RESTRICT`.
- `type_acces_id` → cross-schema `public.ref_type_acces.id` (pas encore migrée), `RESTRICT`.

## Contrainte d'unicité

Index unique sur `(exemplaire_id, plateforme_id, type_acces_id)`.

**Note** : Postgres traite chaque valeur `NULL` comme distincte dans un index
unique — donc quand `plateforme_id` est `null`, plusieurs lignes
`(exemplaire_id, null, type_acces_id)` identiques par ailleurs peuvent
coexister sans violer la contrainte. Comportement Postgres standard, peut-être
volontaire (accès "sans plateforme précise" traité à part) — documenté sans
correction.

## Écarts vs `public.ref_acces_numeriques`

Aucun changement de colonnes.
