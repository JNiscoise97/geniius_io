# REBOND - Moteur de reconstruction du passé à partir de sources documentaires

## 1. Vision du projet

REBOND est une plateforme de dépouillement, structuration et réconciliation documentaire permettant de transformer des sources historiques hétérogènes en un graphe de connaissances fiable, sourcé et exploitable.

L’objectif n’est pas uniquement de transcrire des documents, mais de reconstruire progressivement les entités décrites par ces documents : personnes, familles, lieux, propriétés, événements, organisations, objets, contrats ou relations.

REBOND permet ainsi de passer d’archives dispersées à une représentation cohérente du passé.

---

## 2. Objectif fonctionnel

Le système doit permettre à un utilisateur de partir d’un document brut, d’en extraire les informations utiles, de les structurer, puis de les relier à des entités existantes ou nouvelles.

Chaque donnée produite doit être :

* sourcée ;
* datée ;
* vérifiable ;
* historisée ;
* réconciliable ;
* exportable ;
* explicable.

La finalité est de produire une base de connaissances capable d’alimenter différents usages : généalogie, histoire locale, reconstitution foncière, analyse de réseaux, cartographie historique, suivi d’objets ou de propriétés dans le temps.

---

## 3. Périmètre fonctionnel

### 3.1 Sources documentaires prises en charge

REBOND doit pouvoir exploiter différents types de sources :

* état civil ;
* registres paroissiaux ;
* actes notariés ;
* testaments ;
* inventaires après décès ;
* ventes ;
* baux ;
* donations ;
* contrats de mariage ;
* hypothèques ;
* cadastres ;
* plans ;
* recensements ;
* registres militaires ;
* presse ;
* annonces légales ;
* correspondances ;
* photographies ;
* archives privées ;
* documents administratifs divers.

Le système ne doit pas être limité à un type d’archive.

---

## 4. Utilisateurs cibles

### Généalogiste

Il dépouille des documents, identifie des personnes, reconstitue des familles et alimente des arbres généalogiques.

### Dépouilleur / transcripteur

Il saisit ou corrige les transcriptions et identifie les mentions importantes dans les documents.

### Validateur qualité

Il contrôle les données extraites, valide les rapprochements, corrige les erreurs et arbitre les conflits.

### Administrateur de référentiels

Il gère les référentiels de lieux, professions, types d’actes, rôles, organisations et variantes.

### Chercheur / historien

Il exploite le graphe pour analyser des populations, des territoires, des réseaux ou des trajectoires.

### Administrateur fonctionnel

Il configure les règles de structuration, de réconciliation, de validation et d’export.

---

## 5. Chaîne fonctionnelle principale

Le parcours cible est le suivant :

```text
Document brut
→ Ingestion
→ Description
→ Transcription
→ Identification des mentions
→ Structuration des données
→ Création des entités candidates
→ Réconciliation
→ Validation qualité
→ Graphe historique
→ Recherche / visualisation / export
```

---

## 6. Modules fonctionnels

## 6.1 Module d’ingestion documentaire

Ce module permet d’importer et de qualifier les documents.

Fonctionnalités attendues :

* téléversement d’un document ;
* rattachement à un fonds, une cote ou une collection ;
* saisie des métadonnées ;
* typage du document ;
* découpage en pages, vues ou actes ;
* gestion de l’état du document ;
* lien permanent vers la source d’origine.

Exemples d’états :

* importé ;
* à transcrire ;
* transcrit ;
* structuré ;
* à valider ;
* validé ;
* rejeté ;
* à revoir.

---

## 6.2 Module de transcription

Ce module permet de produire une transcription exploitable.

Fonctionnalités attendues :

* saisie manuelle ;
* correction ;
* versionnement ;
* annotation ;
* gestion des incertitudes ;
* conservation de la fidélité au texte original ;
* distinction entre transcription littérale et interprétation structurée.

La transcription doit rester liée au document source.

---

## 6.3 Module d’annotation et d’identification des mentions

Ce module permet d’identifier dans le texte les éléments significatifs.

Types de mentions :

* personne ;
* lieu ;
* propriété ;
* organisation ;
* événement ;
* date ;
* profession ;
* lien familial ;
* rôle ;
* bien ;
* dette ;
* contrat ;
* objet ;
* référence documentaire.

Chaque mention doit pouvoir être rattachée à une entité existante ou créer une entité candidate.

---

## 6.4 Module de structuration

Ce module transforme les mentions en données métier exploitables.

Exemples :

* une personne devient acteur d’un acte ;
* un lieu devient lieu de naissance, résidence ou décès ;
* une propriété devient objet de vente ;
* une dette devient obligation entre deux parties ;
* une date devient borne temporelle ;
* un témoin devient relation sociale ;
* un voisinage devient relation spatiale.

La structuration doit distinguer :

* ce qui est explicitement écrit ;
* ce qui est interprété ;
* ce qui est déduit ;
* ce qui est incertain.

---

## 6.5 Module de réconciliation des individus

Ce module rapproche les mentions d’une même personne.

Critères possibles :

* nom ;
* prénom ;
* âge ;
* date ;
* lieu ;
* profession ;
* conjoint ;
* parents ;
* enfants ;
* témoins ;
* résidence ;
* voisinage ;
* signatures ;
* contexte documentaire.

Le système doit proposer des rapprochements, mais permettre une validation humaine.

---

## 6.6 Module de réconciliation des lieux

Ce module permet de suivre les lieux dans le temps.

Fonctionnalités attendues :

* gestion des variantes de toponymes ;
* hiérarchie territoriale ;
* évolution des noms ;
* évolution des limites ;
* rattachement à des lieux parents ;
* gestion des lieux disparus ;
* suivi des déplacements individuels ;
* reconstitution de quartiers, hameaux, lieux-dits ou villes.

---

## 6.7 Module de réconciliation des propriétés et biens

Ce module suit les propriétés et biens dans le temps.

Il doit permettre de suivre :

* propriétés foncières ;
* maisons ;
* terrains ;
* bâtiments ;
* objets ;
* contrats ;
* créances ;
* dettes ;
* biens patrimoniaux ;
* véhicules ou autres objets identifiables.

Fonctionnalités attendues :

* chaîne de possession ;
* ventes ;
* héritages ;
* donations ;
* divisions ;
* regroupements ;
* changements de nom ;
* changements de caractéristiques ;
* voisinages ;
* historique complet de l’entité.

---

## 6.8 Module de reconstitution foncière et spatiale

Ce module exploite les descriptions de limites, bornages et voisinages.

Fonctionnalités attendues :

* identification des parcelles voisines ;
* création de relations de voisinage ;
* suivi des propriétaires limitrophes ;
* reconstitution progressive d’une carte ;
* visualisation des évolutions dans le temps ;
* analyse des entourages immédiats ;
* détection des continuités malgré les changements de propriétaires ou de noms.

---

## 6.9 Module de réconciliation documentaire

Ce module permet de reconstruire des événements ou documents absents.

Exemples :

* naissance déduite d’un mariage et d’un décès ;
* mariage mentionné dans plusieurs actes ;
* succession reconstruite par plusieurs ventes ;
* propriété identifiée malgré un acte manquant ;
* événement probable mentionné indirectement.

Chaque reconstruction doit comporter :

* les sources mobilisées ;
* le raisonnement ;
* le niveau de confiance ;
* les contradictions éventuelles.

---

## 6.10 Module de contrôle qualité

Ce module garantit la fiabilité des données.

Contrôles attendus :

* incohérences de dates ;
* doublons ;
* conflits de lieux ;
* contradictions entre sources ;
* impossibilités biologiques ou chronologiques ;
* rôles incompatibles ;
* ruptures de chaîne de propriété ;
* données non sourcées ;
* rapprochements incertains.

Le système doit produire des alertes et permettre leur résolution.

---

## 6.11 Module de graphe historique

Le cœur de REBOND est un graphe d’entités et de relations.

Entités principales :

* document ;
* mention ;
* personne ;
* famille ;
* lieu ;
* propriété ;
* bien ;
* organisation ;
* événement ;
* contrat ;
* relation ;
* source.

Relations principales :

* est mentionné dans ;
* réside à ;
* possède ;
* vend ;
* achète ;
* hérite ;
* est parent de ;
* est voisin de ;
* participe à ;
* témoigne ;
* est lié à ;
* succède à ;
* est variante de ;
* est probablement identique à.

---

## 6.12 Module de recherche et exploration

Le système doit permettre d’explorer les données selon plusieurs angles :

* recherche par personne ;
* recherche par lieu ;
* recherche par propriété ;
* recherche par document ;
* recherche par événement ;
* recherche par relation ;
* recherche par période ;
* recherche par source ;
* recherche par incertitude ;
* recherche par réseau.

Visualisations attendues :

* fiche entité ;
* chronologie ;
* carte ;
* arbre ;
* graphe relationnel ;
* chaîne de propriété ;
* réseau de voisinage ;
* historique des mentions.

---

## 6.13 Module d’export

REBOND doit permettre d’exporter les données vers d’autres outils.

Exports possibles :

* arbre généalogique ;
* fichier structuré ;
* CSV ;
* JSON ;
* GEDCOM enrichi ;
* API ;
* export cartographique ;
* export de graphe ;
* rapport de recherche sourcé.

---

## 7. Objets métier principaux

### Document

Support source exploité par le système.

### Mention

Occurrence d’une information dans un document.

### Entité

Objet réel ou historique reconstruit à partir de mentions.

### Relation

Lien entre deux entités.

### Événement

Fait daté ou estimé impliquant une ou plusieurs entités.

### Source

Origine documentaire d’une affirmation.

### Assertion

Information produite par le système, toujours liée à une source ou à un raisonnement.

### Niveau de confiance

Indicateur permettant de qualifier la fiabilité d’une donnée ou d’un rapprochement.

---

## 8. Principes fonctionnels clés

### Traçabilité

Aucune donnée ne doit exister sans source, justification ou statut explicite.

### Réversibilité

Une fusion ou une réconciliation doit pouvoir être annulée.

### Incertitude assumée

Le système doit gérer le probable, le possible, le douteux et le contradictoire.

### Validation humaine

Le moteur propose, l’utilisateur valide.

### Multi-entités

Le système ne doit pas être centré uniquement sur les personnes.

### Temporalité

Toute entité doit pouvoir évoluer dans le temps.

### Explicabilité

Le système doit expliquer pourquoi deux mentions sont rapprochées.

---

## 9. MVP proposé

Le MVP doit se concentrer sur un périmètre réduit mais démonstrateur.

### Périmètre MVP

* ingestion de documents ;
* transcription ;
* identification des personnes, lieux et dates ;
* structuration d’un acte ;
* création de mentions ;
* réconciliation d’individus ;
* réconciliation de lieux ;
* fiche entité ;
* historique des sources ;
* recherche simple ;
* validation qualité ;
* export vers un arbre ou un format structuré.

### Démonstration attendue

À partir d’un corpus limité, le système doit être capable de montrer :

* qu’un individu apparaît dans plusieurs documents ;
* qu’un lieu possède plusieurs variantes ;
* qu’une relation familiale est confirmée par plusieurs sources ;
* qu’une incohérence est détectée ;
* que chaque affirmation est sourcée.

---

## 10. Extensions fonctionnelles futures

Après le MVP, les extensions prioritaires peuvent être :

* reconstitution foncière ;
* cartographie historique ;
* gestion des propriétés et biens ;
* réconciliation documentaire avancée ;
* reconstruction d’événements absents ;
* analyse de réseaux sociaux historiques ;
* traitement de la presse ;
* moteur de règles ;
* calcul avancé de confiance ;
* API publique ;
* collaboration multi-utilisateurs ;
* marketplace de corpus ou de modèles.

---

## 11. Critères de réussite

Le projet est fonctionnellement réussi si REBOND permet :

* de transformer un document brut en données structurées ;
* de relier plusieurs mentions à une même entité ;
* de suivre une entité dans le temps ;
* de justifier chaque information par une source ;
* de détecter les contradictions ;
* de gérer l’incertitude ;
* de produire une connaissance nouvelle à partir de plusieurs documents ;
* d’explorer le passé par les personnes, les lieux, les biens, les événements et les relations.

---

## 12. Définition fonctionnelle cible

REBOND est un moteur de reconstruction d’entités à partir de traces documentaires.

Il permet d’identifier, structurer, relier, valider et exploiter les fragments d’information présents dans des sources hétérogènes afin de reconstruire l’histoire sourcée, datée et évolutive des entités qu’elles décrivent.
