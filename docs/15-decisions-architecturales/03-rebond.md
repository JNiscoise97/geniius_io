# REBOND

# Décisions d'architecture structurantes

Version 1.0

---

# DA-001 — Stratégie de persistance

## Décision

REBOND adopte une architecture :

**PostgreSQL comme source de vérité unique (System of Record)**

et

**Graphe comme projection de lecture spécialisée.**

---

## Motivation

Le cœur de REBOND repose sur :

* la traçabilité ;
* l'historisation ;
* la validation ;
* la réversibilité ;
* la gestion des hypothèses ;
* la gestion des contradictions.

Ces besoins sont mieux satisfaits par un modèle transactionnel relationnel que par une base graphe utilisée comme référentiel principal.

Le graphe est particulièrement adapté :

* à l'exploration ;
* aux réseaux ;
* aux voisinages ;
* aux trajectoires ;
* aux analyses relationnelles ;
* aux inférences.

Il ne constitue donc pas la source de vérité.

---

## Architecture retenue

```text
PostgreSQL
(Source de vérité)

        ↓

Événements métier

        ↓

Projection

        ↓

Base Graphe

        ↓

Exploration
Visualisation
Inférence
```

---

## Synchronisation

La synchronisation repose sur un mécanisme événementiel.

Exemples :

* DocumentImporté
* MentionCréée
* AssertionValidée
* PersonneCréée
* RéconciliationAcceptée
* RelationCréée
* HypothèseConfirmée

Chaque événement déclenche la mise à jour des projections.

---

## Conséquences

Avantages :

* cohérence forte ;
* audit complet ;
* historisation native ;
* reconstruction possible des projections.

Contraintes :

* légère latence entre SQL et graphe ;
* gestion des projections à maintenir.

---

# DA-002 — Stratégie de réconciliation

## Décision

REBOND adopte un moteur de réconciliation hybride fondé sur :

* des règles bloquantes ;
* un système de scoring pondéré ;
* une validation humaine.

---

## Motivation

Les données historiques sont :

* incomplètes ;
* contradictoires ;
* évolutives ;
* incertaines.

Aucun algorithme unique ne peut garantir une décision correcte.

Le système doit produire des propositions explicables plutôt que des décisions automatiques opaques.

---

## Architecture retenue

### Étape 1 — Règles bloquantes

Certaines incohérences rendent une fusion impossible.

Exemples :

* décès antérieur à la naissance ;
* filiation biologiquement impossible ;
* chronologie incompatible ;
* contradiction majeure.

Si une règle bloquante est déclenchée :

→ rapprochement refusé.

---

### Étape 2 — Scoring pondéré

Les candidats sont évalués à partir de critères métier.

Exemple pour une personne :

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

Les pondérations peuvent varier selon le type d'entité.

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

La décision est historisée.

---

## Principe d'explicabilité

Toute proposition doit être accompagnée :

* des critères utilisés ;
* des poids ;
* du score ;
* des éléments favorables ;
* des contradictions observées.

---

# DA-003 — Stratégie d'extraction des mentions

## Décision

REBOND adopte un modèle :

**semi-automatique assisté par IA**

avec

**validation humaine systématique.**

---

## Motivation

Les corpus ciblés sont :

* hétérogènes ;
* historiques ;
* parfois manuscrits ;
* riches en variantes linguistiques ;
* riches en ambiguïtés.

Une extraction totalement manuelle serait trop coûteuse.

Une extraction totalement automatique produirait trop d'erreurs.

---

## Architecture retenue

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

---

## Capacités du moteur d'assistance

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

---

## Principe directeur

Les propositions automatiques ne deviennent jamais des connaissances sans validation.

Le moteur assiste.

L'humain arbitre.

---

# Conclusion

REBOND repose sur trois principes structurants :

1. PostgreSQL est la source de vérité ; le graphe est une projection spécialisée.
2. La réconciliation repose sur des règles explicables, un scoring pondéré et une validation humaine.
3. L'extraction des connaissances est semi-automatique : l'IA propose, l'humain valide.

Ces trois décisions fondent l'ensemble de l'architecture technique et métier du système.
