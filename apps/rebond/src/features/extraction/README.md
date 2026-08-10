# Module Extraction

Agent IA (Anthropic) qui transforme une **version de transcription figée**
d'un document en une liste exhaustive d'**assertions documentaires
atomiques** — un fait = une assertion, toujours rattachée à un passage
précis du texte qui la justifie. Construit le 2026-08-07/08.

Ce document rassemble l'architecture, les décisions prises, l'historique
des itérations et les points de vigilance. Pour le détail colonne par
colonne des tables, voir `apps/rebond/supabase/schema-docs/transcription_assertions.md`
(complémentaire, pas dupliqué ici).

## 1. Philosophie

> L'IA ne doit pas raconter ce qu'elle sait sur les personnes : elle doit
> transformer, de manière exhaustive et littérale, ce que dit exactement le
> document en faits documentaires atomiques.

Principes non négociables, posés dès la spec initiale :

- **Atomicité** : une assertion = un seul fait. "Jean est cultivateur, âgé
  de 26 ans" devient deux assertions, jamais une phrase composée.
- **Exhaustivité documentaire, pas seulement généalogique** : titres de
  civilité, formules procédurales, qualificatifs de lieu comptent comme des
  faits à part entière — pas seulement l'information "utile" à un arbre.
- **Zéro connaissance extérieure, zéro déduction** — même logique
  ("âgé de 58 ans" ne donne jamais une date de naissance calculée).
- **Coréférences internes autorisées** (ledit, cette commune, le deux du
  courant...) uniquement quand le référent est établi sans ambiguïté plus
  tôt dans le même texte — sinon, ne rien affirmer.
- **Preuve obligatoire** : chaque assertion cite le passage exact qui la
  justifie (`source_text` + offsets `source_start`/`source_end`).
- **Séparation document / arbre généalogique** : les personnes extraites
  sont des entités *documentaires* locales à une version de transcription,
  jamais directement des personnes de l'arbre. Le rapprochement d'identité
  est une étape volontairement hors du périmètre de ce module.

## 2. Architecture

```
Frontend (ExtractionPage.tsx)
  │  texte brut (dérivé du Tiptap JSON de la version)
  ▼
Edge Function extract-assertions (Deno, Supabase)
  │  clé ANTHROPIC_API_KEY côté serveur uniquement
  ▼
API Anthropic (claude-sonnet-5), 2 passes : extraction puis audit
  │  JSON structuré forcé via tool-use
  ▼
Edge Function : validation minimale, retour {entities, assertions}
  ▼
Frontend : persistance directe dans rebond.* (mêmes patterns RLS que le reste de l'app)
```

Le frontend n'appelle **jamais** directement l'API Anthropic. L'Edge
Function est un pur proxy IA (pas d'accès DB) ; c'est le frontend
(`extraction.service.ts`) qui écrit en base, comme partout ailleurs dans
cette app — pas de logique métier dupliquée côté serveur.

### Pourquoi lié à une version de transcription, pas au brouillon courant

`rebond.transcriptions.contenu` change en continu (auto-save) — des offsets
de caractères n'y seraient jamais stables. `rebond.transcription_versions`
est déjà, dans l'atelier documentaire, un checkpoint explicite et immuable
(bouton "Enregistrer une version"). C'est le point d'ancrage naturel : les
`source_start`/`source_end` restent valides tant qu'on ne relance pas une
extraction sur cette version précise.

### Conversion Tiptap → texte brut

`tiptapJsonToPlainText()` (`src/features/atelier/tiptap/tiptapText.ts`)
convertit le JSON Tiptap en texte brut de façon **déterministe**. Cette même
chaîne sert à la fois de texte envoyé à Claude (pour les offsets) et de
texte affiché dans l'UI pour le surlignage — toute divergence entre les deux
casserait le lien assertion ↔ passage.

#### Convention Markdown pour la mise en forme fidèle à la source (2026-08-10)

Le transcripteur reproduit dans l'éditeur des éléments de mise en forme
réellement présents dans l'acte (pas de la décoration) — `tiptapJsonToPlainText`
les encode en Markdown, dans le même texte brut (donc visibles à l'écran, pas
seulement envoyés à Claude en coulisses) :
- `**gras**` — le scribe a mis le mot en évidence (typiquement un patronyme,
  pour le rendre repérable).
- `~~barré~~` — rature/correction dans l'acte original, pas le texte
  finalement retenu.
- `#`/`##`/`###` en début de ligne — un titre/sous-titre tel qu'il apparaît
  dans l'acte.
- `[passage non transcrit]` (texte littéral) — repère posé par le
  transcripteur pour une lacune volontaire (bloc Tiptap atomique dédié,
  `tiptap/NonTranscritNode.ts`, pas du texte de l'acte).

Le prompt système (Edge Function) explique cette convention à Claude —
notamment que `~~barré~~` n'est pas un fait à extraire normalement (mais
peut être signalé via `other` si la correction semble notable) et que
`[passage non transcrit]` ne doit jamais être interprété comme du texte réel
ni comblé par supposition. `source_text` peut inclure ces marqueurs quand ils
encadrent le passage cité (la recherche exacte du texte cité fonctionne dans
les deux cas, avec ou sans marqueurs, tant que la citation est fidèle à ce
qui apparaît réellement dans le texte fourni).

## 3. Modèle de données

Quatre tables (`rebond.*`), détail complet dans `schema-docs/transcription_assertions.md` :

- **`ref_assertion_predicates`** — vocabulaire contrôlé des prédicats,
  extensible sans migration (table de référence, pas un enum). `other` +
  `raw_relation` couvrent les cas non catégorisés.
- **`transcription_entities`** — personnes, document, lieux, événements
  mentionnés. Scopées à une `transcription_version_id` précise (pas de lien
  entre le "P1" de deux versions ou deux actes différents).
- **`transcription_assertions`** — subject/predicate/object +
  value_text/number/date + source_text/start/end + statut
  (pending/validated/rejected — l'IA n'est jamais une autorité, l'humain
  valide).

### Quatre types d'entités (`entity_type`)

Décidé progressivement, confirmé stable par l'utilisateur le 2026-08-08 :
**"Je garderais désormais clairement ces quatre types d'entités : document,
person, place, event. Tu n'as pas besoin d'aller plus loin tout de suite."**

| Type | Rôle | Exemple |
|---|---|---|
| `person` | Personne mentionnée | P1 = "Némorin (Saint-Julien)" |
| `document` | L'acte lui-même | D1 = "Acte de naissance de Blaise Gustave" |
| `place` | Lieu nommé qui porte ses propres faits | L1 = "Caféyère" |
| `event` | Action à plusieurs rôles à relier | E1 = "Présentation de l'enfant" |

**`document`** existe pour que les faits propres à l'acte (date, lieu, heure
de rédaction, type, lecture) ne soient jamais attribués par erreur à
l'officiant qui le signe — bug réel observé au premier test.

**`place`** existe pour que les lieux récurrents porteurs de faits propres
(ex. Caféyère = section ET hameau, situé dans la commune de Deshayes)
deviennent une entité plutôt que du texte libre dupliqué à chaque mention.

**`event`** existe pour les actions à plusieurs participants avec des rôles
distincts (qui agit, qui est concerné, devant qui, qui d'autre est présent)
— voir doctrine détaillée section 5.

### Vocabulaire de prédicats, en quatre couches

Présenté à l'agent (et organisé côté base) en quatre groupes :

1. **Faits stables sur une personne** — name, sex, age, title, quality,
   occupation, residence, domicile, nationality, marital_status, widowhood,
   birth(+date/time/place), death(+date/time/place), marriage_time, father,
   mother, spouse, child, sibling, relative, neighbor, friend, witness,
   comparant, declarant, officer_role, function.
2. **Actions documentaires** — presentation, naming_declaration, declares,
   present, absent, consent, opposition, publication, document_presented,
   signs, cannot_sign, is_asked_to_sign, recognition.
3. **Caractéristiques du document/contexte** (subject = l'entité document)
   — act_date, act_place, act_time, document_type, administrative_area,
   reading. `act_place` **tranché définitivement le 2026-08-08** après
   plusieurs tours d'hésitation : la formule de préambule ("officier de
   l'état civil de la commune de X") n'établit que la **circonscription**
   de l'officiant (`Valluet -- administrative_area --> Deshayes`), jamais
   `act_place`. `act_place` est réservé à une formule de rédaction/clôture
   séparée et explicite ("fait à X", "passé en la maison commune de X"),
   rare — en son absence, ne pas produire `act_place` du tout, ce n'est pas
   une omission. `reading` **déplacé ici le 2026-08-10** (était dans
   "Actions documentaires") : le fait qu'il ait été donné lecture de l'acte
   a TOUJOURS pour sujet l'entité document, jamais la personne qui lit ou
   reçoit lecture, même quand une seule personne est concernée — ce
   classement était la seule chose qui ne le disait pas explicitement au
   modèle (la règle elle-même existait déjà dans le prompt, section "L'entité
   document") ; repéré via 3 assertions réelles en base, sujet=document dans
   les 3 cas, mais un affichage (`describeAssertion`) qui supposait à tort
   sujet=personne.
4. **Relations d'événement** (subject/object = event et/ou personne) —
   actor, before_person, presented_person, present_at.

Prédicats **dépréciés** (conservés en base pour la sécurité des FK, retirés
du vocabulaire proposé à l'IA **et rejetés explicitement au niveau code** —
voir `DEPRECATED_PREDICATE_CODES` dans `extraction.service.ts`, pas
seulement une consigne de prompt) : `time` (remplacé par les heures
spécialisées), `section`/`hamlet` (remplacés par `quality` — une seule
logique pour décrire la nature d'un lieu).

#### `quality` a deux usages distincts — à ne pas confondre avec "propre aux personnes"
`quality` signifie "qualification documentaire de l'entité", pas
spécifiquement "statut d'une personne". Deux usages coexistent
volontairement :
- **Personne** → statut indépendant du métier (ex. `Némorin -- quality -->
  "propriétaire"`).
- **Lieu** (`entity_type = place`) → nature du lieu (ex. `Caféyère --
  quality --> "section"`, `Caféyère -- quality --> "hameau"`, `Deshayes --
  quality --> "commune"`).

Les deux sont légitimes et volontaires — ce n'est pas une confusion à
corriger, mais un point à garder en tête pour quiconque reprend ce modèle
sans ce contexte.

## 4. Pipeline d'extraction IA (Edge Function)

`supabase/functions/extract-assertions/index.ts` — deux appels séquentiels
à Claude (`claude-sonnet-5`), tool-use **forcé** (`tool_choice: {type:
'tool', name: 'submit_assertions'}`) pour garantir un JSON structuré :

1. **Passe 1 — extraction** : le texte seul, prompt système complet.
2. **Passe 2 — audit** : le texte + les entités/assertions déjà trouvées,
   avec une question ciblée sur les omissions (reformulée plus stricte au
   fil des itérations — voir section 6).

Les résultats des deux passes sont fusionnés et **validés** avant renvoi :
chaque assertion doit référencer des `local_key` réellement déclarés dans
`entities` (anti-hallucination basique). Un filet de récupération
synthétise une entité à partir des valeurs `subject`/`object` réellement
utilisées si `entities` est incomplet — voir bug section 6.

## 5. Doctrine `event` — à utiliser avec parcimonie

Point de friction identifié en cours d'itération : les entités event ne
sont **pas** le mode par défaut.

- Un fait à un seul acteur (ex. "Bourdin signe") reste un **prédicat direct
  simple** (`signs`), jamais un event — même si plusieurs personnes ont
  chacune leur propre fait simple.
- Un event ne se justifie que pour une action avec **plusieurs rôles
  distincts à relier** (acteur + personne concernée + devant qui + témoins
  présents) — cas typique : une présentation d'enfant.
- **Ne jamais fusionner deux actions nommées séparément du texte** en une
  seule entité event, même si elles s'enchaînent ou partagent les mêmes
  participants (ex. "déclaration et présentation" = deux events distincts,
  pas un "E3 = déclaration et présentation").
- Les events **complètent** les prédicats de rôle existants
  (comparant/declarant/witness/signs/reading...), ils ne les remplacent pas
  — sauf pour un prédicat d'action qui redirait EXACTEMENT ce que l'event
  exprime déjà via son object (ex. ne pas garder `presentation` sans objet
  sur l'acteur si l'event a déjà `actor` + `presented_person`).

## 6. Garde-fous de cohérence

Constat de l'utilisateur en cours d'itération : le vrai risque n'est plus
de manquer des catégories, mais que Claude produise des combinaisons
incohérentes avec sa propre extraction (ex. classer "propriétaire" tantôt
en `occupation`, tantôt en `quality`). Deux niveaux de garde-fou :

1. **Prompt** : règles explicites de cohérence interne ("si tu as classé
   'propriétaire' en quality une fois, ne le reclasse jamais en occupation
   ailleurs dans la même réponse").
2. **Code** (`extraction.service.ts`, `normalizePredicateCode`) : un
   filet de sécurité qui **reclasse plutôt que de rejeter** certains termes
   connus (ex. "propriétaire" toujours reclassé en `quality` même si le
   modèle l'a mis en `occupation`). Liste volontairement courte et non
   figée — à enrichir au fil des cas observés, pas construite à l'avance.

Ce deuxième niveau est le début d'un pattern à généraliser si d'autres
incohérences récurrentes apparaissent sur de futurs actes — ne pas
sur-construire un moteur de règles générique tant que le besoin n'est pas
confirmé par la récurrence (même doctrine que pour le référentiel de
prédicats, voir section 8).

3. **Code — rejet des prédicats dépréciés** (`DEPRECATED_PREDICATE_CODES`
   dans `extraction.service.ts`) : `time`/`section`/`hamlet` existent
   toujours en base (FK), donc `predicateIdByCode` les contient — sans ce
   garde-fou explicite, un code déprécié produit malgré le prompt serait
   accepté tel quel plutôt que routé vers `other`. Appliqué automatiquement,
   pas seulement laissé à la consigne de prompt (demandé explicitement :
   "faire respecter automatiquement les prédicats dépréciés").

4. **Code — `witness` exige une preuve textuelle** (`hasWitnessEvidence`
   dans `extraction.service.ts`) : observé sur un acte réel, Claude a produit
   `witness` pour une personne dont le `source_text` établissait en fait un
   lien familial (épouse/mère), pas un témoignage. Une assertion `witness`
   dont le `source_text` ne contient aucun marqueur documentaire ("témoin",
   "témoins", "en présence de"...) est reclassée en `other` (raw_relation
   conservé, visible pour revue humaine plutôt que perdue). Même règle posée
   côté prompt en parallèle — même doctrine que les deux garde-fous
   précédents : le prompt seul ne suffit pas à garantir la cohérence.

## 7. Frontend

- **`ExtractionHubPage.tsx`** (route `/extraction`, tuile Dashboard) — point
  d'entrée principal, écran **distinct** de l'éditeur de transcription
  (demandé explicitement après une première version où l'entrée passait par
  le panneau Historique). Liste, avec la plus récente version par
  exemplaire et un badge de statut (pas encore extrait / X à valider / X
  validées), uniquement les exemplaires qui remplissent **deux conditions**
  (`fetchExtractableExemplaires` dans `extraction.service.ts`, resserré le
  2026-08-08) :
  1. document de rôle **acte primaire** (`unites_documentaires.role_document_ref`
     → `ref_role_document.code = 'ACTE_PRIMAIRE'`) — les instruments de
     recherche, registres compilés, etc. ne sont pas des actes à décomposer
     en assertions ;
  2. transcription **marquée transcrit** (`transcriptions.statut =
     'termine'`, posé via le bouton "Marquer comme transcrit" de l'atelier)
     — une simple version enregistrée ne suffit plus : une transcription
     encore "en_cours" n'a pas de contenu stabilisé, extraire dessus serait
     prématuré.
- **`ExtractionPage.tsx`** (route
  `/atelier-documentaire/exemplaires/:exemplaireId/versions/:versionId/extraction`)
  — l'atelier lui-même. Bouton "Lancer l'extraction" (ou "Relancer", avec
  confirmation si des assertions existent déjà — la ré-extraction est
  complète, pas incrémentale). **Layout pleine largeur, refondu le
  2026-08-08** sur demande explicite (l'ancien layout à deux colonnes
  texte/assertions, avec survol synchronisé, ne convenait pas) :
  1. **Texte source** dans une carte repliable en haut (`SourceTextCard`),
     passages cités surlignés et colorés par statut — affichage statique,
     plus de synchronisation au survol avec les lignes d'assertions (elles
     ne sont plus côte à côte). Chaque ligne d'assertion garde sa citation
     exacte (`« ... »`) pour la vérification, qui ne dépend donc plus de la
     disposition à deux panneaux.
  2. **Chargement** (`LoadingState`) : grandes icônes animées (lecture /
     analyse IA / extraction) pendant l'appel — décoratif, pas une vraie
     barre de progression : l'Edge Function est un aller-retour HTTP
     unique, aucun événement de progression n'est streamé côté client.
  3. **Résumé** (`ExtractionSummaryDialog`) : une fenêtre s'ouvre à la fin
     de l'extraction avec des compteurs (assertions, entités, personnes,
     lieux, événements, assertions "other") avant de basculer sur la liste.
  4. **Liste d'assertions pleine largeur** en dessous, plus de panneau
     latéral étroit — mêmes actions qu'avant (valider/rejeter/remettre à
     valider, filtres par statut).
- **Édition et ajout manuel (2026-08-09)**, sur demande explicite : une
  assertion générée par l'IA peut ne pas convenir (mal formulée, mauvais
  prédicat) ou l'extraction peut manquer un fait entièrement.
  `AssertionFormDialog` (composant partagé) couvre les deux cas :
  - **Éditer** (bouton sur chaque ligne) : corrige prédicat/valeur/objet/
    texte source d'une assertion existante. Le sujet reste fixe (changer
    QUI est concerné revient à recréer l'assertion, pas à la corriger —
    volontairement hors périmètre pour rester simple).
  - **Ajouter une assertion** (bouton en tête de liste) : sujet choisi
    parmi les entités déjà connues de l'acte, ou une toute nouvelle
    (créée à la volée, `createManualEntity`, local_key préfixé `M` pour
    rester visuellement distinct des clés IA).
  - Dans les deux cas : `origin` passe à `'manual'` et `status` à
    `'validated'` directement (éditer/ajouter, c'est déjà valider ce qu'on
    vient d'écrire) — badge "Manuelle" affiché sur la ligne. La promotion
    vers le registre Entités (cf. `entites.service.ts`) est appelée
    explicitement ici, puisque ce chemin ne passe pas par le clic
    "Valider" qui la déclenche normalement.
- **Point d'entrée secondaire retiré le 2026-08-08** : le panneau Historique
  de `TranscriptionEditorPage.tsx` avait un lien "Extraire les assertions"
  par version (utile pour une version qui n'est pas la plus récente, le hub
  ne montrant que la dernière par exemplaire) — remplacé sur demande
  explicite par un bouton "Comparer avec la version actuelle" (diff texte,
  sans rapport avec l'extraction). `ExtractionHubPage.tsx` (route
  `/extraction`) reste le seul point d'entrée du module dans l'UI ; une
  version qui n'est pas la plus récente n'est plus atteignable que par URL
  directe (`/atelier-documentaire/exemplaires/:exemplaireId/versions/:versionId/extraction`),
  pas via un lien visible.

## 8. Golden test

Idée proposée par l'utilisateur le 2026-08-08, une fois le premier acte de
test jugé suffisamment mature : figer manuellement la liste d'assertions
correcte pour un acte de référence, puis comparer automatiquement chaque
nouveau run à cette référence pour mesurer objectivement si une évolution
du prompt améliore ou fait régresser l'extraction, sans tout relire à la
main à chaque itération.

Implémenté comme un script autonome, pas une suite CI stricte (l'API
Claude n'étant pas déterministe, un diff est un signal à revoir, pas un
verdict pass/fail automatique) :

- `scripts/extraction-golden-test.mjs` — appelle la fonction Edge déployée
  sur le texte d'une fixture, compare le résultat à un `expected` figé par
  un ensemble de tuples `(sujet, prédicat, raw_relation, objet/valeur)`
  indépendant des `local_key` (peuvent varier d'un run à l'autre).
- `scripts/golden/*.json` — une fixture par acte de référence, format et
  workflow détaillés dans `scripts/golden/README.md`.
- Première fixture : `acte-naissance-1875-blaise-gustave.json`, `expected`
  encore à `null` au 2026-08-08 — à figer après un run qui confirme la
  correction du faux `witness` sur Alidor Reinette et la refonte de
  `act_place` (voir section 3).

## 9. Décisions explicitement écartées (ne pas re-proposer sans redemande explicite)

- Recalcul incrémental — une nouvelle extraction remplace tout,
  intégralement, pour la version concernée.
- Table `entities` généalogiques / rapprochement automatique avec l'arbre.
- Embeddings, vector DB, RAG, multi-agent, base graphe.
- 5ᵉ type d'entité (ex. une entité "maison" distincte d'un lieu, évoquée en
  passant mais explicitement pas retenue pour le MVP).
- Figer le référentiel de prédicats à l'avance — doctrine explicite de
  l'utilisateur : tester sur ~10 actes variés (naissance, décès, mariage,
  enfant naturel, reconnaissance, veuf/veuve, nombreux témoins) et laisser
  les récurrences dans `other`/`raw_relation` indiquer quoi ajouter,
  plutôt que d'itérer sur un seul acte à chaque fois.

## 10. Déploiement

**Pas de CLI Supabase disponible dans l'environnement de dev de l'agent** —
toute modification de l'Edge Function doit être redéployée manuellement par
l'utilisateur :

1. Dashboard Supabase → **Edge Functions** → `extract-assertions`
2. Coller le contenu de `supabase/functions/extract-assertions/index.ts`
3. **Deploy** (vérification JWT laissée activée — ne pas déployer avec
   `--no-verify-jwt`)
4. Secret `ANTHROPIC_API_KEY` posé une seule fois via **Manage secrets**
   (persiste entre les redéploiements du code)

Toute nouvelle migration DB (`supabase/migrations/*.sql`) doit aussi être
jouée manuellement dans l'éditeur SQL du dashboard.

## 11. Historique des itérations (2026-08-07 → 2026-08-08)

Résumé condensé — le détail complet vit dans les commentaires d'en-tête de
`extract-assertions/index.ts` et dans les fiches `schema-docs/`.

1. **Implémentation initiale** — schéma DB, Edge Function, UI, à partir
   d'une spec complète fournie par l'utilisateur.
2. **Bug extraction vide** — Claude omettait parfois la clé `entities` du
   tool call malgré le schéma `required` ; corrigé par un filet de
   récupération qui synthétise les entités manquantes plutôt que de rejeter
   les assertions. *Leçon générale : ne jamais faire dépendre une
   validation d'un champ qu'un LLM pourrait omettre sans le signaler.*
3. **Refonte après relecture qualitative (acte réel)** — entité `document`
   introduite (faits de l'acte mal attribués à l'officiant), atomicité des
   listes composées, sens unique des relations, précision du `source_text`,
   résolution interne lieux/dates.
4. **Entité `place`** — lieux récurrents porteurs de faits propres.
5. **Entité `event`** — décision prise via question explicite à
   l'utilisateur (signal ambigu entre "à tester plus tard" et "à faire
   maintenant") plutôt que tranchée unilatéralement.
6. **Doctrine `event` resserrée** — à utiliser seulement pour les actions
   à plusieurs rôles, jamais pour un fait à un seul acteur ; interdiction de
   fusionner deux actions distinctes du texte en un seul event. Bug
   `widowhood`/`spouse` confondus corrigé.
7. **Consolidation `section`/`hamlet` → `quality`**, clarification de la
   convention `act_place` (juridiction ≠ lieu de rédaction littéral, choix
   pragmatique documenté), garde-fou de cohérence `occupation`/`quality`,
   désignations contextuelles routées vers `other`.
8. **`act_place` tranché définitivement** (l'hésitation revenait à chaque
   tour depuis l'itération 7 : la formule de préambule devient
   `administrative_area` sur l'officiant, plus jamais `act_place` par
   défaut), garde-fou `witness` (prompt + code) contre une confusion
   observée avec un rôle familial (épouse/mère prise pour témoin), et pose
   de l'infrastructure golden test (voir section 8) — dernier tour explicite
   sur cet acte de test, l'utilisateur a demandé l'arrêt des modifications du
   référentiel tant que d'autres types d'actes n'ont pas été testés.

**Constante sur toutes les itérations** : l'utilisateur fournit une
relecture qualitative détaillée sur un acte réel après chaque lot de
changements — ne pas réextrapoler ses retours au-delà de ce qu'il demande
explicitement (certains tours étaient "corrige tout", d'autres listaient
des corrections ciblées en écartant explicitement d'autres pistes).

## 12. Points de vigilance pour la suite

- Le vocabulaire dupliqué entre la migration SQL (seed) et l'Edge Function
  (system prompt) doit être resynchronisé manuellement à chaque évolution.
- Non-déterminisme LLM observé : une assertion correcte à un tour peut
  disparaître au tour suivant sans changement de code (ex. `Valluet --
  signs` disparu puis récupéré) — un test unique ne suffit pas à valider
  une correction de prompt, tester plusieurs fois si un doute persiste.
- La classe de bug "relation exprimée via le mauvais prédicat" (quality vs
  spouse, occupation vs quality, widowhood vs spouse, et maintenant witness
  vs spouse/mother) est apparue **quatre** fois sous des formes différentes
  — chaque occurrence a été corrigée par une règle de prompt + un garde-fou
  code dédié, jamais un seul des deux. Si un cinquième cas apparaît sur un
  autre acte, ça vaut la peine de se demander si un mécanisme générique
  (ex. "chaque prédicat relationnel déclare les marqueurs textuels qui le
  justifient") ne remplacerait pas mieux ces règles ad hoc — mais pas avant
  qu'un cinquième cas concret ne le confirme (même doctrine anti-sur-
  construction que pour le référentiel, section 9).
- Avant d'ajouter un 5ᵉ type d'entité ou de nouveaux prédicats, faire
  tourner l'extraction sur plusieurs actes de types différents (voir
  doctrine section 9) plutôt que d'itérer sur le même acte de test —
  directive répétée explicitement par l'utilisateur au 8ᵉ tour : arrêt des
  modifications du référentiel sur cet acte précis.
- Golden test (section 8) : le champ `expected` de la première fixture est
  encore `null` — la prochaine session doit lancer
  `node scripts/extraction-golden-test.mjs` après confirmation du
  redéploiement, relire la capture avec l'utilisateur, et ne figer
  `expected` qu'après son accord explicite (ne pas le reconstruire depuis
  la mémoire des tours de relecture précédents — risque d'y figer une
  imprécision).
