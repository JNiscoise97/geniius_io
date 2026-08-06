# `rebond.ref_depot_type`

Référentiel des types de dépôt (ex. salle de lecture physique, service de
numérisation en ligne, service d'archives intercommunal...). Catégorise chaque
ligne de `ref_depots`.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null | Code stable |
| `label` | text | not null | Libellé affiché |
| `is_online` | boolean | not null, défaut `false` | Dépôt purement numérique/distant |
| `note` | text | nullable | **Nouveau** — note libre |
| `description` | text | nullable | **Nouveau** — description longue |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | **Nouveau** — horodatage |

## Relations

- Référencée par `rebond.ref_depots.type_ref` (`RESTRICT` à la suppression).

## Écarts vs `public.ref_depot_type`

`public.ref_depot_type` n'avait que `id`, `code`, `label`, `is_online` — ni
`note`, `description`, `created_at`, ni `updated_at`. Les trois autres tables
"type/kind" migrées dans ce même lot (`ref_institution_type`, `ref_mode_acces`,
`ref_plateforme_kind`) ont toutes ces colonnes. Ajoutées ici pour homogénéité —
c'était la seule table du groupe à s'en écarter, sans raison métier apparente.

**Migration des données** : `note`/`description` sont initialisées à `null`,
`created_at`/`updated_at` à `now()` (l'ancienne table ne gardait pas cette
information, impossible de la reconstituer).
