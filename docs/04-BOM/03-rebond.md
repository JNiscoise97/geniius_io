# REBOND

# Business Object Model (BOM)

Version 1.0

---

# 1. Objet du document

Le présent document définit les objets métier manipulés par REBOND.

Ces objets représentent les réalités que le système observe, reconstruit, relie ou fait évoluer.

Ils constituent le vocabulaire métier de référence utilisé dans :

* les règles métier ;
* les processus ;
* les capacités métier ;
* les modèles de données ;
* les interfaces ;
* les algorithmes de réconciliation.

---

# 2. Principe fondamental

REBOND ne manipule pas directement des documents.

REBOND manipule des connaissances issues de documents.

Le modèle métier repose sur une chaîne de transformation :

Source
→ Document
→ Mention
→ Assertion
→ Entité
→ Relation
→ Événement
→ État

---

# 3. Objets documentaires

## 3.1 Source

### Définition

Origine documentaire d'une information.

### Exemples

* Archives départementales
* Journal
* Fonds privé
* Bibliothèque
* Étude notariale

### Responsabilités

* contextualiser
* tracer l'origine
* qualifier la fiabilité

### Cycle de vie

Identifiée
→ Qualifiée
→ Exploitée
→ Historisée

---

## 3.2 Document

### Définition

Support documentaire contenant des observations.

### Exemples

* acte de naissance
* testament
* bail
* hypothèque
* photographie
* article de presse

### Responsabilités

* porter l'information
* conserver la preuve
* contextualiser les observations

### Cycle de vie

Importé
→ Décrit
→ Exploité
→ Validé
→ Archivé

---

## 3.3 Mention

### Définition

Information observée dans un document.

### Exemples

"Jean Dupont"

"Habitation Bellevue"

"1200 francs"

### Responsabilités

* conserver le texte observé
* permettre plusieurs interprétations

### Cycle de vie

Identifiée
→ Annotée
→ Reliée
→ Validée

---

## 3.4 Assertion

### Définition

Interprétation d'une ou plusieurs mentions.

### Exemples

Jean Dupont est cultivateur.

Pierre Martin possède cette propriété.

### Responsabilités

* exprimer un fait
* relier les observations au modèle métier

### Cycle de vie

Produite
→ Vérifiée
→ Validée
→ Contestée

---

# 4. Objets centraux

## 4.1 Entité

### Définition

Objet réel ou historique reconstruit à partir d'informations documentaires.

### Rôle

L'entité constitue l'objet central de REBOND.

### Caractéristiques

* possède une identité
* possède une histoire
* possède des relations
* évolue dans le temps

---

# 5. Personne

## Définition

Individu identifié ou supposé.

## Exemples

* individu historique
* individu contemporain
* individu hypothétique

## Responsabilités

* agréger les mentions
* reconstituer le parcours de vie
* gérer les identités multiples

## États possibles

Candidate

Réconciliée

Validée

Contestée

Fusionnée

---

## Objets associés

* Nom
* Prénom
* Alias
* Profession
* Résidence
* Statut
* Signature

---

# 6. Groupe

## Définition

Ensemble structuré de personnes.

## Types

* famille
* ménage
* communauté
* réseau social
* groupe professionnel

## Responsabilités

* représenter les collectifs
* suivre leur évolution

---

# 7. Organisation

## Définition

Structure organisée disposant d'une existence propre.

## Exemples

* entreprise
* administration
* paroisse
* association
* étude notariale

## Responsabilités

* représenter les structures collectives
* suivre les transformations

---

# 8. Lieu

## Définition

Espace géographique identifié.

## Exemples

* pays
* commune
* quartier
* habitation
* parcelle
* bâtiment

## Responsabilités

* localiser
* contextualiser
* structurer les territoires

---

## Objets associés

* Toponyme
* Coordonnée
* Hiérarchie territoriale
* Voisinage

---

# 9. Bien

## Définition

Objet pouvant être possédé, transmis ou transformé.

## Catégories

### Bien foncier

* terrain
* parcelle
* propriété

### Bien immobilier

* maison
* bâtiment

### Bien mobilier

* objet
* véhicule
* équipement

### Bien immatériel

* créance
* droit
* titre

---

## Responsabilités

* suivre les propriétaires
* suivre les transformations
* suivre les transmissions

---

# 10. Contrat

## Définition

Engagement créant des droits ou des obligations.

## Exemples

* bail
* dette
* prêt
* contrat de mariage
* servitude

## Responsabilités

* formaliser les engagements
* suivre leur évolution

---

# 11. Événement

## Définition

Transformation affectant une ou plusieurs entités.

## Exemples

* naissance
* mariage
* décès
* vente
* succession
* déménagement

## Responsabilités

* expliquer les changements
* créer des transitions

---

## Objets associés

* participants
* date
* lieu
* résultat

---

# 12. Relation

## Définition

Lien entre deux entités.

## Types

### Familiales

* père de
* mère de
* conjoint de

### Géographiques

* voisin de
* situé dans

### Patrimoniales

* possède
* hérite de

### Sociales

* témoin de
* associé de

### Économiques

* doit à
* loue à

---

## Responsabilités

* structurer le graphe
* permettre les analyses

---

# 13. État

## Définition

Photographie d'une entité à un instant donné.

## Exemple

Personne :

1840
Cultivateur

1860
Propriétaire

Même personne.

Deux états.

---

## Responsabilités

* conserver l'historique
* éviter les écrasements

---

# 14. Objets transverses

## 14.1 Temporalité

### Définition

Dimension temporelle applicable à tous les objets.

### Types

* date exacte
* intervalle
* estimation
* inconnue

---

## 14.2 Hypothèse

### Définition

Connaissance non démontrée.

### Exemples

* filiation probable
* identité probable
* document disparu probable

---

## 14.3 Confiance

### Définition

Mesure de certitude.

### Niveaux

* certain
* très probable
* probable
* possible
* douteux
* réfuté

---

## 14.4 Validation

### Définition

Décision humaine portant sur une connaissance.

### États

* proposé
* validé
* refusé
* à vérifier

---

# 15. Objet final : Graphe historique

## Définition

Représentation consolidée du monde reconstruit par REBOND.

## Composition

Le graphe est constitué de :

* entités ;
* événements ;
* relations ;
* états ;
* assertions ;
* hypothèses ;
* sources.

## Finalité

Permettre :

* l'exploration ;
* la recherche ;
* la généalogie ;
* la cartographie ;
* la reconstitution foncière ;
* l'analyse des réseaux ;
* l'étude des patrimoines.

---

# 16. Principe directeur

Dans REBOND, aucun objet n'existe isolément.

Chaque objet :

* est observé dans un document ;
* est relié à une source ;
* possède une temporalité ;
* peut être incertain ;
* peut évoluer ;
* peut être relié à d'autres objets.

Le système n'a pas vocation à stocker des documents.

Il a vocation à reconstruire le monde décrit par ces documents.
