# REBOND

# Architecture fonctionnelle complète

Version 1.0

---

# 1. Objet du document

Ce document décrit l'architecture fonctionnelle de REBOND.

Il traduit la vision métier, le méta-modèle, la cartographie des capacités, le Business Object Model, le Lifecycle Model, le catalogue des règles métier, le modèle de confiance et l'architecture de la connaissance en grands ensembles fonctionnels.

L'objectif est de répondre à la question :

> Quels blocs fonctionnels REBOND doit-il proposer pour transformer des traces documentaires en connaissance historique reconstruite, sourcée et exploitable ?

---

# 2. Principes directeurs

REBOND n'est pas conçu comme un logiciel de généalogie.

REBOND est une plateforme de reconstruction d'entités à partir de traces documentaires.

L'architecture fonctionnelle doit donc respecter les principes suivants :

* le document est une matière première ;
* la mention est l'unité d'observation ;
* l'assertion est l'unité de connaissance interprétée ;
* l'entité est l'objet reconstruit ;
* la relation structure le graphe ;
* l'événement explique le changement ;
* l'état conserve l'évolution dans le temps ;
* la source garantit la traçabilité ;
* la confiance qualifie la solidité de la connaissance ;
* l'humain conserve le pouvoir de validation.

---

# 3. Vue d'ensemble fonctionnelle

L'architecture fonctionnelle de REBOND est organisée en 14 domaines.

1. Gestion du patrimoine documentaire
2. Transcription et annotation
3. Extraction et structuration des connaissances
4. Gestion des entités
5. Réconciliation
6. Gestion des relations et événements
7. Gestion temporelle et états
8. Moteur de confiance, hypothèses et inférences
9. Contrôle qualité et validation
10. Graphe de connaissance
11. Exploration et recherche
12. Visualisation et restitution
13. Diffusion, export et interopérabilité
14. Administration fonctionnelle et référentiels

---

# 4. Chaîne fonctionnelle cible

Le fonctionnement général de REBOND suit la chaîne suivante :

Document brut
→ Référencement
→ Transcription
→ Annotation
→ Identification des mentions
→ Production d'assertions
→ Création d'entités candidates
→ Réconciliation
→ Validation
→ Graphe de connaissance
→ Exploration
→ Restitution
→ Export

Cette chaîne n'est pas linéaire.

Chaque nouvelle source peut enrichir, corriger, contredire ou réviser une connaissance existante.

---

# 5. Domaine 1 — Gestion du patrimoine documentaire

## Finalité

Constituer le socle documentaire à partir duquel REBOND produit la connaissance.

## Responsabilités fonctionnelles

* gérer les sources ;
* gérer les documents ;
* organiser les corpus ;
* conserver les références ;
* garantir la traçabilité documentaire.

## Fonctions principales

### 5.1 Gestion des sources

Permettre de créer, qualifier et maintenir les sources documentaires.

Fonctions attendues :

* création d'une source ;
* description de son origine ;
* qualification de sa nature ;
* indication de sa période de couverture ;
* indication de son périmètre géographique ;
* qualification de sa fiabilité ;
* gestion des producteurs de source.

### 5.2 Gestion des documents

Permettre d'intégrer et de décrire les documents.

Fonctions attendues :

* ajout d'un document ;
* rattachement à une source ;
* saisie de la cote ou référence ;
* typage du document ;
* description du contexte ;
* gestion des pages ou vues ;
* statut d'exploitation du document.

### 5.3 Gestion des corpus

Permettre de regrouper des documents selon une logique métier.

Exemples :

* corpus d'état civil ;
* corpus notarié ;
* corpus foncier ;
* corpus de presse ;
* corpus familial ;
* corpus territorial.

### 5.4 Traçabilité documentaire

Permettre de toujours revenir du résultat à la source.

Attendu :

* toute mention doit renvoyer au document ;
* toute assertion doit renvoyer à ses mentions ;
* toute entité doit afficher les preuves qui la soutiennent.

---

# 6. Domaine 2 — Transcription et annotation

## Finalité

Transformer le document brut en matière textuelle et annotée exploitable.

## Responsabilités fonctionnelles

* produire une transcription ;
* conserver le texte original ;
* permettre les corrections ;
* distinguer lecture, interprétation et annotation ;
* gérer l'incertitude de lecture.

## Fonctions principales

### 6.1 Transcription

Fonctions attendues :

* saisie de transcription ;
* correction ;
* versionnement ;
* indication des passages incertains ;
* gestion des mots illisibles ;
* distinction entre transcription fidèle et texte normalisé.

### 6.2 Annotation documentaire

Fonctions attendues :

* annotation d'une zone ;
* annotation d'un passage ;
* annotation d'une mention ;
* commentaire de lecture ;
* qualification d'un passage important.

### 6.3 Validation de transcription

Fonctions attendues :

* statut de transcription ;
* relecture ;
* validation ;
* rejet ;
* historique des corrections.

---

# 7. Domaine 3 — Extraction et structuration des connaissances

## Finalité

Passer du texte transcrit à des informations métier formalisées.

## Responsabilités fonctionnelles

* identifier les mentions ;
* qualifier les mentions ;
* produire des assertions ;
* structurer les faits ;
* préparer la création d'entités.

## Fonctions principales

### 7.1 Identification des mentions

Types de mentions :

* personne ;
* lieu ;
* bien ;
* organisation ;
* événement ;
* date ;
* montant ;
* profession ;
* rôle ;
* lien familial ;
* voisinage ;
* contrat ;
* référence documentaire.

### 7.2 Qualification des mentions

Fonctions attendues :

* type de mention ;
* valeur lue ;
* valeur normalisée ;
* contexte ;
* niveau d'incertitude ;
* lien avec la transcription.

### 7.3 Production d'assertions

Une assertion formalise une information interprétée.

Exemples :

* une personne exerce une profession ;
* une personne réside dans un lieu ;
* un bien appartient à une personne ;
* un événement se produit à une date ;
* une relation existe entre deux entités.

### 7.4 Structuration des rôles

Dans un document, une entité peut avoir un rôle.

Exemples :

* déclarant ;
* défunt ;
* héritier ;
* vendeur ;
* acquéreur ;
* témoin ;
* voisin ;
* propriétaire ;
* débiteur ;
* créancier.

---

# 8. Domaine 4 — Gestion des entités

## Finalité

Créer, maintenir et enrichir les objets reconstruits par REBOND.

## Responsabilités fonctionnelles

* gérer les personnes ;
* gérer les groupes ;
* gérer les lieux ;
* gérer les biens ;
* gérer les organisations ;
* gérer les contrats ;
* gérer les entités hypothétiques.

## Fonctions principales

### 8.1 Gestion des personnes

Fonctions attendues :

* création d'une personne candidate ;
* gestion des noms et variantes ;
* gestion des rôles ;
* gestion des attributs ;
* parcours de vie ;
* sources associées ;
* statut de validation.

### 8.2 Gestion des groupes

Types de groupes :

* famille ;
* ménage ;
* communauté ;
* réseau ;
* groupe professionnel ;
* groupe religieux.

### 8.3 Gestion des lieux

Fonctions attendues :

* création d'un lieu ;
* gestion des toponymes ;
* gestion des variantes ;
* rattachement territorial ;
* localisation ;
* période d'existence ;
* lieux disparus.

### 8.4 Gestion des biens

Types de biens :

* propriété foncière ;
* parcelle ;
* maison ;
* bâtiment ;
* objet ;
* véhicule ;
* bien immatériel ;
* droit ;
* créance ;
* dette.

### 8.5 Gestion des organisations

Types :

* entreprise ;
* administration ;
* étude notariale ;
* paroisse ;
* association ;
* institution ;
* collectivité.

### 8.6 Gestion des contrats et obligations

Fonctions attendues :

* identification du contrat ;
* parties concernées ;
* obligations ;
* durée ;
* valeur ;
* événements associés ;
* extinction ou transmission.

---

# 9. Domaine 5 — Réconciliation

## Finalité

Relier plusieurs mentions, assertions ou entités qui décrivent potentiellement la même réalité.

## Responsabilités fonctionnelles

* proposer des rapprochements ;
* comparer des candidats ;
* gérer les doublons ;
* fusionner ou séparer ;
* expliquer les décisions ;
* conserver l'historique.

## Fonctions principales

### 9.1 Réconciliation des personnes

Critères :

* nom ;
* prénom ;
* âge ;
* date ;
* lieu ;
* conjoint ;
* parents ;
* enfants ;
* profession ;
* témoins ;
* voisinage ;
* signature ;
* patrimoine.

Résultats possibles :

* même personne ;
* probablement même personne ;
* doute ;
* personnes distinctes ;
* contradiction bloquante.

### 9.2 Réconciliation des lieux

Critères :

* toponyme ;
* variante orthographique ;
* rattachement territorial ;
* voisinage ;
* usage documentaire ;
* période ;
* localisation ;
* continuité historique.

### 9.3 Réconciliation des biens

Critères :

* désignation ;
* localisation ;
* propriétaires successifs ;
* bornages ;
* voisinages ;
* superficie ;
* usage ;
* historique des transmissions.

### 9.4 Réconciliation des événements

Critères :

* type d'événement ;
* participants ;
* date ;
* lieu ;
* document source ;
* conséquences observées.

### 9.5 Réconciliation documentaire

Fonctions attendues :

* identifier qu'un document mentionné ailleurs correspond à un document connu ;
* identifier un document disparu probable ;
* relier plusieurs références au même document ;
* gérer les documents hypothétiques.

### 9.6 Fusion et défusion

Toute réconciliation doit être réversible.

Fonctions attendues :

* fusion contrôlée ;
* conservation des preuves ;
* journal de décision ;
* défusion ;
* comparaison avant/après.

---

# 10. Domaine 6 — Gestion des relations et événements

## Finalité

Structurer les liens et les transformations entre entités.

## Responsabilités fonctionnelles

* gérer les relations ;
* gérer les événements ;
* relier événements et entités ;
* expliquer les changements ;
* structurer les réseaux.

## Fonctions principales

### 10.1 Gestion des relations

Types de relations :

* familiale ;
* sociale ;
* économique ;
* géographique ;
* patrimoniale ;
* contractuelle ;
* documentaire ;
* organisationnelle.

Chaque relation doit pouvoir porter :

* une source ;
* une période ;
* un niveau de confiance ;
* un statut de validation.

### 10.2 Gestion des événements

Types d'événements :

* naissance ;
* mariage ;
* décès ;
* vente ;
* achat ;
* donation ;
* succession ;
* bail ;
* dette ;
* déménagement ;
* création d'organisation ;
* dissolution ;
* division foncière ;
* regroupement foncier.

### 10.3 Participants et rôles

Un événement implique des entités avec des rôles.

Exemple pour une vente :

* vendeur ;
* acquéreur ;
* bien vendu ;
* notaire ;
* témoins ;
* créanciers éventuels.

### 10.4 Conséquences d'événement

Un événement peut produire :

* un changement d'état ;
* une nouvelle relation ;
* une extinction de relation ;
* une transmission ;
* une création d'entité ;
* une disparition d'entité.

---

# 11. Domaine 7 — Gestion temporelle et états

## Finalité

Représenter l'évolution des entités dans le temps.

## Responsabilités fonctionnelles

* gérer les dates exactes ;
* gérer les périodes ;
* gérer les dates estimées ;
* gérer les états successifs ;
* éviter l'écrasement historique.

## Fonctions principales

### 11.1 Gestion des temporalités

Types :

* date certaine ;
* date approximative ;
* intervalle ;
* borne minimale ;
* borne maximale ;
* période inconnue.

### 11.2 Gestion des états

Un état est une photographie temporelle d'une entité.

Exemples :

* profession à une date ;
* résidence à une période ;
* propriétaire d'un bien à une période ;
* nom d'un lieu à une période.

### 11.3 Cohérence temporelle

Fonctions attendues :

* détection d'incohérences ;
* alerte sur impossibilités ;
* gestion des chevauchements ;
* gestion des périodes concurrentes.

---

# 12. Domaine 8 — Moteur de confiance, hypothèses et inférences

## Finalité

Qualifier la solidité des connaissances et produire des connaissances dérivées.

## Responsabilités fonctionnelles

* calculer la confiance ;
* gérer les hypothèses ;
* produire des inférences ;
* expliquer les raisonnements ;
* comparer plusieurs scénarios.

## Fonctions principales

### 12.1 Gestion de la confiance

Niveaux :

* certain ;
* très probable ;
* probable ;
* possible ;
* douteux ;
* réfuté.

Facteurs :

* source ;
* cohérence ;
* convergence ;
* contradiction ;
* validation humaine.

### 12.2 Gestion des hypothèses

Types :

* identité probable ;
* filiation probable ;
* lieu probable ;
* propriété probable ;
* événement probable ;
* document disparu probable.

### 12.3 Inférence

Types de raisonnement :

* raisonnement par convergence ;
* raisonnement par contradiction ;
* raisonnement par voisinage ;
* raisonnement par continuité ;
* raisonnement par succession ;
* raisonnement par réseau ;
* raisonnement par absence.

### 12.4 Explicabilité

Toute inférence doit pouvoir être expliquée.

Attendus :

* preuves utilisées ;
* règles appliquées ;
* indices favorables ;
* contradictions ;
* niveau de confiance ;
* conclusion.

---

# 13. Domaine 9 — Contrôle qualité et validation

## Finalité

Garantir la fiabilité des connaissances produites.

## Responsabilités fonctionnelles

* détecter les anomalies ;
* contrôler la cohérence ;
* gérer les conflits ;
* valider les connaissances ;
* historiser les décisions.

## Fonctions principales

### 13.1 Contrôles documentaires

* document incomplet ;
* transcription non validée ;
* source manquante ;
* référence insuffisante.

### 13.2 Contrôles de cohérence

* incohérence chronologique ;
* incohérence géographique ;
* incohérence familiale ;
* incohérence patrimoniale ;
* incohérence contractuelle.

### 13.3 Contrôles de doublons

* personne potentiellement dupliquée ;
* lieu potentiellement dupliqué ;
* bien potentiellement dupliqué ;
* événement potentiellement dupliqué.

### 13.4 Validation humaine

Objets validables :

* transcription ;
* mention ;
* assertion ;
* entité ;
* relation ;
* événement ;
* hypothèse ;
* réconciliation.

### 13.5 Gestion des conflits

Le système doit permettre :

* de conserver plusieurs versions ;
* de documenter les contradictions ;
* de choisir un scénario principal ;
* de garder les scénarios alternatifs.

---

# 14. Domaine 10 — Graphe de connaissance

## Finalité

Organiser la connaissance reconstruite sous forme d'un graphe historique.

## Responsabilités fonctionnelles

* relier les entités ;
* relier les preuves aux connaissances ;
* maintenir les relations ;
* permettre les parcours ;
* soutenir les vues métier.

## Fonctions principales

### 14.1 Graphe des preuves

Relie :

* sources ;
* documents ;
* mentions ;
* assertions.

### 14.2 Graphe des entités

Relie :

* personnes ;
* groupes ;
* lieux ;
* biens ;
* organisations ;
* contrats.

### 14.3 Graphe des événements

Relie :

* événements ;
* participants ;
* rôles ;
* conséquences.

### 14.4 Graphe historique consolidé

Vue globale permettant :

* exploration ;
* analyse ;
* visualisation ;
* export ;
* inférence.

---

# 15. Domaine 11 — Exploration et recherche

## Finalité

Permettre aux utilisateurs d'interroger et parcourir la connaissance.

## Responsabilités fonctionnelles

* rechercher ;
* filtrer ;
* explorer ;
* naviguer ;
* comparer.

## Fonctions principales

### 15.1 Recherche documentaire

Recherche dans :

* sources ;
* documents ;
* transcriptions ;
* mentions.

### 15.2 Recherche d'entités

Recherche par :

* personne ;
* lieu ;
* bien ;
* organisation ;
* événement ;
* relation.

### 15.3 Recherche avancée

Critères :

* période ;
* territoire ;
* type de relation ;
* niveau de confiance ;
* statut de validation ;
* source ;
* rôle ;
* réseau.

### 15.4 Navigation relationnelle

Depuis une entité, accéder à :

* ses sources ;
* ses relations ;
* ses événements ;
* ses états ;
* ses hypothèses ;
* ses contradictions.

---

# 16. Domaine 12 — Visualisation et restitution

## Finalité

Rendre la connaissance compréhensible sous plusieurs formes.

## Responsabilités fonctionnelles

* produire des vues ;
* représenter les trajectoires ;
* représenter les réseaux ;
* restituer les preuves ;
* faciliter l'analyse.

## Fonctions principales

### 16.1 Fiche entité

Affiche :

* identité ;
* variantes ;
* états ;
* relations ;
* événements ;
* sources ;
* hypothèses ;
* niveau de confiance.

### 16.2 Chronologie

Permet de visualiser :

* événements ;
* changements d'état ;
* trajectoire ;
* sources dans le temps.

### 16.3 Carte

Permet de visualiser :

* lieux ;
* déplacements ;
* voisinages ;
* propriétés ;
* territoires.

### 16.4 Graphe relationnel

Permet de visualiser :

* réseaux familiaux ;
* réseaux sociaux ;
* réseaux économiques ;
* réseaux de voisinage ;
* réseaux documentaires.

### 16.5 Chaîne de propriété

Permet de suivre :

* propriétaires successifs ;
* divisions ;
* regroupements ;
* transmissions ;
* conflits.

### 16.6 Rapport de recherche

Permet de produire :

* synthèse ;
* preuves ;
* hypothèses ;
* contradictions ;
* conclusion argumentée.

---

# 17. Domaine 13 — Diffusion, export et interopérabilité

## Finalité

Permettre la réutilisation des connaissances produites.

## Responsabilités fonctionnelles

* exporter ;
* publier ;
* partager ;
* connecter ;
* alimenter d'autres systèmes.

## Fonctions principales

### 17.1 Export généalogique

Exemples :

* arbre ;
* ascendance ;
* descendance ;
* GEDCOM enrichi.

### 17.2 Export documentaire

Exemples :

* transcription ;
* corpus ;
* sources ;
* mentions ;
* rapports sourcés.

### 17.3 Export graphe

Exemples :

* relations ;
* réseaux ;
* entités ;
* événements.

### 17.4 Export cartographique

Exemples :

* lieux ;
* trajectoires ;
* propriétés ;
* voisinages.

### 17.5 API fonctionnelle

Permettre à d'autres applications de consommer les connaissances produites par REBOND.

---

# 18. Domaine 14 — Administration fonctionnelle et référentiels

## Finalité

Permettre la configuration métier du système.

## Responsabilités fonctionnelles

* gérer les référentiels ;
* gérer les rôles ;
* gérer les règles ;
* gérer les vocabulaires ;
* gérer les typologies.

## Fonctions principales

### 18.1 Référentiels documentaires

* types de documents ;
* types de sources ;
* cotes ;
* producteurs.

### 18.2 Référentiels d'entités

* types de personnes ;
* types de lieux ;
* types de biens ;
* types d'organisations.

### 18.3 Référentiels de relations

* parenté ;
* possession ;
* voisinage ;
* obligation ;
* appartenance ;
* participation.

### 18.4 Référentiels d'événements

* événements familiaux ;
* événements patrimoniaux ;
* événements territoriaux ;
* événements organisationnels.

### 18.5 Référentiels de qualité

* niveaux de confiance ;
* statuts de validation ;
* règles d'incohérence ;
* règles de rapprochement.

### 18.6 Gestion des droits

Profils possibles :

* lecteur ;
* contributeur ;
* transcripteur ;
* validateur ;
* administrateur de corpus ;
* administrateur fonctionnel.

---

# 19. Parcours fonctionnels principaux

## Parcours 1 — Exploiter un document

Document
→ description
→ transcription
→ annotation
→ mentions
→ assertions
→ entités candidates

## Parcours 2 — Réconcilier une personne

mentions de personne
→ comparaison
→ score de confiance
→ proposition
→ validation
→ personne consolidée

## Parcours 3 — Reconstruire un lieu

mentions de toponymes
→ variantes
→ rattachements territoriaux
→ localisation
→ voisinages
→ lieu historisé

## Parcours 4 — Reconstituer une propriété

mentions de biens
→ propriétaires
→ bornages
→ voisinages
→ transmissions
→ chaîne de propriété

## Parcours 5 — Produire une hypothèse

indices
→ règles d'inférence
→ hypothèse
→ niveau de confiance
→ validation ou réfutation

## Parcours 6 — Explorer une entité

entité
→ fiche
→ événements
→ relations
→ sources
→ chronologie
→ carte ou graphe

---

# 20. Frontières fonctionnelles

REBOND doit intégrer ou permettre :

* transcription ;
* structuration ;
* réconciliation ;
* validation ;
* exploration ;
* restitution ;
* export.

REBOND ne doit pas être réduit à :

* un outil OCR ;
* un simple logiciel de généalogie ;
* une simple GED ;
* une simple base documentaire ;
* un simple SIG ;
* un simple moteur de recherche.

Ces fonctions peuvent exister, mais elles sont au service d'une finalité supérieure : la reconstruction de la connaissance.

---

# 21. Définition fonctionnelle cible

REBOND est fonctionnellement complet lorsque l'utilisateur peut :

* intégrer une source ;
* exploiter un document ;
* produire des mentions ;
* produire des assertions ;
* créer des entités candidates ;
* réconcilier les entités ;
* gérer les hypothèses ;
* valider les connaissances ;
* explorer le graphe ;
* restituer les résultats ;
* exporter les connaissances produites.

Le système doit toujours permettre de répondre à quatre questions :

* Que sait-on ?
* Comment le sait-on ?
* À quel point en est-on certain ?
* Qu'est-ce que cela permet de reconstruire ?
