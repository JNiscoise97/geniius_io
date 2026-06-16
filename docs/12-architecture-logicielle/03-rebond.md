# REBOND

# Architecture logicielle cible

Version 1.0

---

# 1. Objet du document

Ce document décrit l'architecture logicielle cible de REBOND.

Il traduit les concepts métier, les capacités, les processus et les règles de raisonnement en composants logiciels cohérents.

Son objectif est de définir :

* les responsabilités logicielles ;
* les frontières des composants ;
* les flux de données ;
* les mécanismes de persistance ;
* les moteurs spécialisés ;
* les points d'intégration.

---

# 2. Vision architecturale

REBOND est un système de reconstruction de connaissances à partir de traces documentaires.

L'architecture doit permettre :

* l'acquisition documentaire ;
* la production de connaissances ;
* la réconciliation ;
* l'inférence ;
* la validation ;
* l'exploration ;
* l'export.

Le système doit rester :

* explicable ;
* traçable ;
* historisé ;
* réversible ;
* extensible.

---

# 3. Principes d'architecture

## PA-001 — Séparation du document et de la connaissance

Le document n'est pas la connaissance.

Les documents alimentent les connaissances.

---

## PA-002 — Historisation native

Aucune donnée métier ne doit être écrasée.

---

## PA-003 — Réversibilité

Toute fusion doit pouvoir être annulée.

---

## PA-004 — Traçabilité

Toute connaissance doit être reliée à ses preuves.

---

## PA-005 — Explicabilité

Toute décision automatique doit être justifiable.

---

## PA-006 — Modularité

Chaque domaine métier doit être isolé dans son propre module.

---

# 4. Style architectural

Architecture modulaire orientée domaine.

```text
UI
↓
API
↓
Services Applicatifs
↓
Domaine Métier
↓
Moteurs
↓
Persistance
```

---

# 5. Vue globale

```text
┌──────────────────────┐
│ Interface Utilisateur │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ API Applicative      │
└──────────┬───────────┘
           │
┌──────────▼──────────────────────────┐
│ Services Métier                     │
├─────────────────────────────────────┤
│ Documents                           │
│ Transcription                       │
│ Mentions                            │
│ Assertions                          │
│ Entités                             │
│ Relations                           │
│ Evénements                          │
│ Validation                          │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│ Moteurs                             │
├─────────────────────────────────────┤
│ Réconciliation                      │
│ Inférence                           │
│ Confiance                           │
│ Qualité                             │
│ Recherche                           │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│ Persistance                         │
├─────────────────────────────────────┤
│ Base relationnelle                  │
│ Graphe                              │
│ Documents                           │
│ Index de recherche                  │
└─────────────────────────────────────┘
```

---

# 6. Couche Présentation

## Finalité

Permettre l'interaction avec le système.

---

## Composants

### Portail documentaire

Gestion des sources et documents.

---

### Atelier de transcription

Production et validation des transcriptions.

---

### Atelier de structuration

Mentions et assertions.

---

### Atelier de réconciliation

Fusion et rapprochement.

---

### Explorateur de connaissances

Navigation dans le graphe.

---

### Outils de visualisation

Cartes, graphes, chronologies.

---

### Administration

Paramétrage et référentiels.

---

# 7. Couche API

## Finalité

Exposer les fonctionnalités métier.

---

## Domaines API

### Documents API

### Sources API

### Mentions API

### Assertions API

### Entités API

### Relations API

### Événements API

### Validation API

### Recherche API

### Export API

### Administration API

---

# 8. Couche Services Métier

## Finalité

Orchestrer les cas d'usage.

---

# 8.1 Document Service

Responsabilités :

* gestion documentaire ;
* métadonnées ;
* corpus.

---

# 8.2 Transcription Service

Responsabilités :

* transcription ;
* validation ;
* versionnement.

---

# 8.3 Mention Service

Responsabilités :

* extraction ;
* annotation ;
* qualification.

---

# 8.4 Assertion Service

Responsabilités :

* interprétation ;
* formalisation.

---

# 8.5 Entity Service

Responsabilités :

* gestion des personnes ;
* lieux ;
* biens ;
* organisations ;
* groupes.

---

# 8.6 Relation Service

Responsabilités :

* création ;
* qualification ;
* historisation.

---

# 8.7 Event Service

Responsabilités :

* gestion des événements ;
* conséquences.

---

# 8.8 Validation Service

Responsabilités :

* décisions humaines ;
* workflows.

---

# 9. Couche Domaine

## Finalité

Porter les règles métier.

---

## Agrégats principaux

### Source

### Document

### Mention

### Assertion

### Personne

### Groupe

### Organisation

### Lieu

### Bien

### Contrat

### Relation

### Événement

### Hypothèse

### Validation

---

## Règle

Les règles métier doivent être indépendantes :

* des interfaces ;
* de la base ;
* des moteurs.

---

# 10. Architecture des moteurs

---

# 10.1 Moteur de réconciliation

## Finalité

Identifier les entités identiques et produire des propositions de rapprochement expliquées.

---

## Architecture hybride

Le moteur adopte une approche en quatre étapes.

---

### Étape 1 — Règles bloquantes

Certaines incohérences rendent un rapprochement impossible.

Si une règle bloquante est déclenchée, le rapprochement est refusé sans scoring.

Exemples :

* décès antérieur à la naissance ;
* filiation biologiquement impossible ;
* chronologie incompatible ;
* contradiction majeure sur des attributs non orthographiques.

---

### Étape 2 — Scoring pondéré

Les candidats non bloqués sont évalués à partir de critères métier pondérés.

#### Exemple : Personnes

| Critère            | Poids |
| ------------------ | ----: |
| Nom                |    20 |
| Prénom             |    15 |
| Âge / dates        |    15 |
| Conjoint           |    20 |
| Parents            |    20 |
| Lieu               |    10 |
| Profession         |     5 |
| Réseau relationnel |    10 |
| Signature          |    20 |

Les pondérations varient selon le type d'entité.

---

### Étape 3 — Classification

| Score | Résultat      |
| ----- | ------------- |
| 0–39  | Distinct      |
| 40–59 | Possible      |
| 60–74 | Probable      |
| 75–89 | Très probable |
| 90+   | Quasi certain |

---

### Étape 4 — Validation humaine

Le moteur propose.

L'humain décide.

La décision est historisée et réversible.

---

## Explicabilité

Toute proposition est accompagnée :

* des critères utilisés ;
* des poids appliqués ;
* du score calculé ;
* des éléments favorables ;
* des contradictions observées.

---

## Domaines

* personnes ;
* lieux ;
* biens ;
* événements ;
* organisations.

---

## Entrées

Assertions.

---

## Sorties

Propositions de rapprochement scorées et expliquées.

---

# 10.2 Moteur d'inférence

## Finalité

Produire des connaissances dérivées.

---

## Raisonnements

* convergence ;
* continuité ;
* voisinage ;
* succession ;
* réseau ;
* temporalité.

---

## Exemples

* filiation probable ;
* lieu probable ;
* document disparu probable.

---

# 10.3 Moteur de confiance

## Finalité

Mesurer la solidité d'une connaissance.

---

## Facteurs

* source ;
* cohérence ;
* validation ;
* convergence ;
* contradiction.

---

# 10.4 Moteur qualité

## Finalité

Détecter les anomalies.

---

## Contrôles

* chronologie ;
* géographie ;
* parenté ;
* patrimoine.

---

# 10.5 Moteur de recherche

## Finalité

Explorer rapidement les connaissances.

---

## Types

* plein texte ;
* entités ;
* graphes ;
* géographie ;
* chronologie.

---

# 11. Architecture du graphe

## Finalité

Représenter le monde reconstruit.

---

## Nœuds

* personne ;
* groupe ;
* organisation ;
* lieu ;
* bien ;
* événement ;
* document ;
* hypothèse.

---

## Relations

* parent de ;
* possède ;
* réside à ;
* voisin de ;
* participe à ;
* mentionné dans.

---

## Propriétés

* dates ;
* confiance ;
* sources ;
* statut.

---

# 12. Architecture de persistance

## 12.1 Stockage documentaire

Contient :

* images ;
* PDF ;
* médias.

---

## 12.2 Base relationnelle (System of Record)

Rôle : source de vérité unique.

Toute écriture passe par PostgreSQL.

Contient :

* objets métier (sources, documents, mentions, assertions, entités, relations, événements) ;
* validations et historique complet ;
* référentiels ;
* workflows ;
* table outbox des événements.

---

## 12.3 Base graphe (Projection)

Rôle : projection de lecture spécialisée.

Alimentée par les événements métier issus de PostgreSQL.

Peut être reconstruite intégralement à partir de la base relationnelle.

Contient :

* représentation navigable des entités et relations ;
* réseaux, voisinages, trajectoires ;
* projections consolidées des connaissances validées.

---

## 12.4 Pattern Outbox

La synchronisation entre PostgreSQL et la base graphe repose sur le pattern Outbox.

### Principe

Chaque opération d'écriture dans PostgreSQL produit un événement persisté dans une table `outbox`.

Un processus de projection consomme ces événements et met à jour la base graphe.

### Exemples d'événements

* DocumentImporté
* MentionCréée
* AssertionValidée
* PersonneCréée
* RéconciliationAcceptée
* RelationCréée
* HypothèseConfirmée

### Garanties

* cohérence finale entre SQL et graphe ;
* reconstruction possible des projections à tout moment ;
* audit complet des synchronisations.

---

## 12.5 Moteur de recherche

Contient :

* index ;
* texte ;
* facettes.

---

# 13. Architecture des workflows

## Workflow documentaire

Document
→ Transcription
→ Validation

---

## Workflow de structuration

Transcription
→ Mentions
→ Assertions

---

## Workflow de reconstruction

Assertions
→ Entités
→ Réconciliation

---

## Workflow qualité

Entité
→ Contrôles
→ Validation

---

## Workflow inférence

Connaissances
→ Raisonnement
→ Hypothèse

---

# 14. Architecture des permissions

## Lecteur

Consultation.

---

## Contributeur

Création.

---

## Transcripteur

Transcription.

---

## Annotateur

Mentions et assertions.

---

## Validateur

Validation.

---

## Administrateur métier

Référentiels.

---

## Administrateur système

Configuration.

---

# 15. Architecture d'intégration

## Imports

* GEDCOM ;
* CSV ;
* JSON ;
* XML.

---

## Exports

* GEDCOM ;
* CSV ;
* JSON ;
* GraphML ;
* rapports.

---

## API externes

* cartographie ;
* archives ;
* IA ;
* applications partenaires.

---

# 16. Architecture IA

## Pipeline d'extraction semi-automatique

### Architecture

```text
Document
↓
Transcription
↓
Détection automatique
↓
Suggestions
↓
Validation humaine
↓
Mention validée
```

### Capacités du moteur d'assistance

Le moteur peut suggérer :

* personnes ;
* lieux ;
* biens ;
* organisations ;
* événements ;
* professions ;
* montants ;
* dates ;
* rôles ;
* relations.

### Principe directeur

Les propositions automatiques ne deviennent jamais des connaissances sans validation humaine.

---

## Assistance à la transcription

---

## Assistance à l'annotation

---

## Suggestions de réconciliation

---

## Suggestions d'inférence

---

## Génération de synthèses

---

## Explication des décisions

---

# 17. Évolutivité

L'architecture doit permettre :

* plusieurs millions de documents ;
* plusieurs dizaines de millions de mentions ;
* plusieurs millions d'entités ;
* plusieurs centaines de millions de relations.

---

# 18. Principe directeur

L'architecture logicielle de REBOND n'est pas construite autour du document.

Elle est construite autour de la connaissance.

Les documents alimentent les connaissances.

Les connaissances alimentent le graphe.

Le graphe permet la reconstruction du monde.

L'ensemble du système est conçu pour répondre à quatre questions fondamentales :

* Que sait-on ?
* Pourquoi le sait-on ?
* À quel point en est-on certain ?
* Quelles conclusions peut-on en tirer ?
