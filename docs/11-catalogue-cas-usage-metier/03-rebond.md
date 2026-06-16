# REBOND

# Catalogue des cas d'usage métier

Version 1.0

---

# 1. Objet du document

Ce document décrit les principaux cas d'usage métier de REBOND.

Chaque cas d'usage formalise :

* les acteurs ;
* le déclencheur ;
* les préconditions ;
* le scénario nominal ;
* les règles métier ;
* les résultats attendus ;
* les erreurs et exceptions possibles.

L'objectif est de décrire comment les utilisateurs et les moteurs internes interagissent avec le système pour produire de la connaissance.

---

# 2. Acteurs du système

## Acteurs humains

### Transcripteur

Produit ou corrige les transcriptions.

### Annotateur

Identifie les mentions dans les documents.

### Chercheur

Exploite les connaissances produites.

### Validateur

Valide ou rejette les propositions.

### Administrateur de référentiels

Maintient les référentiels métier.

### Administrateur fonctionnel

Configure le système.

---

## Acteurs systèmes

### Moteur de réconciliation

Produit des rapprochements.

### Moteur d'inférence

Produit des hypothèses.

### Moteur qualité

Détecte les incohérences.

### Moteur de confiance

Calcule les niveaux de confiance.

---

# UC-001 — Ajouter une source documentaire

## Acteurs

Administrateur de référentiel

---

## Déclencheur

Une nouvelle source doit être intégrée.

---

## Préconditions

Aucune.

---

## Scénario nominal

1. Création de la source.
2. Description de la source.
3. Qualification de la source.
4. Validation.
5. Mise à disposition.

---

## Règles métier

RM-001
Toute source doit être identifiée.

RM-002
Toute source possède un producteur.

---

## Résultat attendu

Source exploitable.

---

## Erreurs possibles

* source déjà existante ;
* informations insuffisantes ;
* type de source inconnu.

---

# UC-002 — Importer un document

## Acteurs

Chercheur

Administrateur

---

## Déclencheur

Nouveau document disponible.

---

## Préconditions

Source existante.

---

## Scénario nominal

1. Sélection de la source.
2. Import du document.
3. Description.
4. Classement.
5. Validation.

---

## Résultat attendu

Document référencé.

---

## Erreurs possibles

* document illisible ;
* document déjà présent ;
* source absente.

---

# UC-003 — Produire une transcription

## Acteurs

Transcripteur

---

## Déclencheur

Document à exploiter.

---

## Préconditions

Document existant.

---

## Scénario nominal

1. Ouverture du document.
2. Saisie de la transcription.
3. Signalement des passages incertains.
4. Sauvegarde.
5. Soumission à validation.

---

## Règles métier

Le texte original doit être conservé.

Les incertitudes doivent être signalées.

---

## Résultat attendu

Transcription disponible.

---

## Erreurs possibles

* transcription incomplète ;
* conflit de version ;
* document non accessible.

---

# UC-004 — Valider une transcription

## Acteurs

Validateur

---

## Déclencheur

Nouvelle transcription proposée.

---

## Préconditions

Transcription existante.

---

## Scénario nominal

1. Lecture.
2. Comparaison avec le document.
3. Validation ou rejet.
4. Historisation.

---

## Résultat attendu

Transcription validée.

---

## Erreurs possibles

* qualité insuffisante ;
* document ambigu ;
* divergence majeure.

---

# UC-005 — Identifier les mentions

## Acteurs

Annotateur

---

## Déclencheur

Transcription validée.

---

## Préconditions

Document transcrit.

---

## Scénario nominal

1. Lecture de la transcription.
2. Sélection des passages.
3. Création des mentions.
4. Qualification.
5. Sauvegarde.

---

## Types de mentions

* personne ;
* lieu ;
* bien ;
* organisation ;
* événement ;
* date ;
* montant.

---

## Résultat attendu

Mentions exploitables.

---

## Erreurs possibles

* type incorrect ;
* doublon ;
* contexte insuffisant.

---

# UC-006 — Produire une assertion

## Acteurs

Annotateur

Chercheur

---

## Déclencheur

Mention identifiée.

---

## Préconditions

Mention existante.

---

## Scénario nominal

1. Analyse.
2. Interprétation.
3. Création d'une assertion.
4. Rattachement aux preuves.

---

## Exemple

Mention :

"Jean Dupont cultivateur"

Assertion :

Jean Dupont exerce la profession cultivateur.

---

## Résultat attendu

Assertion créée.

---

## Erreurs possibles

* interprétation incohérente ;
* preuve insuffisante.

---

# UC-007 — Créer une personne candidate

## Acteurs

Système

Chercheur

---

## Déclencheur

Nouvelle mention de personne.

---

## Préconditions

Mention qualifiée.

---

## Scénario nominal

1. Création de la personne candidate.
2. Association des mentions.
3. Calcul de confiance initial.

---

## Résultat attendu

Personne candidate créée.

---

## Erreurs possibles

* ambiguïté forte ;
* doublon probable.

---

# UC-008 — Réconcilier des personnes

## Acteurs

Moteur de réconciliation

Validateur

---

## Déclencheur

Détection d'une proximité.

---

## Préconditions

Deux personnes candidates.

---

## Scénario nominal

1. Comparaison.
2. Calcul des indices.
3. Évaluation de la confiance.
4. Proposition.
5. Validation.

---

## Critères

* nom ;
* prénom ;
* âge ;
* profession ;
* résidence ;
* famille ;
* signatures ;
* patrimoine.

---

## Résultat attendu

Fusion ou maintien séparé.

---

## Erreurs possibles

* homonymie ;
* données contradictoires ;
* fusion abusive.

---

# UC-009 — Réconcilier des lieux

## Acteurs

Moteur de réconciliation

Chercheur

---

## Déclencheur

Toponymes similaires.

---

## Préconditions

Lieux existants.

---

## Scénario nominal

1. Comparaison.
2. Analyse des variantes.
3. Analyse du voisinage.
4. Proposition.
5. Validation.

---

## Résultat attendu

Lieu consolidé.

---

## Erreurs possibles

* faux rapprochement ;
* homonymie territoriale.

---

# UC-010 — Réconcilier des biens

## Acteurs

Moteur de réconciliation

Chercheur

---

## Déclencheur

Bien potentiellement déjà connu.

---

## Préconditions

Bien existant.

---

## Scénario nominal

1. Analyse des propriétaires.
2. Analyse des voisins.
3. Analyse des descriptions.
4. Proposition.

---

## Résultat attendu

Bien consolidé.

---

## Erreurs possibles

* propriétés voisines confondues ;
* divisions non détectées.

---

# UC-011 — Construire une relation

## Acteurs

Chercheur

Système

---

## Déclencheur

Assertion relationnelle.

---

## Préconditions

Deux entités existantes.

---

## Scénario nominal

1. Création de la relation.
2. Définition du type.
3. Datation.
4. Qualification.

---

## Résultat attendu

Relation historisée.

---

## Erreurs possibles

* type incorrect ;
* relation contradictoire.

---

# UC-012 — Créer un événement

## Acteurs

Chercheur

---

## Déclencheur

Observation d'un changement.

---

## Préconditions

Informations suffisantes.

---

## Scénario nominal

1. Création.
2. Datation.
3. Identification des participants.
4. Qualification.

---

## Résultat attendu

Événement créé.

---

## Erreurs possibles

* date incohérente ;
* participants absents.

---

# UC-013 — Produire une hypothèse

## Acteurs

Moteur d'inférence

Chercheur

---

## Déclencheur

Convergence d'indices.

---

## Préconditions

Informations partielles.

---

## Scénario nominal

1. Analyse.
2. Application des règles.
3. Calcul de confiance.
4. Création de l'hypothèse.

---

## Exemples

* filiation probable ;
* propriété probable ;
* document disparu probable.

---

## Résultat attendu

Hypothèse documentée.

---

## Erreurs possibles

* preuve insuffisante ;
* contradiction forte.

---

# UC-014 — Valider une connaissance

## Acteurs

Validateur

---

## Déclencheur

Connaissance proposée.

---

## Préconditions

Objet existant.

---

## Scénario nominal

1. Analyse.
2. Consultation des preuves.
3. Décision.
4. Historisation.

---

## Résultat attendu

Connaissance validée ou rejetée.

---

## Erreurs possibles

* éléments insuffisants ;
* conflit non résolu.

---

# UC-015 — Détecter une incohérence

## Acteurs

Moteur qualité

---

## Déclencheur

Contrôle automatique.

---

## Préconditions

Connaissance existante.

---

## Scénario nominal

1. Analyse.
2. Détection.
3. Qualification.
4. Notification.

---

## Exemples

* parent trop jeune ;
* décès avant naissance ;
* propriétaire simultané incompatible.

---

## Résultat attendu

Anomalie créée.

---

## Erreurs possibles

* faux positif ;
* contexte incomplet.

---

# UC-016 — Explorer une entité

## Acteurs

Chercheur

---

## Déclencheur

Recherche utilisateur.

---

## Préconditions

Entité existante.

---

## Scénario nominal

1. Recherche.
2. Consultation de la fiche.
3. Navigation.
4. Exploration des preuves.

---

## Résultat attendu

Compréhension de l'entité.

---

## Erreurs possibles

* entité incomplète ;
* données contradictoires.

---

# UC-017 — Explorer une trajectoire

## Acteurs

Chercheur

---

## Déclencheur

Analyse historique.

---

## Préconditions

Historique existant.

---

## Scénario nominal

1. Sélection.
2. Construction de la chronologie.
3. Analyse des états.
4. Visualisation.

---

## Résultat attendu

Trajectoire reconstruite.

---

# UC-018 — Produire un rapport de recherche

## Acteurs

Chercheur

---

## Déclencheur

Besoin de restitution.

---

## Préconditions

Connaissances disponibles.

---

## Scénario nominal

1. Sélection des éléments.
2. Compilation.
3. Génération.
4. Export.

---

## Résultat attendu

Rapport documenté.

---

## Erreurs possibles

* données insuffisantes ;
* références manquantes.

---

# UC-019 — Exporter la connaissance

## Acteurs

Chercheur

Système externe

---

## Déclencheur

Besoin de réutilisation.

---

## Préconditions

Connaissance consolidée.

---

## Scénario nominal

1. Choix du format.
2. Préparation.
3. Contrôle.
4. Export.

---

## Résultat attendu

Connaissance transférable.

---

## Formats possibles

* arbre ;
* graphe ;
* chronologie ;
* rapport ;
* API.

---

# Principe directeur

Chaque cas d'usage de REBOND poursuit le même objectif :

Transformer une trace documentaire en connaissance reconstruite, explicable, sourcée et évolutive.

Le système doit toujours permettre de comprendre :

* ce qui est observé ;
* ce qui est interprété ;
* ce qui est déduit ;
* pourquoi une conclusion a été produite ;
* à quel niveau de confiance cette conclusion peut être retenue.
