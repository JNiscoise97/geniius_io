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
| `conditions_communication` | `ref_depots.conditions_communication` | Voir note plus bas |
| `acces` | calculé | `en_ligne` / `physique` / `numerique` selon le meilleur exemplaire |
| `vue_range` | `exemplaires.localisation_interne` | Plage de vues du meilleur exemplaire (ex. `1-250` pour un registre numérisé). Sert de dénominateur pour situer une table/un acte dans l'étendue totale du registre (carte "Documents à décrire", récapitulatif du wizard). |

## Dépendances

Toutes les tables sous-jacentes sont dans `rebond` — plus aucune trace de
cross-schema depuis la migration de `ref_natures`/`ref_supports`.

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
