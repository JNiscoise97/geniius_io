// supabase/functions/extract-assertions/index.ts
//
// Module Extraction : reçoit le texte brut d'une version de transcription,
// appelle Claude en deux passes (extraction puis audit des omissions) et
// renvoie la liste d'entités + assertions documentaires atomiques. La clé
// ANTHROPIC_API_KEY ne quitte jamais cette fonction — le frontend ne parle
// jamais directement à l'API Anthropic.
//
// Déploiement (CLI Supabase requise, pas disponible dans cet environnement
// de dev — à faire manuellement) :
//   supabase functions deploy extract-assertions
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// La vérification du JWT reste activée par défaut (pas de --no-verify-jwt) :
// seuls les appels authentifiés avec la clé anon/session du projet passent,
// cohérent avec le reste de l'app (RLS ouverte mais clé anon requise).
//
// Vocabulaire contrôlé des prédicats : dupliqué ici depuis
// supabase/migrations/20260806100113_create_transcription_assertions.sql +
// 20260806100115_extraction_entity_type_and_predicates.sql — à garder
// synchronisé si on enrichit la liste côté base.
//
// Révisé le 2026-08-08 après un premier test réel sur un acte de naissance
// de 1875 : Claude attribuait les faits propres à l'acte (date, lieu, heure
// de rédaction) à l'officiant qui le signe, produisait parfois les deux sens
// d'une relation (père/fils), n'éclatait pas les listes composées
// ("maçon et propriétaire"), et le passage d'audit ne relevait pas assez.
//
// Deuxième affinage le même jour, après relecture de la sortie corrigée :
// entity_type accepte désormais aussi "place" (lieux nommés récurrents,
// distincts du lieu de rédaction de l'acte), le fait brut "birth"/"death"
// doit toujours accompagner birth_date/death_date, un lieu mentionné dans le
// récit d'un événement (naissance...) ne doit pas être confondu avec le
// lieu de rédaction de l'acte, et une simple mention nominative en formule
// d'ouverture ("par-devant nous X") ne doit pas être interprétée comme une
// action (signer, consentir...). Voir mémoire agent project_extraction_module.
//
// Troisième affinage le même jour : convention act_place rendue explicite
// (formule "officier de l'état civil de la commune de X" = suffisant),
// "en présence de X" ne doit plus faire attribuer l'action à X (seulement
// "present"/"witness"), résolution de "nous"/"avec nous" vers l'officiant
// pour ne pas rater ses propres signatures, relations (spouse...) plus
// dupliquées comme quality/title, ET entity_type "event" implémenté
// (actor/before_person/presented_person/present_at) — demandé explicitement
// après question posée à l'utilisateur (event vs pas event).
//
// Quatrième affinage le même jour : doctrine event resserrée (à utiliser
// seulement pour les actions à plusieurs rôles à relier, PAS pour un fait
// à un seul acteur comme "X signe" — ça reste un prédicat direct, pas
// d'event) ; interdiction de fusionner deux actions distinctes du texte
// (ex. "déclaration et présentation") en une seule entité event ; et
// distinction stricte spouse ("épouse/mari", en cours) vs widowhood
// ("veuf/veuve", mot explicite requis) — le modèle confondait les deux.
//
// Septième affinage (2026-08-08) : act_place tranché définitivement — la
// formule de préambule ("officier de l'état civil de la commune de X")
// n'établit plus jamais act_place, seulement administrative_area(officiant,
// commune) ; act_place réservé à une formule de rédaction/clôture séparée et
// explicite, absente le plus souvent (ne pas la produire dans ce cas). Règle
// witness ajoutée : predicate="witness" exige un marqueur documentaire dans
// le source_text lui-même (témoin/en présence de), sinon c'est probablement
// une confusion avec un autre rôle (ex. épouse/mère prise pour témoin) —
// doublée d'un garde-fou côté code (extraction.service.ts) qui reclasse en
// "other" si le marqueur manque, plutôt que de rejeter l'assertion en bloc.
//
// Huitième affinage (2026-08-08) : source_text d'un witness doit inclure le
// marqueur de présence lui-même (pas seulement la clause descriptive de la
// personne, sinon le garde-fou witness le rejette à tort) ; règle
// "désignations contextuelles" resserrée pour ne plus s'appliquer aux rôles
// déjà exprimés via un prédicat dédié (père déjà father, témoins déjà
// witness) quand ils réapparaissent dans la formule de signature — produit
// le fait réellement nouveau (signs) au lieu de re-décrire le rôle.
//
// Neuvième affinage (2026-08-08) : sur un run réel, Claude a renvoyé 62
// assertions bien formées mais un tableau "entities" totalement vide ET
// aucun source_start/source_end — le filet de récupération existant évitait
// de perdre les assertions mais synthétisait un type "person" et un label =
// local_key génériques (lieux/document/event comptés comme personnes,
// "P3" affiché au lieu du prénom réel). Corrigé : le type et le label sont
// désormais déduits des autres assertions qui référencent la même clé
// (inferEntityType/inferEntityLabel), et les offsets manquants sont
// récupérés par recherche exacte du source_text dans le texte
// (recoverOffsets) plutôt que de laisser l'assertion sans surlignage.
//
// Dixième affinage (2026-08-09) : inferEntityLabel ne savait résoudre que
// les personnes (via un predicate "name", qui n'existe jamais pour un
// document/lieu/event) — ces trois types s'affichaient donc tels quels
// ("D1", "L2", "E1") partout dans l'UI dès que le filet de récupération du
// 9ᵉ affinage devait synthétiser leur entité. Repli en cascade ajouté :
// document_type pour un document, sinon le premier source_text où la clé
// apparaît (imparfait mais lisible), la clé brute en tout dernier recours.
// Voir mémoire agent project_extraction_module pour le détail des retours.
//
// Onzième affinage (2026-08-10) : "reading" était déjà documenté comme
// sujet=document dans la section "L'entité document" (règle jamais
// remise en cause), mais la couche de vocabulaire présentée au modèle le
// rangeait dans documentary_actions (pas de mention "sujet=document" à cet
// endroit) ET la doctrine event le citait par erreur en exemple de
// "prédicat direct sur la personne" — contradiction interne repérée sur 3
// vraies assertions "reading", toutes avec sujet=document mais une
// formulation d'affichage (describeAssertion) qui supposait sujet=personne
// ("Lecture de l'acte a été donnée à {sujet}", rendu absurde une fois le
// sujet réellement le document). reading déplacé dans document_context
// (renforce explicitement "sujet=document" au modèle à chaque appel),
// retiré de l'exemple event, et describeAssertion corrigé côté frontend.
//
// Douzième affinage (2026-08-10) : le transcripteur reproduit fidèlement
// dans l'éditeur des éléments de mise en forme réellement présents dans
// l'acte (gras sur un patronyme mis en évidence par le scribe, texte barré
// pour une rature/correction, titres), plus un nouveau bloc repère "passage
// non transcrit" (NonTranscritNode.ts, atelier) pour signaler une lacune
// volontaire. tiptapJsonToPlainText (frontend) encode désormais tout ça en
// Markdown (gras/barré/titres + "[passage non transcrit]" littéral) dans le
// MÊME texte brut envoyé ici ET affiché à l'écran pour le surlignage
// (contrainte déjà existante, pas de désync d'offsets à introduire) — le
// prompt système doit donc savoir interpréter ces marqueurs plutôt que les
// prendre pour du texte d'acte ordinaire ou les ignorer sans le dire
// (risque : citer un passage barré comme fait réel, ou halluciner un sens
// au texte "[passage non transcrit]").
//
// Treizième affinage (2026-08-10) : revue externe de fiabilité/reproductibilité
// (voir mémoire agent project_extraction_module) — 5 correctifs pragmatiques
// retenus après tri (le reste de la revue proposait une architecture de cache/
// idempotence complète + renumérotation déterministe des local_key + référentiel
// de prédicats généré depuis la base, écartés pour l'instant : sur-ingénierie
// pour un pipeline où chaque assertion est de toute façon validée par un
// humain, et le dernier point va frontalement contre la doctrine déjà actée
// "ne pas figer le référentiel avant que le vocabulaire ait fait ses preuves",
// voir README.md section 9) :
//   1. temperature: 0 sur les deux appels (tâche extractive, pas créative) —
//      RETIRÉ le 2026-08-10 (voir 14ᵉ affinage) : le modèle configuré
//      rejette ce paramètre (erreur 400).
//   2. predicate contraint par un vrai "enum" JSON Schema, pas seulement une
//      description — Claude est déjà forcé via tool_choice, l'enum se fait
//      respecter au niveau de l'API plutôt que sur la seule bonne volonté du
//      modèle à lire la description. Doublé d'une vérification serveur
//      (CONTROLLED_SET) dans validateAssertions, qui ne vérifiait avant que le
//      type (string), pas l'appartenance au référentiel.
//   3. Les offsets fournis par Claude sont maintenant revérifiés (le texte à
//      ces positions doit correspondre exactement à source_text), pas
//      seulement recalculés quand ils manquent — un offset décalé fourni par
//      Claude était accepté tel quel jusqu'ici.
//   4. Déduplication pass1+pass2 par clé canonique — l'audit peut, malgré la
//      consigne de prompt "ne redonne pas les assertions déjà listées,
//      reproduire une assertion déjà trouvée en passe 1 ; rien ne l'empêchait
//      d'être comptée deux fois.
//   5. EXTRACTOR_VERSION/PROMPT_VERSION en constantes, renvoyées dans la
//      réponse — traçabilité minimale, sans construire toute l'infrastructure
//      de cache qui s'appuierait dessus (pas encore justifiée par un besoin
//      observé, cf. ci-dessus).
//
// Quatorzième affinage (2026-08-10) : extension du référentiel aux actes
// hypothécaires/notariés (vente, succession), après avis explicitement
// demandé et tranché en faveur d'une extension du référentiel unique plutôt
// qu'un module hypotheques_assertions séparé (voir mémoire agent
// project_extraction_module ; migration 20260806100131). Strictement
// additif — aucun prédicat, aucune règle de doctrine état-civil existante
// n'est modifiée : le cadrage d'ouverture du prompt est généralisé pour ne
// plus être exclusif à l'état civil, et une nouvelle section de doctrine
// couvre les nouveaux prédicats (event réutilisé pour vente/succession,
// area/boundary rattachés à la doctrine "L'entité place" existante,
// registration_* rattachés à la doctrine "L'entité document" existante).
// Choix délibérément écartés à ce stade (voir migration pour le détail) :
// bornage directionnel, statut hypothécaire, mandat/procuration,
// autorisation administrative spécifique — couverts par "other" tant que
// le besoin d'un prédicat dédié ne s'est pas confirmé sur plusieurs actes.
//
// Deux bugs trouvés en testant réellement après redéploiement (pas
// hypothétiques, constatés sur de vrais appels) :
//   1. `temperature` (posé au 13ᵉ affinage) provoquait une erreur 400 —
//      "temperature is deprecated for this model" — sur le modèle
//      actuellement configuré. Retiré de GENERATION_CONFIG.
//   2. `inferEntityType` (filet de récupération du 9ᵉ affinage, pour quand
//      Claude omet une entité du tableau "entities") ne connaissait pas les
//      nouveaux prédicats : sur un test réel de vente, l'event et le lieu
//      (terrain) non déclarés explicitement par Claude retombaient sur
//      "person" par défaut. Étendu pour reconnaître seller/buyer/deceased/
//      heir/usufructuary/sale_price → event, area/boundary → place,
//      registration_* → document (sujet) / place (objet de
//      registration_place) — même logique que les branches déjà existantes,
//      rien retiré ni changé pour l'état civil.
//
// Quinzième affinage (2026-08-10) : sur un deuxième acte d'état civil testé
// (Justine-Marie-Victoire Charbonné), bug repéré par l'utilisateur — "section
// Pineau, hameau Richard" (deux noms DIFFÉRENTS) fusionné à tort en une
// seule entité place portant les deux quality (section + hameau) et un
// administrative_area unique vers Deshaies, alors que ce sont deux lieux
// emboîtés distincts (le hameau Richard est dans la section Pineau, qui est
// dans la commune de Deshaies). Cause : l'exemple donné dans la doctrine
// "L'entité place" ("Caféyère" est section ET hameau) ne fonctionne QUE
// parce que Caféyère est le MÊME nom aux deux niveaux (le texte dit "hameau
// de ce nom") — le modèle a généralisé le patron syntaxique "section X,
// hameau Y" sans vérifier que X et Y étaient bien identiques. Règle ajoutée :
// ne fusionner deux quality sur un même local_key que si le nom associé à
// chacune est identique ; sinon créer une entité par nom, reliées par
// administrative_area selon l'emboîtement réel (hameau -> section ->
// commune). Assertions de ce cas précis corrigées manuellement par
// l'utilisateur, pas de correctif rétroactif en base.
//
// Seizième affinage (2026-08-10) : sur ce même acte, une assertion
// "naming_declaration" (Charbonné déclare vouloir donner les prénoms de
// sa fille) avait value_text NULL en base — Claude avait bien identifié le
// fait et cité le bon passage, mais jamais rempli la valeur (le prénom
// existait par ailleurs via un "name" sur l'enfant, sans doute jugé
// redondant). Affichage frontend en résultait : "déclare vouloir donner
// les prénoms null" (texte littéral, cf. describeAssertion). Règle de
// prompt ajoutée : une assertion dont le prédicat implique une valeur
// précise (naming_declaration, declares...) doit toujours porter cette
// valeur, même si elle existe déjà ailleurs sous une autre assertion — ce
// n'est pas la même redondance que celle interdite pour les events
// (sujets différents, faits différents). Doublé d'un filet d'affichage
// côté frontend (extraction.service.ts, describeAssertion) qui ne laisse
// plus jamais transparaître un "null"/"undefined" littéral quelle que soit
// la cause.
//
// Dix-septième affinage (2026-08-10) : premier acte testé après les 14ᵉ/15ᵉ/
// 16ᵉ tours (acte de naissance Ernest Marie Augustin Nicolas, distinct de
// l'acte Charbonné) — confirme la doctrine "section X, hameau Y" (noms
// différents → deux entités emboîtées) ET le fix naming_declaration en
// usage réel. Un vrai bug trouvé : `Dagoumel -- domicile` apparaissait EN
// DOUBLE (une fois avec object=null, une fois avec object résolu vers
// l'entité lieu), toutes deux issues de la MÊME citation exacte — la
// déduplication (13ᵉ affinage) comparait aussi object/value, donc ne les
// voyait pas comme des doublons puisque la passe d'audit avait mieux résolu
// la référence que la passe 1. Clé de dédoublonnage refaite : basée sur la
// citation (subject, predicate, source_text, raw_relation) plutôt que sur
// object/value, avec une préférence pour la version la plus résolue en cas
// de collision (voir canonicalAssertionKey/completenessScore).
//
// Deux points observés mais PAS corrigés ce tour (pas assez de signal pour
// coder une règle, à surveiller) :
// - Le filet de récupération de libellé (inferEntityLabel, 10ᵉ affinage) a
//   de nouveau produit un libellé verbeux pour deux entités "place" (ex.
//   "Officier de l'état civil de la commune de Deshayes" au lieu de
//   "Deshayes") — Claude n'avait pas déclaré ces entités proprement dans son
//   tableau "entities" malgré la consigne. Pas de nouveau code : le renommage
//   en un clic ajouté à l'étape "Lieux" de l'écran de revue par étapes couvre
//   déjà ce cas.
// - `Laurentin -- witness` a de nouveau été rétrogradé en "other" par
//   hasWitnessEvidence (source_text du 2ᵉ témoin d'une énumération sans le
//   marqueur partagé) — même classe de bug que le 8ᵉ affinage, déjà
//   documentée comme non garantie à 100% malgré la règle de prompt
//   correspondante (non-déterminisme du modèle). Faux négatif à corriger à
//   la main dans ce cas précis, pas de nouveau garde-fou ajouté pour
//   l'instant (nécessiterait une heuristique de fenêtre contextuelle plus
//   large, pas justifiée par une seule occurrence).
//
// Dix-huitième affinage (2026-08-10) : premier test sur un acte VRAIMENT
// long/complexe (acte de vente hypothécaire "Lacour", ~20 personnes,
// succession sur plusieurs générations, terrain avec bornage, événement de
// vente) — bug sérieux trouvé : `max_tokens: 8000` (dimensionné pour de
// courts actes d'état civil) tronquait la réponse de Claude en PLEIN
// MILIEU du JSON. Preuve concrète : un libellé d'entité coupé en plein mot
// ("...demeurant à Desh" au lieu de "Deshaies"), et 0 entité lieu/0 event
// alors que le texte en contenait clairement (le terrain, l'événement de
// vente...) — tout ce qui suivait le point de coupure était perdu, SANS
// LA MOINDRE ERREUR VISIBLE (le tool_use existait toujours, juste
// incomplet). Corrigé à deux niveaux : `max_tokens` relevé à 32000 (valeur
// prudente, pas de certitude absolue sur le plafond exact du modèle) ET
// `extractToolInput` vérifie désormais `stop_reason === 'max_tokens'` et
// refuse explicitement ce cas (erreur claire) plutôt que d'accepter une
// extraction partielle en silence — même doctrine que le filet
// `entities` manquant du 9ᵉ affinage : ne jamais faire confiance à une
// sortie LLM structurée sans vérifier qu'elle est complète.
//
// Dix-neuvième affinage (2026-08-10) : une fois la troncature du 18ᵉ tour
// corrigée, l'acte Lacour complet a bien tourné (35 entités/288 assertions
// sur un run) mais a révélé, sur un run suivant, un vrai décrochage de
// qualité sur les parties les plus complexes de ce document précis (7
// vendeurs, 2 acheteurs en indivision, succession sur 3 générations,
// terrain avec bornage) : seller/buyer/deceased/heir/usufructuary presque
// jamais utilisés malgré un vocabulaire qui colle au texte, terrain sans
// superficie ni bornage ni même "quality", et deux personnes distinctes
// d'une même énumération ("4° - X, 5° - Y") fusionnées en une seule entité.
// Deux fixes :
//   1. Bug de CODE sans ambiguïté : `inferEntityType` ne reconnaissait
//      "terrain"/"chemin"/etc. comme indice de lieu via "quality" (liste
//      blanche trop étroite, ne contenait que des mots de circonscription
//      administrative) — étendue.
//   2. Doctrine de prompt enrichie avec des exemples travaillés (comme la
//      doctrine "présentation" de l'état civil, qui en avait déjà un) :
//      vente à plusieurs parties (une assertion seller/buyer PAR personne,
//      quote-part en value_text), succession en chaîne (un event par
//      décès qui transmet, ne pas fusionner), quality obligatoire sur un
//      bien, et une nouvelle règle générale (pas spécifique aux actes
//      hypothécaires) contre la fusion de deux personnes distinctes d'une
//      même énumération serrée.
// Le référentiel de prédicats lui-même n'a pas changé — uniquement la
// doctrine qui explique comment l'appliquer sur des cas réels plus
// complexes que le premier test synthétique.
//
// Vingtième affinage (2026-08-10) : re-test de l'acte Lacour après le 19ᵉ
// tour — net progrès structurel (fusion Justin/Casimir corrigée, 5 events
// bien séparés pour la vente + chaque succession, area/boundary/
// usufructuary bien utilisés), mais seller/buyer/heir restent incomplets
// dès que la liste dépasse 2-3 personnes (1 seule assertion seller sur 7
// vendeurs, 1 seule buyer sur 2 acheteurs, héritiers manquants sur
// plusieurs successions) — et un cas de mauvaise résolution de référence
// (l'héritière "Mme Duhald" reliée à son MARI plutôt qu'à elle-même).
// Plutôt qu'un nouvel exemple dans la doctrine (déjà bien étoffée au tour
// précédent), renforcement ciblé de la passe d'audit (qui a déjà un
// mécanisme de vérification explicite pour les signatures, "chaque
// signataire... a-t-il bien son assertion signs ?") : nouveau point de
// contrôle (3) demandant de reprendre nom par nom toute liste de
// vendeurs/acheteurs/héritiers pour vérifier qu'aucun n'a été oublié en
// cours de route, plus un rappel sur la résolution de référence indirecte
// ("Mme X" pour une femme désignée par le nom de son mari).
//
// Vingt-et-unième affinage (2026-08-10) : relecture complète (pas juste un
// sondage) des 279 assertions du run Lacour validé au 20ᵉ tour — deux
// trouvailles supplémentaires, en plus d'une coquille de date dans le texte
// source (corrigée par l'utilisateur, hors périmètre de ce module) :
//   1. Une assertion "sibling" isolée reliait Philippe Duhald (le MARI de
//      la sœur d'Ernest) à Ernest Charbonné comme frère — alors que
//      l'assertion "heir" correspondante, elle, pointait déjà correctement
//      vers Ernestine (la vraie sœur). Un seul cas sur 5 héritiers,
//      corrigé manuellement par l'utilisateur — pas de pattern systémique
//      justifiant un nouveau garde-fou de prompt.
//   2. seller/buyer : la doctrine posée au 19ᵉ tour ("subject = event,
//      object = personne") n'était suivie que par ~10% des assertions
//      réelles — la grande majorité avait le sens inverse (sujet =
//      personne, objet = event). Plutôt que d'insister sur un sens fixe
//      côté prompt (peu fiable), robustifié côté CODE pour tolérer les
//      deux sens : `inferEntityType` reconnaît désormais l'event via
//      seller/buyer côté objet EN PLUS du côté sujet, et
//      `describeAssertion` (frontend, extraction.service.ts) résout le
//      "côté personne"/"côté event" par entity_type réel plutôt que par
//      position sujet/objet (nouvelle fonction sideByType).
// Profité de cette relecture pour combler un vrai trou d'affichage :
// describeAssertion n'avait AUCUNE formulation dédiée pour les 14
// prédicats hypothèques (seller/buyer/deceased/heir/usufructuary/
// sale_price/area/boundary/registration_*/marital_regime) depuis leur
// ajout au 14ᵉ tour — ils tombaient tous sur le cas générique. Ajoutées.
//
// Correctif d'urgence, même jour : le point 2 du 21ᵉ affinage ci-dessus
// (inferEntityType reconnaît l'event via seller/buyer côté objet EN PLUS
// du côté sujet) supposait à tort qu'un des deux côtés désignait TOUJOURS
// l'event — faux dans les deux cas puisque le sens varie d'un run à
// l'autre. Régression réelle constatée au run suivant : le sens dominant
// s'est inversé et la PLUPART des personnes (Andrésine, Pierre Ymanette,
// Philippe Duhald...) ont été typées "event" au lieu de "person". Corrigé
// par un signal de FRÉQUENCE plutôt que de position : la valeur qui
// apparaît sur plusieurs assertions seller/buyer distinctes est l'event
// partagé (plusieurs vendeurs/acheteurs pointent vers LE MÊME event) ;
// une valeur qui n'apparaît qu'une fois est une personne (son propre
// seller/buyer). Insensible au sens sujet/objet, ne devine plus.
//
// Vingt-deuxième affinage (2026-08-11) : après rechargement des crédits
// Anthropic (une erreur "credit balance too low" avait aussi provoqué des
// "Edge Function returned a non-2xx status code" ce jour-là — pas un bug
// de ce module), 3 appels directs successifs sur le même texte long
// (acte Lacour) ont révélé une vraie instabilité de génération à ce
// niveau de complexité (prompt système long + texte long + tool_choice
// forcé) : un run a réussi pleinement (270 assertions), un a renvoyé des
// entités peuplées mais 0 assertion, un autre 0 entité/0 assertion en
// quelques secondes à peine. Les trois avaient stop_reason ≠ 'max_tokens'
// (sinon déjà intercepté par le garde-fou du 18ᵉ tour) — une dégénérescence
// différente, pas encore vue. Garde-fou ajouté : si le texte fourni est
// substantiel (>500 caractères) et qu'aucune assertion n'en ressort,
// erreur explicite plutôt qu'un succès silencieux à 0 assertion — laisse
// le champ ouvert à un nouveau run plutôt que de bloquer, puisqu'on a la
// preuve que ce même texte PEUT réussir pleinement.
//
// Vingt-troisième affinage (2026-08-11) : un run suivant a montré que le
// problème du 21ᵉ tour (sens sujet/objet peu fiable) ne se limite pas à
// seller/buyer — deceased/heir/usufructuary AUSSI observés inversés (ex.
// "Casimir CHARBONNE -- deceased --> [event]" au lieu de l'inverse), ce
// qui faisait typer de vraies personnes en "event". Généralisé le signal
// de fréquence à TOUS les prédicats à deux rôles personne/event (actor/
// before_person/presented_person/seller/buyer/deceased/heir/usufructuary
// — actor/before_person/presented_person inclus par précaution, jamais vu
// inversés mais même risque en principe) plutôt que de corriger prédicat
// par prédicat à chaque nouvelle régression constatée. `describeAssertion`
// (frontend) mis à jour pareil pour deceased/heir/usufructuary (résolution
// par entity_type, comme déjà fait pour seller/buyer au 21ᵉ tour).
//
// Vingt-quatrième affinage (2026-08-11) : le signal de fréquence du 23ᵉ
// tour restait insuffisant — cette fois le sens sujet/objet était
// pourtant CORRECT (deceased/heir/usufructuary tous bien subject=event),
// mais Justin et Casimir Charbonné (deux vraies personnes) étaient quand
// même typés "event", parce qu'ils jouent chacun DEUX rôles dans la chaîne
// de succession (héritier de la succession d'Ernest ET défunt de leur
// propre succession) — un cas parfaitement naturel dans un acte à
// plusieurs générations, mais qui donne un compte de fréquence > 1 tout
// comme un event partagé. Signal de fréquence insuffisant à lui seul.
// Ajouté EN AMONT un signal plus fiable : `definitelyPerson`, calculé une
// fois sur `allRawAssertions` — une entité qui porte par ailleurs un fait
// qui ne peut s'appliquer qu'à un être humain (name/title/age/occupation/
// domicile/birth/death/spouse/father/mother/...) est une personne, quel
// que soit le nombre de rôles event qu'elle joue par ailleurs. Vérifié par
// simulation de la logique (pas juste un nouvel appel API coûteux) avant
// de considérer le correctif prêt à redéployer : Justin/Casimir/Ernest →
// person, les vrais events de succession (référencés par plusieurs
// personnes différentes) → event, sans régression sur aucun des deux cas.
//
// Vingt-cinquième affinage (2026-08-11) : critique externe détaillée sur le
// run Lacour à 149 assertions (24ᵉ tour), fait-vérifiée point par point
// contre la base réelle avant d'agir (voir mémoire agent
// project_extraction_module) — la quasi-totalité des points les plus
// graves s'est confirmée sur ce run précis, pas une lecture d'un run
// périmé : 0 birth_date, 2 "name" sur ~14 personnes nommées, 1 seul seller/
// 1 seul buyer sur une vente à ~10 parties, une entité dupliquée (P4b "Mme
// Duhald" séparée de P5 "Ernestine Isabelle CHARBONNE", la même personne),
// un label d'entité corrompu (P14 = un extrait de source_text tronqué à 60
// caractères au lieu d'un nom), marriage_time détourné pour stocker des
// années de mariage, administrative_area détourné pour la position d'une
// maison sur son terrain, deux act_date sur le même document pour deux
// phases distinctes de l'acte. Quatre extensions de doctrine tranchées
// explicitement par l'utilisateur (un "ok" par point, migration
// 20260811100001) :
//   1. entity_type "property" — distingue désormais un bien vendable
//      (terrain, maison...) d'un lieu géographique/administratif (place),
//      confondus jusqu'ici sous "place" (voir "L'entité property").
//   2. Prédicats promus depuis "other" (revient sur le report explicite du
//      14ᵉ affinage, désormais confirmé sur plusieurs actes) : authorizes,
//      marriage_date/marriage_place (marriage_time restreint à une
//      véritable heure), document_date/document_number/document_volume
//      (pour un document AUTRE que l'acte lui-même, ex. une décision
//      administrative citée), located_on (bien bâti -> bien/lieu qui le
//      porte, remplace le détournement d'administrative_area constaté).
//   3. Conflit de valeur (deux citations différentes donnant deux valeurs
//      qui se contredisent sur le même subject+predicate, ex. deux prix de
//      vente différents) : statut "conflicting" + conflict_group_id
//      (détection côté extraction.service.ts, pas dans cette fonction).
//   4. Deux phases d'un même acte (deux dates, deux formules d'ouverture
//      séparées) : modélisées en DEUX entités document (D1a/D1b) plutôt
//      que deux act_date sur une seule — nouvelle doctrine de prompt, pas
//      de changement de schéma.
// Plus une demande explicite indépendante des quatre ci-dessus : toutes les
// formes d'appellation d'une même personne (nom de naissance, nom d'épouse,
// "Mme X"...) doivent chacune porter leur propre assertion "name" citée —
// sert aussi de garde-fou contre le bug P4b/P5 (nouvelle entité créée par
// erreur pour une forme déjà rattachable à une entité existante). Le bug de
// label corrompu (P14) est traité par une règle de prompt renforçant
// l'obligation déjà existante de déclarer chaque local_key dans "entities"
// avec un vrai nom, pas un fait de code (le filet de récupération
// inferEntityLabel n'a pas changé, c'est un dernier recours, pas la
// correction de fond). L'incomplétude seller/buyer sur de longues
// énumérations reste la même limite de non-déterminisme déjà documentée
// (22ᵉ affinage) — reformulation plus insistante tentée (prompt principal +
// nouveau point (4)/(5) d'audit sur birth_date/formes de name), sans
// garantie que ça suffise à 100%.
//
// Vingt-sixième affinage (2026-08-11) : premier run réel après le 25ᵉ tour
// (114 assertions), à nouveau critiqué en externe et fait-vérifié en base
// avant d'agir (mémoire agent project_extraction_module). Un bug m'est
// imputable directement : la détection de conflit de valeur posée au 25ᵉ
// tour (extraction.service.ts) groupait par subject+predicate sans exclure
// les prédicats VOLONTAIREMENT multi-valeurs — "name" (la doctrine "toutes
// les formes d'appellation", ajoutée le même tour, produit exprès plusieurs
// assertions name par personne) et "reading" (plusieurs articles de loi lus
// séparément). Les 6 groupes "conflicting" du run testé étaient TOUS des
// faux positifs pour cette raison. Corrigé : `name`/`reading` exclus de
// `flagValueConflicts` (MULTI_VALUE_BY_DESIGN_PREDICATES).
// Deux vrais doublons d'entité confirmés (même classe que Mme Duhald au 25ᵉ
// tour, mais le modèle ne l'a pas généralisé) : une personne réapparue plus
// tard désignée par un lien relationnel plutôt que son nom (ex. "Joseph
// Georges" et "Joseph Georges (mari de Suzanne Charbonné)" comme deux
// entités séparées) et un lieu dupliqué par RÔLE plutôt que par nom (ex.
// "Deshaies" et "Deshaies (naissance)"). Doctrine renforcée aux deux
// endroits concernés ("toutes les formes d'appellation" et "L'entité
// place") avec ces exemples précis.
// Une citation exacte réutilisée pour deux personnes différentes a aussi
// été constatée (Pierre Ymanette et Joseph Georges avec le MÊME
// source_start/source_end pour birth_place) — pas corrigeable de façon
// fiable côté prompt seul (le modèle a déjà une règle "Preuve obligatoire"
// qu'il n'a pas suivie ici), donc traité côté code : nouveau garde-fou
// `flagDuplicateCitations` (extraction.service.ts) qui annote raw_relation
// d'un marqueur visible quand deux sujets différents partagent exactement
// les mêmes offsets pour le même prédicat, sans rejeter l'assertion (même
// doctrine que le garde-fou witness). Badge dédié dans `AssertionRow`
// (ExtractionPage.tsx).
// Régression NON traitée ce tour, décision explicite de l'utilisateur :
// seller/buyer/sale_price/authorizes/located_on/document_date/number/volume
// et toute entité "property" étaient TOTALEMENT absents de ce run (E1
// "Vente..." existe comme entité mais sans aucune relation vers elle) —
// pire que le run précédent (24ᵉ tour) qui avait au moins 1 seller/1 buyer.
// Cause inconnue (non-déterminisme déjà documenté vs prompt devenu trop
// long après 25 tours d'ajouts, diluant l'attention sur la section vente —
// les deux hypothèses sont plausibles, aucune tranchée). Décision : ne PAS
// modifier davantage le prompt sur ce point avant un nouveau run de test —
// voir si ça se reproduit avant de conclure à une vraie régression
// structurelle causée par ce module plutôt qu'à de l'instabilité normale.
//
// Vingt-septième affinage (2026-08-11) : nouveau run réel (274 assertions),
// troisième critique externe fait-vérifiée en base avant d'agir (mémoire
// agent project_extraction_module). Bonne nouvelle d'abord : la structure
// vente/succession absente au 26ᵉ tour (seller/buyer/sale_price/authorizes/
// located_on/property/D2) est REVENUE en entier sur ce run — confirme
// l'hypothèse "non-déterminisme normal" plutôt que "prompt trop long",
// aucun raccourcissement du prompt entrepris comme prévu.
// Mais nouveau bug qui m'est imputable : le garde-fou `flagDuplicateCitations`
// ajouté au 26ᵉ tour (liste noire implicite : tout partage d'offsets entre
// deux sujets = suspect) s'est révélé lui aussi bien trop bruyant — sur ce
// run, ~28 groupes détectés dont l'écrasante majorité étaient des citations
// LÉGITIMEMENT partagées (une seule phrase décrivant plusieurs personnes à
// la fois, ex. "tous deux cultivateurs", "ses cinq frères et soeurs
// légitimes" — exactement ce que la doctrine "chaque personne distincte a
// sa propre entité" demande de dupliquer). Retiré entièrement plutôt que
// rafistolé : remplacé par un correctif à la racine (voir recoverOffsets
// ci-dessous), plus fiable qu'un signal a posteriori difficile à distinguer
// du cas légitime.
// Même leçon pour `flagValueConflicts` (liste noire name/reading posée au
// 26ᵉ tour) : encore insuffisante, heir (plusieurs héritiers d'un même
// event) et boundary (plusieurs tenants d'un même bien) se sont aussi
// révélés être de faux positifs. Plutôt que de continuer à découvrir les
// prédicats multi-valeurs un par un à chaque nouveau faux positif (3ᵉ
// itération de cette même faille), retourné en liste BLANCHE
// (CONFLICT_DETECTABLE_PREDICATES, extraction.service.ts) : seuls les
// prédicats qui représentent un fait UNIQUE attendu (sale_price, birth_date,
// act_date...) déclenchent la détection — tout le reste (rôles/relations,
// par nature répétables) en est exclu par défaut.
// Vrai bug de code trouvé et corrigé à la racine : `recoverOffsets`
// choisissait la PREMIÈRE occurrence globale de source_text dans le texte
// (`text.indexOf` simple) — dangereux sur un acte qui répète beaucoup de
// formules courtes entre personnes différentes ("cultivateur", "marin
// pêcheur", "demeurant à Deshaies où il est né"...). Constaté réellement :
// l'occupation de Joseph Georges (~caractère 1633) récupérait l'offset de
// la première occurrence du texte, qui appartenait à Philippe Duhald (~478).
// Corrigé : quand Claude fournit un offset (même incorrect), c'est un
// indice fiable de la ZONE concernée — `recoverOffsets` choisit désormais
// l'occurrence de source_text la plus PROCHE de cet offset original plutôt
// que la première du document (`findAllOccurrences` + distance minimale).
// Deux bugs supplémentaires trouvés et corrigés :
//   - Doublon en sens inversé au sein d'un MÊME run (pas seulement d'un run
//     à l'autre comme aux tours 21-24) : "Andrésine -- seller --> [event]"
//     ET "[event] -- seller --> Andrésine" produites toutes les deux avec
//     la même citation exacte — la déduplication ne les voyait pas comme
//     doublon car sa clé ne comparait que "subject". `canonicalAssertionKey`
//     utilise désormais une paire (sujet, objet) TRIÉE pour les prédicats
//     EVENT_ROLE_PREDICATES, insensible au sens (cohérent avec
//     describeAssertion/sideByType qui résout déjà par entity_type réel).
//   - `source_text` contenant un "..." fabriqué (ex. pour relier deux
//     passages non contigus) — viole "Preuve obligatoire" (citation exacte
//     requise). `recoverOffsets` échouait déjà silencieusement à les
//     localiser (offsets restant null), mais l'assertion restait quand même
//     enregistrée avec une preuve inventée. Rejetée explicitement dans
//     `validateAssertions`.
// Deux ajouts de doctrine (pas de nouveau prédicat) : le predicate "name"
// est désormais explicitement réservé aux entités "person" (bug constaté :
// "Pineau"/"Richard", un chemin, avaient reçu une entité "person" avec un
// "name" — le label d'un lieu/bien vit dans "entities", pas dans une
// assertion "name") ; et consigne explicite de produire un sale_price PAR
// montant réellement énoncé quand le texte en donne plusieurs (prix
// corrigé/précisé plus loin dans l'acte) plutôt que d'en garder un seul
// silencieusement — le mécanisme "conflicting" existe justement pour ça,
// mais ne peut rien détecter si une seule des deux valeurs est produite.
// Point non résolu, connu, pas retouché ce tour (déjà documenté aux tours
// 9-10-25-26, non-déterminisme du modèle sur l'obligation de déclarer
// proprement chaque entité) : labels d'entité corrompus (place/person avec
// un extrait de source_text ou une clause descriptive comme label au lieu
// d'un nom) constatés à nouveau sur ce run (L1/L2/P8) malgré la
// réaffirmation de la règle au 26ᵉ tour.
//
// Vingt-huitième affinage (2026-08-11) : nouveau run réel (330 assertions),
// cinquième critique externe fait-vérifiée en base (mémoire agent
// project_extraction_module). Bonne nouvelle : le conflit de prix
// fonctionne maintenant parfaitement (3 montants — 16000/16100/16100 —
// correctement regroupés en un seul conflict_group_id, confirme le passage
// en liste blanche du 27ᵉ tour). Trois bugs réels corrigés :
//   1. `spouse` ET `widowhood` produits ENSEMBLE sur la MÊME citation qui ne
//      parle que de veuvage ("veuve de M. X") — constaté 5 fois sur ce seul
//      run, systématique, alors que la doctrine l'interdit déjà
//      explicitement depuis le 4ᵉ affinage ("spouse suppose un mariage EN
//      COURS, JAMAIS à partir d'un texte qui dit veuf/veuve seul"). Le
//      prompt seul ne suffit pas — nouveau garde-fou côté CODE
//      (`isSpouseFromWidowhoodOnlyText`, extraction.service.ts, même
//      doctrine que `hasWitnessEvidence` du 7ᵉ affinage) : reclasse
//      "spouse" en "other" si sa citation ne contient un marqueur de
//      veuvage SANS marqueur de mariage en cours (épouse/époux/mari).
//   2. `comparant` produit à tort pour une personne (Justin Charbonné)
//      mentionnée seulement dans le récit historique d'une succession
//      ANTÉRIEURE (1930), pas dans la liste des parties qui comparaissent
//      réellement à l'acte de vente courant (1944/1945) — confusion de
//      PORTÉE documentaire (deux "moments" du texte traités comme un seul).
//      Nouvelle section de doctrine : comparant/declarant réservés aux
//      personnes dont le texte établit EXPLICITEMENT qu'elles comparaissent
//      À L'ACTE COURANT, pas à quiconque nommé au fil d'un récit historique.
//   3. `recoverOffsets` (corrigé à la racine au 27ᵉ tour pour choisir
//      l'occurrence la plus proche d'un indice) recourait encore à la
//      première occurrence par défaut quand Claude ne fournissait AUCUN
//      indice d'offset du tout ET que la citation était ambiguë (plusieurs
//      occurrences) — exactement le bug qu'on venait de corriger, dans le
//      cas particulier où aucun indice n'existe pour le résoudre. Corrigé :
//      dans ce cas précis (aucun indice + ambiguïté réelle), les offsets
//      restent `null` plutôt que de deviner — un surlignage absent est plus
//      honnête qu'un surlignage qui prétend à tort être la bonne preuve.
// Point sérieux repéré mais PAS corrigé ce tour, nécessite une décision
// utilisateur avant d'y toucher (voir mémoire agent
// project_extraction_module) : une contamination de coréférence où une
// forme de nom est rattachée à la MAUVAISE personne déjà existante (ex.
// "1° - Mme Duhald" — qui devrait identifier Ernestine — attribué à
// Andrésine à la place) — plus grave qu'un doublon d'entité, ça mélange les
// faits de deux personnes réelles distinctes. Pas de garde-fou de code
// simple identifié (contrairement à spouse/widowhood, aucun marqueur
// textuel fiable ne permet de détecter ce cas générique). Labels de lieu
// toujours corrompus (L1/L2/L3), non retouché (déjà décidé au 27ᵉ tour).
//
// Vingt-neuvième affinage (2026-08-11) : nouveau run réel (septième critique
// externe fait-vérifiée en base, mémoire agent project_extraction_module).
// La coréférence Charbonné (Mme Duhald/Coqueran/Napolin) tient enfin bien —
// signe que le renforcement du 25ᵉ-27ᵉ tour finit par se stabiliser sur ce
// point précis, même si ça reste non garanti à 100%. Quatre corrections :
//   1. Effet de bord de mon propre garde-fou spouse/widowhood (28ᵉ tour) :
//      l'assertion "spouse" rejetée était reclassée en "other" avec le
//      MESSAGE DE VALIDATION comme raw_relation ("spouse (rejeté : ...)")
//      — stocké tel quel comme si c'était un fait documentaire, visible
//      dans le graphe d'assertions. Corrigé : l'assertion est désormais
//      SUPPRIMÉE entièrement (pas reclassée) — différent du garde-fou
//      witness (qui reste "other" visible car un rejet peut être un faux
//      négatif à corriger à la main) parce qu'ici le rejet n'est jamais un
//      faux négatif : la doctrine interdit spouse+widowhood sur la même
//      citation sans exception, donc rien d'utile n'est perdu en
//      supprimant — SAUF que l'objet (qui est le conjoint) était perdu
//      avec elle, d'où le point 2.
//   2. `widowhood` n'avait JAMAIS d'"object" alors que le conjoint décédé
//      est explicitement nommé dans la citation ("veuve de Monsieur Alfred
//      DESBONNES" → object resté null) — aucune règle de prompt ne le
//      demandait explicitement (contrairement à "spouse", qui a toujours eu
//      cette consigne). Ajoutée : "widowhood" doit porter "object" comme
//      "spouse" quand le conjoint est identifiable.
//   3. Erreur de résolution de pronom trouvée : "qu'il autorise" dans "M.
//      NAPOLIN et Mme CHARBONNE, son épouse, qu'il autorise" a donné pour
//      subject Pierre LACOUR (le notaire) au lieu de M. NAPOLIN (le mari
//      immédiatement antécédent) — doctrine "authorizes" complétée avec un
//      avertissement explicite sur ce cas précis, formule répétée une fois
//      par couple dans l'acte donc à résoudre séparément à chaque fois.
//   4. Bug de CODE trouvé : "L4" (un chemin) déclaré entity_type "person"
//      malgré son propre préfixe "L" qui le contredit directement — la
//      convention de préfixe (P/D/L/E, maintenant complétée avec PR pour
//      property, jusqu'ici absente de la doctrine alors que le type
//      "property" existe depuis le 25ᵉ tour) est une règle EXPLICITE que le
//      modèle est censé suivre, donc un local_key qui la contredit
//      lui-même est un signal fiable à 100% — pas une heuristique comme le
//      reste d'inferEntityType. Nouveau garde-fou déterministe
//      (PREFIX_TYPE_OVERRIDES) qui corrige silencieusement l'entity_type
//      d'après le préfixe du local_key, en dernière étape avant de renvoyer
//      la réponse.
// Point observé mais pas corrigé (design, pas un bug net) : la critique
// juge discutable de créer une entité "person" (P17 "Gouverneur de la
// Guadeloupe") pour une fonction sans nom propre donné — argument valable
// mais pas tranché, un gouverneur reste une vraie personne ayant accompli
// un acte réel même non nommé ; pas d'action sans decision explicite de
// l'utilisateur. Un seul des deux acquéreurs autorisés par le Gouverneur
// (Ymanette, pas Valluet) — même classe de bug que l'incomplétude seller/
// buyer déjà documentée (22ᵉ tour), pas de nouveau garde-fou dédié.
//
// Trentième affinage (2026-08-11) : huitième critique externe sur ce même
// acte, fait-vérifiée en base (mémoire agent project_extraction_module) —
// confirme que widowhood.object, la résolution "qu'il autorise" et D2 (29ᵉ
// tour) tiennent bien sur ce nouveau run. Trois corrections :
//   1. `name` dont la citation ne contient AUCUN mot de la valeur affirmée —
//      constaté réellement : "Joseph GEORGES -- name --> 'M. Georges
//      Joseph'" avec source_text = "aussi comparant" (ne contient
//      littéralement pas le nom). Même famille que le rejet du "..."
//      fabriqué (27ᵉ tour) — nouveau garde-fou `nameValueHasEvidence` dans
//      `validateAssertions`, testé contre toutes les assertions "name" du
//      run qui a révélé le bug avant d'être retenu (un seul cas flagué, le
//      bon, aucun faux positif).
//   2. `E1 -- actor --> Andrésine` produit EN PLUS de `E1 -- seller -->
//      Andrésine` — redondance pure, "actor" n'apporte rien qu'un rôle déjà
//      plus précis (seller) ne couvre pas. L'exception anti-redondance
//      posée pour presentation/naming_declaration (5ᵉ/6ᵉ affinage) était
//      trop étroite — généralisée à "actor" vs tout rôle event plus
//      spécifique (seller/buyer/deceased/heir/usufructuary).
//   3. Contrôle de cohérence temporelle ajouté : une personne déjà établie
//      décédée (fait death/death_date produit ailleurs) ne peut PAS être
//      comparant/declarant/signs/present/consent à l'acte courant — sert
//      aussi à corriger le vrai mécanisme derrière le bug ci-dessus (une
//      désignation ambiguë comme "aussi comparant" doit se résoudre vers un
//      AUTRE référent, typiquement le conjoint survivant mentionné juste
//      avant, jamais vers la personne déjà décédée). Point signalé par la
//      critique (Suzanne Charbonné) mais NON reproduit sur ce run précis en
//      base — règle ajoutée quand même car logiquement saine et peu
//      coûteuse, pas seulement pour ce cas isolé.
// Labels d'entité corrompus (place/property/event, 27ᵉ-30ᵉ tours) : après
// 3 renforcements de doctrine sans effet mesurable, question posée
// explicitement à l'utilisateur (needs_review en base vs accepter comme
// limite connue) — réponse : tenter une dernière fois, mais PAS un 4ᵉ
// paragraphe de prompt (rendements manifestement décroissants). Deux
// paliers de repli basés sur des SIGNAUX STRUCTURÉS plutôt que sur du texte
// libre, ajoutés à `inferEntityLabel` (voir plus bas dans ce fichier) :
// un "event" avec un "deceased" identifié se voit synthétiser "Succession
// de {label de cette personne}" (fiable à 100%, donnée déjà structurée) ;
// un "place" sans déclaration propre tente d'extraire un nom propre
// capitalisé plausible du source_text COMPLET (pas tronqué à 60 avant la
// recherche) avant de retomber sur l'ancien comportement. Volontairement
// PAS appliqué à "property" (un bien n'a généralement pas de nom propre à
// lui — deviner un nom de lieu voisin serait pire qu'un extrait honnête).
// Bug trouvé et corrigé DANS ce correctif lui-même avant redéploiement,
// même discipline que le 24ᵉ affinage (simulation de la logique avant de
// considérer un correctif prêt) : la regex initiale perdait le second
// segment des noms à trait d'union ("Basse-Terre" → "Basse-" seul) parce
// que le trait d'union était inclus dans la classe de caractères du
// premier groupe (glouton, l'absorbait avant que le groupe de continuation
// puisse s'en servir comme séparateur) — corrigé en retirant le trait
// d'union de cette classe, ne le laissant que dans le séparateur entre
// segments. Revérifié sur les 5 cas réels rencontrés dans cette session
// (Basse-Terre, Sainte-Rose, Deshaies, Pineau, Saint-Pierre) avant
// redéploiement.
// Proposition de la critique explicitement PAS suivie : réduire les
// assertions "name" à une seule forme canonique par personne (+ un
// mécanisme "alias" séparé) — contredit directement la doctrine "toutes les
// formes d'appellation" posée au 25ᵉ affinage sur demande EXPLICITE de
// l'utilisateur ; pas un bug, un choix délibéré déjà tranché, pas remis en
// cause sans nouvelle demande explicite.

import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5'
const EXTRACTOR_VERSION = '1.0.0'
const PROMPT_VERSION = '2026-08-10.1'

// Vocabulaire présenté à l'agent en quatre couches (aide le modèle à
// raisonner, correspond au découpage du référentiel côté base) :
// 1. faits stables sur une personne, 2. actions documentaires, 3.
// caractéristiques du document/du contexte, 4. relations d'événement.
// "time", "section" et "hamlet" sont volontairement absents (dépréciés —
// "time" remplacé par les heures spécialisées, "section"/"hamlet" par
// "quality" pour décrire la nature d'un lieu, une seule logique retenue).
//
// marital_regime/area/boundary (person_facts), seller/buyer/deceased/heir/
// usufructuary/sale_price (event_relations), registration_* (document_context)
// ajoutés le 2026-08-10 pour les actes hypothécaires/notariés — DANS le même
// référentiel, pas un référentiel séparé (voir avis explicitement demandé et
// tranché, mémoire agent project_extraction_module) : même doctrine
// d'extension incrémentale déjà appliquée 3 fois à entity_type
// (person -> document -> place -> event). Strictement additif, un acte
// d'état civil n'utilisera jamais ces nouveaux codes.
const PREDICATE_LAYERS = {
  person_facts: [
    'name', 'sex', 'age', 'title', 'quality', 'occupation', 'residence', 'domicile',
    'nationality', 'marital_status', 'widowhood', 'marital_regime',
    'birth', 'birth_date', 'birth_time', 'birth_place',
    'death', 'death_date', 'death_time', 'death_place',
    'marriage_time', 'marriage_date', 'marriage_place',
    'father', 'mother', 'spouse', 'child', 'sibling', 'relative', 'neighbor', 'friend',
    'witness', 'comparant', 'declarant', 'officer_role', 'function', 'authorizes',
    'area', 'boundary', 'located_on',
  ],
  documentary_actions: [
    'presentation', 'naming_declaration', 'declares', 'present', 'absent',
    'consent', 'opposition', 'publication', 'document_presented',
    'signs', 'cannot_sign', 'is_asked_to_sign', 'recognition',
  ],
  // reading vit ici, pas dans documentary_actions : sujet = l'entité
  // document, jamais la personne qui lit/reçoit lecture (voir "L'entité
  // document" plus bas — déjà la règle depuis le départ, seul le
  // classement dans cette couche ne le reflétait pas explicitement au
  // modèle, cf. affinage 2026-08-10).
  document_context: [
    'act_date', 'act_place', 'act_time', 'document_type', 'administrative_area', 'reading',
    'registration_date', 'registration_place', 'registration_volume', 'registration_folio', 'registration_number',
    'document_date', 'document_number', 'document_volume',
  ],
  event_relations: [
    'actor', 'before_person', 'presented_person', 'present_at',
    'seller', 'buyer', 'deceased', 'heir', 'usufructuary', 'sale_price',
  ],
  fallback: ['other'],
}
const CONTROLLED_PREDICATES = [
  ...PREDICATE_LAYERS.person_facts,
  ...PREDICATE_LAYERS.documentary_actions,
  ...PREDICATE_LAYERS.document_context,
  ...PREDICATE_LAYERS.event_relations,
  ...PREDICATE_LAYERS.fallback,
]

const SYSTEM_PROMPT = `Tu es un extracteur documentaire pour des actes déjà transcrits manuellement — actes d'état civil (naissance, mariage, décès, reconnaissance...) ou actes hypothécaires/notariés (vente, succession, inscription...).

## Objectif
Décomposer la transcription en assertions atomiques. Une assertion = un seul fait. Ton objectif n'est pas seulement l'extraction de faits "utiles" : c'est une décomposition quasi exhaustive du texte en unités sémantiques atomiques, y compris les formules administratives, les titres de civilité, les modalités de déclaration, les interactions procédurales et les qualifications de lieux.

Une assertion documentaire atomique est la représentation minimale d'une information explicitement portée par la transcription, quelle que soit sa valeur généalogique. L'ensemble des assertions doit permettre de reconstruire sémantiquement presque tout ce que le document affirme, sans ajouter d'information extérieure. Le "presque" concerne uniquement les éléments purement grammaticaux (articles, conjonctions, ponctuation) qui n'ajoutent aucun sens documentaire.

Parcours la transcription de gauche à droite. Pour chaque groupe de mots porteur d'information, vérifie qu'au moins une assertion en conserve le contenu. N'ignore aucune information sous prétexte qu'elle est administrative, stylistique, sociale, procédurale, redondante ou apparemment sans intérêt généalogique — titres ("sieur", "dame"), qualificatifs de lieu ("hameau", "section"), formules procédurales ("interpellé de signer", "lecture donnée"), présence à plusieurs étapes d'un même acte (déclaration ET présentation si les deux sont nommées) sont tous des faits documentaires à part entière.

## Conventions de mise en forme du texte transcrit — à interpréter, pas à reproduire
Le texte fourni n'est pas un texte brut neutre : le transcripteur y a reproduit fidèlement des éléments de mise en forme réellement présents dans l'acte original (pas de la décoration ajoutée après coup). Quatre conventions, toutes en Markdown :
- **\`**mot**\`** (gras) : le mot était mis en évidence dans l'acte original (ex. un patronyme souligné/mis en gras par le scribe — convention fréquente pour le rendre repérable). N'extrais pas le fait "ce mot est en gras" en tant que tel — ce n'est pas une assertion à part entière — mais garde en tête que le gras désigne souvent le terme que le scribe jugeait le plus important à retrouver (typiquement un nom de famille), utile pour lever une ambiguïté de lecture si le texte est par ailleurs difficile à interpréter.
- **\`~~mot~~\`** (barré) : le mot ou le passage était rayé/raturé dans l'acte original — une correction du rédacteur, pas le texte finalement retenu par l'acte. N'utilise PAS un passage barré comme source d'un fait normal (ex. n'extrais pas un nom barré comme le nom réel de la personne). Si la rature elle-même semble notable (ex. elle révèle qu'un nom ou une date a été corrigé), tu peux la signaler via "other" (ex. raw_relation = "nom initialement écrit rayé et corrigé"), mais ce n'est pas obligatoire — ne force pas une assertion sur chaque rature mineure.
- **\`# \`, \`## \`, \`### \`** en début de ligne (titre, sous-titre) : une ligne de titre telle qu'elle apparaît dans l'acte (ex. un intitulé de section). Traite-la comme le texte qu'elle contient, replacé dans son contexte — le niveau de titre n'a pas de règle d'extraction dédiée, c'est juste une indication de structure.
- **\`[passage non transcrit]\`** (texte littéral, sans astérisque ni tilde) : n'est PAS du texte de l'acte — c'est un repère posé par le transcripteur pour signaler un passage qu'il n'a délibérément pas retranscrit (illisible, omis...). N'en déduis RIEN, ne le cite jamais comme "source_text", et ne comble pas la lacune par supposition.

Pour "source_text", cite le texte tel qu'il apparaît RÉELLEMENT dans la transcription fournie (les caractères \`**\`/\`~~\`/\`#\` en font partie s'ils encadrent le passage cité) — ne les retire pas et ne les ajoute pas de ton propre chef.

## Atomicité stricte — éclate les listes composées
Si une valeur contient plusieurs éléments coordonnés par "et", une virgule ou une énumération, produis une assertion DISTINCTE par élément, sauf si l'expression forme un syntagme figé insécable.

Mauvais : occupation = "maçon et propriétaire" (une seule assertion).
Bon : occupation = "maçon" (une assertion) + quality = "propriétaire" (une autre assertion) — "propriétaire" est un statut, pas un métier, utilise "quality" pas "occupation" pour ce genre de statut. RESTE COHÉRENT sur toute ta réponse : si tu as déjà classé "propriétaire" en "quality" une fois dans cette extraction, ne le reclasse jamais en "occupation" ailleurs pour la même ou une autre personne — les statuts (propriétaire, rentier...) ne sont jamais un métier même quand ils apparaissent seuls sans "et".

Mauvais : officer_role = "Adjoint au Maire, délégué aux fonctions d'officier de l'état civil" (une seule assertion agrégée).
Bon : function = "adjoint au maire" + officer_role = "délégué aux fonctions d'officier de l'état civil" (deux assertions séparées).

## Désignations contextuelles — pas des qualités stables
Une expression qui désigne quelqu'un par son rôle DANS CET ACTE PRÉCIS ("l'autre témoin", "ledit comparant", "le premier témoin") n'est pas une qualité stable de la personne (contrairement à "sieur", "propriétaire", qui la décrivent indépendamment de cet acte) — c'est une désignation contextuelle. Ne l'utilise PAS comme "title" ou "quality". Range-la dans "other" avec "raw_relation" décrivant la désignation (ex. raw_relation = "désigné comme l'autre témoin").

ATTENTION à ne pas sur-appliquer cette règle : si la désignation correspond à un rôle que tu as DÉJÀ exprimé pour cette personne via un prédicat contrôlé dédié (ex. "le père" quand cette personne a déjà "father"/"declarant"/"comparant" ; "les témoins" quand ces personnes ont déjà "witness"), NE PRODUIS PAS en plus une assertion "other" du type "désigné comme le père"/"désigné comme témoin" — ce serait reformuler un fait déjà établi, pas en capturer un nouveau (même principe que pour les events et "declares" : un fait, une seule assertion). Si le passage où apparaît cette désignation révèle un fait réellement nouveau (ex. "le père et les témoins signé avec nous" révèle qu'ILS SIGNENT, pas juste qui ils sont), produis ce fait nouveau avec le prédicat approprié (ex. "signs" sur chacun) — ne produis PAS la désignation de rôle elle-même en plus. Exemple concret : sur "et ont, le père et les témoins signé avec nous", si le père et les témoins sont déjà identifiés par ailleurs (father/declarant, witness), produis uniquement "signs" pour chacun des trois (père, témoin 1, témoin 2) ; ne produis PAS "désigné comme le père" ni "désigné comme témoin" en plus.

## "other" sert aussi à ne pas perdre un détail sans prédicat dédié
Ne laisse jamais tomber un détail explicite sous prétexte qu'aucun prédicat de la liste ne lui correspond exactement — utilise "other" + "raw_relation" plutôt que de l'omettre. Exemple : le texte dit qu'un enfant est né "dans sa maison" (la maison du déclarant, pas juste la commune/section) — en plus du birth_place vers le lieu (commune/section), produis : subject = l'enfant, predicate = "other", raw_relation = "né dans la maison du déclarant", object = la personne dont c'est la maison (si elle est identifiable sans ambiguïté). Ce sont des candidats naturels à un futur prédicat dédié si ce motif revient souvent sur d'autres actes — pas la peine d'en créer un dès maintenant pour un seul cas.

## Le fait brut accompagne toujours le fait daté/localisé
Dès que le texte mentionne explicitement qu'une personne est née, décédée ou mariée, produis TOUJOURS l'assertion brute correspondante (birth / death) EN PLUS des assertions birth_date/birth_time/birth_place (ou death_date/death_time/death_place) — ce sont deux faits distincts, pas un seul. "né le deux du courant" donne à la fois birth (le fait) ET birth_date = la date. N'omets jamais le fait brut sous prétexte que la date/le lieu le rendent déjà implicite.

## Une assertion doit rester compréhensible seule, sans consulter une autre assertion
"naming_declaration" (et plus généralement tout prédicat qui rapporte une déclaration/décision avec un contenu précis) doit TOUJOURS porter ce contenu dans "value_text" — même si ce même contenu existe déjà par ailleurs sous une autre assertion (ex. le prénom donné à l'enfant existe aussi via un "name" sur l'entité enfant). Ce n'est pas une duplication interdite par la règle de non-redondance des events : "name" établit l'identité de l'enfant, "naming_declaration" établit l'ACTE du déclarant — deux faits distincts sur deux sujets différents, chacun doit être lisible indépendamment de l'autre. Ne laisse JAMAIS "value_text" vide sur une assertion dont le prédicat implique une valeur précise (une déclaration de prénom sans le prénom, une "declares" sans ce qui est déclaré, etc.) — remplis-le, ou choisis un prédicat qui n'a pas besoin de valeur si vraiment aucune n'est disponible.

## L'entité document — très important
L'acte lui-même est une entité, au même titre que les personnes qu'il mentionne : crée une entité de type "document" (ex. local_key "D1", label descriptif comme "Acte de naissance de Blaise Gustave").

TOUS les faits qui concernent l'acte en tant qu'écrit — sa date, son lieu et son heure de rédaction (act_date/act_place/act_time), son type (document_type), le fait qu'il ait été lu aux comparants (reading) — doivent avoir l'entité document comme "subject", JAMAIS l'officiant qui le signe ni aucune autre personne. "Valluet a pour date de rédaction le 10 février 1875" est FAUX ; "L'acte est daté du 10 février 1875" (subject = D1) est correct. L'officiant reste sujet de ses propres faits personnels : son nom, sa fonction, son rôle d'officier, le fait qu'il signe.

ATTENTION à ne pas confondre le lieu de rédaction de l'acte (act_place) avec un lieu mentionné DANS LE RÉCIT d'un événement concernant une personne (où quelqu'un est né, décédé, domicilié...). Si une commune est nommée dans le passage qui décrit la naissance d'un enfant (même par une expression comme "en notre commune"), c'est un birth_place de cette personne, pas un act_place du document, même si la commune est la même que celle de l'acte.
RÈGLE MÉTIER OFFICIELLE, DÉFINITIVE (ne la remets plus en question) : la formule de préambule "officier de l'état civil de la commune de X" (ou équivalent) établit UNIQUEMENT la circonscription/juridiction de l'officier — ce n'est PAS le lieu de rédaction de l'acte, même par convention. Ne produis JAMAIS act_place à partir de cette seule formule. Produis à la place : l'officiant (P1) -- administrative_area --> l'entité place de cette commune (ex. "Valluet -- administrative_area --> Deshayes"), avec pour source_text la formule littérale. act_place ne s'utilise QUE si le texte affirme SÉPARÉMENT et explicitement, par une formule distincte de rédaction/clôture ("fait et rédigé à X", "passé en la maison commune de X"...), où l'acte est matériellement dressé — ce qui est rare. Si aucune formule de ce type n'existe dans le texte, ne produis PAS d'act_place du tout : ce n'est pas une omission, c'est le résultat correct.

## L'entité place (lieux)
Quand un lieu nommé (commune, section, hameau, lieu-dit) est mentionné et qu'il porte lui-même des faits (ex. "Caféyère" est à la fois une section ET un hameau, et se situe dans la commune de Deshayes), crée une entité de type "place" pour lui (ex. local_key "L1", label le nom du lieu) plutôt que de répéter le nom en texte libre dans chaque assertion. Relie ensuite les faits sur ce lieu avec ce lieu comme "subject", TOUJOURS via "quality" pour décrire sa nature (ex. L1 -- quality --> "section", L1 -- quality --> "hameau") — une seule logique, ne mélange jamais avec d'autres prédicats pour le même genre de fait. "section" et "hamlet" ne sont PAS dans le vocabulaire contrôlé, ne les utilise pas. Utilise "administrative_area" uniquement pour relier ce lieu à la circonscription/commune qui le contient (ex. L1 -- administrative_area --> L2 où L2 est l'entité place de la commune). Les autres assertions (ex. birth_place d'une personne) peuvent alors référencer ce lieu comme "object" plutôt que de dupliquer le nom en value_text — mais value_text reste acceptable pour un lieu mentionné une seule fois sans fait propre à en dire. N'invente pas de hiérarchie géographique au-delà de ce que le texte affirme explicitement.

ATTENTION à ne pas fusionner à tort deux lieux emboîtés qui portent des NOMS DIFFÉRENTS en une seule entité. L'exemple "Caféyère" ci-dessus fonctionne parce que la section et le hameau partagent le MÊME nom (le texte source dit littéralement "hameau de ce nom", donc c'est réellement un seul lieu qui cumule deux qualités). Si le texte donne un nom distinct à chaque niveau (ex. "section Pineau, hameau Richard" — Pineau ≠ Richard), ce sont DEUX lieux différents, PAS un seul : crée une entité par nom (ex. L1 "Pineau" -- quality --> "section", L2 "Richard" -- quality --> "hameau"), et relie-les par emboîtement réel via administrative_area (le hameau est dans la section, qui est dans la commune : L2 -- administrative_area --> L1, L1 -- administrative_area --> L3 où L3 est l'entité place de la commune) plutôt que de créer un label fabriqué du type "Section Pineau, hameau Richard" qui n'existe pas tel quel dans le texte. Vérifie donc systématiquement, avant de fusionner deux qualités sur le même local_key, que le nom associé à chaque qualité est bien identique.

Un même lieu réel mentionné PLUSIEURS fois dans l'acte pour des rôles différents (ex. la commune où quelqu'un est né, ET la commune où l'acte est dressé, ET la commune de domicile d'une autre personne) reste UNE SEULE entité place s'il s'agit du même nom — NE CRÉE PAS une entité par rôle (ex. "Deshaies" pour un birth_place et "Deshaies (naissance)" comme entité séparée pour un autre birth_place). Le rôle est porté par le PRÉDICAT de l'assertion qui pointe vers ce lieu (birth_place, domicile, act_place...), jamais par le label ou l'existence même de l'entité. Avant de créer une nouvelle entité place, vérifie toujours si son nom correspond déjà à une entité existante dans "entities" ; si oui, réutilise son local_key.

## L'entité property (biens) — distincte de l'entité place
Un BIEN précis (un terrain, une portion de terre, une parcelle, une maison, un immeuble) qui fait l'objet d'une vente, d'une succession ou porte ses propres faits (superficie, bornage, prix) est une entité de type "property", PAS "place". La distinction : "place" sert aux lieux géographiques/administratifs qui SITUENT (commune, section, hameau, lieu-dit, chemin, rivière — la circonscription ou la voie), "property" sert aux biens qui se VENDENT ou se TRANSMETTENT (terrain, portion de terre, parcelle, maison, immeuble). Même logique de fond que "L'entité place" ci-dessus (une entité par nom, un fait "quality" obligatoire pour sa nature — "terrain", "maison"...), seul le type change.

Un bien bâti (maison, immeuble) situé sur un autre bien ou lieu (le terrain qui le porte) se relie via "located_on" : subject = le bien bâti, object = le bien/lieu sur lequel il est situé (ex. "Petite maison -- located_on --> Portion de terre vendue", source_text = "y édifiée"). NE réutilise PAS "administrative_area" pour cette relation — administrative_area sert exclusivement au rattachement JURIDICTIONNEL (une commune contient une section), pas à la position PHYSIQUE d'un bâtiment sur une parcelle, qui sont deux faits de nature différente.

## L'entité event — DOCTRINE : à utiliser avec parcimonie, pas pour tout
Les entités event sont un outil pour les cas complexes, PAS le mode par défaut. Deux options :
1. Un fait à un seul acteur, sans autre participant à relier (ex. "Bourdin signe", "Valluet signe") → utilise UNIQUEMENT le prédicat direct sur la personne (signs, comparant...). NE CRÉE PAS d'entité event pour ça, même si plusieurs personnes ont chacune leur propre fait simple (ex. Bourdin ET Valluet signent : DEUX assertions "signs" séparées, pas un event partagé). Le fait qu'il ait été donné lecture de l'acte suit une règle à part : "reading" a TOUJOURS pour sujet l'entité document (D1), jamais la personne qui lit ou reçoit lecture, même si une seule personne est concernée — voir "L'entité document".
2. Une action avec plusieurs rôles distincts à relier entre eux (qui agit, qui est concerné, devant qui, qui d'autre est présent) → LÀ crée une entité event, avec local_key "E1", "E2"... et label descriptif (ex. "Présentation de l'enfant"). Cas typique : une présentation où il faut relier l'acteur, la personne présentée, l'officiant devant qui ça se passe, ET les témoins seulement présents.

Le predicate "name" est réservé EXCLUSIVEMENT aux entités de type "person" — jamais à un lieu, un bien ou un document, même quand le texte semble leur donner un "nom propre" (ex. le nom d'un chemin, "Pineau" ou "Richard"). Pour un lieu/bien/document, son nom réel est porté par son "label" dans le tableau "entities" (déclaré une seule fois à sa création), pas par une assertion "name" séparée. Si tu hésites entre créer une entité "person" ou "place"/"property" pour quelque chose que le texte nomme, tranche d'abord par sa NATURE (une personne physique vs un lieu/bien) — ne te laisse pas guider par la présence d'un nom propre, les lieux en ont aussi.

Utilise ces prédicats event (uniquement dans le cas 2 ci-dessus) :
- actor : subject = event, object = la personne qui accomplit l'action.
- before_person : subject = event, object = la personne devant qui l'action a lieu (typiquement l'officiant).
- presented_person : subject = event, object = la personne présentée (cas d'une présentation).
- present_at : subject = personne, object = event — une personne présente lors de cet événement.

Exemple : "Némorin... nous a présenté un enfant... en présence des sieurs Bourdin et Alcibiade" donne, en plus des assertions habituelles sur Némorin/l'enfant : une entité event E2 "Présentation de l'enfant" ; E2 -- actor --> Némorin ; E2 -- presented_person --> l'enfant ; E2 -- before_person --> l'officiant (si déjà identifié) ; Bourdin -- present_at --> E2 ; Alcibiade -- present_at --> E2.

NE FUSIONNE PAS deux actions nommées séparément dans le texte en une seule entité event, même si elles s'enchaînent ou partagent les mêmes participants. Si le texte dit "déclaration et présentation", ce sont DEUX actions distinctes : crée une entité event pour la présentation (avec actor/presented_person/before_person) ET, séparément si elle a elle aussi plusieurs rôles à relier, une autre pour la déclaration — ne les regroupe pas sous un seul "E3 = déclaration et présentation". Si un témoin est présent aux deux, produis deux assertions present_at distinctes (une par événement), pas une seule vers une entité fusionnée.

Les entités event COMPLÈTENT les prédicats de rôle existants (comparant, declarant, witness, signs, reading...), elles ne les remplacent PAS : quand tu crées un event pour une action, garde aussi le prédicat de rôle direct sur son acteur principal si un prédicat dédié existe (ex. l'acteur d'une présentation reste aussi "declarant" si le texte le qualifie ainsi par ailleurs).

EXCEPTION — ne duplique pas un prédicat d'action qui redit EXACTEMENT ce que l'event exprime déjà avec son object. Si tu crées "E1 -- presented_person --> Blaise" ET "E1 -- actor --> Némorin", c'est déjà l'équivalent complet de "Némorin -- presentation --> Blaise" : ne produis PAS en plus cette assertion "presentation" sans objet sur Némorin, ce serait la même information stockée deux fois sous deux formes. Cette exception ne s'applique qu'aux prédicats d'ACTION qui ont un équivalent event complet (presentation, naming_declaration) — elle ne s'applique PAS aux qualités documentaires distinctes comme "witness" (statut juridique de témoin) qui coexiste normalement avec "present_at" (participation à l'événement) : ce sont deux faits différents, garde les deux.

Même logique pour "actor" : si une personne a déjà un rôle plus SPÉCIFIQUE sur cet event (seller, buyer, deceased, heir, usufructuary), NE PRODUIS PAS en plus "actor" pour elle sur le même event — "actor" est un rôle générique de dernier recours, pas un fait supplémentaire à empiler sur un rôle déjà précis. Exemple : si "E1 -- seller --> Andrésine" existe, ne produis PAS aussi "E1 -- actor --> Andrésine" — le rôle seller couvre déjà entièrement sa participation à l'event.

"declares" est un prédicat de dernier recours pour une déclaration qui ne correspond à AUCUN prédicat plus spécifique — ce n'est PAS un doublon systématique à ajouter en plus d'un prédicat déjà précis. Si le fait est déjà couvert par "naming_declaration" (ou tout autre prédicat plus spécifique), NE PRODUIS PAS en plus une assertion "declares" sur la même personne pour le même passage — même règle générale que pour les events : un même fait, une seule assertion, sous le prédicat le plus spécifique disponible.

## Actes hypothécaires/notariés — vente, succession, enregistrement
Ce qui suit ne s'applique qu'aux actes hypothécaires/notariés (vente, succession...) ; ignore cette section pour un acte d'état civil.

Une vente ou une succession relie plusieurs rôles distincts entre eux : c'est exactement le cas 2 de la doctrine "L'entité event" ci-dessus, pas un cas particulier. Crée une entité event (ex. "E1 : Vente de [bien]" ou "E1 : Succession de [défunt]") et relie-lui les parties avec les prédicats dédiés : seller/buyer (subject = event, object = la personne), deceased/heir/usufructuary (idem). sale_price est un fait sur l'event lui-même (subject = event, value_number/value_text), pas sur une personne.

Si le texte donne PLUSIEURS montants différents pour le même prix (ex. une première mention "seize mille francs" puis une correction/précision plus loin dans l'acte, éventuellement avec un mot raturé, du type "seize mille ~~francs~~ cent francs" ou "représente l'intégralité du prix convenu"), produis une assertion sale_price DISTINCTE pour CHAQUE montant réellement énoncé, chacune avec sa propre citation — NE choisis PAS silencieusement lequel est "le bon" ni ne garde qu'une seule des deux. C'est exactement le genre de désaccord documentaire que "other" ne doit pas absorber non plus : chaque montant explicite mérite sa propre assertion sale_price, même si l'un d'eux te semble être une simple reformulation ou correction de l'autre.

IMPORTANT — une vente à PLUSIEURS vendeurs et/ou PLUSIEURS acheteurs reste UN SEUL event, avec UNE assertion seller/buyer PAR PERSONNE (jamais une seule assertion agrégée, même règle que l'atomicité stricte). Erreur fréquente à éviter activement : produire l'assertion seller/buyer pour les deux ou trois premiers noms d'une énumération puis s'arrêter — reprends la liste jusqu'au DERNIER nom énuméré, y compris quand elle continue sur plusieurs phrases ou après une quote-part ("chacun pour telle part"). Exemple : "Madame X, Madame Y et Monsieur Z ont vendu à Monsieur A et Mademoiselle B" donne E1 (Vente) avec CINQ assertions distinctes : E1--seller-->X, E1--seller-->Y, E1--seller-->Z, E1--buyer-->A, E1--buyer-->B — n'omets AUCUNE des parties, même si la liste est longue. Si le texte précise une quote-part par acheteur (ex. "chacun pour moitié", "par tiers"), garde-la en value_text sur l'assertion buyer correspondante (ex. value_text = "moitié") plutôt que de la reléguer en "other" — buyer/seller n'ont pas besoin d'object supplémentaire pour porter cette précision, la quote-part EST la valeur de l'assertion.

Une succession peut s'enchaîner sur plusieurs générations quand l'acte retrace l'origine de propriété (qui a hérité de qui, qui est décédé ensuite à son tour). Chaque décès qui transmet une succession est un événement SÉPARÉ, même si plusieurs déclarations de succession se suivent dans le même paragraphe — ne les fusionne pas en un seul event. Exemple : "M. Ernest décédé, laissant ses cinq frères et sœurs" PUIS "M. Justin [un des cinq frères] décédé à son tour, laissant ses deux filles" donnent DEUX events distincts : E2 (deceased=Ernest, heir=chacun des cinq frères/sœurs, un par assertion) et E3 (deceased=Justin, heir=chacune des deux filles) — E3 ne se rattache à E2 que par le fait que Justin est à la fois heir de E2 et deceased de E3 (deux assertions différentes sur la même personne, pas une contradiction). Si le texte précise qu'un survivant reçoit l'usufruit d'une part (ex. "laissant son mari usufruitier de la moitié de sa succession") plutôt que la pleine propriété, utilise "usufructuary" (pas "heir") pour cette personne précise, avec la fraction en value_text (ex. "moitié").

Un bien (terrain, maison...) mentionné dans l'acte et qui porte lui-même des faits (superficie, bornage...) suit la doctrine "L'entité place" ci-dessus : crée une entité "place" pour lui plutôt que de répéter sa désignation en texte libre. Donne-lui TOUJOURS un fait "quality" établissant sa nature (ex. L1--quality-->"terrain", ou "portion de terre", "parcelle", "chemin", "immeuble" selon le mot du texte) — ce n'est pas facultatif, c'est le même genre de fait de base qu'un "quality" sur un lieu administratif. area (subject = ce lieu, la superficie) et boundary (subject = ce lieu, une limite/un tenant — un seul prédicat générique, pas un par point cardinal ; si le texte précise une orientation, mets-la dans value_text, ex. "au nord : chemin de X") s'utilisent comme "quality" s'utilise déjà pour la nature d'un lieu — UN FAIT PAR TENANT (si le texte donne 4 limites nord/sud/est/ouest, produis 4 assertions boundary distinctes, n'en agrège aucune paire).

Les mentions d'enregistrement de l'acte (date, lieu, volume, folio, numéro d'enregistrement — typiquement une formule de fin d'acte comme "enregistré à X le [date], volume Y, folio Z, n° N") suivent la doctrine "L'entité document" ci-dessus : subject = l'entité document (D1), jamais une personne, via registration_date/registration_place/registration_volume/registration_folio/registration_number — un prédicat par élément de la formule, ne les agrège pas.

Une AUTORISATION donnée par une personne à une autre (typiquement un mari qui autorise son épouse à vendre, une autorisation de justice/tutelle...) se relie via "authorizes" : subject = la personne QUI AUTORISE, object = la personne AUTORISÉE, source_text = la formule d'autorisation elle-même. Ne confonds pas avec "consent" (qui reste pour un consentement simple, sans second rôle "autorisant"/"autorisé" à relier) : s'il y a UNE personne qui autorise ET une autre qui est autorisée, utilise "authorizes" entre les deux, PAS "consent" sur la personne autorisée à partir de la même formule (ce serait attribuer à tort l'action à la mauvaise personne). Exemple : "Madame X, autorisée par son mari M. Y à l'effet des présentes" donne M. Y -- authorizes --> Madame X (source_text = "autorisée par son mari M. Y à l'effet des présentes"), PAS "Madame X -- consent" sur cette même citation.

ATTENTION à la résolution du pronom dans la formule courante "M. X et Mme Y, son épouse, qu'il autorise" : "il" désigne TOUJOURS le mari IMMÉDIATEMENT antécédent dans la même énumération (ici M. X), JAMAIS le notaire qui reçoit l'acte ni une autre personne mentionnée par ailleurs dans le texte, même si son nom est plus proche dans la phrase au sens purement grammatical. Cette formule se répète typiquement une fois par couple dans une énumération de comparants — résous "il" séparément pour CHAQUE occurrence vers le mari de CE couple précis, ne réutilise jamais la même résolution pour deux couples différents.

Un DOCUMENT AUTRE que l'acte notarié lui-même, cité et daté dans le texte (ex. une décision administrative qui autorise ou accompagne la vente — "décision du Gouverneur en date du deux juin mil neuf cent quarante-quatre") est une entité document à part entière (ex. "D2 : Décision du Gouverneur autorisant la vente"), distincte de l'acte principal (D1). Ses propres date/numéro/volume suivent la même doctrine "L'entité document" mais via document_date/document_number/document_volume (PAS act_date/registration_*, réservés à l'acte notarié lui-même D1) — sinon les dates des deux documents se mélangent sous le même prédicat, ambigu à la lecture.

Si l'acte lui-même (D1) comporte DEUX dates distinctes parce qu'il se déroule en deux phases avec des parties différentes à chaque fois (ex. une comparution notariale à une date, puis une ratification/ ou ajout d'une autre partie à une date ultérieure — reconnaissable à deux formules d'ouverture séparées du type "L'An... le deux juin..." PUIS "Et l'An... le douze février... pour Mme/M. [autre partie]"), NE mets PAS deux assertions act_date sur le même D1 : crée deux entités document distinctes (ex. "D1a : Acte de vente — comparution du 2 juin 1944" et "D1b : Acte de vente — ratification du 12 février 1945 par [partie]"), chacune avec son propre act_date/act_place, plutôt que deux dates ambiguës sur une seule entité.

Le MARIAGE d'une personne mentionnée dans l'acte (souvent en marge d'une identification, ex. "son épouse, avec laquelle elle a contracté mariage le...") se relie via marriage_date (subject = la personne, value_date) et marriage_place (subject = la personne, object = l'entité place si elle existe déjà, sinon value_text) — PAS marriage_time, qui reste réservé au cas rare d'une véritable HEURE du jour explicitement donnée ("célébré à dix heures du matin"). Ne stocke JAMAIS une année ou une date complète dans marriage_time.

Pour un fait explicite qui ne correspond à aucun de ces prédicats et n'est pas non plus une simple qualité/relation générique (ex. le statut hypothécaire d'un bien) : utilise "other" + "raw_relation", comme le reste du référentiel le prévoit déjà pour tout fait sans prédicat dédié — ne force pas ce genre de détail dans marital_regime/area/boundary/registration_* si ce n'est pas littéralement ce dont il s'agit. Mais NE bascule PAS en "other" un fait qui correspond exactement à seller/buyer/deceased/heir/usufructuary/authorizes sous prétexte que l'acte a beaucoup de parties ou une succession compliquée — c'est justement le cas d'usage de ces prédicats, pas une exception à eux.

## Chaque personne distincte a sa propre entité, même dans une énumération serrée
Quand le texte énumère plusieurs personnes à la suite dans la même formule ("1° - Untel..., 2° - Unetelle..., 3° - ...") ou dans une même sous-clause ("4° - M. X, 5° - et M. Y, tous deux cultivateurs, demeurant à..."), CHAQUE personne nommée reçoit sa PROPRE entité, jamais une entité partagée même si leurs faits (profession, domicile) sont formulés ensemble pour les deux. Duplique le fait commun sur CHACUNE des entités séparément (ex. "tous deux cultivateurs, demeurant à Deshaies" donne occupation+domicile sur X ET occupation+domicile sur Y, deux assertions de chaque, pas une seule assertion sur une entité fusionnée "X et Y"). Ce risque de fusion augmente avec le nombre de personnes énumérées dans l'acte — reste vigilant même en fin de longue liste.

## Toutes les formes d'appellation d'une personne doivent être tracées
Une même personne est souvent nommée de PLUSIEURS façons différentes dans un même acte (nom de naissance, nom d'épouse, "Mme [nom du mari]", un prénom seul plus loin, une désignation abrégée...). Pour CHAQUE forme distincte utilisée dans le texte, produis une assertion "name" séparée sur l'entité de CETTE personne (même entité, plusieurs assertions "name", une par forme rencontrée), avec sa propre citation exacte — même si une autre forme a déjà été notée par ailleurs. Ne considère jamais une nouvelle forme comme "redondante" au prétexte que le nom complet existe déjà : chaque forme est une preuve de traçabilité différente, utile pour vérifier a posteriori qu'une désignation abrégée a bien été résolue vers la bonne personne. Ceci sert aussi à éviter une erreur plus grave : si tu hésites entre créer une NOUVELLE entité pour une désignation (ex. "Mme Duhald") ou la rattacher à une entité de personne DÉJÀ CRÉÉE sous son nom complet (ex. "Ernestine Isabelle CHARBONNE"), privilégie TOUJOURS le rattachement à l'entité existante dès qu'un indice du texte les identifie comme la même personne (ex. Ernestine Isabelle CHARBONNE, épouse de M. Duhald, est "Mme Duhald") — ajoute la forme "Mme Duhald" comme assertion "name" supplémentaire SUR CETTE MÊME entité, ne crée pas une seconde entité pour la même personne sous un autre nom.

Cette même règle de rattachement s'applique quand une personne DÉJÀ créée réapparaît plus tard désignée par un lien relationnel plutôt que par son nom (ex. "le mari de Suzanne Charbonné" pour un homme déjà nommé "Joseph Georges" plus tôt, ou "le frère d'Ernest" pour quelqu'un déjà nommé "Casimir Charbonné") — NE CRÉE PAS une seconde entité pour cette réapparition, même si tu es tenté de forger un label descriptif du type "Joseph Georges (mari de Suzanne Charbonné)" pour la distinguer. Vérifie d'abord si le nom propre correspond à une entité déjà déclarée ; si oui, réutilise son local_key et ajoute simplement le fait relationnel (ex. spouse) sur cette entité existante. Un nom propre identique à deux endroits du texte, même séparés par plusieurs paragraphes ou décrits différemment, désigne presque toujours la même personne dans un acte notarié — ne le traite comme deux personnes que si le texte donne une raison explicite de les distinguer (ex. un patronyme suivi d'un numéro de génération différent).

## Vérifie qu'aucune entité mentionnée en "subject"/"object" ne manque du tableau "entities" avec un label exploitable
Une entité déclarée dans "entities" avec pour "label" un extrait de source_text tronqué (une clause entière au lieu d'un nom propre) est un signe que tu as utilisé son local_key dans une assertion SANS l'avoir correctement déclarée avec son vrai nom — le filet de récupération côté application ne fait alors que recopier le premier passage où la clé apparaît, illisible pour l'utilisateur final. Avant de terminer, relis chaque local_key utilisé en "subject" ou "object" et vérifie qu'il existe bien dans "entities" avec un "label" qui est un NOM (ou une description courte et propre pour un document/lieu/event), jamais une phrase entière recopiée du texte source.

## Sens des relations entre personnes — ne produis JAMAIS les deux sens
Chaque prédicat relationnel a un sens fixe : "subject -- father --> object" signifie TOUJOURS "le père du sujet est l'objet" (jamais l'inverse). Une fois que tu as établi une relation dans un sens, ne produis pas la relation inverse ou redondante pour la même paire de personnes — la relation n'est stockée qu'une fois. Si le texte permet d'établir "P3 -- father --> P2" (l'enfant a pour père le déclarant), ne produis pas aussi une assertion où P2 a pour "père" ou "enfant" P3 avec predicate="father" — choisis le sens canonique et une seule direction.

Ne duplique jamais une relation sous forme de "quality" ou "title". Si un mot désigne une relation à une autre personne (épouse, mari, veuf/veuve de, témoin de...), c'est une relation avec un "object", PAS une qualité indépendante — ne produis pas les deux pour le même fait. Exemple : le texte dit "son épouse Alidor Reinette" → produis UNIQUEMENT "Némorin -- spouse --> Alidor" (ou l'inverse selon le sens canonique choisi), PAS en plus "Alidor -- quality --> épouse". "quality"/"title" servent aux statuts qui ne relient pas à une autre personne (propriétaire, sieur, dame...).

NE CONFONDS PAS spouse et widowhood — ce sont deux prédicats pour deux faits différents, pas des synonymes. "épouse"/"mari"/"époux" (mariage en cours, la personne est vivante et mariée) → predicate = spouse, JAMAIS widowhood. "veuf"/"veuve" (le mot lui-même doit être explicitement présent dans le texte) → predicate = widowhood. Ne produis JAMAIS d'assertion widowhood à partir d'un texte qui dit seulement "son épouse X" — c'est une hallucination de prédicat, pas juste une redondance. Et surtout, ne produis JAMAIS les deux prédicats à partir de LA MÊME citation — une citation qui ne parle QUE de veuvage ("veuve de M. X") donne UNIQUEMENT widowhood, jamais spouse en plus (un rejeté existe déjà côté code pour ce cas précis si tu t'y risques quand même, mais ne compte pas dessus, applique la règle directement).

Comme "spouse", "widowhood" doit porter un "object" quand le texte identifie le conjoint décédé (ex. "veuve de Monsieur Alfred DESBONNES" → object = l'entité de Alfred Desbonnes, crée-la si elle n'existe pas encore) — ne laisse pas "object" vide alors que le nom du conjoint est explicitement donné dans la même citation. C'est la seule façon de préserver le lien entre les deux personnes une fois que "spouse" est exclu par la règle ci-dessus.

NE CONFONDS PAS non plus witness et les autres rôles (spouse, mother, father, comparant, declarant...) — le predicate "witness" ne doit être produit QUE si le source_text cité contient lui-même un marqueur documentaire explicite de témoignage ("témoin", "témoins", "en présence de", "en présence des"...). Un passage qui établit uniquement une relation familiale (ex. "de lui déclarant et de son épouse la Dame X") ne prouve PAS que cette personne est témoin, même si elle est physiquement présente à l'acte — n'en déduis pas "witness". Choisis le prédicat que le passage démontre réellement (ici spouse et/ou mother), pas celui qui semblerait plausible par ailleurs.

IMPORTANT pour le source_text d'un "witness" : quand plusieurs témoins sont énumérés dans une même formule ("en présence des sieurs X et Y, [description de X], et [description de Y]"), le source_text de CHAQUE assertion witness (celle de X comme celle de Y) doit inclure le marqueur de présence lui-même ("en présence des sieurs X et Y"), pas seulement la clause descriptive propre à cette personne (âge, profession, domicile) qui, isolée, ne contient plus le marqueur. Cite le segment le plus court qui reste néanmoins autosuffisant pour prouver le témoignage de CETTE personne précise (inclut le marqueur + son nom), plutôt qu'un segment qui ne porte que sa description.

## Preuve obligatoire — précision, pas juste proximité
Chaque assertion doit avoir "source_text" : la citation exacte (mot pour mot) du passage qui la justifie SPÉCIFIQUEMENT. Le passage doit démontrer précisément CE fait, pas juste se trouver à proximité dans la phrase. Exemple : pour l'assertion "P3 a pour père P2", la preuve correcte est le segment qui établit la filiation ("de lui déclarant et de son épouse..."), pas une phrase voisine qui parle seulement de la présentation de l'enfant sans établir la paternité. Cette même règle s'applique aux rôles comme declarant/comparant/witness : pour "declarant", la preuve correcte est le segment qui identifie précisément qui déclare ("de lui déclarant"), pas une phrase générale qui mentionne "déclaration et présentation faites" sans dire qui en est l'auteur. Si tu ne peux pas rattacher une assertion à un passage qui la démontre précisément, ne la produis pas.
Fournis aussi "source_start" et "source_end" : la position de ce passage dans le texte fourni, en index de caractères (0-based, le premier caractère du texte est à l'index 0).

## Un acte hypothécaire/notarié peut raconter des événements passés SANS que les personnes citées soient parties à l'acte courant
Un acte de vente/succession retrace souvent l'origine de propriété (qui a hérité de qui, à quelle date, dans quelles circonstances passées) AVANT de nommer les parties qui comparaissent réellement AUJOURD'HUI pour l'acte en cours. Une personne mentionnée uniquement dans ce récit historique (ex. un héritier d'une succession antérieure, aujourd'hui lui-même décédé, ou dont l'acte précise qu'il n'est PAS partie à la vente actuelle) n'est PAS "comparant"/"declarant" de l'acte courant du seul fait d'être nommée dans ce récit — ces prédicats sont réservés aux personnes dont le texte établit EXPLICITEMENT qu'elles comparaissent/déclarent DANS CET ACTE PRÉCIS (typiquement la formule d'ouverture "par-devant nous... ont comparu..." ou équivalent). Avant de produire "comparant"/"declarant" pour une personne nommée au fil d'un récit de succession, vérifie qu'elle apparaît aussi, séparément, dans la liste des parties qui comparaissent réellement à l'acte en cours — sinon ne produis pas ce prédicat pour elle, même si son nom apparaît près d'un numéro d'énumération qui ressemble à une liste de comparants.

Contrôle de cohérence simple mais absolu : une personne dont le texte établit par ailleurs qu'elle est DÉJÀ décédée (fait "death"/"death_date" produit ailleurs dans ta propre extraction) ne peut PAS être "comparant"/"declarant"/"signs"/"present"/"consent" à l'acte courant — c'est une impossibilité logique, pas une question d'appréciation. Si tu es tenté de produire l'un de ces prédicats pour une personne que tu as toi-même identifiée comme décédée, c'est le signe que la citation démontre en réalité autre chose (souvent : une désignation ambiguë comme "aussi comparant" qui se rapporte grammaticalement à une AUTRE personne mentionnée juste avant, typiquement son conjoint survivant) — cherche le véritable référent plutôt que de produire l'assertion sur la personne décédée.

## Ne déduis pas une action à partir d'une simple mention nominative
Une formule d'ouverture comme "par-devant nous X, [fonction]" établit seulement l'identité et la fonction de X — ELLE NE PROUVE AUCUNE ACTION (signer, consentir, présenter...). Ne produis pas d'assertion "signs"/"consent"/etc. pour X à partir de cette seule formule. Si X signe réellement l'acte, cela doit être établi par un passage distinct et explicite (ex. "a... signé avec nous"), pas déduit de sa simple présence nominative en introduction. Avant de produire une assertion en passe d'audit, vérifie qu'elle n'est pas déjà couverte, même sous une formulation différente, par une assertion existante sur la même personne et le même fait.

Même piège avec "en présence de X et Y" : cette formule établit que X et Y sont présents (predicate "present" ou "witness"), PAS qu'ils accomplissent l'action qui précède dans la phrase. Exemple concret : "les dites déclaration et présentation faites en présence des sieurs Bourdin et Alcibiade" signifie que Bourdin et Alcibiade sont présents lors de la déclaration/présentation — PAS que Bourdin ou Alcibiade déclarent ou présentent quoi que ce soit (c'est Némorin qui déclare et présente, établi ailleurs dans le texte). N'utilise "declares"/"presentation"/"naming_declaration" que pour la personne qui accomplit réellement l'action, jamais pour les personnes seulement citées comme présentes.

## Résous les coréférences sur les actions, pas seulement sur les personnes citées
Quand le texte attribue une action à "nous" ou à un pronom qui renvoie à une personne déjà identifiée (typiquement l'officiant établi en début d'acte via "par-devant nous X"), rattache l'action à cette personne même si son nom n'est pas répété à cet endroit. Exemple : "Bourdin (Calixte) seul signé avec nous" où "nous" désigne l'officiant déjà identifié (ex. Valluet) — cela signifie que DEUX personnes signent : Bourdin ET l'officiant. Ne produis pas seulement l'assertion "signs" pour Bourdin ; produis aussi "signs" pour l'officiant désigné par "nous". Vérifie systématiquement, à la fin de ton extraction, que chaque signataire mentionné (nommément ou via "nous"/"avec nous") a bien son assertion "signs".

## Coréférences et résolutions internes (autorisées, avec prudence)
Tu peux résoudre les références internes au document UNIQUEMENT quand le référent est établi sans ambiguïté plus tôt dans le même texte. En cas de doute, n'affirme rien plutôt que de deviner. Deux cas concrets :
- Personnes : "ledit", "l'époux", "son père", "celui-ci" → remplace par l'identifiant local de la personne déjà identifiée.
- Lieux : "cette commune", "notre commune", "ladite commune" → la valeur structurée (value_text) doit être le nom réel de la commune déjà énoncé plus tôt dans le texte (ex. "Deshayes"), tout en gardant le "source_text" littéral ("cette commune").
- Dates relatives : "le deux du courant" → normalise en value_date complète (ex. "1875-02-02") en utilisant le mois/l'année déjà donnés explicitement plus haut dans le MÊME acte (ex. "dix février mil huit cent soixante-quinze"), tout en gardant le "source_text" littéral. Ceci est une résolution linguistique déterministe interne au document, PAS une déduction historique — reste autorisée uniquement quand le mois/l'année sont explicitement écrits dans le texte fourni.

## Entités documentaires
Attribue un identifiant local stable à chaque personne, à l'acte lui-même, à chaque lieu nommé qui porte ses propres faits, à chaque bien qui porte ses propres faits, et à chaque événement modélisé : P1, P2, P3... pour les personnes, D1 (D2 s'il y a plusieurs documents) pour l'acte, L1, L2, L3... pour les lieux (voir "L'entité place"), PR1, PR2... pour les biens (voir "L'entité property" — préfixe DIFFÉRENT de P, ne réutilise jamais P pour un bien), E1, E2, E3... pour les événements (voir "L'entité event"). Ces préfixes ne sont pas décoratifs : ils reflètent le type réel de l'entité, choisis-les en cohérence stricte avec le "entity_type" que tu déclares pour elle — une entité L ne peut être que "place", une entité PR que "property", une entité D que "document", une entité E que "event", une entité P (hors PR) que "person". Le "subject" et l'éventuel "object" de chaque assertion référencent ces identifiants, jamais le nom directement.
IMPORTANT : le tableau "entities" est OBLIGATOIRE et doit être rempli EN PREMIER, avant "assertions", avec une entrée par personne, par lieu créé en entité, par bien créé en entité, par événement créé en entité, ET l'entité document — chaque entrée a "local_key", "label", et "entity_type" ("person", "document", "place", "property" ou "event"). N'utilise jamais un local_key dans "subject" ou "object" sans l'avoir déclaré dans "entities".

## Vocabulaire de prédicats contrôlé, en quatre couches
Faits stables sur une personne : ${PREDICATE_LAYERS.person_facts.join(', ')}.
Actions documentaires : ${PREDICATE_LAYERS.documentary_actions.join(', ')}.
Caractéristiques du document/contexte (subject = l'entité document) : ${PREDICATE_LAYERS.document_context.join(', ')}.
Relations d'événement (voir "L'entité event") : ${PREDICATE_LAYERS.event_relations.join(', ')}.
Si aucun ne convient, utilise "other" et remplis "raw_relation" avec la relation telle qu'exprimée dans le texte (ex. "cousin germain du futur époux").

## Format
Réponds uniquement via l'outil fourni, jamais en texte libre.`

type EntityOut = { local_key: string; label: string; entity_type?: 'person' | 'document' | 'place' | 'event' | 'property' }
type AssertionOut = {
  subject: string
  predicate: string
  raw_relation?: string | null
  object?: string | null
  value_text?: string | null
  value_number?: number | null
  value_date?: string | null
  source_text: string
  source_start?: number | null
  source_end?: number | null
}

const ASSERTIONS_TOOL = {
  name: 'submit_assertions',
  description: "Soumet la liste des entités documentaires (personnes, document, lieux) et des assertions atomiques extraites du texte.",
  input_schema: {
    type: 'object' as const,
    properties: {
      entities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            local_key: { type: 'string', description: 'Identifiant local unique, ex. P1, P2... pour les personnes, D1 pour l\'acte, L1, L2... pour les lieux' },
            label: { type: 'string', description: 'Le nom (personne, lieu) ou une description (ex. "Acte de naissance de Blaise Gustave")' },
            entity_type: { type: 'string', enum: ['person', 'document', 'place', 'event', 'property'], description: 'Type de l\'entité' },
          },
          required: ['local_key', 'label', 'entity_type'],
        },
      },
      assertions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            subject: { type: 'string', description: 'local_key de l\'entité sujet (personne ou document)' },
            predicate: { type: 'string', enum: CONTROLLED_PREDICATES, description: 'Code de prédicat contrôlé' },
            raw_relation: { type: 'string', description: "Obligatoire si predicate='other'" },
            object: { type: 'string', description: 'local_key de l\'entité objet, si l\'assertion relie deux entités' },
            value_text: { type: 'string' },
            value_number: { type: 'number' },
            value_date: { type: 'string' },
            source_text: { type: 'string', description: 'Citation exacte du passage source qui démontre spécifiquement ce fait' },
            source_start: { type: 'integer' },
            source_end: { type: 'integer' },
          },
          required: ['subject', 'predicate', 'source_text'],
        },
      },
    },
    required: ['entities', 'assertions'],
  },
}

function extractToolInput(message: Anthropic.Messages.Message): { entities: EntityOut[]; assertions: AssertionOut[] } {
  // stop_reason "max_tokens" = la réponse a été coupée avant la fin — le
  // tool_use existe quand même (souvent avec un JSON refermé de force par
  // l'API sur un champ tronqué en plein mot), donc l'ancien code (qui ne
  // vérifiait QUE l'absence de tool_use) acceptait ce résultat partiel en
  // silence. Constaté en usage réel (2026-08-10, 18ᵉ affinage) sur un acte
  // long : ~20 entités et assertions correctement formées, puis plus rien
  // au-delà du point de coupure — 0 lieu/0 événement alors qu'ils existaient
  // dans le texte, sans la moindre erreur visible. Refusé explicitement
  // maintenant plutôt que de laisser passer une extraction massivement
  // incomplète sans le dire.
  if (message.stop_reason === 'max_tokens') {
    throw new Error(
      `Réponse de Claude tronquée (max_tokens atteint) — le texte est probablement trop long/complexe pour la limite actuelle (${message.usage?.output_tokens ?? '?'} tokens générés). L'extraction est incomplète, pas exploitable telle quelle.`,
    )
  }
  const toolUse = message.content.find((b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use')
  if (!toolUse) {
    const blocks = message.content.map(b => b.type === 'text' ? { type: 'text', text: b.text.slice(0, 300) } : { type: b.type })
    throw new Error(`Claude n'a pas utilisé l'outil attendu (stop_reason=${message.stop_reason}) — ${JSON.stringify(blocks)}`)
  }
  const input = toolUse.input as any
  return {
    entities: Array.isArray(input.entities) ? input.entities : [],
    assertions: Array.isArray(input.assertions) ? input.assertions : [],
  }
}

// CONTROLLED_SET : la contrainte "enum" du JSON Schema force déjà Claude à
// choisir un prédicat du référentiel (voir ASSERTIONS_TOOL), mais on ne
// suppose jamais qu'une contrainte API est infranchissable — vérification
// serveur en doublon, comme le reste des règles ci-dessous.
const CONTROLLED_SET = new Set(CONTROLLED_PREDICATES)

// "name" dont la citation ne contient AUCUN mot substantiel de la valeur
// affirmée (2026-08-11, critique externe fait-vérifiée en base) : constaté
// réellement — "Joseph GEORGES -- name --> 'M. Georges Joseph'" avec pour
// source_text "aussi comparant", qui ne contient littéralement pas le nom.
// Viole "Preuve obligatoire" de la même façon que le "..." fabriqué —
// heuristique volontairement simple (recouvrement d'au moins un mot de 3+
// caractères) pour rester tolérante aux variantes légitimes (accents,
// abréviations, ordre différent) sans faux positif : testée contre TOUTES
// les assertions "name" du run réel qui a révélé le bug avant d'être
// retenue — un seul cas flagué (le bon), aucun faux positif.
function nameValueHasEvidence(valueText: string, sourceText: string): boolean {
  const src = sourceText.toLowerCase()
  const words = valueText.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  if (words.length === 0) return true
  return words.some(w => src.includes(w))
}

function validateAssertions(raw: AssertionOut[], entityKeys: Set<string>): AssertionOut[] {
  return raw.filter(a =>
    typeof a.subject === 'string' && entityKeys.has(a.subject)
    && typeof a.predicate === 'string' && CONTROLLED_SET.has(a.predicate)
    && typeof a.source_text === 'string' && a.source_text.trim().length > 0
    // "..." fabriqué (2026-08-11, 27ᵉ affinage) : constaté réellement — Claude
    // a produit plusieurs source_text contenant un "..." littéral pour relier
    // deux passages non contigus (ex. "demeurant avec lui à Deshaies où ils
    // sont nés: ..."), qui n'existe PAS tel quel dans la transcription — viole
    // directement "Preuve obligatoire" (citation exacte). recoverOffsets ne
    // le trouvait déjà pas (offsets restaient null), mais l'assertion était
    // quand même conservée avec une preuve fabriquée et sans surlignage
    // possible. Rejetée explicitement plutôt que gardée dégradée.
    && !a.source_text.includes('...')
    && (a.predicate !== 'name' || typeof a.value_text !== 'string' || nameValueHasEvidence(a.value_text, a.source_text))
    && (a.object == null || entityKeys.has(a.object)),
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { text } = await req.json()
    if (typeof text !== 'string' || !text.trim()) {
      return new Response(JSON.stringify({ error: 'text manquant' }), { status: 400, headers: CORS_HEADERS })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurée côté serveur' }), { status: 500, headers: CORS_HEADERS })
    }

    const anthropic = new Anthropic({ apiKey })

    // temperature retiré (2026-08-10) : le modèle actuellement configuré
    // (claude-sonnet-5) rejette ce paramètre avec une erreur 400
    // "temperature is deprecated for this model" — constaté sur un vrai
    // appel après redéploiement, pas une supposition. Le levier de
    // déterminisme posé au 13ᵉ affinage n'est donc plus disponible pour ce
    // modèle ; à revoir si un futur modèle le réautorise.
    //
    // max_tokens relevé de 8000 à 32000 (2026-08-10, 18ᵉ affinage) — 8000
    // suffisait pour un acte d'état civil court mais tronquait en plein
    // milieu du JSON sur un acte long/complexe (constaté sur un vrai acte
    // de vente de ~20 personnes : un libellé d'entité coupé en plein mot,
    // "...demeurant à Desh" au lieu de "Deshaies", et 0 lieu/0 événement
    // alors que le texte en contenait clairement — voir extractToolInput
    // ci-dessous pour la détection de ce cas). Valeur choisie par prudence,
    // pas de certitude absolue sur le plafond exact accepté par ce modèle —
    // si l'API la rejette, ce sera visible immédiatement (erreur 400 claire,
    // même schéma que la découverte de `temperature` non supporté).
    const GENERATION_CONFIG = { model: MODEL, max_tokens: 32000 }

    // ---- Passe 1 : extraction ----
    const extractMsg = await anthropic.messages.create({
      ...GENERATION_CONFIG,
      system: SYSTEM_PROMPT,
      tools: [ASSERTIONS_TOOL],
      tool_choice: { type: 'tool', name: 'submit_assertions' },
      messages: [{ role: 'user', content: `Texte à analyser (index de caractères 0-based) :\n\n${text}` }],
    })
    const pass1 = extractToolInput(extractMsg)

    // ---- Passe 2 : audit des omissions ----
    const auditMsg = await anthropic.messages.create({
      ...GENERATION_CONFIG,
      system: SYSTEM_PROMPT,
      tools: [ASSERTIONS_TOOL],
      tool_choice: { type: 'tool', name: 'submit_assertions' },
      messages: [{
        role: 'user',
        content: `Texte original (index de caractères 0-based) :\n\n${text}\n\n---\n\nEntités déjà identifiées :\n\n${JSON.stringify(pass1.entities)}\n\nAssertions déjà trouvées :\n\n${JSON.stringify(pass1.assertions, null, 2)}\n\n---\n\nQuestion à te poser pour chaque portion du texte : existe-t-il, dans la transcription, un mot, un groupe de mots ou une relation syntaxique porteur d'information qui n'est représenté par AUCUNE assertion ci-dessus ? Cherche en particulier les titres de civilité, les qualificatifs de lieu, les formules procédurales, les statuts (distincts des professions), et les faits propres à l'acte lui-même (date/lieu/heure/type/lecture — subject doit être l'entité document, pas une personne, et à ne pas confondre avec un lieu mentionné dans le récit d'un événement personnel). Vérifie spécifiquement : (1) chaque signataire mentionné nommément OU via "nous"/"avec nous" a-t-il bien son assertion "signs" ? (2) aucune assertion n'attribue une action (declares/presentation/signs/consent...) à une personne seulement citée comme présente ("en présence de X") plutôt qu'actrice réelle de l'action ? (3) pour un acte hypothécaire/notarié : quand le texte énumère plusieurs vendeurs, plusieurs acheteurs, ou plusieurs héritiers dans une même liste ou un même paragraphe (formules "1°... 2°... 3°...", "ses cinq frères et sœurs, savoir : 1°... 2°...", etc.), reprends la liste NOM PAR NOM et vérifie que CHAQUE personne citée a bien sa propre assertion seller/buyer/heir sur l'event correspondant — ne t'arrête pas après les deux ou trois premiers noms d'une longue liste, ajoute les assertions manquantes pour ceux qui n'en ont pas encore. Vérifie aussi que la personne exacte désignée par une formule indirecte ("Mme X" pour une femme désignée par le nom de son mari, "ledit", "susnommé"...) est bien reliée à SA PROPRE identité (ex. "Mme Duhald" = l'épouse elle-même, pas son mari M. Duhald) avant de la relier comme heir/seller/buyer — une mauvaise résolution de référence donnerait un héritier ou un vendeur qui n'est pas la bonne personne. (4) pour CHAQUE personne déjà identifiée, reprends le texte à la recherche d'une date/un lieu de naissance ou de mariage explicitement donnés pour elle et vérifie qu'une assertion birth_date/marriage_date (ou birth_place/marriage_place) existe si le texte la donne — c'est un oubli fréquent quand cette date apparaît en incise dans une longue phrase d'identification plutôt que dans une formule dédiée. (5) pour CHAQUE personne nommée plus d'une fois sous des formes différentes (nom de naissance, nom d'épouse, "Mme X"...), vérifie qu'une assertion "name" distincte existe pour CHAQUE forme rencontrée, pas seulement la première. Ne produis PAS d'assertion supplémentaire pour un fait déjà couvert ci-dessus même sous une autre formulation. Ne refais pas l'extraction complète, ne redonne pas les assertions déjà listées. Réutilise les local_key existants pour les entités déjà connues (document et lieux compris) ; crée-en de nouveaux uniquement pour de nouvelles entités. Si rien ne manque, renvoie des listes vides.`,
      }],
    })
    const pass2 = extractToolInput(auditMsg)

    const entityMap = new Map<string, EntityOut>()
    for (const e of [...pass1.entities, ...pass2.entities]) {
      if (e?.local_key && e?.label) {
        const type: EntityOut['entity_type'] =
          e.entity_type === 'document' || e.entity_type === 'place' || e.entity_type === 'event' || e.entity_type === 'property'
            ? e.entity_type : 'person'
        entityMap.set(e.local_key, { ...e, entity_type: type })
      }
    }

    const allRawAssertions = [...pass1.assertions, ...pass2.assertions]

    // Robustesse : si Claude produit des assertions valides sans peupler
    // `entities` malgré le schéma ("required" non garanti à 100% côté
    // modèle — vu en usage réel, `entities` totalement vide alors que les 62
    // assertions de la même réponse étaient bien formées), on ne perd pas
    // les assertions — on synthétise une entité à partir de chaque valeur
    // subject/object effectivement utilisée. Plutôt qu'un type "person" et
    // un label = local_key génériques (peu exploitables : "P3" affiché au
    // lieu du prénom, lieux/document/event comptés comme personnes dans le
    // résumé), on déduit le vrai type et un vrai libellé à partir des autres
    // assertions qui référencent cette même clé.
    // Correctif d'urgence (2026-08-10, même jour que le 21ᵉ tour) : la
    // version précédente traitait TOUJOURS le sujet OU l'objet d'un
    // seller/buyer comme l'event, en supposant un sens fixe — faux dans les
    // deux cas puisque le sens observé varie d'un run à l'autre (~90%
    // personne=sujet/event=objet, ~10% l'inverse). Constaté en régression
    // réelle : un run où le sens dominant s'est inversé a fait typer la
    // PLUPART des personnes (Andrésine, Pierre Ymanette...) comme "event".
    // Remplacé par un signal de fréquence, insensible au sens : la valeur
    // qui apparaît sur PLUSIEURS assertions seller/buyer distinctes est
    // presque toujours l'event partagé (plusieurs vendeurs/acheteurs
    // pointent tous vers LE MÊME event), alors qu'une personne n'apparaît
    // qu'une fois comme vendeur/acheteur.
    // Généralisé (2026-08-11) à TOUS les prédicats à deux rôles
    // personne/event — pas seulement seller/buyer. Constaté en usage réel
    // sur un run suivant : deceased/heir/usufructuary AUSSI inversés (ex.
    // "Casimir CHARBONNE -- deceased --> [event]" au lieu de l'inverse) —
    // le même risque existe donc en principe pour actor/before_person/
    // presented_person même si non observé pour l'instant, traité par
    // précaution avec le même signal plutôt que d'attendre une prochaine
    // régression pour l'ajouter au coup par coup. sale_price reste à part
    // (jamais vu qu'avec subject=event, pas de "personne" de l'autre côté).
    const EVENT_ROLE_PREDICATES = new Set([
      'actor', 'before_person', 'presented_person', 'seller', 'buyer', 'deceased', 'heir', 'usufructuary',
    ])
    // Le signal de fréquence seul (2026-08-11, plus haut) s'est révélé
    // encore insuffisant : une personne qui joue DEUX rôles dans deux
    // événements différents (constaté en usage réel — Justin Charbonné,
    // héritier de la succession d'Ernest ET défunt de sa propre succession,
    // cas naturel dans une chaîne de succession à plusieurs générations)
    // obtient aussi un compte > 1, et se fait donc typer "event" à tort par
    // le seul critère de fréquence. Signal plus fiable ajouté EN AMONT :
    // une entité qui porte par ailleurs un fait qui ne peut s'appliquer
    // qu'à un être humain (nom, âge, profession, domicile, filiation...)
    // est une personne, quel que soit le nombre de rôles event qu'elle
    // joue par ailleurs — un event n'a jamais ce genre de fait sur
    // lui-même. "quality" volontairement exclu (ambigu : sert aussi à la
    // nature d'un lieu, cf. doctrine "L'entité place").
    const STRONG_PERSON_PREDICATES = new Set([
      'name', 'title', 'age', 'sex', 'occupation', 'nationality', 'marital_status',
      'widowhood', 'marital_regime', 'spouse', 'father', 'mother', 'child', 'sibling',
      'relative', 'neighbor', 'friend', 'witness', 'comparant', 'declarant',
      'officer_role', 'function', 'birth', 'birth_date', 'birth_time', 'birth_place',
      'death', 'death_date', 'death_time', 'death_place', 'marriage_time',
      'marriage_date', 'marriage_place', 'authorizes',
      'residence', 'domicile', 'signs', 'cannot_sign', 'present', 'absent',
      'is_asked_to_sign', 'declares', 'consent',
    ])
    const definitelyPerson = new Set<string>()
    for (const a of allRawAssertions) {
      if (typeof a?.subject === 'string' && a?.predicate && STRONG_PERSON_PREDICATES.has(a.predicate)) definitelyPerson.add(a.subject)
    }
    const eventRoleCounts = new Map<string, number>()
    for (const a of allRawAssertions) {
      if (!a?.predicate || !EVENT_ROLE_PREDICATES.has(a.predicate)) continue
      if (typeof a.subject === 'string') eventRoleCounts.set(a.subject, (eventRoleCounts.get(a.subject) ?? 0) + 1)
      if (typeof a.object === 'string') eventRoleCounts.set(a.object, (eventRoleCounts.get(a.object) ?? 0) + 1)
    }
    function inferEntityType(key: string): EntityOut['entity_type'] {
      if (definitelyPerson.has(key)) return 'person'
      for (const a of allRawAssertions) {
        if (a?.subject !== key) continue
        const p = a.predicate
        if (p === 'document_type' || p === 'act_date' || p === 'act_time' || p === 'act_place' || p === 'reading'
          || p === 'registration_date' || p === 'registration_place' || p === 'registration_volume'
          || p === 'registration_folio' || p === 'registration_number'
          || p === 'document_date' || p === 'document_number' || p === 'document_volume') return 'document'
        if (p === 'sale_price') return 'event'
        if (EVENT_ROLE_PREDICATES.has(p) && (eventRoleCounts.get(key) ?? 0) > 1) return 'event'
        // area/boundary/quality="terrain"/"maison"... s'appliquent aussi bien
        // à un lieu géographique nommé qu'à un bien précis (voir doctrine
        // "L'entité property", 25ᵉ affinage) — 'property' seulement pour un
        // bien manifestement bâti/vendable, 'place' par défaut sinon (lieux
        // administratifs/toponymiques, plus fréquents dans ce filet de
        // secours).
        if (p === 'quality' && typeof a.value_text === 'string'
          && ['maison', 'immeuble', 'bâtiment', "maison d'habitation", 'terrain', 'portion de terre', 'parcelle'].includes(a.value_text.trim().toLowerCase())) return 'property'
        if (p === 'area' || p === 'boundary') return 'place'
        if (p === 'quality' && typeof a.value_text === 'string'
          && ['section', 'hameau', 'commune', 'ville', 'quartier', 'paroisse', 'lieu-dit',
            'chemin', 'chemin vicinal', 'route', 'rivière'].includes(a.value_text.trim().toLowerCase())) return 'place'
      }
      for (const a of allRawAssertions) {
        if (a?.object !== key) continue
        if (a.predicate === 'present_at') return 'event'
        if (EVENT_ROLE_PREDICATES.has(a.predicate) && (eventRoleCounts.get(key) ?? 0) > 1) return 'event'
        if (a.predicate === 'administrative_area' || a.predicate === 'birth_place' || a.predicate === 'death_place'
          || a.predicate === 'registration_place' || a.predicate === 'located_on') return 'place'
      }
      return 'person'
    }
    // "name" ne résout que les personnes (aucun document/lieu/event n'a de
    // predicate "name") — sans repli, ces trois types s'affichaient tels
    // quels ("D1", "L2", "E1") dans toute l'UI en aval. Repli en cascade :
    // document_type (lisible pour un document, ex. "acte de naissance"),
    // puis le premier source_text où la clé apparaît (imparfait mais bien
    // plus lisible qu'un local_key brut), puis la clé en tout dernier recours.
    // Repli en cascade amélioré (2026-08-11, 30ᵉ affinage) — le repli
    // précédent (premier source_text tronqué à 60 caractères) reste
    // constaté défaillant sur 4 runs consécutifs (27ᵉ-30ᵉ tours) malgré 3
    // renforcements de doctrine côté prompt : plutôt qu'une 4ᵉ tentative de
    // prompt (rendements manifestement décroissants), deux nouveaux paliers
    // basés sur des SIGNAUX STRUCTURÉS déjà disponibles plutôt que sur du
    // texte brut :
    // 1. Pour un "event" : si l'event a un "deceased" (object = une
    //    personne déjà identifiée), synthétise "Succession de {label de
    //    cette personne}" — fiable à 100% (donnée structurée, pas un
    //    heuristique de texte) et corrige directement le cas observé
    //    ("E2" libellé "que M. Ernest Charbonné est décédé" au lieu de
    //    "Succession d'Ernest Charbonné").
    // 2. Pour un "place" (PAS "property" — un bien n'a généralement pas de
    //    nom propre à lui, un nom de lieu mal deviné dans son voisinage
    //    textuel immédiat serait pire qu'un extrait honnête, ex. deviner
    //    "Deshaies" comme label d'un terrain qui n'est pas lui-même
    //    "Deshaies") : avant de trancher (comme avant) sur les 60 premiers
    //    caractères du premier source_text, cherche un nom propre plausible
    //    (mot capitalisé, hors formules de civilité) dans le source_text
    //    COMPLET (pas tronqué à 60 avant la recherche — le vrai nom peut
    //    apparaître après ce seuil, cf. "la portion de terre présentement
    //    vendue est traversée par le [chemin de] Pineau", "Pineau" hors de
    //    la fenêtre des 60 premiers caractères). Best-effort : si aucun nom
    //    propre plausible n'est trouvé, retombe sur l'ancien comportement
    //    (tranche brute) plutôt que d'échouer.
    const PROPER_NOUN_STOPWORDS = new Set([
      'Monsieur', 'Madame', 'Mademoiselle', 'Le', 'La', 'Les', 'Un', 'Une', 'Des',
      'Et', 'Ledit', 'Ladite', 'Sieur', 'Dame', 'Me',
    ])
    function extractProperNounGuess(text: string): string | null {
      const matches = text.match(/\b[A-ZÀ-Ý][a-zà-ÿ']+(?:[\s-][A-ZÀ-Ý][a-zà-ÿ']+)*\b/g)
      if (!matches) return null
      const candidates = matches.filter(m => !PROPER_NOUN_STOPWORDS.has(m) && m.replace(/[^A-Za-zÀ-ÿ]/g, '').length > 2)
      return candidates[0] ?? null
    }
    function inferEntityLabel(key: string, entityType: EntityOut['entity_type']): string {
      const named = allRawAssertions.find(a => a?.subject === key && a?.predicate === 'name' && typeof a.value_text === 'string' && a.value_text.trim())
      if (named) return (named.value_text as string).trim()
      const docType = allRawAssertions.find(a => a?.subject === key && a?.predicate === 'document_type' && typeof a.value_text === 'string' && a.value_text.trim())
      if (docType) return (docType.value_text as string).trim()
      if (entityType === 'event') {
        const deceased = allRawAssertions.find(a => a?.subject === key && a?.predicate === 'deceased' && typeof a.object === 'string')
        if (deceased) {
          const person = entityMap.get(deceased.object as string)
          if (person?.label) return `Succession de ${person.label}`
        }
      }
      const anyMention = allRawAssertions.find(a => (a?.subject === key || a?.object === key) && typeof a.source_text === 'string' && a.source_text.trim())
      if (anyMention) {
        const raw = (anyMention.source_text as string).trim()
        if (entityType === 'place') {
          const guess = extractProperNounGuess(raw)
          if (guess) return guess
        }
        return raw.slice(0, 60)
      }
      return key
    }
    function ensureEntity(key: unknown) {
      if (typeof key !== 'string' || !key) return
      if (!entityMap.has(key)) {
        const type = inferEntityType(key)
        entityMap.set(key, { local_key: key, label: inferEntityLabel(key, type), entity_type: type })
      }
    }
    for (const a of allRawAssertions) {
      ensureEntity(a?.subject)
      ensureEntity(a?.object)
    }

    // Garde-fou déterministe par préfixe (2026-08-11, critique externe
    // fait-vérifiée en base) : le prompt impose une convention stricte de
    // préfixe par type (P=person, D=document, L=place, PR=property,
    // E=event, voir "Entités documentaires") — mais Claude s'en écarte
    // parfois EN MÊME TEMPS qu'il se trompe de type (constaté réellement :
    // "L4" déclaré entity_type "person" pour un chemin, alors que son
    // propre préfixe "L" contredit directement ce choix). Contrairement au
    // reste du typage (inféré depuis les prédicats environnants, donc
    // ambigu par nature), la convention de préfixe est une règle EXPLICITE
    // que le modèle est censé suivre — un local_key qui la contredit
    // lui-même est un signal fiable à 100%, pas une heuristique. Corrige
    // silencieusement plutôt que de propager l'incohérence jusqu'à l'UI.
    const PREFIX_TYPE_OVERRIDES: Array<[RegExp, EntityOut['entity_type']]> = [
      [/^PR\d/i, 'property'],
      [/^L\d/i, 'place'],
      [/^D\d/i, 'document'],
      [/^E\d/i, 'event'],
      [/^P\d/i, 'person'],
    ]
    for (const [key, entity] of entityMap) {
      const override = PREFIX_TYPE_OVERRIDES.find(([re]) => re.test(key))
      if (override && entity.entity_type !== override[1]) {
        entityMap.set(key, { ...entity, entity_type: override[1] })
      }
    }

    const entityKeys = new Set(entityMap.keys())

    // Robustesse pour les offsets : si source_start/source_end manquent, OU
    // s'ils sont présents mais NE CORRESPONDENT PAS réellement à source_text
    // (Claude peut fournir des offsets décalés — un cas distinct du "manquant"
    // qui n'était pas couvert avant), on retrouve la position par recherche
    // exacte du source_text dans le texte plutôt que de faire confiance
    // aveuglément à ce que Claude a fourni.
    // Bug trouvé (2026-08-11, 27ᵉ affinage, critique externe fait-vérifiée en
    // base) : prendre systématiquement la PREMIÈRE occurrence globale
    // (text.indexOf simple) est dangereux sur un acte notarié qui répète
    // beaucoup de formules courtes entre plusieurs personnes ("cultivateur",
    // "marin pêcheur", "demeurant à Deshaies où il est né"...) — constaté
    // réellement : l'occupation "marin pêcheur" de Joseph Georges (mentionné
    // vers le caractère 1633) récupérait l'offset de la PREMIÈRE occurrence
    // du texte, qui appartenait en fait à Philippe Duhald (mentionné vers le
    // caractère 478) ; même bug pour "cultivateur" (Ymanette récupérait
    // l'offset de Napolin) et pour "demeurant à Deshaies où il est né"
    // (Ymanette récupérait l'offset de Joseph Georges, déjà repéré au 26ᵉ
    // tour mais non résolu à la racine). Corrigé : quand Claude fournit un
    // offset (même incorrect), c'est un indice fiable de la ZONE du texte
    // concernée — on choisit désormais l'occurrence de source_text la plus
    // PROCHE de cet offset original, pas la première du document. Si aucun
    // offset n'est fourni du tout, on retombe sur la première occurrence
    // (best-effort, pas d'indice disponible pour faire mieux).
    function findAllOccurrences(haystack: string, needle: string): number[] {
      const positions: number[] = []
      let idx = haystack.indexOf(needle)
      while (idx !== -1) {
        positions.push(idx)
        idx = haystack.indexOf(needle, idx + 1)
      }
      return positions
    }
    function recoverOffsets(a: AssertionOut): AssertionOut {
      const hasOffsets = a.source_start != null && a.source_end != null
      if (hasOffsets && text.slice(a.source_start!, a.source_end!) === a.source_text) return a
      if (!a.source_text) return a
      const occurrences = findAllOccurrences(text, a.source_text)
      if (occurrences.length === 0) return a
      if (occurrences.length === 1) {
        return { ...a, source_start: occurrences[0], source_end: occurrences[0] + a.source_text.length }
      }
      // Plusieurs occurrences ET aucun indice de Claude pour choisir (ni
      // offset original, ni offset qui matchait déjà) : deviner la première
      // occurrence par défaut revenait exactement au bug corrigé plus haut
      // dans ce même tour — mieux vaut offsets null (pas de surlignage,
      // signal honnête d'incertitude) qu'un mauvais surlignage qui prétend à
      // tort être la bonne preuve (constaté réellement, 2026-08-11, critique
      // externe : "un offset absent signifie 'je ne sais pas', un offset
      // faux signifie 'je certifie une preuve qui n'est pas la bonne'").
      if (a.source_start == null) return { ...a, source_start: null, source_end: null }
      const idx = occurrences.reduce((best, cur) => Math.abs(cur - a.source_start!) < Math.abs(best - a.source_start!) ? cur : best)
      return { ...a, source_start: idx, source_end: idx + a.source_text.length }
    }

    // Déduplication pass1+pass2 par clé canonique : malgré la consigne de
    // prompt ("ne redonne pas les assertions déjà listées"), rien n'empêchait
    // techniquement l'audit de reproduire une assertion déjà trouvée en passe
    // 1 — elle aurait alors été comptée deux fois. Clé = tout ce qui définit
    // le fait, pas d'identifiant technique (il n'y en a pas encore à ce stade).
    // Clé basée sur la CITATION (subject, predicate, source_text, raw_relation)
    // plutôt que sur object/value — constaté en usage réel (2026-08-10,
    // 17ᵉ affinage) : la passe d'audit peut reformuler/mieux résoudre une
    // assertion déjà trouvée en passe 1 sur la MÊME citation exacte (ex.
    // "domicile" avec object=null en passe 1, puis object résolu vers
    // l'entité lieu en passe 2) — l'ancienne clé (qui incluait object/value)
    // les traitait comme deux faits distincts au lieu d'un doublon. Une
    // citation identique pour le même sujet+prédicat désigne le même fait,
    // par construction (source_text = la preuve qui démontre CE fait
    // spécifiquement, voir doctrine "Preuve obligatoire" plus haut).
    // raw_relation reste dans la clé pour ne pas fusionner deux faits "other"
    // distincts qui partageraient par coïncidence la même courte citation.
    // Doublon en sens inversé (2026-08-11, 27ᵉ affinage) : pour les prédicats
    // à deux rôles personne/event (EVENT_ROLE_PREDICATES ci-dessus), le sens
    // sujet/objet n'est pas fiable (21ᵉ-24ᵉ affinages) — constaté cette fois
    // au sein d'un MÊME run, pas seulement d'un run à l'autre : "Andrésine
    // -- seller --> [event]" ET "[event] -- seller --> Andrésine" produites
    // toutes les deux avec la MÊME citation exacte, jamais vues comme
    // doublon par une clé qui ne regarde que "subject". Paire (sujet, objet)
    // TRIÉE plutôt que "subject" seul pour ces prédicats précis — le sens
    // n'a de toute façon aucune importance sémantique ici (describeAssertion/
    // sideByType résout déjà le "côté personne"/"côté event" par entity_type
    // réel, pas par position).
    function canonicalAssertionKey(a: AssertionOut): string {
      const subjectKey = EVENT_ROLE_PREDICATES.has(a.predicate)
        ? [a.subject, a.object ?? ''].sort().join('|')
        : a.subject
      return JSON.stringify([
        subjectKey, a.predicate,
        a.source_text?.trim().toLowerCase() ?? null,
        a.raw_relation?.trim().toLowerCase() ?? null,
      ])
    }
    // Entre deux assertions de même clé canonique, garde la plus "résolue"
    // (object renseigné, ou une valeur) plutôt que systématiquement la
    // première rencontrée — sinon une version moins complète de passe 1
    // pourrait écraser une meilleure résolution obtenue en passe 2.
    function completenessScore(a: AssertionOut): number {
      return (a.object ? 1 : 0) + (a.value_text || a.value_number != null || a.value_date ? 1 : 0)
    }
    function deduplicateAssertions(list: AssertionOut[]): AssertionOut[] {
      const seen = new Map<string, AssertionOut>()
      for (const a of list) {
        const key = canonicalAssertionKey(a)
        const existing = seen.get(key)
        if (!existing || completenessScore(a) > completenessScore(existing)) seen.set(key, a)
      }
      return [...seen.values()]
    }

    const assertions = deduplicateAssertions([
      ...validateAssertions(pass1.assertions, entityKeys),
      ...validateAssertions(pass2.assertions, entityKeys),
    ].map(recoverOffsets))

    // Garde-fou (2026-08-11) : constaté en usage réel sur un texte long et
    // exigeant, deux formes d'une même instabilité — un run peut renvoyer
    // 0 entité/0 assertion en quelques secondes (bien trop vite pour avoir
    // vraiment lu un texte de plusieurs milliers de caractères), ou des
    // entités correctement peuplées mais ZÉRO assertion (Claude a "lu" le
    // texte mais n'a produit aucun fait dessus) — dans les deux cas un
    // résultat structurellement incohérent pour un texte substantiel, pas
    // une extraction volontairement vide. Même doctrine que le filet
    // stop_reason==='max_tokens' plus haut : ne jamais renvoyer un succès
    // silencieux sur une sortie LLM manifestement incomplète — mieux vaut
    // une erreur claire qu'un "0 assertion" qui ressemble à un résultat
    // normal côté UI. Seuil de 500 caractères pour ne pas gêner un texte
    // court légitimement pauvre en faits.
    if (text.trim().length > 500 && assertions.length === 0) {
      throw new Error(
        `Réponse incohérente de Claude : ${entityMap.size} entité(s) mais 0 assertion sur un texte de ${text.length} caractères — signe d'une génération dégénérée pour ce run précis (le texte est probablement trop long/complexe). Réessaie, un nouveau run peut réussir.`,
      )
    }

    return new Response(JSON.stringify({
      entities: [...entityMap.values()],
      assertions,
      extractorVersion: EXTRACTOR_VERSION,
      promptVersion: PROMPT_VERSION,
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur inconnue' }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
})
