# `rebond.etat_civil_repertoires`

Répertoires de dépouillement d'un bureau d'état civil — tables décennales,
annuelles ou générales, alphabétiques ou chronologiques, indexant les actes
d'une période donnée.

**Renommée depuis `public.ec_tables`.**

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `bureau_id` | uuid | nullable, FK → `etat_civil_bureaux` | Bureau concerné |
| `unite_documentaire_id` | uuid | nullable, FK cross-schema | Rattachement au patrimoine documentaire |
| `periodicite` | text | not null, CHECK ∈ `{annuelle, decennale, generale}` | Portée temporelle |
| `classement` | text | nullable, CHECK ∈ `{alphabetique, chronologique}` | Mode de classement |
| `annee_debut` | integer | not null | Début de la période couverte |
| `annee_fin` | integer | nullable, CHECK `>= annee_debut` | Fin de la période couverte |
| `type_acte_ids` | uuid[] | not null, défaut `{}` | Types d'acte indexés (voir note) |
| `label` | text | not null | Libellé (fourni par l'app, pas de génération automatique) |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `bureau_id` → `rebond.etat_civil_bureaux.id`, `SET NULL`.
- `unite_documentaire_id` → cross-schema `public.ref_unites_documentaires.id`, `SET NULL`.

## Pourquoi ce renommage

`ec_tables` mélangeait un préfixe abrégé incohérent avec le reste du domaine
(`etat_civil_*`) **et** utilisait le mot "tables", ambigu dans un contexte de
base de données (confusion possible avec "table SQL"). "Répertoire" est le
terme archivistique standard pour ce type d'index — sans ambiguïté.

## Écarts vs `public.ec_tables`

Aucun changement de colonnes. Index renommés pour cohérence
(`ec_tables_*_idx` → `idx_etat_civil_repertoires_*`).

## Note (non corrigée)

`type_acte_ids` est un tableau de uuid, sans intégrité référentielle possible
en Postgres (un tableau ne peut pas porter de contrainte FK) — rien
n'empêche qu'il contienne un id de type d'acte inexistant ou supprimé. Non
corrigé : normaliser en table pivot serait un changement de modèle plus
large, hors périmètre de ce lot.
