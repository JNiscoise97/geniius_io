# `rebond.v_sources`

Vue agrégée alimentant l'onglet "Sources" : chaque unité documentaire de
premier niveau (`parent_ud_id is null`), enrichie de son meilleur exemplaire
(dépôt, institution, accès numérique) et des statistiques de transcription
de ses documents enfants.

## Composition

- `best_url` : meilleure URL d'accès numérique par exemplaire (la plus
  récente parmi celles non vides), depuis `ref_acces_numeriques`.
- `copies_count` : nombre d'exemplaires connus par unité documentaire.
- `docs_stats` : comptages (total, transcrits, en cours, à traiter) des
  documents enfants, par statut de transcription (`statut_document`).
- `best_exemplaire` : exemplaire "représentatif" d'une source (numérique
  priorisé sur physique, puis le plus ancien), avec dépôt/institution.

## Colonnes de sortie notables

| Colonne | Origine | Note |
|---|---|---|
| `statut` | `unites_documentaires.statut_source` | Ré-aliasée pour garder le même nom en sortie |
| `workflow_statut` | `unites_documentaires.statut_document` | Idem |
| `conditions_communication` | — | Toujours `null` (voir note) |
| `acces` | calculé | `en_ligne` / `physique` / `numerique` selon le meilleur exemplaire |

## Dépendances

Toutes les tables sous-jacentes sont dans `rebond`, sauf `ref_natures`
(pas encore migrée) — jointure cross-schema vers `public.ref_natures`.

## Écarts vs `public.v_sources`

Adaptée aux tables/colonnes renommées (`unites_documentaires`, `exemplaires`,
`statut_source`/`statut_document` ré-aliasés vers `statut`/`workflow_statut`
en sortie). Aucun changement de logique ni de colonnes de sortie.

## Correction appliquée

`conditions_communication` était codée en dur à `null` dans `public.v_sources`
(`ref_depots.conditions_communication` existe mais n'était jamais branchée —
oubli de l'originale). Corrigé sur demande explicite : provient maintenant de
`ref_depots.conditions_communication` via `best_exemplaire`. Changement de
comportement assumé (pas un simple renommage) — la colonne peut désormais
renvoyer une vraie valeur au lieu de toujours `null`.
