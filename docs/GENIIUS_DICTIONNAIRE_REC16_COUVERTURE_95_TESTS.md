# GENIIUS — Dictionnaire V1.1 consolidé

## Contrôle REC-16 : couverture des 95 tests jusqu'au niveau du dictionnaire

**Date :** 9 octobre 2026
**Critère contrôlé** (dictionnaire, annexe I, REC-16) : « La couverture des tests non critiques du rapport de 95 tests est auditée jusqu'au niveau DD — matrice 95 tests → DD/DI/TI/OB ».
**Sources :**
- tests : [rapport de réexécution des 95 tests](GENIIUS_RAPPORT_REEXECUTION_95_TESTS_MCD_V1_1.md) (§ 3, § 4, § 5) ;
- règles : [dictionnaire V1.1 consolidé](geniius_io_DICTIONNAIRE_DONNEES_V1.md).

### Méthode

Pour chaque test, on repart du mécanisme MCD invoqué par le rapport. On identifie ensuite, dans le dictionnaire, la fiche et les règles qui le rendent exécutable : `DD-*` (décisions), `DI-*` (intégrité), `TI-*` (règles transverses), `OB-*` (obligations transmises au MLD et au MPD), ou attribut contraint d'une fiche.

| Verdict | Signification |
|---|---|
| **R** | Couvert par au moins une règle `DD`, `DI`, `TI` ou `OB` explicite |
| **F** | Couvert par la définition, un attribut contraint ou un domaine de valeurs d'une fiche, sans règle numérotée dédiée |
| **X** | Non couvert |

Les tests critiques déjà couverts par l'annexe E du dictionnaire sont repris pour que la matrice soit complète. Ils sont signalés « (ann. E) ».

### Résultat global

| Batterie | Tests | R | F | X |
|---|---|---|---|---|
| Cas d'usage CU-01 à CU-25 | 25 | 22 | 3 | 0 |
| Critères de recette 1 à 50 | 50 | 44 | 6 | 0 |
| Non-régression 1 à 20 | 20 | 20 | 0 | 0 |
| **Total** | **95** | **86** | **9** | **0** |

**Verdict REC-16 : CONFORME.**
- Les 95 tests sont couverts au niveau du dictionnaire. Aucun ne dépend d'un mécanisme que le dictionnaire ne définit pas.
- Les 9 tests de niveau **F** sont couverts par des attributs et des domaines contraints, sans règle `DI` dédiée. Cela suffit au gel. Le MLD devra néanmoins citer explicitement ces contraintes (audit de cohérence, ECD-13 et ECD-29).

---

## 1. Cas d'usage (CDCF § 101–102)

| Test | Cas | Règles et fiches du dictionnaire | Verdict |
|---|---|---|---|
| CU-01 | Charles TANCRÈDE 1881–1890 | EVENEMENT (`mode_realite`, D-25) ; QUESTION DI-K03–K06 ; RECHERCHE_EFFECTUEE DI-K09–K11 ; INTERPRETATION DI-G12–G15 ; DEPENDANCE DI-A14–A18, OB-09 | R |
| CU-02 | Habitation Dolé 1793 | DD-04 (seuil d'individualisation) ; DI-E02, DI-E03 (densité non pondérante) ; CANDIDATURE DI-F07–F08 ; PROTOCOLE DI-K15–K17 | R |
| CU-03 | Registre perdu de Deshaies | DOCUMENT DI-C01–C04 ; RECONSTRUCTION DI-I01–I02 ; ELEMENT_RECONSTRUIT DI-I03–I06 ; REFERENCE_PERSISTANTE DI-A34–A36 | R |
| CU-04 | Projet CHARBONNÉ | ARBRE DI-L01–L02 ; OPERATION_FLUX DI-L06–L09 ; FILIATION DI-A19–A22 ; SNAPSHOT DI-K20–K22 ; DESIGNATION_GARDE DI-B27–B28 ; EXPORT DI-P05–P07 | R |
| CU-05 | Photo familiale | REPRODUCTION DI-C10–C12 ; PROPOSITION_IDENTIFICATION DI-F01–F04 (DI-F03 : une similarité visuelle ne suffit pas) ; CONSENTEMENT DI-B25 (biométrie) ; DI-E05 | R |
| CU-06 | Mémoire familiale | SESSION_MEMOIRE DI-J01–J03 ; ECHANGE DI-J04–J05 ; REPONSE DI-J06–J08 ; CAMPAGNE DI-J09–J10 ; CAPSULE DI-J11–J12 ; EMBARGO DI-B19–B21 | R |
| CU-07 | Mission aux archives | MISSION DI-K12–K13 ; MICRO_MISSION DI-K14 ; OB-16 ; RECHERCHE_EFFECTUEE DI-K09–K11 | R |
| CU-08 | Reconstruction territoriale | GEOMETRIE DI-N01–N04, N08 ; DD-16 ; SITUATION DI-G08 ; CARTE DI-N05–N07 | R |
| CU-09 | Statistique historique | CORPUS DI-O01–O03 ; METHODE DI-O05–O06 ; CALCUL DI-O07–O08 ; RESULTAT DI-O09–O12 ; DIFF_CONNAISSANCE DI-K20–K22 | R |
| CU-10 | Désaccord scientifique | ACTE_EVALUATION DI-H01–H04 ; ARGUMENT DI-H05–H06 ; LIEN_INTERET (fiche 4.21) | R |
| CU-11 | Publication à droits mixtes | PUBLICATION DI-P01–P04 ; EMBARGO DI-B19–B21 ; MASQUAGE DI-B22 ; LICENCE (fiche 4.13) ; DI-A04 (indexabilité) | R |
| CU-12 | Pérennité | EXPORT DI-P05–P07 ; IMPORT DI-P08–P10 ; FILIATION DI-A19–A22 ; DESIGNATION_GARDE DI-B27–B28 | R |
| CU-13 | « Un des fils de Jean DUPONT » | POSITION DI-F05–F06 ; CANDIDATURE DI-F07–F08 ; MENTION DI-D06–D08 | R |
| CU-14 | CHARBONNET / CHARBONNIER | ASSERTION DI-G01–G09 ; SELECTION_CONTEXTE DI-F13–F15, DD-08 | R |
| CU-15 | Emploi 1834 / 1837 / 1841 | DI-G08 (trois points ne font pas une continuité ; cite CU-15) | R |
| CU-16 | Photo « Joseph / Paul » | ASSERTION DI-G01–G09 ; REPONSE DI-J06–J08 ; ANNOTATION (fiche 6.3) | R |
| CU-17 | Convoi de 24 personnes | POSITION DI-F05 (jamais de personne « Inconnu ») ; COLLECTIF_HISTORIQUE (fiche 7.3) ; association MEMBRE_DE | R |
| CU-18 | « 47 personnes à Dolé » | RAPPROCHEMENT DI-F09–F12 ; RESULTAT DI-O09 ; PUBLICATION DI-P02–P03 ; DIFF_CONNAISSANCE DI-K20–K22 | R |
| CU-19 | Témoignage sous embargo | EMBARGO DI-B19–B21 ; PUBLICATION DI-P01 ; DECISION_APPLICABILITE_DROIT DI-B15–B16 | R |
| CU-20 | Validation 2028, preuve disparue 2035 | DD-13 (interdiction de supprimer un `ACTE_EVALUATION` passé à cause de la suppression d'une preuve ; « preuve n'est plus disponible » ≠ « n'a jamais existé ») ; ACTE_EVALUATION DI-H01–H04 | R |
| CU-21 | Arsène CHARBONNÉ dans deux Trees | RAPPROCHEMENT DI-F09–F12 ; REFERENCE_INTER_ESPACE DI-A23–A25 | R |
| CU-22 | Personne sans nom | REQUETE (fiche 17.1 : évaluée sur le graphe accessible) ; RESULTAT `liste de candidats` ; DD-04 (pas de personne sans trace) | F |
| CU-23 | Première / dernière attestation | DD-11 (statuts dérivés non saisissables : `premiere_attestation`, `derniere_attestation`) | R |
| CU-24 | Autorisation de voyage | EVENEMENT.`mode_realite` (D-25 : « une autorisation n'implique aucune réalisation ») ; ETAPE_VOYAGE DI-E08–E09 | F |
| CU-25 | Acte manquant | ANOMALIE_DOCUMENTAIRE DI-I07–I08 ; INTERPRETATION DI-G12–G15 ; PISTE DI-K07–K08 | F |

*CU-25 est classé F : DI-I07 et I08 définissent l'anomalie, mais la distinction « anomalie / hypothèse / travail à poursuivre » repose sur trois fiches distinctes et non sur une règle.*

## 2. Critères de recette (CDCF § 103)

| Crit. | Règles et fiches du dictionnaire | Verdict |
|---|---|---|
| 1 | D-02, D-03 ; DD-11 ; DD-14 ; DI-F03 | R |
| 2 | DI-D04, DI-D05 ; OB-01 | R |
| 3 | DI-D04, DI-D05 | R |
| 4 | DI-F10 | R |
| 5 | DI-E02 ; DD-04 | R |
| 6 | DI-E02 | R |
| 7 | DI-E02 ; DD-04 ; POSITION DI-F05 | R |
| 8 | DI-L06 ; DI-B14 | R |
| 9 | DI-A22 ; DI-L07 | R |
| 10 | DI-L08 | R |
| 11 | DI-P01 ; DI-B20 | R |
| 12 | DI-N01 ; DD-16 | R |
| 13 | DI-O10 | R |
| 14 | DI-A10 ; D-02 | R |
| 15 | DI-A34 à A36 ; DD-02 | R |
| 16 | DD-13 | R |
| 17 | DD-05 ; DI-H02 ; OB-08 ; OB-18 | R |
| 18 | DI-Q01, DI-Q02 | R |
| 19 | DI-G05 ; DI-K10 | R |
| 20 | DI-K04 | R |
| 21 | DI-K01 (réouverture sans effacer l'état de clôture ; cite le critère 21) | R |
| 22 | DI-E01 | R |
| 23 | DI-L01 ; DD-17 | R |
| 24 | DI-A01 ; DI-A20 | R |
| 25 | DI-A18 ; DD-13 ; OB-09 ; OB-12 | R |
| 26 | DI-G06 ; TERME_HISTORIQUE (fiche) | R |
| 27 | DI-E04 ; DI-G09 ; DI-G06 | R |
| 28 | DI-O04 | R |
| 29 | DI-G07 ; DI-O11 | R |
| 30 | DI-G07 | R |
| 31 | EVENEMENT.`mode_realite` (D-25, RG-E05) | F |
| 32 | EVENEMENT.`mode_realite` (D-25, RG-E05) | F |
| 33 | DI-C01 | R |
| 34 | DI-C08, DI-C09 ; ETAT_REFERENCE_EXTERNE DI-A26 | R |
| 35 | DI-H05 (un badge n'étaye jamais un argument ; cite le critère 35) | R |
| 36 | DI-H03 | R |
| 37 | LIEN_COMPTE_PERSONNE (définition : aucune propriété sur l'entité) ; REPONSE.`statut_temoin` (RG-J07) | F |
| 38 | Association SIGNALER_CONTEXTE (« la communauté ne modifie pas le texte » ; cite le critère 38) | F |
| 39 | FINANCEMENT (définition : sans effet sur l'évaluation ; cite le critère 39) | F |
| 40 | COMPTE.`identite_civile` (jamais affichée ; cite le critère 40) ; DI-B07, DI-B08 | R |
| 41 | DI-O09 | R |
| 42 | Règle de domaine RG-Q01 (domaine Q, aucune assertion ni contribution) | F |
| 43 | DI-Q02 | R |
| 44 | OB-19 ; DD-10 | R |
| 45 | DI-P06 ; DI-B19 à B21 | R |
| 46 | DI-P09 | R |
| 47 | DI-P02 | R |
| 48 | OB-01, OB-02 ; DD-01 | R |
| 49 | DI-E03 (cite le critère 49) | R |
| 50 | LACUNE DI-G16 ; D-19 (`indéterminée`) ; POSITION DI-F05–F06 | R |

## 3. Tests canoniques de non-régression

| # | Scénario | Règles du dictionnaire | Verdict |
|---|---|---|---|
| 1 | 50 projets référencent la même identité sans copie | DI-A23 à A25 (DI-A25 : ni copie, ni filiation, ni synchronisation) | R |
| 2 | État local divergent | DI-A19 à A22 | R |
| 3 | Rapprochement sans fusion irréversible | DI-F09 à F12 | R |
| 4 | Relation privée entre deux personnes publiques | DD-09 ; TI-10 ; DI-B12 ; DI-B13 (ann. E) | R |
| 5 | Preuve privée, conclusion justifiée publiquement | DEPENDANCE.`categorie` DI-A14 à A16 ; DI-A27, A28 ; DI-G12 (ann. E) | R |
| 6 | Suppression de compte sans perte d'attribution | DD-07 ; DI-B05 ; DD-13 | R |
| 7 | GEDCOM importé deux fois | DI-A30 ; DI-P08 ; OB-10 (ann. E) | R |
| 8 | Scission d'une cible Core sans réécrire Tree | DI-A25, A26 ; DI-L05 (ann. E) | R |
| 9 | Agrégat public sans révéler les secrets | P20 ; DI-B18 ; DI-O12 ; OB-03, OB-07 (ann. E) | R |
| 10 | Notification sans révéler une contradiction | DI-Q05 ; OB-03 (ann. E) | R |
| 11 | Export sans révéler une dépendance interdite | DI-P05 ; manifeste EXPORT (ann. E) | R |
| 12 | Traduction sans écraser l'original | DI-D01 (TRADUIRE) ; EXPRESSION_ASSERTION DI-G10, G11 | R |
| 13 | Même fichier dans deux contextes sans fusion documentaire | DI-C13 (déduplication **technique** seulement) | R |
| 14 | Raisonnement circulaire non compté | DI-A17 ; DI-A29 ; OB-08 (ann. E) | R |
| 15 | Positions incompatibles qui coexistent | DI-F16, F17 ; DI-H01 à H04 | R |
| 16 | Source importée non identifiée | DI-C19 à C21 | R |
| 17 | Nouvelle numérisation sans réutiliser l'alignement | DI-C12 (ALIGNEMENT_REPRODUCTION) ; DD-16 (interdits) | R |
| 18 | Retrait de consentement sans destruction automatique | DI-B23, DI-B24 (ann. E) | R |
| 19 | Tree souverain après évolution du Core | DI-A22, A25 ; DI-L03 à L05, L07 (ann. E) | R |
| 20 | API indistinguable entre absence et existence secrète | TI-11 ; DI-B12 ; OB-04 (ann. E) | R |

## 4. Observations transmises (sans effet sur le verdict)

1. **Tests de niveau F** (CU-22, CU-24, CU-25 ; critères 31, 32, 37, 38, 39, 42) : leur traduction dans le MLD doit citer explicitement l'attribut ou le domaine concerné (audit de cohérence ECD-13 et ECD-29).
2. **Test de non-régression 13 et déduplication.** DI-C13 limite la déduplication au niveau technique, ce qui suffit pour le test. L'unicité globale de l'empreinte dans le MLD crée toutefois une tension avec la purge et le cloisonnement des espaces (audit ECD-07). Cette tension relève du MLD, pas du dictionnaire.
3. Ce contrôle porte sur la batterie de tests du MCD. Les garanties introduites par le CDC technique (hors connexion, autorisations administratives…) ne font pas partie des 95 tests. Elles sont traitées par l'audit de cohérence.
