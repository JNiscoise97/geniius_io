# GENIIUS — Registre des versions normatives

**Date de création :** 9 octobre 2026 (correction ECD-01 et ECD-02 de l'[audit de cohérence V1](08_AUDIT_COHERENCE/RAPPORT_AUDIT_COHERENCE_V1.md))
**Rôle :** désigner, pour chaque document de la chaîne GENIIUS, **le** fichier de référence, sa version, son statut et la preuve de ce statut.

> **Règles.**
> - Seul un fichier inscrit ici fait référence.
> - Un statut « gelé » exige une preuve versionnée dans le dépôt. Une affirmation dans un autre document ne suffit pas.
> - Toute modification d'un document gelé suit la procédure de changement (CDC technique, § 13) et met à jour ce registre.

## 1. Chaîne documentaire

| Ordre | Document | Fichier de référence | Version | Statut | Preuve du statut |
|---|---|---|---|---|---|
| 1 | Cahier des charges fonctionnel | [CDCF](01_CDCF/GENIIUS_CDCF.md) | **V1.3** (13/10/2026) = V1.2 + DC-CDCF-01 | **RÉFÉRENCE — gel global non prononcé** | [Décision de cohérence et gel CDC](06_CDC_TECHNIQUE/preuves/PROCES_VERBAL_GEL_CDC_V1_2.md) : § 122.2/critère 55 alignés V1.6, ratification technique § 135 ; [V1.2 archivée](01_CDCF/historique/GENIIUS_CDCF_V1_2_AVANT_DC_CDCF_01.md) |
| 2 | Modèle conceptuel de données | [`docs/02_MCD/GENIIUS_MCD.md`](02_MCD/GENIIUS_MCD.md) | **V1.2 canonique** (9/10/2026) : V1.1 + concepts A à G et invariants P23 à P25 (AV-FONC-001). La V1.1 (7/10/2026) est remplacée, consultable dans l’historique Git (commit `423991c`) | **GELÉ le 9/10/2026** (décision du porteur) — baseline conceptuelle | V1.1 : [`docs/02_MCD/preuves/RAPPORT_REEXECUTION_95_TESTS_MCD_V1_1.md`](02_MCD/preuves/RAPPORT_REEXECUTION_95_TESTS_MCD_V1_1.md), § 9 ; condition de maintien du gel au § 10. V1.2 : [`docs/02_MCD/preuves/RAPPORT_REEXECUTION_173_CONTROLES_MCD_V1_2.md`](02_MCD/preuves/RAPPORT_REEXECUTION_173_CONTROLES_MCD_V1_2.md) : 159 PASS, 14 PASS SOUS CONDITION, 0 FAIL ; gel prononcé le 9/10/2026 |
| 3 | Dictionnaire de données | [`docs/03_DICTIONNAIRE/GENIIUS_DICTIONNAIRE_DONNEES.md`](03_DICTIONNAIRE/GENIIUS_DICTIONNAIRE_DONNEES.md) | **V1.3**, DC-DICT-02/03, validation du 12/10/2026 ; V1.2 gelée historique | **VALIDÉ DOCUMENTAIREMENT — référence amont**, gel formel non prononcé | [Dossier de validation](03_DICTIONNAIRE/preuves/DOSSIER_VALIDATION_DICTIONNAIRE_MLD_V1_3.md), deux recontrôles indépendants, 304 DI localisées, 60 CP-13 énoncées ; limites explicites |
| 4 | Modèle logique de données | [`docs/05_MLD/GENIIUS_MLD.md`](05_MLD/GENIIUS_MLD.md) et [catalogue autorisations](05_MLD/GENIIUS_MLD_AUTORISATIONS.md) | **V1.1-g stabilisé** (12/10/2026), inventaire actuel hors miroirs ; ancien total 271 historique | **STABILISÉ — candidat au gel**, non gelé | [Registre de clôture](05_MLD/preuves/REGISTRE_CLOTURE_CONSTATS_V1_3.md), [contrôles reproductibles](05_MLD/preuves/CONTROLES_STRUCTURELS_V1_3.json), avis indépendants favorables ; recette MPD/logiciel réservée |
| — | Contrat d’autorisation | [`docs/04_CONTRAT_AUTORISATION/GENIIUS_CONTRAT_AUTORISATION.md`](04_CONTRAT_AUTORISATION/GENIIUS_CONTRAT_AUTORISATION.md) | **V1.6**, P-1 à P-3 validés le 12/10/2026 | **GELÉ le 12/10/2026 — contrat comportemental, réserves §§ 16 et 17.3** | Contrôles indépendants [A](04_CONTRAT_AUTORISATION/preuves/CONTROLE_CLOTURE_TEXTE_MODELE_V1_6.md) et [B](04_CONTRAT_AUTORISATION/preuves/CONTROLE_CLOTURE_COUVERTURE_V1_6.md) ; [dossier de clôture et procès-verbal](04_CONTRAT_AUTORISATION/preuves/DOSSIER_CLOTURE_AUTORISATIONS_V1_6.md) : 465 tests OK, 252/260 mutations, huit justifications acceptées et choix métier ratifiés |
| — | Amendement temporel autorisation/CDC | [DC-AUTH-01](04_CONTRAT_AUTORISATION/GENIIUS_AMENDEMENT_TEMPOREL_DC_AUTH_01.md) | V1.6 + DC-AUTH-01 (13/10/2026) | **RATIFIÉ — changement ciblé ; baselines gelées conservées** | Réponse explicite du porteur, règle et impacts dans le dossier ; [PT01](07_ARCHITECTURE/preuves/RAPPORT_PROTOTYPE_PT01.md), treize scénarios SQL réussis |
| 5 | CDC technique | [CDC](06_CDC_TECHNIQUE/GENIIUS_CDC_TECHNIQUE.md) et [recettes](06_CDC_TECHNIQUE/GENIIUS_CDC_TECHNIQUE_RECETTES.md) | **V1.2** (13/10/2026) | **GELÉ DOCUMENTAIREMENT**, reports encadrés | [Procès-verbal](06_CDC_TECHNIQUE/preuves/PROCES_VERBAL_GEL_CDC_V1_2.md), huit conditions levées, [contrôles](06_CDC_TECHNIQUE/preuves/CONTROLES_CDC_TECHNIQUE_V1_2.json), [empreintes baseline](06_CDC_TECHNIQUE/preuves/PREUVES_GEL_CDC_V1_2.json) |
| — | Avenant fonctionnel | [`docs/01_CDCF/avenants/AV_FONC_001.md`](01_CDCF/avenants/AV_FONC_001.md) | Dossier d'avenant | **Figé le 9/10/2026** (AV-1 à AV-12) ; intégré au CDCF V1.2 (étape 2) ; étapes 3 à 7 à mener | Décision du porteur (AV-FONC-001, § 12) |
| — | Audit de cohérence | [`docs/08_AUDIT_COHERENCE/`](08_AUDIT_COHERENCE/) | V1 (9/10/2026) | Rapport de contrôle | — |
| 6 | Architecture — modules et transactions du Core | [Dossier](07_ARCHITECTURE/GENIIUS_ARCHITECTURE_02_CORE_MODULES_TRANSACTIONS.md) et [matrices](07_ARCHITECTURE/GENIIUS_ARCHITECTURE_03_CORE_MATRICES.md) | **V0.1** (13/10/2026), ADR-CORE-001 | **CANDIDAT — non gelé** | [Contrôles documentaires](07_ARCHITECTURE/preuves/CONTROLES_CORE_V0_1.json) : 14 modules, 327 tables attribuées, 53 CP, 60 obligations CP-13, 17 transactions et 13 scénarios spécifiés ; preuves de concurrence/MPD à réaliser |
| 6.1 | Architecture — autorisations, isolation et concurrence | [Dossier](07_ARCHITECTURE/GENIIUS_ARCHITECTURE_04_AUTORISATIONS_ISOLATION_CONCURRENCE.md) | **V0.1** (13/10/2026), ADR-CORE-002 à 004 | **CANDIDAT — non gelé** | [Contrôles documentaires](07_ARCHITECTURE/preuves/CONTROLES_SECURITE_V0_1.json) ; douze scénarios spécifiés, cinq preuves de mécanisme ouvertes, aucune preuve SQL revendiquée |
| 6.2 | Architecture — synchronisation, compatibilité et horloge locale | [Dossier](07_ARCHITECTURE/GENIIUS_ARCHITECTURE_05_SYNCHRONISATION_COMPATIBILITE_HORLOGE.md) | **V0.1** (13/10/2026), ADR-CORE-005 à 007 | **CANDIDAT — non gelé** | [Contrôles documentaires](07_ARCHITECTURE/preuves/CONTROLES_SYNCHRONISATION_V0_1.json) ; sept phases, douze scénarios spécifiés, sept décisions ouvertes ; aucune preuve OS/transport revendiquée |
| 6.3 | Architecture — persistance, conservation et restauration | [Dossier](07_ARCHITECTURE/GENIIUS_ARCHITECTURE_06_PERSISTANCE_CONSERVATION_RESTAURATION.md) | **V0.1** (13/10/2026), ADR-CORE-008 à 011 | **CANDIDAT — non gelé** | [Contrôles documentaires](07_ARCHITECTURE/preuves/CONTROLES_PERSISTANCE_V0_1.json) ; cinq phases de dépôt, sept de restauration, douze scénarios spécifiés et sept décisions ouvertes ; RPO/RTO non mesurés |
| 6.4 | Architecture — exécution asynchrone, propagation et dimensionnement | [Dossier](07_ARCHITECTURE/GENIIUS_ARCHITECTURE_07_ASYNCHRONE_PROPAGATION_DIMENSIONNEMENT.md) | **V0.1** (13/10/2026), ADR-CORE-012 à 014 | **CANDIDAT — non gelé** | [Contrôles documentaires](07_ARCHITECTURE/preuves/CONTROLES_ASYNCHRONE_V0_1.json) ; six phases, douze scénarios spécifiés et sept décisions ouvertes ; MPD-04 non fixé, capacité non mesurée |
| 6.5 | Architecture — consolidation, déploiement et alternatives | [Registre](07_ARCHITECTURE/GENIIUS_ARCHITECTURE_10_REGISTRE_DECISIONS.md), [déploiement](07_ARCHITECTURE/GENIIUS_ARCHITECTURE_08_DEPLOIEMENT.md), [alternatives](07_ARCHITECTURE/GENIIUS_ARCHITECTURE_09_ALTERNATIVES_TECHNOLOGIQUES.md) | **V0.1** (13/10/2026), ADR-CORE-015/016 | **CANDIDAT — non gelé**, pile non ratifiée | [Contrôles](07_ARCHITECTURE/preuves/CONTROLES_CONSOLIDATION_V0_1.json) : 64 références liées, deux variantes d’exploitation, six prototypes spécifiés et sources officielles ; aucune preuve de déploiement/capacité/coût acquise |

**Correspondance des appellations.** Les documents désignent parfois un même fichier par un autre nom. Le tableau ci-dessous fait foi.

**Prototype PT01 — état au 13/10/2026 :** [rapport](07_ARCHITECTURE/preuves/RAPPORT_PROTOTYPE_PT01.md), [résultats SQL](07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT01.json), [empreintes](07_ARCHITECTURE/preuves/PREUVES_PROTOTYPE_PT01.json). Treize scénarios réussis sur PostgreSQL 16.14 ; **clos sur le périmètre prototype**, PT01-L01 résolu par DC-AUTH-01. SEC-01 reste à transposer au moteur complet et au MPD. Les contre-épreuves initiales sont conservées dans l’historique. Aucun coût cloud engagé ni choix de pile ratifié. PT02 à PT06 restent à exécuter.

| Appellation rencontrée | Fichier de référence |
|---|---|
| « Dictionnaire V1.1 consolidé », `GENIIUS_DICTIONNAIRE_DONNEES_V1_1_CONSOLIDE.md` (MLD) ; « Dictionnaire V1.1 gelé », `GENIIUS_DICTIONNAIRE_DONNEES_V1_1_GELE.md` (échanges) | `docs/03_DICTIONNAIRE/GENIIUS_DICTIONNAIRE_DONNEES.md`. Il contient les annexes G et H que cite le MLD. Gelé le 9/10/2026 (§ 1). Le fichier `…_V1_1_GELE.md` cité dans les échanges n’a jamais été versionné. |
| `GENIIUS_MCD_V1_1_CANONIQUE.md` | `docs/02_MCD/GENIIUS_MCD.md` |
| `GENIIUS_CDCF_V1_1_REFERENTIEL_EXPLICATIF.md`, `GENIIUS_IO_CDCF_V1_1_REFERENTIEL_EXPLICATIF.md` | `docs/01_CDCF/GENIIUS_CDCF.md` (renommé au commit `b305692`) |
| `CDCF_GENIIUS_V1.docx` | Absent du dépôt. Ses identifiants (A-01, K-01, S-01, CV-…) sont rattachés au CDCF V1.1 par l'annexe D du CDC technique. |

## 2. Versions remplacées ou archivées

| Fichier | Emplacement | Statut |
|---|---|---|
| `GENIIUS_DICTIONNAIRE_DONNEES.md` (racine, 2 852 l., sans annexes G à J) | Historique Git (`774c487`) | Remplacé par la version consolidée de `docs/` (même corps, annexes ajoutées) |
| `GENIIUS_DICTIONNAIRE_DONNEES_V1_0.md` (racine, 15 409 l.) | Historique Git (`774c487`) | Variante antérieure, remplacée |
| `GENIIUS_CDC_TECHNIQUE_V1_0_CONSOLIDE_CANDIDAT.md` | [`docs/06_CDC_TECHNIQUE/historique/`](06_CDC_TECHNIQUE/historique/) | Remplacé |
| `GENIIUS_CDC_TECHNIQUE_V1_0_DETAILLE_CONSOLIDE.md` | [`docs/06_CDC_TECHNIQUE/historique/`](06_CDC_TECHNIQUE/historique/) | Annexe explicative non normative |
| `ECHANGES_CDC_TECHNIQUE.txt` | [`docs/06_CDC_TECHNIQUE/historique/`](06_CDC_TECHNIQUE/historique/) | Source des décisions du CDC technique, conservée pour preuve |
| `GENIIUS_IO_MCD_V1.md`, `GENIIUS_MCD_V1_0_GEL_CONCEPTUEL.md` | Non versionnés | Remplacés par le MCD V1.1 (MCD § 0.4) |
| `GENIIUS_RAPPORT_CRASH_TEST_MLD_V1_0.md` | Introuvable | Preuve manquante ; le MLD reste candidat |

## 3. Contrôles exécutés pour établir les statuts

### 3.1 Dictionnaire — REC-01 : couverture MCD → dictionnaire (9/10/2026)

**Critère** (dictionnaire, annexe I) : toutes les entités et associations du MCD sont représentées ou explicitement fusionnées ou renommées.

**Procédé.** Extraction des 370 noms en majuscules figurant en tête de ligne des tableaux du MCD, puis recherche de chaque nom dans le dictionnaire.

**Résultat : CONFORME.**
- 17 noms ne sont pas des entités : ce sont des identifiants de choix (C1–C9) ou de principes (P2–P12).
- 351 des 353 entités et associations sont présentes dans le dictionnaire.
- Les 2 restantes, `DEPENDANCE_JUSTIFICATION` et `DEPENDANCE_RAISONNEMENT`, sont explicitement fusionnées dans `DEPENDANCE.categorie` (dictionnaire, annexe C.1).

**Contrôle complémentaire.** Les 125 règles `RG-*` du MCD sont toutes citées dans le dictionnaire.

### 3.2 Dictionnaire — REC-16 : couverture des 95 tests jusqu'au niveau du dictionnaire

**Conforme (9/10/2026).** Voir [`COUVERTURE_REC16_95_TESTS.md`](03_DICTIONNAIRE/preuves/COUVERTURE_REC16_95_TESTS.md) : 95 tests sur 95 sont couverts au niveau du dictionnaire (86 par une règle DD, DI, TI ou OB ; 9 par un attribut ou un domaine contraint) ; aucun test non couvert.

**Gel du dictionnaire :** prononcé le 9/10/2026, sur décision explicite du porteur, après conformité de REC-01 et REC-16. Les écarts mineurs ECD-23 et ECD-28 seront traités par la procédure de changement.

## 4. Conditions restantes pour figer la chaîne

| Document | Condition de passage au statut « gelé » |
|---|---|
| CDCF V1.3 | Maintien du statut référence ; gel global non prononcé. DC-CDCF-01 clôt ECD-19 et écart hors ligne ; AV-FONC-001 intégré. |
| ~~MCD V1.2~~ | **Gelé le 9/10/2026** |
| ~~Dictionnaire V1.1~~ | **Gelé le 9/10/2026** |
| ~~Dictionnaire V1.2~~ | **Gelé le 10/10/2026** |
| MLD V1.0 | Écarts bloquants et majeurs du MLD traités ou inscrits au registre des décisions différées (ECD-04 à 18, 21) ; matrice dictionnaire → MLD complétée (ECD-13) ; nouveau rapport de crash-test versionné |
| CDC technique V1.2 | **Gel documentaire prononcé le 13/10/2026** ; reports architecture/MPD/produit suivis au procès-verbal |

## 5. Historique du registre

| Date | Modification |
|---|---|
| 09/10/2026 | Création. Désignation des fichiers de référence ; restauration du rapport des 95 tests ; archivage des CDC techniques concurrents ; contrôle REC-01 exécuté. |
| 09/10/2026 | Contrôle REC-16 conforme. Révision du dictionnaire et du MLD pour ECD-04 (CP-24, CP-26, DI-B29, DI-B30) et ECD-05 (`contribution_differee`, CP-27, CP-28, ST-01 à ST-08, DI-B31 à B33, OB-20 à OB-22). |
| 09/10/2026 | **Gel du dictionnaire V1.1 consolidé** (décision du porteur). Arbitrage « retraits non qualifiés » confirmé, avec la réserve « retrait ≠ destruction des contributions locales » (MLD CP-28, dictionnaire OB-20). |
| 09/10/2026 | AV-FONC-001 figé (AV-1 à AV-12). **CDCF V1.2** : avenant intégré (Partie XXI, §§ 119–134, CU-26 à 31, critères 51 à 64). Le MCD V1.1 reste gelé jusqu'à l'analyse d'écart (étape 3). |
| 09/10/2026 | Étape 3 d'AV-FONC-001 : analyse d'écart validée par le porteur (concepts A à G, P23 à P25). **MCD V1.2 rédigé, statut candidat** ; la V1.1 reste la baseline gelée jusqu'au rapport des 173 contrôles et à la décision de gel. |
| 09/10/2026 | Réexécution des 173 contrôles du MCD V1.2 : 159 PASS, 14 PASS SOUS CONDITION (précisions du dictionnaire), 0 FAIL. Trois anomalies corrigées dans le MCD (AN-1 : nouveaux flux jamais vers le Core partagé ; AN-2 : série et publications figées ; AN-3 : arbre de projet). Gel en attente. |
| 09/10/2026 | **Gel du MCD V1.2** (décision du porteur). Ouverture de l’étape 4 d’AV-FONC-001 : dictionnaire V1.2 par la procédure de changement. |
| 09/10/2026 | **Dictionnaire V1.2 candidat** (DC-DICT-01, annexe K) : fiches A à G, précisions P-1 à P-8, DD-19 à DD-26, OB-23 à OB-28. REC-01 conforme ; REC-16 conforme sur 173 contrôles (162 R, 11 F, 0 X). Gel en attente. |
| 10/10/2026 | **Gel du dictionnaire V1.2** (décision du porteur). Ouverture de l’étape 5 d’AV-FONC-001 : MLD. |
| 10/10/2026 | **MLD V1.1 candidat** : intégration du MCD V1.2 et du dictionnaire V1.2 (AV-FONC-001 étape 5) : 17 tables (264 au total), `relation_projets` en lien réifié, CP-29 à CP-38, MLD-16 à MLD-18, ST-09 à ST-11 ; couverture mécanique dictionnaire V1.2 → MLD complète. Reste candidat (écarts ECD ouverts). |
| 10/10/2026 | Arbitrages V-7 à V-10 consignés dans le MLD (§ 29.1) ; conditions rédigées en CP-39, CP-40 et compléments de CP-31, CP-35. Instruction des écarts ECD-06 à 21 et 33 (`docs/08_AUDIT_COHERENCE/INSTRUCTION_ECD_MAJEURS_MLD.md`). Gel du MLD non prononcé. |
| 10/10/2026 | Décisions du porteur sur V-7 et V-10 (CP-39, CP-40 précisées) et sur les écarts majeurs. **Dictionnaire V1.3 candidat** (DC-DICT-02) ; **MLD V1.1-c** : 11 écarts bloquants corrigés, ST-12 à ST-15, matrice DI complète (300/300). Audit contradictoire par agent séparé lancé. Gel du MLD non prononcé ; MPD non engagé. |
| 10/10/2026 | **Audit contradictoire du MLD V1.1-c** (agent séparé, aveugle partiel) : 32 constats, dont 7 bloquants ([rapport](05_MLD/travaux/AUDIT_CONTRADICTOIRE_MLD_V1_1.md)). Instruction par l’auteur, sans clôture ([instruction](05_MLD/travaux/INSTRUCTION_CONSTATS_AUDIT_MLD_V1_1.md)) : aucun constat contesté sur le fond ; 11 modifient aussi le dictionnaire V1.3, qui ne peut pas être validé en l’état. Arbitrages D1 à D9 demandés. Gel du MLD exclu en l’état. |
| 10/10/2026 | Arbitrages D1 à D9 du porteur. **Dictionnaire V1.3** complété (11 constats d’audit) ; **MLD V1.1-d** : 32 constats corrigés (271 tables, CP-48 à CP-53), § 25.4 refait avec contrôle exhaustif des 207 lignes (21 lacunes corrigées). Constats non clos ; contre-audit ciblé lancé. |
| 10/10/2026 | **Contre-audit du MLD V1.1-d** (nouvel agent séparé) : sur 11 constats ciblés, 2 levés et 9 partiellement levés ; 15 nouveaux constats, dont 2 bloquants introduits par les corrections de l’accès ([rapport](05_MLD/travaux/CONTRE_AUDIT_MLD_V1_1_D.md), [instruction](05_MLD/travaux/INSTRUCTION_CONTRE_AUDIT_MLD_V1_1_D.md)). Proposition : refondre le contrôle d’accès en un modèle d’autorisation unique (axiomes A1 à A6, batterie de scénarios). Décision du porteur attendue. MLD et dictionnaire V1.3 non gelés. |
| 10/10/2026 | Décision du porteur : **refonte du contrôle d’accès** (proposition A), D1, D8 et DD-28 remplacés, statut « obligation procédurale non énoncée » adopté. **Contrat d’autorisation V1** et **batterie de 66 scénarios** rédigés, à figer. Corrections parallèles V1.1-e (hors accès) appliquées, candidates. Contraintes d’accès actuelles du MLD déclarées non normatives jusqu’à la réécriture. |

| 12/10/2026 | P-1 à P-3 validés par le porteur ; contrôles indépendants A/B effectués ; corrections du contrat et report candidat dans dictionnaire V1.3/MLD V1.1-f. **Gel du contrat comportemental V1.6 prononcé explicitement par le porteur** ; huit justifications acceptées, neuf groupes de choix ratifiés, réserves maintenues. Dictionnaire/MLD candidats. |

| 12/10/2026 | Sur demande du porteur, validation documentaire du dictionnaire V1.3 et stabilisation du MLD V1.1-g, avec deux nouvelles revues indépendantes et preuves par constat. 304 DI définies/localisées, 60 CP-13 énoncées, PK/FK/syntaxe contrôlées ; réserves amont/MPD maintenues. Aucun gel formel du dictionnaire/MLD ni SQL de production déclaré. |

## 5. Clôture CDC et entrée architecture — 13 octobre 2026

DC-CDCF-01 clôt R-CDC-02/03 sur autorisation du porteur. Les mentions d’écart CDCF § 122.2 dans les preuves gelées V1.6 concernent la V1.2 historique ; le contrat reste inchangé. Le CDC V1.2 et ses recettes sont gelés documentairement ; les statuts propres du dictionnaire et du MLD ne sont pas modifiés.

[Cadrage architecture V0.1](07_ARCHITECTURE/GENIIUS_ARCHITECTURE_01_CADRAGE.md) : candidat, non gelé ; aucun nouveau fournisseur ni technologie choisi.

## 6. Rangement de `docs/` — 13 octobre 2026

Sur demande du porteur, `docs/` a été rangé selon la [règle de nommage](README.md#règle-de-nommage) : un dossier numéroté par maillon de la chaîne, le document de référence à sa racine sous un nom sans version, puis `preuves/`, `travaux/` et `historique/`. Le porteur a choisi de ranger aussi les documents gelés et de rescellier leurs preuves.

**Nature du changement : forme seulement.**
- Fichiers déplacés et renommés par `git mv` : l’historique de chaque fichier est conservé.
- Contenu : seuls les liens et les mentions de chemins ont été réécrits. Une comparaison automatique de chaque fichier avec sa version précédente, chemins neutralisés, ne relève **aucune autre différence**. Cela vaut pour les documents gelés (contrat d’autorisation V1.6, CDC technique V1.2 et ses recettes, procès-verbaux) comme pour le code scellé de `spec/autorisation/`.
- Liens : les 60 liens qui étaient déjà cassés dans des copies archivées, parce qu’ils restaient relatifs à leur emplacement d’origine, ont été réparés. Aucun lien local n’est cassé.
- Rescellement : chaque preuve de gel ou de validation conserve ses anciennes empreintes, sous `rescellement_2026_10_13.sha256_avant`, et reçoit les nouvelles. Les contrôles reproductibles de `spec/validation/` ont été réexécutés avec succès.
- Aucun statut, aucune version et aucune décision ne changent.

**Correspondance des anciens chemins** (relatifs à `docs/`) :

| Ancien chemin | Nouveau chemin |
|---|---|
| `geniius_io_CDCF_V1.md` | `01_CDCF/GENIIUS_CDCF.md` |
| `AV-FONC/AV-FONC-001.md` | `01_CDCF/avenants/AV_FONC_001.md` |
| `AV-FONC/AV-FONC-001_ETAPE3_ANALYSE_ECART_MCD.md` | `01_CDCF/avenants/AV_FONC_001_ETAPE3_ANALYSE_ECART_MCD.md` |
| `archives/cdcf/geniius_io_CDCF_V1_2_AVANT_DC_CDCF_01.md` | `01_CDCF/historique/GENIIUS_CDCF_V1_2_AVANT_DC_CDCF_01.md` |
| `geniius_io_MCD_V1.md` | `02_MCD/GENIIUS_MCD.md` |
| `GENIIUS_RAPPORT_REEXECUTION_173_CONTROLES_MCD_V1_2.md` | `02_MCD/preuves/RAPPORT_REEXECUTION_173_CONTROLES_MCD_V1_2.md` |
| `GENIIUS_RAPPORT_REEXECUTION_95_TESTS_MCD_V1_1.md` | `02_MCD/preuves/RAPPORT_REEXECUTION_95_TESTS_MCD_V1_1.md` |
| `geniius_io_DICTIONNAIRE_DONNEES_V1.md` | `03_DICTIONNAIRE/GENIIUS_DICTIONNAIRE_DONNEES.md` |
| `AUDIT-MLD/historique/geniius_io_DICTIONNAIRE_DONNEES_V1_AVANT_VALIDATION_V1_3.md` | `03_DICTIONNAIRE/historique/GENIIUS_DICTIONNAIRE_DONNEES_AVANT_VALIDATION_V1_3.md` |
| `AUDIT-MLD/historique/DICTIONNAIRE_V1_3_AVANT_REPORT_AUTORISATIONS.md` | `03_DICTIONNAIRE/historique/GENIIUS_DICTIONNAIRE_DONNEES_V1_3_AVANT_REPORT_AUTORISATIONS.md` |
| `GENIIUS_DICTIONNAIRE_REC16_COUVERTURE_173_CONTROLES.md` | `03_DICTIONNAIRE/preuves/COUVERTURE_REC16_173_CONTROLES.md` |
| `GENIIUS_DICTIONNAIRE_REC16_COUVERTURE_95_TESTS.md` | `03_DICTIONNAIRE/preuves/COUVERTURE_REC16_95_TESTS.md` |
| `AUDIT-MLD/DOSSIER_VALIDATION_DICTIONNAIRE_MLD_V1_3.md` | `03_DICTIONNAIRE/preuves/DOSSIER_VALIDATION_DICTIONNAIRE_MLD_V1_3.md` |
| `AUDIT-MLD/PREUVES_VALIDATION_DICTIONNAIRE_MLD_V1_3.json` | `03_DICTIONNAIRE/preuves/PREUVES_VALIDATION_DICTIONNAIRE_MLD_V1_3.json` |
| `AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_6.md` | `04_CONTRAT_AUTORISATION/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION.md` |
| `GENIIUS_CONTRAT_AUTORISATION_V1.md` | `04_CONTRAT_AUTORISATION/GENIIUS_CONTRAT_AUTORISATION.md` |
| `AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1.md` | `04_CONTRAT_AUTORISATION/historique/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_0.md` |
| `AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_1.md` | `04_CONTRAT_AUTORISATION/historique/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_1.md` |
| `AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_2.md` | `04_CONTRAT_AUTORISATION/historique/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_2.md` |
| `AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_3.md` | `04_CONTRAT_AUTORISATION/historique/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_3.md` |
| `AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_4.md` | `04_CONTRAT_AUTORISATION/historique/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_4.md` |
| `AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_5.md` | `04_CONTRAT_AUTORISATION/historique/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_5.md` |
| `AUDIT-MLD/historique/GENIIUS_CONTRAT_AUTORISATION_V1_2e_revision.md` | `04_CONTRAT_AUTORISATION/historique/GENIIUS_CONTRAT_AUTORISATION_V1_2E_REVISION.md` |
| `AUDIT-MLD/historique/GENIIUS_CONTRAT_AUTORISATION_V1_3.md` | `04_CONTRAT_AUTORISATION/historique/GENIIUS_CONTRAT_AUTORISATION_V1_3.md` |
| `AUDIT-MLD/historique/GENIIUS_CONTRAT_AUTORISATION_V1_4.md` | `04_CONTRAT_AUTORISATION/historique/GENIIUS_CONTRAT_AUTORISATION_V1_4.md` |
| `AUDIT-MLD/historique/GENIIUS_CONTRAT_AUTORISATION_V1_5.md` | `04_CONTRAT_AUTORISATION/historique/GENIIUS_CONTRAT_AUTORISATION_V1_5.md` |
| `AUDIT-MLD/CONTROLE_CLOTURE_COUVERTURE_V1_6.md` | `04_CONTRAT_AUTORISATION/preuves/CONTROLE_CLOTURE_COUVERTURE_V1_6.md` |
| `AUDIT-MLD/CONTROLE_CLOTURE_TEXTE_MODELE_V1_6.md` | `04_CONTRAT_AUTORISATION/preuves/CONTROLE_CLOTURE_TEXTE_MODELE_V1_6.md` |
| `AUDIT-MLD/DOSSIER_CLOTURE_AUTORISATIONS_V1_6.md` | `04_CONTRAT_AUTORISATION/preuves/DOSSIER_CLOTURE_AUTORISATIONS_V1_6.md` |
| `AUDIT-MLD/PREUVES_CLOTURE_AUTORISATIONS_V1_6.json` | `04_CONTRAT_AUTORISATION/preuves/PREUVES_CLOTURE_AUTORISATIONS_V1_6.json` |
| `AUDIT-MLD/CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_2.md` | `04_CONTRAT_AUTORISATION/travaux/CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_2.md` |
| `AUDIT-MLD/CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_3.md` | `04_CONTRAT_AUTORISATION/travaux/CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_3.md` |
| `AUDIT-MLD/CONTROLE_AVEUGLE_CONTRAT_MODELE_V1_4.md` | `04_CONTRAT_AUTORISATION/travaux/CONTROLE_AVEUGLE_CONTRAT_MODELE_V1_4.md` |
| `AUDIT-MLD/CONTROLE_AVEUGLE_CONTRAT_MODELE_V1_5.md` | `04_CONTRAT_AUTORISATION/travaux/CONTROLE_AVEUGLE_CONTRAT_MODELE_V1_5.md` |
| `AUDIT-MLD/CONTROLE_AVEUGLE_COUVERTURE_BATTERIE_V1_4.md` | `04_CONTRAT_AUTORISATION/travaux/CONTROLE_AVEUGLE_COUVERTURE_BATTERIE_V1_4.md` |
| `AUDIT-MLD/CONTROLE_AVEUGLE_COUVERTURE_BATTERIE_V1_5.md` | `04_CONTRAT_AUTORISATION/travaux/CONTROLE_AVEUGLE_COUVERTURE_BATTERIE_V1_5.md` |
| `AUDIT-MLD/INSTRUCTION_CONTROLES_AVEUGLES_V1_4.md` | `04_CONTRAT_AUTORISATION/travaux/INSTRUCTION_CONTROLES_AVEUGLES_V1_4.md` |
| `AUDIT-MLD/INSTRUCTION_CONTROLES_AVEUGLES_V1_5.md` | `04_CONTRAT_AUTORISATION/travaux/INSTRUCTION_CONTROLES_AVEUGLES_V1_5.md` |
| `AUDIT-MLD/INSTRUCTION_CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_2.md` | `04_CONTRAT_AUTORISATION/travaux/INSTRUCTION_CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_2.md` |
| `AUDIT-MLD/INSTRUCTION_CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_3.md` | `04_CONTRAT_AUTORISATION/travaux/INSTRUCTION_CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_3.md` |
| `AUDIT-MLD/RAPPORT_COHERENCE_CONTRAT_BATTERIE_V1_1.md` | `04_CONTRAT_AUTORISATION/travaux/RAPPORT_COHERENCE_CONTRAT_BATTERIE_V1_1.md` |
| `GENIIUS_MLD_V1_0.md` | `05_MLD/GENIIUS_MLD.md` |
| `GENIIUS_MLD_AUTORISATIONS_V1_6.md` | `05_MLD/GENIIUS_MLD_AUTORISATIONS.md` |
| `AUDIT-MLD/historique/GENIIUS_MLD_V1_0_AVANT_VALIDATION_V1_3.md` | `05_MLD/historique/GENIIUS_MLD_AVANT_VALIDATION_V1_3.md` |
| `AUDIT-MLD/historique/MLD_V1_1_E_AVANT_REPORT_AUTORISATIONS.md` | `05_MLD/historique/GENIIUS_MLD_V1_1_E_AVANT_REPORT_AUTORISATIONS.md` |
| `AUDIT-MLD/CONTROLES_STRUCTURELS_V1_3.json` | `05_MLD/preuves/CONTROLES_STRUCTURELS_V1_3.json` |
| `AUDIT-MLD/REGISTRE_CLOTURE_CONSTATS_V1_3.md` | `05_MLD/preuves/REGISTRE_CLOTURE_CONSTATS_V1_3.md` |
| `AUDIT-MLD/REPORT_AUTORISATIONS_V1_6.md` | `05_MLD/preuves/REPORT_AUTORISATIONS_V1_6.md` |
| `AUDIT-MLD/VALIDATION_V1_3_AUTORISATIONS_RELATIONNELLES.md` | `05_MLD/preuves/VALIDATION_AUTORISATIONS_RELATIONNELLES_V1_3.md` |
| `AUDIT-MLD/VALIDATION_V1_3_DONNEES_ET_TRACABILITE.md` | `05_MLD/preuves/VALIDATION_DONNEES_ET_TRACABILITE_V1_3.md` |
| `AUDIT-MLD/AUDIT_CONTRADICTOIRE_MLD_V1_1.md` | `05_MLD/travaux/AUDIT_CONTRADICTOIRE_MLD_V1_1.md` |
| `AUDIT-MLD/CONTRE_AUDIT_MLD_V1_1_D.md` | `05_MLD/travaux/CONTRE_AUDIT_MLD_V1_1_D.md` |
| `AUDIT-MLD/INSTRUCTION_CONSTATS_AUDIT_MLD_V1_1.md` | `05_MLD/travaux/INSTRUCTION_CONSTATS_AUDIT_MLD_V1_1.md` |
| `AUDIT-MLD/INSTRUCTION_CONTRE_AUDIT_MLD_V1_1_D.md` | `05_MLD/travaux/INSTRUCTION_CONTRE_AUDIT_MLD_V1_1_D.md` |
| `GENIIUS_CDC_TECHNIQUE_V1_0.md` | `06_CDC_TECHNIQUE/GENIIUS_CDC_TECHNIQUE.md` |
| `GENIIUS_CDC_TECHNIQUE_RECETTES_V1_2.md` | `06_CDC_TECHNIQUE/GENIIUS_CDC_TECHNIQUE_RECETTES.md` |
| `archives/cdc-technique/échanges_CDC technique.txt` | `06_CDC_TECHNIQUE/historique/ECHANGES_CDC_TECHNIQUE.txt` |
| `GENIIUS_CDC_TECHNIQUE_RECETTES_V1_1.md` | `06_CDC_TECHNIQUE/historique/GENIIUS_CDC_TECHNIQUE_RECETTES_V1_1.md` |
| `archives/cdc-technique/GENIIUS_CDC_TECHNIQUE_V1_0_AVANT_ACTUALISATION_V1_1.md` | `06_CDC_TECHNIQUE/historique/GENIIUS_CDC_TECHNIQUE_V1_0_AVANT_ACTUALISATION_V1_1.md` |
| `archives/cdc-technique/GENIIUS_CDC_TECHNIQUE_V1_0_CONSOLIDE_CANDIDAT.md` | `06_CDC_TECHNIQUE/historique/GENIIUS_CDC_TECHNIQUE_V1_0_CONSOLIDE_CANDIDAT.md` |
| `archives/cdc-technique/GENIIUS_CDC_TECHNIQUE_V1_0_DETAILLE_CONSOLIDE.md` | `06_CDC_TECHNIQUE/historique/GENIIUS_CDC_TECHNIQUE_V1_0_DETAILLE_CONSOLIDE.md` |
| `archives/cdc-technique/GENIIUS_CDC_TECHNIQUE_V1_1_APRES_REVUE_FINALE.md` | `06_CDC_TECHNIQUE/historique/GENIIUS_CDC_TECHNIQUE_V1_1_APRES_REVUE_FINALE.md` |
| `archives/cdc-technique/README.md` | `06_CDC_TECHNIQUE/historique/README.md` |
| `AUDIT-CDC-TECH/CONTROLES_CDC_TECHNIQUE_V1_2.json` | `06_CDC_TECHNIQUE/preuves/CONTROLES_CDC_TECHNIQUE_V1_2.json` |
| `AUDIT-CDC-TECH/PREUVES_GEL_CDC_V1_2.json` | `06_CDC_TECHNIQUE/preuves/PREUVES_GEL_CDC_V1_2.json` |
| `AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md` | `06_CDC_TECHNIQUE/preuves/PROCES_VERBAL_GEL_CDC_V1_2.md` |
| `AUDIT-CDC-TECH/GENIIUS_BILAN_ACTUALISATION_CDC_V1_1.md` | `06_CDC_TECHNIQUE/travaux/BILAN_ACTUALISATION_CDC_V1_1.md` |
| `AUDIT-CDC-TECH/CONTROLES_CDC_TECHNIQUE_V1_1.json` | `06_CDC_TECHNIQUE/travaux/CONTROLES_CDC_TECHNIQUE_V1_1.json` |
| `AUDIT-CDC-TECH/REVUE_FINALE_CDC_V1_1.md` | `06_CDC_TECHNIQUE/travaux/REVUE_FINALE_CDC_V1_1.md` |
| `architecture/GENIIUS_CADRAGE_ARCHITECTURE_V0_1.md` | `07_ARCHITECTURE/GENIIUS_ARCHITECTURE_01_CADRAGE.md` |
| `architecture/GENIIUS_CORE_MODULES_TRANSACTIONS_V0_1.md` | `07_ARCHITECTURE/GENIIUS_ARCHITECTURE_02_CORE_MODULES_TRANSACTIONS.md` |
| `architecture/GENIIUS_CORE_MATRICES_V0_1.md` | `07_ARCHITECTURE/GENIIUS_ARCHITECTURE_03_CORE_MATRICES.md` |
| `architecture/GENIIUS_AUTORISATIONS_ISOLATION_CONCURRENCE_V0_1.md` | `07_ARCHITECTURE/GENIIUS_ARCHITECTURE_04_AUTORISATIONS_ISOLATION_CONCURRENCE.md` |
| `architecture/GENIIUS_SYNCHRONISATION_COMPATIBILITE_HORLOGE_V0_1.md` | `07_ARCHITECTURE/GENIIUS_ARCHITECTURE_05_SYNCHRONISATION_COMPATIBILITE_HORLOGE.md` |
| `architecture/GENIIUS_PERSISTANCE_CONSERVATION_RESTAURATION_V0_1.md` | `07_ARCHITECTURE/GENIIUS_ARCHITECTURE_06_PERSISTANCE_CONSERVATION_RESTAURATION.md` |
| `architecture/GENIIUS_ASYNCHRONE_PROPAGATION_DIMENSIONNEMENT_V0_1.md` | `07_ARCHITECTURE/GENIIUS_ARCHITECTURE_07_ASYNCHRONE_PROPAGATION_DIMENSIONNEMENT.md` |
| `architecture/GENIIUS_DEPLOIEMENT_V0_1.md` | `07_ARCHITECTURE/GENIIUS_ARCHITECTURE_08_DEPLOIEMENT.md` |
| `architecture/GENIIUS_ALTERNATIVES_TECHNOLOGIQUES_V0_1.md` | `07_ARCHITECTURE/GENIIUS_ARCHITECTURE_09_ALTERNATIVES_TECHNOLOGIQUES.md` |
| `architecture/GENIIUS_REGISTRE_DECISIONS_ARCHITECTURE_V0_1.md` | `07_ARCHITECTURE/GENIIUS_ARCHITECTURE_10_REGISTRE_DECISIONS.md` |
| `architecture/README.md` | `07_ARCHITECTURE/README.md` |
| `architecture/CONTROLES_ASYNCHRONE_V0_1.json` | `07_ARCHITECTURE/preuves/CONTROLES_ASYNCHRONE_V0_1.json` |
| `architecture/CONTROLES_CONSOLIDATION_V0_1.json` | `07_ARCHITECTURE/preuves/CONTROLES_CONSOLIDATION_V0_1.json` |
| `architecture/CONTROLES_CORE_V0_1.json` | `07_ARCHITECTURE/preuves/CONTROLES_CORE_V0_1.json` |
| `architecture/CONTROLES_PERSISTANCE_V0_1.json` | `07_ARCHITECTURE/preuves/CONTROLES_PERSISTANCE_V0_1.json` |
| `architecture/CONTROLES_SECURITE_V0_1.json` | `07_ARCHITECTURE/preuves/CONTROLES_SECURITE_V0_1.json` |
| `architecture/CONTROLES_SYNCHRONISATION_V0_1.json` | `07_ARCHITECTURE/preuves/CONTROLES_SYNCHRONISATION_V0_1.json` |
| `architecture/prototypes/PT01_RESULTATS.json` | `07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT01.json` |
| `AUDIT-COHERENCE/GENIIUS_INSTRUCTION_ECD_MAJEURS_MLD.md` | `08_AUDIT_COHERENCE/INSTRUCTION_ECD_MAJEURS_MLD.md` |
| `AUDIT-COHERENCE/GENIIUS_AUDIT_COHERENCE_V1_MATRICE_TRACABILITE.md` | `08_AUDIT_COHERENCE/MATRICE_TRACABILITE_AUDIT_COHERENCE_V1.md` |
| `AUDIT-COHERENCE/GENIIUS_AUDIT_COHERENCE_V1_RAPPORT.md` | `08_AUDIT_COHERENCE/RAPPORT_AUDIT_COHERENCE_V1.md` |
| `AUDIT-COHERENCE/GENIIUS_AUDIT_COHERENCE_V1_REGISTRE_CORRECTIONS.md` | `08_AUDIT_COHERENCE/REGISTRE_CORRECTIONS_AUDIT_COHERENCE_V1.md` |
