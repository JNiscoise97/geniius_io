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

## AD-006 — Séparation entre producteur et institution de conservation

Le producteur d'un document est l'entité qui l'a créé.

L'institution de conservation est l'entité qui le détient aujourd'hui.

Ces deux entités sont distinctes et doivent être modélisées séparément.

Exemple : la commune de Deshaies est le producteur de l'état civil de 1889.
Les Archives départementales de Guadeloupe, l'ANOM et la Mairie de Deshaies
sont trois institutions de conservation distinctes pour le même fonds.

---

## AD-007 — Exemplaires multiples

Un même document peut exister en plusieurs exemplaires conservés dans des
institutions différentes.

Ces exemplaires sont distincts au sens archivistique : cotes différentes,
états de conservation différents, divergences de contenu possibles
(orthographe, signatures, annotations).

Le modèle doit permettre de les relier sans les fusionner.

---

## AD-008 — Instruments de recherche

Certains documents ne sont pas des preuves primaires.

Ce sont des instruments produits pour faciliter la recherche dans d'autres
documents : tables alphabétiques, répertoires de formalités, inventaires.

Le modèle doit distinguer ces instruments des documents primaires et
conserver la chaîne de découverte qu'ils ont permise.

---

## AD-010 — Relation structurelle vs relation de découverte

Un document peut être lié à un autre document par deux relations de nature différente.

**Relation structurelle** (`parent_document_id`) : l'acte est physiquement contenu
dans un registre compilé. C'est une relation de composition archivistique.
Un acte de décès appartient au registre des décès 1800.

**Relation de découverte** (`decouverte_via`) : le document a été localisé grâce
à un instrument de recherche. C'est une relation de chaîne de découverte.
Un acte de décès a été trouvé via la table annuelle 1800.

Ces deux relations sont indépendantes et peuvent coexister sur un même document.

Exemple :
Acte de décès n°12 (Dupont, 1800)
  → parent_document_id → Registre des décès 1800 (registre_compilé)
  → decouverte_via     → Table annuelle 1800 (instrument_de_recherche)

Conséquences sur le modèle :
- `parent_document_id` relie un acte_primaire à son registre_compilé.
- Un registre_compilé n'a pas de parent_document_id.
- Un instrument_de_recherche n'a pas de parent_document_id.
- `decouverte_via` relie tout type de document à l'instrument qui a permis de le trouver.

---

## AD-009 — Ajouts postérieurs à la rédaction

Certains documents reçoivent, après leur rédaction originale, des ajouts
datés qui modifient leur contenu sans effacer l'acte initial.

Exemples :

* mention marginale d'état civil — décès, mariage, légitimation, rectification ;
* apostille notariale ;
* tampon ou référence de répertoire ajouté après enregistrement ;
* rectification administrative ultérieure.

Ces ajouts présentent trois caractéristiques qui les distinguent des
divergences de transcription :

1. Ils sont datés postérieurement à la rédaction originale.
2. Ils ne sont pas nécessairement présents dans tous les exemplaires
   — selon la date à laquelle chaque copie a été établie.
3. Ils constituent des faits autonomes, porteurs d'informations nouvelles
   sur des entités ou des événements distincts de l'acte original.

Le modèle doit :

* conserver la date de l'ajout séparément de la date de l'acte ;
* distinguer quels exemplaires portent l'ajout et lesquels ne le portent pas ;
* permettre d'extraire les mentions contenues dans ces ajouts indépendamment
  de celles contenues dans l'acte original.

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

Fonds ou collection documentaire tel qu'il est conservé dans une institution
précise.

Une même série documentaire détenue par deux institutions différentes constitue
deux Sources distinctes.

---

## Attributs principaux

* id
* type
* nom
* producteur — entité qui a créé le document (commune, notaire, administration)
* institution_conservation — entité qui le détient aujourd'hui (ADG, ANOM, mairie, BNF…)
* localisation — ville et pays de l'institution de conservation
* description
* territoire — territoire couvert par les documents (pas la localisation de conservation)
* période_couverte
* niveau_fiabilité
* acces — physique | numérique | en_ligne
* url — pour les sources accessibles en ligne (nullable)

---

## Relations

Source
→ contient → Document

Source
→ est_copie_de → Source (nullable — quand deux Sources conservent le même fonds)

---

# 4.2 Document

## Définition

Unité documentaire identifiable au sein d'une Source.

Peut être un acte isolé, un registre contenant plusieurs actes, ou un
instrument de recherche permettant de naviguer vers d'autres documents.

---

## Attributs

* id
* source_id
* type_document
* role — acte_primaire | instrument_de_recherche | registre_compilé
* cote
* titre
* date_document
* description
* statut_exploitation
* niveau_conservation — bon | moyen | dégradé | fragmentaire
* url — pour les documents numérisés accessibles en ligne (nullable)
* exemplaire_groupe_id — identifiant partagé entre tous les exemplaires
  du même acte sous-jacent (nullable)
* parent_document_id — identifiant du registre compilé contenant cet acte
  (nullable — uniquement pour les actes_primaires ; nul pour les registres
  et les instruments de recherche)

---

## Contrainte sur le rôle

### acte_primaire

Document porteur d'un fait unique : acte de naissance, contrat de vente,
acte de décès.

### instrument_de_recherche

Table alphabétique, répertoire, index, inventaire.

Ne constitue pas une preuve en lui-même.

Permet de localiser des documents primaires.

### registre_compilé

Ensemble d'actes reliés en un volume : registre d'état civil, registre de
transcriptions hypothécaires, registre paroissial.

Contient plusieurs actes primaires.

---

## Relations

Document
→ contient → Page

Document
→ appartient à → Corpus

Document (acte_primaire)
→ parent_document_id → Document (registre_compilé, nullable)
  — relation structurelle : l'acte est physiquement contenu dans ce registre

Document
→ découvert_via → Document (instrument_de_recherche, nullable)
  — relation de découverte : l'acte a été localisé grâce à cet instrument

---

## Contraintes sur les relations documentaires

`parent_document_id` ne peut pointer que vers un Document de rôle
`registre_compilé`.

Un Document de rôle `registre_compilé` ou `instrument_de_recherche`
ne peut pas avoir de `parent_document_id`.

`decouverte_via` ne peut pointer que vers un Document de rôle
`instrument_de_recherche`.

Un Document peut avoir un `parent_document_id` et un `decouverte_via`
simultanément : l'acte appartient à un registre ET a été trouvé via
une table annuelle.

---

## Note sur les exemplaires

Plusieurs Documents peuvent partager le même `exemplaire_groupe_id`.

Ils représentent des copies du même acte sous-jacent, conservées dans des
Sources différentes.

Les divergences entre exemplaires (orthographe, signatures, état de
conservation) sont capturées lors de la transcription, au niveau des Mentions.

La réconciliation entre ces Mentions produit une Assertion unique sur le fait
réel.

---

# 4.3 AjoutDocumentaire

## Définition

Modification datée apportée à un Document après sa rédaction originale.

Constitue un fait documentaire autonome, distinct de l'acte d'origine,
porteur de ses propres informations.

---

## Types

* mention_marginale — annotation portée en marge d'un acte d'état civil
  ou notarial, enregistrant un événement postérieur (décès, mariage,
  légitimation, rectification)
* apostille — ajout notarial postérieur à l'acte
* rectification — correction administrative formelle
* tampon_repertoire — référence de répertoire ou d'enregistrement apposée
  après coup
* autre

---

## Attributs

* id
* document_id — exemplaire sur lequel l'ajout est physiquement présent
* type
* date_ajout — date de l'ajout (peut être approximative)
* contenu — texte de l'ajout
* ajout_groupe_id — identifiant partagé entre tous les exemplaires qui
  portent le même ajout logique (nullable — si l'ajout n'existe que sur
  un seul exemplaire, ce champ reste vide)

---

## Relations

AjoutDocumentaire
→ appartient à → Document

AjoutDocumentaire
→ contient → Mention (ses propres mentions, extraites indépendamment
  de celles de l'acte original)

---

## Contraintes

Un AjoutDocumentaire ne peut pas précéder la date du Document auquel
il est rattaché.

Sa présence ou son absence sur un exemplaire est une information
archivistique significative : elle permet de dater approximativement
la réalisation de cet exemplaire.

---

## Exemple

Acte de naissance de Henri NISCOISE, Deshaies, 1889.

Mention marginale présente sur l'exemplaire ADG :
"Décédé à Basse-Terre le 14 mars 1921 — vu acte n°23"
Date d'ajout : 1921.

Cette mention est absente de l'exemplaire ANOM (microfilm établi
avant 1921) et de l'exemplaire Mairie (état inconnu).

Le même fait de décès (entité Événement) sera produit par extraction
de cette mention marginale, indépendamment des mentions de l'acte de
naissance original.

---

# 4.4 Page

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
