# `rebond.ref_depots`

Dépôts rattachés à une institution — une salle de lecture physique, un service
de numérisation en ligne, un guichet unique... Une institution peut avoir
plusieurs dépôts (ex. plusieurs sites physiques).

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `institution_id` | uuid | not null, FK → `ref_institutions` | Institution de rattachement |
| `nom` | text | nullable | Nom du dépôt |
| `adresse` / `ville` / `code_postal` / `pays` | text | nullable | Localisation du dépôt, texte libre |
| `note` | text | nullable | Note libre |
| `conditions_communication` | text | nullable | Modalités de consultation |
| `modalites_repro` | text | nullable | Modalités de reproduction (photocopie, photo...) |
| `delais_communication` | text | nullable | Délais légaux/pratiques de communicabilité |
| `type_ref` | uuid | nullable, FK → `ref_depot_type` | Type de dépôt |
| `meme_adresse_institution` | boolean | not null, défaut `true` | L'adresse du dépôt = celle de l'institution (voir note dans `ref_institutions.md`) |
| `mode_acces_ref` | uuid | nullable, FK → `ref_mode_acces` | Mode d'accès |
| `plateforme_ref` | uuid | nullable, FK → `ref_plateformes` | Plateforme numérique associée |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `institution_id` → `rebond.ref_institutions.id`, `RESTRICT`.
- `type_ref` → `rebond.ref_depot_type.id`, `RESTRICT`.
- `mode_acces_ref` → `rebond.ref_mode_acces.id`, `RESTRICT` (explicité, voir écarts).
- `plateforme_ref` → `rebond.ref_plateformes.id`, `RESTRICT` (explicité, voir écarts).

## Contraintes d'unicité

- Index unique insensible à la casse sur `(institution_id, lower(nom))` —
  empêche deux dépôts de même nom (peu importe la casse) au sein d'une même
  institution.

## Écarts vs `public.ref_depots`

1. **Contrainte `unique (institution_id, nom)` supprimée.** `public.ref_depots`
   avait à la fois cette contrainte (sensible à la casse) et l'index unique
   sur `(institution_id, lower(nom))` (insensible à la casse). Le second
   rejette systématiquement tout ce que le premier rejetterait, en plus des
   doublons de casse — la contrainte sensible à la casse était donc
   redondante, jamais celle qui bloquait réellement quoi que ce soit.
2. `ON DELETE RESTRICT` rendu **explicite** sur `mode_acces_ref` et
   `plateforme_ref` (non déclaré dans `public`, comportement par défaut
   identique — juste documenté, pour cohérence avec `institution_id` et
   `type_ref` qui, eux, le déclaraient déjà).

## Index

- `idx_ref_depots_institution_id` — repris de `public`.
