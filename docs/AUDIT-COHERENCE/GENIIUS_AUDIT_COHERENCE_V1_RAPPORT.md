# GENIIUS — Audit de cohérence interdocumentaire V1

## Rapport d'audit

**Date :** 9 octobre 2026
**Objet :** vérifier, avant le gel du CDC technique V1.0 et l'entrée en architecture, que les décisions du CDCF, du MCD, du dictionnaire, du MLD et du CDC technique sont compatibles, correctement traduites d'un document à l'autre et réalisables.
**Livrables associés :**
- [Matrice de traçabilité](GENIIUS_AUDIT_COHERENCE_V1_MATRICE_TRACABILITE.md)
- [Registre de corrections](GENIIUS_AUDIT_COHERENCE_V1_REGISTRE_CORRECTIONS.md)

> **Aucun document n'a été modifié par cet audit.** Chaque écart est décrit avec sa formulation actuelle et une correction *proposée*. L'intégration relève d'une décision explicite, conformément à AUDIT-TECH-016 et à la règle de levée des conditions GEL.

---

## 1. Verdict

**GENIIUS n'est pas prêt pour la phase d'architecture, et le CDC technique V1.0 ne peut pas être gelé en l'état.**

Le socle scientifique est solide et cohérent d'un bout à l'autre de la chaîne. Les points suivants ont été vérifiés et ne posent pas de problème :
- la séparation source / mention / assertion / identification / hypothèse ;
- le graphe accessible ;
- les dates incertaines ;
- l'indépendance des preuves ;
- la filiation sans synchronisation ;
- la traçabilité de l'IA.

Les écarts tiennent à trois causes :

1. **Le statut documentaire de la chaîne n'est pas établi.** Les documents présentés comme gelés ne le sont pas dans le dépôt. Trois versions du CDC technique coexistent. Les identifiants d'exigences cités par le CDC technique n'existent pas dans le CDCF du dépôt.
2. **Le CDC technique a introduit des garanties que le modèle de données ne porte pas encore**, et dont l'emplacement n'est pas décidé : hors connexion et synchronisation, tâches asynchrones, authentification et appareils, états de conservation des fichiers, registre de non-résurrection.
3. **Quelques règles P0 du CDC technique ne sont pas rendues exécutables par le MLD** : règles d'accès accordées à des rôles administratifs, fenêtre de propagation, purge face à la déduplication binaire, consentement à l'usage algorithmique.

| Gravité | Nombre | Effet |
|---|---|---|
| **Bloquant** | 5 | Empêche le gel du CDC technique et l'entrée en architecture |
| **Majeur** | 16 | À résoudre ou à encadrer par une décision tracée avant le MPD ; certains conditionnent des GEL |
| **Mineur** | 7 | À corriger lors de la prochaine révision des documents concernés |
| **Amélioration** | 4 | Recommandé, non requis |

**Chemin critique recommandé :**
1. Établir la chaîne normative : ECD-01, 02, 03.
2. Arbitrer l'emplacement des structures techniques : ECD-05, 16, 17, 18.
3. Rendre exécutables les règles P0 : ECD-04, 06, 07, 09, 11.
4. Compléter la traçabilité dictionnaire → MLD : ECD-13.
5. Décider du périmètre d'AV-FONC-001 : ECD-20.

---

## 2. Périmètre et documents audités

| Document | Fichier audité | Statut déclaré dans le fichier | Statut revendiqué ailleurs |
|---|---|---|---|
| CDCF V1.1 | `docs/geniius_io_CDCF_V1.md` (4 508 l.) | « référentiel maître de cadrage », 7/10/2026 | « CDCF V1.1 🔒 » (CDC tech, en-tête) |
| MCD V1.1 | `docs/geniius_io_MCD_V1.md` (1 890 l.) | « modèle conceptuel canonique consolidé » | « MCD V1.1 canonique gelé » (dictionnaire) |
| Dictionnaire | `docs/geniius_io_DICTIONNAIRE_DONNEES_V1.md` (3 191 l.) | **« Dictionnaire de données V1.0 — première version, à soumettre à validation »** | « Dictionnaire V1.1 🔒 / gelé / consolidé » (MLD, CDC tech) |
| MLD V1.0 | `docs/GENIIUS_MLD_V1_0.md` (3 513 l., 246 tables) | **« première version, à soumettre à validation »** | « MLD V1.0 🔒 » (CDC tech) |
| CDC technique V1.0 | `docs/GENIIUS_CDC_TECHNIQUE_V1_0.md` | Non gelé | — |
| CDC technique (autres) | `docs/GENIIUS_CDC_TECHNIQUE_V1_0_CONSOLIDE_CANDIDAT.md` ; `GENIIUS_CDC_TECHNIQUE_V1_0_DETAILLE_CONSOLIDE.md` (racine) | Candidats non gelés | — |
| Avenant | `docs/AV-FONC/AV-FONC-001.md` | Non gelé, hors intégration | — |

Absents du dépôt mais cités comme sources ou preuves :
- `GENIIUS_DICTIONNAIRE_DONNEES_V1_1_CONSOLIDE.md` (source déclarée du MLD) ;
- `GENIIUS_RAPPORT_REEXECUTION_95_TESTS_MCD_V1_1.md` (supprimé au commit `863e70d`) ;
- `GENIIUS_RAPPORT_CRASH_TEST_MLD_V1_0.md` ;
- `CDCF_GENIIUS_V1.docx` (origine des identifiants A-01, K-01, CV-…).

## 3. Méthode

| Contrôle | Procédé |
|---|---|
| Statut et versions | Lecture des en-têtes, des annexes de statut (dictionnaire, annexes I et J) et de l'historique Git |
| Exhaustivité | Les 50 critères de recette du CDCF (§ 103), les sections à portée technique (§ 61–62, 64, 66–72, 82–99) et les 33 TECH, confrontés au MCD (§ 23, traçabilité des critères), au dictionnaire, au MLD et aux recettes |
| Traçabilité MCD → dictionnaire | Contrôle mécanique : les 125 règles `RG-*` du MCD sont **toutes** reprises dans le dictionnaire ✓ |
| Traçabilité dictionnaire → MLD | Contrôle mécanique : **92 des 245 règles `DI-*` ne sont citées nulle part dans le MLD**, puis sondage des règles sensibles (ECD-13) |
| Autorisations | Lecture croisée : CDCF § 49, 61, 62 ; MCD § 4.4–4.5 ; dictionnaire § 4.1, 4.9–4.10, DD-18 ; MLD § 5.2–5.3, § 22, CP-23 à CP-25 ; TECH-011 et TECH-027 ; REV-02-A ; REC-X09 à X11 |
| Cycle de vie | Versionnement (MLD § 4.2, CP-01), purge (DD-13, MLD-15, CP-16), fichiers (MLD § 6.3), filiation et conflits (MLD § 4.3, § 11), confrontés à TECH-003, 005, 012, 020 et AUDIT-TECH-002, 003, 006, 010 |
| Faisabilité | Pour chaque garantie TECH, recherche de la structure ou contrainte MLD qui la rend possible (recherche par termes et par identifiants) |
| Recette | Rattachement des critères CDCF et des TECH aux recettes `REC-*` du CDC technique (§ 8) |

**Limites.**
- L'audit porte sur les fichiers du dépôt à la date du rapport.
- Les règles `DI-*` non citées dans le MLD ont été sondées, pas toutes vérifiées une par une : une partie est probablement implémentée sans référence explicite. ECD-13 demande précisément de le démontrer.
- Aucun test logiciel n'a été exécuté.

---

## 4. Résultats par contrôle

### 4.1 Exhaustivité

- **Les 50 critères du CDCF § 103 sont tous rattachés à un mécanisme du MCD** (MCD § 23).
- 19 critères sont tracés de bout en bout. 31 sont partiellement tracés :
  - soit une règle `DI-*` n'est pas citée dans le MLD ;
  - soit aucune recette du CDC technique ne les vérifie : critères 5, 6, 13, 15, 16, 21, 22, 26, 27, 31–40, 42, 46, 49.
- Voir la matrice, § 2.
- **Garanties techniques sans exigence fonctionnelle d'origine** (ECD-19) : multi-surface, hors connexion, Desktop installé, synchronisation entre appareils (TECH-001, 002, 004, 005). Le CDCF ne les mentionne pas. Seul le § 95 évoque « gestion sessions/appareils ».
- **Exigences fonctionnelles à portée technique mal couvertes par le CDC technique** (ECD-26) :
  - URLs signées, hachage robuste (CDCF § 95) ;
  - biométrie appliquée aux photos (§ 33.2) ;
  - couche publique Web (§ 78).

### 4.2 Cohérence scientifique

**Conforme.** Les distinctions fondamentales sont préservées dans les cinq documents :

| Invariant | CDCF | MCD | Dictionnaire | MLD | CDC tech |
|---|---|---|---|---|---|
| Source ≠ mention ≠ assertion ≠ preuve | § 4, § 5.1 | Domaines C, D, G | DD-07, DI-D*, DI-G* | Tables séparées, CP-05, CP-07 | TECH-018.6, AUDIT-TECH-005 |
| Identification = hypothèse réversible | § 6, § 8.3 | RG-F04 | DI-F10 | `rapprochement`, CP-13 | AUDIT-TECH-010, L02 |
| Pas de vérité intrinsèque | § 49 (anti-pattern) | C2 | G.3 | MLD-09 | TECH-018.3 |
| Date incertaine non aplatie | § 9.1 | RG-P07 | DD-10, OB-19 | MLD-03, § 3.4 | TECH-018.6, 033.10 |
| Sources dépendantes ≠ indépendantes | § 112 | RG-C03 | DD-05, OB-18 | CP-09, `independance()` | L04 |
| Import ≠ validation | § 84 | RG-P05 | G.3 | CP-10, MLD-11 | TECH-010.3 |
| Proposition IA ≠ validation | § 52, § 94 | RG-A06 | DI-A10–A12, DD-15 | `activite` | TECH-017 |

Réserves :
- **ECD-29** : critères 29–32 et 35 sans `DI-*` citée dans le MLD.
- **ECD-21** : la version du référentiel scientifique n'est pas portée par les contributions.

### 4.3 Cohérence des données

- Le MLD implémente fidèlement le MCD sur le périmètre scientifique.
- Il **n'implémente aucune structure** pour plusieurs garanties du CDC technique :
  - hors connexion et synchronisation (ECD-05) ;
  - tâches asynchrones et états de migration (ECD-16) ;
  - authentification, sessions et appareils (ECD-17) ;
  - rôles d'exploitation de la plateforme (ECD-18) ;
  - états de conservation des fichiers (ECD-08) ;
  - registre de non-résurrection (ECD-09) ;
  - libellés multilingues (ECD-12).
- La question n'est pas toujours « ajouter au MLD ». Plusieurs de ces structures peuvent légitimement vivre dans un schéma technique décidé par ADR. **Encore faut-il le décider.** Aujourd'hui, aucune entrée du registre des décisions différées ne l'encadre (catégorie B4).

### 4.4 Autorisations

| Règle | CDCF | MCD | Dictionnaire | MLD | CDC tech | Verdict |
|---|---|---|---|---|---|---|
| Graphe accessible avant toute opération révélatrice | § 61, § 73 | P20 | OB-03, DI-B12 | § 22.3 | TECH-011.4, AUDIT-TECH-004 | **Conforme** |
| Interdiction prioritaire | § 62 | RG-B11 | DD-18, DI-B11 | § 22.2 étapes 1–2 | TECH-011.9 | **Conforme** |
| Absence et existence protégée indistinguables | — | RG-B11 | OB-04 | § 22.3 (API) | TECH-011.5 | **Conforme** |
| Aucune lecture implicite d'un rôle administratif | § 49.2 (autorité, non lecture) | Silencieux | Silencieux (DI-B04 : gouvernance seule) | § 22.1, CP-23 à CP-25, colonnes `nature_habilitation` et `lecture_scientifique` | TECH-011.10, 027.4, REV-02-A | **Cohérent, non contredit ; mais incomplet** : ECD-04, 14, 18, 22 |

**Exemple demandé — « aucun accès implicite d'un administrateur ».**
- La règle est **identique** dans le MLD (§ 22.1, CP-25) et dans le CDC technique (TECH-011.10, REV-02-A).
- **Aucun autre document ne la contredit.** Le MCD et le dictionnaire ne définissent pas de visibilité par défaut accordant une lecture aux administrateurs.
- Trois défauts subsistent :
  1. une **règle explicite** `regle_acces` peut viser le rôle d'espace `administrateur` et lui ouvrir la lecture, ce que REC-X11 (arbitrage A) interdit et que le MLD ne bloque pas (**ECD-04, bloquant**) ;
  2. CP-24 n'est pas exécutable, faute de champ distinguant une autorisation exceptionnelle (ECD-04) ;
  3. CP-25 cite « CDCF § 49.2 », qui traite de l'autorité historique et non de la lecture (ECD-22).

### 4.5 Cycle de vie

| Mécanisme | Verdict |
|---|---|
| Versionnement append-only (OB-01, CP-01, CP-22) | Conforme |
| Fusion et scission réversibles (RG-F04, `rapprochement`) | Conforme |
| Filiation sans synchronisation (RG-A03, DI-A22, `filiation`) | Conforme |
| Conflits d'édition en ligne (CDCF § 64, `conflit_edition` avec version de base) | Conforme |
| Conflits issus du hors ligne | **Non porté** (ECD-05) |
| Révocation des répliques locales | **Non porté** (ECD-05) |
| Propagation des impacts sans fenêtre de fausse certitude | **Partiel** (ECD-06) |
| Purge en place, tombstone | Conforme au dictionnaire ; **en tension** avec l'effacement légal des informations de résolution (ECD-10) et la déduplication binaire (ECD-07) |
| Restauration sans résurrection | **Non porté** (ECD-09) |

**Exemple demandé — réplique hors ligne.** Le modèle permet d'*exporter* un graphe accessible (MLD-14) et de *détecter un conflit* à partir d'une version de base (`conflit_edition.base_numero`). Il ne permet pas en l'état de construire et maintenir une réplique :
- aucun contexte d'évaluation de type « réplication » ou « synchronisation » (`contexte_evaluation.operation` et `canal`) ;
- aucune notion d'appareil ni de révocation par appareil ;
- aucune opération hors ligne portant un identifiant idempotent et sa version de base ;
- aucun état « reçue / intégrée / en attente / refusée » ;
- aucune politique de réplication par espace (durée hors ligne, interdiction, AUDIT-TECH-001) ;
- aucun mécanisme de diffusion des retraits (révocations, purges) vers les répliques.

Ce manque est l'écart **ECD-05 (bloquant)**.

### 4.6 Faisabilité

| Sens | Constats |
|---|---|
| Le CDC technique exige ce que le MLD ne permet pas | ECD-04, 05, 06, 07, 08, 09, 11, 12, 15, 21 |
| Le MLD impose ce que le CDC technique contredit ou n'a pas prévu | ECD-10 (aucune suppression physique d'objet, contre la possibilité d'effacer une information de résolution) ; ECD-07 (unicité globale des empreintes de fichiers, contre l'effacement et le cloisonnement des espaces) ; ECD-14 (objets privés créés par un traitement automatique sans auteur, donc lisibles par personne) |

### 4.7 Recette

- Les exigences critiques P0 du CDC technique ont toutes au moins un scénario de recette (REC-X09 à X14, TR05 à TR11, X12).
- **Écarts :**
  - 22 critères du CDCF § 103 n'ont aucune recette `REC-*` dédiée (matrice, § 2) ;
  - les doublons de recettes ne sont pas résolus (GEL-04) ;
  - plusieurs recettes P0 (X10-08, X12-03, X14-10) ne sont pas exécutables sur le modèle actuel tant que ECD-04, 05 et 06 restent ouverts.

---

## 5. Registre synthétique des écarts

Le détail (formulation actuelle, problème, correction, décision attendue) figure dans le [registre de corrections](GENIIUS_AUDIT_COHERENCE_V1_REGISTRE_CORRECTIONS.md).

### 5.1 Bloquants

| ID | Écart | Références | GEL |
|---|---|---|---|
| ECD-01 | Statut de gel de la chaîne non établi : le dictionnaire du dépôt est en V1.0 « à soumettre à validation » (REC-01 et REC-16 non faits) ; le MLD est « à soumettre à validation » et cite un dictionnaire V1.1 absent ; les rapports de tests ont été supprimés | Dictionnaire l. 1–7, annexes I et J ; MLD l. 1–8 ; CDC tech en-tête ; commit `863e70d` | GEL-01 |
| ECD-02 | Trois versions concurrentes du CDC technique, aux intitulés d'exigences divergents | `docs/…V1_0.md`, `docs/…CONSOLIDE_CANDIDAT.md`, `…DETAILLE_CONSOLIDE.md` | GEL-02, 03 |
| ECD-03 | Rupture de traçabilité : les recettes du CDC technique dérivent d'identifiants (A-01–A-04, K-01–K-03, S-01–S-04, CV-I/T/AT/CN) absents du CDCF du dépôt, qui utilise § n, CU-01–25, critères 1–50, Q113–Q245 ; aucune origine fonctionnelle par TECH | Échanges REV-03-D ; CDC tech § 8, § 10 ; CDCF § 101–104 | GEL-03 (M10-C08) |
| ECD-04 | Une règle d'accès explicite accordée au rôle `administrateur` ou `propriétaire` peut ouvrir la lecture des contenus `projet` ou `privé` ; CP-24 n'est pas exécutable | MLD § 5.3 `regle_acces.role_beneficiaire`, CP-24, CP-25 ; REC-X11 arbitrage A | GEL-05 |
| ECD-05 | Hors connexion et synchronisation : aucune structure (appareil, réplique, opération idempotente, version de base, états de réception, zone de réconciliation, politique de réplication) et aucune décision sur leur emplacement | TECH-002, 003, 005 ; AUDIT-TECH-001, 003 ; MLD (aucune occurrence) | GEL-07 |

### 5.2 Majeurs

| ID | Écart | Références | GEL |
|---|---|---|---|
| ECD-06 | Propagation asynchrone sans marqueur synchrone : fenêtre de fausse certitude | CP-21 ; REC-X12 arbitrage A, X12-03 | GEL-06 |
| ECD-07 | Empreinte de fichier unique au niveau global : la purge efface un fichier partagé, ou bien le conserve en violation de l'effacement ; canal de révélation entre espaces | MLD `fichier.empreinte UQ`, MLD-15 ; TECH-020.4 ; AUDIT-TECH-004 | GEL-07 |
| ECD-08 | Pas d'état de conservation des fichiers (confirmée, temporairement inaccessible, manquante, supprimée) ni de date de contrôle d'intégrité | MLD § 6.3 `fichier` ; AUDIT-TECH-006.2 et 6.9, 012.10 | GEL-07 |
| ECD-09 | Aucun registre de non-résurrection pour réappliquer les purges après restauration | AUDIT-TECH-002.9 ; TECH-020.5 ; REC-X19 | GEL-07 |
| ECD-10 | Tombstones permanentes contre l'effacement légal des informations de résolution | MLD-15, MLD-12 ; AUDIT-TECH-010.9–10, 002.10 | GEL-07 |
| ECD-11 | `consentement.portee` sans usage algorithmique ou IA, structuration, partage ni contribution scientifique | MLD § 5.5 ; L08 arbitrage E ; REC-J11 | — |
| ECD-12 | `concept.libelle` monolingue ; pas de langue préférée sur `compte` | MLD § 20.2, § 5.2 ; TECH-033.2 et 033.11 ; AUDIT-TECH-011.11 | GEL-08 |
| ECD-13 | 92 règles `DI-*` absentes du MLD, dont certaines P0 : protection des vivants (DI-E05, E06), embargo (DI-B20, B21), retrait de consentement (DI-B23, B24), diffusabilité des agrégats (DI-O12) | Dictionnaire annexe G.2 ; MLD § 25 | GEL-03 |
| ECD-14 | CP-23 accorde l'accès à « l'auteur » ; un objet privé créé par un traitement automatique sans acteur n'a aucun lecteur | CP-23 ; `activite.acteur_id` 0..1 ; `import` sans acteur | GEL-05 |
| ECD-15 | Pas de niveau « métadonnées seulement » pour l'historique de contributions après un départ | REV-02-D ; MLD `regle_acces.objet_protege` | GEL-05 |
| ECD-16 | Tâches asynchrones et migrations : pas d'identité, d'états, d'inventaire ni de manifeste structuré ; emplacement non décidé | TECH-010.5, 015.2–3 ; AUDIT-TECH-005.3 ; MLD `import [F]` | — |
| ECD-17 | Authentification, moyens multiples, sessions et appareils absents ; emplacement non décidé | CDCF § 95 ; TECH-007 ; MLD `compte` | — |
| ECD-18 | Rôles d'exploitation de la plateforme et accès exceptionnel du personnel GENIIUS non modélisés | TECH-027.2 et 027.5 ; `attribution_role` limitée à l'espace | GEL-05 |
| ECD-19 | Garanties multi-surface et hors ligne sans origine fonctionnelle dans le CDCF | TECH-001, 002, 004, 005 ; CDCF (absence) | GEL-03 |
| ECD-20 | Partage sélectif, réutilisation et projets multi-arbres non supportés : pas d'action `réutiliser`, pas de flux vers un projet, `ARBRE` limité à l'espace privé ou familial | MCD C5, D-10, D-45 ; REC-TR08 à TR11 ; AV-FONC-001 | Décision AV-FONC |
| ECD-21 | La version du référentiel scientifique n'est portée ni par les contributions, ni par les charges de synchronisation, ni par les exports | TECH-031.2, 031.3 et 031.14 ; AUDIT-TECH-003.1 ; MLD § 20.2 | GEL-06 |

### 5.3 Mineurs

| ID | Écart |
|---|---|
| ECD-22 | CP-23 à CP-25 citent « CDCF § 49.2 », qui porte sur l'autorité historique et non sur la lecture |
| ECD-23 | DI-B04 (« au moins un propriétaire ou administrateur ») ne correspond pas à l'arbitrage B de REC-X10 (« dernier propriétaire non retirable sans transfert ») |
| ECD-24 | Le MLD compte 246 tables ; le rapport de crash-test en annonçait 247 (rapport absent du dépôt) |
| ECD-25 | Le domaine D-48 n'a pas de niveau « consultation » ; `export` ne porte ni rapport de conversion ni versions de référentiel |
| ECD-26 | Exigences CDCF § 95 (URLs signées, hachage robuste), § 33.2 (biométrie sur photos) et § 78 (couche publique) non explicites dans le CDC technique |
| ECD-27 | DI-E06 (présomption de personne vivante à 120 ans) dépend du temps, mais aucun recalcul n'est prévu (`regime_protection` figé) |
| ECD-28 | Les colonnes `nature_habilitation` et `lecture_scientifique` ajoutées au MLD ne figurent ni au dictionnaire ni au MCD (alignement éditorial, annexe C) |

### 5.4 Améliorations

| ID | Proposition |
|---|---|
| ECD-29 | Citer explicitement dans le MLD les règles des critères 29–32 et 35 (DI-G07, DI-O11, DI-H04) |
| ECD-30 | Rattacher les recettes du CDC technique aux 50 critères du CDCF et aux CU-01–25, et créer les recettes manquantes |
| ECD-31 | Confirmer la visibilité par défaut `privé` dans les espaces projet : avec CP-25, les objets des collaborateurs sont invisibles à l'équipe tant qu'ils ne sont pas passés en `projet` |
| ECD-32 | Résoudre les doublons de recettes listés au § 8.15 du CDC technique |

---

## 6. Effet sur les conditions de gel

| Condition | Écarts concernés | État après audit |
|---|---|---|
| GEL-01 Version normative unique du MLD (et de la chaîne) | ECD-01 | **Non levée** ; élargie à toute la chaîne |
| GEL-02 Intégration REV-03 | ECD-02 | Non levée |
| GEL-03 Consolidation des 33 TECH | ECD-02, 03, 13, 19 | Non levée |
| GEL-04 Recettes | ECD-30, 32 | Non levée |
| GEL-05 Autorisations | ECD-04, 14, 15, 18 | **Non levée — écart bloquant** |
| GEL-06 Propagation | ECD-06, 21 | Non levée |
| GEL-07 Résilience patrimoniale | ECD-05, 07, 08, 09, 10 | **Non levée — écart bloquant** |
| GEL-08 Exigences non fonctionnelles | ECD-12 | Non levée |

---

## 7. Préparation à l'architecture — conditions de passage

L'entrée en architecture est recommandée lorsque les conditions suivantes sont remplies :

1. **Chaîne normative fixée** : une version de référence identifiée et datée par document, avec les preuves de gel (ECD-01, 02).
2. **Traçabilité CDCF établie** : un référentiel d'identifiants commun au CDCF et au CDC technique (ECD-03).
3. **Emplacement des structures techniques décidé** : registre des décisions différées complété, avec pour chacune « MLD scientifique » ou « schéma technique par ADR » (ECD-05, 16, 17, 18).
4. **Règles P0 rendues exécutables** : ECD-04 et ECD-14 corrigés dans le MLD, ou acceptés par une décision tracée avec contrôle de substitution.
5. **Décision sur le périmètre d'AV-FONC-001** : V1 ou ultérieure (ECD-20).

Les autres écarts majeurs peuvent être traités pendant l'architecture et le MPD, à condition d'être inscrits au registre des décisions différées avec leur invariant (REV-03-C).

---

## 8. Conformités vérifiées

Ces points ont été contrôlés et ne demandent aucune action :
- graphe accessible ;
- interdiction prioritaire ;
- réponses indistinguables ;
- séparation compte / acteur / personne (DD-07, MLD § 5.2, TECH-007.1) ;
- import et réimport idempotents (MLD-11, OB-10, TECH-010.6) ;
- filiation sans synchronisation (RG-A03, DI-A22, REC-A02) ;
- conflits d'édition en ligne (CDCF § 64, `conflit_edition`, TECH-003.3) ;
- traçabilité de l'IA (`activite` : moteur, version, fournisseur, données transmises ; OB-15 ; TECH-017.4) ;
- dates incertaines (MLD-03, OB-19) ;
- indépendance des preuves (OB-18, CP-09) ;
- lecture aveugle (CP-19) ;
- accès temporaires (CP-20, OB-16) ;
- manifestes d'export et exclusions (MLD-14) ;
- synchronisation externe hors périmètre (CDCF § 85, cohérente avec REC-TR11-11) ;
- reprise des 125 règles `RG-*` du MCD dans le dictionnaire.

---

## 9. Suivi des corrections

| Date | Écart | Action | Effet |
|---|---|---|---|
| 09/10/2026 | ECD-01 | Création du [registre des versions normatives](../GENIIUS_REGISTRE_VERSIONS_NORMATIVES.md) ; restauration du rapport des 95 tests ; contrôle REC-01 conforme ; en-têtes alignés | **Partiellement levé** : la chaîne de référence est désignée. Le gel du dictionnaire (REC-16), le gel du MLD et le procès-verbal du CDCF restent à faire. |
| 09/10/2026 | ECD-02 | Version de référence désignée ; deux variantes et la trace des échanges archivées dans `docs/archives/cdc-technique/` | **Levé** |
| 09/10/2026 | ECD-03 | Annexe D du CDC technique : correspondance des identifiants et origine fonctionnelle des 33 TECH. Le constat initial a été rectifié : les identifiants ne figuraient que dans les échanges, pas dans le texte normatif. | **Levé** ; les exigences à justification technique sont renvoyées à ECD-19 |
| 09/10/2026 | REC-16 (ECD-01) | [Contrôle REC-16](../GENIIUS_DICTIONNAIRE_REC16_COUVERTURE_95_TESTS.md) : 95/95 tests couverts au niveau du dictionnaire (86 par règle, 9 par attribut ou domaine) | Conditions formelles du gel du dictionnaire remplies ; gel à prononcer |
| 09/10/2026 | ECD-04 | MLD : `regle_acces.nature` et `fondement`, CK CP-26 et CP-24, `contexte_evaluation.regle_acces_id`. Dictionnaire : DI-B29, DI-B30, OB-22 | **Levé** ; vérification globale GEL-05 restante |
| 09/10/2026 | ECD-05 | Décision d'emplacement. MLD : `contribution_differee`, politique de réplication, CP-27, CP-28, ST-01 à ST-08. Dictionnaire : § 4.25, DI-B31 à B33, OB-20, OB-21 | **Levé** ; l'arbitrage « retraits non qualifiés » est à confirmer |
| 09/10/2026 | ECD-33 (nouveau) | Tension entre MLD V-5 et REC-TR07 | Majeur, ouvert |

**Bloquants ouverts après ces corrections :** aucun. Reste le reliquat non bloquant d'ECD-01 : prononcer le gel du dictionnaire, puis geler le MLD après traitement des majeurs.
