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

import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5'

// Vocabulaire présenté à l'agent en quatre couches (aide le modèle à
// raisonner, correspond au découpage du référentiel côté base) :
// 1. faits stables sur une personne, 2. actions documentaires, 3.
// caractéristiques du document/du contexte, 4. relations d'événement.
// "time", "section" et "hamlet" sont volontairement absents (dépréciés —
// "time" remplacé par les heures spécialisées, "section"/"hamlet" par
// "quality" pour décrire la nature d'un lieu, une seule logique retenue).
const PREDICATE_LAYERS = {
  person_facts: [
    'name', 'sex', 'age', 'title', 'quality', 'occupation', 'residence', 'domicile',
    'nationality', 'marital_status', 'widowhood',
    'birth', 'birth_date', 'birth_time', 'birth_place',
    'death', 'death_date', 'death_time', 'death_place',
    'marriage_time',
    'father', 'mother', 'spouse', 'child', 'sibling', 'relative', 'neighbor', 'friend',
    'witness', 'comparant', 'declarant', 'officer_role', 'function',
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
  ],
  event_relations: ['actor', 'before_person', 'presented_person', 'present_at'],
  fallback: ['other'],
}
const CONTROLLED_PREDICATES = [
  ...PREDICATE_LAYERS.person_facts,
  ...PREDICATE_LAYERS.documentary_actions,
  ...PREDICATE_LAYERS.document_context,
  ...PREDICATE_LAYERS.event_relations,
  ...PREDICATE_LAYERS.fallback,
]

const SYSTEM_PROMPT = `Tu es un extracteur documentaire pour des actes d'état civil (naissance, mariage, décès, reconnaissance...) déjà transcrits manuellement.

## Objectif
Décomposer la transcription en assertions atomiques. Une assertion = un seul fait. Ton objectif n'est pas seulement l'extraction de faits "utiles" : c'est une décomposition quasi exhaustive du texte en unités sémantiques atomiques, y compris les formules administratives, les titres de civilité, les modalités de déclaration, les interactions procédurales et les qualifications de lieux.

Une assertion documentaire atomique est la représentation minimale d'une information explicitement portée par la transcription, quelle que soit sa valeur généalogique. L'ensemble des assertions doit permettre de reconstruire sémantiquement presque tout ce que le document affirme, sans ajouter d'information extérieure. Le "presque" concerne uniquement les éléments purement grammaticaux (articles, conjonctions, ponctuation) qui n'ajoutent aucun sens documentaire.

Parcours la transcription de gauche à droite. Pour chaque groupe de mots porteur d'information, vérifie qu'au moins une assertion en conserve le contenu. N'ignore aucune information sous prétexte qu'elle est administrative, stylistique, sociale, procédurale, redondante ou apparemment sans intérêt généalogique — titres ("sieur", "dame"), qualificatifs de lieu ("hameau", "section"), formules procédurales ("interpellé de signer", "lecture donnée"), présence à plusieurs étapes d'un même acte (déclaration ET présentation si les deux sont nommées) sont tous des faits documentaires à part entière.

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

## L'entité document — très important
L'acte lui-même est une entité, au même titre que les personnes qu'il mentionne : crée une entité de type "document" (ex. local_key "D1", label descriptif comme "Acte de naissance de Blaise Gustave").

TOUS les faits qui concernent l'acte en tant qu'écrit — sa date, son lieu et son heure de rédaction (act_date/act_place/act_time), son type (document_type), le fait qu'il ait été lu aux comparants (reading) — doivent avoir l'entité document comme "subject", JAMAIS l'officiant qui le signe ni aucune autre personne. "Valluet a pour date de rédaction le 10 février 1875" est FAUX ; "L'acte est daté du 10 février 1875" (subject = D1) est correct. L'officiant reste sujet de ses propres faits personnels : son nom, sa fonction, son rôle d'officier, le fait qu'il signe.

ATTENTION à ne pas confondre le lieu de rédaction de l'acte (act_place) avec un lieu mentionné DANS LE RÉCIT d'un événement concernant une personne (où quelqu'un est né, décédé, domicilié...). Si une commune est nommée dans le passage qui décrit la naissance d'un enfant (même par une expression comme "en notre commune"), c'est un birth_place de cette personne, pas un act_place du document, même si la commune est la même que celle de l'acte.
RÈGLE MÉTIER OFFICIELLE, DÉFINITIVE (ne la remets plus en question) : la formule de préambule "officier de l'état civil de la commune de X" (ou équivalent) établit UNIQUEMENT la circonscription/juridiction de l'officier — ce n'est PAS le lieu de rédaction de l'acte, même par convention. Ne produis JAMAIS act_place à partir de cette seule formule. Produis à la place : l'officiant (P1) -- administrative_area --> l'entité place de cette commune (ex. "Valluet -- administrative_area --> Deshayes"), avec pour source_text la formule littérale. act_place ne s'utilise QUE si le texte affirme SÉPARÉMENT et explicitement, par une formule distincte de rédaction/clôture ("fait et rédigé à X", "passé en la maison commune de X"...), où l'acte est matériellement dressé — ce qui est rare. Si aucune formule de ce type n'existe dans le texte, ne produis PAS d'act_place du tout : ce n'est pas une omission, c'est le résultat correct.

## L'entité place (lieux)
Quand un lieu nommé (commune, section, hameau, lieu-dit) est mentionné et qu'il porte lui-même des faits (ex. "Caféyère" est à la fois une section ET un hameau, et se situe dans la commune de Deshayes), crée une entité de type "place" pour lui (ex. local_key "L1", label le nom du lieu) plutôt que de répéter le nom en texte libre dans chaque assertion. Relie ensuite les faits sur ce lieu avec ce lieu comme "subject", TOUJOURS via "quality" pour décrire sa nature (ex. L1 -- quality --> "section", L1 -- quality --> "hameau") — une seule logique, ne mélange jamais avec d'autres prédicats pour le même genre de fait. "section" et "hamlet" ne sont PAS dans le vocabulaire contrôlé, ne les utilise pas. Utilise "administrative_area" uniquement pour relier ce lieu à la circonscription/commune qui le contient (ex. L1 -- administrative_area --> L2 où L2 est l'entité place de la commune). Les autres assertions (ex. birth_place d'une personne) peuvent alors référencer ce lieu comme "object" plutôt que de dupliquer le nom en value_text — mais value_text reste acceptable pour un lieu mentionné une seule fois sans fait propre à en dire. N'invente pas de hiérarchie géographique au-delà de ce que le texte affirme explicitement.

## L'entité event — DOCTRINE : à utiliser avec parcimonie, pas pour tout
Les entités event sont un outil pour les cas complexes, PAS le mode par défaut. Deux options :
1. Un fait à un seul acteur, sans autre participant à relier (ex. "Bourdin signe", "Valluet signe") → utilise UNIQUEMENT le prédicat direct sur la personne (signs, comparant...). NE CRÉE PAS d'entité event pour ça, même si plusieurs personnes ont chacune leur propre fait simple (ex. Bourdin ET Valluet signent : DEUX assertions "signs" séparées, pas un event partagé). Le fait qu'il ait été donné lecture de l'acte suit une règle à part : "reading" a TOUJOURS pour sujet l'entité document (D1), jamais la personne qui lit ou reçoit lecture, même si une seule personne est concernée — voir "L'entité document".
2. Une action avec plusieurs rôles distincts à relier entre eux (qui agit, qui est concerné, devant qui, qui d'autre est présent) → LÀ crée une entité event, avec local_key "E1", "E2"... et label descriptif (ex. "Présentation de l'enfant"). Cas typique : une présentation où il faut relier l'acteur, la personne présentée, l'officiant devant qui ça se passe, ET les témoins seulement présents.

Utilise ces prédicats event (uniquement dans le cas 2 ci-dessus) :
- actor : subject = event, object = la personne qui accomplit l'action.
- before_person : subject = event, object = la personne devant qui l'action a lieu (typiquement l'officiant).
- presented_person : subject = event, object = la personne présentée (cas d'une présentation).
- present_at : subject = personne, object = event — une personne présente lors de cet événement.

Exemple : "Némorin... nous a présenté un enfant... en présence des sieurs Bourdin et Alcibiade" donne, en plus des assertions habituelles sur Némorin/l'enfant : une entité event E2 "Présentation de l'enfant" ; E2 -- actor --> Némorin ; E2 -- presented_person --> l'enfant ; E2 -- before_person --> l'officiant (si déjà identifié) ; Bourdin -- present_at --> E2 ; Alcibiade -- present_at --> E2.

NE FUSIONNE PAS deux actions nommées séparément dans le texte en une seule entité event, même si elles s'enchaînent ou partagent les mêmes participants. Si le texte dit "déclaration et présentation", ce sont DEUX actions distinctes : crée une entité event pour la présentation (avec actor/presented_person/before_person) ET, séparément si elle a elle aussi plusieurs rôles à relier, une autre pour la déclaration — ne les regroupe pas sous un seul "E3 = déclaration et présentation". Si un témoin est présent aux deux, produis deux assertions present_at distinctes (une par événement), pas une seule vers une entité fusionnée.

Les entités event COMPLÈTENT les prédicats de rôle existants (comparant, declarant, witness, signs, reading...), elles ne les remplacent PAS : quand tu crées un event pour une action, garde aussi le prédicat de rôle direct sur son acteur principal si un prédicat dédié existe (ex. l'acteur d'une présentation reste aussi "declarant" si le texte le qualifie ainsi par ailleurs).

EXCEPTION — ne duplique pas un prédicat d'action qui redit EXACTEMENT ce que l'event exprime déjà avec son object. Si tu crées "E1 -- presented_person --> Blaise" ET "E1 -- actor --> Némorin", c'est déjà l'équivalent complet de "Némorin -- presentation --> Blaise" : ne produis PAS en plus cette assertion "presentation" sans objet sur Némorin, ce serait la même information stockée deux fois sous deux formes. Cette exception ne s'applique qu'aux prédicats d'ACTION qui ont un équivalent event complet (presentation, naming_declaration) — elle ne s'applique PAS aux qualités documentaires distinctes comme "witness" (statut juridique de témoin) qui coexiste normalement avec "present_at" (participation à l'événement) : ce sont deux faits différents, garde les deux.

"declares" est un prédicat de dernier recours pour une déclaration qui ne correspond à AUCUN prédicat plus spécifique — ce n'est PAS un doublon systématique à ajouter en plus d'un prédicat déjà précis. Si le fait est déjà couvert par "naming_declaration" (ou tout autre prédicat plus spécifique), NE PRODUIS PAS en plus une assertion "declares" sur la même personne pour le même passage — même règle générale que pour les events : un même fait, une seule assertion, sous le prédicat le plus spécifique disponible.

## Sens des relations entre personnes — ne produis JAMAIS les deux sens
Chaque prédicat relationnel a un sens fixe : "subject -- father --> object" signifie TOUJOURS "le père du sujet est l'objet" (jamais l'inverse). Une fois que tu as établi une relation dans un sens, ne produis pas la relation inverse ou redondante pour la même paire de personnes — la relation n'est stockée qu'une fois. Si le texte permet d'établir "P3 -- father --> P2" (l'enfant a pour père le déclarant), ne produis pas aussi une assertion où P2 a pour "père" ou "enfant" P3 avec predicate="father" — choisis le sens canonique et une seule direction.

Ne duplique jamais une relation sous forme de "quality" ou "title". Si un mot désigne une relation à une autre personne (épouse, mari, veuf/veuve de, témoin de...), c'est une relation avec un "object", PAS une qualité indépendante — ne produis pas les deux pour le même fait. Exemple : le texte dit "son épouse Alidor Reinette" → produis UNIQUEMENT "Némorin -- spouse --> Alidor" (ou l'inverse selon le sens canonique choisi), PAS en plus "Alidor -- quality --> épouse". "quality"/"title" servent aux statuts qui ne relient pas à une autre personne (propriétaire, sieur, dame...).

NE CONFONDS PAS spouse et widowhood — ce sont deux prédicats pour deux faits différents, pas des synonymes. "épouse"/"mari"/"époux" (mariage en cours, la personne est vivante et mariée) → predicate = spouse, JAMAIS widowhood. "veuf"/"veuve" (le mot lui-même doit être explicitement présent dans le texte) → predicate = widowhood. Ne produis JAMAIS d'assertion widowhood à partir d'un texte qui dit seulement "son épouse X" — c'est une hallucination de prédicat, pas juste une redondance.

NE CONFONDS PAS non plus witness et les autres rôles (spouse, mother, father, comparant, declarant...) — le predicate "witness" ne doit être produit QUE si le source_text cité contient lui-même un marqueur documentaire explicite de témoignage ("témoin", "témoins", "en présence de", "en présence des"...). Un passage qui établit uniquement une relation familiale (ex. "de lui déclarant et de son épouse la Dame X") ne prouve PAS que cette personne est témoin, même si elle est physiquement présente à l'acte — n'en déduis pas "witness". Choisis le prédicat que le passage démontre réellement (ici spouse et/ou mother), pas celui qui semblerait plausible par ailleurs.

IMPORTANT pour le source_text d'un "witness" : quand plusieurs témoins sont énumérés dans une même formule ("en présence des sieurs X et Y, [description de X], et [description de Y]"), le source_text de CHAQUE assertion witness (celle de X comme celle de Y) doit inclure le marqueur de présence lui-même ("en présence des sieurs X et Y"), pas seulement la clause descriptive propre à cette personne (âge, profession, domicile) qui, isolée, ne contient plus le marqueur. Cite le segment le plus court qui reste néanmoins autosuffisant pour prouver le témoignage de CETTE personne précise (inclut le marqueur + son nom), plutôt qu'un segment qui ne porte que sa description.

## Preuve obligatoire — précision, pas juste proximité
Chaque assertion doit avoir "source_text" : la citation exacte (mot pour mot) du passage qui la justifie SPÉCIFIQUEMENT. Le passage doit démontrer précisément CE fait, pas juste se trouver à proximité dans la phrase. Exemple : pour l'assertion "P3 a pour père P2", la preuve correcte est le segment qui établit la filiation ("de lui déclarant et de son épouse..."), pas une phrase voisine qui parle seulement de la présentation de l'enfant sans établir la paternité. Cette même règle s'applique aux rôles comme declarant/comparant/witness : pour "declarant", la preuve correcte est le segment qui identifie précisément qui déclare ("de lui déclarant"), pas une phrase générale qui mentionne "déclaration et présentation faites" sans dire qui en est l'auteur. Si tu ne peux pas rattacher une assertion à un passage qui la démontre précisément, ne la produis pas.
Fournis aussi "source_start" et "source_end" : la position de ce passage dans le texte fourni, en index de caractères (0-based, le premier caractère du texte est à l'index 0).

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
Attribue un identifiant local stable à chaque personne, à l'acte lui-même, à chaque lieu nommé qui porte ses propres faits, et à chaque événement modélisé : P1, P2, P3... pour les personnes, D1 (D2 s'il y a plusieurs documents) pour l'acte, L1, L2, L3... pour les lieux (voir "L'entité place"), E1, E2, E3... pour les événements (voir "L'entité event"). Le "subject" et l'éventuel "object" de chaque assertion référencent ces identifiants, jamais le nom directement.
IMPORTANT : le tableau "entities" est OBLIGATOIRE et doit être rempli EN PREMIER, avant "assertions", avec une entrée par personne, par lieu créé en entité, par événement créé en entité, ET l'entité document — chaque entrée a "local_key", "label", et "entity_type" ("person", "document", "place" ou "event"). N'utilise jamais un local_key dans "subject" ou "object" sans l'avoir déclaré dans "entities".

## Vocabulaire de prédicats contrôlé, en quatre couches
Faits stables sur une personne : ${PREDICATE_LAYERS.person_facts.join(', ')}.
Actions documentaires : ${PREDICATE_LAYERS.documentary_actions.join(', ')}.
Caractéristiques du document/contexte (subject = l'entité document) : ${PREDICATE_LAYERS.document_context.join(', ')}.
Relations d'événement (voir "L'entité event") : ${PREDICATE_LAYERS.event_relations.join(', ')}.
Si aucun ne convient, utilise "other" et remplis "raw_relation" avec la relation telle qu'exprimée dans le texte (ex. "cousin germain du futur époux").

## Format
Réponds uniquement via l'outil fourni, jamais en texte libre.`

type EntityOut = { local_key: string; label: string; entity_type?: 'person' | 'document' | 'place' | 'event' }
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
            entity_type: { type: 'string', enum: ['person', 'document', 'place', 'event'], description: 'Type de l\'entité' },
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
            predicate: { type: 'string', description: `Un code parmi : ${CONTROLLED_PREDICATES.join(', ')}` },
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

function validateAssertions(raw: AssertionOut[], entityKeys: Set<string>): AssertionOut[] {
  return raw.filter(a =>
    typeof a.subject === 'string' && entityKeys.has(a.subject)
    && typeof a.predicate === 'string'
    && typeof a.source_text === 'string' && a.source_text.trim().length > 0
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

    // ---- Passe 1 : extraction ----
    const extractMsg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      tools: [ASSERTIONS_TOOL],
      tool_choice: { type: 'tool', name: 'submit_assertions' },
      messages: [{ role: 'user', content: `Texte à analyser (index de caractères 0-based) :\n\n${text}` }],
    })
    const pass1 = extractToolInput(extractMsg)

    // ---- Passe 2 : audit des omissions ----
    const auditMsg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      tools: [ASSERTIONS_TOOL],
      tool_choice: { type: 'tool', name: 'submit_assertions' },
      messages: [{
        role: 'user',
        content: `Texte original (index de caractères 0-based) :\n\n${text}\n\n---\n\nEntités déjà identifiées :\n\n${JSON.stringify(pass1.entities)}\n\nAssertions déjà trouvées :\n\n${JSON.stringify(pass1.assertions, null, 2)}\n\n---\n\nQuestion à te poser pour chaque portion du texte : existe-t-il, dans la transcription, un mot, un groupe de mots ou une relation syntaxique porteur d'information qui n'est représenté par AUCUNE assertion ci-dessus ? Cherche en particulier les titres de civilité, les qualificatifs de lieu, les formules procédurales, les statuts (distincts des professions), et les faits propres à l'acte lui-même (date/lieu/heure/type/lecture — subject doit être l'entité document, pas une personne, et à ne pas confondre avec un lieu mentionné dans le récit d'un événement personnel). Vérifie spécifiquement : (1) chaque signataire mentionné nommément OU via "nous"/"avec nous" a-t-il bien son assertion "signs" ? (2) aucune assertion n'attribue une action (declares/presentation/signs/consent...) à une personne seulement citée comme présente ("en présence de X") plutôt qu'actrice réelle de l'action ? Ne produis PAS d'assertion supplémentaire pour un fait déjà couvert ci-dessus même sous une autre formulation. Ne refais pas l'extraction complète, ne redonne pas les assertions déjà listées. Réutilise les local_key existants pour les entités déjà connues (document et lieux compris) ; crée-en de nouveaux uniquement pour de nouvelles entités. Si rien ne manque, renvoie des listes vides.`,
      }],
    })
    const pass2 = extractToolInput(auditMsg)

    const entityMap = new Map<string, EntityOut>()
    for (const e of [...pass1.entities, ...pass2.entities]) {
      if (e?.local_key && e?.label) {
        const type: EntityOut['entity_type'] =
          e.entity_type === 'document' || e.entity_type === 'place' || e.entity_type === 'event' ? e.entity_type : 'person'
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
    function inferEntityType(key: string): EntityOut['entity_type'] {
      for (const a of allRawAssertions) {
        if (a?.subject !== key) continue
        const p = a.predicate
        if (p === 'document_type' || p === 'act_date' || p === 'act_time' || p === 'act_place' || p === 'reading') return 'document'
        if (p === 'actor' || p === 'before_person' || p === 'presented_person') return 'event'
        if (p === 'quality' && typeof a.value_text === 'string'
          && ['section', 'hameau', 'commune', 'ville', 'quartier', 'paroisse', 'lieu-dit'].includes(a.value_text.trim().toLowerCase())) return 'place'
      }
      for (const a of allRawAssertions) {
        if (a?.object !== key) continue
        if (a.predicate === 'present_at') return 'event'
        if (a.predicate === 'administrative_area' || a.predicate === 'birth_place' || a.predicate === 'death_place') return 'place'
      }
      return 'person'
    }
    // "name" ne résout que les personnes (aucun document/lieu/event n'a de
    // predicate "name") — sans repli, ces trois types s'affichaient tels
    // quels ("D1", "L2", "E1") dans toute l'UI en aval. Repli en cascade :
    // document_type (lisible pour un document, ex. "acte de naissance"),
    // puis le premier source_text où la clé apparaît (imparfait mais bien
    // plus lisible qu'un local_key brut), puis la clé en tout dernier recours.
    function inferEntityLabel(key: string): string {
      const named = allRawAssertions.find(a => a?.subject === key && a?.predicate === 'name' && typeof a.value_text === 'string' && a.value_text.trim())
      if (named) return (named.value_text as string).trim()
      const docType = allRawAssertions.find(a => a?.subject === key && a?.predicate === 'document_type' && typeof a.value_text === 'string' && a.value_text.trim())
      if (docType) return (docType.value_text as string).trim()
      const anyMention = allRawAssertions.find(a => (a?.subject === key || a?.object === key) && typeof a.source_text === 'string' && a.source_text.trim())
      if (anyMention) return (anyMention.source_text as string).trim().slice(0, 60)
      return key
    }
    function ensureEntity(key: unknown) {
      if (typeof key !== 'string' || !key) return
      if (!entityMap.has(key)) entityMap.set(key, { local_key: key, label: inferEntityLabel(key), entity_type: inferEntityType(key) })
    }
    for (const a of allRawAssertions) {
      ensureEntity(a?.subject)
      ensureEntity(a?.object)
    }

    const entityKeys = new Set(entityMap.keys())

    // Même logique de robustesse pour les offsets : si source_start/
    // source_end manquent (vu conjointement au bug ci-dessus dans le même
    // run réel), on retrouve la position par recherche exacte du source_text
    // dans le texte plutôt que de laisser l'assertion sans surlignage
    // possible. Best-effort : si la citation apparaît plusieurs fois, prend
    // la première occurrence — imparfait mais mieux que rien.
    function recoverOffsets(a: AssertionOut): AssertionOut {
      if (a.source_start != null && a.source_end != null) return a
      if (!a.source_text) return a
      const idx = text.indexOf(a.source_text)
      if (idx < 0) return a
      return { ...a, source_start: idx, source_end: idx + a.source_text.length }
    }

    const assertions = [
      ...validateAssertions(pass1.assertions, entityKeys),
      ...validateAssertions(pass2.assertions, entityKeys),
    ].map(recoverOffsets)

    return new Response(JSON.stringify({
      entities: [...entityMap.values()],
      assertions,
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
