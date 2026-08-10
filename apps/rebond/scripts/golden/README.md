# Golden tests — module Extraction

Idée : une fois qu'un acte a été relu à la main sur plusieurs itérations et
jugé stable, on fige la liste d'assertions correcte une fois pour toutes.
Chaque changement de prompt/modèle peut ensuite être rejoué sur ce même acte
et comparé automatiquement à cette référence, pour repérer une régression
sans tout relire manuellement à chaque fois.

Ce n'est **pas** un test CI strict : Claude n'est pas déterministe (cf.
mémoire agent `project_extraction_module.md`, épisode de la signature de
Valluet qui a disparu puis réapparu sans changement de code). Le script
(`../extraction-golden-test.mjs`) sert de **diff pour revue humaine** — un
écart affiché n'est pas automatiquement un bug, c'est un signal à regarder.

## Format d'une fixture

Un fichier JSON par acte de référence :

```json
{
  "label": "Description humaine de l'acte",
  "versionId": "uuid d'une transcription_version existante",
  "expected": {
    "entities": [{ "local_key": "P1", "label": "...", "entity_type": "person" }],
    "assertions": [{ "subject": "P1", "predicate": "...", "object": "P2", "source_text": "..." }]
  }
}
```

- `versionId` : le texte comparé est toujours re-résolu depuis la base au
  moment du run (pas de copie figée du texte) — si la transcription change,
  le golden test le reflète immédiatement plutôt que de comparer sur un
  texte périmé. Alternative : un champ `text` inline si l'acte n'a pas (ou
  plus) de version en base.
- `expected` : peut être `null` tant que le résultat n'a pas été validé par
  une relecture humaine — dans ce cas le script affiche juste la capture
  brute au lieu de comparer.
- La comparaison se fait par un ensemble de tuples `(label sujet, prédicat,
  raw_relation, label objet ou valeur)` — **pas** par `local_key` (peut
  varier d'un run à l'autre) ni par `source_start`/`source_end` (précision
  du LLM sur les bornes exactes, pas pertinent pour juger si le FAIT est
  correct).

## Workflow pour figer un golden test

1. Redéployer la fonction Edge avec le prompt à tester (dashboard Supabase).
2. `node scripts/extraction-golden-test.mjs <nom-fixture>` avec `expected: null`
   → capture brute affichée dans le terminal.
3. Relire cette sortie à la main (comme pour toute nouvelle version du
   prompt jusqu'ici). Si elle est jugée correcte, copier `entities` +
   `assertions` de la capture dans le champ `expected` de la fixture.
4. À partir de là, relancer le script après tout changement de prompt pour
   voir le diff (`manquant` / `nouveau·inattendu`) au lieu de tout relire.

## Fixtures existantes

- `acte-naissance-1875-blaise-gustave.json` — premier acte testé sur ce
  module (7 rounds de relecture, cf. mémoire agent). `expected` encore à
  `null` : à figer après le prochain run qui confirme la correction du
  faux `witness` sur Alidor Reinette et la refonte de la règle `act_place`
  (7ᵉ affinage, 2026-08-08).
