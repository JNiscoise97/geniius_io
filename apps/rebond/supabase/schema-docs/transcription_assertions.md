# Module Extraction — `transcription_entities` / `ref_assertion_predicates` / `transcription_assertions`

Agent IA (Anthropic) qui transforme une **version de transcription** figée
(`rebond.transcription_versions`, un checkpoint explicite, pas le brouillon
courant qui bouge en continu) en une liste exhaustive d'**assertions
documentaires atomiques**. Une assertion = un seul fait, littéralement
supporté par un passage du texte — jamais une déduction, jamais une
connaissance extérieure au document.

Décidé en session (2026-08-07), spec complète fournie par l'utilisateur
(voir mémoire `project_extraction_module_spec` côté agent).

## Pourquoi lié à `transcription_versions`, pas à `transcriptions`

`rebond.transcriptions.contenu` est le brouillon courant, modifié en continu
par l'auto-save — des offsets de caractères n'y seraient jamais stables.
`rebond.transcription_versions` est déjà, dans ce schéma, un checkpoint
explicite et immuable (créé par le bouton "Enregistrer une version" de
l'atelier documentaire) : c'est le point d'ancrage naturel pour des
assertions dont les `source_start`/`source_end` doivent rester valides tant
qu'on ne regénère pas l'extraction. Modifier la transcription et enregistrer
une nouvelle version crée mécaniquement un nouveau point d'extraction
possible, sans invalider les assertions déjà validées sur l'ancienne
version.

## `ref_assertion_predicates`

Vocabulaire contrôlé des relations/attributs qu'une assertion peut exprimer
(`birth_date`, `father`, `witness`, `occupation`...). Extensible sans
migration de schéma (table de référence, pas un enum Postgres) — nouveau
prédicat = une ligne de plus. `other` + la colonne `raw_relation` de
`transcription_assertions` couvrent les cas non catégorisés, à observer
avant d'enrichir la liste plutôt que de deviner tous les cas à l'avance.

## `transcription_entities`

Personnes **et actes mentionnés dans le document**, pas des personnes de
l'arbre généalogique. Portée strictement à une `transcription_version_id` :
`P1` dans la version 3 d'un acte n'a aucun lien direct avec `P1` dans une
autre version ou un autre acte — le rapprochement d'identité (même
personne, doublon, fusion) est une étape volontairement hors du périmètre
de ce module, à faire plus tard sur la couche généalogique.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | PK |
| `transcription_version_id` | uuid | FK → `transcription_versions`, `CASCADE`. |
| `local_key` | text | Identifiant local renvoyé par le LLM (`P1`, `P2`... pour les personnes, `D1` pour l'acte, `L1`, `L2`... pour les lieux), unique par version. |
| `label` | text | Le nom (personne, lieu) ou une description (ex. "Acte de naissance de Blaise Gustave"). |
| `entity_type` | text | `person` \| `document` \| `place` \| `event`. `person`/`document` ajoutés le 2026-08-08 après un premier test réel : sans ça, les faits propres à l'acte (date, lieu, heure de rédaction, type, lecture) se retrouvaient attribués par erreur à l'officiant qui le signe. `place` ajouté le même jour : un lieu nommé récurrent (section, hameau, commune) peut porter ses propres faits (ex. "Caféyère" est à la fois une section et un hameau). `event` ajouté ensuite pour les actions à plusieurs rôles à relier (acteur, personne concernée, devant qui, présents) — voir doctrine détaillée dans `src/features/extraction/README.md` section 5, ce fichier reste volontairement centré sur le schéma. Toute assertion `act_date`/`act_time`/`document_type`/`reading` doit avoir pour sujet l'entité `document`, jamais une personne. `act_place` : voir addendum ci-dessous, décision définitive du 2026-08-08. |

## `transcription_assertions`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid | PK |
| `transcription_version_id` | uuid | FK → `transcription_versions`, `CASCADE`. |
| `subject_entity_id` | uuid | FK → `transcription_entities`, `CASCADE`. Le sujet du fait. |
| `predicate_id` | uuid | FK → `ref_assertion_predicates`, `RESTRICT`. |
| `raw_relation` | text | Texte libre si `predicate = other` — la relation telle qu'exprimée dans l'acte (ex. "cousin germain du futur époux"), pour observer les cas réels avant d'enrichir le vocabulaire. |
| `object_entity_id` | uuid | FK → `transcription_entities`, `CASCADE`, nullable — pour les assertions reliant deux personnes (père, témoin de...). |
| `value_text` / `value_number` / `value_date` | text / numeric / text | La valeur du fait quand ce n'est pas une relation entre entités (ex. profession, âge, date). `value_date` en texte plutôt qu'un vrai type `date` : les dates d'actes anciens sont parfois partielles ou approximatives, pas toujours parsables proprement. |
| `source_text` | text | Le passage exact du texte qui justifie l'assertion — contrôle anti-hallucination de base. |
| `source_start` / `source_end` | integer | Offsets dans le texte brut de la version concernée, pour le surlignage — nullables (pas garantis dès la première itération du prompt). |
| `status` | text | `pending` \| `validated` \| `rejected` — l'IA n'est jamais une autorité, l'utilisateur valide. |
| `created_at` / `created_by` | timestamptz / uuid | — |

## Affinage du 2026-08-08 après un premier test réel

Sur un acte de naissance de 1875, plusieurs défauts sont remontés (retour
détaillé de l'utilisateur, voir mémoire agent `project_extraction_module`) :
faits de l'acte attribués à l'officiant (→ `entity_type`, voir ci-dessus),
listes composées non éclatées ("maçon et propriétaire" en une seule
assertion au lieu de deux), les deux sens d'une relation parfois produits
(père/fils dupliqué en sens inverse), `source_text` parfois juste "à
proximité" du fait plutôt que le démontrant spécifiquement, et un passage
d'audit qui ne relevait pas assez (titres de civilité, formules
procédurales, qualificatifs de lieu). Le prompt système a été réécrit en
conséquence (voir `supabase/functions/extract-assertions/index.ts`).

Vocabulaire présenté au modèle en **trois couches** (aide au raisonnement,
reflète le référentiel) :
- **Faits stables sur une personne** : name, sex, age, title, quality,
  occupation, residence, domicile, nationality, marital_status, widowhood,
  birth(+date/time/place), death(+date/time/place), marriage_time, father,
  mother, spouse, child, sibling, relative, neighbor, friend, witness,
  comparant, declarant, officer_role, function.
- **Actions documentaires** : presentation, naming_declaration, declares,
  present, absent, consent, opposition, publication, document_presented,
  signs, cannot_sign, is_asked_to_sign, recognition, reading.
- **Caractéristiques du document/contexte** (sujet = l'entité document) :
  act_date, act_place, act_time, document_type, section, hamlet,
  administrative_area.

`drafting_date`/`drafting_place` renommés en `act_date`/`act_place` (UPDATE
sur la ligne existante, pas de suppression — préserve les FK). `time` est
déprécié (trop ambigu — remplacé par `act_time`/`birth_time`/`death_time`/
`marriage_time`) mais pas supprimé de la table (`RESTRICT` sur les
assertions existantes) ; retiré du vocabulaire proposé à l'agent.

`title` (sieur, dame...) et `quality` (statut du type "propriétaire",
distinct de la profession réelle en `occupation`) ajoutés pour ne pas
perdre ce niveau de détail — conforme à la doctrine explicitement demandée :
"une assertion documentaire atomique... quelle que soit sa valeur
généalogique", y compris les formules administratives et stylistiques.

**Ne pas figer davantage le référentiel dans l'immédiat** — faire passer
20-50 actes variés, observer les `other`/`raw_relation` réels, puis
enrichir. C'est la doctrine que l'utilisateur a lui-même posée.

## Addendum 2026-08-08 — `act_place` tranché définitivement, garde-fou `witness`

Le vocabulaire "trois couches" ci-dessus est resté figé à l'état du
deuxième tour ; le détail à jour (quatre couches, entité `event`,
prédicats dépréciés `section`/`hamlet`) vit désormais dans
`src/features/extraction/README.md` (doc vivante du module, mise à jour à
chaque tour) — ce fichier reste la référence pour le schéma des tables,
pas pour le vocabulaire de prompt qui évolue plus vite.

Deux décisions de cette session à noter pour le schéma :

- **`act_place`** : après plusieurs tours d'hésitation de l'utilisateur, la
  règle est tranchée définitivement. La formule de préambule ("officier de
  l'état civil de la commune de X") n'établit que la juridiction de
  l'officiant (`administrative_area` entre la personne officiant et
  l'entité `place` de la commune), jamais `act_place`. `act_place` ne
  s'utilise que si le texte affirme séparément et explicitement un lieu de
  rédaction/clôture — rare, à ne pas produire par défaut.
- **`witness`** : un garde-fou code (`hasWitnessEvidence` dans
  `extraction.service.ts`) reclasse en `other` toute assertion `witness`
  dont le `source_text` ne contient aucun marqueur documentaire ("témoin",
  "en présence de"...) — corrige un cas réel où une relation familiale
  (épouse/mère) avait été prise pour un témoignage.

## Ce qui n'est volontairement PAS dans ce lot

Pas de table `entities` généalogiques ni de rapprochement automatique, pas
de recalcul incrémental (une nouvelle version = une ré-extraction complète,
pas de diff), pas d'embeddings ni de vector DB, pas de stockage des
relations inverses (père → fils stocké une fois, pas dans les deux sens),
pas de stockage des phrases françaises affichées (générées à la volée côté
UI depuis subject/predicate/value).
