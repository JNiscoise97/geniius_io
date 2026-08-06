# `rebond.notariat_notaires`

Notaires (identité, étude, lieu d'exercice).

**Renommée depuis `public.notaires`.**

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `nom` | text | not null | Nom du notaire |
| `prenom` | text | nullable | Prénom |
| `titre` | text | nullable | Titre |
| `etude` | text | nullable | Étude notariale |
| `lieu_exercice` | text | nullable | Lieu d'exercice |
| `notes` | text | nullable | Note libre |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

Référencée par `rebond.notariat_notaire_annees.notaire_id` (`CASCADE`, FK
repointée dans ce lot).

## Pourquoi ce renommage

Préfixe `notariat_` ajouté pour rester cohérent avec `notariat_actes` /
`notariat_notaire_annees` — même domaine, même convention.

## Écarts vs `public.notaires`

- `created_at` : `timestamp without time zone` → `timestamp with time zone`,
  même correction que `notariat_actes`.
- `updated_at` ajouté (absent de l'originale).
