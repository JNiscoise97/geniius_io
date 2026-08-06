# `rebond.ref_institutions`

Institutions détentrices de patrimoine documentaire — Archives départementales,
mairies, sociétés savantes, bibliothèques... Chaque institution peut avoir
plusieurs dépôts (`rebond.ref_depots`) et peut être associée à une plateforme
numérique (`rebond.ref_plateformes`) si son accès passe principalement par un
portail en ligne.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `nom` | text | unique, not null | Nom complet de l'institution |
| `sigle` | text | nullable | Sigle/acronyme |
| `pays` / `region` / `departement` / `commune` | text | nullable | Localisation, **en texte libre** (voir note) |
| `site_web` | text | nullable | URL du site institutionnel |
| `note` | text | nullable | Note libre |
| `type_institution_ref` | uuid | not null, FK → `ref_institution_type` | Type d'institution |
| `plateforme_ref` | uuid | nullable, FK → `ref_plateformes` | Plateforme numérique associée |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- `type_institution_ref` → `rebond.ref_institution_type.id`, `RESTRICT`.
- `plateforme_ref` → `rebond.ref_plateformes.id`, `RESTRICT` (explicité, voir
  écarts ci-dessous).
- Référencée par `rebond.ref_depots.institution_id`, `RESTRICT` : une
  institution avec des dépôts ne peut pas être supprimée.

## Écarts vs `public.ref_institutions`

`ON DELETE RESTRICT` rendu **explicite** sur `plateforme_ref` (dans `public`,
la contrainte ne déclarait rien, ce qui revient au même comportement par
défaut — juste non documenté). Aucun changement de colonnes.

## Notes / points d'attention (non corrigés dans ce lot)

- **Localisation en texte libre** : `pays`/`region`/`departement`/`commune` ne
  sont adossés à aucune table de référence géographique. Pragmatique pour un
  premier jet, mais à reconsidérer si la fonctionnalité "Cartographie" du
  dashboard doit un jour relier des lieux entre eux (ex. rapprocher une
  institution et un lieu cité dans un acte).
- **Pas d'adresse postale structurée** sur cette table (ni `adresse` ni
  `code_postal`), alors que `rebond.ref_depots.meme_adresse_institution`
  suppose implicitement qu'une telle adresse existe côté institution. Pour
  l'instant ce flag ne peut donc être que partiellement significatif (au mieux
  "même commune/pays", jamais "même adresse exacte").
