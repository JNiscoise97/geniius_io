# `rebond.ref_auteur_institutionnel`

Référentiel des auteurs institutionnels (institutions ayant produit un
document ou un acte — ex. une administration, un service d'état civil en
tant qu'auteur du registre). Table transversale, utilisée à la fois par le
patrimoine documentaire et l'état civil.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null | Code stable |
| `label` | text | not null | Libellé affiché |
| `categorie` | text | not null | Regroupement d'auteurs |
| `position` | integer | nullable | Ordre d'affichage manuel |
| `description` | text | nullable | Description longue |
| `note` | text | nullable | Note libre |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- Référencée par `rebond.unites_documentaires.producteur_ref` (`SET NULL`,
  FK corrigée dans ce lot).
- Référencée par `rebond.etat_civil_actes.auteur_institutionnel_ref`
  (`RESTRICT`, FK corrigée dans ce lot).

## Écarts vs `public.ref_auteur_institutionnel`

Aucun.
