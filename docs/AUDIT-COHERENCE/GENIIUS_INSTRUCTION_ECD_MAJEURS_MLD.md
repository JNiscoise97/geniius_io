# GENIIUS — Instruction des écarts majeurs avant le gel du MLD

**Date :** 10 octobre 2026
**Objet :** instruire un par un les écarts majeurs ECD-06 à ECD-21 et ECD-33 du [registre de corrections](GENIIUS_AUDIT_COHERENCE_V1_REGISTRE_CORRECTIONS.md), sans présumer qu'ils sont tous bloquants. Pour chacun :
- ce qu'il bloque réellement ;
- des options ;
- une recommandation.

La décision appartient au porteur.
**Référence MLD :** MLD V1.1 candidat (`docs/GENIIUS_MLD_V1_0.md`), qui intègre le MCD V1.2 et le dictionnaire V1.2 gelés.

## 1. Critère de tri

| Catégorie | Signification | Effet sur le gel du MLD |
|---|---|---|
| **S — Structure MLD** | Il manque une table, une colonne, une contrainte ou une règle du MLD | **Bloquant** : à corriger avant gel |
| **T — Schéma technique** | La structure relève du schéma technique choisi par ADR ; le MLD doit seulement porter une obligation (`ST-*`) | Non bloquant **si** l'obligation est écrite dans le MLD |
| **F — Fonctionnel** | La question porte sur le CDCF, pas sur le MLD | Non bloquant pour le MLD ; bloquant pour le gel du CDCF ou du CDC technique |
| **R — Résolu** | Déjà traité par une décision ultérieure | Clôture à constater |

## 2. Synthèse

| ECD | Sujet | Catégorie | Bloque le gel du MLD ? | Recommandation |
|---|---|---|---|---|
| 06 | Fausse certitude pendant la propagation | S | Oui | Option 1 : dépendances directes marquées dans la même transaction |
| 07 | Déduplication des fichiers, purge, cloisonnement | S | Oui | Unicité par espace pour l'identité ; stockage mutualisé invisible, purge à la dernière référence |
| 08 | États de conservation des fichiers | S | Oui | Accepter `etat_conservation` et `date_dernier_controle` |
| 09 | Non-résurrection après restauration | T | Non, si ST-12 écrite | Registre des purges hors du périmètre restauré (ST-12) |
| 10 | Tombstones et effacement légal | S + validation juridique | Oui, pour la structure | Tombstone minimale, existence protégée par défaut, mode « effacement de résolution » ; seuils juridiques en EXT |
| 11 | Consentement à l'usage algorithmique | S | Oui | Étendre `consentement.portee` et ajouter une CP de blocage |
| 12 | Libellés multilingues, langue préférée | S | Oui | `concept_libelle` et `compte.langue_preferee` |
| 13 | 92 règles DI non citées dans le MLD | S | Oui | Traité par l'audit de conformité (étape 3) : une ligne par DI |
| 14 | Objets privés sans auteur | S (P0) | Oui | Acteur déclencheur obligatoire ; `import.acteur_id` |
| 15 | Historique de contributions après un départ | S | Oui | Option 1 : vue « mes contributions » limitée aux métadonnées |
| 16 | Tâches techniques, migrations | T | Non, si ST-13 écrite | Schéma technique ; obligation de manifeste d'import (ST-13) |
| 17 | Authentification, sessions, appareils | T | Non, si ST-14 écrite | Schéma d'identité par ADR ; ST-01 et ST-09 déjà écrites, compléter par ST-14 |
| 18 | Rôles d'exploitation de la plateforme | T + S léger | Non, si ST-15 écrite | Rôles de plateforme dans le schéma technique ; aucun accès aux données hors CP-24 |
| 19 | Multi-surface et hors ligne sans origine fonctionnelle | F | Non | Avenant AV-FONC-002, à ouvrir après le gel du MLD |
| 20 | Partage sélectif, réutilisation, multi-arbres | R | Non | Clôturer : traité par AV-FONC-001 jusqu'au MLD V1.1 |
| 21 | Version du référentiel sur les contributions | S | Oui | Version du conteneur `referentiel` sur l'activité de création et dans les exports |
| 33 | Réutilisations publiques d'une entité du Core | S léger | Oui (formulation) | Reformuler V-5 ; calcul sur le graphe accessible public ; test TR07-02 |

**Bilan :**
- **11 écarts bloquants** (S) : 06, 07, 08, 10, 11, 12, 13, 14, 15, 21, 33 ;
- **4 non bloquants** pour le MLD, à condition d'écrire leur obligation (T) : 09, 16, 17, 18 ;
- **1 fonctionnel** (F) : 19 ;
- **1 résolu** (R) : 20.

## 3. Instruction détaillée

### ECD-06 — Fausse certitude pendant la propagation

- **Constat :** entre l'écriture d'un amont et le traitement asynchrone, les dépendances restent `inchangé`. Un lecteur ne peut pas savoir qu'une propagation est en attente (X12-03 non vérifiable).
- **Options :**
  1. Marquer **dans la même transaction** les dépendances **directes** (`potentiellement affecté`) ; seule la propagation transitive reste asynchrone.
  2. Ajouter un indicateur de propagation en attente, consulté à la lecture.
- **Recommandation : option 1.** Pas de nouvelle structure ; vérifiable par un test simple ; le niveau 1 est la dépendance la plus visible. Pour les niveaux suivants, un compteur de propagation en attente par objet amont (dérivé) peut compléter si la recette X12-03 l'exige au-delà du niveau 1.
- **Correction MLD :** CP-21 réécrite.

### ECD-07 — Déduplication des fichiers, purge et cloisonnement

- **Constat :** `fichier.empreinte UQ` globale. Une purge dans un espace efface un binaire utilisé ailleurs, ou le garde en violation de l'effacement. Une déduplication perceptible révèle qu'un document existe ailleurs.
- **Options :**
  1. Unicité par `(espace, empreinte)`, sans mutualisation.
  2. Unicité par `(espace, empreinte)` pour l'identité ; stockage physique mutualisé par une clé de stockage distincte, avec comptage de références.
- **Recommandation : option 2**, avec trois règles :
  - la déduplication n'est **jamais observable** d'un espace à l'autre : même délai, même message, même quota décompté ;
  - la purge d'un `fichier` d'un espace retire sa référence ; le binaire n'est effacé qu'à la dernière référence. L'effacement légal porte sur les données de l'espace demandeur ; la copie d'un autre espace est une donnée de cet espace ;
  - l'empreinte sert au contrôle d'intégrité, la clé de stockage à l'emplacement.
- **Correction MLD :** `fichier` : UQ `(espace, empreinte)` ; `cle_stockage` ; nouvelle CP.

### ECD-08 — États de conservation des fichiers

- **Recommandation : accepter.**
  - `fichier.etat_conservation` {en réception, confirmé, temporairement inaccessible, manquant, corrompu, purgé} et `date_dernier_controle`.
  - CP : un fichier `master` n'est exploitable scientifiquement que `confirmé`.
- **Correction :** MLD § 6.3 ; le dictionnaire § 5.8 passe par la procédure de changement (écart †).

### ECD-09 — Non-résurrection après restauration

- **Recommandation :** schéma technique (T).
  - **Obligation ST-12 :** un registre des purges (identifiant de l'objet, date, fondement minimal) est conservé hors du périmètre des sauvegardes restaurées ; il est réappliqué systématiquement après toute restauration, avant remise en service ; son contenu est minimisé.
- Non bloquant pour le MLD dès que ST-12 est écrite.

### ECD-10 — Tombstones et effacement légal

- **Constat :** le MLD interdit de supprimer ce que l'effacement légal peut imposer de supprimer, et la tombstone révèle qu'un objet a existé.
- **Recommandation :**
  - **Tombstone minimale :** identifiant, `type_objet`, `est_purge`, `date_purge`, `etat_cycle_vie`.
  - **Existence protégée par défaut :** la résolution d'un identifiant purgé d'un espace non public répond comme « inexistant » (OB-04), sauf au propriétaire de l'espace.
  - **Mode « effacement de résolution » :** sur fondement légal, `espace_id` est remplacé par un espace technique neutre (« purgé ») et `date_creation` est vidée. Seul l'identifiant subsiste, pour empêcher sa réattribution.
  - Les seuils et cas d'usage du mode d'effacement sont soumis à l'étude juridique (nouvel EXT-04).
- **Bloquant pour la structure** (`objet.espace_id` doit pouvoir pointer l'espace neutre ; `date_creation` devient nullable sous condition).

### ECD-11 — Consentement à l'usage algorithmique

- **Recommandation : accepter.**
  - Étendre `consentement.portee` : `structuration`, `partage`, `contribution scientifique`, `usage algorithmique`, `transmission à un prestataire externe`.
  - CP : une `activite` assistée ou automatique dont `fournisseur` est renseigné ne prend en entrée aucun objet couvert par un consentement `usage algorithmique` refusé ou retiré.
- **Correction :** MLD § 5.5 ; dictionnaire § 4.17 par la procédure de changement.

### ECD-12 — Libellés multilingues et langue préférée

- **Recommandation : accepter.**
  - Table `concept_libelle(concept_id, langue, libelle, definition)`, PK `(concept_id, langue)`, avec une langue de référence par référentiel.
  - `compte.langue_preferee`.
  - La définition scientifique de référence reste unique ; les traductions sont des représentations identifiées de cette définition.

### ECD-13 — Traçabilité dictionnaire → MLD

- **Recommandation :** l'intégrer à l'**audit de conformité** (étape 3 de ta séquence).
  - Une ligne par règle `DI-*`, avec sa réalisation : table, CK, CP, ou « hors MLD » justifié.
  - Une CP dédiée et une recette pour DI-E05, DI-E06, DI-B20, DI-B21 et DI-B24.
- C'est le préalable explicite au gel.

### ECD-14 — Objets privés sans auteur

- **Recommandation : accepter (P0).**
  - CP-23 étendue : l'auteur est l'acteur **déclencheur** de l'activité de création. Une activité qui crée un objet `privé` porte toujours un acteur déclencheur, y compris pour un traitement automatique.
  - Ajouter `import.acteur_id`.

### ECD-15 — Historique de contributions après un départ

- **Options :**
  1. Une vue « mes contributions », limitée aux métadonnées.
  2. Une portée `métadonnées` dans `objet_protege`.
- **Recommandation : option 1.** Elle ne modifie pas le modèle de droits, déjà chargé (V-10).
  - La vue repose sur `activite.acteur_id` et `credit`.
  - Une CP exclut le contenu, les objets dont l'existence est protégée pour l'intéressé et les métadonnées non communicables.

### ECD-16 — Tâches techniques et migrations

- **Recommandation :** schéma technique (T), pour les tâches, leurs tentatives et l'orchestration.
  - **Obligation ST-13 :** toute migration ou tout import produit un manifeste structuré (fichiers et empreintes, transformations, erreurs, éléments en attente), rattaché à l'`import` ; le résultat scientifique suit le modèle (activité, version).

### ECD-17 — Authentification, sessions, appareils

- **Recommandation :** schéma d'identité technique par ADR (T).
  - ST-01 (appareil révocable) et ST-09 (invitation) existent déjà.
  - **Obligation ST-14 :** moyens d'authentification multiples, MFA, sessions révocables, réauthentification pour les actes sensibles (transfert, révocation, export), aucune donnée biométrique stockée.

### ECD-18 — Rôles d'exploitation de la plateforme

- **Recommandation :** les rôles de plateforme (exploitation, support, sécurité, déploiement) relèvent du schéma technique (T). Ils ne donnent **aucun** accès aux données métier.
  - **Obligation ST-15 :** tout accès du personnel à un contenu passe par une habilitation exceptionnelle CP-24, nominative et journalisée, donnée à un `acteur_geniius` du personnel.
- Non bloquant dès que ST-15 est écrite.

### ECD-19 — Multi-surface et hors ligne sans origine fonctionnelle

- **Recommandation :** ouvrir l'avenant **AV-FONC-002** après le gel du MLD. Les structures existent déjà (CP-27, CP-28, ST-01 à ST-08) ; il manque leur origine dans le CDCF.
- Non bloquant pour le MLD ; bloquant pour le gel du CDCF et du CDC technique.

### ECD-20 — Partage sélectif et projets multi-arbres

- **Constat :** décision du 9/10/2026, option A. Traité par AV-FONC-001 :
  - CDCF V1.2 ;
  - MCD V1.2 gelé (concept A, 173 contrôles) ;
  - dictionnaire V1.2 gelé (DD-21, REC-16) ;
  - MLD V1.1 (`selection_partage`, CP-29, CP-33).
- **Recommandation :** **clôturer**, sous réserve que l'audit de conformité (étape 3) confirme CP-29 et CP-33.

### ECD-21 — Version du référentiel sur les contributions

- **Recommandation : accepter.**
  - La version du conteneur `referentiel` (manifeste DD-01) est « la version du référentiel ».
  - `activite` de création : `referentiel_id` et `referentiel_numero`.
  - Les versions de référentiel figurent dans le manifeste d'export.
  - `contribution_differee` les porte déjà.

### ECD-33 — Réutilisations publiques d'une entité du Core

- **Recommandation : accepter la formulation.**
  - V-5 : « le Core ne connaît que les réutilisations publiques ».
  - Calcul sur le graphe accessible du lecteur, limité aux `rapprochement` et `reference_inter_espace` dont l'espace et le lien sont publiquement visibles.
  - Test TR07-02.

## 4. Suite proposée

1. **Décision du porteur** sur les 17 recommandations, en bloc ou par exception.
2. **Correction du MLD** pour les 11 écarts bloquants, et écriture de ST-12 à ST-15. Les ajouts d'attributs (ECD-08, 11, 12, 14, 21) passent par une procédure de changement du dictionnaire (V1.3), à faire avant le gel du MLD pour que le MLD reste traçable.
3. **Audit de conformité contradictoire** du MLD au dictionnaire et aux invariants du MCD :
   - priorité au contrôle d'accès (§ 22, CP-23 à CP-26, CP-29, CP-30, CP-40) ;
   - inclut ECD-13 ;
   - traçabilité de chaque écart et de sa résolution.
4. Correction des anomalies trouvées, puis gel du MLD.

## 5. Décisions du porteur (10/10/2026)

*Le porteur valide les orientations par catégorie telles que présentées. La validation détaillée de chaque écart reste à vérifier sur les corrections intégrées. Ce fichier, non encore versionné, n'était pas accessible au relecteur du porteur.*

| Écarts | Décision | Condition |
|---|---|---|
| 06, 07, 08, 10, 11, 12, 13, 14, 15, 21, 33 | Corrections bloquantes retenues | Intégration et traçabilité démontrées avant gel |
| 09, 16, 17, 18 | Report au schéma technique et au MPD accepté | ST-12 à ST-15 normatives et vérifiables |
| 19 | Orientation CDCF (AV-FONC-002) acceptée | Traçabilité explicite ; le besoin n'est pas considéré comme résolu |
| 20 | Clôture de principe acceptée | Vérifier la référence exacte à AV-FONC-001 et sa couverture |

**Arbitrages particuliers :**

- **ECD-06 — validé.**
  - Les dépendances directes sont marquées dans la transaction du changement ; la propagation transitive reste asynchrone.
  - Les résultats dérivés ne sont jamais présentés comme définitivement à jour pendant la propagation.
  - Idempotence : un échec de traitement ne fait jamais disparaître un état d'impact.
- **ECD-07 — validé.**
  - Identité logique propre à chaque espace ; stockage physique éventuellement mutualisé ; binaire effacé seulement sans référence légitime restante.
  - **Réserves :**
    - aucune observabilité d'un fichier identique dans un autre espace : ni interface, ni API, ni temps de réponse exploitable ;
    - une purge légalement obligatoire n'est jamais empêchée par la mutualisation.
  - Le MPD démontrera la compatibilité entre déduplication, isolation, chiffrement et effacement.
- **ECD-10 — validé sous réserve.**
  - Trace minimale protégée et « effacement de résolution ».
  - Les seuils juridiques sont différés, pas l'obligation de sécurité. Le MLD prévoit dès maintenant qu'une trace résiduelle ne peut ni reconstituer des données purgées, ni révéler l'existence de l'objet à un non-habilité.
  - Aucune durée arbitraire n'est inscrite dans le modèle : l'étude juridique fixe les conditions.
- **ECD-15 — validé avec restriction.**
  - Vue « mes contributions » limitée aux métadonnées.
  - La qualité d'auteur ne confère pas de droit de consultation permanent sur un espace quitté.
  - La vue distingue l'attribution légitimement conservée des contenus, titres, références ou métadonnées dont la divulgation révélerait des éléments protégés.
  - Un auteur conserve sa paternité scientifique, pas nécessairement l'accès à l'espace.
- **V-7 (CP-39)** et **V-10 (CP-40)** : approuvés avec précisions, intégrées au MLD (§ 21.2, § 29.1).

**Séquence décidée :**
1. Dictionnaire V1.3, par la procédure de changement : attributs d'ECD-08, 11, 12, 14 et 21.
2. MLD candidat corrigé : les 11 écarts, CP-39, CP-40, ST-12 à ST-15.
3. Audit contradictoire par un agent séparé, en aveugle partiel.
4. Instruction des constats par l'auteur du MLD, sans clôture unilatérale.
5. Recettes documentaires.
6. Décision de gel.

Le dictionnaire V1.3 doit être validé comme référence normative avant le gel du MLD ; les deux documents sont préparés conjointement.

**Statut :** MLD non gelé ; MPD non engagé.
