# `rebond.corpus`

Collections nommées d'unités documentaires (généalogique, patrimonial,
territorial, communauté).

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `nom` | text | not null | Nom du corpus |
| `description` | text | nullable | Description |
| `type` | text | not null, CHECK ∈ `{genealogique, patrimonial, territorial, communaute}` | Type de corpus |
| `created_by` | uuid | nullable, FK → `auth.users` | Créateur |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

`created_by` → `auth.users.id` — le schéma interne fixe de Supabase Auth,
jamais migré, référencé identiquement dans `public` et `rebond`.

Une table de liaison `corpus_unites` (corpus ↔ unités documentaires) existe
probablement dans `public` mais n'a pas été fournie dans ce lot — à traiter
séparément.

## Trigger

`trg_corpus_updated_at` → réutilise `public.fn_set_updated_at()`.

## Écarts vs `public.corpus`

Aucun.
