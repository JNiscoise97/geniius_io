# `rebond.notariat_actes`

Actes notariés (ventes, successions, contrats de mariage, inventaires...) —
domaine du notariat, distinct de l'état civil.

**Renommée depuis `public.actes`.**

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `label` | text | not null | Libellé de l'acte |
| `type_operation` | text[] | nullable | Types d'opération (vente, succession...) |
| `origine_propriete` | text | nullable | Origine de propriété |
| `clauses` | text[] | nullable | Clauses de l'acte |
| `statut` | text | nullable | Statut libre |
| `tags` | text[] | nullable | Étiquettes libres |
| `origine_acte` | jsonb | nullable | Métadonnées structurées d'origine |
| `numero_acte` | text | nullable | Numéro de l'acte |
| `source` | text | nullable | Provenance |
| `notaire_annee_id` | uuid | nullable, FK interne à `rebond` | Résumé annuel du minutier du notaire |
| `unite_documentaire_id` | uuid | nullable, FK cross-schema | Rattachement au patrimoine documentaire |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `notaire_annee_id` → `rebond.notariat_notaire_annees.id`, `SET NULL`
  (colonne renommée depuis `notaire_registre_id`, FK repointée en interne à
  `rebond` dans ce lot — voir schema-docs/notariat_notaire_annees.md).
- `unite_documentaire_id` → cross-schema `public.ref_unites_documentaires.id`, `SET NULL`.

## Pourquoi ce renommage

Le nom générique `actes` entrait en collision directe avec
`etat_civil_actes` alors qu'il s'agit d'un domaine entièrement différent (le
notariat, pas l'état civil) — aucune des colonnes n'est spécifique à l'état
civil (vocabulaire notarial : opération, clauses, origine de propriété).
Suit la même logique de préfixe que `etat_civil_*`, appliquée au notariat.

## Écarts vs `public.actes`

- `created_at` : `timestamp without time zone` → `timestamp with time zone`.
  Seule table de toute la migration `rebond` à utiliser le type sans fuseau —
  incohérence corrigée pour matcher toutes les autres tables. Les valeurs
  existantes sont castées telles quelles lors de la migration (interprétées
  dans le fuseau de la session, comme le ferait Postgres par défaut).
- `updated_at` ajouté (absent de l'originale, alors que présent sur toutes
  les autres tables du schéma `rebond`).

Aucun trigger dans l'originale — aucun ajouté ici.
