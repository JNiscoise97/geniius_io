# REBOND

# Méta-modèle métier de reconstruction documentaire et historique

Version : 1.0

---

# 1. Objet du document

Ce document définit le méta-modèle métier de REBOND.

Son objectif est de décrire les concepts fondamentaux manipulés par le système, leurs responsabilités et leurs relations.

Il constitue le socle de référence pour :

* l'architecture métier ;
* les capacités métier ;
* les règles de gestion ;
* les modèles fonctionnels ;
* les modèles de données ;
* les interfaces utilisateur ;
* les mécanismes de réconciliation ;
* les mécanismes de contrôle qualité.

Le présent document est volontairement indépendant de toute considération technique.

---

# 2. Vision

Les archives et les documents constituent des traces fragmentées du passé.

Chaque document apporte une vision partielle de la réalité :

* une personne ;
* un lieu ;
* une propriété ;
* un événement ;
* une organisation ;
* une dette ;
* un objet ;
* une relation.

L'objectif de REBOND est de reconstruire les entités réelles décrites par ces documents et de suivre leur évolution dans le temps.

Le système ne vise pas à stocker des documents.

Il vise à produire une représentation cohérente, sourcée et explicable du monde décrit par ces documents.

---

# 3. Principe fondamental

Le fonctionnement métier de REBOND repose sur la chaîne suivante :

Source
→ Document
→ Mention
→ Assertion
→ Entité
→ Relation
→ Événement
→ État

L'ensemble est traversé par quatre dimensions transversales :

* Temporalité
* Confiance
* Hypothèse
* Validation

---

# 4. Concepts fondamentaux

## 4.1 Source

### Définition

Une source représente l'origine documentaire d'une information.

Elle permet de comprendre :

* d'où provient l'information ;
* dans quel contexte elle a été produite ;
* quel niveau de confiance lui accorder.

### Exemples

* archives départementales ;
* archives nationales ;
* collection privée ;
* étude notariale ;
* journal ;
* bibliothèque ;
* registre paroissial ;
* fonds familial.

### Responsabilités

* identifier l'origine ;
* contextualiser l'information ;
* garantir la traçabilité ;
* permettre l'évaluation critique.

### Principe

Aucune information ne peut exister sans source.

---

## 4.2 Document

### Définition

Un document est un support contenant des informations observables.

Le document constitue l'unité de consultation et de transcription.

### Exemples

* acte de naissance ;
* acte de mariage ;
* testament ;
* bail ;
* vente ;
* inventaire ;
* hypothèque ;
* article de presse ;
* lettre ;
* photographie ;
* recensement.

### Responsabilités

* conserver le contenu ;
* conserver le contexte ;
* conserver la référence à la source.

### Principe

Un document est une observation.
Il n'est pas la vérité.
Il contient des indices permettant de reconstruire la réalité.

---

## 4.3 Mention

### Définition

Une mention est une information observée dans un document.

Elle représente ce qui est effectivement lu.

Une mention n'est pas une interprétation.

### Exemples

"Jean Baptiste Dupont"

"Habitation Bellevue"

"1200 francs"

"cultivateur"

### Responsabilités

* conserver le texte original ;
* conserver sa position dans le document ;
* conserver sa transcription ;
* permettre plusieurs interprétations.

### Principe

Une même mention peut donner naissance à plusieurs interprétations.

---

## 4.4 Assertion

### Définition

Une assertion représente une interprétation d'une ou plusieurs mentions.

Elle exprime un fait.

### Exemples

Jean Baptiste Dupont est cultivateur.

Le mariage a eu lieu le 12 mai 1848.

La propriété appartient à Pierre Martin.

### Responsabilités

* produire du sens ;
* formaliser les faits ;
* conserver les preuves ;
* documenter le raisonnement.

### Principe

Toute assertion doit être justifiable par une ou plusieurs mentions.

---

## 4.5 Entité

### Définition

Une entité représente un objet réel ou historique reconstruit à partir d'assertions.

Elle constitue le concept central du système.

### Responsabilités

* représenter une réalité persistante ;
* agréger les connaissances ;
* évoluer dans le temps ;
* être reliée à d'autres entités.

### Types d'entités

#### Personne

Individu identifié ou supposé.

#### Groupe

Famille, ménage, communauté, organisation.

#### Lieu

Territoire, commune, quartier, habitation, parcelle.

#### Bien

Terrain, maison, objet, véhicule, œuvre.

#### Organisation

Entreprise, association, administration, paroisse.

#### Contrat

Dette, bail, engagement, obligation.

#### Document reconstitué

Document disparu ou hypothétique.

### Principe

Les entités sont les objets dont REBOND reconstitue l'histoire.

---

## 4.6 Relation

### Définition

Une relation représente un lien entre deux entités.

### Exemples

est parent de

possède

hérite de

habite

travaille pour

est voisin de

doit à

### Responsabilités

* relier les entités ;
* permettre les analyses de réseau ;
* contextualiser les événements ;
* expliquer les interactions.

### Principe

Une relation possède également une temporalité et des sources.

---

## 4.7 Événement

### Définition

Un événement représente une transformation affectant une ou plusieurs entités.

### Exemples

* naissance ;
* mariage ;
* décès ;
* vente ;
* donation ;
* déménagement ;
* construction ;
* faillite ;
* transmission.

### Responsabilités

* décrire les changements ;
* relier plusieurs entités ;
* produire des transitions d'état.

### Principe

Les événements expliquent pourquoi les entités changent.

---

## 4.8 État

### Définition

Un état représente une photographie d'une entité à un moment donné.

### Exemple

Une personne :

1840

* célibataire
* cultivateur

1860

* marié
* propriétaire

Même personne.
Deux états.

### Responsabilités

* conserver l'évolution ;
* éviter d'écraser l'historique ;
* permettre les analyses temporelles.

### Principe

Une entité est permanente.
Ses états évoluent.

---

# 5. Concepts transversaux

## 5.1 Temporalité

### Définition

La temporalité permet de situer une information dans le temps.

### Types

Date certaine

Date estimée

Intervalle

Date inconnue

### Principe

Toute information possède une dimension temporelle.

---

## 5.2 Confiance

### Définition

La confiance mesure le degré de certitude d'une information.

### Niveaux possibles

Certain

Très probable

Probable

Possible

Douteux

Réfuté

### Principe

Le système doit distinguer le fait de l'hypothèse.

---

## 5.3 Hypothèse

### Définition

Une hypothèse représente une connaissance non encore démontrée.

### Exemples

Lien de filiation probable.

Document disparu probable.

Propriété probablement identique.

### Responsabilités

* conserver les pistes ;
* documenter le raisonnement ;
* préparer les validations futures.

### Principe

Les hypothèses font partie intégrante de la connaissance historique.

---

## 5.4 Validation

### Définition

La validation représente une décision humaine concernant une information.

### États possibles

Proposé

Validé

Refusé

À vérifier

### Principe

Le moteur assiste.
L'humain décide.

---

# 6. Le graphe historique

## Définition

Le graphe historique représente la vision consolidée de la connaissance.

Il constitue la finalité de REBOND.

### Il contient

* les entités ;
* les relations ;
* les événements ;
* les états ;
* les assertions ;
* les hypothèses ;
* les sources.

### Il permet

* l'exploration ;
* la recherche ;
* l'analyse ;
* la cartographie ;
* la généalogie ;
* la reconstruction historique ;
* la reconstitution patrimoniale.

---

# 7. Règles fondatrices

## Traçabilité

Toute connaissance doit être reliée à sa justification.

---

## Explicabilité

Le système doit pouvoir expliquer toute conclusion.

---

## Réversibilité

Toute réconciliation doit pouvoir être annulée.

---

## Historicité

Aucune information ne doit détruire l'historique.

---

## Incertitude assumée

Le système doit gérer les hypothèses et les contradictions.

---

## Multi-entités

Le système ne doit pas être centré uniquement sur les personnes.

---

## Universalité

Le modèle doit permettre de reconstruire l'histoire de toute entité laissant des traces documentaires.

---

# 8. Définition finale

REBOND est un moteur de reconstruction documentaire permettant d'identifier, relier, qualifier et faire évoluer des entités à partir de traces documentaires hétérogènes.

Sa finalité est de produire une représentation sourcée, explicable, temporelle et évolutive du monde décrit par les documents.

La généalogie, l'histoire locale, la reconstitution foncière, l'analyse patrimoniale ou le suivi d'objets ne sont que différentes vues d'un même graphe historique.
