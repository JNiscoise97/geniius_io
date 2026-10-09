# GENIIUS — Registre des versions normatives

**Date de création :** 9 octobre 2026 (correction ECD-01 et ECD-02 de l'[audit de cohérence V1](AUDIT-COHERENCE/GENIIUS_AUDIT_COHERENCE_V1_RAPPORT.md))
**Rôle :** désigner, pour chaque document de la chaîne GENIIUS, **le** fichier de référence, sa version, son statut et la preuve de ce statut.

> **Règles.**
> - Seul un fichier inscrit ici fait référence.
> - Un statut « gelé » exige une preuve versionnée dans le dépôt. Une affirmation dans un autre document ne suffit pas.
> - Toute modification d'un document gelé suit la procédure de changement (CDC technique, § 13) et met à jour ce registre.

## 1. Chaîne documentaire

| Ordre | Document | Fichier de référence | Version | Statut | Preuve du statut |
|---|---|---|---|---|---|
| 1 | Cahier des charges fonctionnel | [`docs/geniius_io_CDCF_V1.md`](geniius_io_CDCF_V1.md) | **V1.2** (9/10/2026) = V1.1 + avenant AV-FONC-001 (Partie XXI) | **Référence** — base de tous les documents aval ; aucun procès-verbal de gel versionné. La V1.2 n'est pas encore répercutée dans le MCD (V1.1 gelé), le dictionnaire ni le MLD | Repris intégralement par le MCD V1.1, qui passe 95/95 tests contre ses 25 CU et 50 critères (rapport ci-dessous) |
| 2 | Modèle conceptuel de données | [`docs/geniius_io_MCD_V1.md`](geniius_io_MCD_V1.md) | **V1.1 canonique** (7/10/2026) | **GELÉ** — baseline conceptuelle | [`docs/GENIIUS_RAPPORT_REEXECUTION_95_TESTS_MCD_V1_1.md`](GENIIUS_RAPPORT_REEXECUTION_95_TESTS_MCD_V1_1.md), § 9 : « 95 PASS / 95 … peut être gelé comme baseline conceptuelle » ; condition de maintien du gel au § 10 |
| 3 | Dictionnaire de données | [`docs/geniius_io_DICTIONNAIRE_DONNEES_V1.md`](geniius_io_DICTIONNAIRE_DONNEES_V1.md) | **V1.1 consolidé** (corps V1 + annexes G à J) | **GELÉ** le 9/10/2026 — inclut la révision du 9/10/2026 (ajouts † ECD-04, ECD-05) | Annexe I : REC-01 et REC-16 **conformes** (§ 3) ; décision explicite de gel du porteur, 9/10/2026 |
| 4 | Modèle logique de données | [`docs/GENIIUS_MLD_V1_0.md`](GENIIUS_MLD_V1_0.md) | **V1.0** (7/10/2026), révisé le 9/10/2026 : CP-23 à CP-28, `contribution_differee`, § 28.3 ; 247 tables | **CANDIDAT** — non gelé | Rapport de crash-test cité en REV-01 **introuvable** (jamais versionné) ; écarts majeurs ouverts (ECD-06 à ECD-21, ECD-33) |
| 5 | CDC technique | [`docs/GENIIUS_CDC_TECHNIQUE_V1_0.md`](GENIIUS_CDC_TECHNIQUE_V1_0.md) | **V1.0** — audit achevé sur le périmètre initial | **CANDIDAT** — non gelé (GEL-01 à 08) | REV-03-M11 approuvé, conditions non levées |
| — | Avenant fonctionnel | [`docs/AV-FONC/AV-FONC-001.md`](AV-FONC/AV-FONC-001.md) | Dossier d'avenant | **Figé le 9/10/2026** (AV-1 à AV-12) ; intégré au CDCF V1.2 (étape 2) ; étapes 3 à 7 à mener | Décision du porteur (AV-FONC-001, § 12) |
| — | Audit de cohérence | [`docs/AUDIT-COHERENCE/`](AUDIT-COHERENCE/) | V1 (9/10/2026) | Rapport de contrôle | — |

**Correspondance des appellations.** Les documents désignent parfois un même fichier par un autre nom. Le tableau ci-dessous fait foi.

| Appellation rencontrée | Fichier de référence |
|---|---|
| « Dictionnaire V1.1 consolidé », `GENIIUS_DICTIONNAIRE_DONNEES_V1_1_CONSOLIDE.md` (MLD) ; « Dictionnaire V1.1 gelé », `GENIIUS_DICTIONNAIRE_DONNEES_V1_1_GELE.md` (échanges) | `docs/geniius_io_DICTIONNAIRE_DONNEES_V1.md`. Il contient les annexes G et H que cite le MLD. Gelé le 9/10/2026 (§ 1). Le fichier `…_V1_1_GELE.md` cité dans les échanges n’a jamais été versionné. |
| `GENIIUS_MCD_V1_1_CANONIQUE.md` | `docs/geniius_io_MCD_V1.md` |
| `GENIIUS_CDCF_V1_1_REFERENTIEL_EXPLICATIF.md`, `GENIIUS_IO_CDCF_V1_1_REFERENTIEL_EXPLICATIF.md` | `docs/geniius_io_CDCF_V1.md` (renommé au commit `b305692`) |
| `CDCF_GENIIUS_V1.docx` | Absent du dépôt. Ses identifiants (A-01, K-01, S-01, CV-…) sont rattachés au CDCF V1.1 par l'annexe D du CDC technique. |

## 2. Versions remplacées ou archivées

| Fichier | Emplacement | Statut |
|---|---|---|
| `geniius_io_DICTIONNAIRE_DONNEES_V1.md` (racine, 2 852 l., sans annexes G à J) | Historique Git (`774c487`) | Remplacé par la version consolidée de `docs/` (même corps, annexes ajoutées) |
| `GENIIUS_DICTIONNAIRE_DONNEES_V1_0.md` (racine, 15 409 l.) | Historique Git (`774c487`) | Variante antérieure, remplacée |
| `GENIIUS_CDC_TECHNIQUE_V1_0_CONSOLIDE_CANDIDAT.md` | [`docs/archives/cdc-technique/`](archives/cdc-technique/) | Remplacé |
| `GENIIUS_CDC_TECHNIQUE_V1_0_DETAILLE_CONSOLIDE.md` | [`docs/archives/cdc-technique/`](archives/cdc-technique/) | Annexe explicative non normative |
| `échanges_CDC technique.txt` | [`docs/archives/cdc-technique/`](archives/cdc-technique/) | Source des décisions du CDC technique, conservée pour preuve |
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

**Conforme (9/10/2026).** Voir [`GENIIUS_DICTIONNAIRE_REC16_COUVERTURE_95_TESTS.md`](GENIIUS_DICTIONNAIRE_REC16_COUVERTURE_95_TESTS.md) : 95 tests sur 95 sont couverts au niveau du dictionnaire (86 par une règle DD, DI, TI ou OB ; 9 par un attribut ou un domaine contraint) ; aucun test non couvert.

**Gel du dictionnaire :** prononcé le 9/10/2026, sur décision explicite du porteur, après conformité de REC-01 et REC-16. Les écarts mineurs ECD-23 et ECD-28 seront traités par la procédure de changement.

## 4. Conditions restantes pour figer la chaîne

| Document | Condition de passage au statut « gelé » |
|---|---|
| CDCF V1.1 | Décision explicite de gel (procès-verbal), ou maintien assumé du statut « référence ». Intégration ou non des avenants AV-FONC-001 et AV-FONC-002 (ECD-19, ECD-20). |
| ~~Dictionnaire V1.1~~ | **Gelé le 9/10/2026** |
| MLD V1.0 | Écarts bloquants et majeurs du MLD traités ou inscrits au registre des décisions différées (ECD-04 à 18, 21) ; matrice dictionnaire → MLD complétée (ECD-13) ; nouveau rapport de crash-test versionné |
| CDC technique V1.0 | GEL-01 à GEL-08 levées (CDC technique, § 11) |

## 5. Historique du registre

| Date | Modification |
|---|---|
| 09/10/2026 | Création. Désignation des fichiers de référence ; restauration du rapport des 95 tests ; archivage des CDC techniques concurrents ; contrôle REC-01 exécuté. |
| 09/10/2026 | Contrôle REC-16 conforme. Révision du dictionnaire et du MLD pour ECD-04 (CP-24, CP-26, DI-B29, DI-B30) et ECD-05 (`contribution_differee`, CP-27, CP-28, ST-01 à ST-08, DI-B31 à B33, OB-20 à OB-22). |
| 09/10/2026 | **Gel du dictionnaire V1.1 consolidé** (décision du porteur). Arbitrage « retraits non qualifiés » confirmé, avec la réserve « retrait ≠ destruction des contributions locales » (MLD CP-28, dictionnaire OB-20). |
| 09/10/2026 | AV-FONC-001 figé (AV-1 à AV-12). **CDCF V1.2** : avenant intégré (Partie XXI, §§ 119–134, CU-26 à 31, critères 51 à 64). Le MCD V1.1 reste gelé jusqu'à l'analyse d'écart (étape 3). |
