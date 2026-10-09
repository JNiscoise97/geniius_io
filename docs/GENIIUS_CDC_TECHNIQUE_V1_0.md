# GENIIUS — Cahier des charges technique V1.0

**Version :** 1.0 — consolidée à partir des échanges de conception
**Date :** 9 octobre 2026
**Statut :** audit achevé sur le périmètre initial — **NON GELÉ** (voir § 11). **Version de référence** du CDC technique ; les autres versions sont archivées dans [`archives/cdc-technique/`](archives/cdc-technique/) ([registre des versions normatives](GENIIUS_REGISTRE_VERSIONS_NORMATIVES.md)).
**Source :** [`archives/cdc-technique/échanges_CDC technique.txt`](archives/cdc-technique/) (décisions TECH-001 à TECH-033, AUDIT-TECH-001 à 016, REV-02-A à H, REV-03-A à M11)
**Documents amont :**
- CDCF V1.1 (référence)
- MCD V1.1 🔒 (gelé, 95/95 tests)
- Dictionnaire V1.1 consolidé (candidat au gel)
- MLD V1.0 (candidat)

Statuts et preuves : voir le registre des versions normatives.
**Document aval :** Architecture technique → crash-test d'architecture → MPD → API/Core → applications

> Ce document fixe **ce que GENIIUS doit garantir techniquement**. Il ne choisit pas les technologies : chaque fois qu'une solution concrète est évoquée (PostgreSQL, MinIO, Supabase, Electron, Tauri, RLS, RabbitMQ, OpenTelemetry…), c'est à titre d'illustration. Le choix relève de l'architecture technique, documenté par ADR (TECH-032).

---

## Sommaire

0. Objet, statut et règles de lecture
1. Doctrine technique de GENIIUS
2. Périmètre système et architecture logique de référence
3. Exigences techniques TECH-001 à TECH-033
4. Clarifications transversales AUDIT-TECH-001 à AUDIT-TECH-016
5. Décisions de cohérence REV-02-A à REV-02-H
6. Règles de vérifiabilité, de gouvernance et d'alignement (REV-03)
7. Registre des lacunes REV-03-L01 à L16 et arbitrages associés
8. Référentiel des recettes techniques
9. Registre des décisions différées et des paramètres à dimensionner
10. Matrice de traçabilité des 33 exigences
11. Conditions de gel GEL-01 à GEL-08
12. Réserve structurelle AV-FONC-001
13. Procédure de changement après gel
Annexe A — Glossaire
Annexe B — Journal des décisions
Annexe C — Limites de ce document
Annexe D — Origine fonctionnelle et correspondance avec le CDCF V1.1

---

# 0. Objet, statut et règles de lecture

## 0.1 Objet

Le MLD dit **comment la connaissance GENIIUS est structurée logiquement**. Le CDC technique dit **comment le système doit se comporter techniquement** : plateformes, hors connexion, synchronisation, stockage, sécurité, confidentialité, résilience, performance, traitements asynchrones, recherche, IA, API, interopérabilité, exploitation, qualité, gouvernance des décisions.

Il centralise également des exigences déjà disséminées dans les modèles amont : contraintes procédurales `CP-*` et décisions `MPD-*` du MLD, obligations `OB-*` du dictionnaire, invariants du MCD. Il précise **quelle couche est responsable de quelle famille d'invariants** sans figer leur implémentation.

## 0.2 Frontière CDC / architecture

| Le CDC technique fixe | L'architecture technique décide |
|---|---|
| Le **besoin** : « traitement asynchrone durable, idempotent, observable et rejouable » | La **solution** : file PostgreSQL, Redis, RabbitMQ ou autre |
| Les propriétés à respecter et leurs critères de recette | Les technologies, l'infrastructure, les fournisseurs |
| Les invariants non négociables | Les compromis, documentés par ADR |

Règle : *les choix technologiques sont évalués à partir des exigences, et non l'inverse* (TECH-032.13).

## 0.3 Conventions

- **Identifiants.**
  - `TECH-xxx` : exigence technique ; `TECH-xxx.n` : énoncé normatif n° n de cette exigence.
  - `AUDIT-TECH-xxx` : clarification transversale issue de l'audit de cohérence.
  - `REV-02-x`, `REV-03-x` : décisions de revue.
  - `L01`–`L16` : lacunes de spécification (forme longue `REV-03-L01`).
  - `REC-*` : scénario de recette.
  - `GEL-*` : condition de gel.
  - `MPD-*`, `CP-*` : décisions et contraintes du MLD.
  - `OB-*` : obligations du dictionnaire.
- **« doit »** : prescription normative. **« peut »** : capacité permise. **« à terme »** : capacité architecturalement préparée, non exigée en V1.
- **Criticité** (AUDIT-TECH-015) :
  - **P0 — invariant critique** : intégrité scientifique, absence de fuite de données protégées, préservation des contributions, effacement légal, contrôles d'autorisation. Une violation avérée bloque la mise en production concernée et ne peut pas être traitée comme une dette technique ordinaire.
  - **P1 — exigence essentielle de livraison** : bloque normalement la livraison de la fonctionnalité concernée, sauf décision explicite et justifiée.
  - **P2 — amélioration planifiée** : reportable avec justification et échéance de réexamen.

  Cette classification ne doit jamais servir à rétrograder une obligation de sécurité ou de conservation.
- **Trois statuts indépendants** (REV-03-M10) :
  1. **Décision d'audit** : comportement approuvé ou arbitrage ouvert.
  2. **Intégration normative** : disposition effectivement inscrite et vérifiée dans le document de référence.
  3. **Preuve de recette** : scénario rédigé, ou test effectivement exécuté.

  Une approbation en discussion **n'est pas** une intégration normative. Un scénario approuvé **n'est pas** un test exécuté.

## 0.4 Règle de priorité en cas de conflit

1. Les obligations légales applicables (notamment RGPD) prévalent sur les mécanismes ordinaires d'historisation (AUDIT-TECH-002).
2. Les invariants scientifiques et de confidentialité approuvés prévalent sur toute optimisation de performance, de coût ou de disponibilité (TECH-014, TECH-028.7, AUDIT-TECH-008).
3. Un conflit entre documents n'est jamais résolu silencieusement par interprétation : il ouvre un écart documenté (§ 13).

---

# 1. Doctrine technique de GENIIUS

Les principes ci-dessous reprennent les formulations validées pendant la conception. Ils guident l'interprétation de toutes les exigences.

| # | Principe | Origine |
|---|---|---|
| D1 | **Intégrité et durabilité > disponibilité immédiate.** Mieux vaut rester indisponible deux heures de plus que restaurer un état corrompu. | TECH-012 |
| D2 | **Aucun écrasement silencieux.** Ni la synchronisation, ni une migration, ni une restauration, ni un rollback ne détruisent une contribution ou une provenance. | TECH-003, 005, 023, 031 |
| D3 | **Vérité technique ≠ vérité historique.** Le Cloud est techniquement canonique pour l'état enregistré ; il ne décide pas de la vérité historique. | TECH-003 |
| D4 | **Suggestion ≠ décision.** Une sortie d'algorithme, d'OCR ou d'IA reste une proposition jusqu'à validation humaine selon les règles du Core. | TECH-010, 017 |
| D5 | **Le fichier n'est pas la connaissance.** Un original ingéré est immuable ; les transformations produisent des dérivés. | TECH-006 |
| D6 | **Graphe accessible avant toute opération révélatrice.** On ne calcule jamais sur des données interdites pour les masquer ensuite. | TECH-011, AUDIT-TECH-004 |
| D7 | **Une donnée inaccessible ne quitte jamais le serveur.** Le masquage côté client est interdit. | TECH-011 |
| D8 | **Fail closed.** Si une autorisation ne peut pas être vérifiée, l'accès est refusé. | TECH-013 |
| D9 | **Les index, caches et vues sont des dérivés reconstructibles**, jamais une seconde vérité ni une autorité de permissions. | TECH-016 |
| D10 | **GENIIUS survit sans IA.** Aucun fournisseur d'IA n'est dépositaire unique d'une connaissance. | TECH-013, 017 |
| D11 | **Administrer n'est pas lire.** Administrer la plateforme, administrer un espace et lire des contenus scientifiques privés sont trois prérogatives distinctes. | TECH-027, REV-02-A, CP-25 |
| D12 | **GENIIUS n'est jamais le geôlier du patrimoine.** Un patrimoine doit pouvoir survivre à GENIIUS lui-même. | TECH-026, AUDIT-TECH-007 |
| D13 | **Immutabilité ≠ droit absolu de conservation.** L'immutabilité scientifique garantit l'intégrité ; elle ne bloque pas une purge légalement requise. | AUDIT-TECH-002 |
| D14 | **On expérimente librement sur GENIIUS, jamais sur le patrimoine réel des utilisateurs.** | TECH-022 |
| D15 | **Une exigence n'est maîtrisée que lorsqu'on sait démontrer qu'elle est respectée.** | AUDIT-TECH-015 |
| D16 | **GENIIUS améliore sa représentation de l'histoire sans réécrire rétroactivement ce que les chercheurs avaient affirmé.** | TECH-031 |
| D17 | **Déterministe lorsque cela suffit, probabiliste lorsque cela apporte réellement quelque chose.** | TECH-017 |

---

# 2. Périmètre système et architecture logique de référence

## 2.1 Applications et Core

GENIIUS articule six applications — **Tree, Journal, Echo, Rebond, Connect, Atlas** — autour d'un **Core scientifique commun**. Les applications sont des manières différentes de travailler avec un même univers de connaissance. Elles ne possèdent pas chacune leur copie des entités historiques communes (TECH-008.5).

Les contenus des espaces privés ne sont jamais versés automatiquement au Core partagé : toute contribution est explicite, attribuée et soumise aux droits (TECH-003, REC-A02).

## 2.2 Vue logique

Cette vue est logique. Elle ne préjuge ni du nombre de serveurs ni des technologies.

```text
  Web  ·  Desktop (Windows, macOS)  ·  Mobile (iOS, Android)
  Tree · Journal · Echo · Rebond · Connect · Atlas
  [répliques locales + contributions hors ligne versionnées]
                     │
        ┌────────────┴────────────┐
   API métier interactives    Protocole de synchronisation
        └────────────┬────────────┘
                     ▼
               GENIIUS Core  (monolithe modulaire)
   règles métier · autorisations · versions · provenance · validation
                     │
        ┌────────────┼──────────────────────────┐
        ▼            ▼                          ▼
  Base relationnelle   Stockage objet        Tâches asynchrones → Workers
  canonique unifiée    (originaux, dérivés)  (OCR, transcription, imports,
                                              exports, index, IA, miniatures)
        └──── Index de recherche, caches (dérivés reconstructibles) ────┘
```

## 2.3 Répartition des responsabilités sur les invariants

| Famille d'invariants | Couche responsable | Défense complémentaire |
|---|---|---|
| Règles scientifiques : signatures de prédicats, statuts dérivés, dépendances, versions | **Core** ; contraintes procédurales CP-01 à CP-22 (déclencheurs, contraintes différées ou service) | Contraintes déclaratives de la base, quand c'est possible |
| Autorisations, graphe accessible, protection d'existence | **Core / moteur d'autorisation canonique côté serveur** | Couche données (RLS ou équivalent, MPD-06) ; client = confort uniquement |
| Cohérence base ↔ fichiers | Protocole d'écriture contrôlé du Core (AUDIT-TECH-006) | Contrôles d'intégrité périodiques (empreintes) |
| Idempotence, reprise | Core, protocole de synchronisation, workers | Clés d'opération, manifestes |
| Présentation de l'incertitude, états de synchronisation | Applications (Web, Desktop, Mobile) | API qui n'aplatit jamais (OB-19) |

Les applications ne réimplémentent jamais de manière autonome les règles scientifiques ni les autorisations (TECH-011.7, TECH-025.11).

---

# 3. Exigences techniques TECH-001 à TECH-033

## 3.0 Index

| ID | Domaine | ID | Domaine |
|---|---|---|---|
| TECH-001 | Surfaces d'accès Web, Desktop, Mobile | TECH-018 | API, contrats et indépendance des applications |
| TECH-002 | Fonctionnement hors connexion | TECH-019 | Chiffrement et protection des données |
| TECH-003 | Donnée de référence et souveraineté | TECH-020 | Confidentialité, RGPD, cycle de vie |
| TECH-004 | Application Desktop installée | TECH-021 | Observabilité, supervision, audit |
| TECH-005 | Synchronisation entre appareils | TECH-022 | Environnements DEV, STAGING, PROD |
| TECH-006 | Données structurées et fichiers | TECH-023 | CI/CD, déploiement, retour arrière |
| TECH-007 | Authentification et sessions | TECH-024 | Stratégie de tests et non-régression |
| TECH-008 | Monolithe modulaire et workers | TECH-025 | Interfaces Web, Desktop, Mobile |
| TECH-009 | Volumétrie et migrations patrimoniales | TECH-026 | Interopérabilité et pérennité |
| TECH-010 | Migration patrimoniale massive | TECH-027 | Administration et exploitation |
| TECH-011 | Sécurité des accès, graphe accessible | TECH-028 | Disponibilité, SLO, SLA |
| TECH-012 | Sauvegarde, PRA, RPO, RTO | TECH-029 | Coûts, FinOps, quotas |
| TECH-013 | Résilience, idempotence | TECH-030 | Vulnérabilités et incidents de sécurité |
| TECH-014 | Performance | TECH-031 | Évolution du modèle et migrations scientifiques |
| TECH-015 | Traitements asynchrones | TECH-032 | Gouvernance technique, ADR, recette |
| TECH-016 | Recherche et indexation | TECH-033 | Internationalisation |
| TECH-017 | IA : rôle, limites, traçabilité | | |

Toutes ont été **validées** pendant la conception. Leur intégration normative est vérifiée par les conditions GEL-02 et GEL-03 (§ 11).

## TECH-001 — Surfaces d'accès

**Décision.** GENIIUS est une plateforme **Web + Desktop + Mobile** reposant sur un Core commun, **sans parité fonctionnelle obligatoire** entre les trois surfaces.

**Exigences.**

- **TECH-001.1** GENIIUS doit être utilisable depuis le Web, une application Desktop installée et une application Mobile installée.
- **TECH-001.2** Le Core, les données, les règles métier et les API sont communs aux trois surfaces. Il n'existe pas trois GENIIUS indépendants.
- **TECH-001.3** Une fonctionnalité n'a pas l'obligation d'exister sur toutes les surfaces. Chaque surface privilégie les usages adaptés :
  - le **Desktop** pour la recherche et les traitements intensifs (2 000 actes, imports massifs, double écran, traitements locaux lourds) ;
  - le **Mobile** pour la consultation, la collecte terrain, Echo, Journal, Connect et les usages rapides (photo d'archive, enregistrement de témoignage) ;
  - le **Web** pour l'accès universel.
- **TECH-001.4** Les applications installées peuvent exploiter les capacités matérielles du terminal lorsque cela apporte une valeur fonctionnelle : fichiers et dossiers locaux, appareil photo, micro, notifications, partage, biométrie du système, scanner lorsqu'il est accessible.
- **TECH-001.5** La fabrication d'un matériel GENIIUS propriétaire est **hors périmètre**. L'architecture ne doit cependant pas empêcher à terme un nœud ou serveur GENIIUS local.

**Liens.** TECH-004, TECH-025. Recette : contrat à préciser (REV-03-M10-A).

## TECH-002 — Fonctionnement hors connexion

**Décision.** GENIIUS est **cloud-first avec des capacités hors connexion explicites** (option « B+ »). Il n'est pas encore intégralement offline-first, mais l'architecture ne doit pas empêcher d'y évoluer.

**Exigences.**

- **TECH-002.1** Le Desktop et le Mobile doivent pouvoir conserver localement **l'intégralité des données structurées** auxquelles l'utilisateur a accès et qu'il souhaite garder hors connexion. Cela comprend : Tree, personnes, relations, événements, assertions, sources et références, projets, recherches Echo, Journal, métadonnées de documents, transcriptions disponibles.
- **TECH-002.2** Les **fichiers binaires lourds** (originaux image, PDF, audio, vidéo) suivent une politique distincte : téléchargement à la demande, cache, et conservation hors ligne explicite configurable (par projet, par espace, par type de média).
- **TECH-002.3** Le comportement hors connexion attendu sur Mobile est le suivant.

  | Sans Internet sur Mobile | Exigence |
  |---|---|
  | Voir ses arbres, naviguer dans les personnes et familles, suivre les liens | Obligatoire |
  | Consulter projets, événements, lieux, relations, recherches Echo, Journal, sources et références | Obligatoire |
  | Voir les métadonnées des documents | Obligatoire |
  | Rechercher une personne dans les données locales | Obligatoire |
  | Prendre notes, photos, audio ; créer des éléments simples | Obligatoire |
  | Modifier massivement le graphe | Partiel |
  | Import GEDCOM massif, gros traitements, collaboration temps réel, IA serveur | Non disponible hors ligne |

- **TECH-002.4** La définition retenue est la suivante :
  - **lecture hors ligne** très large, jusqu'à la base structurée complète ;
  - **collecte hors ligne** importante ;
  - **modification métier hors ligne** partielle ;
  - **fichiers lourds hors ligne** configurables ;
  - **pas de synchronisation multi-utilisateur offline-first intégrale** en V1.
- **TECH-002.5** Sur le Desktop, les contenus rendus disponibles hors ligne sont consultables **et modifiables** dans le périmètre des opérations autorisées hors ligne.
- **TECH-002.6** Le Web fonctionne principalement connecté ; un cache technique est possible, sans mode hors ligne garanti.
- **TECH-002.7** L'architecture V1 ne doit pas rendre impossible une évolution vers un fonctionnement offline-first plus complet.

**Liens.**
- Clarification : AUDIT-TECH-001 (révocation hors ligne).
- Lacune : L15.
- Recettes : REC-X15 à X17.

## TECH-003 — Donnée de référence et souveraineté

**Décision.** **Cloud canonique + répliques locales + contributions hors ligne versionnées + conflits non destructifs** (option C).

**Exigences.**

- **TECH-003.1** Le Cloud GENIIUS constitue la **référence technique canonique** des données synchronisées. Un appareil hors ligne n'est jamais la nouvelle base souveraine : il possède la dernière copie canonique connue et ses changements locaux en attente.
- **TECH-003.2** Toute opération réalisée hors connexion conserve au minimum :
  - son identité ;
  - son auteur et son appareil ;
  - sa date ;
  - son contexte ;
  - **la version canonique connue sur laquelle elle a été effectuée**.
- **TECH-003.3** À la reconnexion :
  - **pas de conflit** : synchronisation automatique ;
  - **conflit techniquement fusionnable** (exemple : note ajoutée d'un côté, profession de l'autre) : fusion automatique traçable ;
  - **conflit susceptible de modifier le sens scientifique ou métier** (exemple : CHARBONNÉ contre CHARBONNET) : aucune décision silencieuse, conservation des deux contributions, résolution explicite.
- **TECH-003.4** La politique « dernière sauvegarde gagnante » est interdite.
- **TECH-003.5** La synchronisation ne doit jamais être un mécanisme de destruction de provenance ou d'historique.
- **TECH-003.6** « Cloud canonique » désigne l'état technique enregistré, pas la vérité historique. Une assertion du serveur reste contestable par une autre assertion.
- **TECH-003.7** La synchronisation s'appuie sur les structures existantes du MLD (`objet`, `version_objet`, `activite`, historisation). On ne crée pas un second modèle dédié à la synchronisation.

**Liens.**
- Clarifications : AUDIT-TECH-003, AUDIT-TECH-014.
- Lacune : L11.
- Recettes : REC-X13, REC-TR01 à TR11, REC-X17.

## TECH-004 — Application Desktop installée

**Décision.** GENIIUS Desktop est une **véritable application installable**, et non une simple PWA. Elle peut partager composants et technologies avec le Web, mais dispose d'une **couche Desktop dédiée** pour accéder aux capacités locales.

**Exigences.**

- **TECH-004.1** Les capacités suivantes sont **obligatoires** :
  - accès aux fichiers et dossiers locaux ;
  - glisser-déposer massif ;
  - stockage et base locale ;
  - notifications.
- **TECH-004.2** Les capacités suivantes sont **conditionnelles** : micro et caméra lorsqu'ils sont disponibles et autorisés. Le scanner est une **capacité cible à intégration progressive**, non obligatoire en V1.
- **TECH-004.3** Les cas d'usage visés sont : importer un dossier (parcours, empreintes, détection des doublons, reprise après interruption) et surveiller un dossier pour proposer l'intégration des nouveaux fichiers.
- **TECH-004.4** **Moindre privilège** : l'accès au système repose sur l'autorisation explicite de l'utilisateur, périmètre par périmètre (dossier, micro, caméra, scanner). Ces autorisations sont révocables.
- **TECH-004.5** **Windows et macOS** sont officiellement supportés dès la cible initiale. **Linux** est prévu architecturalement, mais non exigé en V1.
- **TECH-004.6** La technologie Desktop (Electron, Tauri ou autre) est choisie lors de l'architecture.
- **TECH-004.7** Les fichiers référencés conservent identifiants, empreintes, métadonnées de provenance et références stables, malgré un renommage, un déplacement ou une indisponibilité (voir REC-TECH04).

**Liens.** TECH-006, TECH-010. Recette : REC-TECH04.

## TECH-005 — Synchronisation entre appareils

**Décision.** Synchronisation **automatique par défaut**, incrémentale, reprenable et visible.

**Exigences.**

- **TECH-005.1** La synchronisation est automatique dès qu'une connexion adaptée est disponible, sans bouton « Synchroniser » obligatoire.
- **TECH-005.2** Elle est **incrémentale** : seules les nouveautés circulent.
- **TECH-005.3** Elle est **interruptible et reprenable sans duplication**. Exemple : une coupure après la 73ᵉ photo sur 200 ne relance pas les 200 transferts.
- **TECH-005.4** Elle distingue les petites données structurées (synchronisation rapide) des fichiers lourds. L'utilisateur peut choisir la politique de transfert des fichiers lourds : Wi-Fi uniquement, Wi-Fi + données mobiles, ou demande avant un gros transfert.
- **TECH-005.5** L'état est **visible** : synchronisé, en cours (nombre restant), hors connexion (éléments en attente), erreur, conflit nécessitant une intervention.
- **TECH-005.6** Une erreur réseau ne provoque ni perte, ni duplication, ni obligation de recommencer toute une opération.
- **TECH-005.7** Conformément à TECH-003, un conflit scientifique n'est jamais écrasé silencieusement.
- **TECH-005.8** **Non-expiration des créations non synchronisées.** Aucune donnée créée par l'utilisateur et non encore synchronisée ne peut être supprimée automatiquement, que ce soit pour une raison de cache, de stockage ou d'ancienneté. La désinstallation ou l'effacement des données locales déclenche un avertissement explicite (« 12 éléments n'ont jamais été synchronisés… »).
- **TECH-005.9** **Synchronisation ≠ sauvegarde ≠ historisation** :
  - la synchronisation protège contre la divergence entre appareils ;
  - la sauvegarde protège contre la perte ou la corruption ;
  - l'historisation protège l'évolution de la connaissance.

**Liens.**
- Clarifications : AUDIT-TECH-001, AUDIT-TECH-003.
- Lacune : L15.
- Recettes : REC-X15, X16.

## TECH-006 — Données structurées et fichiers

**Décision.** Séparation physique entre la **base relationnelle** et le **stockage objet** ; **originaux immuables** ; **ingestion par défaut**.

**Exigences.**

- **TECH-006.1** Les données structurées et les fichiers binaires sont physiquement séparés.
- **TECH-006.2** La base relationnelle conserve la connaissance structurée, les métadonnées et les références vers les fichiers : personnes, événements, assertions, relations, sources, transcriptions, droits, versions, projets, Journal.
- **TECH-006.3** Les fichiers binaires (images, PDF, audio, vidéo, GEDCOM originaux, exports) sont conservés dans un stockage objet adapté.
- **TECH-006.4** Tout fichier original ingéré est **immuable**. Rotation, compression, contraste, miniatures, WebP et OCR produisent des **dérivés**, ou enregistrent une transformation. Ils ne modifient jamais l'original.
- **TECH-006.5** Une **empreinte cryptographique forte** (exemple : SHA-256) est calculée à l'ingestion. Elle sert à vérifier l'intégrité et à détecter l'identité binaire.
- **TECH-006.6** **Doublon binaire ≠ même document historique.** Deux empreintes identiques établissent que deux fichiers sont identiques, pas que deux références documentaires constituent le même objet scientifique.
- **TECH-006.7** Par défaut, importer signifie que GENIIUS **prend en charge sa propre copie** du fichier. Il ne dépend pas d'un chemin local de l'utilisateur.
- **TECH-006.8** L'architecture doit permettre à terme des **bibliothèques externes liées** pour les très gros volumes (exemple : 4 To sur un NAS). GENIIUS connaît alors le fichier, son empreinte et ses métadonnées sans l'héberger. Ce mode n'est pas le fonctionnement normal.
- **TECH-006.9** Le stockage objet n'est pas choisi ici (MinIO, S3-compatible, Supabase Storage ou autre).
- **TECH-006.10** Perdre le stockage objet ne doit jamais laisser la base prétendre qu'un original est encore disponible. GENIIUS doit contrôler la cohérence entre métadonnées et fichiers réels.

**Liens.**
- Clarifications : AUDIT-TECH-005, 006, 012.
- Lacunes : L06, L07.
- Recettes : REC-RB04 à RB07, REC-J06 à J09.

## TECH-007 — Authentification et sessions

**Décision.** Compte GENIIUS **indépendant** des fournisseurs, avec plusieurs moyens d'authentification et des passkeys privilégiées.

**Exigences.**

- **TECH-007.1** GENIIUS possède son propre modèle de compte, indépendant des fournisseurs d'identité externes. Il respecte la distinction **COMPTE / ACTEUR_GENIIUS / PERSONNE historique**.
- **TECH-007.2** Plusieurs moyens d'authentification peuvent être associés à un même compte.
- **TECH-007.3** Les **passkeys** sont supportées et privilégiées.
- **TECH-007.4** Email + mot de passe reste disponible, au moins initialement, comme solution universelle ou de secours.
- **TECH-007.5** Google, Apple et éventuellement Microsoft peuvent servir de moyens de connexion, sans devenir propriétaires de l'identité GENIIUS.
- **TECH-007.6** La MFA est disponible dès la V1. Elle est **obligatoire** pour les comptes techniques et administratifs sensibles.
- **TECH-007.7** La biométrie est déléguée exclusivement aux mécanismes sécurisés du système d'exploitation. GENIIUS ne stocke **aucune donnée biométrique**.
- **TECH-007.8** L'utilisateur peut consulter et **révoquer** ses appareils et sessions (Compte → Appareils).
- **TECH-007.9** Les données locales doivent être protégées contre la lecture après vol de l'appareil (voir TECH-019).
- **TECH-007.10** Une session peut être durable sur un appareil de confiance. Une **réauthentification** est exigée pour les opérations sensibles : suppression du compte, options de sécurité, export massif de données privées, modification des moyens d'authentification.
- **TECH-007.11** Les accès simplifiés pour les contributeurs occasionnels (exemple : une personne âgée invitée à témoigner dans Echo) relèvent des **accès invités / contributions externes**, et non d'un « compte simplifié ».

**Liens.**
- Clarification : AUDIT-TECH-013.
- Recette : REC-TECH07.

## TECH-008 — Monolithe modulaire et workers

**Décision.** **Monolithe modulaire + workers asynchrones + architecture préparée à l'extraction future.**

**Exigences.**

- **TECH-008.1** GENIIUS adopte initialement une architecture de monolithe modulaire.
- **TECH-008.2** Les modules ont des responsabilités et des frontières explicites. Ils communiquent par contrats définis. Le découpage final (Identity & Access, Knowledge, Sources & Documents, Assertions, Historical Entities, Tree, Journal, Echo, Rebond, Connect, Atlas, Import/Export, Search, Publication…) sera dérivé du MLD et du CDC.
- **TECH-008.3** Aucune dépendance anarchique : un module ne va pas « bricoler dans les entrailles » d'un autre.
- **TECH-008.4** Le Core scientifique est commun aux applications.
- **TECH-008.5** Tree, Journal, Echo, Rebond, Connect et Atlas ne possèdent pas chacun leur copie indépendante des entités historiques communes.
- **TECH-008.6** La base relationnelle canonique est **initialement unifiée**, mais organisée logiquement (schémas, conventions, permissions). La connaissance canonique n'est pas éclatée entre plusieurs bases. Des systèmes techniques annexes peuvent avoir leur propre stockage : recherche, cache, files, observabilité.
- **TECH-008.7** Les traitements longs ou coûteux sont exécutés par des **workers asynchrones** distincts : miniatures, OCR, transcription, imports, exports, indexation, IA.
- **TECH-008.8** Un module doit pouvoir être extrait en service indépendant si la charge ou l'organisation le justifie.
- **TECH-008.9** Aucun microservice n'est créé « pour faire microservices ». Toute séparation exige une **justification mesurable** : charge, sécurité, isolation, cycle de déploiement, équipe, disponibilité.
- **TECH-008.10** Aucun langage ni framework n'est choisi ici.

**Liens.** Recette : REC-TECH08.

## TECH-009 — Volumétrie et migrations patrimoniales

**Décision.** GENIIUS est conçu **dès sa première architecture** pour accueillir des patrimoines constitués sur plusieurs décennies, y compris l'arrivée groupée de collectifs entiers. Cas de référence : une association d'environ 40 généalogistes retraités, aux données volumineuses, dispersées et hétérogènes.

**Exigences.**

- **TECH-009.1** GENIIUS n'est pas dimensionné autour d'un « utilisateur moyen » (800 personnes, 200 photos).
- **TECH-009.2** Le problème couvre le volume **et** la dispersion :
  - GEDCOM et logiciels anciens ;
  - Excel, Word, PDF ;
  - scans et photos ;
  - dossiers imbriqués et disques externes ;
  - conventions de nommage personnelles ;
  - doublons.
- **TECH-009.3** GENIIUS doit absorber progressivement ces patrimoines **sans exiger de l'utilisateur qu'il nettoie trente ans de travail** au préalable.
- **TECH-009.4** Des **profils de volumétrie de référence** doivent être définis et utilisés dans les tests. Les ordres de grandeur ci-dessous ont été évoqués **à titre indicatif, non validés** (registre § 9) :
  - courant : 10 000 personnes / 20 Go ;
  - avancé : 100 000 personnes / 250 Go ;
  - expert : 500 000 personnes / 2 To ;
  - institutionnel : plusieurs millions d'entités / plusieurs To.
- **TECH-009.5** **Un gros compte ne nécessite pas une architecture différente.** On peut lui allouer davantage de ressources, mais on ne change pas de produit au-delà d'un seuil.
- **TECH-009.6** Une généalogie de 150 000 personnes peut produire plusieurs millions à dizaines de millions de lignes (versions, assertions, liens, activités, mentions, dépendances). Ce volume doit rester techniquement traité.

**Précision.** Un forfait illimité en stockage à prix fixe est économiquement dangereux. Le modèle commercial (abonnement + enveloppe de stockage) est hors CDC technique (voir TECH-029).

**Liens.**
- Clarification : AUDIT-TECH-008.
- Lacune : L16.
- Recette : REC-NF03.

## TECH-010 — Migration patrimoniale massive

**Décision.** Véritable **système de migration patrimoniale** (option C), progressif, reprenable, traçable et non destructif. Ce n'est pas un simple bouton « Importer GEDCOM ».

**Exigences.**

- **TECH-010.1** La migration commence par un **inventaire** de plusieurs sources simultanées (GEDCOM, dossiers, disques) avant tout import. Elle produit une synthèse : personnes, relations, sources, images, PDF, bureautique, doublons binaires potentiels, fichiers non rattachés, volume total.
- **TECH-010.2** La pipeline suit les étapes : dépôt → inventaire → validation → staging → rapprochement → transformation → contrôles → intégration → indexation → rapport. **Chaque étape est reprenable.**
- **TECH-010.3** **Importer ≠ comprendre.** Un `BIRT 1842` importé reste « le fichier importé affirmait ceci ». Il ne devient pas un fait historique certain. Un nom de dossier est un indice, pas une vérité.
- **TECH-010.4** **Migration non destructive.** GENIIUS ne modifie, ne déplace et ne renomme jamais les fichiers originaux de l'utilisateur.
- **TECH-010.5** Une migration possède son propre état : préparée → en cours → suspendue → reprise → terminée, partiellement terminée ou échouée. Elle reprend après redémarrage ou perte de réseau.
- **TECH-010.6** **Réimporter ne duplique pas.** On s'appuie sur la lignée et la clé d'import (`lignee_import`, `cle_import`, OB-10).
- **TECH-010.7** Les formats sont classés en trois catégories :
  - **support natif garanti** : import maîtrisé et testé ;
  - **support assisté** : extraction partielle, avec validation ;
  - **conservable mais non interprété** : archivé et rattaché sans prétendre comprendre.

  Ne pas savoir interpréter un fichier n'oblige pas à le jeter.
- **TECH-010.8** **Migration progressive.** L'arbre devient utilisable pendant que les médias continuent d'être transférés et indexés.
- **TECH-010.9** Un rapport détaillé est produit, et la provenance de chaque élément est conservée.
- **TECH-010.10** L'IA peut proposer des rattachements (« ce fichier semble concerner Louis CHARBONNÉ »), sans décision silencieuse (TECH-017).

**Liens.**
- Clarifications : AUDIT-TECH-005, 010.
- Recettes : REC-X20, REC-TR04, REC-TR11.

## TECH-011 — Sécurité des accès et graphe accessible

**Décision.** **Défense en profondeur**, avec un moteur d'autorisation canonique côté serveur.

**Exigences.**

- **TECH-011.1** La sécurité s'applique à plusieurs niveaux :
  - le client évite de proposer les opérations interdites ;
  - le Core et l'API vérifient les autorisations métier ;
  - la couche données applique des protections lorsque c'est pertinent.
- **TECH-011.2** Le serveur est l'**autorité canonique** des autorisations.
- **TECH-011.3** Une donnée inaccessible **n'est jamais envoyée au client** pour y être masquée (interdit : `secret_note` accompagné de `can_display_secret_note: false`).
- **TECH-011.4** Le **graphe accessible** est calculé **avant** : recherche, navigation, agrégation, statistiques, export, notification, API, traitements IA (OB-03, MLD § 22.3).
- **TECH-011.5** La protection d'existence empêche les fuites indirectes : compteurs, suggestions, messages d'erreur, résultats partiels, temps de réponse. Les réponses « absent » et « existence protégée » sont indistinguables (OB-04). Exemple : répondre « 2 résultats », et non « 3 résultats dont 1 inaccessible ».
- **TECH-011.6** Hors ligne, les applications utilisent la dernière autorisation synchronisée connue. Toute révocation est propagée, et les copies locales concernées deviennent inaccessibles ou supprimables à la reconnexion. La **fenêtre de risque jusqu'à la reconnexion** est reconnue (AUDIT-TECH-001).
- **TECH-011.7** Les règles d'autorisation ne sont pas réimplémentées indépendamment par le Web, le Desktop et le Mobile.
- **TECH-011.8** Les contrôles de sécurité sont testés automatiquement, notamment contre les fuites indirectes.
- **TECH-011.9** L'ordre d'évaluation est celui du MLD § 22.2 : existence protégée → interdiction → autorisation explicite → visibilité par défaut → lien (extrémités accessibles) → embargo et masquage.
- **TECH-011.10** Un rôle administratif ne confère **aucune lecture implicite** des contenus `projet` ou `privé` (REV-02-A, CP-23 à CP-25).
- **TECH-011.11** La matérialisation (RLS PostgreSQL, moteur de politiques dans le Core ou combinaison) est reportée à MPD-02 et MPD-06.

**Liens.**
- Clarifications : AUDIT-TECH-001, 004, 009 ; REV-02-A, B, C.
- Lacunes : L08, L10, L11, L13, L14.
- Recettes : REC-X01, X08 à X14.
- Point de contrôle **M10-A01** : approuvée sur le fond, **bloquante potentielle (B1)** tant que la cohérence normative des règles d'accès n'est pas vérifiée.

## TECH-012 — Sauvegarde, PRA, RPO et RTO

**Décision.** Une stratégie de sauvegarde **distincte** de la synchronisation et de l'historisation. La priorité en catastrophe est donnée à **l'intégrité avant la vitesse de remise en ligne**.

**Exigences.**

- **TECH-012.1** GENIIUS possède une stratégie de sauvegarde distincte de la synchronisation et de l'historisation.
- **TECH-012.2** **RPO ≤ 5 minutes** pour les données structurées canonisées.
- **TECH-012.3** **RTO ≤ 4 heures** après une catastrophe majeure. Des objectifs plus ambitieux sont possibles ultérieurement.
- **TECH-012.4** Les sauvegardes couvrent la base relationnelle **et** le stockage documentaire.
- **TECH-012.5** Au moins une copie critique est **isolée** du système de production. Plusieurs copies dans le même compte Cloud ne constituent pas une stratégie de sauvegarde.
- **TECH-012.6** Une partie de la chaîne de sauvegarde est **immuable pendant une durée définie**, de sorte qu'un administrateur compromis (ransomware) ne puisse pas supprimer immédiatement l'historique de sauvegarde.
- **TECH-012.7** Les sauvegardes sont chiffrées.
- **TECH-012.8** Des **restaurations complètes sont testées périodiquement**. L'existence d'un fichier de sauvegarde ne prouve rien.
- **TECH-012.9** Après restauration, GENIIUS vérifie la cohérence BDD ↔ fichiers (identifiants, empreintes).
- **TECH-012.10** En catastrophe, la priorité va à l'**intégrité et à la durabilité** avant la vitesse de remise en ligne.
- **TECH-012.11** Pour les fichiers originaux ingérés, **aucune perte silencieuse n'est acceptable** : une perte ou une corruption est au minimum détectée et signalée, avec un objectif de restauration.

**Reporté.** Fréquence des snapshots, rétention, nombre de copies, régions, fournisseur. Garanties RPO propres aux fichiers binaires (AUDIT-TECH-006.13).

**Liens.**
- Clarifications : AUDIT-TECH-002, 006.
- Lacune : L15.
- Recettes : REC-X04, X06, X18, X19, REC-NF05.

## TECH-013 — Résilience et idempotence

**Décision.** **Dégradation gracieuse**, idempotence, retries contrôlés et **fail closed**.

**Exigences.**

- **TECH-013.1** La panne d'un composant non critique (OCR, IA, transcription) ne provoque pas une panne générale.
- **TECH-013.2** La sécurisation d'une donnée source est distinguée de ses traitements dérivés. L'échec d'un traitement dérivé ne signifie pas la perte de la source. Exemple d'état : « Original sécurisé ✅ / OCR en attente ⏳ ».
- **TECH-013.3** Les traitements dérivés échoués sont repris sans réimporter la source.
- **TECH-013.4** Toute opération sensible à la répétition est **idempotente**. Exemple : un client qui rejoue l'opération `ABC123` obtient le résultat existant, sans doublon.
- **TECH-013.5** Les erreurs sont traitées selon leur nature :
  - **erreur temporaire** : retry automatique borné ;
  - **erreur permanente** : arrêt et diagnostic ;
  - **erreur inconnue répétée** : mise à l'écart pour investigation.
- **TECH-013.6** Une tâche défectueuse ne bloque pas toute une file. Une file de traitements en échec isole les cas problématiques.
- **TECH-013.7** Les dépendances externes (IA, OCR, transcription) ne conditionnent jamais l'accès à la connaissance fondamentale. Si un fournisseur disparaît, GENIIUS perd une capacité automatisée, **pas des données**.
- **TECH-013.8** Les composants sont classés par criticité :

  | Niveau | Composants | Comportement en panne |
  |---|---|---|
  | **1 — critique** | Intégrité, authentification, autorisations, accès au Core, stockage des originaux | Bloquer certaines écritures plutôt que risquer une corruption |
  | **2 — important** | Recherche, synchronisation, certaines fonctions applicatives | Continuer partiellement |
  | **3 — différable** | OCR, miniatures secondaires, analyses, IA, notifications non urgentes | Mise en attente |

- **TECH-013.9** **Fail closed** : si une autorisation ne peut pas être vérifiée, l'accès est refusé (« donnée momentanément indisponible »).
- **TECH-013.10** En cas de doute sur l'intégrité d'une écriture, GENIIUS suspend l'écriture plutôt que de risquer une corruption silencieuse.

**Liens.** Recettes : REC-TECH13, REC-X16, REC-NF09.

## TECH-014 — Performance

**Décision.** Des objectifs **par catégorie d'opération**, mesurés en **percentiles**, sans jamais contourner la confidentialité.

**Exigences.**

- **TECH-014.1** Les interactions ordinaires donnent un **retour perceptible en moins d'une seconde** en conditions nominales. L'opération complète peut se poursuivre en arrière-plan (indexation, propagation, notifications).
- **TECH-014.2** Consultations courantes côté serveur : **p95 ≤ 1 seconde**, hors latence réseau et opérations explicitement lourdes.
- **TECH-014.3** Recherche interactive standard : **premiers résultats ≤ 2 secondes**, y compris sur une grosse base (REC-NF02 : p95 ≤ 2 s dans les conditions de référence).
- **TECH-014.4** Aucun corpus complet n'est chargé lorsqu'un sous-ensemble suffit. Pagination, chargement progressif (lazy loading de Tree) et requêtes bornées sont obligatoires.
- **TECH-014.5** La taille totale d'un patrimoine ne dégrade pas linéairement les opérations locales ordinaires. Ouvrir une fiche ne parcourt pas 400 000 personnes.
- **TECH-014.6** Les traitements longs sont asynchrones, suivables et non bloquants.
- **TECH-014.7** Synchronisation, indexation et traitements de fond ne rendent pas l'interface inutilisable. En particulier, la synchronisation ne bloque pas l'usage normal au démarrage.
- **TECH-014.8** Les performances sont mesurées en percentiles, et non en moyenne seule.
- **TECH-014.9** Les exigences sont testées sur plusieurs profils de volumétrie, dont les profils avancé et expert de TECH-009.
- **TECH-014.10** GENIIUS augmente progressivement sa capacité sans changement fondamental d'architecture. On distingue la **capacité architecturale** des **ressources provisionnées**.
- **TECH-014.11** Une optimisation ne contourne **jamais** la confidentialité, l'intégrité scientifique ou la traçabilité.

**Liens.**
- Clarification : AUDIT-TECH-008.
- Lacune : L16.
- Recettes : REC-NF01 à NF03, REC-NF10.

## TECH-015 — Traitements asynchrones

**Décision.** Un véritable système de tâches, avec identité, états, priorités, reprise et rejeu sûr.

**Exigences.**

- **TECH-015.1** Les traitements longs ou coûteux s'exécutent de manière asynchrone. La requête utilisateur sécurise et enregistre le travail demandé, puis le confie au système de tâches (« Import accepté — 5 000 fichiers à traiter »).
- **TECH-015.2** Les tâches importantes possèdent une **identité persistante** (exemple : `IMPORT-2027-000184`). Elles conservent : type, demandeur, date, état, progression, éléments réussis et échoués, erreurs, tentatives, résultat.
- **TECH-015.3** Les états minimaux sont : attente, exécution, suspension, réussite, réussite partielle, annulation, échec.
- **TECH-015.4** La progression n'est chiffrée que lorsqu'elle est **réellement mesurable**. Sinon, l'état affiché est « traitement en cours ».
- **TECH-015.5** Il existe plusieurs **catégories et priorités** de traitements. Une migration de 500 000 fichiers ne doit pas retarder de trois jours la transcription Echo attendue par Sarah.
- **TECH-015.6** Des **quotas et limitations** protègent les ressources communes contre la saturation par un utilisateur ou une opération.
- **TECH-015.7** Les traitements sont repris après interruption sans recommencer depuis zéro.
- **TECH-015.8** Suspension, reprise et annulation sont possibles lorsque c'est pertinent. **Arrêter une tâche ne détruit pas ce qui a été valablement intégré.** Revenir sur des effets déjà produits est une opération métier distincte et tracée.
- **TECH-015.9** Les tâches serveur appartiennent à GENIIUS et au compte ou à l'espace concerné, et non à la session graphique qui les a déclenchées. Elles survivent à la fermeture du client.
- **TECH-015.10** Leur exécution supporte le **rejeu** sans effet incohérent : pas de double OCR, document, assertion ou notification.
- **TECH-015.11** Workers et traitements de fond sont soumis **exactement** aux mêmes règles d'autorisation, de confidentialité et de traçabilité que les opérations interactives. L'IA n'a aucun passe-droit.
- **TECH-015.12** Le choix de la file, des workers et de l'infrastructure est réservé à l'architecture.
- **TECH-015.13** Toute modification scientifique amont signale ses dépendances (CP-21, OB-09). Une propagation asynchrone ne crée pas de fenêtre de fausse certitude (REC-X12, arbitrages A à C).

**Liens.**
- Lacunes : L01, L12.
- Recettes : REC-X12, REC-NF09.
- Point de contrôle **M10-B01** : bloquant potentiel B1.
- Délai de propagation : MPD-04.

## TECH-016 — Recherche et indexation

**Décision.** Des index **dérivés, reconstructibles, filtrés par contexte**, qui ne sont jamais une vérité.

**Exigences.**

- **TECH-016.1** La recherche repose sur des index dérivés. Ils ne constituent jamais la source canonique de connaissance.
- **TECH-016.2** Tout index est reconstructible à partir des données et dérivés canoniquement conservés. On doit pouvoir supprimer intégralement l'index sans perdre de connaissance.
- **TECH-016.3** La recherche est textuelle, structurée et multicritère : texte, entités, relations, dates historiques, lieux, types, sources, assertions, états scientifiques, projets.
- **TECH-016.4** La recherche est **tolérante** (accents, casse, variantes, fautes, phonétique selon le contexte), sans transformer une similarité en identité scientifique.
- **TECH-016.5** OCR, transcriptions et autres dérivés sont indexables. Leur nature (original → OCR dérivé → mention potentielle → identification → assertion) et leur provenance restent explicites.
- **TECH-016.6** Un résultat permet de revenir à son objet et, lorsque c'est pertinent, au passage ou au fragment source.
- **TECH-016.7** Autorisations et protections d'existence s'appliquent aux résultats, compteurs, facettes, suggestions et autocomplétions. L'architecture « rechercher sur tout, puis filtrer » est **refusée**.
- **TECH-016.8** Le Desktop et le Mobile proposent une **recherche locale** sur les données disponibles hors ligne. Ils ne peuvent pas trouver ce qu'ils ne possèdent pas.
- **TECH-016.9** Une courte **cohérence éventuelle** de l'index est acceptable (exemple : 2 secondes). L'échec d'indexation ne fait pas échouer l'enregistrement canonique.
- **TECH-016.10** Une indexation échouée est détectable, rejouable et supervisable (TECH-015).
- **TECH-016.11** La recherche respecte TECH-014, y compris sur les gros patrimoines.
- **TECH-016.12** Le choix entre PostgreSQL natif, un moteur spécialisé ou une combinaison relève de l'architecture (MPD-01 : texte intégral **filtré par le graphe accessible**).

**Liens.**
- Clarifications : AUDIT-TECH-004, 011 ; REV-02-B, C.
- Recette : REC-TECH16.
- Point de contrôle **M10-B02** : bloquant potentiel B1.

## TECH-017 — IA : rôle, limites et traçabilité

**Décision.** L'IA **assiste**. Elle ne devient jamais l'autorité scientifique de GENIIUS. La chaîne reste : TRACE → extraction ou proposition IA → validation ou interprétation humaine → assertion éventuelle.

**Exigences.**

- **TECH-017.1** L'IA est une couche d'assistance, et non une autorité scientifique.
- **TECH-017.2** Une sortie probabiliste ne devient jamais silencieusement une assertion historique validée.
- **TECH-017.3** Suggestions, extractions et rapprochements IA conservent leur statut jusqu'à validation selon les règles métier.
- **TECH-017.4** Tout usage IA scientifiquement significatif est traçable : type de traitement, date, service ou modèle, version lorsqu'elle est disponible, paramètres pertinents, objets d'entrée, résultat. Cela n'impose pas de conserver indéfiniment chaque prompt : le niveau de journalisation est fixé selon le coût, la confidentialité et l'intérêt scientifique.
- **TECH-017.5** Les actions de masse proposées par une IA (exemple : « 143 personnes potentielles, 291 mentions… ») passent par une étape contrôlée avant d'être intégrées au Core.
- **TECH-017.6** L'IA respecte intégralement TECH-011. L'automatisation n'accorde aucun accès supplémentaire.
- **TECH-017.7** Les données sensibles et les personnes vivantes bénéficient de règles renforcées avant tout traitement externe. Les attributs `R` et `I` ne sont jamais transmis à un fournisseur d'IA, et les transmissions sont tracées (OB-15).
- **TECH-017.8** GENIIUS distingue techniquement les traitements internes ou locaux des transmissions à un prestataire externe. L'utilisateur sait quand un tiers est impliqué.
- **TECH-017.9** Les fonctions IA sont **désactivables** lorsqu'elles ne sont pas indispensables à la fonction explicitement demandée.
- **TECH-017.10** Aucune connaissance canonique ne dépend exclusivement d'un fournisseur ou d'un modèle IA.
- **TECH-017.11** Une panne ou la suppression de l'IA entraîne une dégradation fonctionnelle, et non une perte d'accès au patrimoine.
- **TECH-017.12** Les traitements déterministes sont privilégiés lorsqu'ils suffisent. « IA » couvre l'OCR, la HTR, la transcription, le rapprochement d'entités, la vision, la classification, l'extraction structurée, les LLM et la détection d'anomalies.
- **TECH-017.13** Les résultats IA sont contestables, ignorables et corrigibles sans altérer la trace ou la source originale.
- **TECH-017.14** Les modèles, fournisseurs, modèles locaux ou distants et la stratégie multi-fournisseurs sont choisis par l'architecture, et peuvent évoluer sans remettre en cause le Core.

**Liens.**
- Clarifications : AUDIT-TECH-004 (filtrage avant transmission), AUDIT-TECH-014.
- Recettes : REC-TECH17, REC-RB07, REC-J11.

## TECH-018 — API, contrats et indépendance des applications

**Décision.** Le Core est l'autorité métier. Les API exposent des **capacités métier**, et non les tables.

**Exigences.**

- **TECH-018.1** Le Core est l'autorité métier commune aux applications.
- **TECH-018.2** Les applications ne contournent pas les règles du Core en écrivant directement dans les données canoniques.
- **TECH-018.3** Les API exposent des opérations et des représentations métier (exemple : « ajouter une assertion de maternité en citant cet acte »), et non une copie du MLD.
- **TECH-018.4** Les contrats sont documentés, testables et versionnés.
- **TECH-018.5** Une politique de compatibilité ascendante et de dépréciation explicite est appliquée, avec un message clair lorsqu'une mise à jour devient indispensable. Les ruptures sont organisées.
- **TECH-018.6** Les échanges préservent identifiants, versions, provenances, incertitudes et distinctions scientifiques (source, mention, assertion, identification, hypothèse, conclusion). Une date incertaine n'est jamais aplatie en date exacte (OB-19).
- **TECH-018.7** Les opérations volumineuses utilisent pagination, limites, transferts progressifs ou asynchrones.
- **TECH-018.8** Le **protocole de synchronisation** est distinct des API interactives. Il échange des changements versionnés, détecte les conflits, reprend les transferts et réconcilie les états. Il respecte les mêmes invariants.
- **TECH-018.9** Chaque appel est soumis à TECH-011, y compris les API internes et les traitements automatisés.
- **TECH-018.10** Les opérations rejouables sont idempotentes.
- **TECH-018.11** L'architecture anticipe des API pour partenaires externes (droits, quotas, périmètres spécifiques), sans imposer leur ouverture en V1. Les API internes et les API publiques sont distinctes.
- **TECH-018.12** Le choix entre REST, GraphQL, gRPC, événements ou une combinaison relève de l'architecture.

**Liens.**
- Lacunes : L01 à L07, L09, L11 à L13.
- Recettes : REC-I04 à I07, T04 à T07, S04 à S11, RB04 à RB07, J06 à J09, E06 à E09, AT05 à AT09.

## TECH-019 — Chiffrement et protection des données

**Décision.** **Chiffrement serveur robuste par défaut** et protection renforcée possible pour certains périmètres (option C). Pas de chiffrement de bout en bout généralisé en V1.

**Exigences.**

- **TECH-019.1** Chiffrement **en transit** obligatoire, avec des protocoles modernes.
- **TECH-019.2** Chiffrement **au repos** obligatoire : bases, fichiers, sauvegardes, supports persistants.
- **TECH-019.3** Les **répliques locales** Desktop et Mobile sont protégées, y compris les données structurées consultables hors ligne. Elles s'appuient sur les mécanismes sécurisés de l'OS. Une session verrouillée n'équivaut pas à des fichiers chiffrés.
- **TECH-019.4** Les clés et secrets sont gérés de façon sécurisée et séparée (contrôle d'accès, rotation, traçabilité). Une clé ne doit jamais se trouver à côté des données qu'elle protège.
- **TECH-019.5** Aucun secret sensible n'est codé en dur dans le code ou les applications distribuées.
- **TECH-019.6** Le chiffrement serveur robuste est la règle par défaut. Le chiffrement de bout en bout n'est pas généralisé.
- **TECH-019.7** L'architecture permet à terme une confidentialité renforcée (y compris E2E) pour des périmètres spécifiques, avec des limitations fonctionnelles explicitement assumées.
- **TECH-019.8** Les données sensibles sont minimisées dans les logs, traces et diagnostics : pas de nom complet, de contenu de requête IA ni de jeton.
- **TECH-019.9** Les clés de sauvegarde sont protégées, et la restauration est testée pour qu'une sauvegarde chiffrée ne devienne pas irrécupérable.
- **TECH-019.10** Les algorithmes, KMS et coffres sont choisis par l'architecture. On utilise des standards reconnus, **jamais de cryptographie maison**. Les colonnes de confidentialité `I` sont chiffrées, clés hors base (MPD-05, OB-17).

**Précision.** Le chiffrement ne remplace ni les autorisations, ni les sauvegardes, ni la traçabilité.

**Liens.** Recette : REC-TECH19.

## TECH-020 — Confidentialité, RGPD et cycle de vie des données

**Décision.** Protection des données dès la conception, purge contrôlée et non-résurrection. **Aucun principe d'immutabilité ne rend impossible une purge juridiquement nécessaire.**

**Exigences.**

- **TECH-020.1** Protection des données dès la conception et par défaut, avec minimisation des données et des accès.
- **TECH-020.2** Distinction technique entre : compte, contributions scientifiques, documents privés, données de tiers, journaux techniques.
- **TECH-020.3** Règles de conservation définies par catégorie et par finalité.
- **TECH-020.4** **Purge contrôlée** couvrant :
  - l'état courant et les versions historiques ;
  - les répliques et caches ;
  - les index ;
  - les dérivés documentaires ;
  - les copies hors ligne, à leur prochaine connexion ;
  - les sauvegardes, selon leur politique.

  Procédure de référence : CP-16, OB-12.
- **TECH-020.5** Sauvegardes : rétention bornée et mécanismes empêchant la réapparition de données légalement effacées après restauration.
- **TECH-020.6** Traitement prudent des **personnes potentiellement vivantes**. Une date de naissance ancienne ne prouve pas un décès, et aucune présomption technique n'est présentée comme une certitude historique.
- **TECH-020.7** Protection renforcée des données sensibles (origines, religion, santé…), y compris pour l'IA et les transferts externes. **Avoir accès à une donnée n'autorise pas tous ses usages.**
- **TECH-020.8** Hébergement principal **privilégié dans l'Union européenne**, avec contrôle des prestataires et des transferts hors EEE. Cela ne suffit pas, seul, à garantir la conformité.
- **TECH-020.9** Workflow traçable pour les demandes de droits : accès, rectification, effacement, opposition, portabilité. Certaines demandes exigent un examen humain ; il n'y a pas d'acceptation automatique systématique.
- **TECH-020.10** Conservation patrimoniale compatible avec les obligations légales.
- **TECH-020.11** La suppression d'un compte est séparée de celle des contributions. Le sort des contributions dépend des droits, des engagements et des bases juridiques.
- **TECH-020.12** Documentation des traitements, durées, responsabilités et sous-traitants, avec analyse d'impact si nécessaire.
- **TECH-020.13** Tests de **non-réapparition** des données purgées, notamment après restauration et après la synchronisation d'un appareil longtemps hors ligne.

**Hors CDC.** Les bases juridiques, durées et procédures relèvent d'une analyse juridique et RGPD dédiée.

**Liens.**
- Clarifications : AUDIT-TECH-002, 013.
- Lacunes : L08, L14, L15.
- Recettes : REC-X06, X19, REC-J13.
- Point de contrôle **M10-B03**.

## TECH-021 — Observabilité, supervision et audit

**Décision.** Métriques, journaux structurés et traces corrélées. **Audit technique ≠ historisation scientifique.**

**Exigences.**

- **TECH-021.1** Métriques, journaux structurés et traces distribuées permettent de diagnostiquer le fonctionnement.
- **TECH-021.2** Les opérations significatives portent un **identifiant de corrélation** entre API, Core et traitements asynchrones.
- **TECH-021.3** Les traitements longs sont observables individuellement (TECH-015).
- **TECH-021.4** Des alertes détectent les incidents importants avant qu'ils ne provoquent une dégradation prolongée : taux d'erreur, saturation, accumulation de tâches, échec de sauvegarde, dérive de synchronisation, stockage inaccessible, anomalies de sécurité.
- **TECH-021.5** La supervision couvre au minimum : API, base, stockage documentaire, synchronisations, files de tâches, index, sauvegardes.
- **TECH-021.6** Les événements sensibles de sécurité et d'administration sont auditables et protégés contre l'altération.
- **TECH-021.7** Les journaux techniques, l'audit de sécurité et l'historisation scientifique restent distincts. L'audit n'est pas une source de faits historiques ; l'historisation ne remplace pas les journaux de sécurité.
- **TECH-021.8** Les journaux et traces minimisent les données personnelles, les contenus confidentiels et les secrets.
- **TECH-021.9** L'accès aux outils de supervision et d'audit est strictement autorisé et tracé.
- **TECH-021.10** La rétention est différenciée : diagnostic courte ; sécurité et audit adaptée aux risques et obligations ; historisation scientifique selon les règles du Core.
- **TECH-021.11** La supervision mesure objectivement les SLO (TECH-028).
- **TECH-021.12** Les outils (OpenTelemetry, Prometheus, Grafana…) sont choisis par l'architecture.

**Liens.**
- Clarification : AUDIT-TECH-014.
- Recette : REC-TECH21.
- Point de contrôle **M10-B04**.

## TECH-022 — Environnements DEV, STAGING, PROD

**Décision.** Séparation stricte des environnements. Les données réelles sont protégées hors production.

**Exigences.**

- **TECH-022.1** DEV, STAGING et PROD sont séparés obligatoirement, notamment pour les données, les secrets et les autorisations.
- **TECH-022.2** Aucun développement ni test destructif n'a lieu directement sur les données de production.
- **TECH-022.3** Les données synthétiques ou spécifiquement autorisées sont prioritaires hors production. Copier la base de production sur un poste n'est **pas** une pratique ordinaire.
- **TECH-022.4** Toute utilisation exceptionnelle de données réelles hors production est justifiée, autorisée, minimisée, protégée et traçable.
- **TECH-022.5** Les jeux de test couvrent les complexités scientifiques : relations complexes, contradictions, sources nombreuses, gros documents, cas de confidentialité.
- **TECH-022.6** Des jeux **volumétriques** testent les profils avancés et experts de TECH-009.
- **TECH-022.7** Les migrations de schéma et de données suivent une procédure contrôlée : versionnées → testées → vérifiées → déployées → contrôlées. Les migrations sont progressives et compatibles lorsque nécessaire.
- **TECH-022.8** La coexistence temporaire de versions Web, Desktop, Mobile et API est prise en compte.
- **TECH-022.9** La préproduction est représentative des composants critiques, sans dupliquer en permanence la capacité de production. Les tests de charge peuvent utiliser des ressources temporaires.
- **TECH-022.10** Les **feature flags** permettent des activations progressives. Ils ne remplacent jamais une autorisation et ne contournent jamais le Core.
- **TECH-022.11** Les secrets, comptes techniques et permissions de production ne sont pas réutilisés dans les autres environnements.
- **TECH-022.12** Infrastructures, conteneurs et outils de migration sont choisis par l'architecture.

**Liens.** Recette : REC-TECH22.

## TECH-023 — CI/CD, déploiement et retour arrière

**Décision.** Chaque version est **construite, vérifiée, publiée et diagnostiquée de manière reproductible**, sans mettre en péril le patrimoine.

**Exigences.**

- **TECH-023.1** Une chaîne CI/CD automatisée construit, vérifie et prépare les versions.
- **TECH-023.2** Des contrôles obligatoires sont proportionnés au risque du changement :

  | Type de changement | Contrôles particuliers |
  |---|---|
  | Interface simple | Tests UI et régression |
  | API | Contrats et compatibilité |
  | Core scientifique | Invariants métier et non-régression |
  | Autorisations | Confidentialité et non-divulgation |
  | Base de données | Migration, intégrité, compatibilité |
  | Synchronisation | Conflits, reprise, idempotence |
  | Sécurité critique | Revue renforcée |

- **TECH-023.3** Le déploiement est bloqué si un contrôle critique échoue. Compiler ne suffit pas.
- **TECH-023.4** Les invariants scientifiques, les autorisations, le versionnement et la synchronisation bénéficient d'une protection renforcée.
- **TECH-023.5** Les déploiements sont progressifs lorsque c'est justifié : interne → petit périmètre → élargissement → généralisation.
- **TECH-023.6** Les nouvelles versions sont supervisées, et une diffusion problématique peut être interrompue.
- **TECH-023.7** Le **rollback applicatif** est distinct de la **récupération des données**.
- **TECH-023.8** Aucun retour arrière ne détruit silencieusement des contributions valides enregistrées depuis le déploiement.
- **TECH-023.9** Plusieurs versions clientes et serveur restent temporairement compatibles selon une politique documentée. Le Core connaît les versions et capacités prises en charge.
- **TECH-023.10** Les données locales non synchronisées sont protégées lors des mises à jour, des migrations et des ruptures de compatibilité.
- **TECH-023.11** Versions, artefacts, migrations et déploiements sont traçables. Une version en exploitation est identifiable précisément (application, Core, migrations).
- **TECH-023.12** Secrets et droits de déploiement sont gérés de façon sécurisée, sans exposition dans la CI/CD.
- **TECH-023.13** Les outils CI/CD sont choisis par l'architecture.

**Arbitrage M10-C01.** Une mise en production ne laisse jamais GENIIUS dans un état partiellement migré ou scientifiquement incohérent.

**Liens.** Recette : REC-TECH23.

## TECH-024 — Stratégie de tests et non-régression

**Décision.** Les tests protègent non seulement le logiciel, mais aussi **les invariants scientifiques, le patrimoine, les droits et la synchronisation**.

**Exigences.**

- **TECH-024.1** La stratégie est multiniveau : unitaires, intégration, contrats, bout en bout, tests spécialisés.
- **TECH-024.2** Les contrôles reproductibles sont automatisés en priorité, dans la CI/CD.
- **TECH-024.3** Les invariants du MCD, du dictionnaire et du MLD deviennent des **tests exécutables**. Chaque contrainte procédurale CP-* a son test automatisé (MLD § 21.2).
- **TECH-024.4** Les autorisations et la non-divulgation sont testées systématiquement, y compris les fuites indirectes : nom, compteur, fragment, Atlas, statistique, suggestion, export. Une **matrice de tests d'autorisation** couvre toutes les surfaces.
- **TECH-024.5** Le hors ligne et la synchronisation sont testés : conflits, coupures, interruptions, redémarrages, appareils longtemps hors ligne.
- **TECH-024.6** Les imports et migrations sont testés sur des corpus complexes, volumineux et imparfaits. Exemples :
  - un import identique ne crée pas de nouvelles assertions ;
  - 12 erreurs ne détruisent pas les 8 000 autres éléments ;
  - la reprise fonctionne ;
  - les fichiers non interprétés sont conservés sans être présentés comme compris.
- **TECH-024.7** La performance est testée sur plusieurs profils de charge et de volumétrie.
- **TECH-024.8** La résilience est testée : stockage inaccessible, worker OCR interrompu, index indisponible, restauration, réseau coupé.
- **TECH-024.9** La sécurité est testée : analyse de dépendances, contrôles automatisés, audits approfondis selon les risques.
- **TECH-024.10** L'accessibilité est testée sur chaque surface.
- **TECH-024.11** La traçabilité suit la chaîne : **exigence → règle → scénario → résultat → version testée** (exemple : `TECH-003 → SYNC-CONFLIT-004 → PASS`).
- **TECH-024.12** Une publication est bloquée si un test critique échoue. Une exception formelle n'est possible que pour un risque évalué et acceptable, **jamais** pour contourner un invariant essentiel.
- **TECH-024.13** Les jeux de données synthétiques et les corpus de référence sont versionnés.
- **TECH-024.14** La non-régression est obligatoire lors des évolutions du Core, des contrats API, des autorisations, du modèle de données et de la synchronisation.

**Précision.** « 100 % de couverture de code » n'est pas un objectif : on vise la couverture des risques, invariants et scénarios critiques.

**Arbitrage M10-C02.** Confidentialité, souveraineté scientifique et non-résurrection des données purgées sont couvertes par des tests de non-régression.

**Liens.**
- Lacune : L16.
- Recettes : REC-TECH24, REC-NF09.

## TECH-025 — Interfaces Web, Desktop et Mobile

**Décision.** **Socle partagé, expériences adaptées** (option C).

**Exigences.**

- **TECH-025.1** Le frontend est mutualisé lorsque c'est pertinent, sans interface identique imposée partout.
- **TECH-025.2** Les expériences Web, Desktop et Mobile sont spécifiques. Exemple pour Tree : sur Desktop, arbre étendu, panneaux multiples, sources côte à côte, raccourcis ; sur Mobile, fiche, navigation familiale progressive, accès rapide à la caméra et aux notes.
- **TECH-025.3** Composants, contrats et logique de présentation sont partagés lorsque cela réduit réellement les divergences.
- **TECH-025.4** Les capacités natives (fichiers, caméra, micro, notifications, stockage sécurisé, hors ligne) passent par des **adaptateurs de plateforme** séparés.
- **TECH-025.5** Un **design system commun** est partagé par Tree, Journal, Echo, Rebond, Connect et Atlas : cohérence des comportements, pas uniformité visuelle.
- **TECH-025.6** Les états sont explicites : enregistré localement, synchronisation en attente, synchronisé avec GENIIUS Cloud, en erreur, en conflit.
- **TECH-025.7** Une confirmation locale n'est **jamais** présentée comme une confirmation serveur.
- **TECH-025.8** Les interfaces supportent les gros volumes : virtualisation des listes, chargement progressif, pagination, filtres, y compris pour Atlas.
- **TECH-025.9** L'accessibilité est intégrée dès la conception. **WCAG 2.2 AA** est la cible de référence pour le Web. Les obligations réglementaires effectivement applicables sont examinées séparément.
- **TECH-025.10** Les préférences de l'utilisateur et du système sont respectées : tailles, contrastes, réduction des animations, navigation clavier, technologies d'assistance, zones tactiles suffisantes, absence de dépendance exclusive à la couleur.
- **TECH-025.11** Les invariants scientifiques et les autorisations ne sont pas dupliqués dans les interfaces. Le Core refuse une relation interdite même si une ancienne interface l'envoie.
- **TECH-025.12** L'incertitude est affichée sans précision fictive : dates, lieux, continuités, trajets reconstruits (L03, L12).
- **TECH-025.13** Les frameworks sont choisis par l'architecture.

**Liens.**
- Lacunes : L03, L12, L16.
- Recettes : REC-NF06, REC-T04 à T07, REC-AT05 à AT09.

## TECH-026 — Interopérabilité et pérennité

**Décision.** **GENIIUS peut enrichir considérablement un patrimoine, mais ne doit jamais en devenir le geôlier technique.**

**Exigences.**

- **TECH-026.1** Pas d'enfermement propriétaire (vendor lock-in).
- **TECH-026.2** Import et export sont deux capacités distinctes, non symétriques, avec des garanties explicites.
- **TECH-026.3** Les formats standards sont utilisés lorsqu'ils sont pertinents (GEDCOM), sans appauvrir le modèle interne.
- **TECH-026.4** Un **export patrimonial complet** est prévu. Il est documenté et réutilisable sans GENIIUS (AUDIT-TECH-007).
- **TECH-026.5** Les exports préservent identifiants, versions, provenance, assertions, relations, sources, incertitudes et fichiers.
- **TECH-026.6** Les conversions avec perte sont identifiées et documentées par un **rapport de conversion** (exemple : « 8 assertions non représentables ; 4 dates dont la précision ne peut être conservée »). **Aucune précision n'est inventée** : jamais de 01/01/1772 pour « entre 1770 et 1775 ».
- **TECH-026.7** Les exports importants comportent un manifeste et des vérifications d'intégrité.
- **TECH-026.8** Identifiants et lignées d'import permettent une réconciliation maîtrisée lors des échanges successifs. Une personne exportée puis réimportée ne devient pas une nouvelle personne sans lien.
- **TECH-026.9** Une **matrice de compatibilité** documente les formats, versions, périmètres et limites.
- **TECH-026.10** Des standards s'ajoutent progressivement : GEDCOM, IIIF, métadonnées documentaires, identifiants pérennes (ARK). Ce sont des pistes, pas des engagements V1 intégraux.
- **TECH-026.11** Imports et exports respectent autorisations, confidentialité et obligations légales. Un export ne contourne pas TECH-011. Les données sorties de GENIIUS ne bénéficient plus des révocations ultérieures, et l'utilisateur en est informé.
- **TECH-026.12** Les échanges volumineux sont asynchrones et reprenables.
- **TECH-026.13** Les formats prioritaires, bibliothèques et connecteurs sont choisis lors de l'architecture et de la planification.

**Arbitrage M10-C03.** Un export n'est pas « portable » s'il perd les distinctions source / mention / assertion / hypothèse / conclusion / version. La portabilité n'autorise jamais un transfert de droits implicite.

**Liens.**
- Clarifications : AUDIT-TECH-007, 010 ; REV-02-G.
- Lacune : L10.
- Recettes : REC-TECH26, REC-X05, REC-E10 à E13.

## TECH-027 — Administration et exploitation

**Décision.** **Administrer GENIIUS ne signifie pas disposer d'un accès illimité au patrimoine privé des utilisateurs.**

**Exigences.**

- **TECH-027.1** GENIIUS dispose de capacités d'administration et d'exploitation adaptées à un service en production.
- **TECH-027.2** Les responsabilités logiques sont distinguées : exploitation, support, sécurité, administration des données, gestion des déploiements. Une petite équipe peut les cumuler, mais les permissions restent explicites.
- **TECH-027.3** **Moindre privilège.**
- **TECH-027.4** Le support n'a pas accès par défaut aux contenus scientifiques et documents privés. Il consulte d'abord les informations techniques : état de synchronisation, tâches, erreurs, version, volumes, stockage.
- **TECH-027.5** Les accès exceptionnels sont justifiés, limités dans leur périmètre et leur durée, autorisés et audités (CP-24). Les situations d'urgence sont encadrées.
- **TECH-027.6** L'exploitation peut voir, suspendre, relancer et isoler des tâches et ajuster des ressources, **sans modifier silencieusement les assertions** pour « réparer ». On distingue réparation technique et intervention sur la connaissance.
- **TECH-027.7** Les actions administratives sensibles sont traçables : qui, quand, contexte, périmètre, résultat. Une capacité de validation renforcée ou de double contrôle est prévue.
- **TECH-027.8** Des procédures existent pour la maintenance, les incidents et la communication aux utilisateurs (exemple : « Maintenance programmée de 23 h à minuit »). Les opérations dangereuses sont limitées pendant la maintenance.
- **TECH-027.9** Les opérations répétitives et sûres sont automatisées : santé, sauvegardes, contrôles d'intégrité, alertes, rotation de secrets, nettoyage selon les règles de conservation.
- **TECH-027.10** Les opérations destructives ou irréversibles disposent de protections spécifiques.
- **TECH-027.11** Les outils d'administration respectent les mêmes exigences de sécurité, de confidentialité et de supervision.
- **TECH-027.12** Les procédures sont documentées, pour que la continuité ne dépende pas d'une seule personne.
- **TECH-027.13** Les outils d'administration et d'orchestration sont choisis par l'architecture.

**Arbitrage M10-C04.** Les interventions techniques, y compris en incident, restent soumises au privilège minimal et à la traçabilité.

**Liens.**
- REV-02-A, CP-23 à CP-25.
- Lacunes : L08, L10, L13, L14.
- Recettes : REC-X09 à X11, REC-TECH27, REC-J10 à J13, REC-E10 à E13.

## TECH-028 — Disponibilité, SLO et SLA

**Décision.** **SLO initial de 99,9 % mensuel** pour les fonctions essentielles, après stabilisation. Les SLA contractuels sont définis plus tard.

**Exigences.**

- **TECH-028.1** Les SLI sont mesurés sur des opérations réellement utilisables (authentification, consultation autorisée, enregistrement et récupération), et non sur « serveur actif ».
- **TECH-028.2** **SLO : 99,9 % de disponibilité mensuelle** pour les fonctions essentielles côté serveur, après stabilisation. Le budget d'erreur est d'environ 43 min 12 s sur 30 jours.
- **TECH-028.3** Des objectifs adaptés sont fixés par catégorie :
  - **essentiels** (authentification, accès autorisé, Core, opérations principales) : 99,9 % ;
  - **importants** (recherche, synchronisation, exports) : objectifs spécifiques à définir ;
  - **différables** (OCR, transcription, IA) : priorité à la reprise fiable et au délai de traitement.
- **TECH-028.4** Performances, erreurs, retards de synchronisation et traitements asynchrones sont suivis séparément de la disponibilité.
- **TECH-028.5** Les SLO sont mesurés automatiquement (TECH-021).
- **TECH-028.6** Les **budgets d'erreur** orientent les priorités de fiabilisation.
- **TECH-028.7** Intégrité, confidentialité et durabilité ne sont jamais sacrifiées pour un indicateur de disponibilité. Le budget d'erreur ne donne aucun droit de perdre des données.
- **TECH-028.8** RPO/RTO (catastrophe) et SLO (qualité de service sur une période) sont distincts. Un RTO de 4 h n'autorise pas 4 h d'indisponibilité hebdomadaire.
- **TECH-028.9** Périodes de mesure, règles de calcul et exclusions sont documentées et publiées.
- **TECH-028.10** Les SLA contractuels dépendent de la maturité opérationnelle et des offres. On ne promet pas 99,99 % prématurément.
- **TECH-028.11** Les objectifs sont renforcés progressivement.
- **TECH-028.12** Ils sont réévalués à partir des mesures réelles.

**Liens.**
- Lacune : L16.
- Recette : REC-NF04.

## TECH-029 — Coûts, FinOps et quotas

**Décision.** **Accueillir des patrimoines exceptionnels sans que leur conservation devienne économiquement incontrôlable, ni que la maîtrise des coûts menace leur intégrité.**

**Exigences.**

- **TECH-029.1** GENIIUS adopte une démarche FinOps : mesurer, comprendre, maîtriser.
- **TECH-029.2** Les coûts sont distingués : calcul, stockage, transferts, sauvegardes, recherche, OCR, transcription, IA.
- **TECH-029.3** La consommation est attribuable à l'utilisateur, à l'espace, à l'organisation, au projet ou au traitement, sans exposer de données privées.
- **TECH-029.4** Des quotas et limites configurables existent, notamment pour le stockage et les traitements coûteux.
- **TECH-029.5** Les quotas sont transparents, progressifs et **non destructifs** : alerte avant la limite, consultation et export maintenus, limitation possible des nouveaux téléversements et traitements.
- **TECH-029.6** Un dépassement n'entraîne **jamais** la suppression automatique du patrimoine existant.
- **TECH-029.7** Les opérations critiques restent cohérentes lorsqu'une limite est atteinte. Aucune écriture critique n'est interrompue brutalement.
- **TECH-029.8** Les traitements lourds sont planifiables, priorisables, différables et limitables. La conservation des originaux est prioritaire ; extraction et indexation sont planifiées ; OCR, transcription et IA sont pilotables.
- **TECH-029.9** Les consommations inhabituelles déclenchent alertes et garde-fous.
- **TECH-029.10** Les services IA et autres services facturés à l'usage ont des contrôles de dépense spécifiques.
- **TECH-029.11** Les choix d'architecture considèrent le **coût total de possession** : infrastructure, stockage, transferts, sauvegardes, supervision, maintenance, licences, migration.
- **TECH-029.12** Des scénarios de croissance et de volumétrie sont établis pour le dimensionnement.
- **TECH-029.13** On optimise progressivement, sans compromettre les invariants.
- **TECH-029.14** La politique tarifaire commerciale est définie séparément.

**Liens.**
- Clarification : AUDIT-TECH-008.
- Lacune : L16.
- Recette : REC-NF08.

## TECH-030 — Vulnérabilités, incidents de sécurité et réponse aux attaques

**Décision.** GENIIUS doit protéger le patrimoine, détecter une compromission, en limiter les conséquences et **démontrer ce qui a — ou n'a pas — été altéré**.

**Exigences.**

- **TECH-030.1** Les vulnérabilités sont gérées en continu : code, dépendances, composants, infrastructure.
- **TECH-030.2** Un inventaire traçable recense les composants logiciels et leurs versions (SBOM ou équivalent).
- **TECH-030.3** Des analyses de sécurité automatisées sont intégrées au développement et au déploiement.
- **TECH-030.4** Les **fichiers importés sont non fiables par défaut**. Ils suivent la chaîne : réception → contrôles de taille, format et intégrité → zone de traitement isolée → analyse et extraction à permissions limitées → qualification → intégration. Une **quarantaine technique** est compatible avec les obligations de conservation, de confidentialité et de suppression.
- **TECH-030.5** Des protections couvrent les abus : tentatives d'authentification, requêtes excessives, épuisement des ressources.
- **TECH-030.6** Les événements de sécurité sont surveillés et les comportements anormaux détectés, dans le respect de la confidentialité. Exemple : consultation anormale de nombreux documents privés.
- **TECH-030.7** Une procédure de réponse aux incidents est documentée : détection et qualification → confinement → préservation des preuves → correction → rétablissement → notification et amélioration.
- **TECH-030.8** Les preuves techniques sont préservées avec un accès contrôlé.
- **TECH-030.9** **L'intégrité scientifique et patrimoniale est vérifiée** après tout incident susceptible d'avoir altéré des données. Incident technique et incident scientifique sont distingués. La remise en service ne masque pas une altération.
- **TECH-030.10** Les accès compromis sont révoqués et les secrets tournés. Les comptes privilégiés ont des contrôles renforcés (MFA, alertes de connexions suspectes, réauthentification).
- **TECH-030.11** Les vulnérabilités sont classées et corrigées dans des délais proportionnés : gravité, exploitabilité, exposition, sensibilité, exploitation active, mitigation.
- **TECH-030.12** Des tests de sécurité réguliers sont complétés par des audits indépendants ou tests d'intrusion selon le risque. Les évolutions touchant authentification, autorisations, imports ou exposition publique reçoivent une attention renforcée.
- **TECH-030.13** Les notifications légales sont gérées, notamment en cas de violation de données personnelles (RGPD).
- **TECH-030.14** Un retour d'expérience systématique suit les incidents significatifs.
- **TECH-030.15** Les outils et procédures détaillées sont choisis par l'architecture et l'exploitation, sans affaiblir ces exigences.

**Liens.** Recette : REC-TECH30.

## TECH-031 — Évolution du modèle et migrations scientifiques

**Décision.** **GENIIUS améliore sa représentation de l'histoire sans réécrire rétroactivement ce que les chercheurs avaient affirmé.**

**Exigences.**

- **TECH-031.1** Trois types d'évolution sont distingués :
  - **technique** (index, stockage) ;
  - **structurelle** (entité, association, attribut, contrainte) ;
  - **sémantique** (sens d'un concept, d'un prédicat, d'une classification).

  Plus le sens est touché, plus les contrôles sont exigeants.
- **TECH-031.2** Le **référentiel scientifique** est versionné indépendamment de la version logicielle et de la version du schéma.
- **TECH-031.3** On peut identifier la définition en vigueur lors de la création d'une contribution, la définition actuelle, leurs correspondances et les transformations effectuées.
- **TECH-031.4** Aucune réinterprétation scientifique silencieuse.
- **TECH-031.5** Des correspondances existent entre anciennes et nouvelles définitions.
- **TECH-031.6** Les correspondances ambiguës sont traitées explicitement : ancienne classification conservée, signalement pour réconciliation ou représentation compatible documentée. On ne fabrique jamais de certitude.
- **TECH-031.7** Les migrations sont non destructives, traçables et contrôlables. Processus : inventaire → analyse des correspondances → simulation sur corpus représentatif → transformation tracée → contrôles et rapport → activation.
- **TECH-031.8** Les transformations sont testées sur des corpus représentatifs avant application générale.
- **TECH-031.9** Identifiants, versions, sources, raisonnements et provenances sont préservés.
- **TECH-031.10** Un **rapport de migration** est produit : objets, transformations, ambiguïtés, échecs, contrôles.
- **TECH-031.11** La compatibilité est maîtrisée avec les clients hors ligne, même après une longue déconnexion : synchronisation compatible, conversion contrôlée, mise à jour préalable ou mise en attente sécurisée.
- **TECH-031.12** Aucune contribution locale non synchronisée n'est perdue à cause d'une évolution du modèle.
- **TECH-031.13** Des procédures de reprise existent pour une migration interrompue ou partiellement échouée.
- **TECH-031.14** Les exports patrimoniaux identifient les versions de référentiel nécessaires à leur interprétation.
- **TECH-031.15** Les changements sémantiques importants sont soumis à une **validation scientifique explicite**, distincte de la validation technique.
- **TECH-031.16** GENIIUS sait expliquer un changement. Exemple : « Cette assertion a été créée sous la version 2 du référentiel ; sa catégorie a été remplacée en version 4 ; aucune réinterprétation automatique n'a été effectuée. »

**Arbitrage M10-C05.** Une évolution des référentiels ne réécrit pas silencieusement les interprétations établies sous une version antérieure.

**Liens.**
- Clarifications : AUDIT-TECH-003, 014 ; REV-02-E, F.
- Lacunes : L01, L02, L04 à L07, L09.
- Recettes : REC-TECH31, REC-I04 à I07, REC-S04 à S11, REC-X07, REC-X12.

## TECH-032 — Gouvernance technique, ADR et critères de recette

**Décision.** **Ce que GENIIUS doit garantir** est défini dans le CDC. **Comment** est défini dans l'architecture. **Comment on le vérifie** est défini dans les tests et la recette.

**Exigences.**

- **TECH-032.1** Toute décision d'architecture structurante est documentée dans un **ADR** (ou mécanisme équivalent).
- **TECH-032.2** Un ADR présente : contexte, solutions étudiées, décision, justification (intégrité, performances, coût, sécurité, compétences), conséquences (avantages, limites, risques, conditions de réexamen).
- **TECH-032.3** Les exigences sont traçables jusqu'aux ADR, implémentations et tests (matrice exigence → décision → vérification).
- **TECH-032.4** Les exigences critiques ont des critères de recette explicites et vérifiables : conditions de test, résultats attendus, preuves.
- **TECH-032.5** Les objectifs quantitatifs précisent leurs conditions de mesure.
- **TECH-032.6** Invariants scientifiques, confidentialité et absence de perte silencieuse ne sont jamais contournés par une décision technique ordinaire.
- **TECH-032.7** Les dérogations sont documentées : risque, mesures compensatoires, responsable, date de réexamen. Elles sont limitées, justifiées et réexaminées. Certaines garanties fondamentales n'admettent **aucune dérogation de mise en production**. Typologie : exigence impérative / exigence mesurable avec objectif / capacité évolutive.
- **TECH-032.8** Toute évolution fait l'objet d'une analyse d'impact documentaire et technique : CDC → modèle → architecture → contrats API → tests → documentation.
- **TECH-032.9** Les décisions obsolètes restent consultables, avec leur historique et leur remplacement.
- **TECH-032.10** Chaque grande livraison passe une **recette technique documentée** : exigences critiques, tests automatisés, migrations, sécurité, performances, sauvegarde et restauration, compatibilité clients, anomalies connues.
- **TECH-032.11** Résultats de tests et anomalies connues sont associés aux versions.
- **TECH-032.12** Le CDC est la référence des exigences ; l'architecture décrit les solutions.
- **TECH-032.13** Les technologies sont évaluées à partir des exigences.
- **TECH-032.14** Une **matrice de conformité** suit l'état de chaque exigence : satisfaite, partiellement satisfaite, non satisfaite, non vérifiée.

**Arbitrage M10-C06.** Une décision MPD différée est recevable au gel si son périmètre, ses contraintes, ses critères de décision et son étape de résolution sont explicites.

**Liens.**
- Clarifications : AUDIT-TECH-015, 016 ; REV-03-B, C.
- Recette : REC-TECH32.

## TECH-033 — Internationalisation et préférences linguistiques

**Décision.** Plateforme **multilingue dès la V1**, avec une langue préférée persistante par utilisateur. **Traduire l'interface ne modifie jamais les sources ni les contributions.**

**Exigences.**

- **TECH-033.1** Plusieurs langues d'interface sont prises en charge dès la V1.
- **TECH-033.2** Chaque utilisateur a une langue préférée persistante dans son profil.
- **TECH-033.3** Il peut la changer dans les paramètres sans perdre son travail ni recréer de compte.
- **TECH-033.4** La préférence est partagée entre Web, Desktop et Mobile. Une préférence locale temporaire est possible hors ligne.
- **TECH-033.5** Pour un visiteur non connecté, la langue est proposée selon le navigateur et reste modifiable.
- **TECH-033.6** Le **français** est la langue initiale de référence.
- **TECH-033.7** Les autres langues livrées en V1 sont définies séparément. L'architecture ne suppose pas qu'il n'existe que deux langues.
- **TECH-033.8** Interface, notifications, erreurs et éléments d'accessibilité sont internationalisables.
- **TECH-033.9** Les formats de date, nombre et heure suivent les préférences régionales, sans altérer les valeurs stockées.
- **TECH-033.10** Les dates historiques incertaines conservent précision et signification dans toutes les langues.
- **TECH-033.11** Identifiants et définitions scientifiques sont indépendants des libellés traduits. Exemple : un prédicat de filiation a un identifiant stable et des libellés « est le père de », « is the father of », « es el padre de ».
- **TECH-033.12** Documents originaux et contributions ne sont jamais modifiés par un changement de langue.
- **TECH-033.13** Les traductions de contenus scientifiques sont distinguées des originaux et conservent leur provenance.
- **TECH-033.14** Une traduction manquante bascule sur une langue de repli définie, sans contenu trompeur.
- **TECH-033.15** Tests : changement de langue, Unicode, textes longs, dates historiques, cohérence entre plateformes.

**Langue par défaut.**
- Nouvel utilisateur : langue du navigateur ou du système si elle est disponible, sinon français.
- Utilisateur connecté : sa préférence prime.
- Changement manuel : enregistré et appliqué aux connexions suivantes.
- Hors ligne : dernière langue disponible sur l'appareil.

**Langues de travail.** Langue d'interface (traduisible), langue des documents (original préservé) et langue des contributions (texte original préservé) sont trois notions distinctes.

**Liens.**
- Clarification : AUDIT-TECH-011.
- Lacune : L16.
- Recette : REC-NF07.

---

# 4. Clarifications transversales AUDIT-TECH-001 à AUDIT-TECH-016

Ces seize clarifications résolvent les tensions entre exigences. Elles **complètent** les TECH sans en remettre en cause le principe. Toutes sont **validées**.

## AUDIT-TECH-001 — Droits d'accès hors connexion

**Tension.** TECH-002 (réplication locale) et TECH-011 (révocation). Aucune architecture ne peut effacer instantanément une copie sur un appareil totalement déconnecté.

**Politique retenue : différenciée selon la sensibilité (option C).**

1. Le fonctionnement hors connexion complet reste possible pour les données ordinaires que l'utilisateur est autorisé à répliquer.
2. Les propriétaires d'espaces sensibles peuvent imposer une politique plus restrictive : **durée maximale de consultation hors ligne**, voire **interdiction de réplication locale**, dans les limites définies par le Core.
3. Les révocations sont appliquées **dès la reconnexion**, avant toute nouvelle opération nécessitant les droits retirés.
4. Les contributions personnelles non synchronisées ne sont **jamais détruites automatiquement** lors d'une révocation. Elles sont isolées et traitées par une procédure sécurisée de réconciliation.
5. GENIIUS informe clairement les propriétaires que les copies déjà téléchargées ne peuvent pas être effacées instantanément sur un appareil déconnecté.
6. Le chiffrement et les contrôles locaux réduisent le risque, sans prétendre empêcher la conservation externe de données déjà consultées ou copiées.

Complète TECH-002, 003, 005, 011.

## AUDIT-TECH-002 — Immutabilité scientifique et droit à l'effacement

**Principe.** L'immutabilité technique ne se confond jamais avec un droit absolu de conservation. Le caractère collectif d'une contribution ne suffit pas non plus à justifier sa conservation.

| Catégorie | Traitement |
|---|---|
| Compte utilisateur | Suppression ou désactivation selon la demande et les obligations |
| Données personnelles privées | Effacement lorsque juridiquement requis |
| Documents originaux | Conservation ou suppression selon les droits et fondements |
| Assertions scientifiques | Examen du fondement de conservation et des données personnelles contenues |
| Historique des versions | Purge ou adaptation contrôlée si une suppression est nécessaire |
| Index, caches, dérivés | Suppression ou reconstruction |
| Sauvegardes | Rétention bornée et prévention de la réapparition |

**Procédure de décision**, et non suppression aveugle :
1. Identifier les données et les périmètres concernés.
2. Vérifier l'identité ou la qualité du demandeur.
3. Évaluer les fondements, obligations et exceptions.
4. Décider : effacer, restreindre, conserver de façon justifiée, ou autre mesure.
5. Exécuter sur les données principales et leurs dérivés.
6. Vérifier la propagation.
7. Informer le demandeur.

**Clarifications.**

1. L'immutabilité scientifique est une garantie d'intégrité, pas une interdiction absolue de suppression.
2. Les droits et obligations légaux prévalent sur l'historisation ordinaire.
3. Chaque catégorie de données dispose de règles explicites de conservation, de restriction et de suppression.
4. Chaque demande d'effacement fait l'objet d'une évaluation juridique contextualisée, sans suppression ni refus systématique.
5. Le mécanisme de **purge contrôlée** est distinct des opérations scientifiques ordinaires.
6. Il traite les données courantes, historiques, indexées, en cache et dérivées.
7. Les répliques locales reçoivent les instructions de suppression ou de restriction dès qu'elles communiquent.
8. Les limites d'effacement des copies déconnectées ou sorties de GENIIUS sont documentées. L'obligation éventuelle d'informer les destinataires est examinée.
9. Les sauvegardes suivent une rétention définie et un **registre sécurisé des suppressions à réappliquer après restauration**, qui empêche la résurrection.
10. Une trace minimale de l'opération (« une suppression a été effectuée le …, dans le cadre d'une procédure autorisée ») n'est conservée que si elle a un fondement légitime et respecte la minimisation. Elle ne conserve ni le contenu ni de quoi le reconstituer.
11. Suppression d'un compte et suppression des contributions collectives sont évaluées séparément.
12. Les procédures sont auditables, testables, compatibles avec TECH-020, et ne permettent pas de reconstituer les données effacées.
13. Les cas complexes peuvent être soumis à une validation juridique avant exécution.
14. Aucune transformation ne masque une suppression ni ne laisse croire qu'une donnée reste scientifiquement disponible.

**Distinction.** L'historique scientifique (comprendre l'évolution des connaissances) et le journal d'audit juridique et technique (démontrer qu'une suppression a eu lieu) sont deux mécanismes distincts, avec des règles de conservation propres.

## AUDIT-TECH-003 — Synchronisation et évolution du référentiel scientifique

**Cas.** Un Desktop resté sous référentiel V2 pendant des mois se reconnecte à un Cloud passé en V3.

**Politique retenue : synchronisation avec négociation de compatibilité (option C).**

Le protocole se déroule en six étapes :
1. **Identification** : le client annonce ses versions logicielle, structurelle et scientifique.
2. **Contrôle de compatibilité.**
3. **Transfert** sans perte des métadonnées d'origine.
4. **Validation** par le Core : droits, versions, contraintes, provenance.
5. **Intégration ou mise en attente.**
6. **Confirmation** détaillée par ensemble de contributions.

| Situation d'une contribution V2 | Comportement |
|---|---|
| Définition inchangée | Intégration normale après validation |
| Transformation certaine et documentée | Conversion contrôlée, signification initiale conservée |
| Transformation ambiguë (catégorie scindée en deux) | **Mise en attente de réconciliation**, sans choix arbitraire |

**Clarifications.**

1. Toute contribution synchronisable reste interprétable dans son contexte de création : versions du modèle et du référentiel.
2. Le protocole négocie la compatibilité entre client, serveur, schéma et référentiel.
3. Une conversion automatique n'est autorisée que si elle préserve le sens de façon **déterministe et vérifiable**.
4. Aucune transformation ambiguë n'est résolue par supposition.
5. Une **zone sécurisée de réconciliation** conserve les contributions incompatibles ou ambiguës. Elle est distincte des connaissances intégrées au Core.
6. Cette zone préserve contenu, provenance et versions, sous réserve des obligations légales. Elle ne contourne pas les droits et n'est pas une conservation indéfinie injustifiée.
7. **Reçue ≠ intégrée ≠ validée scientifiquement** : ces états sont distincts.
8. Les autorisations sont **réévaluées au moment de l'intégration serveur**, et non à la date de création locale.
9. Les contributions refusées pour des raisons de droits sont isolées, sans divulgation ni publication.
10. Une mise à jour applicative ne supprime jamais une contribution locale non synchronisée.
11. Les migrations scientifiques peuvent être progressives : coexistence contrôlée de versions de définitions, correspondances documentées, conversions différées, contrôles d'intégrité.
12. Les résultats de synchronisation sont explicites : intégrées, transformées, en attente, refusées, en erreur. Exemple : « 9 800 intégrées / 200 en attente / 0 perdue ».
13. Les traitements sont idempotents et reprenables.
14. Des tests couvrent : longues déconnexions, changements de référentiel, droits révoqués, conversions ambiguës.
15. Le protocole et les structures de réconciliation sont choisis par l'architecture.

## AUDIT-TECH-004 — Confidentialité et données dérivées

**Cas.** Jeanne est publique ; son fils Joseph est protégé. Les messages « Jeanne a trois enfants dont un masqué », « 3 résultats, 2 affichés » ou une concentration suspecte dans Atlas sont autant de fuites.

**Ordre de traitement imposé :** contexte d'accès → construction du graphe accessible → exécution de l'opération → résultat limité aux informations autorisées.

**Clarifications.**

1. Toutes les données dérivées respectent les autorisations applicables aux informations dont elles proviennent.
2. Recherche, traversée, agrégation, statistique, suggestion, export et IA sont calculés sur le périmètre autorisé.
3. L'existence d'un objet protégé n'est révélée ni par compteur, ni par message, ni par facette, ni par suggestion, ni par résultat.
4. Les index ne constituent jamais une autorité de permissions. L'indexation peut être globale techniquement, mais chaque consultation est filtrée.
5. Un changement de droits rend inaccessibles les résultats dérivés concernés **avant même leur reconstruction**.
6. Les caches sont isolés ou contrôlés selon le contexte d'autorisation : clés incluant le contexte et la version des permissions. Exemple à éviter : un cache alimenté par un administrateur puis servi à un utilisateur non autorisé.
7. Aucune donnée sensible n'est partagée entre contextes de sécurité incompatibles.
8. Les statistiques intègrent des protections contre les petits effectifs **et contre les recoupements**.
9. Les seuils et mécanismes statistiques sont définis au MPD (MPD-03) et testés.
10. Les données fournies aux modèles IA sont **filtrées avant transmission**, et non seulement à la présentation de la réponse.
11. Résultats, mémoires et caches IA respectent les mêmes restrictions.
12. Les journaux techniques minimisent les informations personnelles et scientifiques. Exemple à éviter : « Accès refusé à Joseph, né le 12 juin 1843 ».
13. Les tests couvrent les fuites indirectes : comparaison de requêtes, autocomplétion, agrégation, réutilisation de caches.
14. Si la confidentialité d'un calcul ne peut pas être garantie, GENIIUS **refuse ou restreint** l'opération.
15. Les mécanismes d'indexation, de filtrage, de cache et de protection statistique sont choisis par l'architecture et le MPD.

## AUDIT-TECH-005 — Importations, doublons et intégrité scientifique

| Type de doublon | Exemple | Traitement |
|---|---|---|
| Binaire | Deux PDF strictement identiques | Mutualisation technique possible |
| Documentaire | Deux numérisations d'un même acte | Rapprochement documentaire à examiner |
| De représentation | Une même personne dans deux bases | Proposition de réconciliation |
| D'importation | Même lot importé deux fois | Détection et traitement idempotent |

**Clarifications.**

1. Doublons binaires, documentaires, scientifiques et réimportations sont distingués explicitement.
2. Une déduplication de fichiers n'entraîne jamais une fusion d'objets scientifiques.
3. Chaque import conserve un **manifeste** : origine déclarée, format et version, identifiants d'origine, fichiers et empreintes, date et contexte, transformations, erreurs et avertissements, correspondances avec les objets GENIIUS.
4. Les identifiants d'origine sont conservés lorsqu'ils existent et sont exploitables.
5. **Acquisition**, **transformation technique** et **réconciliation scientifique** restent trois opérations distinctes.
6. Un rapprochement automatique (algorithme ou IA) n'est pas une identification validée.
7. Les imports sont reprenables, rejouables et idempotents.
8. Les erreurs sont isolées sans compromettre les éléments correctement traités. Exemple : 20 000 actes valides, 300 illisibles, 40 corrompus, 15 ambiguïtés.
9. Un import partiel est identifié comme tel, avec un rapport : intégrés, rejetés, en attente. Il n'est jamais présenté comme intégralement validé.
10. Une réimportation détecte ses correspondances avec les lots précédents.
11. Le retrait ou la correction d'un import respecte les dépendances et les contributions ultérieures. On distingue :
    - annuler un traitement technique non finalisé ;
    - retirer des contributions importées (opération contrôlée) ;
    - annuler une réconciliation (nouvelle opération scientifique tracée).
12. Aucune annulation d'import ne supprime silencieusement des enrichissements indépendants.
13. Les originaux et données sources restent préservés.
14. Les tests portent sur des corpus massifs, hétérogènes, incomplets et volontairement défectueux.
15. Rapprochement, staging, manifestes et reprise sont définis par l'architecture et le MPD.

## AUDIT-TECH-006 — Cohérence des sauvegardes base ↔ fichiers

**Cas.** Base restaurée à 02 h 00, fichiers restaurés à 01 h 45 : la base référence un document importé à 01 h 55 qui n'existe plus.

**Politique retenue : cohérence transactionnelle et restauration vérifiée (option C).**

**Protocole d'écriture :**
1. réception en zone contrôlée ;
2. vérification de l'empreinte ;
3. **conservation confirmée** ;
4. validation en base ;
5. publication pour les opérations scientifiques.

**Clarifications.**

1. La cohérence base ↔ fichiers est une exigence patrimoniale critique.
2. Une référence documentaire n'est exploitable scientifiquement qu'une fois la conservation de son fichier confirmée.
3. Les écritures base ↔ stockage suivent un protocole contrôlé, reprenable et résistant aux interruptions.
4. Fichiers non référencés et références incomplètes sont détectés et traités **sans suppression aveugle**. Un orphelin peut être une opération en cours ou un original à récupérer.
5. Les sauvegardes permettent de restaurer un état cohérent.
6. La restauration vérifie empreintes, références, versions, dépendances, tâches en cours et suppressions légales.
7. Une restauration n'est pas réussie du seul fait que le service redémarre.
8. Les traitements interrompus sont repris ou réconciliés sans duplication.
9. Trois états sont distingués : document **temporairement inaccessible**, **manquant après contrôle**, **supprimé par procédure autorisée**.
10. Aucun original manquant n'est remplacé silencieusement. Une copie récupérée est vérifiée et sa provenance documentée.
11. Les suppressions légales sont réappliquées ou préservées après restauration (AUDIT-TECH-002).
12. Le RTO n'est atteint que sur un patrimoine **cohérent et exploitable**.
13. Les garanties de récupération des fichiers binaires sont définies explicitement, indépendamment du RPO des données structurées.
14. Des exercices réguliers de restauration complète ont lieu en environnement isolé, et leurs résultats sont consignés.
15. Les mécanismes concrets sont choisis par l'architecture.

> Une base restaurée sans ses sources documentaires n'est pas un patrimoine correctement restauré.

## AUDIT-TECH-007 — Portabilité et fidélité scientifique des exports

| Niveau | Contenu | Objectif |
|---|---|---|
| 1 — Consultation | PDF, tableaux, arbres, rapports | Communiquer |
| 2 — Interopérabilité | GEDCOM et formats d'échange | Transférer le représentable |
| 3 — **Patrimoine complet** (critique) | Paquet structuré, documenté, vérifiable | Conserver et transmettre indépendamment de GENIIUS |

**Contenu du paquet patrimonial :**
- connaissances : personnes, événements, relations, assertions, raisonnements, conclusions ;
- provenance : sources, mentions, références, liens justificatifs ;
- historique : versions, états, filiations ;
- documents : originaux autorisés, dérivés utiles, empreintes ;
- sémantique : définitions, prédicats, référentiels utilisés ;
- métadonnées ;
- intégrité : manifeste, inventaire, contrôles.

**Clarifications.**

1. Les trois catégories d'export sont distinguées.
2. Un export de niveau 1 ou 2 n'est jamais présenté comme une sauvegarde patrimoniale complète.
3. Le paquet complet est documenté, vérifiable et interprétable **sans le service GENIIUS**.
4. Il préserve objets, relations, versions et provenances dans le périmètre autorisé.
5. Il inclut les originaux autorisés, avec empreintes et métadonnées.
6. Incertitudes et distinctions assertion / raisonnement / conclusion sont conservées. Exemple : « née entre 1778 et 1782, estimation fondée sur un acte de décès » ne devient pas « née le 1er janvier 1780 ».
7. Il est accompagné des définitions et versions de référentiel nécessaires.
8. Identifiants d'origine et correspondances sont préservés. On distingue l'identifiant d'origine, l'identifiant de destination et leur correspondance.
9. Formats et versions sont documentés explicitement.
10. Des manifestes vérifient la complétude et l'intégrité.
11. Des **tests de reconstruction indépendants** sont menés : exporter → vérifier → interpréter → reconstruire → comparer. On vérifie la reconstruction de la connaissance, pas seulement l'ouverture des fichiers.
12. Une évolution du format patrimonial n'empêche pas d'interpréter les anciennes générations d'export.
13. Droits, restrictions légales et confidentialité s'appliquent à la constitution du paquet. Les manifestes ne révèlent pas d'objets interdits. L'utilisateur est informé de la perte de contrôle après remise à un tiers.
14. Les exports volumineux sont reprenables et produisent un rapport.
15. Formats, schémas et mécanismes sont choisis par l'architecture.

## AUDIT-TECH-008 — Performance, volumétrie et maîtrise des coûts

**Clarifications.**

1. Opérations **interactives**, traitements **lourds** et traitements **facultatifs** sont distingués explicitement.
2. Les opérations interactives essentielles disposent de ressources prioritaires.
3. Les traitements lourds sont asynchrones, contrôlés et reprenables.
4. Des **budgets techniques** sont définis par catégorie : temps interactif maximal avant bascule asynchrone, traitements lourds simultanés, mémoire par tâche, capacité réservée aux fonctions essentielles, débits d'import et d'export. Ces budgets sont configurables et mesurés. Ils ne limitent pas la quantité de connaissance conservable.
5. La conservation fiable des contributions prime sur les traitements de confort (miniatures, IA facultative). Si l'intégrité ne peut pas être garantie, l'écriture est refusée proprement.
6. La limitation de charge ne compromet ni l'intégrité ni la sécurité.
7. Caches, index et résultats pré-calculés respectent AUDIT-TECH-004. Un compteur global pré-calculé incluant des personnes protégées est interdit.
8. Un quota n'entraîne jamais la suppression automatique d'un patrimoine existant.
9. Les dépassements sont signalés, avec des possibilités de régularisation.
10. Les opérations facultatives coûteuses sont estimables, différables, plafonnables ou soumises à confirmation. L'utilisateur ne découvre pas la consommation après coup.
11. Les catégories de coûts sont mesurables : base, documents, transferts, traitements, OCR et transcription, IA.
12. Les coûts sont attribuables sans compromettre la confidentialité.
13. **La récupération autorisée du patrimoine reste possible**, y compris en dépassement de quota ou en fin d'abonnement, sous réserve des conditions contractuelles et légales.
14. Les tests de performance couvrent les profils individuel, expert et associatif, avec mesure de leur coût. Dimensions testées : taille, simultanéité, profondeur des graphes, documents, imports et exports, synchronisation après des mois hors ligne, concurrence interactif / lourd.
15. Seuils, quotas et priorités sont fixés par l'architecture et le dimensionnement économique.

## AUDIT-TECH-009 — Isolation des projets, organisations et espaces

**Distinction centrale :**
- **identité scientifique** : objets, mentions, assertions, identifications ;
- **rattachement organisationnel** : espaces de production et de gestion ;
- **autorisations** : droits effectifs.

Le Core est commun, **sans visibilité universelle**.

**Politique retenue : isolation logique forte, contrôlée à plusieurs niveaux (option C).** Aucune organisation physique n'est imposée à ce stade ; une isolation physique renforcée reste possible pour certains contextes institutionnels.

**Clarifications.**

1. Objets scientifiques, espaces, appartenances et autorisations sont distingués explicitement.
2. Le Core commun n'entraîne pas de visibilité universelle.
3. Chaque opération s'exécute dans un **contexte d'autorisation** déterminé.
4. Les droits dans un espace ne confèrent aucun droit implicite dans un autre. Être administrateur ici ne rend pas administrateur ailleurs.
5. L'isolation est appliquée à plusieurs niveaux : Core, API, accès aux données, traitements asynchrones. Ces derniers conservent et réévaluent leur contexte, sans privilège global implicite.
6. Index, caches, statistiques, notifications et exports respectent les frontières.
7. Une relation scientifique entre projets ne crée pas de permission.
8. **Partager un accès**, **référencer**, **copier** et **transférer** sont des opérations distinctes, aux règles explicites.
9. Les opérations entre projets préservent provenance et responsabilités.
10. Les changements d'appartenance et les révocations sont pris en compte par les opérations en cours et futures.
11. Le départ d'un membre ne supprime pas automatiquement les contributions collectives.
12. Les espaces organisationnels ont des procédures de continuité : retrait des accès, transfert d'administration, transmission ou export, archivage, suppression justifiée. La conservation ne dépend pas d'un seul compte.
13. Suppressions et transferts respectent les droits des personnes et les obligations légales.
14. Des **tests adversariaux** couvrent : multi-appartenance, identifiant d'un objet d'un autre espace dans une requête, export avec liens entre projets, cache alimenté par un administrateur, tâche lancée avant une révocation, recherche traversant plusieurs espaces, changement de propriétaire.
15. Le choix entre isolation logique et isolation physique renforcée relève de l'architecture.

## AUDIT-TECH-010 — Identifiants pérennes, fusions et suppressions

**Distinction.** L'**identifiant technique** désigne un objet précis ; il est stable et jamais réattribué. L'**identification scientifique** est une conclusion révisable.

**Politique retenue : identifiants stables et résolution historisée (option C).**

| Situation | Résolution d'un identifiant public |
|---|---|
| Objet actif | Consultation de l'objet autorisé |
| Objet rapproché d'un autre | Information ou redirection contrôlée vers la représentation actuelle |
| Identification contestée | Présentation du statut scientifique |
| Objet retiré | Notice de retrait si sa divulgation est autorisée |
| Objet protégé | Réponse ne révélant pas son existence |
| Objet légalement effacé | Aucune information contraire à l'obligation d'effacement |

**Clarifications.**

1. Tout objet a une identité technique stable, distincte des conclusions qui le concernent.
2. Un identifiant n'est jamais réattribué.
3. Rapprochements, identifications, fusions logiques et séparations sont des opérations explicites et tracées.
4. Une fusion scientifique ne détruit pas les représentations ni les provenances initiales.
5. Une identification peut être réexaminée. Exemple : fusion de 2030 invalidée en 2035, avec conservation des deux représentations, de la décision, de ses arguments et de la remise en cause.
6. Les anciennes références restent interprétables dans la limite des droits et obligations.
7. La résolution distingue objets actifs, rapprochés, contestés, retirés et protégés.
8. Une redirection ne masque pas un changement de signification scientifique.
9. Les tombstones suivent les mêmes règles de confidentialité et d'effacement. Ils ne sont pas systématiquement publics.
10. Un effacement légal peut imposer la suppression d'informations de résolution.
11. API et exports préservent identifiants, statuts, correspondances et versions autorisés. Une API ne présente pas un identifiant remplacé comme ayant toujours désigné le nouvel objet.
12. Les identifiants techniques ne dépendent pas de l'infrastructure : nom de serveur, adresse physique, numéro de ligne, emplacement de fichier.
13. Les identifiants publics restent résolubles malgré les migrations d'infrastructure.
14. Les tests couvrent fusions, séparations, retraits, changements de droits, exports et réimports.
15. Le mécanisme d'identifiant public pérenne (URI persistantes, ARK : CP-17, OB-11) est choisi par l'architecture.

## AUDIT-TECH-011 — Langues, recherche et noms historiques

**Distinction.** **Recherche multilingue** (retrouver malgré les graphies : Mohammed, Mohamed, Muhammad, Mahomed) ≠ **identification scientifique** (établir avec preuves qu'il s'agit d'une même personne).

**Quatre représentations non interchangeables :** forme originale, transcription, translittération (méthode identifiable), traduction.

**Clarifications.**

1. La langue d'interface est indépendante de la langue des données.
2. Plusieurs langues et écritures Unicode sont conservées (arabe, tamoul, devanagari…).
3. Les formes originales des noms, lieux et textes historiques sont préservées. Aucune conversion permanente vers le latin n'est imposée.
4. Transcriptions, translittérations et traductions sont distinguées et reliées à leur origine et à leur méthode.
5. Les variantes améliorent la recherche sans provoquer d'identification automatique.
6. Les noms alternatifs et historiques sont représentés avec leur contexte et, si possible, leur période d'usage.
7. La recherche utilise des mécanismes adaptés aux langues et écritures prises en charge.
8. Les résultats distinguent correspondances exactes et rapprochements approximatifs (« variante à examiner »).
9. Les fonctions linguistiques respectent le graphe accessible.
10. Les traductions automatiques sont identifiables et ne remplacent pas les originaux.
11. Les référentiels conservent des identifiants indépendants des libellés.
12. Les exports préservent langues, écritures, formes originales et métadonnées linguistiques.
13. Les capacités sont documentées **par langue**, sans promettre une qualité équivalente non démontrée. Le français est la première référence.
14. Les tests couvrent accents, variantes, translittérations, écritures non latines et ambiguïtés.
15. Moteurs et dictionnaires linguistiques sont choisis par l'architecture.

## AUDIT-TECH-012 — Pérennité des formats et conservation numérique

**Quatre dimensions :** intégrité, disponibilité, **lisibilité**, authenticité et provenance.

**Politique retenue : préservation des originaux + migrations documentées (option C).** Exemple : Word original conservé, PDF de consultation et texte extrait, chacun clairement identifié.

**Clarifications.**

1. La conservation couvre intégrité, disponibilité, lisibilité et provenance.
2. Les originaux sont conservés sans modification, sous réserve des obligations légales.
3. Conversions et représentations de consultation restent distinctes des originaux.
4. Une migration de format ne remplace jamais silencieusement la source.
5. Un **inventaire des formats** suit leur niveau de prise en charge : pris en charge, partiellement interprété, non interprété mais conservé, à risque, à migrer.
6. Les formats à risque d'obsolescence sont identifiables.
7. Les conversions conservent : source, outil et version, date, formats d'entrée et de sortie, empreintes, anomalies, statut de validation.
8. Les pertes d'information détectables sont signalées.
9. Les migrations documentaires massives sont asynchrones, contrôlées et reprenables.
10. Des **contrôles périodiques d'intégrité** détectent les altérations.
11. Un fichier corrompu n'est jamais présenté comme un original intact. La réparation suit : détection → blocage de la présentation → recherche d'une copie saine → vérification → restauration ou signalement.
12. Réparations et restaurations sont vérifiées et tracées.
13. Les métadonnées de conservation (nom et chemin d'origine, format, taille, empreinte, contexte d'acquisition, métadonnées techniques, relations, historique de transformation) sont préservées et exportables.
14. Les tests couvrent formats anciens, conversions imparfaites, fichiers corrompus, migrations successives.
15. Formats de préservation, outils et fréquence des contrôles relèvent de l'architecture et de la politique de conservation.

## AUDIT-TECH-013 — Comptes, récupération d'accès et continuité patrimoniale

**Trois situations distinctes :** perte d'accès, indisponibilité durable, décès ou succession.

| Élément | Traitement |
|---|---|
| Identifiants et moyens de connexion | Révocation ou suppression |
| Données personnelles du compte | Politique RGPD |
| Contributions personnelles | Analyse des droits et obligations |
| Contributions collectives | Maintien ou traitement selon les droits de l'organisation |
| Historique d'attribution | Conservation limitée à ce qui est justifié et légal |

**Clarifications.**

1. Récupération de compte, délégation de droits et transmission de patrimoine sont distinguées.
2. La récupération est **graduée selon le risque**.
3. Le support ne peut pas contourner librement l'authentification. Un simple appel (« j'ai perdu mon téléphone et mon email ») ne suffit pas.
4. Les procédures exceptionnelles sont contrôlées, justifiées et auditées : vérification d'identité ou d'autorité, validation renforcée, notification, possibilité de contestation ou de suspension.
5. Une transmission ne nécessite **jamais d'usurper l'identité** de l'auteur. Le successeur agit sous sa propre identité.
6. L'attribution historique des contributions est préservée.
7. Les projets collectifs disposent de mécanismes de continuité : plusieurs administrateurs, délégation, remplacement.
8. L'indisponibilité d'un administrateur ne bloque pas définitivement une organisation légitime.
9. L'administration d'un espace est distincte de la propriété du compte personnel.
10. GENIIUS peut représenter des **instructions de transmission patrimoniale**, sous réserve de leur validité juridique et des droits des tiers.
11. Aucune transmission ne donne automatiquement accès à toutes les données privées du titulaire.
12. Comptes, contributions personnelles et patrimoines collectifs ont des cycles de vie distincts.
13. Le RGPD et les décisions de conservation sont respectés.
14. Les tests couvrent perte de moyens d'authentification, fraude à la récupération, départ d'un administrateur, transferts.
15. Les mécanismes et procédures juridiques sont définis progressivement. En V1, on prévoit le modèle et les procédures de base, sans système successoral entièrement automatisé.

## AUDIT-TECH-014 — Traçabilité des modifications et responsabilité scientifique

| Responsabilité | Signification |
|---|---|
| Auteur | Personne ou processus à l'origine d'une contribution |
| Modificateur | Acteur ayant proposé ou réalisé une évolution |
| Validateur | Acteur autorisé ayant approuvé une opération ou une conclusion |
| Responsable administratif | Acteur chargé de la gestion d'un espace ou de ses droits |

**Trois mécanismes distincts**, reliés par des identifiants de corrélation :
- **historique scientifique** : patrimoine ;
- **journal d'audit de sécurité** : accès strictement contrôlé ;
- **journaux d'exploitation** : minimisés, rétention courte.

**Clarifications.**

1. Auteur, modificateur, validateur et administrateur sont distingués.
2. Les opérations scientifiques significatives sont tracées : acteur ou processus, nature, date, objet, version précédente, nouvelle version, justification, sources et décisions, résultat. La traçabilité est proportionnée : une préférence d'affichage n'est pas une fusion d'identités.
3. Les modifications préservent ce qui permet de comprendre l'évolution scientifique.
4. Une validation scientifique est distincte de la réalisation technique d'une modification.
5. Les contributions contradictoires coexistent.
6. La résolution d'un conflit est une **nouvelle opération tracée** qui n'efface pas les contributions concurrentes.
7. Les productions automatisées sont attribuées aux outils ou processus concernés.
8. Corrections humaines et validations de ces productions sont identifiables séparément. Une proposition IA n'est jamais attribuée comme une découverte humaine validée.
9. Historique scientifique, audit de sécurité et journaux d'exploitation restent distincts.
10. Les opérations administratives sensibles sont auditables, sans conférer d'autorité scientifique.
11. Les historiques respectent les autorisations.
12. La traçabilité est soumise aux politiques de conservation et d'effacement légal. Une purge peut imposer de supprimer ou de rendre non identifiantes certaines informations historiques.
13. Les exports patrimoniaux préservent les historiques scientifiques autorisés.
14. Les tests couvrent corrections, contestations, validations, conflits hors ligne et contributions automatisées.
15. Structures d'historisation, audit et rétention sont définis par l'architecture et le MPD.

**Exemple.** Lecture « 1841 » corrigée en « 1847 » : la lecture précédente, sa correction et sa justification restent intelligibles, et leur visibilité dépend des droits.

## AUDIT-TECH-015 — Critères d'acceptation et exigences vérifiables

| Niveau | Exemple |
|---|---|
| Exigence | Aucune contribution locale non synchronisée n'est perdue automatiquement |
| Critère d'acceptation | Après interruption et reprise, toutes les contributions sont intégrées ou conservées dans un état récupérable |
| Test | Simuler l'interruption, redémarrer, vérifier chaque contribution |

**Clarifications.**

1. Toute exigence critique a un critère d'acceptation vérifiable.
2. Les identifiants sont stables et reliés aux ADR, implémentations et tests.
3. Les exigences sont classées P0, P1 ou P2 (§ 0.3).
4. Une violation P0 n'est jamais une dette technique ordinaire.
5. Les critères décrivent des résultats observables, sans imposer de solution.
6. Performance et disponibilité sont accompagnées de conditions de mesure : corpus, concurrence, matériel, réseau, période, exclusions.
7. Les tests couvrent les parcours nominaux, les erreurs, les conflits et les situations exceptionnelles.
8. Les invariants scientifiques sont testés à chaque frontière technique pertinente. Exemples : assertion sans source alors que son type en exige une ; date incertaine après import, synchronisation, API et export ; fusion qui conserve les décisions antérieures.
9. La confidentialité est testée sur les fuites indirectes et les changements de permissions.
10. La synchronisation est testée après interruptions, incompatibilités et longues déconnexions.
11. La conservation est vérifiée par contrôles d'intégrité et exercices de restauration.
12. Les exports patrimoniaux passent des tests de reconstruction indépendants.
13. Les paramètres non dimensionnés sont inscrits dans un registre (§ 9).
14. Pas d'exigence satisfaite **sans preuve** : résultat automatisé, rapport de restauration, test de sécurité, procès-verbal. L'affirmation d'un développeur ne suffit pas.
15. La validation d'une version produit un **bilan de conformité** : satisfaites, non satisfaites, non applicables.

## AUDIT-TECH-016 — Exigences ouvertes et conditions de gel

**Trois types de décision :**
- **arrêtée** : figée, s'impose à l'architecture ;
- **volontairement différée** : plusieurs solutions restent possibles dans le respect des exigences ;
- **lacune bloquante** : à résoudre avant le gel.

Une décision différée n'est pas une lacune.

**Règles.**

1. Toute décision différée est inscrite au registre des points ouverts (§ 9).
2. Chaque point a un identifiant, une description, une justification et une étape cible.
3. Décisions arrêtées, décisions différées et lacunes bloquantes sont distinguées.
4. Une décision différée n'est pas une exigence abandonnée.
5. Aucune lacune P0 non résolue n'est acceptée au gel.
6. Les décisions différées ne remettent pas en cause les invariants scientifiques, de sécurité ou de conservation.
7. Les dépendances CDCF, MCD, dictionnaire, MLD et CDC technique sont vérifiées.
8. Le gel produit une version de référence identifiable.
9. Les modifications après gel suivent la procédure du § 13.
10. Chaque changement fait l'objet d'une analyse d'impact proportionnée.
11. Les ADR restent traçables jusqu'aux exigences.
12. Les critères d'acceptation évoluent de façon contrôlée.
13. Les points ouverts sont réexaminés à leur étape d'affectation.
14. Le passage à l'architecture est autorisé par un bilan explicite de préparation.
15. Le gel V1.0 n'est prononcé qu'après une revue finale de cohérence et de complétude.

**Conditions générales de gel :**
1. Exigences consolidées dans un document cohérent.
2. Contradictions résolues.
3. Critères d'acceptation, ou méthode explicite pour les établir.
4. Décisions différées au registre.
5. Aucun point ouvert ne remet en cause la faisabilité ou la sécurité fondamentale.
6. Dépendances avec les modèles amont vérifiées.
7. Version de référence identifiée et conservée.

Ces conditions générales sont déclinées en GEL-01 à GEL-08 (§ 11).

---

# 5. Décisions de cohérence REV-02-A à REV-02-H

Issues du contrôle croisé avec le MCD V1.1, le dictionnaire V1.1 et le MLD V1.0. Toutes **validées**. Ce sont des précisions de cohérence, pas de nouveaux blocs.

| Réf. | Objet | Règle |
|---|---|---|
| **REV-02-A** | Droits administratifs ≠ droits de consultation | Administrer un espace, administrer la plateforme et accéder à des contenus scientifiques privés sont trois prérogatives distinctes. Un administrateur technique n'a aucun droit automatique de lecture des contenus privés. Un administrateur d'espace n'a que les droits explicitement associés à son rôle et au contexte. Les accès exceptionnels sont autorisés, justifiés, limités et audités. |
| **REV-02-B** | Confidentialité des dérivés et anciennes versions | Toute donnée dérivée, ancienne version, représentation calculée ou sortie différée (synthèse, cache, notification en attente, export préparé non téléchargé) respecte les autorisations **au moment de sa divulgation**. Les restrictions d'un dérivé sont déterminées par ses propres règles de gouvernance et sa provenance, **sans héritage aveugle** ni contournement des protections des sources. On distingue l'évaluation des droits d'un dérivé du contrôle de sa diffusion. |
| **REV-02-C** | Divulgations statistiques indirectes | Aucune statistique, agrégation, comparaison ou succession de requêtes ne révèle des informations dont l'existence ou le contenu est protégé. Cela inclut les **attaques par différenciation**. La règle s'applique aux graphiques, tableaux de bord, cartes Atlas, résultats de recherche et API. Mécanismes et seuils : architecture et MPD, sans affaiblir le calcul sur le graphe accessible. |
| **REV-02-D** | Attribution après départ d'une organisation | Le départ ou l'exclusion d'un membre ne supprime jamais automatiquement ses contributions, crédits ni historique scientifique. L'ancien membre conserve depuis son compte un **historique personnel de ses contributions** (titres, dates, rôles, identifiants, statuts, crédits), dans la limite des informations communicables. L'accès au contenu intégral, sa réutilisation et son export restent soumis aux droits et accords. Révoquer une adhésion ne vaut ni effacement de la paternité scientifique ni transfert de propriété intellectuelle. Une rectification d'attribution ou un effacement légal reste possible par procédure tracée. |
| **REV-02-E** | Corrections par un autre chercheur | Toute modification conserve l'attribution de la version initiale. Elle identifie distinctement les auteurs des corrections, leurs justifications et les actes de validation. Une version corrigée peut devenir la référence pour un usage donné, sans effacer l'historique ni réattribuer rétroactivement. |
| **REV-02-F** | Indépendance scientifique et conflits d'intérêts | GENIIUS distingue **autoévaluation**, **validation indépendante** et **validation collégiale**. Les projets peuvent exiger un ou plusieurs validateurs distincts de l'auteur. Une autoévaluation n'est jamais présentée comme indépendante. Les conflits d'intérêts déclarés ou identifiables sont signalés. |
| **REV-02-G** | Provenance lors des échanges entre projets | Tout échange entre espaces ou organisations préserve : auteurs, sources, versions, conditions de réutilisation, chaîne de provenance. L'organisation réceptrice peut enrichir les travaux sans s'approprier rétroactivement les contributions initiales. Partage, référence, copie et transfert de gouvernance restent distincts. |
| **REV-02-H** | Pérennité après disparition d'une organisation | La dissolution, l'inactivité ou la fin d'abonnement ne détruit jamais automatiquement le patrimoine scientifique. GENIIUS prévoit conservation, export patrimonial complet et transmission à un successeur légitime, sous réserve des droits, obligations et accords. Aucun transfert de propriété ou de gouvernance n'est présumé. On distingue : conservation, accessibilité, responsabilité financière du stockage, gouvernance. |

---

# 6. Règles de vérifiabilité, de gouvernance et d'alignement (REV-03)

## 6.1 Règles normatives validées

| Réf. | Règle |
|---|---|
| **REV-03-B** — Vérifiabilité | Toute exigence technique est reliée à ses sources fonctionnelles ou scientifiques. Elle dispose de critères d'acceptation observables, de scénarios de vérification et d'une priorité de recette. Toute décision différée précise son étape de résolution. **Aucun report ne peut masquer une contradiction normative ou une exigence critique non définie.** |
| **REV-03-C** — Décisions différées | Toute décision différée figure dans un registre précisant : référence, objet, exigences à satisfaire, criticité, étape de résolution, **responsable de décision**, tests de vérification. Aucune décision différée ne reste ouverte au moment où sa résolution devient nécessaire. |
| **REV-03-D** — Exhaustivité | Le gel exige une matrice de traçabilité fonctionnelle et scientifique couvrant toutes les exigences du périmètre V1.0. Toute lacune critique ou contradiction est résolue avant le gel. Une application n'est pas réputée couverte au seul motif que le Core dispose d'une API générique. Classification : **couvert / partiellement couvert / non couvert / différé légitimement / contradictoire**. |
| **Règle de gel** (REV-03-M01) | Une exigence peut rester à implémenter lors du gel, mais **pas ambiguë** sur le comportement attendu. Le gel exige des exigences cohérentes, précises, traçables et testables, pas des tests déjà réussis. |
| **Règle de levée** (REV-03-M11) | Aucune condition GEL n'est levée sur la seule base d'un accord en discussion. Il faut une référence à la version documentaire corrigée **et** une vérification de cohérence. |

## 6.2 Alignement du MLD sur la séparation administration / lecture (L14)

**Constat (REV-03-A, REV-03-D.8).** L'ancienne rédaction du MLD § 22.1 donnait aux rôles `propriétaire` et `administrateur` un accès par défaut aux objets `privé`. Elle contredisait REV-02-A. Classement : **P0 — bloquant avant gel**.

**Correction approuvée** (rédaction de la visibilité `privé`) :

> Privé : seuls les acteurs explicitement autorisés à consulter le contenu concerné, notamment son propriétaire lorsque ses droits effectifs le permettent, peuvent y accéder. Le rôle d'administrateur d'espace, d'organisation ou de plateforme ne confère aucun droit de lecture implicite. Tout accès exceptionnel doit reposer sur une habilitation spécifique, limitée, justifiée et auditée, conformément aux règles applicables.

**Contraintes procédurales associées.**

| Réf. | Règle | Précisions approuvées |
|---|---|---|
| **CP-23** | Droits du propriétaire : la création d'un objet `privé` crée **dans la même transaction** une `regle_acces` explicite (`voir`, `éditer`) pour l'auteur. Aucun rôle d'espace ne donne de lecture implicite. | Ne doit ni empêcher un transfert ultérieur de propriété ou de garde, ni donner une autorisation perpétuelle après une révocation légitime. |
| **CP-24** | Habilitation exceptionnelle : règle nominative de `nature = exceptionnelle`, avec `date_fin` et `fondement` obligatoires (CK), et journalisation de **chaque usage** (`contexte_evaluation.regle_acces_id`, `finalite` non nulle). Elle couvre les objets `privé` **et** `projet` *(révisée le 9/10/2026, ECD-04)*. | Trace aussi les refus et tentatives pertinents, **sans journaliser le contenu confidentiel**. |
| **CP-26** | Une règle `autoriser` au profit du rôle `propriétaire` ou `administrateur` ne porte que sur `administrer`, qui n'ouvre aucune lecture (CK déclaratif). Les rôles de gouvernance ne sont jamais bénéficiaires d'une règle *(ajoutée le 9/10/2026, ECD-04)*. | Rend l'arbitrage A de REC-X11 exécutable. |
| **CP-25** | Séparation des habilitations administratives et scientifiques. Un rôle administratif ne crée aucune appartenance scientifique ni lecture implicite des objets `projet` ou `privé`. La lecture `projet` exige une appartenance active avec lecture scientifique explicite. Le cumul est possible. | À la création d'un espace, le créateur reçoit atomiquement `propriétaire` (administratif) **et** `responsable scientifique` (scientifique), révocables ou transférables indépendamment. Un prestataire reçoit une appartenance administrative bornée à son mandat, sans lecture scientifique implicite. |

**Arbitrages REC-X10.**
- **A.** Le retrait d'une habilitation scientifique ne supprime pas automatiquement une autorisation explicite sur un objet privé : elle a son propre cycle de vie. Une révocation explicite est nécessaire si la politique l'exige ; il n'y a pas d'effet implicite non documenté.
- **B.** Le dernier propriétaire d'un espace ne peut pas être retiré sans transfert ou procédure de succession autorisée.

**Arbitrages REC-X11.**
- **A.** Une règle `autoriser` ciblant un rôle administratif ne peut jamais accorder une lecture ordinaire de contenu `projet` ou `privé`. Les exceptions passent par CP-24.
- **B.** Une autorisation exceptionnelle est **réévaluée à chaque opération révélatrice**, même en session ouverte. Cela vaut pour les liens de téléchargement, les exports en préparation et les tâches asynchrones.

**Synthèse des situations (CP-25).**

| Situation | Administration de l'espace | Lecture `projet` | Lecture `privé` |
|---|---|---|---|
| Administrateur technique uniquement | Oui | Non | Non |
| Membre scientifique uniquement | Non, sauf habilitation | Oui, selon droits effectifs | Seulement sur autorisation |
| Administrateur et membre scientifique | Oui | Oui, selon droits effectifs | Seulement sur autorisation |
| Prestataire avec accès exceptionnel | Selon mandat | Dans le périmètre autorisé | Par habilitation spécifique auditée |

**État documentaire.** Le fichier `docs/GENIIUS_MLD_V1_0.md` de l'espace de travail contient la nouvelle rédaction du § 22.1 et CP-23 à CP-25 (constat du 9 octobre 2026, modification non encore commitée). Ce constat porte sur **un fichier corrigé**. Il n'établit pas que ce fichier est la **version normative unique** du MLD : plusieurs versions ont circulé, dont une antérieure à la correction. Tant que cette version n'est pas désignée formellement, et que l'absence de lecture administrative implicite n'est pas vérifiée dans le reste du modèle (M10-A01, GEL-05), la correction reste **constatée mais non normativement intégrée**, et **GEL-01 reste ouverte**. Après la décision du 9 octobre 2026 (« ne touche plus au MLD pour l'instant »), aucune autre modification structurelle du MLD n'est engagée : toute nouvelle lacune révélée par les recettes est consignée avant décision.

**Révision décidée le 9 octobre 2026 (audit de cohérence, ECD-04 et ECD-05).** Sur décision explicite, le MLD et le dictionnaire ont été complétés :
- **CP-24 réécrite et CP-26 ajoutée** : plus aucune règle de lecture au profit d'un rôle administratif ; l'accès exceptionnel est identifiable (`regle_acces.nature`, `fondement`) et journalisé ;
- **CP-27** : réception des contributions hors ligne dans `contribution_differee` (zone de réconciliation, MLD § 5.6) ;
- **CP-28** : réplication locale limitée au graphe accessible, politique par espace, retraits non qualifiés ;
- **obligations ST-01 à ST-08** transmises au schéma technique des appareils et de la synchronisation (MLD § 28.3).

Le MLD reste candidat. Voir le [registre des versions normatives](GENIIUS_REGISTRE_VERSIONS_NORMATIVES.md).

## 6.3 Points de contrôle REV-03-M10

| Réf. | Objet | Qualification |
|---|---|---|
| **M10-A01** | TECH-011 approuvée sur le fond ; cohérence normative des autorisations à vérifier dans la version de référence | Bloquant potentiel **B1** |
| **M10-B01** | Propagation scientifique incomplète après un traitement asynchrone. Levée : états intermédiaires, reprises et conditions de visibilité définis | Bloquant potentiel **B1** |
| **M10-B02** | Index ou cache révélant des données privées. Levée : filtrage contextuel et révocation effective garantis | Bloquant potentiel **B1** |
| **M10-B03** | Purge suivie d'une résurrection par restauration. Levée : contrat de non-résurrection et recette définis | À qualifier |
| **M10-B04** | Journal d'audit incomplet ou indiscret. Levée : événements obligatoires, protection et consultation définis | À qualifier |
| **M10-C01** | Pas d'état partiellement migré ou scientifiquement incohérent après une mise en production | Arbitrage approuvé |
| **M10-C02** | Confidentialité, souveraineté scientifique et non-résurrection couvertes par la non-régression | Arbitrage approuvé |
| **M10-C03** | Portabilité sans perte des distinctions scientifiques ni transfert de droits implicite | Arbitrage approuvé |
| **M10-C04** | Interventions d'exploitation, y compris en incident, soumises au privilège minimal et à la traçabilité | Arbitrage approuvé |
| **M10-C05** | Pas de réécriture silencieuse des interprétations établies sous un ancien référentiel | Arbitrage approuvé |
| **M10-C06** | Décision MPD différée recevable si périmètre, contraintes, critères et étape sont explicites | Arbitrage approuvé |
| **M10-C07** | Chaque TECH possède au moins un contrat observable et une méthode de vérification | Bloquant si absence réelle |
| **M10-C08** | Chaque TECH possède une origine fonctionnelle exacte ou une justification technique explicite | Bloquant si absence réelle |
| **M10-C09** | Chaque TECH possède un état d'intégration normative vérifié dans la version candidate | Bloquant tant que non vérifié |

**Catégories de blocage :**
- **B1** — ambiguïté normative ;
- **B2** — rupture de traçabilité ;
- **B3** — absence de recette ;
- **B4** — décision différée non encadrée.

---

# 7. Registre des lacunes REV-03-L01 à L16 et arbitrages associés

Les seize lacunes sont des **défauts de traduction technique vérifiable** de règles existantes, et non des contradictions du modèle (sauf L14, contradiction confirmée et corrigée). Toutes ont été **instruites et leurs spécifications approuvées** (REV-03-M03 à M09). Leur intégration normative relève de **GEL-02**.

| Lacune | Objet | TECH | Ancrage MLD / dictionnaire | Recettes | Priorité |
|---|---|---|---|---|---|
| L01 | Propagation des impacts scientifiques | 015, 018, 031 | CP-21, OB-09, MPD-04 | K02, E02, AT04, **X12** | **P0** |
| L02 | Identités réversibles | 018, 031 | Identifications, versions | I01–I07 | P1 |
| L03 | Incertitude spatiotemporelle | 018, 025 | DATE_HIST, OB-19, GEOM | T01–T07 | P1 |
| L04 | Indépendance des preuves | 018, 031 | `independance()`, OB-18, CP-09 | S01, S04–S07 | P1 |
| L05 | Reconstructions et lacunes | 018, 031 | Domaine I (reconstruction) | S02, S03, S08–S11 | P1 |
| L06 | Workflows Rebond | 006, 018, 031 | CP-19 (lecture aveugle) | RB01–RB07 | P1 |
| L07 | Témoignages Journal | 006, 018, 031 | Domaine J | J01, J02, J04, J06–J09 | P1 |
| L08 | Consentement et transmission | 011, 020, 027 | Consentements, volontés | J03, J05, J10–J13 | P1 |
| L09 | États et portée des recherches Echo | 018, 031 | Domaine K | E01, E03, E05–E09 | P1 |
| L10 | Délégation scientifique | 011, 026, 027 | CP-20, OB-16 | E04, E10–E13 | P1 |
| L11 | Souveraineté Tree (+ L11-B projets multi-arbres) | 003, 011, 018 | CP-04, `reference_inter_espace`, `filiation`, `dependance` | TR01–TR11, **X13** | **P0** |
| L12 | Cartographie incertaine | 015, 018, 025 | Domaine N, GEOM | AT01–AT09 | P1 |
| L13 | Sécurité contextuelle Connect | 011, 018, 027 | § 22.3 (campagnes) | CN01–CN04, **X14** | **P0** |
| L14 | Gouvernance des autorisations | 011, 020, 027 | § 22.1–22.3, CP-23 à CP-25 | X01, X08–X11 | **P0** |
| L15 | Résilience patrimoniale | 002, 005, 012, 020 | CP-16, OB-12 | X02–X07, X15–X21 | P1 |
| L16 | Exigences non fonctionnelles démontrables | 009, 014, 024, 025, 028, 029, 033 | — | NF01–NF10 | P1 |

## 7.1 Arbitrages des lacunes P0

**L01 — Propagation (REC-X12).**
- **A — Signalement immédiat.** Dès qu'un changement amont est validé, les résultats dépendants peuvent être signalés comme susceptibles d'être affectés, même si le recalcul est différé. La propagation asynchrone ne crée **aucune fenêtre de fausse certitude**.
- **B — Pas de modification scientifique automatique.** Le système recalcule les résultats purement techniques et marque les dépendances. Il ne confirme, n'invalide ni ne remplace une conclusion sans décision humaine, sauf règle automatisée explicitement autorisée et tracée.
- **C — Défaillance prudente.** En cas d'échec, un état de réexamen en attente reste visible, et la propagation est relancée de façon idempotente.
- **Précision (REV-03-D.2).** Tant qu'un impact n'est pas résolu, l'interface et les API ne présentent pas silencieusement un résultat potentiellement obsolète comme réexaminé.

**L11 — Souveraineté Tree (REC-X13, TR05 à TR11).**
- **A — Souveraineté stricte.** Chaque arbre conserve ses identifications, assertions, sélections et conclusions. Une évolution externe ne produit qu'une proposition ou un signalement.
- **B — Référence sans transfert implicite.** Référencer un objet du Core n'est ni le copier, ni en devenir propriétaire, ni acquérir des droits. La référence est réévaluée dans le contexte du lecteur.
- **C — Divergence légitime.** Deux arbres peuvent durablement porter des interprétations contradictoires.
- **D — Publication indépendante.** Publier ou exporter un arbre n'étend jamais les droits sur un autre arbre ni sur le Core protégé.
- **Multi-arbres natif.** Un compte crée, possède et administre plusieurs arbres, ou intervient comme chercheur dans l'arbre d'un tiers.
- **Suivi bidirectionnel des branches communes**, avec acceptation humaine dans chaque arbre. Les propositions sont idempotentes. Une branche commune ne confère aucun droit de lecture supplémentaire.
- **Réutilisations publiques.** Une fiche du Core peut indiquer les arbres **publics** qui la réutilisent. Les arbres privés ne sont ni révélés ni comptés. On distingue réutilisation documentaire, identification acceptée et accord scientifique.
- **L11-B — Projets collectifs** (exemple : Les Colimaçons, Saint-Leu, La Réunion). Le projet possède sa **propre reconstitution collective**, alimentée par des contributions sélectionnées. Ce n'est pas une fusion automatique des arbres participants. Trois modes d'entrée : référencement, contribution sélectionnée, import externe.
- **Arbitrages Colimaçons.**
  - **A — Partage limité par défaut.** Aucune expansion automatique vers les branches collatérales ni vers l'ascendance des conjoints.
  - **B — Partage vivant mais contrôlé.**
  - **C — Arbre préparé pour un tiers.** Créateur, auteur des recherches et propriétaire administratif sont distincts.
  - **D — Contribution indépendante du fournisseur** (GENIIUS ou externe), avec les mêmes exigences.
  - **E — Aucun partage transitif.**
  - **Option C (consultation / réutilisation)** : configurable **par contribution**, **consultation seule par défaut**. Les permissions de réutilisation ne dépassent jamais les droits effectifs de celui qui partage.
- **Exigences transversales non négociables.**
  1. Une contribution n'ouvre jamais l'ensemble de l'arbre source. On partage un **sous-graphe gouverné et versionné**, pas une autorisation sur un individu racine.
  2. Consultation et réutilisation sont deux permissions distinctes.
  3. Le projet collectif a ses propres décisions scientifiques, sans modifier les arbres participants.
- **Limite V1.** Import et réimport GEDCOM sont possibles ; **aucune synchronisation native continue avec Geneanet** n'est présumée.

**L13 — Connect (REC-X14).**
- **A.** Connect est un espace de **participation**, pas un accès scientifique. Un invité n'obtient aucun droit sur les recherches dont proviennent les contenus, même pour un événement rattaché à un projet.
- **B.** Un témoignage n'est jamais automatiquement une conclusion. Il est conservé avec son auteur et son contexte.
- **C.** Les autorisations sont vérifiées **à chaque diffusion** : album familial, newsletter et publication sont des portées distinctes.
- **D.** Les droits sur les contenus et les droits sur les personnes représentées restent distincts : opposition, retrait, obligations, sans promesse de suppression de copies déjà obtenues par des tiers.
- **Répartition.** Connect organise la participation et la collecte. Journal, Rebond, Tree et le Core assurent le traitement scientifique. Le pilotage des recherches relève d'AV-FONC-001.

**L14 — Autorisations.** Voir § 6.2.

## 7.2 Arbitrages des lacunes P1

| Lacune | Arbitrage |
|---|---|
| L02 | Une identité scientifique est une conclusion révisable, et non une fusion destructrice des données documentaires. |
| L03 | Aucune normalisation technique ne transforme une incertitude historique en précision fictive. |
| L04 | Le nombre de documents ou de citations n'est jamais assimilé au nombre de preuves indépendantes. L'absence de dépendance connue n'est pas une indépendance établie. |
| L05 | Absence de preuve, preuve d'absence et information non encore recherchée sont trois situations distinctes. On ne remplit pas artificiellement les parties manquantes d'un document. |
| L06-A | Les étapes documentaires restent distinctes : transcription, observation, mention, identification, conclusion. |
| L06-B | Une correction amont déclenche l'identification des conséquences, sans réécriture silencieuse. |
| L07-C | Une nouvelle déclaration ne remplace pas rétroactivement le témoignage original. |
| L07-D | L'indépendance des témoignages ne se présume pas. Le contexte de collecte permet de l'évaluer (spontané / après suggestion). |
| L08-E | Les autorisations sont distinctes pour : collecte, transcription, structuration, partage, contribution scientifique, publication, usages algorithmiques. |
| L08-F | Une transmission différée (capsule) ne se déclenche pas sur une simple déclaration non vérifiée lorsqu'elle concerne des contenus protégés. |
| L09-G | Une recherche infructueuse est un résultat documentaire, pas la preuve que l'objet n'a jamais existé. Consulter une cote au catalogue n'est pas lire le document. Accomplir un protocole n'est pas épuiser la recherche. |
| L09-H | Toute synthèse se relie aux éléments et décisions qui la justifient. |
| L10-I | Déléguer une tâche ne transfère ni la responsabilité scientifique, ni les droits de publication, ni la propriété des recherches. |
| L10-J | La fin d'une mission retire ses habilitations, sans effacer les travaux ni leur attribution. |
| L12-A | Les géométries historiques sont des représentations sourcées, éventuellement hypothétiques, et non des coordonnées exactes. |
| L12-B | Atlas ne transforme jamais une reconstruction géographique en fait établi : ni à l'affichage, ni en recherche, ni à l'export. La carte ne paraît jamais plus précise que ses sources. |
| L15-C | Une sauvegarde restaurable ne suffit pas : elle préserve la cohérence scientifique et documentaire. |
| L15-D | Restauration et synchronisation ne contournent jamais une révocation, une restriction ou une purge. |
| L16-E | Les seuils TECH approuvés restent normatifs. La recette définit les conditions de mesure sans les modifier implicitement. |
| L16-F | Un résultat de performance n'est recevable qu'avec jeu de données, volumétrie, configuration, charge et méthode documentés. |
| L16-G | Sécurité, confidentialité et intégrité ne sont jamais sacrifiées à un objectif de performance. |

---

# 8. Référentiel des recettes techniques

## 8.0 Statut et règles communes

- **Statut par défaut :** spécification approuvée, **non exécutée**. Aucune recette n'a encore été jouée sur un logiciel.
- **Surfaces à couvrir :** chaque recette touchant la confidentialité est vérifiée sur l'interface, les API, la recherche, les exports, les notifications et les traitements asynchrones. Un simple masquage à l'écran ne suffit jamais.
- **Exhaustivité :** chaque recette précise, lors de sa mise en œuvre, son jeu de données, ses préconditions, son résultat attendu observable, sa priorité et la version testée.
- Les doublons recensés au § 8.15 sont à résoudre (**GEL-04**).

## 8.1 Core et souveraineté des espaces

| ID | Scénario | Résultat attendu | Prio. |
|---|---|---|---|
| REC-A02 | Assertion privée, contribuée explicitement à un projet partagé, puis modifiée dans l'espace privé | La version partagée reste inchangée. Provenance conservée, divergence signalable. Aucune publication ou synchronisation sans opération autorisée. Aucune donnée privée nouvelle révélée. | P0 |

## 8.2 Chaîne documentaire et épistémique

| ID | Scénario | Résultat attendu |
|---|---|---|
| REC-K01 | Contester l'identification d'une mention sans contester sa transcription | Transcription inchangée ; contestation historisée |
| REC-K02 | Corriger une transcription utilisée par plusieurs assertions et conclusions | Dépendances signalées ; aucune modification silencieuse des conclusions |
| REC-K03 | Déduire une naissance approximative d'un âge déclaré | Estimation dérivée ; la source ne reçoit jamais une date qu'elle ne contient pas |
| REC-K04 | Importer une transcription avec identification proposée | Provenance conservée ; identification non validée automatiquement |

## 8.3 Identités et temporalités (L02, L03)

| ID | Scénario | Résultat attendu |
|---|---|---|
| REC-I01 | Deux Jean CARMEN homonymes | Deux identités conservées ; rapprochement possible sans fusion automatique |
| REC-I02 | Charles TANCRÈDE identifié à tort comme une seule personne | Scission intellectuelle possible, sans effacer les anciennes hypothèses ni leurs auteurs |
| REC-I03 | Variantes BLUKER / BICLAIR | Recherche sur les variantes, sans correction arbitraire des sources |
| REC-I04 | Deux mentions rapprochées comme une même personne | Décision, auteur, justification et version conservés |
| REC-I05 | Une nouvelle preuve conduit à dissocier les mentions | Révision sans destruction des mentions et sources |
| REC-I06 | La dissociation affecte des filiations ou publications | Dépendances identifiées, réexamen proposé, pas de correction silencieuse |
| REC-I07 | Deux projets conservent des identifications divergentes | Divergence autorisée, documentée, non fusionnée |
| REC-T01 | Emploi attesté en 1834, 1837 et 1841 | Trois attestations, sans emploi continu présenté comme établi |
| REC-T02 | Deshaies en 1802, Pointe-à-Pitre en 1810 | Aucun itinéraire précis présenté comme historique sans justification |
| REC-T03 | Première attestation en 1802 | Ni naissance ni arrivée déduites automatiquement |
| REC-T04 | Date approximative ou intervalle | Incertitude conservée dans les API et interfaces |
| REC-T05 | Deux sources aux périodes contradictoires | Les deux assertions restent accessibles selon les droits |
| REC-T06 | Lieu connu par localisation relative | Aucune coordonnée précise inventée |
| REC-T07 | Carte ou chronologie reconstruite | Fait attesté et interprétation distingués explicitement |

## 8.4 Relations, sources et provenance (L04, L05)

| ID | Scénario | Résultat attendu |
|---|---|---|
| REC-R01 | Convoi de 24 personnes, une seule identifiée | Collectif de 24 positions, sans 23 personnes fictives |
| REC-R02 | Deux voisins sur un cadastre | Contiguïté spatiale conservée, sans relation d'amitié créée |
| REC-S01 | Original → photographie → copie → recadrage → transcription | Filiation documentaire complète ; pas de multiplication des preuves indépendantes |
| REC-S02 | Reconstruction d'un registre disparu | Reconstructions concurrentes possibles ; hypothèses et lacunes visibles |
| REC-S03 | Série passant de l'acte 86 à l'acte 88 | N° 87 signalé non observé, sans conclure à sa destruction |
| REC-S04 | Trois travaux citent la même source primaire | Dépendance documentaire identifiable |
| REC-S05 | Deux sources réellement indépendantes | Indépendance justifiée et conservée |
| REC-S06 | Origine d'une information inconnue | Indépendance qualifiée d'**indéterminée**, non présumée |
| REC-S07 | Dépendance découverte ultérieurement | Évaluations concernées signalées pour réexamen |
| REC-S08 | Reconstruction à partir d'indices incomplets | Hypothèses, sources et méthode identifiables |
| REC-S09 | Période sans source connue | Lacune explicite, pas de conclusion d'absence |
| REC-S10 | Nouvelle source contredisant une reconstruction publiée | Impact détecté, révision proposée |
| REC-S11 | Synthèse faits / hypothèses / inconnues | Distinction conservée dans les exports et publications |

Recette complémentaire de navigation : assertion construite sur une zone précise d'un document → navigation jusqu'à la zone et conservation de la provenance, selon les droits (REV-03-D.4).

## 8.5 Rebond (L06)

| ID | Scénario | Résultat attendu |
|---|---|---|
| REC-RB01 | Deux chercheurs exploitent le même acte, dont l'un en lecture indépendante | Attribution préservée ; comparaison possible après la lecture (CP-19) |
| REC-RB02 | CHARBONNET (source A) et CHARBONNIER (source B) | Deux lectures distinctes ; B ne corrige pas A |
| REC-RB03 | Annotation d'une signature sans transcription intégrale | Annotation conservée et localisée |
| REC-RB04 | Interventions successives sur un document | Contributions, auteurs et étapes conservés |
| REC-RB05 | Transcription corrigée après exploitation | Ancienne version conservée ; dépendants signalés |
| REC-RB06 | Deux lectures concurrentes d'un passage | Aucune n'écrase l'autre automatiquement |
| REC-RB07 | Extraction automatisée de mentions | Résultats qualifiés comme propositions, soumis à examen humain |

## 8.6 Journal (L07, L08)

| ID | Scénario | Résultat attendu |
|---|---|---|
| REC-J01 | Souvenir incomplet, complété des mois après | Versions et contexte initial conservés |
| REC-J02 | Identification d'une photo avant et après suggestion d'un nom | Deux réponses distinctes avec leur contexte |
| REC-J03 | Anecdote partageable, audio original sous embargo | Texte accessible ; audio protégé |
| REC-J04 | Un témoin modifie sa déclaration | Nouvelle déclaration conservée sans effacer la première |
| REC-J05 | Révocation d'une autorisation de publication | Divulgations futures conformes ; obligations de conservation et publications déjà diffusées traitées selon leur régime |
| REC-J06 | Souvenir spontané | Déclaration originale et contexte conservés |
| REC-J07 | Photo ou nom présenté avant la réponse | Influence potentielle documentée |
| REC-J08 | Retour sur une déclaration | Nouvelle déclaration reliée à l'ancienne, sans effacement |
| REC-J09 | Plusieurs témoins reprennent un même récit | Dépendance possible entre témoignages représentable |
| REC-J10 | Consentement à l'enregistrement, refus de publication | Enregistrement dans sa portée ; publication interdite |
| REC-J11 | Consentement à la transcription, refus de l'IA | Restrictions respectées par tous les traitements |
| REC-J12 | Capsule à ouverture différée | Contenu inaccessible avant réalisation des conditions |
| REC-J13 | Retrait de consentement ou changement d'instructions | Effets selon le fondement juridique, les droits acquis et les obligations |

## 8.7 Echo (L09, L10)

| ID | Scénario | Résultat attendu |
|---|---|---|
| REC-E01 | Protocole accompli sans identifier les parents de Charles TANCRÈDE | Protocole accompli, question non résolue, limites conservées |
| REC-E02 | Invalidation d'une identification fondant une conclusion | Conclusion à réexaminer, dépendances explicites |
| REC-E03 | Fonction administrative connue, recherche de fonds possibles | Suggestions de sources, sans affirmer leur existence |
| REC-E04 | Mission d'archives déléguée à un tiers | Accès limité, durée et traçabilité |
| REC-E05 | Résultat négatif après consultation partielle d'un registre | Résultat qualifié par son périmètre, sans prétention d'exhaustivité |
| REC-E06 | Question de recherche avec périmètre documentaire | Question, méthode et périmètre conservés |
| REC-E07 | Hypothèse réfutée par une nouvelle source | Réfutation historisée, hypothèse initiale conservée |
| REC-E08 | Recherche sans résultat | Résultat négatif documenté avec méthode et couverture |
| REC-E09 | Synthèse issue de plusieurs hypothèses | Sources, incertitudes et état des conclusions vérifiables |
| REC-E10 | Mission limitée à un corpus | Périmètre, opérations autorisées et échéance explicites |
| REC-E11 | Le délégataire tente une opération hors mission | Refus, même s'il participe au projet |
| REC-E12 | Mission achevée ou révoquée | Habilitations retirées ; contributions et crédits conservés |
| REC-E13 | Soumission des résultats du délégataire | Attribution à l'auteur ; validation indépendante selon la gouvernance |

## 8.8 Tree et projets multi-arbres (L11, L11-B)

| ID | Scénario | Résultat attendu | Prio. |
|---|---|---|---|
| REC-TR01 | Deux Trees relient Arsène CHARBONNÉ à une même entité Core | Aucun accès réciproque implicite aux données privées | P0 |
| REC-TR02 | Le Core révise une date importée dans Tree | Notification et comparaison ; aucune modification silencieuse | P0 |
| REC-TR03 | Comparaison de branches autorisées | Limitée aux droits ; pas de contribution automatique au Core | P0 |
| REC-TR04 | Import GEDCOM de personnes potentiellement connues | Aucun rapprochement validé automatiquement | P0 |
| REC-TR05 | Un utilisateur gère plusieurs arbres indépendants avec des rôles distincts | Voir sous-scénarios | P0 |
| REC-TR06 | Deux arbres partagent une branche | Découvertes signalées sans synchronisation scientifique automatique | P0 |
| REC-TR07 | Depuis le Core, afficher les arbres publics réutilisant une connaissance | Arbres protégés jamais révélés | P1 |

**Sous-scénarios TR05 à TR07.**

| ID | Vérification | Résultat attendu |
|---|---|---|
| TR05-01 | Un compte crée trois arbres | Trois espaces indépendants |
| TR05-02 | Chercheur dans l'arbre d'un tiers | Contribution attribuée au chercheur ; propriété conservée par le tiers |
| TR05-03 | Le chercheur quitte l'arbre du tiers | Contributions attribuées ; accès cessés |
| TR06-01 | Branche commune identifiée | Correspondances documentées sans fusion |
| TR06-02 | Assertion évolue dans A | Proposition pertinente pour B |
| TR06-03 | Assertion évolue dans B | Proposition pertinente pour A |
| TR06-04 | Proposition refusée | Divergence conservée |
| TR06-05 | Proposition acceptée | Nouvelle version dans l'arbre destinataire |
| TR06-06 | Même modification retraitée | Ni doublon ni boucle de synchronisation |
| TR06-07 | Référence devenue inaccessible | Aucune information protégée divulguée |
| TR07-01 | Objet Core réutilisé par trois arbres publics | Les trois réutilisations accessibles présentables |
| TR07-02 | Un quatrième arbre privé utilise l'objet | Existence et contribution aux compteurs non révélées |
| TR07-03 | Deux arbres, une source, deux interprétations | Réutilisation documentaire distinguée de l'accord scientifique |

**REC-TR08 — Projet collectif de reconstitution historique (P0).** Cas de référence : Les Colimaçons, Saint-Leu, La Réunion.

| ID | Action | Résultat attendu |
|---|---|---|
| TR08-01 | Créer le projet | Espace indépendant, gouvernance et périmètre historique propres |
| TR08-02 | Associer plusieurs arbres | Chaque arbre conserve identité, droits et versions |
| TR08-03 | Proposer deux branches d'un arbre personnel | Seules les branches sélectionnées sont candidates |
| TR08-04 | Intégrer une famille sans parenté connue | Présente sans parenté fictive |
| TR08-05 | Accepter une contribution | Décision du projet et provenance enregistrées |
| TR08-06 | Découvrir une parenté entre deux familles | Rapprochement proposé et documenté, sans fusion |
| TR08-07 | Modifier une conclusion dans l'arbre source | Signalement d'impact ; pas de modification silencieuse |
| TR08-08 | Refuser une mise à jour | Position du projet conservée, refus tracé |
| TR08-09 | Retirer un contributeur | Accès cessés ; contributions acceptées traitées selon leurs conditions |
| TR08-10 | Publier une reconstitution | Seuls les contenus autorisés exposés, y compris liens et compteurs |

Critère : le projet évolue sans fusionner les arbres, sans s'approprier leurs données protégées et sans leur imposer ses conclusions.

**REC-TR09 — Partage sélectif d'une branche (P0).** Cas de référence : branches BOURBON (Sosa 27) et BOVALO (Sosa 31).

| ID | Action | Résultat attendu |
|---|---|---|
| TR09-01 | Sélectionner le Sosa 31 comme point de départ | Branche définie à partir d'un individu identifié |
| TR09-02 | Ascendance paternelle seule | Aucune remontée par l'ascendance maternelle |
| TR09-03 | Inclure la descendance | Descendants admissibles, sous réserve des restrictions |
| TR09-04 | Inclure les unions pertinentes | Relations conjugales autorisées conservées |
| TR09-05 | Inclure le Sosa 30 comme conjoint | Conjoint visible, parents et grands-parents non ouverts |
| TR09-06 | Exclure la branche du Sosa 16 | Ni exposée ni **déductible** |
| TR09-07 | BOURBON et BOVALO partagés séparément | Deux contributions aux paramètres propres |
| TR09-08 | Personne vivante dans la descendance | Données masquées ou exclues |
| TR09-09 | Prévisualiser | Liste **exacte** des personnes, relations, sources et informations transmissibles |
| TR09-10 | Modifier ensuite la branche source | Proposition de mise à jour, sans élargissement silencieux du périmètre |
| TR09-11 | Réduire ou révoquer le partage | Accès et diffusions futurs réévalués ; copies déjà autorisées selon leurs conditions |
| TR09-12 | Rechercher, exporter, parcourir | Aucune fuite vers les branches non sélectionnées |

Point technique : une branche est une **sélection gouvernée d'objets et de relations, au périmètre versionné et réévalué**. Une autorisation sur le Sosa 31 seul ne suffit pas. On distingue le partage d'une version figée et le suivi des nouveautés. Même en suivi, aucune publication non contrôlée de nouvelles personnes ou relations n'a lieu.

**REC-TR10 — Arbre créé pour un bénéficiaire sans compte (P0).**

| ID | Action | Résultat attendu |
|---|---|---|
| TR10-01 | Créer un arbre pour un tiers sans compte | Créé et administré par le chercheur |
| TR10-02 | Indiquer un bénéficiaire futur | Destination enregistrée, sans faux compte |
| TR10-03 | Effectuer des recherches | Attribuées au véritable chercheur |
| TR10-04 | Partager une branche avec un projet | Possible selon les droits, sans compte du bénéficiaire |
| TR10-05 | Préparer le cadeau | Accès du bénéficiaire non activé prématurément |
| TR10-06 | Générer une invitation privée | Limitée, sécurisée, révocable |
| TR10-07 | Acceptation de l'invitation | Accès selon le rôle proposé |
| TR10-08 | Transférer la propriété administrative | Explicite et audité ; auteur des recherches inchangé |
| TR10-09 | Le chercheur reste collaborateur | Seulement les habilitations convenues |
| TR10-10 | Le chercheur quitte l'arbre | Droits cessés, contributions attribuées, liens au projet réévalués |
| TR10-11 | Refus ou absence de réponse | Aucun compte ni transfert forcé |
| TR10-12 | Invitation interceptée ou expirée | Aucun accès non autorisé |

**REC-TR11 — Contributions internes et externes (P0).**

| ID | Action | Résultat attendu |
|---|---|---|
| TR11-01 | Contribuer depuis son arbre GENIIUS | Référence à la branche autorisée, avec provenance |
| TR11-02 | Contribuer depuis l'arbre d'un tiers administré | Contribution indépendante de l'arbre personnel |
| TR11-03 | Contribuer depuis un arbre sans parenté connue | Intégrable sans parenté obligatoire |
| TR11-04 | Importer un GEDCOM Geneanet | Origine, auteur déclaré, fichier et date conservés |
| TR11-05 | Personne potentiellement déjà connue | Rapprochement proposé, jamais fusion automatique |
| TR11-06 | Assertion contradictoire importée | Les deux positions documentées |
| TR11-07 | Réimport d'un GEDCOM actualisé | Différences détectées sans écrasement |
| TR11-08 | Import répété d'un fichier identique | Aucun doublon scientifique |
| TR11-09 | Contribution contenant des informations privées | Exclusion ou masquage avant intégration et diffusion |
| TR11-10 | Publication d'une synthèse | Contenus autorisés seulement, avec crédits et provenances |
| TR11-11 | L'arbre externe change sur Geneanet | Aucun changement supposé connu sans nouveau flux |
| TR11-12 | Une source externe disparaît | Provenance et état de disponibilité conservés |

**Vérifications MLD restantes pour L11-B** (sans modification présumée) :
- expression d'une permission de **réutilisation** distincte de la lecture ;
- enregistrement, versionnement et audit d'une **sélection de branche** sans nouveau modèle d'arbre ;
- bénéficiaire futur, invitation, remise et transfert ;
- sélection des éléments contributifs dans un import.

## 8.9 Atlas (L12)

| ID | Scénario | Résultat attendu |
|---|---|---|
| REC-AT01 | Reconstruction d'un territoire historique | Relations historisées, sources et incertitudes conservées |
| REC-AT02 | Habitation au nord de C, bordée par une rivière, voisine de A et B | Zone plausible, sans polygone exact inventé |
| REC-AT03 | Épidémie contemporaine d'un décès | Concomitance représentée, causalité non affirmée |
| REC-AT04 | Révision d'une localisation utilisée par une carte publiée | Carte courante signalée ; ancienne publication conservée avec son état |
| REC-AT05 | Habitation localisée par zone approximative | Incertitude spatiale représentée |
| REC-AT06 | Deux cartes aux limites différentes | Reconstructions concurrentes conservées |
| REC-AT07 | Limite territoriale évolutive | Versions temporelles distinctes |
| REC-AT08 | Nouvelle source modifiant une reconstruction | Dépendances et publications affectées signalées |
| REC-AT09 | Export d'une géométrie incertaine | Incertitude, temporalité et provenance conservées |

## 8.10 Connect (L13)

| ID | Scénario | Résultat attendu |
|---|---|---|
| REC-CN01 | Identification de photos lors d'une cousinade | Réponses attribuées et vérifiables ; pas de validation automatique dans le Core |
| REC-CN02 | Invité d'un événement lié à un projet privé | Accès limité au périmètre de l'événement |
| REC-CN03 | Quiz utilisant des informations dont certaines sont privées | Aucune divulgation par questions, réponses, scores ou indices |
| REC-CN04 | Collecte de témoignages via Connect vers Journal | Consentements, provenance et séparation des espaces conservés |

**REC-X14 — Confidentialité Connect (P0).**

| ID | Scénario | Résultat attendu |
|---|---|---|
| X14-01 | Inviter à une cousinade | Accès aux seuls contenus Connect autorisés |
| X14-02 | L'invité tente d'ouvrir l'arbre privé | Refus sans révélation |
| X14-03 | Photo issue d'une recherche privée | Seules la version et les métadonnées autorisées exposées |
| X14-04 | Un invité nomme une personne sur une photo | Proposition attribuée, pas une vérité |
| X14-05 | Un invité propose une parenté | Aucune filiation créée dans Tree ou le Core |
| X14-06 | Examen du témoignage | Acceptation, refus ou demande de précisions tracés |
| X14-07 | Transfert vers Journal ou Rebond | Explicite, avec provenance, autorisations et statut |
| X14-08 | Organisateur avec droits administratifs Connect seuls | Aucune lecture implicite des recherches privées |
| X14-09 | Recherche d'un nom privé par un invité | Aucun résultat, suggestion, compteur ou indice |
| X14-10 | Révocation d'une invitation | Accès retiré, y compris liens et téléchargements contrôlés |
| X14-11 | Personne vivante ou mineure sur une photo | Restrictions, demandes de retrait et obligations appliquées |
| X14-12 | Retrait d'un témoignage demandé | Traité selon les droits ; conservation seulement justifiée |
| X14-13 | Événement associé à un projet (Les Colimaçons) | Invités non membres du projet scientifique |
| X14-14 | Export d'album ou newsletter | Aucun contenu non autorisé, même indirectement |

## 8.11 Recettes transversales (X)

| ID | Contrôle | Prio. |
|---|---|---|
| REC-X01 | Un administrateur sans droit explicite ne peut ni lire ni déduire l'existence d'un contenu privé | P0 |
| REC-X02 | Révocation respectée côté serveur et à la prochaine synchronisation d'un appareil hors ligne | P1 |
| REC-X03 | Contribution non synchronisée qui survit à une interruption prolongée et à une mise à jour du client | P1 |
| REC-X04 | Restauration qui conserve la cohérence base / fichiers / provenance | P1 |
| REC-X05 | Export patrimonial qui conserve identifiants, versions, sources, incertitudes et droits exportables | P1 |
| REC-X06 | Purge légale sans réapparition par restauration ou synchronisation | P1 |
| REC-X07 | Changement de référentiel sans réinterprétation silencieuse | P1 |
| REC-X08 | Recherche, statistique ou IA sans révélation hors du graphe accessible | P0 |
| REC-X09 | Un administrateur technique non membre scientifique tente d'accéder à un objet `projet` par interface, API, recherche et export : quatre refus sans divulgation. Après habilitation scientifique, lectures permises, sans ouverture des objets `privé`. | P0 |
| REC-X15 | Longue période hors ligne : travaux locaux conservés sans expiration | P1 |
| REC-X16 | Synchronisation interrompue puis reprise : ni duplication ni perte de provenance | P1 |
| REC-X17 | Deux appareils modifient une même conclusion : conflit détecté, pas de résolution scientifique automatique | P1 |
| REC-X18 | Restauration données + fichiers : cohérence objets, fichiers, versions, provenance | P1 |
| REC-X19 | Restauration après un effacement applicable : aucune résurrection | P1 |
| REC-X20 | Migration d'une recherche ancienne : identités, références, citations, historique préservés | P1 |
| REC-X21 | Transmission d'un projet à un successeur : gouvernance transférée explicitement, crédits conservés | P1 |

**REC-X10 — Création et dissociation des habilitations (P0).**

| ID | Action | Résultat attendu |
|---|---|---|
| X10-01 | Alice crée un espace projet | Deux habilitations actives : `propriétaire` (administrative) et `responsable scientifique` |
| X10-02 | Alice crée un objet `privé` | Autorisations `voir` et `éditer` créées dans la même transaction |
| X10-03 | Alice perd `responsable scientifique`, reste propriétaire | Plus de lecture `projet` au titre de l'appartenance |
| X10-04 | Alice garde une autorisation explicite sur son objet privé | Lecture maintenue, sauf interdiction |
| X10-05 | Alice perd `propriétaire`, garde `responsable scientifique` | Lecture `projet` maintenue ; pouvoirs administratifs perdus |
| X10-06 | Bob est uniquement administrateur | Administre sans accès implicite aux objets `projet` et `privé` |
| X10-07 | Bob reçoit `collaborateur` | Lit les objets `projet` selon ses droits, pas les objets privés |
| X10-08 | Échec entre les deux attributions à la création | Transaction annulée ; aucun espace partiellement initialisé |

Contrôles complémentaires : création atomique ; retrait de `responsable scientifique` qui supprime la lecture `projet` ; lecture issue de l'appartenance scientifique et jamais du rôle administratif ; expiration du mandat d'un prestataire effective aussi dans les recherches, exports et traitements différés.

**REC-X11 — Absence de contournement par les règles d'accès (P0).**

| ID | Situation | Résultat attendu |
|---|---|---|
| X11-01 | Bob administrateur technique sans habilitation scientifique | Aucun accès implicite `projet` ou `privé` |
| X11-02 | Règle générale « lecture pour le rôle `administrateur` » | Ne contourne pas CP-25 |
| X11-03 | Bob reçoit `collaborateur` | Lit les objets `projet` autorisés, pas les objets privés |
| X11-04 | Autorisation exceptionnelle sur un objet privé | Lecture dans le périmètre, la durée et les conditions de CP-24 |
| X11-05 | Expiration de l'autorisation | Refus immédiat côté serveur |
| X11-06 | Interdiction explicite malgré autorisation | L'interdiction l'emporte |
| X11-07 | Recherche, agrégation, export, API | Ni contenu ni indice d'existence |
| X11-08 | Ancienne version ou résultat dérivé | Restrictions courantes appliquées |
| X11-09 | Usage de l'accès exceptionnel | Journalisé (acteur, cible, date, opération, finalité), **sans le contenu** |

**REC-X12 — Changement d'une preuve utilisée par plusieurs conclusions (P0).** Une transcription corrigée sert à une assertion utilisée dans une conclusion Echo, une fiche Tree et une carte Atlas.

| ID | Action | Résultat attendu |
|---|---|---|
| X12-01 | Correction de la transcription | Nouvelle version ; ancienne conservée |
| X12-02 | Détection des dépendances | Tous les objets aval identifiés |
| X12-03 | Propagation en cours | Aucun résultat présenté silencieusement comme réexaminé |
| X12-04 | Propagation terminée | Éléments affectés signalés potentiellement obsolètes ou à réexaminer |
| X12-05 | Consultation de la conclusion Echo | Avertissement et provenance du changement |
| X12-06 | Consultation de la fiche Tree | Aucune modification automatique |
| X12-07 | Consultation de la carte Atlas | Changement de fondement signalé |
| X12-08 | Réexamen humain | Confirmer, corriger ou invalider, avec traçabilité |
| X12-09 | Échec d'un traitement asynchrone | Reprise sans perte du signalement ni validation automatique |
| X12-10 | Publication historique | Version historique conservée et distinguée de l'état actuel |

**REC-X13 — Deux arbres indépendants et un Core partagé (P0).** Alice (Tree A) et Bob (Tree B) divergent sur Jean CARMEN.

| ID | Action | Résultat attendu |
|---|---|---|
| X13-01 | Création séparée des arbres | Identifiants, gouvernance et versions indépendants |
| X13-02 | Référence au même document Core | Possible sans fusion |
| X13-03 | Alice valide une identification | Rien n'est validé dans B |
| X13-04 | Bob conteste | Deux positions traçables et distinctes |
| X13-05 | Assertion du Core corrigée | Signalement d'impact, pas de modification automatique |
| X13-06 | Alice accepte une mise à jour | Nouvelle version dans A ; B inchangé |
| X13-07 | Bob refuse | Divergence conservée et documentée |
| X13-08 | Alice rend son arbre public | Visibilité de B inchangée |
| X13-09 | Utilisateur sans droit consulte une référence entre arbres | Ni contenu ni indice d'existence protégé |
| X13-10 | Export d'un arbre | Identifiants, provenance, versions et divergences selon les droits |
| X13-11 | Référence Core devenue inaccessible | Contribution propre conservée ; référence signalée inaccessible, sans copie illicite |
| X13-12 | Conclusions incompatibles | Aucune règle de majorité ou d'autorité automatique |

## 8.12 Exigences non fonctionnelles (L16)

| ID | Scénario | Résultat attendu |
|---|---|---|
| REC-NF01 | Lectures courantes | p95 ≤ 1 s dans les conditions de référence |
| REC-NF02 | Recherches courantes | p95 ≤ 2 s dans les conditions de référence |
| REC-NF03 | Montée en charge | Seuils de charge, dégradation et capacité documentés |
| REC-NF04 | Disponibilité | 99,9 % selon une méthode publiée |
| REC-NF05 | Restauration après incident | RPO ≤ 5 min et RTO ≤ 4 h pour le périmètre couvert |
| REC-NF06 | Accessibilité | Cible WCAG 2.2 AA, tests automatisés et manuels |
| REC-NF07 | Parcours multilingues | Langues, écritures, dates et noms historiques conservés |
| REC-NF08 | Limites de ressources et coûts | Aucun quota ni dépassement ne provoque une perte silencieuse |
| REC-NF09 | Traitements asynchrones | Reprises idempotentes, états visibles, pas de résultat partiel présenté comme définitif |
| REC-NF10 | Sécurité sous charge | Aucune dégradation des contrôles d'accès, y compris caches et index |

**Protocole de mesure obligatoire** avant toute exécution : jeu de données, volumes, charge, matériel, réseau, environnement, période, exclusions, mode de calcul. Accessibilité, langues, droits et confidentialité restent exigés **sous charge**.

## 8.13 Recettes propres aux exigences TECH (REV-03-M10)

| ID | Exigence | Scénario et résultat attendu |
|---|---|---|
| REC-TECH04 | TECH-004 | Déplacement, renommage ou indisponibilité d'un fichier : identité documentaire préservée, liens rompus détectés, aucune perte silencieuse |
| REC-TECH07 | TECH-007 | Perte d'un moyen d'authentification : récupération contrôlée, sans contournement des habilitations ni divulgation |
| REC-TECH08 | TECH-008 | Modification d'un module : pas d'accès direct non autorisé aux données ni de contournement des contrats entre modules |
| REC-TECH13 | TECH-013 | Rejouer une opération après interruption : ni doublon, ni perte, ni effet scientifique supplémentaire |
| REC-TECH16 | TECH-016 | Révoquer un droit après indexation : plus aucune information protégée dans les résultats, suggestions ou agrégations |
| REC-TECH17 | TECH-017 | IA proposant une identification : ni conclusion validée ni modification du Core sans décision humaine autorisée |
| REC-TECH19 | TECH-019 | Accès aux données et fichiers sans les secrets : confidentialité préservée, sauvegardes comprises |
| REC-TECH21 | TECH-021 | Modifier une conclusion puis consulter l'historique : auteur, action, version et justification retrouvables selon les droits |
| REC-TECH22 | TECH-022 | Données de test hors production : ni fuite ni modification des données de production |
| REC-TECH23 | TECH-023 | Déploiement en échec : état précédent exploitable ou retour arrière contrôlé, sans corruption |
| REC-TECH24 | TECH-024 | Modification des règles d'accès : déclenche automatiquement la non-régression correspondante |
| REC-TECH26 | TECH-026 | Export puis réimport : identifiants de provenance, versions, incertitudes et relations préservés, sans extension des droits |
| REC-TECH27 | TECH-027 | Administrateur tentant un accès scientifique non attribué : refus et journalisation |
| REC-TECH30 | TECH-030 | Incident sur des traitements scientifiques : opérations incomplètes identifiées, traces préservées, reprise contrôlée |
| REC-TECH31 | TECH-031 | Changement de version de référentiel : interprétations historiques reproductibles avec la version initiale |
| REC-TECH32 | TECH-032 | Instruction d'une décision MPD différée : justification, alternatives, conséquences, respect des invariants |

## 8.14 Recette proposée, non approuvée

| ID | Statut | Contenu |
|---|---|---|
| REC-PR01 | **Proposée** (REV-03-M06), versée à AV-FONC-001 | Hiérarchie et isolation des sous-projets : 12 scénarios PR01-01 à PR01-12. Exemples : rejoindre uniquement Pointe-Noire ; administrer le programme parent sans lecture des enfants ; recherche transversale filtrée avant calcul ; déplacement d'un sous-projet sans élargissement des droits. |

## 8.15 Doublons et recouvrements à résoudre (GEL-04)

| Recouvrement | Action attendue |
|---|---|
| X02–X07 (REV-03-D.8) et X15–X21 (REV-03-M09) | Fusionner en un référentiel unique, avec liens entre scénarios complémentaires |
| X01 et X09 | Rattacher X01 comme cas général de X09 |
| J03 / J05 et J10–J13 | Rattacher les cas de consentement |
| TR08 : version initiale à 12 scénarios (REV-03-M04) et formalisation à 10 scénarios | **Retenir la formalisation à 10 scénarios** (TR08-01 à TR08-10) |
| CN01–CN04 et X14 | Rattacher CN à X14 |
| Recettes NF et TECH ayant le même objet (NF09 / TECH13 ; NF05 / X18) | Rattacher à l'exigence TECH correspondante |

---

# 9. Registre des décisions différées et des paramètres à dimensionner

Conformément à REV-03-C et AUDIT-TECH-016, chaque entrée précise l'invariant qu'elle doit respecter et son étape de résolution. Les responsables de décision sont **à désigner**, ce qui fait partie de GEL-03 et GEL-04.

## 9.1 Décisions MPD reportables (REV-03-M11)

| Réf. | Sujet | Invariant obligatoire (non reportable) | Étape |
|---|---|---|---|
| MPD-01 | Indexation | Texte intégral **filtré par le graphe accessible** ; index minimaux fixés par le MLD § 28.1 | MPD |
| MPD-02 | Matérialisation des droits effectifs et caches | Aucun contournement du graphe accessible ; caches **par contexte**, invalidés par versions des objets, règles et appartenances | MPD |
| MPD-03 | Seuil de petit effectif | Protection contre révélations indirectes **et attaques par différenciation** (REV-02-C) | Conception sécurité / MPD |
| MPD-04 | Délai maximal de propagation (CP-21, OB-09) | États de propagation et comportement observable définis (REC-X12 A à C) ; pas de fenêtre de fausse certitude | Architecture / exploitation |
| MPD-05 | Chiffrement des colonnes `I` | Clés hors base ; chiffrement au repos (TECH-019) | MPD |
| MPD-06 | RLS, service de politiques ou combinaison | Ordre du § 22.2 et réponses indistinguables (OB-04) sur **toutes** les opérations ; si RLS, politiques sur les vues d'accès | Architecture / MPD |

Ces reports ne sont acceptables que si leurs contrats sont suffisamment précis. Ils n'autorisent jamais une divulgation privée ni la présentation silencieuse d'un résultat obsolète comme réexaminé.

## 9.2 Décisions d'architecture ouvertes (AUDIT-TECH-016)

| Décision ouverte | Étape cible | Exigences |
|---|---|---|
| Stratégie d'isolation logique et physique des espaces | Architecture | AUDIT-TECH-009 |
| Mécanisme d'identifiants publics pérennes (URI persistantes, ARK) | Architecture | AUDIT-TECH-010, CP-17 |
| Protocole de synchronisation et de négociation de compatibilité | Architecture | TECH-003, AUDIT-TECH-003 |
| ~~Emplacement du modèle de données de la synchronisation~~ — **décidé le 9/10/2026 (ECD-05)** : zone de réconciliation (`contribution_differee`), politique de réplication et contexte d'évaluation dans le MLD (CP-27, CP-28) ; appareils, sessions, curseurs, journal technique et stockage local dans un schéma technique choisi par ADR, tenu par les obligations ST-01 à ST-08 (MLD § 28.3) | Fait | TECH-002, 003, 005, 007.8 ; AUDIT-TECH-001, 003 |
| Politique de caches et d'invalidation | Architecture | AUDIT-TECH-004, MPD-02 |
| Formats de conservation et fréquence des contrôles d'intégrité | Architecture / exploitation | AUDIT-TECH-012 |
| Dimensionnement des performances | Architecture / tests | TECH-014, AUDIT-TECH-008 |
| Langues livrées en V1 (au-delà du français) | Planification produit | TECH-033 |
| Modalités de récupération de compte et de transmission patrimoniale | Architecture / juridique | AUDIT-TECH-013 |
| Matrice complète des critères d'acceptation | Préparation des tests | AUDIT-TECH-015 |
| Technologies : Desktop (Electron, Tauri…), frontend, backend, file de tâches, stockage objet, moteur de recherche, observabilité, CI/CD, KMS | Architecture (ADR) | TECH-004, 006, 008, 015, 016, 019, 021, 023, 025 |
| Style d'API (REST, GraphQL, gRPC, événements) | Architecture | TECH-018 |
| Modèles et fournisseurs IA, local ou distant, multi-fournisseurs | Architecture | TECH-017 |
| Fréquence des snapshots, rétention, nombre de copies, régions, fournisseur de sauvegarde | Architecture / exploitation | TECH-012 |
| Garanties de récupération des fichiers binaires (équivalent RPO médias) | Architecture | AUDIT-TECH-006.13 |
| Hébergement : fournisseur et région (UE privilégiée) | Architecture | TECH-020.8 |
| Chiffrement de bout en bout pour des périmètres renforcés | Ultérieure | TECH-019.7 |

## 9.3 Paramètres à dimensionner

| Paramètre | Origine | Étape |
|---|---|---|
| Profils de volumétrie de référence (chiffres indicatifs non validés, TECH-009.4) | TECH-009 | À valider avec les utilisateurs cibles avant les tests de charge |
| Taille maximale d'un lot d'importation | AUDIT-TECH-015 | Architecture |
| Durée de compatibilité des anciens clients et politique de dépréciation API | TECH-018, TECH-023 | Architecture |
| Délais de propagation des changements de permissions | AUDIT-TECH-015 | Architecture |
| Durée maximale de consultation hors ligne pour les espaces sensibles | AUDIT-TECH-001 | Architecture / produit |
| Budgets de ressources par catégorie d'opération | AUDIT-TECH-008 | Architecture |
| Quotas de stockage et de traitement | TECH-029 | Architecture / modèle économique |
| SLO des services importants et différables | TECH-028 | Exploitation |
| Durées de rétention des journaux (diagnostic, sécurité, audit) | TECH-021 | Exploitation / juridique |
| Délais cibles de correction des vulnérabilités par classe | TECH-030 | Procédures opérationnelles |
| Bases juridiques, durées de conservation et procédures RGPD | TECH-020 | Analyse juridique |

## 9.4 Capacités évolutives (hors V1, préparées architecturalement)

- Offline-first intégral (TECH-002.7).
- Linux Desktop (TECH-004.5).
- Support direct des scanners (TECH-004.2).
- Bibliothèques externes liées (TECH-006.8).
- Extraction de modules en services (TECH-008.8).
- Chiffrement de bout en bout par périmètre (TECH-019.7).
- API publiques pour partenaires (TECH-018.11).
- Nœud GENIIUS local (TECH-001.5).
- Synchronisation native avec des plateformes externes comme Geneanet (REC-TR11).
- Système successoral automatisé (AUDIT-TECH-013.15).

---

# 10. Matrice de traçabilité des 33 exigences

**Lecture des colonnes.**
- *Clarifications* : AUDIT-TECH, REV-02.
- *Ancrage amont* : MLD, dictionnaire.
- *Recettes* : § 8.
- *Décision d'audit* : toutes **approuvées**.
- *Intégration normative* : non vérifiée pour toutes (GEL-02, GEL-03, M10-C09).

L'origine fonctionnelle exacte (section du CDCF) reste à compléter ligne par ligne (M10-C08).

| TECH | Lacunes | Clarifications | Ancrage amont | Recettes | Blocage potentiel |
|---|---|---|---|---|---|
| 001 | — | — | CDCF (surfaces) | Contrat à préciser | B3 à lever |
| 002 | L15 | A-001 | — | X15–X17 | — |
| 003 | L11 | A-003, A-014 | `objet`, `version_objet`, `activite`, CP-04 | X13, TR01–TR11, X17 | — |
| 004 | — | — | — | TECH04 | — |
| 005 | L15 | A-001, A-003 | — | X15, X16 | — |
| 006 | L06, L07 | A-005, A-006, A-012 | Domaine C, CP-16 | RB04–RB07, J06–J09 | — |
| 007 | — | A-013 | DD-07 (compte / acteur / personne) | TECH07 | — |
| 008 | — | — | — | TECH08 | — |
| 009 | L16 | A-008 | MLD § 28.2 | NF03 | — |
| 010 | — | A-005, A-010 | MLD-11, OB-10 | X20, TR04, TR11 | — |
| 011 | L08, L10, L11, L13, L14 | A-001, A-004, A-009, R-A, R-B, R-C | § 22, CP-11, CP-12, CP-19, CP-20, CP-23–25, OB-03–06 | X01, X08–X14 | **M10-A01 (B1)** |
| 012 | L15 | A-002, A-006 | — | X04, X06, X18, X19, NF05 | — |
| 013 | — | — | — | TECH13, X16, NF09 | — |
| 014 | L16 | A-008 | MPD-01 | NF01–NF03, NF10 | — |
| 015 | L01, L12 | — | CP-21, OB-09, MPD-04 | X12, NF09 | **M10-B01 (B1)** |
| 016 | — | A-004, A-011, R-B, R-C | MPD-01, MPD-02, § 22.3 | TECH16 | **M10-B02 (B1)** |
| 017 | — | A-004, A-014 | OB-15 | TECH17, RB07, J11 | — |
| 018 | L01–L07, L09, L11–L13 | A-003, A-010 | OB-13, OB-19, CP-07 | I04–I07, T04–T07, S04–S11, RB04–RB07, J06–J09, E06–E09, AT05–AT09 | — |
| 019 | — | — | MPD-05, OB-17 | TECH19 | — |
| 020 | L08, L14, L15 | A-002, A-013 | CP-16, MLD-15, OB-12 | X06, X19, J13 | M10-B03 |
| 021 | — | A-014 | `activite`, `version_objet`, `contexte_evaluation` | TECH21 | M10-B04 |
| 022 | — | — | — | TECH22 | — |
| 023 | — | — | — | TECH23 | — |
| 024 | L16 | A-015 | MLD § 21.2 (un test par CP) | TECH24, NF09 | — |
| 025 | L03, L12, L16 | — | OB-19 | NF06, T04–T07, AT05–AT09 | — |
| 026 | L10 | A-007, A-010, R-G | MLD-14, `export_exclusion` | TECH26, X05, E10–E13 | — |
| 027 | L08, L10, L13, L14 | R-A, R-D | CP-23–25 | X09–X11, TECH27, J10–J13, E10–E13 | — |
| 028 | L16 | — | — | NF04 | — |
| 029 | L16 | A-008 | — | NF08 | — |
| 030 | — | — | — | TECH30 | — |
| 031 | L01, L02, L04–L07, L09 | A-003, A-014, R-E, R-F | MLD-08, CP-10, CP-21 | TECH31, I04–I07, S04–S11, X07, X12 | — |
| 032 | — | A-015, A-016 | MPD-02/03/04/06 | TECH32 | — |
| 033 | L16 | A-011 | — | NF07 | — |

*Abréviations : A-xxx = AUDIT-TECH-xxx ; R-x = REV-02-x.*

---

# 11. Conditions de gel GEL-01 à GEL-08

**Décision de gel actuelle : GEL NON AUTORISÉ.** La revue des exigences est achevée sur le périmètre initial ; l'intégration normative exhaustive n'est pas démontrée.

> Le registre REV-03-M11 (conditions GEL-01 à GEL-08, reports MPD encadrés, réserve AV-FONC-001) est **approuvé en discussion, conditions non levées**. Cette approbation fixe les critères du gel ; elle ne lève aucune condition (règle de levée, § 6.1).

| Réf. | Condition | Critère de clôture | Statut au 09/10/2026 |
|---|---|---|---|
| GEL-01 | Version normative unique du MLD | § 22.1 corrigé et CP-23 à CP-25 cohérents dans la version retenue | **Non levée.** Corrections constatées dans un fichier (`docs/GENIIUS_MLD_V1_0.md` de l'espace de travail), qui n'est pas encore désigné comme version normative unique. Restent : désignation formelle et contrôle des autres règles d'accès (M10-A01) (§ 6.2) |
| GEL-02 | Décisions REV-03 intégrées | Les 16 lacunes ont des dispositions normatives vérifiables | **Partiellement avancée.** Dispositions consolidées dans ce document (§ 6–8) ; vérification de cohérence à faire |
| GEL-03 | 33 TECH consolidées | Chaque exigence a une origine, un contrat et une méthode de vérification | **Partiellement avancée.** Contrats et recettes consolidés (§ 3, § 10) ; origines CDCF exactes et responsables à compléter |
| GEL-04 | Recettes consolidées | Identifiants uniques, doublons résolus, résultats attendus explicites | Non levée (§ 8.15) |
| GEL-05 | Autorisations vérifiées | Aucun accès administratif implicite aux contenus scientifiques privés, nulle part dans les modèles | Non levée |
| GEL-06 | Propagation scientifique vérifiée | Dépendances, états intermédiaires et réévaluation définis | Non levée (spécification approuvée : REC-X12) |
| GEL-07 | Résilience patrimoniale vérifiée | Synchronisation, sauvegardes, restaurations et purges cohérentes | Non levée |
| GEL-08 | Exigences non fonctionnelles vérifiées | Seuils, conditions de mesure et critères de recette documentés | Non levée (protocole de mesure à écrire) |

**Règles.**
- Ces huit conditions sont bloquantes pour le **gel documentaire**. Elles n'exigent pas que le logiciel existe ni que les tests aient été exécutés.
- Aucune condition n'est levée sur la seule base d'un accord en discussion (§ 6.1).

**Deux jalons distincts.**
1. **CDC technique V1.0 — audit achevé sur périmètre initial** : état atteint par ce document.
2. **CDC technique — gel définitif** : après levée de GEL-01 à GEL-08 **et** décision explicite sur l'intégration d'AV-FONC-001 (§ 12).

**Ordre de relecture documentaire recommandé.**
1. Confronter le CDCF canonique et sa version explicative.
2. Vérifier le MCD canonique et le dictionnaire consolidé.
3. Comparer les variantes du MLD et désigner explicitement la version normative.
4. Relever les divergences contre chaque TECH, REV-03 et GEL.
5. Publier un errata traçable et une version candidate corrigée.

---

# 12. Réserve structurelle AV-FONC-001

Le dossier [AV-FONC-001 — Projets et programmes de recherche scientifique](AV-FONC/AV-FONC-001.md) est **distinct de REV-03** et **n'est pas intégré** dans ce document.

**Objet.** Il couvre :
- les projets comme espaces de travail scientifique gouvernés (Les Colimaçons ; programme antillais inspiré du CM98 ; militaires réunionnais 1914–1918 ; généalogies réunionnaises) ;
- les programmes, projets et sous-projets, avec habilitations locales ;
- les corpus, ressources, lots de travail, missions, livrables et indicateurs (avec numérateur, dénominateur, méthode, date, incertitude, périmètre) ;
- la recette proposée REC-PR01.

**Impact technique certain** : droits, isolation, calculs transversaux, flux, exports, volumétrie, partitionnement logique.

**Méthode retenue pour les avenants.**
1. Identifier.
2. Instruire.
3. Figer le dossier d'avenant (sans modifier les documents canoniques).
4. Achever l'audit du document en cours.
5. Rouvrir de façon contrôlée la chaîne CDCF → MCD → dictionnaire → MLD → CDC technique → recettes.
6. Vérifier et geler.

**Règle.** AV-FONC-001 ne doit pas être introduit silencieusement dans les modèles existants. Comme il touche des structures fondamentales, **le gel définitif du CDC technique V1.0 est déconseillé sans décision explicite sur son périmètre et son calendrier d'intégration.**

**Pistes d'évolution identifiées** (non approuvées, à instruire séparément) :
- EV-02 — Campagnes documentaires.
- EV-03 — Publications scientifiques.
- EV-04 — Fédération de recherches.
- EV-05 — Référentiels historiques collectifs.
- EV-06 — Qualité et couverture.
- EV-07 — Participation extérieure.

---

# 13. Procédure de changement après gel

Aucune décision prise pendant le développement ne modifie implicitement le contrat technique de GENIIUS (AUDIT-TECH-016).

1. **Demande de changement** : identifier précisément l'exigence concernée.
2. **Analyse d'impact** : modèle scientifique, sécurité, applications, coûts, tests, documents amont et aval.
3. **Décision** : accepter, refuser ou différer, avec justification.
4. **Versionnement** : publier une nouvelle version du document concerné.
5. **Traçabilité** : mettre à jour dépendances, ADR, critères d'acceptation et matrice de conformité.

Une découverte faite pendant une recette qui révèle une vraie lacune est **consignée avant toute correction** des modèles amont.

---

# Annexe A — Glossaire

| Terme | Définition |
|---|---|
| ADR | *Architecture Decision Record* : court document justifiant une décision d'architecture (contexte, alternatives, décision, conséquences) |
| Budget d'erreur | Part d'indisponibilité tolérée par un SLO (0,1 % ≈ 43 min 12 s sur 30 jours pour 99,9 %) |
| Cohérence éventuelle | Un index peut refléter un changement avec un court retard, sans affecter la donnée canonique |
| Dégradation gracieuse | La panne d'une fonction non essentielle n'entraîne pas celle de tout le produit |
| Dérivé | Représentation produite à partir d'un original ou de données canoniques (miniature, OCR, index, cache, statistique) ; jamais une seconde vérité |
| Défense en profondeur | Contrôles répartis sur plusieurs couches pour qu'un défaut isolé n'ouvre pas l'accès |
| Fail closed | En cas d'impossibilité de vérifier un droit, refus plutôt qu'autorisation |
| Feature flag | Mécanisme d'activation progressive d'une fonctionnalité ; jamais une autorisation |
| Graphe accessible | Sous-ensemble des objets et liens autorisés pour un contexte, calculé **avant** toute opération révélatrice (MLD § 22.3) |
| Idempotence | Rejouer une opération produit le même effet qu'une exécution unique |
| P0 / P1 / P2 | Niveaux de criticité (§ 0.3) |
| p95 | 95 % des mesures respectent la cible |
| Purge | Effacement légal contrôlé, qui couvre l'historique et les dérivés (CP-16) |
| RPO | *Recovery Point Objective* : perte de données maximale admise après catastrophe |
| RTO | *Recovery Time Objective* : délai maximal de remise en service après catastrophe |
| SLI / SLO / SLA | Indicateur mesuré / objectif interne / engagement contractuel |
| Tombstone | Enregistrement minimal marquant un objet retiré, soumis aux règles de confidentialité et d'effacement |
| Zone de réconciliation | Espace sécurisé conservant les contributions synchronisées incompatibles ou ambiguës en attente de décision |

# Annexe B — Journal des décisions

| Étape | Décisions | État |
|---|---|---|
| Cadrage | Méthode : question → contexte → options → recommandation → décision → conséquence | Validé |
| TECH-001 à TECH-033 | 33 exigences. Points marquants : TECH-002 révisée sur challenge (lecture mobile hors ligne de toute la base structurée) ; TECH-009 ajoutée sur le cas de l'association de 40 généalogistes ; TECH-033 ajoutée en cours d'audit | Validées |
| AUDIT-TECH-001 à 016 | 16 clarifications transversales | Validées |
| REV-01 | Inventaire de 49 ensembles de décisions | Effectué |
| REV-02-A à H | 8 décisions de cohérence | Validées |
| REV-03-A | Contradiction MLD § 22.1 relevée | Corrigée (§ 6.2) |
| REV-03-B, C, D | Vérifiabilité, décisions différées, exhaustivité | Validées |
| REV-03-D.1 à D.8 | Audit par domaine et par application ; lacunes L01 à L16 ; recettes associées | Approuvés |
| Consolidation REV-03 | Classement P0 / P1 ; rédaction `privé` ; report encadré de MPD-02, 03, 04, 06 | Approuvée |
| REV-03-M01 | Matrice des 16 lacunes | Établie |
| REV-03-M02 | CP-25 ; REC-X09 à X11 et arbitrages | Approuvés ; décision de ne plus modifier le MLD pour l'instant |
| REV-03-M03 | L01 : REC-X12 (A, B, C) | Approuvé |
| REV-03-M04 | L11 : REC-X13 (A à D), TR05 à TR11, option C, L11-B | Approuvé |
| AV-FONC-001 | Dossier d'avenant projets et programmes | Constitué, non gelé, hors CDC |
| REV-03-M05 | L13 : REC-X14 (A à D) | Approuvé |
| REV-03-M06 | Hiérarchie de projets, REC-PR01 | **Proposé**, versé à AV-FONC-001 |
| REV-03-M07 | L02 à L05 : 4 arbitrages, 16 scénarios | Approuvé |
| REV-03-M08 | L06 à L10 : 10 arbitrages, 20 scénarios | Approuvé |
| REV-03-M09 | L12, L15, L16 : 7 arbitrages, 22 scénarios | Approuvé |
| REV-03-M10-A, B, C | Traçabilité des 33 TECH ; M10-A01, B01–B04, C01–C09 ; 16 recettes REC-TECH | Approuvés |
| REV-03-M11 | Registre GEL-01 à GEL-08 ; reports MPD ; réserve AV-FONC-001 | **Approuvé en discussion, conditions non levées** |

# Annexe C — Limites de ce document

- Ce document consolide **fidèlement les échanges de conception**. Il ne crée aucune décision nouvelle. Les seuls ajouts sont rédactionnels : numérotation `TECH-xxx.n`, regroupements, tableaux de synthèse, identification des doublons.
- Il remplace le document `GENIIUS_CDC_TECHNIQUE_V1_0_CONSOLIDE_CANDIDAT.md`, qui avait été reconstitué sans accès à la source des échanges. Ce document est désormais archivé dans `archives/cdc-technique/`.
- Les origines fonctionnelles sont rattachées aux sections du CDCF V1.1 à l'annexe D. Certaines exigences n'ont pas d'origine fonctionnelle : elles reposent sur une justification technique (ECD-19).
- Aucun test logiciel n'a été exécuté. Aucune condition de gel n'est levée. **Aucun gel n'est prononcé.**
- Les chiffres de volumétrie et de coûts cités en exemple (profils TECH-009, tarifs de stockage évoqués pendant la conception) sont **indicatifs** et ne constituent pas des engagements.

# Annexe D — Origine fonctionnelle et correspondance avec le CDCF V1.1

*Ajoutée le 9 octobre 2026 (correction ECD-03 de l'audit de cohérence). Le référentiel fonctionnel de référence est `docs/geniius_io_CDCF_V1.md` (CDCF V1.1). Ses identifiants sont : sections § n, cas d'usage CU-01 à CU-25, critères de recette 1 à 50 (§ 103), décisions Q113 à Q245.*

## D.1 Identifiants hérités des échanges

Les échanges de conception (archives) citent des identifiants issus de `CDCF_GENIIUS_V1.docx`, document absent du dépôt. **Ce CDC technique ne les utilise pas comme références normatives.** Leur correspondance avec le CDCF V1.1 est la suivante.

| Identifiant (échanges) | Objet | CDCF V1.1 | Recettes CDC technique |
|---|---|---|---|
| A-01 | Séparer le Core et les objets propres aux applications | § 2.3, § 3.7, § 43, § 44 | REC-TECH08 |
| A-02 | Aucune contribution automatique au Core partagé | § 4.3, § 4.4, § 56 ; critères 8, 24 | REC-A02 |
| A-03 | Core utilisable dans un espace privé | § 12, § 47 ; critère 23 | REC-A02 |
| A-04 | Nouveaux domaines sans nouvelle application | § 43 ; critère 22 | — |
| K-01 | Correction indépendante des couches scientifiques | § 5.3 ; critères 2, 3 | REC-K01 |
| K-02 | Propagation des impacts d'une correction | § 5.4, § 41 ; critères 20, 25, 41 | REC-K02, X12 |
| K-03 | Séparer valeurs attestées et valeurs calculées | § 9.2 | REC-K03 |
| S-01 | Hiérarchie documentaire et provenance fine | § 15, § 18 | REC-S01 |
| S-02 | Rôles distincts des intervenants | § 16 | — |
| S-03 | Relations qualifiées entre documents | § 17 | — |
| S-04 | Documents disparus et reconstructions | § 20, § 30–32 ; CU-03 | REC-S02, S03 |
| CV-I01 | Deux Jean CARMEN homonymes | § 6, § 8.2 | REC-I01 |
| CV-I02 | Charles TANCRÈDE identifié à tort comme une seule personne | § 8.3 ; CU-01 ; critère 4 | REC-I02 |
| CV-I03 | Variantes BLUKER / BICLAIR | § 7.1 ; CU-14 | REC-I03 |
| CV-T01 | Emploi attesté en 1834, 1837 et 1841 | § 10.3 ; CU-15 | REC-T01 |
| CV-T02 | Deshaies puis Pointe-à-Pitre, sans itinéraire inventé | § 29 | REC-T02 |
| CV-T03 | Première et dernière attestations | § 10.3 ; CU-23 | REC-T03 |
| CV-AT01 | Reconstruction d'un territoire historique | § 27 ; CU-08 | REC-AT01 |
| CV-AT02 | Habitation au nord de C, sans polygone inventé | § 27.5, § 28 ; critère 12 | REC-AT02 |
| CV-AT03 | Concomitance ≠ causalité (épidémie) | § 14, § 27.10 ; critère 30 | REC-AT03 |
| CV-CN01 | Identification de photos lors d'une cousinade | § 3.5, § 32, § 33.1 ; CU-05, CU-16 | REC-CN01, X14 |

## D.2 Origine fonctionnelle de chaque exigence TECH

Cette table répond à M10-C08. « Justification technique » signifie que l'exigence découle d'une décision des échanges de conception, sans exigence fonctionnelle correspondante dans le CDCF V1.1. Ces exigences restent normatives, mais leur origine est à régulariser (avenant AV-FONC-002 proposé, ECD-19).

| TECH | Origine dans le CDCF V1.1 | Nature |
|---|---|---|
| 001 | § 3, § 44 (applications comme portes d'entrée) — aucune exigence de surface | Justification technique (ECD-19) |
| 002 | Aucune | Justification technique (ECD-19) |
| 003 | § 4.4 (filiation sans synchronisation forcée), § 64 (conflits d'édition) ; critère 24 | Fonctionnelle + technique |
| 004 | § 84 (import externe) — aucune exigence d'application installée | Justification technique (ECD-19) |
| 005 | § 64 — la synchronisation entre appareils n'est pas traitée (§ 85 porte sur la synchronisation externe) | Justification technique (ECD-19) |
| 006 | § 18 (reproductions), § 15.2, § 97 ; critère 2 | Fonctionnelle |
| 007 | § 95 (MFA, sessions et appareils), § 90 | Fonctionnelle |
| 008 | § 2.3, § 43, § 44 ; critère 22 | Fonctionnelle |
| 009 | § 88 (pérennité) — volumétrie issue des échanges (association de 40 généalogistes) | Justification technique (ECD-19) |
| 010 | § 83, § 84 | Fonctionnelle |
| 011 | § 61, § 62, § 73–75, § 49 ; critères 8, 11 | Fonctionnelle |
| 012 | § 95 (sauvegardes chiffrées, restauration testée), § 88 | Fonctionnelle |
| 013 | — | Justification technique |
| 014 | § 42 (recherche globale) | Justification technique |
| 015 | § 41 (résultats dynamiques) ; critère 41 | Fonctionnelle + technique |
| 016 | § 42, § 43, § 7 (variantes de noms) | Fonctionnelle |
| 017 | § 41–42, § 93, § 94 ; critère 14 | Fonctionnelle |
| 018 | § 79 (API), § 5 ; critère 44 | Fonctionnelle |
| 019 | § 95 | Fonctionnelle |
| 020 | § 66–72, § 96, § 97 ; critère 25 | Fonctionnelle |
| 021 | § 95 (logs d'audit), § 90 | Fonctionnelle |
| 022 | — | Justification technique |
| 023 | — | Justification technique |
| 024 | § 101 (CU), § 103 (critères de recette) | Fonctionnelle |
| 025 | § 106 (UX transversales) ; critère 12 | Fonctionnelle |
| 026 | § 82–84, § 88 ; critères 45, 46 | Fonctionnelle |
| 027 | § 49.2, § 62 | Fonctionnelle |
| 028 | § 88 (partiel) | Justification technique |
| 029 | § 100 (monétisation) | Fonctionnelle (partielle) |
| 030 | § 95 (politique de vulnérabilités, réponse aux incidents) | Fonctionnelle |
| 031 | § 31, § 40 ; critère 48 | Fonctionnelle |
| 032 | Partie XVIII, § 115 | Fonctionnelle (gouvernance) |
| 033 | § 99, § 19.3 | Fonctionnelle |
