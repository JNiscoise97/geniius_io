# GENIIUS — Rapport de réexécution des 173 contrôles du MCD V1.2

**Date :** 9 octobre 2026
**Objet :** vérifier le MCD V1.2 candidat (`docs/geniius_io_MCD_V1.md`) avant décision de gel.
**Périmètre :** 173 contrôles :
- **95 tests historiques** (non-régression) : 25 cas d'usage, 50 critères de recette, 20 tests canoniques. Référence : [rapport V1.1](GENIIUS_RAPPORT_REEXECUTION_95_TESTS_MCD_V1_1.md) ;
- **78 contrôles AV-FONC-001** : 6 cas d'usage (CU-26 à 31), 58 scénarios (REC-TR08 à TR11, REC-PR01), 14 critères (51 à 64). Référence : [analyse d'écart, étape 3](AV-FONC/AV-FONC-001_ETAPE3_ANALYSE_ECART_MCD.md).

**Niveau de vérification atteint :** « vérifiée documentairement » (MCD § 29.4). Aucun test n'est « exécuté » : cela relève du MLD et des recettes techniques.

## 1. Méthode

Chaque contrôle est rejoué contre le **texte** du MCD V1.2 : entités, associations, cardinalités, invariants P1 à P25 et règles de gestion. Un contrôle n'est PASS que si un mécanisme écrit permet le scénario sans violer un invariant. Sa présence dans la traçabilité (§ 23) ou dans un déroulé (§ 24) ne suffit pas.

| Verdict | Signification |
|---|---|
| **PASS** | Représentable avec le MCD V1.2, sans condition |
| **PASS SOUS CONDITION** | Représentable ; une précision du dictionnaire V1.2 (P-1 à P-8) ou une obligation du schéma technique reste nécessaire. Pas de concept manquant. |
| **FAIL** | Un concept manque dans le MCD |

**Non-régression.** Pour les 95 tests historiques, deux questions sont posées :
1. Le mécanisme cité par le rapport V1.1 existe-t-il toujours, inchangé ?
2. Un ajout V1.2 (concepts A à G, nouvelles valeurs de domaine, P23 à P25) le contredit-il, ou ouvre-t-il un contournement ?

**Recherche de faux positifs.** Pour chaque ajout V1.2, recherche active d'un scénario historique qu'il pourrait affaiblir (§ 5).

**Limite d'indépendance.** Le présent rapport a été produit par le même rédacteur que le MCD V1.2. Contrairement au rapport V1.1 (« réexécution indépendante »), il n'est **pas indépendant**. Une relecture par le porteur ou un second relecteur est recommandée avant le gel (§ 7).

## 2. Résultat global

| Batterie | Contrôles | PASS | PASS SOUS CONDITION | FAIL |
|---|---|---|---|---|
| Cas d'usage CU-01 à 25 | 25 | 25 | 0 | 0 |
| Critères 1 à 50 | 50 | 50 | 0 | 0 |
| Non-régression canonique 1 à 20 | 20 | 20 | 0 | 0 |
| **Sous-total historique** | **95** | **95** | **0** | **0** |
| Cas d'usage CU-26 à 31 | 6 | 3 | 3 | 0 |
| REC-TR08 | 10 | 10 | 0 | 0 |
| REC-TR09 | 12 | 12 | 0 | 0 |
| REC-TR10 | 12 | 9 | 3 | 0 |
| REC-TR11 | 12 | 12 | 0 | 0 |
| REC-PR01 | 12 | 10 | 2 | 0 |
| Critères 51 à 64 | 14 | 8 | 6 | 0 |
| **Sous-total AV-FONC-001** | **78** | **64** | **14** | **0** |
| **TOTAL** | **173** | **159** | **14** | **0** |

**Évolution des 78 contrôles AV-FONC-001 depuis l'étape 3 :**

| | PASS | PASS SOUS CONDITION | FAIL |
|---|---|---|---|
| MCD V1.1 (étape 3) | 34 | 18 | 26 |
| MCD V1.2 | 64 | 14 | 0 |

- **26 FAIL levés** : 24 passent PASS, 2 passent PASS SOUS CONDITION (CU-27 : P-8 ; CU-30 : P-3, P-4), parce qu'ils dépendent aussi d'une précision du dictionnaire.
- **6 PASS SOUS CONDITION requalifiés PASS** : leur condition était le concept A ou les précisions P-6 et P-7, désormais portées par le MCD lui-même (`D-45`, `D-10` `réutiliser`, RG-L10 à L12).
- **14 PASS SOUS CONDITION restants** : précisions P-1, P-2, P-3, P-4, P-8 du dictionnaire et obligations du schéma technique d'identité (AV-11). Aucun ne demande un concept.

**Anomalies détectées pendant la réexécution :** trois, toutes corrigées dans le MCD V1.2 avant la conclusion (§ 5). Sans ces corrections, les critères 8, 23 et 47 n'auraient été que PASS SOUS CONDITION.

## 3. Non-régression : 95 tests historiques

### 3.1 Modifications de l'existant introduites par la V1.2

La V1.2 est additive. Les seuls textes existants modifiés sont :

| Élément | Modification | Tests historiques concernés | Effet |
|---|---|---|---|
| `OPERATION_FLUX` | Propriété `selection` (facultative) | CU-04, CU-21, critères 8 à 10, NR 19 | Aucun : facultative, sans effet sur les types existants |
| `D-10` | Valeur `réutiliser` | Critères 8, 25 ; NR 4 | Aucun : nouvelle permission, plus restrictive que l'absence de règle |
| `D-45` | Valeurs `contribution vers un espace partagé`, `réutilisation d'une sélection` | **Critère 8** ; CU-04 ; NR 19 | **Risque de contournement de RG-B01** → anomalie AN-1, corrigée |
| `PUBLICATION.type` | Valeurs `série`, `numéro de série`, livrables | **Critère 47** ; CU-18 ; RG-P01 | **Une série « non figée » pouvait sembler réécrire une publication** → anomalie AN-2, corrigée |
| Domaine L, introduction | Note sur l'arbre de projet | **Critère 23** ; C5 | **Le texte V1.1 limitait l'arbre aux espaces privés ou familiaux** → anomalie AN-3, corrigée |
| En-tête, § 0.3, titre du § 24 | Version, nombre de CU et de critères | — | Rédactionnel |

Aucun invariant P1 à P22 et aucune règle RG existante n'a été modifié.

### 3.2 Cas d'usage CU-01 à 25

| CU | Verdict | Mécanisme V1.1 | Contact avec la V1.2 |
|---|---|---|---|
| CU-01 Charles TANCRÈDE | PASS | EVENEMENT, RECIT, PRESENCE, QUESTION, RECHERCHE_EFFECTUEE, INTERPRETATION, DEPENDANCE | Aucun |
| CU-02 Habitation Dolé | PASS | PERSONNE minimale, COLLECTIF_HISTORIQUE, CANDIDATURE, APPLICATION_PROTOCOLE | `ETUDIER` peut cibler un collectif (RG-K10) sans pondérer la densité documentaire |
| CU-03 Registre perdu | PASS | RECONSTRUCTION, ELEMENT_RECONSTRUIT, APPUYER, CANDIDATURE | Aucun |
| CU-04 Projet CHARBONNÉ | PASS | ARBRE privé, OPERATION_FLUX, FILIATION, SNAPSHOT, DESIGNATION_GARDE, EXPORT | Nouveaux types D-45 sans effet sur les flux existants (AN-1) |
| CU-05 Photo familiale | PASS | PAGE, EMPLACEMENT, ANNOTATION, REGROUPEMENT_TRACES, CONSENTEMENT | Aucun |
| CU-06 Mémoire familiale | PASS | SESSION_MEMOIRE, REPONSE, EMBARGO, CAPSULE, DESIGNATION_GARDE | Aucun |
| CU-07 Mission aux archives | PASS | MISSION, ITEM_MISSION, INTERVENIR, MICRO_MISSION | `UTILISER` ne crée pas d'accès ; RG-K05 inchangé |
| CU-08 Reconstruction territoriale | PASS | LIEU, RELATION spatiales, SITUATION, GEOMETRIE | Un axe `territoire` n'est pas une relation spatiale (RG-K09) |
| CU-09 Statistique historique | PASS | CORPUS, METHODE, CALCUL, RESULTAT, DIFF_CONNAISSANCE | Aucun |
| CU-10 Désaccord scientifique | PASS | ACTE_EVALUATION, ARGUMENT, GROUPE, LIEN_INTERET, CREDIT | `DECISION_EDITORIALE` sans lien avec `ACTE_EVALUATION` (RG-P10) |
| CU-11 Publication à droits mixtes | PASS | LICENCE, EMBARGO, MASQUAGE, EXPOSER, indexable | `DIFFUSION` ajoute un contrôle, n'en retire aucun (RG-P11) |
| CU-12 Pérennité | PASS | EXPORT, IMPORT, RECONCILIATION_IMPORT, FILIATION | Sélections, décisions et diffusions sont des `OBJET` : couverts par le format patrimonial (RG-P05) |
| CU-13 « Un des fils » | PASS | POSITION_RELATIONNELLE, CANDIDATURE, ARGUMENT | Aucun |
| CU-14 CHARBONNET / CHARBONNIER | PASS | ASSERTION_ATTRIBUT ×2, CHOIX_AFFICHAGE | Aucun |
| CU-15 Emploi 1834–1841 | PASS | SITUATION ×3, RG-G05 | Aucun |
| CU-16 Photo « Joseph / Paul » | PASS | ANNOTATION, ASSERTION concurrentes, REPONSE | Aucun |
| CU-17 Convoi de 24 | PASS | COLLECTIF_HISTORIQUE, POSITION_RELATIONNELLE | Aucun |
| CU-18 « 47 personnes » | PASS | RAPPROCHEMENT, DEPENDANCE, RESULTAT, PUBLICATION figée | Une publication numérotée dans une série reste figée (AN-2) |
| CU-19 Témoignage sous embargo | PASS | EMBARGO, RG-P02, mode_exposition | Une sélection n'élargit jamais un embargo (RG-L09 : intersection) |
| CU-20 Preuve disparue | PASS | ACTE_EVALUATION conservé, etat_acces, TACHE | Aucun |
| CU-21 Arsène dans deux Trees | PASS | Deux ESPACE, deux RAPPROCHEMENT, RG-F07 | Un partage ne relie que les espaces explicitement concernés (RG-L09) |
| CU-22 Personne sans nom | PASS | REQUETE, RESULTAT | Aucun |
| CU-23 Première / dernière attestation | PASS | Calcul sur ASSERTION, RG-G11 | Aucun |
| CU-24 Autorisation de voyage | PASS | EVENEMENT `mode_realite` | Aucun |
| CU-25 Acte manquant | PASS | ANOMALIE_DOCUMENTAIRE, INTERPRETATION, PISTE | Aucun |

### 3.3 Critères 1 à 50

Les mécanismes cités au § 23.2 existent tous, inchangés. Seuls les critères au contact d'un ajout V1.2 sont détaillés.

| Critère | Verdict | Mécanisme | Contact V1.2 |
|---|---|---|---|
| 1 à 7 | PASS | etat_examen, statut_validation, RG-D01, D03, F04, E02 | Aucun |
| **8** Donnée privée vers le Core | PASS | RG-B01 | AN-1 : les nouveaux flux ne ciblent jamais le Core partagé (RG-L13) |
| 9 | PASS | RG-L02 | Aucun |
| 10 | PASS | RG-L03 | Un partage de sélection n'est pas une comparaison et n'alimente pas le Core (RG-L13) |
| 11 | PASS | RG-P02 | Renforcé par RG-P11 |
| 12 à 22 | PASS | RG-N01, O01, A06, A05, H04, C03/H02, Q02, K01, K03, K04, E06 | Aucun |
| **23** Projet privé sans contribuer | PASS | P7 ; domaine L | AN-3 : l'arbre de projet obéit aux mêmes règles |
| 24 à 34 | PASS | RG-A03, A04, D04, E03/R02, O05, G06, E05, C05, C06 | Aucun |
| 35 | PASS | RG-H06 | `PRISE_EN_CHARGE` sans lien avec `BADGE` (RG-B15) |
| 36 à 38 | PASS | RG-H03, B04/J07, D04 | Aucun |
| 39 Financement sans effet sur l'évaluation | PASS | FINANCEMENT | `PRISE_EN_CHARGE` distincte et sans effet (RG-B15) |
| 40 à 46 | PASS | identite_civile, RG-O03, Q01, Q02, P07, P05, P06 | Aucun |
| **47** Publication non réécrite | PASS | RG-P03 | AN-2 : ajouter un numéro ne réécrit pas la série (RG-P08) |
| 48 à 50 | PASS | P4, SNAPSHOT, RG-E02, LACUNE | Aucun |

### 3.4 Tests canoniques de non-régression 1 à 20

| # | Scénario | Verdict | Contact V1.2 |
|---|---|---|---|
| 1 | 50 projets, une identité Core, sans copie | PASS | La consultation d'une sélection ne copie rien ; seule la réutilisation explicite crée une `FILIATION` (RG-L10) |
| 2 | État local divergent | PASS | Aucun |
| 3 | Rapprochement sans fusion | PASS | Les recoupements de CU-31 utilisent le même mécanisme |
| 4 | Relation privée entre personnes publiques | PASS | RG-L08 : une relation non incluse au manifeste n'est pas exposée |
| 5 | Preuve privée, conclusion justifiée publiquement | PASS | Aucun |
| 6 | Compte supprimé, attribution conservée | PASS | Décisions et diffusions attribuées à `ACTEUR_GENIIUS`, pas au compte |
| 7 | GEDCOM importé deux fois | PASS | Aucun |
| 8 | Scission d'une cible Core | PASS | Aucun |
| 9 | Agrégat sans révéler le nombre de secrets | PASS | RG-L08, RG-L11 : ni le nombre de relations exclues, ni la branche exclue |
| 10 | Notification sans révéler une contradiction privée | PASS | Les propositions de nouvelle version (RG-L06) ne s'adressent qu'à l'espace source |
| 11 | Export sans dépendance interdite | PASS | Le manifeste d'une sélection est soumis au `CONTEXTE_EVALUATION` |
| 12 à 17 | Traduction, fichier, cycles, positions, source déclarée, numérisation | PASS | Aucun |
| 18 | Retrait de consentement sans destruction | PASS | RG-L12 conserve la même logique pour la révocation d'un partage |
| 19 | Tree souverain après évolution du Core | PASS | Une sélection n'écrit jamais dans l'arbre source (RG-L13) |
| 20 | API : absence ≠ existence protégée | PASS | Chaque ajout V1.2 comporte une clause « révélation » |

## 4. Contrôles AV-FONC-001 : 78 contrôles

Seuls les verdicts qui changent depuis l'étape 3 sont justifiés en détail. Les PASS de l'étape 3 restent PASS : aucun mécanisme cité n'a été modifié.

### 4.1 Cas d'usage CU-26 à 31

| CU | Étape 3 | V1.2 | Justification |
|---|---|---|---|
| CU-26 Les Colimaçons | FAIL | **PASS** | A : deux sélections paramétrées (BOURBON, BOVALO), manifeste, conjoint sans ascendance, Sosa 16 non déductible (RG-L05 à L11). B : axes sans relation historique (RG-K09, K10). Reconstitution propre au projet (RG-L13, AN-3). Déroulé § 24.5 |
| CU-27 Arbre offert | FAIL | **PASS SOUS CONDITION** | A lève le FAIL (partage de la branche du tiers). Reste P-8 : état, snapshot des partages présenté et cessionnaire facultatif de `TRANSFERT_GOUVERNANCE` |
| CU-28 Contribution externe | FAIL | **PASS** | A (sélection depuis l'espace d'import) ; RG-L06 au réimport ; § 24.7 |
| CU-29 Programme fédéré | PSC | PSC | Inchangé : P-1 (rattachement bilatéral). P23 rend explicite l'absence d'héritage |
| CU-30 Militaires réunionnais | FAIL | **PASS SOUS CONDITION** | C lève le FAIL (inventaire comme ressource, RG-K11). Restent P-3 (lots, délégation) et P-4 (indicateurs) |
| CU-31 Fédération | PASS | PASS | P23 confirme |

### 4.2 REC-TR08 à TR11

| ID | Étape 3 | V1.2 | Justification |
|---|---|---|---|
| TR08-02 Plusieurs arbres sans fusion | FAIL | PASS | Une sélection par arbre ; RG-L13 |
| TR08-03 Deux branches d'un même arbre | FAIL | PASS | HEBERGER_SELECTION (0,n) |
| TR08-05 Accepter une contribution | PSC | **PASS** | P-6 porté par le MCD : `D-45` `contribution vers un espace partagé` ; RG-L13 (acceptation, refus tracé) |
| TR08-09 Retrait d'un contributeur | PSC | **PASS** | P-7 porté par le MCD : RG-L10, RG-L12 |
| TR08-10 Publication sans fuite | PSC | **PASS** | RG-L11 ; RG-P02 ; RG-P11 |
| TR08-01, 04, 06, 07, 08 | PASS | PASS | Inchangé |
| TR09-01 à 05 Paramètres de branche | FAIL | PASS | Propriétés de `SELECTION_PARTAGE` (point de départ, ascendance, descendance, unions, conjoints) ; RG-L08 |
| TR09-06 Sosa 16 non déductible | FAIL | PASS | RG-L08, RG-L11 ; P24 |
| TR09-07 BOURBON et BOVALO séparés | FAIL | PASS | Deux sélections, deux jeux de paramètres |
| TR09-08 Personne vivante masquée | PSC | **PASS** | `traitement_vivants` (défaut : exclus) ; RG-L09 (intersection avec les protections) |
| TR09-09 Prévisualisation exacte | FAIL | PASS | RG-L07 |
| TR09-10 Évolution sans élargissement | FAIL | PASS | RG-L05, RG-L06 |
| TR09-11 Réduction ou révocation | PSC | **PASS** | RG-L06 (réduction immédiate), RG-L12 |
| TR09-12 Aucune fuite | PSC | **PASS** | RG-L11 ; P20, P24 |
| TR10-04 Partage d'une branche avec le projet | FAIL | PASS | A depuis l'espace du tiers ; § 24.6 |
| TR10-06 Invitation privée | PSC | PSC | Inchangé : schéma technique d'identité (AV-11) |
| TR10-08 Transfert audité | PSC | PSC | Inchangé : P-8 |
| TR10-12 Invitation interceptée | PSC | PSC | Inchangé : schéma technique (AV-11) |
| TR10-01 à 03, 05, 07, 09 à 11 | PASS | PASS | Inchangé |
| TR11-01 à 03 Contribuer depuis tout arbre | FAIL | PASS | Une sélection se définit dans tout espace (arbre propre, arbre administré, arbre sans parenté connue) ; RG-L13 |
| TR11-04 à 12 | PASS | PASS | Inchangé |

### 4.3 REC-PR01 et critères 51 à 64

| ID | Étape 3 | V1.2 | Justification |
|---|---|---|---|
| PR01-01 Programme à plusieurs niveaux | PSC | PSC | P-1 |
| PR01-07 Contribuer une branche à un sous-projet | FAIL | PASS | RG-L13 (destinataire = sous-projet) |
| PR01-09 Déplacer un sous-projet | PSC | PSC | P-1 |
| PR01-02 à 06, 08, 10 à 12 | PASS | PASS | P23 confirme PR01-03, 04 |
| 51 | PASS | PASS | P23 |
| 52 Rattachement bilatéral | PSC | PSC | P-1 |
| 53 Axe ≠ relation historique | FAIL | PASS | RG-K09 ; P23 |
| 54 Sujet incertain | FAIL | PASS | RG-K10 |
| 55 Habilitation de groupe | PSC | PSC | P-2 |
| 56 Ressource sans accès | FAIL | PASS | RG-K11 ; P25 |
| 57 Lot rouvert sans droits | PSC | PSC | P-3 |
| 58 Avancement constaté | PSC | PSC | P-3 |
| 59 Partage non extensible | FAIL | PASS | RG-L05, L08, L11 ; P24 |
| 60 Consultation ≠ réutilisation | FAIL | PASS | RG-L10 ; `D-10` `réutiliser` |
| 61 Arbre pour un tiers | PSC | PSC | P-8 |
| 62 Indicateur explicite | PSC | PSC | P-4 |
| 63 Approbation ≠ validation ≠ diffusion | FAIL | PASS | RG-P09 à P11 ; P25 |
| 64 Révocation sans destruction | PASS | PASS | RG-L12 renforce |

### 4.4 Recettes des arbitrages AV (pour information, hors décompte)

| Recette | Étape 3 | V1.2 | Mécanisme |
|---|---|---|---|
| Lettre n° 12 : approbation invalidée, envoi bloqué (AV-8) | FAIL | PASS | D, E, F : RG-P08, P09, P11 (`resultat = bloquée`) |
| Financement par deux programmes (AV-9) | FAIL | PASS | G : RG-B16, RG-B17 |
| Révocation partielle 2 sur 10 (AV-10) | FAIL | PASS | A : RG-L06, RG-L12 |
| Ressource utilisée par plusieurs projets (AV-5) | FAIL | PASS | C : UTILISER (0,n) |
| Marie, lot rouvert (AV-6) ; rapport « 5 000 » (AV-7) ; lien intercepté (AV-11) | PSC | PSC | P-3, P-4, schéma technique |
| Recherche transversale et révocation (AV-9) | PASS | PASS | P20 |

## 5. Anomalies détectées et corrigées

| Réf. | Anomalie | Test exposé | Correction dans le MCD V1.2 |
|---|---|---|---|
| **AN-1** | La valeur `D-45` « contribution vers un espace partagé » pouvait se lire comme une voie vers le **Core partagé**, contournant `contribution privé→Core` et RG-B01 | Critère 8 | RG-L13 : les deux nouveaux types de flux ne peuvent jamais cibler un espace de type `Core partagé` |
| **AN-2** | Une série est une `PUBLICATION` « non figée » : y ajouter un numéro pouvait sembler modifier une publication parue, contre RG-P01 et RG-P03 | Critère 47, CU-18 | RG-P08 : l'appartenance est portée par le numéro (`PARAITRE_DANS`) ; ajouter un numéro ne crée aucune version de la série et n'en réécrit aucune |
| **AN-3** | L'introduction du domaine L décrit l'arbre comme situé « dans un espace privé ou familial », alors que la traçabilité V1.2 évoque un arbre du projet | Critère 23, CU-26 | Note V1.2 : `HEBERGER` vaut pour tout espace ; mêmes règles (RG-L01, RG-B01) ; l'arbre de projet est facultatif |

**Autres points examinés, sans anomalie :**
- `RAPPROCHEMENT` entre la reconstitution du projet et les personnes d'une sélection : la portée `inter-espaces` existe déjà (domaine F).
- Révocation d'une sélection ciblée par un `RAPPROCHEMENT` du projet : la conclusion reste, sa vérifiabilité est réévaluée (RG-L12), conformément à NR 18.
- `ETUDIER` sur un objet invisible pour certains lecteurs : RG-K13 empêche la révélation.
- `PRISE_EN_CHARGE` et P23 : aucune association vers les droits (RG-B15).

## 6. Points laissés au dictionnaire et au MLD

Ces points n'invalident aucun contrôle ; ils doivent être traités à l'étape 4 (dictionnaire V1.2) :

1. **Les 14 PASS SOUS CONDITION** : précisions P-1 (rattachement bilatéral), P-2 (habilitation de groupe), P-3 (TACHE, délégation), P-4 (indicateurs), P-8 (transfert), et obligations du schéma technique d'identité (AV-11).
2. **Circuit éditorial obligatoire** : RG-P11 exige l'approbation « lorsque le circuit éditorial de l'espace l'exige ». Le dictionnaire doit dire où ce paramètre est porté et quelle est sa valeur par défaut.
3. **Axe purement chronologique** sans objet cible : décider s'il faut réifier `ETUDIER` en fiche.
4. **Critère de « modification substantielle »** d'une publication (RG-P09).
5. **Fiches des concepts A à G** ; reprise de REC-01 (couverture MCD → dictionnaire) et REC-16 (couverture des tests) sur 173 contrôles.
6. **MLD** : ordre d'imputation des prises en charge (RG-B17), calcul du manifeste et du graphe accessible des sélections.

## 7. Verdict

### Résultat : **159 PASS — 14 PASS SOUS CONDITION — 0 FAIL / 173**

- **Non-régression** : 95/95 PASS. Aucun invariant P1 à P22 ni règle existante modifiés ; trois risques de contournement trouvés et fermés (AN-1 à AN-3).
- **AV-FONC-001** : les 26 FAIL sont levés ; les 14 PASS SOUS CONDITION relèvent tous du dictionnaire ou du schéma technique, aucun d'un concept.
- **Critère de réussite fixé par le porteur** : les sept ajouts couvrent les 26 FAIL sans altérer les 22 invariants existants, et P23 à P25 rendent explicites les frontières d'AV-FONC-001. **Atteint au niveau « vérifiée documentairement ».**

> **Le MCD V1.2 peut être proposé au gel**, sous réserve de la décision du porteur. Compte tenu de la limite d'indépendance (§ 1), il est recommandé de relire au moins les §§ 4.6, 13.5, 14.5, 18.6 du MCD et les trois corrections du § 5 avant de prononcer le gel.

**Condition de maintien du gel (inchangée).** Un futur FAIL ne rouvre le MCD que s'il démontre qu'un scénario métier n'est pas représentable avec les concepts existants. Une difficulté de dictionnaire, de MLD, de MPD ou d'architecture se traite à son niveau.

**Étape suivante après le gel :** étape 4 d'AV-FONC-001, dictionnaire V1.2 par la procédure de changement (§ 6).

## 8. Décision

**Gel du MCD V1.2 prononcé le 9/10/2026 par le porteur**, sur la base du présent rapport. La relecture complémentaire recommandée au § 7 n'a pas été posée comme préalable.
