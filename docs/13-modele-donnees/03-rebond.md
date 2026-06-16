# REBOND

# Architecture de données détaillée

Version 1.0

---

# 1. Objet du document

Ce document définit l'architecture de données de REBOND.

Son objectif est de décrire :

* les objets de données ;
* leurs relations ;
* leurs cycles de vie ;
* leurs contraintes ;
* leur historisation ;
* leur représentation dans les différents moteurs de stockage.

L'architecture de données constitue la traduction informatique de l'Architecture de la Connaissance.

---

# 2. Principes fondamentaux

## AD-001 — Séparation entre preuve et connaissance

Une preuve n'est pas une connaissance.

Une connaissance n'est pas une entité.

Une entité n'est pas un fait.

---

## AD-002 — Historisation native

Toute donnée métier est historisable.

Aucune donnée métier ne doit être écrasée.

---

## AD-003 — Traçabilité totale

Toute donnée reconstruite doit pouvoir remonter jusqu'aux preuves.

---

## AD-004 — Réversibilité

Toute réconciliation doit pouvoir être annulée.

---

## AD-005 — Incertitude native

Le modèle doit permettre de stocker :

* le doute ;
* l'hypothèse ;
* la contradiction ;
* les scénarios concurrents.

---

# 3. Architecture globale

Les données sont organisées en cinq couches.

```text
PREUVES
↓
OBSERVATIONS
↓
CONNAISSANCES
↓
RECONSTRUCTIONS
↓
GRAPHE HISTORIQUE
```

---

# 4. Couche PREUVES

## Finalité

Conserver les sources primaires.

---

# 4.1 Source

## Définition

Origine documentaire.

---

## Attributs principaux

* id
* type
* nom
* producteur
* description
* territoire
* période_couverte
* niveau_fiabilité

---

## Relations

Source
→ contient → Document

---

# 4.2 Document

## Définition

Support documentaire.

---

## Attributs

* id
* source_id
* type_document
* cote
* titre
* date_document
* description
* statut_exploitation

---

## Relations

Document
→ contient → Page

Document
→ appartient à → Corpus

---

# 4.3 Page

## Définition

Unité physique d'un document.

---

## Attributs

* id
* document_id
* numéro
* image_url

---

# 5. Couche OBSERVATIONS

---

# 5.1 Transcription

## Définition

Texte observé.

---

## Attributs

* id
* page_id
* contenu
* version
* statut

---

# 5.2 Annotation

## Définition

Observation contextualisée.

---

## Attributs

* id
* transcription_id
* position
* commentaire

---

# 5.3 Mention

## Définition

Information observée.

---

## Types

* personne
* lieu
* bien
* organisation
* événement
* date
* montant
* profession
* relation
* contrat

---

## Attributs

* id
* type
* valeur_lue
* valeur_normalisée
* niveau_confiance
* transcription_id

---

# 6. Couche CONNAISSANCES

---

# 6.1 Assertion

## Définition

Interprétation d'une ou plusieurs mentions.

---

## Attributs

* id
* type
* valeur
* confiance
* statut

---

## Relations

Assertion
→ dérive de → Mention

---

# 6.2 Hypothèse

## Définition

Connaissance non démontrée.

---

## Attributs

* id
* type
* scénario
* confiance
* statut

---

# 6.3 Validation

## Définition

Décision humaine.

---

## Attributs

* id
* objet_type
* objet_id
* décision
* commentaire
* validateur
* date_validation

---

# 7. Couche RECONSTRUCTIONS

---

# 7.1 Entité

## Définition

Objet reconstruit.

---

## Types

* personne
* groupe
* lieu
* bien
* organisation
* contrat

---

## Attributs

* id
* type
* statut
* confiance
* date_creation

---

---

# 7.2 Personne

## Attributs spécifiques

* sexe
* date_naissance
* date_décès

---

## Objets enfants

Nom

Prénom

Alias

Profession

Résidence

Signature

Statut

---

# 7.3 Groupe

## Types

* famille
* ménage
* communauté
* réseau

---

# 7.4 Organisation

## Types

* entreprise
* administration
* paroisse
* association

---

# 7.5 Lieu

## Attributs

* type_lieu
* période
* géométrie

---

## Types

* pays
* région
* commune
* quartier
* habitation
* parcelle
* bâtiment

---

# 7.6 Bien

## Types

### Foncier

* propriété
* parcelle

### Immobilier

* maison
* bâtiment

### Mobilier

* objet
* véhicule

### Immatériel

* dette
* créance
* droit

---

# 7.7 Contrat

## Types

* bail
* vente
* dette
* servitude
* contrat de mariage

---

# 8. Couche GRAPHE HISTORIQUE

---

# 8.1 Relation

## Définition

Lien entre entités.

---

## Attributs

* id
* type_relation
* confiance
* date_début
* date_fin

---

## Exemples

ParentDe

ConjointDe

Possède

RésideDans

VoisinDe

TravaillePour

ParticipeÀ

---

# 8.2 Événement

## Définition

Transformation.

---

## Attributs

* id
* type
* date
* lieu
* confiance

---

## Types

* naissance
* mariage
* décès
* vente
* succession
* déménagement

---

# 8.3 État

## Définition

Photographie temporelle.

---

## Attributs

* id
* entité_id
* date_début
* date_fin
* propriétés

---

# 9. Modèle temporel

---

## Date exacte

1848-12-20

---

## Intervalle

1848-01-01
→ 1848-12-31

---

## Estimation

vers 1848

---

## Inconnue

date absente

---

# 10. Modèle de confiance

Chaque objet métier peut porter :

* confiance
* justification
* contradictions
* score

---

# 11. Modèle d'historisation

Toutes les modifications produisent :

* nouvelle version
* auteur
* date
* justification

---

# 12. Modèle documentaire

Chaque connaissance doit pouvoir remonter :

```text
Entité
↓
Assertion
↓
Mention
↓
Transcription
↓
Document
↓
Source
```

---

# 13. Modèle de réconciliation

---

## Réconciliation

Objet autonome.

---

### Attributs

* id
* type
* score
* décision
* justification
* statut

---

### Entité liée : Critère

Détail de l'évaluation par critère.

#### Attributs

* id
* réconciliation_id
* nom
* poids
* valeur_candidate_1
* valeur_candidate_2
* score_partiel
* compatible (booléen)

---

### Relations

Réconciliation
→ compare → Entité

Réconciliation
→ évalue → N Critère

Réconciliation
→ produit → Fusion

---

# 14. Modèle d'inférence

---

## Inférence

Objet autonome.

---

### Attributs

* id
* règle
* résultat
* confiance

---

### Relations

Inférence
→ utilise → Assertion

Inférence
→ produit → Hypothèse

---

# 14b. Modèle de suggestion et d'extraction assistée

---

## SuggestionMention

Proposition automatique produite par le moteur IA.

### Attributs

* id
* transcription_id
* type_suggéré
* valeur_suggérée
* position_début
* position_fin
* confiance
* statut (EnAttente / Validée / Rejetée)
* moteur_version

### Invariant

Une SuggestionMention ne devient jamais une Mention sans validation humaine.

---

## ExtractionAutomatique

Session d'extraction automatique sur un document.

### Attributs

* id
* document_id
* date_extraction
* moteur_version
* nombre_suggestions
* statut

### Relations

ExtractionAutomatique
→ produit → N SuggestionMention

---

# 15. Répartition des stockages

## Stockage documentaire

Contient :

* images
* PDF
* médias

---

## Base relationnelle (System of Record)

Rôle : source de vérité unique.

Toute écriture passe par PostgreSQL.

Contient :

* sources
* documents
* transcriptions
* mentions
* assertions
* entités
* validations
* réconciliations
* référentiels
* table outbox

---

## Base graphe (Projection)

Rôle : projection de lecture spécialisée.

Alimentée par les événements métier issus de PostgreSQL.

Peut être reconstruite intégralement depuis la base relationnelle.

Contient :

* entités projetées
* relations
* événements
* états
* hypothèses

---

## Index de recherche

Contient :

* texte
* facettes
* index

---

# 16. Volumétrie cible

Le modèle doit supporter :

* millions de documents ;
* dizaines de millions de mentions ;
* millions d'entités ;
* centaines de millions de relations ;
* historique complet.

---

# 17. Principe directeur

L'architecture de données de REBOND repose sur une idée simple :

Les documents ne sont que des traces.

Les mentions sont des observations.

Les assertions sont des interprétations.

Les entités sont des reconstructions.

Les relations structurent la connaissance.

Les événements expliquent les transformations.

L'ensemble forme un graphe historique permettant de reconstruire, comprendre et explorer le monde à partir des preuves disponibles.
