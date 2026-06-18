# REBOND

# Modèle logique détaillé

Version 1.0

---

# 1. Objet du document

Ce document définit le modèle logique de REBOND.

Il décrit :

* les bounded contexts ;
* les agrégats métier ;
* les objets logiques ;
* les relations ;
* les responsabilités ;
* les frontières de cohérence.

Ce modèle est indépendant de la technologie de persistance.

Il servira ensuite de base :

* au schéma PostgreSQL ;
* au schéma Graphe ;
* aux API ;
* aux événements de domaine.

---

# 2. Bounded Contexts

Le système est organisé autour de 12 contextes métier.

```text
Documentation
Transcription
Extraction
Extraction Assistée
Connaissance
Entités
Réconciliation
Événements
Relations
Temporalité
Inférence
Confiance
Validation
Graphe
Recherche
Administration
```

---

# 3. Context : Documentation

## Finalité

Gérer les preuves documentaires et leur localisation physique.

---

## Agrégat UnitéDocumentaire

### Racine

UnitéDocumentaire (UD)

### Entités

UnitéDocumentaire
Exemplaire
Citation

---

### Deux types de UD

**UD parente** — représente un fonds ou une collection documentaire
(registre d'état civil, minutier notarial, collection privée).
N'a pas de `parent_ud_id`. Créée et qualifiée par l'utilisateur.

**UD d'acte** — représente un document individuel identifiable
(acte de naissance, contrat notarial…).
A un `parent_ud_id` pointant vers la UD parente si celle-ci est connue.
Créée automatiquement lors du référencement d'un acte.

---

### Relations

UnitéDocumentaire (parente)
1 → N UnitéDocumentaire (enfant, via parent_ud_id)

UnitéDocumentaire
1 → N Exemplaire

Exemplaire
← N Citation

Citation
→ 1 Acte (cible polymorphique via target_type + target_id)

---

### Invariants

Un Exemplaire appartient à une seule UnitéDocumentaire.

Une Citation cible un objet unique et le localise dans un Exemplaire unique.

La combinaison (target_type, target_id, exemplaire_id) est unique dans
la table Citations.

La création d'une Citation implique l'existence préalable ou simultanée
d'une UD d'acte et d'un Exemplaire.

---

# 4. Context : Transcription

## Finalité

Transformer le document en texte exploitable.

---

## Agrégat Transcription

### Racine

Transcription

---

### Entités

Transcription
VersionTranscription

---

### Relations

Page
1 → N Transcription

Transcription
1 → N Version

---

### Invariants

Une transcription conserve toutes ses versions.

Aucune version n'est supprimée.

---

# 5. Context : Extraction

## Finalité

Produire des observations structurées.

---

## Agrégat Mention

### Racine

Mention

---

### Entités

Mention
Annotation
ValeurNormalisée

---

### Relations

Transcription
1 → N Mention

Mention
1 → N Annotation

---

### Invariants

Une mention possède toujours :

* un texte observé ;
* une localisation ;
* une transcription source.

---

# 5b. Context : Extraction Assistée

## Finalité

Gérer les propositions automatiques de mentions et d'assertions issues du moteur IA.

---

## Agrégat SuggestionMention

### Racine

SuggestionMention

---

### Entités

SuggestionMention

---

### Attributs clés

* transcription_id
* type_suggéré
* valeur_suggérée
* confiance
* statut

### Invariant

Une SuggestionMention ne devient jamais une Mention sans validation humaine explicite.

---

## Agrégat SuggestionAssertion

### Racine

SuggestionAssertion

---

### Entités

SuggestionAssertion

---

### Invariant

Une SuggestionAssertion ne devient jamais une Assertion sans validation humaine.

---

# 6. Context : Connaissance

## Finalité

Transformer les observations en faits.

---

## Agrégat Assertion

### Racine

Assertion

---

### Entités

Assertion

---

### Relations

Assertion
N → N Mention

---

### Types

Attribut

Relation

Événement

État

---

### Exemples

Profession

Résidence

Lien familial

Possession

---

# 7. Context : Entités

## Finalité

Représenter le monde reconstruit.

---

# Agrégat Personne

### Racine

Personne

---

### Entités internes

Nom

Prénom

Alias

Profession

Résidence

Signature

ÉtatPersonne

---

# Agrégat Groupe

### Racine

Groupe

---

### Types

Famille

Ménage

Communauté

Réseau

---

# Agrégat Organisation

### Racine

Organisation

---

# Agrégat Lieu

### Racine

Lieu

---

### Entités internes

Toponyme

Coordonnée

Périmètre

ÉtatLieu

---

# Agrégat Bien

### Racine

Bien

---

### Types

Parcelle

Propriété

Maison

Objet

Véhicule

Dette

Créance

Droit

---

# Agrégat Contrat

### Racine

Contrat

---

### Types

Bail

Vente

Servitude

Dette

ContratMariage

---

# 8. Context : Réconciliation

## Finalité

Gérer les rapprochements.

---

## Agrégat Réconciliation

### Racine

Réconciliation

---

### Entités

Candidat

Comparaison

Score

Critère

Justification

Décision

Fusion

Défusion

---

### Relations

Réconciliation
N → N Entité

Réconciliation
1 → N Critère

---

### États

Proposée

Acceptée

Refusée

Annulée

---

# 9. Context : Événements

## Finalité

Représenter les transformations.

---

## Agrégat Événement

### Racine

Événement

---

### Entités

Participant

Conséquence

---

### Relations

Événement
N → N Entité

---

### Types

Naissance

Mariage

Décès

Vente

Succession

Division

Fusion

Migration

---

# 10. Context : Relations

## Finalité

Représenter les liens.

---

## Agrégat Relation

### Racine

Relation

---

### Entités

PériodeValidité

Justification

---

### Types

ParentDe

ConjointDe

RésideDans

Possède

VoisinDe

TravaillePour

ParticipeÀ

---

# 11. Context : Temporalité

## Finalité

Historiser le monde.

---

## Agrégat État

### Racine

État

---

### Entités

Période

Version

---

### Relations

Entité
1 → N État

---

### Invariant

Une entité peut posséder plusieurs états.

---

# 12. Context : Inférence

## Finalité

Produire des connaissances dérivées.

---

## Agrégat Hypothèse

### Racine

Hypothèse

---

### Entités

Preuve

ContrePreuve

RègleAppliquée

---

### États

Proposée

Renforcée

Confirmée

Réfutée

---

# 13. Context : Confiance

## Finalité

Mesurer la solidité.

---

## Agrégat ScoreConfiance

### Racine

Score

---

### Composants

QualitéSource

Convergence

Contradiction

Validation

Temporalité

---

# 14. Context : Validation

## Finalité

Arbitrage humain.

---

## Agrégat Validation

### Racine

Validation

---

### Entités

Décision

Commentaire

Historique

---

### États

ÀValider

Validé

Refusé

Contesté

---

# 15. Context : Graphe

## Finalité

Représenter la connaissance consolidée.

---

## Nœuds

Personne

Groupe

Organisation

Lieu

Bien

Contrat

Événement

Document

Hypothèse

---

## Relations

Toutes les relations métier.

---

## Mécanisme

Le graphe est une ProjectionGraph alimentée par les événements métier (pattern Outbox).

Il peut être reconstruit intégralement depuis la base relationnelle.

## Particularité

Le graphe n'est pas le référentiel principal.

Le graphe est une projection consolidée.

---

# 16. Context : Recherche

## Finalité

Explorer rapidement les connaissances.

---

## Index principaux

Documents

Transcriptions

Mentions

Personnes

Lieux

Biens

Événements

Relations

---

# 17. Context : Administration

## Finalité

Maintenir le système.

---

## Agrégats

RéférentielTypeDocument

RéférentielRelation

RéférentielÉvénement

RéférentielProfession

RéférentielLieu

RéférentielRègle

---

# 18. Événements de domaine

Les événements de domaine constituent le mécanisme principal de synchronisation.

---

## Exemples

DocumentImporté

TranscriptionValidée

MentionCréée

SuggestionMentionValidée

SuggestionMentionRejetée

AssertionCréée

PersonneCréée

LieuCréé

BienCréé

RéconciliationAcceptée

HypothèseConfirmée

ValidationEffectuée

ProjectionMiseÀJour

---

# 19. Flux logique principal

```text
Source
↓
Document
↓
Page
↓
Transcription
↓
Mention
↓
Assertion
↓
Entité
↓
Relation
↓
Événement
↓
Réconciliation
↓
Validation
↓
Graphe
```

---

# 20. Principe directeur

Le modèle logique de REBOND est organisé autour d'une distinction fondamentale :

Les documents décrivent le monde.

Les mentions observent le monde.

Les assertions interprètent le monde.

Les entités reconstruisent le monde.

Les relations structurent le monde.

Les événements expliquent le monde.

Le graphe représente le monde.

Cette séparation permet :

* la traçabilité ;
* l'explicabilité ;
* la réversibilité ;
* l'historisation ;
* l'inférence.

Elle constitue le fondement de toute l'architecture de REBOND.
