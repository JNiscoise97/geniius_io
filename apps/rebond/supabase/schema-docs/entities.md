# `rebond.entities` / `rebond.entity_links` / `rebond.entity_merge_dismissals`

Registre canonique de personnes et de lieux, **distinct** de
`rebond.transcription_entities` (qui reste local à une version de
transcription précise, "P2" n'a de sens que dans UN acte). Une entité
canonique regroupe tout ce qu'on sait d'une même personne/lieu réel à
travers plusieurs actes — c'est le module Entités (`apps/rebond/src/features/entites`)
qui l'affiche, le module Réconciliation (`apps/rebond/src/features/reconciliation`)
qui fusionne les doublons.

Construit le 2026-08-08, sur demande explicite de l'utilisateur après une
session de conception dédiée à la cohérence entre modules (voir mémoire
agent `project_dashboard_modules_scoping` pour le détail de la discussion).

## Pourquoi ce registre existe (et pourquoi il manquait)

Avant ce lot, une extraction produisait des entités locales
(`transcription_entities`) scopées à une version — aucune table ne
rapprochait le "Charbonné" de l'acte de naissance de sa fille du
"Charbonné" de son propre acte de mariage. Le module Extraction exclut
volontairement ce rapprochement de son périmètre (voir
`schema-docs/transcription_assertions.md`, "séparation document / arbre
généalogique"). Ce lot comble ce trou : `entities` est le registre où ces
identités locales convergent.

## Répartition des responsabilités (à ne pas dupliquer ailleurs)

Principe posé avec l'utilisateur : **un seul module écrit une catégorie de
donnée, les autres ne font que la lire dans leur propre contexte.**

| Module | Rôle | Ne fait PAS |
|---|---|---|
| Extraction | Valide/rejette une assertion, un acte à la fois | Ne compare jamais deux documents entre eux |
| **Entités** | Registre canonique en lecture — fiche par entité (faits validés agrégés, relations directes en liste plate, actes où elle apparaît) | Pas de moteur de fusion à lui — un doublon repéré renvoie vers Réconciliation |
| **Réconciliation** | Seul propriétaire de la fusion d'identité — détection de candidats, décision humaine | N'affiche pas de fiche finale (renvoie vers Entités) |
| Qualité & validation (futur) | Incohérences *entre documents* sur une entité déjà canonique | Ne s'occupe pas des doublons (c'est Réconciliation) ni de la fidélité au texte source (c'est Extraction) |
| Graphe historique (futur) | Exploration multi-entités, hypothèses relationnelles | La fiche Entités reste une liste plate, jamais un canvas interactif |
| Cartographie (futur) | Couche géographique, place les entités "lieu" sur une carte | Ne redéfinit pas un lieu comme entité — lit `entities` |
| Restitutions (futur) | Génère des LIVRABLES (arbre, chronologie imprimable) à partir des autres modules | N'est pas une source de donnée primaire |

## `entities`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | PK |
| `entity_type` | text | `person` \| `place` uniquement. **Volontairement pas `document`/`event`** : `document` reste dans Patrimoine documentaire (déjà son propre registre, `unites_documentaires`) ; `event` reste local à un acte (un "E1 = Présentation de l'enfant" d'un acte n'a pas de pendant à rapprocher dans un autre acte). Pas de `bien`/`organisation` non plus : Extraction ne produit aujourd'hui que person/document/place/event (actes d'état civil testés), pas encore de type pour des actes fonciers/notariés — ne pas anticiper ce vocabulaire avant qu'Extraction en ait réellement besoin (même doctrine que le référentiel de prédicats). |
| `label` | text | Libellé affiché, copié depuis l'entité locale au moment de la promotion. Renommable manuellement depuis la fiche (2026-08-10) — ne modifie que cette ligne, jamais l'entité locale d'origine (`transcription_entities`, qui reste fidèle au texte source de l'acte). |
| `merged_into_id` | uuid | Nullable. Si non-null, cette entité a été fusionnée dans une autre (voir Réconciliation) — conservée (pas supprimée) pour qu'une référence existante reste résoluble, mais exclue des listes actives (`is('merged_into_id', null)`). |
| `created_at` / `updated_at` | timestamptz | `updated_at` maintenu par `trg_entities_touch`. |

## `entity_links`

Association entité locale (`transcription_entities`, un acte précis) →
entité canonique (`entities`). `transcription_entity_id` est **unique** :
une entité locale n'est promue qu'une fois, elle garde toujours le même
`entity_id` (même si celui-ci finit fusionné ailleurs).

## `entity_merge_dismissals`

Une paire `(entity_type, normalized_label)` que l'utilisateur a
explicitement confirmée comme n'étant **pas** un doublon dans
Réconciliation — empêche de la re-suggérer. Dismissal au niveau du
**groupe** (même libellé normalisé), pas par paire précise d'entités : plus
simple, cohérent avec la façon dont Réconciliation présente les candidats
(par groupe).

## Promotion automatique (comment `entities` se peuple)

Aucune action manuelle : dans `ExtractionPage.tsx`, `handleSetStatus`
appelle `ensureEntitiesPromoted([subjectEntityId, objectEntityId])`
(`entites.service.ts`) dès qu'une assertion passe à `validated`. Idempotent
— ne crée une entité canonique que si l'entité locale concernée (de type
person/place) n'en a pas déjà une. Best-effort : une erreur de promotion ne
bloque jamais la validation de l'assertion elle-même.

**Ne consomme que les assertions validées** — cohérent avec la doctrine
"l'IA n'est jamais une autorité, l'humain valide" déjà appliquée dans
Extraction. Une assertion `pending`/`rejected` ne fait jamais exister ni
n'alimente une entité canonique.

## Détection de doublons (Réconciliation) — volontairement simple

Candidats = entités actives (`merged_into_id is null`) du même
`entity_type` dont le libellé, une fois normalisé (`trim().toLowerCase()`),
est **strictement identique**. Pas de similarité floue, pas d'IA — doctrine
explicite : *"commencer manuel, ajouter de l'assistance IA seulement si le
volume le justifie"*. À réévaluer seulement si ce mode manuel s'avère
insuffisant en usage réel sur un volume plus important d'actes.

## Fusion

`mergeEntities(survivorId, mergedIds)` (`reconciliation.service.ts`) :
réassigne tous les `entity_links` des entités fusionnées vers le
survivant, marque les entités fusionnées `merged_into_id = survivorId`.
Aucune suppression — les faits et documents de toutes les entités
fusionnées deviennent immédiatement ceux du survivant (la fiche les lit via
`entity_links`, pas de recalcul à faire).

## Renommage et suppression (2026-08-10, demande explicite)

Première dérogation à la doctrine "lecture seule" d'origine du module
Entités (voir mémoire agent `project_entites_reconciliation_module`) —
deux actions désormais possibles depuis la fiche, dans
`entites.service.ts` :

- **`renameEntity(entityId, label)`** : `UPDATE entities SET label = ...`.
  Ne touche que la fiche canonique.
- **`deleteEntity(entityId)`** : `DELETE FROM entities WHERE id = ...`.
  `entity_links.entity_id` est `ON DELETE CASCADE` — les liens vers cette
  entité disparaissent avec elle, mais les entités locales
  (`transcription_entities`) et leurs assertions dans Extraction ne sont
  **pas** touchées : si l'une d'elles est revalidée plus tard,
  `ensureEntitiesPromoted` recréera automatiquement une entité canonique
  (comportement normal, pas un bug à corriger). `merged_into_id` est
  `ON DELETE SET NULL` : si l'entité supprimée était le survivant d'une
  fusion, les entités fusionnées redeviennent actives (visibles à nouveau
  dans les listes et dans Réconciliation) plutôt que de pointer vers une
  fiche disparue.

Suppression = correction d'une entité erronée (ex. une mauvaise fusion de
lieux promue par erreur), pas une "dé-promotion" pour une entité légitime
qu'on voudrait juste masquer — dans ce dernier cas, rien n'empêche qu'elle
soit recréée à la prochaine validation d'assertion qui la concerne.

## Ce qui n'est volontairement pas dans ce lot

- Pas de "défusion" (une fusion n'est pas réversible dans l'UI pour
  l'instant — `merged_into_id` reste modifiable en base si besoin).
- Pas de détection de doublons par similarité (Levenshtein, phonétique...)
  ni par IA — voir doctrine ci-dessus.
- Pas de type `bien`/`organisation`/`contrat` — voir colonne `entity_type`
  ci-dessus.
