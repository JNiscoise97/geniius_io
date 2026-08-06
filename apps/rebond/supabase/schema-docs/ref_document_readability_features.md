# `rebond.ref_document_readability_features`

Référentiel des caractéristiques de lisibilité d'un document (ex. rature,
pâleur de l'encre, tache, pliure gênante...), chacune qualifiée du type de
document auquel elle s'applique via `applicable_to`. Utilisé dans l'écran
d'enrichissement d'un exemplaire d'acte (sélection multiple).

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null | Code stable |
| `label` | text | not null | Libellé affiché |
| `categorie` | text | not null | Regroupement de caractéristiques |
| `note` | text | nullable | Note libre |
| `description` | text | nullable | Description longue |
| `applicable_to` | text | not null, défaut `'BOTH'`, CHECK ∈ `{BOTH, MANUSCRITE, IMPRIMEE}` | Type de document concerné |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

Aucune — table de référence autonome, interrogée directement (picker
générique `RefSinglePickerSmart`, en mode multi-sélection, filtré côté
application selon `applicable_to`).

## Écarts vs `public.ref_document_readability_features`

Index `idx_ref_document_readability_features_code` supprimé : `code` porte
déjà une contrainte `unique`, qui crée automatiquement son propre index —
l'index explicite était une pure redondance. Aucun changement de colonnes.
