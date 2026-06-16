[← Sommaire](README.md)

# 0. GENIIUS.IO — Programme transverse

**Description** : Couche de fondations partagée par les 5 apps — modèle de données pivot, identité, infrastructure, design system, conformité, qualité. N'est pas une app visible par l'utilisateur final, mais conditionne la cohérence de toute la suite.

**Définition** : Ensemble des règles, contrats de données, composants et services communs qui permettent à Rebond, Tree, Journal, Connect (et Echo) d'interopérer sans dupliquer la logique ni corrompre les données partagées.

**À quoi ça sert** : Garantir qu'une "personne" créée dans Rebond, enrichie par Journal et consultée dans Connect désigne bien la même entité dans Tree, avec une traçabilité de chaque information (qui l'a dite, quand, à partir de quoi).

**Pour qui** : Toutes les équipes produit/dev de la suite ; indirectement, tous les utilisateurs finaux (la fiabilité des données dépend de ce socle).

**Pourquoi c'est innovant** : La plupart des outils généalogiques sont soit des bases d'archives figées (type sites d'archives), soit des arbres déclaratifs non sourcés (type arbres collaboratifs grand public). Geniius.io est innovant parce qu'il fait cohabiter dans un même graphe des données **probantes** (archives), **déclaratives** (familles), et **mémorielles** (témoignages oraux), chacune avec son niveau de confiance, sans jamais en perdre la trace — et avec une couche IA qui aide à les rapprocher.

**Definition of Done du programme** : Le programme est "Done" quand n'importe quelle app peut écrire une information sur une personne/lieu/fait sans connaître l'implémentation des autres apps, que cette information arrive dans Tree avec sa source et son niveau de confiance, qu'aucune information n'est jamais perdue ou silencieusement écrasée, et que l'ensemble respecte le cadre légal RGPD pour les personnes vivantes.

---

## 0.1 Modèle de données pivot & identité généalogique

**Description** : Le schéma de données commun (personnes, relations, faits, lieux, sources, médias, identités multiples) utilisé comme langage partagé entre toutes les apps.

**DoD** : Un schéma versionné, documenté, publié en package partagé (`@geniius/schema`), couvrant 100% des entités échangées entre apps, avec règles de validation et exemples.

### 0.1.1 Modèle "Personne" et identités multiples sourcées
- 0.1.1.1 Définition de l'entité Personne (champs invariants vs champs sourcés) — **DoD** : schéma figé, capable de représenter une personne connue par 3 sources contradictoires sans perte
- 0.1.1.2 Modèle de "fait" sourcé (valeur, source, date de collecte, niveau de confiance, statut validé/proposé/rejeté) — **DoD** : un fait = une ligne immuable, jamais modifiée, seulement ajoutée/dépréciée
- 0.1.1.3 Règles de réconciliation d'identité (même personne détectée par 2 sources différentes) — **DoD** : algorithme + interface de fusion documentés, testés sur cas réels (homonymes, variantes orthographiques)
- 0.1.1.4 Statuts de cycle de vie d'une personne (vivante / décédée / inconnue / fusionnée) — **DoD** : machine à états documentée, impact RGPD défini par statut

### 0.1.2 Modèle "Relation"
- 0.1.2.1 Types de relations supportés (filiation, conjoint, parrainage, fratrie, tutelle...) — **DoD** : liste exhaustive validée, compatible GEDCOM
- 0.1.2.2 Relations sourcées et datées (une relation peut être affirmée par une source et contestée par une autre) — **DoD** : un même couple de personnes peut porter 2 relations concurrentes affichables côte à côte

### 0.1.3 Modèle "Lieu"
- 0.1.3.1 Référentiel hiérarchique (pays > région > commune > section > hameau > lieu-dit) — **DoD** : arborescence navigable à 6 niveaux minimum, alimentable depuis Rebond
- 0.1.3.2 Historique d'un lieu (changements de nom, de découpage administratif, de rattachement dans le temps) — **DoD** : un lieu interrogé à une date donnée renvoie son découpage à cette date
- 0.1.3.3 Lien lieu ↔ personnes (qui a vécu/est né/est mort à cet endroit, sur quelle période) — **DoD** : requête "qui vivait ici entre 1850 et 1870" fonctionnelle

### 0.1.4 Modèle "Source / Document / Preuve"
- 0.1.4.1 Modèle de document (registre, acte, photo, témoignage audio, message) — **DoD** : tout fait dans Tree est traçable jusqu'à un document ou un témoignage d'origine
- 0.1.4.2 Modèle de "mention" (occurrence d'une personne/lieu dans un document) — **DoD** : une mention peut être liée a posteriori à une personne du graphe
- 0.1.4.3 Liens entre documents (un acte disparu mais mentionné dans un autre document) — **DoD** : un document peut référencer un autre document inexistant comme "probable", avec niveau de certitude

### 0.1.5 Packages partagés & gouvernance du schéma
- 0.1.5.1 Publication et versionning de `@geniius/schema` / `@geniius/gedcom-core` / `@geniius/utils` — **DoD** : changelog, semver, tests de non-régression cross-app à chaque release
- 0.1.5.2 Processus de changement de schéma (RFC, migration coordonnée) — **DoD** : aucune app ne casse en silence quand le schéma évolue

---

## 0.2 Intégration inter-applications (flux de données)

**Description** : Les canaux par lesquels Rebond, Journal et Connect écrivent dans Tree, et par lesquels Tree expose ses données aux autres apps.

**DoD** : Chaque flux d'écriture vers Tree passe par une file de propositions avec validation humaine (sur le modèle déjà défini par Journal), et chaque flux de lecture est documenté et stable.

### 0.2.1 Flux Rebond → Tree
- 0.2.1.1 Export d'individus/actes consolidés depuis Rebond — **DoD** : un individu "rebond" validé peut être projeté en personne Tree avec ses sources
- 0.2.1.2 File de validation des imports massifs (par lot, pas un par un) — **DoD** : un PO peut valider/rejeter un lot de 100 personnes avec aperçu des conflits

### 0.2.2 Flux Journal → Tree
- 0.2.2.1 File `journal_proposals` (déjà cadrée fonctionnellement) — **DoD** : proposition créée, visible, acceptée/rejetée, traçable
- 0.2.2.2 Application des propositions acceptées sur le graphe Tree — **DoD** : une proposition acceptée crée un fait sourcé "Journal" sans écraser l'existant

### 0.2.3 Flux Connect → Tree
- 0.2.3.1 File de modération des contributions familiales (Family Knowledge, signalements) — **DoD** : toute déclaration d'un participant est un "fait proposé", jamais un fait définitif
- 0.2.3.2 Résolution des doublons "personne créée par un participant" vs "personne existante dans Tree" — **DoD** : interface de rapprochement, taux de doublons résiduels mesuré

### 0.2.4 Flux Tree → apps (lecture)
- 0.2.4.1 API/contrat de lecture du graphe pour Journal (contexte d'une personne avant interview) — **DoD** : Journal récupère en un appel l'état connu d'une personne (faits + lacunes)
- 0.2.4.2 API/contrat de lecture pour Connect (arbre consultable par les participants) — **DoD** : Connect affiche un arbre à jour sans copie locale désynchronisée

---

## 0.3 Infrastructure technique commune

**Description** : Hébergement, base de données, authentification, CI/CD, environnements.

**DoD** : Chaque app se déploie indépendamment mais partage l'authentification et la base Supabase ; un incident sur une app n'impacte pas les autres.

### 0.3.1 Supabase (base de données & backend)
- 0.3.1.1 Organisation des schémas/tables par app vs tables partagées — **DoD** : convention de nommage documentée, pas de table "à qui elle appartient ?" ambiguë
- 0.3.1.2 Politiques RLS (Row Level Security) cohérentes entre apps — **DoD** : audit de sécurité passé, aucune table sensible accessible sans politique explicite
- 0.3.1.3 Migrations versionnées et rejouables — **DoD** : un environnement vierge peut être reconstruit par script

### 0.3.2 Authentification & gestion des identités utilisateurs
- 0.3.2.1 SSO entre apps (un compte unique pour Tree/Journal/Connect/Rebond) — **DoD** : un utilisateur ne se reconnecte pas en changeant d'app
- 0.3.2.2 Rôles & permissions transverses (admin, contributeur, participant, visiteur) — **DoD** : matrice de permissions documentée et appliquée partout

### 0.3.3 CI/CD & environnements
- 0.3.3.1 Pipelines de build/test/déploiement par app — **DoD** : chaque push sur main déploie automatiquement après tests verts
- 0.3.3.2 Environnements (dev/staging/prod) isolés — **DoD** : aucune donnée de test ne peut polluer la prod

---

## 0.4 Système de design & composants partagés

**Description** : `@geniius/layout` et conventions UI communes.

**DoD** : Les 5 apps partagent une identité visuelle reconnaissable et des composants de base sans divergence de version majeure.

### 0.4.1 Bibliothèque de composants partagés
- 0.4.1.1 Composants de layout (header, navigation, scaffolds) — **DoD** : utilisés par au moins 3 apps sans surcharge locale lourde
- 0.4.1.2 Charte graphique & thèmes (y compris mode TV pour Connect) — **DoD** : un seul fichier de design tokens source de vérité

### 0.4.2 Cohérence d'expérience inter-apps
- 0.4.2.1 Navigation croisée (passer de Connect à Tree pour une même personne) — **DoD** : lien profond fonctionnel personne → fiche Tree
- 0.4.2.2 Vocabulaire produit unifié (mêmes mots pour les mêmes concepts dans toutes les apps) — **DoD** : glossaire produit publié et respecté

---

## 0.5 Conformité légale & protection des données

**Description** : RGPD, droit à l'image, gestion des données de personnes vivantes vs décédées, consentements.

**DoD** : Aucune donnée personnelle d'une personne vivante n'est visible/traitée sans base légale identifiée (consentement ou intérêt légitime documenté), avec procédure de suppression effective.

### 0.5.1 Cadre légal généalogique
- 0.5.1.1 Politique de distinction vivant/décédé dans l'affichage des données — **DoD** : règle appliquée automatiquement (ex : masquage de détails sur personnes vivantes non consentantes)
- 0.5.1.2 Gestion du consentement (Connect) et de son retrait — **DoD** : retrait de consentement déclenche une purge/anonymisation effective, traçable

### 0.5.2 Droits des personnes (RGPD)
- 0.5.2.1 Droit d'accès/export des données personnelles — **DoD** : un participant peut obtenir un export de toutes ses données en < X jours
- 0.5.2.2 Droit à l'effacement et ses limites généalogiques (effacer une personne sans casser l'arbre des autres) — **DoD** : procédure documentée et testée

---

## 0.6 Qualité, tests & observabilité transverses

**Description** : Stratégie de tests, monitoring, gestion des erreurs, mesure de qualité des données.

**DoD** : Tout incident de production est détecté avant signalement par un utilisateur ; toute régression de données est détectable par un job de contrôle.

### 0.6.1 Stratégie de test
- 0.6.1.1 Tests de non-régression sur le schéma pivot — **DoD** : suite de tests exécutée à chaque modification de `@geniius/schema`
- 0.6.1.2 Tests d'intégration inter-apps (flux Rebond/Journal/Connect → Tree) — **DoD** : scénario bout-en-bout automatisé

### 0.6.2 Observabilité & qualité des données
- 0.6.2.1 Monitoring applicatif (erreurs, performance) — **DoD** : alerting configuré sur les 5 apps
- 0.6.2.2 Indicateurs de qualité des données (doublons résiduels, faits sans source, personnes orphelines) — **DoD** : tableau de bord qualité consultable par le PO

---

## 0.7 Gouvernance produit & documentation

**Description** : Documentation fonctionnelle/technique, glossaire, roadmap consolidée.

**DoD** : Un nouveau contributeur (dev ou PO) comprend le système en une demi-journée de lecture sans avoir à interroger l'équipe.

### 0.7.1 Documentation transverse
- 0.7.1.1 Glossaire produit (personne, fait, source, proposition, identité, mention...) — **DoD** : document unique référencé par toutes les apps
- 0.7.1.2 Cartographie des flux de données (schéma visuel à jour) — **DoD** : diagramme tenu à jour à chaque changement de flux

---

[← Sommaire](README.md) · [Suivant : Tree →](01-tree.md)
