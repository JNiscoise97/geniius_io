# `rebond.unites_documentaires`

**La table centrale de l'application.** Les documents et sources
eux-mêmes — organisés en hiérarchie via `parent_ud_id` : une "source" de
haut niveau (ex. un registre) contient des "documents" enfants (ex. les
actes individuels qu'il contient).

**Renommée depuis `public.ref_unites_documentaires`.**

## Colonnes principales

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | uuid | PK, défaut `gen_random_uuid()` | Identifiant |
| `titre` | text | not null | Titre affiché |
| `titre_norm` | text | not null | Titre normalisé (minuscule, espaces réduits) — généré automatiquement |
| `couverture_label`, `couverture_sort_start`, `couverture_sort_end` | — | nullable | Couverture temporelle affichée et bornes de tri |
| `type_unite_ref` | uuid | nullable, FK → `ref_type_unite` | Type d'unité (pièce, dossier, registre...) |
| `statut_source` | text | not null, défaut `'a_qualifier'` | **Renommée** (ex `statut`) — voir section dédiée |
| `statut_document` | text | not null, défaut `'a_transcrire'` | **Renommée** (ex `workflow_statut`) — voir section dédiée |
| `niveau_fiabilite` | text | nullable, CHECK ∈ `{haute, moyenne, basse}` | Fiabilité de la source |
| `producteur_ref` | uuid | nullable, FK cross-schema | Institution productrice |
| `parent_ud_id` | uuid | nullable, FK → elle-même | Unité parente |
| `metadonnees` | jsonb | nullable | Métadonnées libres |
| `role_document_ref` | uuid | nullable, FK → `ref_role_document` | Rôle du document |
| `langue_ref` | uuid | nullable, FK → `ref_langues` | Langue |
| `serie_ref` | uuid | not null, FK → `ref_series_documentaires` | Série documentaire |
| `created_at` / `updated_at` | timestamptz | not null, défaut `now()` | Horodatage |

## Deux colonnes de statut — pourquoi, et pourquoi renommées

`statut_source` et `statut_document` ne sont pas un doublon accidentel :
chacune n'a de sens que pour un rôle que peut jouer la ligne dans la
hiérarchie — `statut_source` (actif/archivé/incomplet/à_qualifier) qualifie
la complétude du catalogage quand la ligne est une **source**
(`parent_ud_id is null`) ; `statut_document` (à_transcrire/décrit/en_cours/
transcrit/annoté/en_attente) qualifie l'étape du pipeline de transcription
quand la ligne est un **document** (`parent_ud_id is not null`). Rien en
base n'impose ce lien (pas de CHECK reliant les deux), c'est une convention
d'usage côté application.

Anciennement `statut`/`workflow_statut` — noms renommés pour exposer
explicitement à qui chaque colonne s'adresse, en miroir des types front-end
`SourceStatut`/`DocStatut` déjà utilisés dans le code. Aucun changement de
valeurs autorisées ni de comportement.

## Génération automatique de `titre_norm`

Trigger `trg_unites_documentaires_titre_norm` (`BEFORE INSERT OR UPDATE OF
titre`) → réutilise `public.fn_set_unite_titre_norm()` telle quelle
(fonction pure, ne référence aucune table — `new.titre_norm :=
regexp_replace(lower(trim(new.titre)), '\s+', ' ', 'g')`). Alimente la
contrainte unique anti-doublon ci-dessous.

## Contrainte d'unicité

Index unique sur `(type_unite_ref, titre_norm, serie_ref,
coalesce(nullif(trim(couverture_label), ''), '∅'))` — empêche les doublons
de titre au sein d'un même type/série/couverture, en traitant une couverture
vide comme une valeur distincte explicite (`'∅'`) plutôt que `NULL` (qui ne
serait jamais égal à lui-même dans un index unique).

## Relations

- `parent_ud_id` → elle-même, `SET NULL`.
- `role_document_ref`, `serie_ref`, `type_unite_ref`, `langue_ref` → déjà
  dans `rebond` (migrées précédemment).
- `producteur_ref` → cross-schema `public.ref_auteur_institutionnel` (pas
  encore migrée).
- Référencée par `rebond.exemplaires.unite_documentaire_id` (`CASCADE`),
  et par `rebond.etat_civil_registres`/`etat_civil_repertoires`/
  `notariat_actes.unite_documentaire_id` (`SET NULL`, FK corrigées dans ce
  même lot pour ne plus pointer vers `public.*`, voir
  `20260806100047_repoint_fks_previous_batches.sql`).

## Écarts vs `public.ref_unites_documentaires`

- Renommage de la table et des deux colonnes de statut (voir ci-dessus).
- Noms d'index alignés sur le nouveau nom de table (`idx_ud_*` →
  `idx_unites_documentaires_*`, etc.). Aucun changement de colonnes ni de
  logique de contrainte au-delà du renommage.

## Nettoyage du 2026-08-06 : `identifiant_interne` et `description` supprimées

Ces deux colonnes existaient en doublon avec `rebond.exemplaires`, mais
seul le côté exemplaire était réellement écrit par le code (`identifiant_interne`
n'avait jamais de valeur côté UD — 0 ligne en prod ; `description` non plus
côté UD, malgré 2 lignes de seed/démo perdues intentionnellement). Un
document a un titre/type/rôle intellectuels ; l'identifiant interne et la
description physique varient par copie, donc appartiennent à l'exemplaire,
pas à l'unité documentaire. Voir `20260806100102_drop_dead_duplicate_columns.sql`.
