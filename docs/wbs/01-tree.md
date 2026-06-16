[← Sommaire](README.md) · [← Précédent : Geniius.io transverse](00-geniius-io-transverse.md)

# 1. TREE — L'arbre généalogique unifié

**Description** : Application de consultation et de construction de l'arbre généalogique d'une famille, point de convergence des données issues de Rebond, Journal et Connect.

**Définition** : Un graphe de personnes, relations, faits, lieux et sources, navigable et consultable, représentant l'état de connaissance courant d'une famille — avec historique et provenance de chaque information.

**À quoi ça sert** : Donner à une famille une vue unifiée, fiable et évolutive de son histoire, et servir de référentiel central que les autres apps lisent et alimentent.

**Pour qui** : Membres de familles (consultation, recherche d'ancêtres/parents), contributeurs familiaux (édition), généalogistes (vérification croisée avec Rebond).

**Pourquoi c'est innovant** : Contrairement aux arbres collaboratifs classiques (un fait = une valeur, modifiable par n'importe qui), Tree conserve **toutes les versions concurrentes d'un fait avec leur source** et ne les résout que par validation explicite — l'arbre devient un objet de preuve autant qu'un objet de présentation.

**Definition of Done du projet Tree** : Un utilisateur peut créer ou importer un arbre, naviguer dans toutes les générations, consulter pour chaque personne ses faits avec leurs sources et niveaux de confiance, voir où elle a vécu sur une carte/chronologie, recevoir et arbitrer les propositions issues de Rebond/Journal/Connect, exporter son arbre en GEDCOM, et tout cela reste cohérent même quand 3 sources se contredisent.

---

## 1.1 Modèle de données de l'arbre (instanciation locale du pivot 0.1)

**DoD** : Le modèle pivot (cf. [0.1](00-geniius-io-transverse.md#01-modèle-de-données-pivot--identité-généalogique)) est implémenté et testé dans Tree avec tous ses cas limites (personne sans date, relation contestée, lieu inconnu).

### 1.1.1 Stockage du graphe personnes/relations
- 1.1.1.1 Schéma base de données Tree (tables personnes, relations, faits) — **DoD** : conforme au schéma pivot, migrations appliquées
- 1.1.1.2 Index et performance sur grands arbres (10 000+ individus) — **DoD** : navigation fluide mesurée sur un arbre de cette taille

### 1.1.2 Gestion des identités multiples
- 1.1.2.1 Affichage des versions concurrentes d'un fait (ex : 2 dates de naissance proposées) — **DoD** : l'utilisateur voit les deux versions et leur source, choisit une version "affichée par défaut" sans supprimer l'autre
- 1.1.2.2 Historique des modifications d'une personne — **DoD** : timeline des changements consultable, avec auteur/source de chaque changement

---

## 1.2 Création & import d'arbres

**DoD** : Un utilisateur peut démarrer un arbre vide ou en important un fichier existant, sans intervention technique.

### 1.2.1 Création manuelle d'arbre
- 1.2.1.1 Assistant de création (point de départ : soi-même, ou un ancêtre connu) — **DoD** : un arbre minimal (1 personne) créé en < 2 minutes
- 1.2.1.2 Saisie manuelle de personnes/relations — **DoD** : formulaire complet couvrant le modèle [0.1.1](00-geniius-io-transverse.md#011-modèle-personne-et-identités-multiples-sourcées)/[0.1.2](00-geniius-io-transverse.md#012-modèle-relation)

### 1.2.2 Import GEDCOM
- 1.2.2.1 Parsing et validation de fichiers GEDCOM (`@geniius/gedcom-core`) — **DoD** : import d'un fichier GEDCOM réel de 1000+ individus sans perte de champ
- 1.2.2.2 Gestion des conflits à l'import (personnes existantes vs importées) — **DoD** : écran de fusion/ignorer/créer proposé avant import définitif
- 1.2.2.3 Gestion des tags GEDCOM non standards/legacy — **DoD** : tags non reconnus journalisés, pas de perte silencieuse de données

---

## 1.3 Navigation & visualisation de l'arbre

**DoD** : N'importe quel individu de l'arbre est atteignable en moins de 3 actions depuis n'importe quel autre point de l'arbre.

### 1.3.1 Vue graphe / arbre généalogique
- 1.3.1.1 Rendu visuel de l'arbre (ascendants/descendants, pan/zoom) — **DoD** : affichage fluide sur arbres larges (50+ personnes visibles simultanément)
- 1.3.1.2 Navigation "centrer sur cette personne" — **DoD** : un clic recentre l'arbre sur n'importe quel individu

### 1.3.2 Navigation alternative (liste, chronologie)
- 1.3.2.1 Vue chronologique (timeline familiale par génération/période) — **DoD** : période sélectionnable affichant les personnes vivantes à cette époque
- 1.3.2.2 Vue liste/recherche rapide — **DoD** : recherche par nom avec résultats < 1s sur grand arbre

### 1.3.3 Recherche dans l'arbre
- 1.3.3.1 Recherche par nom, lieu, date, profession — **DoD** : recherche multi-critères combinables
- 1.3.3.2 Recherche "chemin entre deux personnes" (lien de parenté) — **DoD** : affiche le chemin de relations entre 2 individus quelconques

---

## 1.4 Fiche individu

**DoD** : La fiche d'une personne présente l'intégralité de ce qui est connu sur elle (faits, relations, sources, médias, lieux de vie) sur un seul écran/parcours cohérent.

### 1.4.1 Identité & faits
- 1.4.1.1 Présentation des faits sourcés (naissance, mariage, décès, professions...) avec confiance/source — **DoD** : chaque fait affiche sa provenance au clic
- 1.4.1.2 Gestion des alias/identités multiples (noms d'usage, variantes orthographiques) — **DoD** : toutes les variantes connues d'un nom sont recherchables

### 1.4.2 Relations familiales
- 1.4.2.1 Parents, conjoints, enfants, fratrie avec navigation directe — **DoD** : un clic sur une relation ouvre la fiche correspondante
- 1.4.2.2 Relations contestées/concurrentes — **DoD** : affichage explicite "selon X / selon Y"

### 1.4.3 Parcours de vie & lieux
- 1.4.3.1 Chronologie de vie (naissance → événements → décès) localisée géographiquement — **DoD** : chronologie affichée avec lieux cliquables vers [1.5](#15-lieux-référentiel-géographique-historique)
- 1.4.3.2 Carte des lieux de vie — **DoD** : carte interactive montrant les déplacements de la personne

### 1.4.4 Médias & documents liés
- 1.4.4.1 Photos associées à la personne — **DoD** : galerie consultable, sourcée (qui l'a déposée, quand)
- 1.4.4.2 Documents/actes liés (lien vers [1.6](#16-sources--preuves-documentaires)) — **DoD** : depuis une fiche, accès direct à l'acte d'archive correspondant

---

## 1.5 Lieux (référentiel géographique historique)

**DoD** : Pour tout lieu de l'arbre, on peut répondre à "qui y a vécu, sur quelle période, et comment ce lieu était découpé à cette époque".

### 1.5.1 Référentiel hiérarchique des lieux
- 1.5.1.1 Arborescence pays/région/commune/section/hameau — **DoD** : conforme au modèle [0.1.3](00-geniius-io-transverse.md#013-modèle-lieu), navigable
- 1.5.1.2 Édition/correction d'un lieu (rattachements, renommages) — **DoD** : un changement de rattachement n'affecte pas les liens existants déjà datés

### 1.5.2 Historique d'un lieu
- 1.5.2.1 Timeline des changements administratifs d'un lieu — **DoD** : un lieu affiche son nom/découpage à une date choisie
- 1.5.2.2 Fusion/scission de lieux dans le temps (ex : deux hameaux fusionnés en une commune) — **DoD** : modélisé sans perdre les liens vers les anciennes entités

### 1.5.3 Population d'un lieu
- 1.5.3.1 "Qui vivait ici" sur une période donnée — **DoD** : requête fonctionnelle retournant une liste de personnes avec leur lien au lieu (résidence, naissance, décès...)
- 1.5.3.2 Visualisation cartographique des lieux de l'arbre — **DoD** : carte globale avec densité de personnes par lieu/période

---

## 1.6 Sources & preuves documentaires

**DoD** : Chaque fait affiché dans Tree peut être retracé jusqu'au document ou témoignage qui l'a produit.

### 1.6.1 Rattachement document ↔ fait/personne
- 1.6.1.1 Visualisation d'un document source depuis un fait — **DoD** : image/acte affiché en un clic depuis le fait correspondant
- 1.6.1.2 Gestion des médias (photos de famille, documents numérisés) — **DoD** : upload, association à une/plusieurs personnes, métadonnées (date, lieu, légende)

### 1.6.2 Liens entre documents (réconciliation documentaire)
- 1.6.2.1 Visualisation des documents liés par mentions croisées (cf. [0.1.4.3](00-geniius-io-transverse.md#014-modèle-source--document--preuve) / [3.8](03-rebond.md#38-réconciliation-documentaire-inter-actes)) — **DoD** : depuis Tree, on voit "ce fait est aussi mentionné dans ces autres documents"
- 1.6.2.2 Signalement de document manquant/probable (acte disparu déduit de mentions) — **DoD** : un fait peut être marqué "déduit", avec les documents qui le suggèrent

---

## 1.7 Statistiques & analyses

**DoD** : Un utilisateur comprend en un coup d'œil la composition, la complétude et les lacunes de son arbre.

### 1.7.1 Statistiques de composition
- 1.7.1.1 Nombre d'individus, générations, branches — **DoD** : tableau de bord déjà présent (TreeStatsPage) couvrant ces métriques
- 1.7.1.2 Répartition géographique et temporelle des individus — **DoD** : graphiques par siècle/région

### 1.7.2 Analyse de complétude / lacunes
- 1.7.2.1 Détection des "trous" (personne sans parents connus, dates manquantes) — **DoD** : liste exploitable de lacunes, utilisable comme input pour Journal (fils ouverts)
- 1.7.2.2 Score de fiabilité d'une branche (proportion de faits sourcés vs déclaratifs) — **DoD** : indicateur affiché par branche/personne

---

## 1.8 Réconciliation multi-sources (réception Rebond/Journal/Connect)

**DoD** : Les trois flux entrants (cf. [0.2](00-geniius-io-transverse.md#02-intégration-inter-applications-flux-de-données)) sont arbitrables depuis Tree par un humain, sans connaissance technique de l'app d'origine.

### 1.8.1 File de propositions entrantes
- 1.8.1.1 Vue unifiée des propositions (toutes apps confondues) avec filtre par source — **DoD** : un écran liste toutes les propositions en attente, quelle que soit leur origine
- 1.8.1.2 Détail d'une proposition (avant/après, source, contexte) — **DoD** : décision éclairée possible sans retourner dans l'app d'origine

### 1.8.2 Arbitrage et application
- 1.8.2.1 Acceptation partielle (accepter certains champs d'une proposition, pas tous) — **DoD** : granularité au niveau du fait, pas seulement de la proposition entière
- 1.8.2.2 Historique des arbitrages (qui a validé/rejeté quoi, pourquoi) — **DoD** : journal d'audit consultable

---

## 1.9 Export, partage & impression

**DoD** : Les données de l'arbre ne sont jamais captives de Geniius.io.

### 1.9.1 Export
- 1.9.1.1 Export GEDCOM complet — **DoD** : fichier ré-importable dans un autre logiciel généalogique standard sans perte majeure
- 1.9.1.2 Export de fiches individuelles (PDF) — **DoD** : fiche imprimable avec faits, relations, sources

### 1.9.2 Partage
- 1.9.2.1 Partage d'une vue d'arbre en lecture seule (lien à un membre de la famille) — **DoD** : lien fonctionnel sans création de compte pour le destinataire
- 1.9.2.2 Gestion des droits de visibilité par branche/personne (notamment personnes vivantes, cf. [0.5](00-geniius-io-transverse.md#05-conformité-légale--protection-des-données)) — **DoD** : une personne vivante peut limiter sa visibilité

---

[← Sommaire](README.md) · [← Précédent : Geniius.io transverse](00-geniius-io-transverse.md) · [Suivant : Journal →](02-journal.md)
