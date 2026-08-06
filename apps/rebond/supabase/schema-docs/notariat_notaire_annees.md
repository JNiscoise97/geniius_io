# `rebond.notariat_notaire_annees`

Résumé annuel du nombre d'actes d'un notaire (par année de minutier) :
combien d'actes, si l'année est complètement dépouillée, et la plage de
numéros d'actes couverte.

**Renommée depuis `public.notaire_registres`.**

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `notaire_id` | uuid | not null, FK cross-schema | Notaire concerné |
| `annee` | integer | not null, CHECK `> 1500 and < 2100` | Année du minutier |
| `nombre_actes` | integer | not null, CHECK `>= 0` | Nombre d'actes recensés pour cette année |
| `complet` | boolean | not null, défaut `false` | Année entièrement dépouillée ou non |
| `numero_acte_min` / `numero_acte_max` | integer | nullable | Plage de numéros d'actes couverte |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `notaire_id` → `rebond.notariat_notaires.id`, `CASCADE` (FK repointée en
  interne à `rebond` dans le lot Transcription/Notaires).
- Référencée par `rebond.notariat_actes.notaire_annee_id` (`SET NULL`, colonne
  renommée et FK repointée dans ce lot).
- Contrainte `unique (notaire_id, annee)` : un seul résumé par notaire et par
  année.

## Pourquoi ce renommage

Le nom d'origine `notaire_registres` entrait en collision de sens avec la
notion de "registre" (minutier) alors que la table ne contient qu'un résumé
par année (nombre d'actes, complétude, bornes de numérotation) — pas le
registre en tant qu'objet. Les contraintes de la table d'origine étaient
d'ailleurs déjà nommées `notaire_annees_*`, incohérentes avec le nom de la
table elle-même. Renommage validé avec l'utilisateur, suit le préfixe
`notariat_` comme `notariat_actes`.

## Écarts vs `public.notaire_registres`

Aucun écart de colonnes. Contraintes renommées pour matcher le nouveau nom de
table (`notariat_notaire_annees_*` au lieu de `notaire_annees_*`).
