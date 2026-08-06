# `rebond.corpus_unites`

Table pivot reliant un corpus aux unités documentaires qu'il contient
(many-to-many).

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `corpus_id` | uuid | PK (composite), FK → `corpus` | Corpus |
| `unite_documentaire_id` | uuid | PK (composite), FK → `unites_documentaires` | Unité documentaire incluse |
| `ajout_at` | timestamptz | not null, défaut `now()` | Date d'ajout au corpus |

## Relations

- `corpus_id` → `rebond.corpus.id`, `CASCADE`.
- `unite_documentaire_id` → `rebond.unites_documentaires.id`, `CASCADE`.

Les deux FK sont désormais entièrement internes à `rebond` — plus aucune
référence cross-schema sur cette table.

## Écarts vs `public.corpus_unites`

Aucun.
