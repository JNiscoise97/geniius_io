# `rebond.ref_plateformes`

Plateformes numériques concrètes utilisées comme source ou canal d'accès aux
documents (ex. Geneanet, Filae, le portail en ligne d'un service d'archives).
Contrairement aux autres tables `ref_*` de ce lot, ce n'est pas un pur
référentiel de vocabulaire : chaque ligne est une plateforme réelle et
identifiable, avec ses propres attributs (site web, exigence d'authentification...).

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null | Code stable |
| `label` | text | not null | Nom affiché |
| `site_web` | text | nullable | URL du site |
| `plateforme_kind_ref` | uuid | nullable, FK → `ref_plateforme_kind` | Famille de plateforme |
| `auth_required` | boolean | not null, défaut `false` | Nécessite un compte/connexion |
| `robots_policy_note` | text | nullable | Note sur la politique de scraping/robots.txt du site |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `plateforme_kind_ref` → `rebond.ref_plateforme_kind.id`, `ON DELETE SET NULL`.
- Référencée par `rebond.ref_institutions.plateforme_ref` et
  `rebond.ref_depots.plateforme_ref` (`RESTRICT` à la suppression sur les deux).

## Écarts vs `public.ref_plateformes`

Aucun — portée à l'identique.

## Index

- `idx_ref_plateformes_plateforme_kind_ref`, `idx_ref_plateformes_auth_required`
  — repris de `public`.
