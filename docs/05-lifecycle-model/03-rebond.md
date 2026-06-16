# REBOND

# Lifecycle Model

Version 1.0

---

# 1. Objet du document

Ce document décrit le cycle de vie des principaux objets métier de REBOND.

Son objectif est de formaliser :

* comment les objets apparaissent ;
* comment ils évoluent ;
* comment ils se consolident ;
* comment ils sont validés ;
* comment ils deviennent des connaissances exploitables.

---

# 2. Principe général

Dans REBOND, la connaissance n'apparaît pas instantanément.

Elle se construit progressivement.

Le système distingue :

* l'observation ;
* l'interprétation ;
* la reconstruction ;
* la validation ;
* l'exploitation.

La plupart des objets suivent une logique similaire :

```text
Observé
↓
Interprété
↓
Reconstruit
↓
Validé
↓
Exploité
↓
Enrichi
```

---

# 3. Cycle de vie documentaire

## Source

### États

Identifiée
→ Qualifiée
→ Exploitée
→ Historisée

### Description

La source devient progressivement connue, évaluée puis utilisée.

---

## Document

### États

Importé
→ Décrit
→ Transcrit
→ Structuré
→ Exploité
→ Archivé

### Description

Le document évolue d'un support brut vers une source de connaissances.

---

## Mention

### États

Détectée
→ Annotée
→ Interprétée
→ Reliée
→ Validée

### Description

La mention constitue la première unité de connaissance extraite du document.

---

## Assertion

### États

Produite
→ Justifiée
→ Vérifiée
→ Validée
→ Contestée

### Description

L'assertion transforme une observation en fait interprété.

---

# 4. Cycle de vie des personnes

## Objectif

Reconstruire un individu à partir de plusieurs traces documentaires.

---

### État 1 : Mention de personne

Une personne est observée dans un document.

Exemple :

Jean Dupont

---

### État 2 : Personne candidate

Une identité potentielle est créée.

Le système ne sait pas encore si cette personne existe déjà.

---

### État 3 : Personne réconciliée

La personne est rapprochée d'autres mentions.

Le système estime qu'elles concernent le même individu.

---

### État 4 : Personne validée

Les rapprochements ont été validés.

L'identité devient stable.

---

### État 5 : Personne enrichie

Le parcours de vie est progressivement complété.

---

### État 6 : Personne historisée

L'ensemble des états connus de la personne est reconstitué.

---

### Cycle résumé

Mention
→ Candidate
→ Réconciliée
→ Validée
→ Enrichie
→ Historisée

---

# 5. Cycle de vie des groupes

## Familles

Personnes reliées
→ Famille candidate
→ Famille reconstituée
→ Famille validée
→ Famille enrichie

---

## Ménages

Co-résidence observée
→ Ménage candidat
→ Ménage validé
→ Historique du ménage

---

## Communautés

Relations observées
→ Groupe candidat
→ Communauté identifiée
→ Communauté documentée

---

# 6. Cycle de vie des lieux

## Objectif

Reconstruire un espace géographique malgré les variations documentaires.

---

### État 1 : Toponyme observé

Habitation Bellevue

---

### État 2 : Lieu candidat

Le système crée une entité lieu.

---

### État 3 : Lieu réconcilié

Les variantes sont regroupées.

Bellevue

Belle Vue

Habitation Bellevue

---

### État 4 : Lieu localisé

Le territoire est positionné.

---

### État 5 : Lieu historisé

Les évolutions sont connues.

---

### Cycle résumé

Mention
→ Lieu candidat
→ Lieu réconcilié
→ Lieu localisé
→ Lieu historisé

---

# 7. Cycle de vie des biens

## Objectif

Suivre un bien dans le temps.

---

### État 1 : Bien observé

Le bien apparaît dans un document.

---

### État 2 : Bien candidat

Une entité est créée.

---

### État 3 : Bien identifié

Le système reconnaît le même bien dans plusieurs documents.

---

### État 4 : Bien historisé

Les propriétaires successifs sont connus.

---

### État 5 : Bien consolidé

L'historique devient stable.

---

### Cycle résumé

Observé
→ Candidat
→ Identifié
→ Historisé
→ Consolidé

---

# 8. Cycle de vie des organisations

Mention
→ Organisation candidate
→ Organisation identifiée
→ Organisation validée
→ Organisation historisée

---

# 9. Cycle de vie des événements

## Objectif

Reconstruire les transformations du monde.

---

### État 1 : Événement observé

Présent dans un document.

---

### État 2 : Événement candidat

Créé à partir d'une assertion.

---

### État 3 : Événement consolidé

Plusieurs documents parlent du même événement.

---

### État 4 : Événement validé

Le contexte est stabilisé.

---

### État 5 : Événement historisé

Toutes les conséquences sont connues.

---

### Cycle résumé

Observé
→ Candidat
→ Consolidé
→ Validé
→ Historisé

---

# 10. Cycle de vie des relations

## Objectif

Reconstituer les liens entre entités.

---

### État 1 : Relation observée

Mention explicite ou implicite.

---

### État 2 : Relation candidate

Création du lien.

---

### État 3 : Relation consolidée

Confirmation par plusieurs sources.

---

### État 4 : Relation validée

Relation reconnue.

---

### État 5 : Relation historisée

Période de validité connue.

---

### Cycle résumé

Observée
→ Candidate
→ Consolidée
→ Validée
→ Historisée

---

# 11. Cycle de vie des hypothèses

## Objectif

Gérer les connaissances incomplètes.

---

### États

Proposée
→ Argumentée
→ Renforcée
→ Confirmée

ou

Proposée
→ Argumentée
→ Réfutée

---

### Exemples

* filiation probable
* acte disparu
* identité probable
* localisation probable

---

# 12. Cycle de vie de la connaissance

La connaissance globale suit une progression continue.

```text
Document
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
Validation
↓
Connaissance
```

Chaque nouveau document peut :

* confirmer ;
* compléter ;
* corriger ;
* contredire ;
* enrichir ;

une connaissance existante.

---

# 13. Principe directeur

Dans REBOND, rien n'est figé.

Une personne peut être enrichie.

Un lieu peut être précisé.

Une propriété peut être retrouvée dans une nouvelle source.

Une hypothèse peut devenir une certitude.

Le système ne stocke pas des vérités définitives.

Il gère l'évolution progressive de la connaissance au fur et à mesure de l'apparition de nouvelles preuves.
