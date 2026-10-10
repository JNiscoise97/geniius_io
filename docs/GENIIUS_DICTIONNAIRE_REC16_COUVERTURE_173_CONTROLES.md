# GENIIUS — Dictionnaire V1.2

## Contrôles REC-01 et REC-16 sur le MCD V1.2 (173 contrôles)

**Date :** 9 octobre 2026
**Objet :** vérifier, avant gel du dictionnaire V1.2, que :
- **REC-01** — toutes les entités et associations du MCD V1.2 sont représentées dans le dictionnaire ;
- **REC-16** — les 173 contrôles du MCD V1.2 sont couverts jusqu'au niveau du dictionnaire.

**Sources :**
- [MCD V1.2 gelé](geniius_io_MCD_V1.md) ;
- [rapport des 173 contrôles](GENIIUS_RAPPORT_REEXECUTION_173_CONTROLES_MCD_V1_2.md) ;
- [REC-16 V1.1 (95 tests)](GENIIUS_DICTIONNAIRE_REC16_COUVERTURE_95_TESTS.md) ;
- [dictionnaire V1.2](geniius_io_DICTIONNAIRE_DONNEES_V1.md).

**Verdicts (identiques à REC-16 V1.1) :** **R** = couvert par une règle `DD`, `DI`, `TI` ou `OB` ; **F** = couvert par une fiche, un attribut contraint ou un domaine ; **X** = non couvert.

**Limite.** Contrôle réalisé par le rédacteur du dictionnaire V1.2 : il n'est pas indépendant.

## 1. Résultats

| Contrôle | Résultat |
|---|---|
| **REC-01** | **CONFORME** (§ 2) |
| **REC-16, 95 tests historiques** | **CONFORME** : 86 R, 9 F, 0 X — inchangé (§ 3) |
| **REC-16, 78 contrôles AV-FONC-001** | **CONFORME** : 76 R, 2 F, 0 X (§ 4) |
| **REC-16, total** | **173 couverts** : 162 R, 11 F, 0 X |

**Les 14 PASS SOUS CONDITION du MCD V1.2 sont levés au niveau du dictionnaire.** Leur condition était une précision du dictionnaire (P-1 à P-8) ou une obligation du schéma technique ; ces précisions sont rédigées (DD-19 à DD-26, OB-28). Tous sont couverts en **R**.

## 2. REC-01 : couverture MCD V1.2 → dictionnaire

**Procédé.** Comme pour la V1.1 : extraction des noms en majuscules figurant en tête de ligne des tableaux du MCD, puis recherche de chaque nom dans le dictionnaire. Le même procédé appliqué au MCD V1.1 (commit `423991c`) donne 406 noms ; le MCD V1.2 en compte **428**.

*Ce décompte diffère de celui du registre (370 noms en V1.1) parce que l'extraction prend tous les noms de la première colonne, y compris dans les tableaux de traçabilité. L'écart de procédé est sans effet : la comparaison V1.1 / V1.2 est faite avec le même procédé.*

**22 noms nouveaux :**
- 13 entités ou associations, toutes présentes dans le dictionnaire : `SELECTION_PARTAGE`, `HEBERGER_SELECTION`, `INCLURE_SELECTION`, `ETUDIER`, `UTILISER`, `PARAITRE_DANS`, `DECISION_EDITORIALE`, `DECIDER`, `DIFFUSION`, `DIFFUSER`, `EVALUER_DIFFUSION`, `PRISE_EN_CHARGE`, `PRENDRE_EN_CHARGE` ;
- 9 identifiants qui ne sont pas des entités : choix C11 à C13, et identifiants de tests (FAIL, TR08 à TR11, PR01).

**Noms absents du dictionnaire :** `DEPENDANCE_JUSTIFICATION` et `DEPENDANCE_RAISONNEMENT`, fusionnés dans `DEPENDANCE.categorie` (annexe C.1), comme en V1.1 ; et quatre identifiants de tests, qui ne sont pas des entités.

**Règles de gestion.** Les **148** règles `RG-*` du MCD V1.2 sont toutes citées dans le dictionnaire. Cinq nouvelles règles (RG-B16, L06, L10, P09, P11) n'étaient pas citées au premier passage ; elles ont été rattachées à DI-B38, DI-L15, DI-L18, DI-P12 et DI-P15.

**Cohérence des identifiants.** Tous les identifiants `DI`, `DD`, `OB` et `MLD` cités dans le dictionnaire y sont définis (contrôle mécanique).

**Verdict REC-01 : CONFORME.**

## 3. Non-régression : 95 tests historiques

La V1.2 du dictionnaire modifie quatre éléments utilisés par REC-16 V1.1 :

| Élément modifié | Tests V1.1 qui le citent | Effet |
|---|---|---|
| DI-A20 (FILIATION) : ajout du type `réutilisation`, qui exige aussi une opération de flux | CU-04, critère 24 | Règle élargie, aucune garantie retirée |
| OPERATION_FLUX : nouveaux types et DI-L12, L18, L20 ; DI-L06 à L08 inchangées | CU-04, critères 8, 9, 10 | DI-L12 et L18 interdisent explicitement le Core partagé comme cible : renforce le critère 8 |
| TACHE.echeance : `DATE_HIST` → `DATE_CIVILE` | CU-20 (TACHE d'origine `preuve inaccessible`) | Sans effet sur l'origine ni sur la conservation de l'acte d'évaluation |
| TRANSFERT_GOUVERNANCE : `date` conditionnelle, cessionnaire (0,1) avant acceptation | Aucun test ne cite la fiche (CU-04 et CU-12 citent DESIGNATION_GARDE) | Sans effet |

Aucune autre règle citée par REC-16 V1.1 n'a été modifiée. La matrice V1.1 reste valide : **95 couverts, 86 R, 9 F, 0 X.**

## 4. Les 78 contrôles AV-FONC-001

### 4.1 Cas d'usage CU-26 à 31

| Contrôle | Règles et fiches du dictionnaire | Verdict |
|---|---|---|
| CU-26 Les Colimaçons | SELECTION_PARTAGE DI-L13 à L17 ; DD-21 ; OB-23 ; ETUDIER DI-K24, K25 ; RAPPROCHEMENT DI-F09 à F11 ; DI-E02 | R |
| CU-27 Arbre offert | DESIGNATION_GARDE DI-B27, B28 ; TRANSFERT DD-26, DI-B40 à B42 ; OB-28 ; DI-L12 | R |
| CU-28 Contribution externe | IMPORT DI-P08 à P10 ; DI-A31, A32 ; DI-L12, L15 ; RAPPROCHEMENT DI-F09 à F11 | R |
| CU-29 Programme fédéré | DD-19, DI-K23 ; DD-22, DI-B36, B37 ; DI-B29 ; OB-03, OB-26 | R |
| CU-30 Militaires réunionnais | UTILISER DI-K25, K26 ; TACHE DD-23, DI-K27 à K31 ; METHODE DI-O13 ; RESULTAT DI-O14 à O17 ; DI-P11 à P18 ; PRISE_EN_CHARGE DI-B38, B39 | R |
| CU-31 Fédération | DD-19, DI-K23 (types non hiérarchiques, sans engagement de l'autre projet) ; RAPPROCHEMENT DI-F09 à F11 | R |

### 4.2 REC-TR08 : reconstitution collective

| Contrôle | Règles et fiches du dictionnaire | Verdict |
|---|---|---|
| TR08-01 Créer le projet | PROJET DI-K01 ; ESPACE DI-B04 | R |
| TR08-02 Plusieurs arbres sans fusion | DI-L12 (aucune copie) ; DD-21 | R |
| TR08-03 Deux branches d'un même arbre | HEBERGER_SELECTION (0,n) ; DI-L16 | R |
| TR08-04 Famille sans parenté connue | DI-E02 | R |
| TR08-05 Accepter une contribution | DI-L12 ; OPERATION_FLUX `statut` | R |
| TR08-06 Rapprochement sans fusion | DI-F09, F10 | R |
| TR08-07 Changement de l'arbre source signalé | DI-L15 (proposition à l'espace source) ; DI-A22 | R |
| TR08-08 Refus de mise à jour conservé | FILIATION `divergence assumée` ; DI-L15 (une version proposée non confirmée reste sans effet) | R |
| TR08-09 Retrait d'un contributeur | DI-L19 ; DI-A38 ; DI-B09 | R |
| TR08-10 Publication sans fuite | DI-P01 ; DI-P15 ; OB-23 | R |

### 4.3 REC-TR09 : partage sélectif d'une branche

| Contrôle | Règles et fiches du dictionnaire | Verdict |
|---|---|---|
| TR09-01 Sosa 31 comme point de départ | SELECTION_PARTAGE `point_depart` (C pour une branche) | F |
| TR09-02 Ascendance paternelle seule | `ascendance` ; DI-L16 | R |
| TR09-03 Descendance | `descendance`, `profondeur_descendance` ; DI-L16 | R |
| TR09-04 Unions | `unions` ; DI-L16 | R |
| TR09-05 Conjoint sans son ascendance | DI-L16 (conjoints `sans leur ascendance`) | R |
| TR09-06 Sosa 16 non déductible | DI-L16 (exclusions prioritaires, relations frontières exclues) ; `exclusions` en `I` ; OB-23, OB-04 | R |
| TR09-07 BOURBON et BOVALO séparés | HEBERGER_SELECTION (0,n) ; paramètres par sélection | F |
| TR09-08 Personne vivante masquée | DI-L16 (`traitement_vivants`, défaut `exclus`) ; DI-E05 | R |
| TR09-09 Prévisualisation exacte | DI-L13 | R |
| TR09-10 Évolution sans élargissement | DI-L14, DI-L15 | R |
| TR09-11 Réduction ou révocation | DI-L15 (réduction immédiate) ; DI-L19 ; DI-A38 | R |
| TR09-12 Aucune fuite | OB-23 ; OB-03 ; OB-04 ; TI-11 | R |

### 4.4 REC-TR10 : arbre préparé pour un tiers

| Contrôle | Règles et fiches du dictionnaire | Verdict |
|---|---|---|
| TR10-01 Arbre pour un tiers sans compte | DI-B27 (destinataire = personne) ; DI-B04 | R |
| TR10-02 Bénéficiaire futur sans faux compte | DI-B27 ; DD-07 | R |
| TR10-03 Recherches attribuées | DI-B28 ; DI-B42 | R |
| TR10-04 Partage d'une branche avec le projet | DI-L12, DI-L17 | R |
| TR10-05 Cadeau préparé sans accès | DI-B40 (aucun effet avant `accepté`) | R |
| TR10-06 Invitation privée, limitée, révocable | OB-28 | R |
| TR10-07 Rôle accordé à l'acceptation | DI-B40 (effet atomique à `accepté`) | R |
| TR10-08 Transfert explicite et audité | DD-26 ; DI-B40, DI-B41 ; `engagements_presentes` | R |
| TR10-09 Chercheur collaborateur après transfert | DI-B42 (droit maintenu seulement s'il est accordé par le nouveau propriétaire) | R |
| TR10-10 Le chercheur quitte l'arbre | DI-B09 ; DI-B42 | R |
| TR10-11 Pas de compte forcé | DI-B40 (`refusé`, `expiré` sans effet) | R |
| TR10-12 Invitation interceptée ou expirée | OB-28 ; `date_expiration` | R |

### 4.5 REC-TR11 : contributions internes et externes

| Contrôle | Règles et fiches du dictionnaire | Verdict |
|---|---|---|
| TR11-01 Depuis son arbre GENIIUS | DI-L12, DI-L17 | R |
| TR11-02 Depuis l'arbre d'un tiers administré | DI-L17 (`repartager` exigé de l'auteur) | R |
| TR11-03 Depuis un arbre sans parenté connue | DI-L16 ; type `ensemble explicite` ; DI-E02 | R |
| TR11-04 Import GEDCOM avec provenance | DI-A31, A32 ; DI-P08 | R |
| TR11-05 Rapprochement proposé | DI-F09 à F11 | R |
| TR11-06 Assertion contradictoire conservée | DI-G01, G02 ; POSITION_EPISTEMIQUE (fiche 8.7) | R |
| TR11-07 Réimport sans écrasement | DI-P08 ; OB-10 | R |
| TR11-08 Import identique sans doublon | DI-P08 ; OB-10 | R |
| TR11-09 Informations privées exclues | DI-E05 ; DI-L16 ; OB-23 | R |
| TR11-10 Publication avec crédits | DI-P01 ; DI-A37 (crédits conservés) | R |
| TR11-11 Aucune synchronisation présumée | DI-A22, DI-A25 | R |
| TR11-12 Source externe disparue | DI-A26 | R |

### 4.6 REC-PR01 : programmes et sous-projets

| Contrôle | Règles et fiches du dictionnaire | Verdict |
|---|---|---|
| PR01-01 Programme à plusieurs niveaux | DD-19 ; DI-K23 | R |
| PR01-02 Rejoindre Pointe-Noire seulement | APPARTENIR par espace ; DI-K23 (aucun droit par rattachement) | R |
| PR01-03 Projet frère privé, sans fuite d'existence | DI-B12 ; OB-04 ; RELIER_PROJETS `X` | R |
| PR01-04 Administrateur du parent sans lecture | DI-B29 ; DI-K23 ; OB-22 | R |
| PR01-05 Deux sous-projets, deux rôles | DI-K23 ; APPARTENIR (0,n) | R |
| PR01-06 Révocation locale | DI-B37 | R |
| PR01-07 Contribuer une branche à un sous-projet | DI-L12 | R |
| PR01-08 Recherche transversale filtrée | OB-03 ; OB-26 | R |
| PR01-09 Déplacer un sous-projet | DD-19 (§ 5) ; DI-B37 | R |
| PR01-10 Clore un sous-projet | DI-K01 | R |
| PR01-11 Habitation référencée par deux projets | DI-A23 à A25 | R |
| PR01-12 Trajectoire historisée | DI-G08 | R |

### 4.7 Critères 51 à 64

| Critère | Règles du dictionnaire | Verdict |
|---|---|---|
| 51 | DI-B29 ; DI-K23 ; OB-22 | R |
| 52 | DI-K23 | R |
| 53 | DI-K25 | R |
| 54 | DI-K24 ; DI-E02 | R |
| 55 | DI-B36 ; DI-B37 | R |
| 56 | DI-K25 ; DI-K26 | R |
| 57 | DI-K29 ; DI-K30 | R |
| 58 | DI-K31 | R |
| 59 | DI-L14 ; DI-L16 ; OB-23 | R |
| 60 | DI-B34 ; DI-B35 ; DI-L18 | R |
| 61 | DD-26 ; DI-B27 ; DI-B40 à B42 | R |
| 62 | DI-O13 à DI-O17 | R |
| 63 | DI-P11 à DI-P18 | R |
| 64 | DI-A38 ; DI-L19 ; DI-B39 | R |

### 4.8 Recettes des arbitrages AV (pour information)

| Recette | Règles | Verdict |
|---|---|---|
| Marie : lot rouvert sans droits (AV-6) | DI-K29, DI-K30 | R |
| Rapport 2027 « 5 000 » figé et explicable (AV-7) | DI-O14, DI-O17 | R |
| Lettre n° 12 : approbation invalidée, envoi bloqué (AV-8) | DI-P12, DI-P15, DI-P16 (exemple § 18.7) | R |
| Financement par deux programmes (AV-9) | DI-B38, DI-B39 ; OB-25 | R |
| Recherche transversale et révocation (AV-9) | OB-26 ; DI-B37 | R |
| Révocation partielle 2 sur 10 (AV-10) | DI-L15, DI-L19, DI-A38 | R |
| Lien d'invitation intercepté (AV-11) | OB-28 | R |
| Ressource utilisée par plusieurs projets (AV-5) | UTILISER (0,n) ; DI-K25 | R |

## 5. Décompte

| Batterie | Contrôles | R | F | X |
|---|---|---|---|---|
| Historiques (REC-16 V1.1) | 95 | 86 | 9 | 0 |
| CU-26 à 31 | 6 | 6 | 0 | 0 |
| REC-TR08 | 10 | 10 | 0 | 0 |
| REC-TR09 | 12 | 10 | 2 | 0 |
| REC-TR10 | 12 | 12 | 0 | 0 |
| REC-TR11 | 12 | 12 | 0 | 0 |
| REC-PR01 | 12 | 12 | 0 | 0 |
| Critères 51 à 64 | 14 | 14 | 0 | 0 |
| **Total** | **173** | **162** | **11** | **0** |

## 6. Verdict

**REC-01 : CONFORME. REC-16 : CONFORME** (173 couverts, 0 non couvert).

Le dictionnaire V1.2 remplit les deux conditions formelles de gel de l'annexe I. Le gel reste soumis à la décision du porteur.

**Points à noter pour le MLD (étape 5) :**
- les décisions ouvertes MLD-16 à MLD-18 (manifeste, imputation, explication des accès) ;
- les obligations OB-23 à OB-28 ;
- les 11 contrôles de niveau F (9 historiques, 2 nouveaux), que le MLD devra traduire par des contraintes explicites.
