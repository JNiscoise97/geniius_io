# `rebond.ref_plateforme_kind`

Référentiel des familles de plateformes numériques (ex. portail d'archives
départementales, réseau généalogique collaboratif, moteur de recherche
d'actes, bibliothèque numérique...). Catégorise chaque ligne de
`ref_plateformes`.

## Colonnes

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `code` | text | unique, not null | Code stable |
| `label` | text | not null | Libellé affiché |
| `categorie` | text | not null | Regroupement de familles |
| `note` | text | nullable | Note libre |
| `description` | text | nullable | Description longue |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Relations

- Référencée par `rebond.ref_plateformes.plateforme_kind_ref`
  (`ON DELETE SET NULL` : supprimer une famille détache les plateformes
  concernées plutôt que de bloquer la suppression — seule FK du lot à choisir
  ce comportement plutôt que `RESTRICT`, cf. note dans `ref_plateformes.md`).

## Écarts vs `public.ref_plateforme_kind`

Aucun — portée à l'identique.
