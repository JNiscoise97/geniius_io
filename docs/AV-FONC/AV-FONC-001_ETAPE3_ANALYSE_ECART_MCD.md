# AV-FONC-001 — Étape 3 : analyse d'écart du MCD V1.1

**Date :** 9 octobre 2026
**Objet :** confronter le MCD V1.1 gelé (`docs/geniius_io_MCD_V1.md`) aux scénarios de l'avenant intégré au CDCF V1.2. Il s'agit de déterminer précisément ce qui exige un nouveau concept (réouverture du MCD) et ce qui relève d'une précision du dictionnaire.
**Règle appliquée** (rapport des 95 tests, § 10) : le MCD n'est rouvert que si un scénario métier **ne peut pas être représenté** avec les concepts existants. Une difficulté de structure, de contrainte ou de valeur de domaine se traite au dictionnaire ou au MLD.

## 1. Méthode et verdicts

| Verdict | Signification |
|---|---|
| **PASS** | Représentable avec les concepts et règles existants |
| **PASS SOUS CONDITION** | Représentable, mais une **précision du dictionnaire** est nécessaire : attribut, valeur de domaine, contrainte, état. Pas de nouveau concept. |
| **FAIL** | Non représentable : un **concept** (entité ou association) manque dans le MCD |

Chaque FAIL est rattaché à un concept manquant, identifié par une lettre (§ 4).

**Batterie (78 contrôles) :**
- 6 cas d'usage (CU-26 à CU-31) ;
- 58 scénarios de recette (TR08 à TR11 et PR01) ;
- 14 critères de recette conceptuelle (51 à 64).

Les recettes propres aux arbitrages AV sont reprises au § 3.4, pour information.

## 2. Résultat global

| Batterie | Contrôles | PASS | PASS SOUS CONDITION | FAIL |
|---|---|---|---|---|
| Cas d'usage CU-26 à CU-31 | 6 | 1 | 1 | 4 |
| REC-TR08 | 10 | 5 | 3 | 2 |
| REC-TR09 | 12 | 0 | 3 | 9 |
| REC-TR10 | 12 | 8 | 3 | 1 |
| REC-TR11 | 12 | 9 | 0 | 3 |
| REC-PR01 | 12 | 9 | 2 | 1 |
| Critères 51 à 64 | 14 | 2 | 6 | 6 |
| **Total** | **78** | **34** | **18** | **26** |

**Verdict : la réouverture du MCD est justifiée.** Les 26 FAIL se ramènent à **sept concepts manquants** (§ 4). Aucun FAIL ne remet en cause un concept existant ou un invariant P1 à P22. Les 18 PASS SOUS CONDITION relèvent de précisions du dictionnaire déjà identifiées (§ 5).

## 3. Détail des contrôles

### 3.1 Cas d'usage

| CU | Scénario | Verdict | Mécanisme ou concept manquant |
|---|---|---|---|
| CU-26 | Les Colimaçons : familles, habitations, partage BOURBON (Sosa 27) et BOVALO (Sosa 31) limité | **FAIL** | (A) sélection de branche ; (B) axes. La reconstitution elle-même est représentable : ARBRE dans l'espace du projet, RG-E02, RAPPROCHEMENT, assertions sourcées. |
| CU-27 | Arbre offert au cousin, qui contribue aux Colimaçons | **FAIL** | (A) pour la contribution sélective. La désignation (DESIGNER → PERSONNE « destinataire futur ») et le transfert (TRANSFERT_GOUVERNANCE) existent. |
| CU-28 | Contribution externe Geneanet | **FAIL** | (A) pour proposer des branches. L'import et le réimport sont PASS (IMPORT, RECONCILIATION_IMPORT, RG-L04). |
| CU-29 | Programme antillais fédéré, accès à Pointe-Noire seulement | **PASS SOUS CONDITION** | RELIER_PROJETS « sous-projet de » ; APPARTENIR par projet ; P20. Précision : rattachement bilatéral (P-1). |
| CU-30 | Militaires réunionnais : inventaire, lots, identifications, rapports | **FAIL** | (C) ressources : inventaire de 10 000 fiches comme ressource du projet. Lots, indicateurs et rapports : PASS SOUS CONDITION (P-3, P-4). |
| CU-31 | Fédération des généalogies réunionnaises | **PASS** | RELIER_PROJETS non hiérarchique (complète, réutilise le corpus de) ; RAPPROCHEMENT pour les recoupements ; aucune fusion (RG-F04) |

### 3.2 Recettes REC-TR08 à TR11

| ID | Verdict | Mécanisme ou concept manquant |
|---|---|---|
| TR08-01 Créer le projet | PASS | PROJET ⊂ ESPACE |
| TR08-02 Associer plusieurs arbres sans fusion | **FAIL** | (A) : l'association d'un arbre au projet passe par une sélection partagée |
| TR08-03 Deux branches d'un même arbre | **FAIL** | (A) |
| TR08-04 Famille sans parenté connue | PASS | ARBRE du projet ; RG-E02 ; aucune assertion de parenté requise |
| TR08-05 Accepter une contribution | PASS SOUS CONDITION | FILIATION / REFERENCE_INTER_ESPACE ; précision : type de flux « contribution vers un espace partagé » (P-6) |
| TR08-06 Rapprochement familial sans fusion | PASS | RAPPROCHEMENT (RG-F04) |
| TR08-07 Changement dans l'arbre source signalé | PASS | FILIATION `divergents` (RG-L02) ; ETAT_REFERENCE_EXTERNE (RG-A11) |
| TR08-08 Refus de mise à jour conservé | PASS | FILIATION `divergence assumée` |
| TR08-09 Retrait d'un contributeur | PASS SOUS CONDITION | APPARTENIR ; conditions de réutilisation tracées (P-7, AV-10) |
| TR08-10 Publication sans fuite | PASS SOUS CONDITION | RG-P02, P20 ; liens et compteurs couverts par la sélection publiée : P-7 |
| TR09-01 Sosa 31 comme point de départ | **FAIL** | (A) |
| TR09-02 Ascendance paternelle seule | **FAIL** | (A) |
| TR09-03 Descendance | **FAIL** | (A) |
| TR09-04 Unions | **FAIL** | (A) |
| TR09-05 Conjoint sans son ascendance | **FAIL** | (A) |
| TR09-06 Branche du Sosa 16 non déductible | **FAIL** | (A). La non-déduction elle-même découle de P20 une fois la sélection définie. |
| TR09-07 BOURBON et BOVALO paramétrés séparément | **FAIL** | (A) |
| TR09-08 Personne vivante masquée | PASS SOUS CONDITION | DI-E05 (R par défaut) et MASQUAGE ; application à la sélection : (A) |
| TR09-09 Prévisualisation exacte | **FAIL** | (A) : manifeste de la sélection |
| TR09-10 Évolution sans élargissement | **FAIL** | (A) : sélection versionnée, avec propositions |
| TR09-11 Réduction ou révocation | PASS SOUS CONDITION | AV-10 : filiation de réutilisation liée à l'autorisation (P-7) |
| TR09-12 Aucune fuite par recherche, parcours, comptage, export | PASS SOUS CONDITION | P20, OB-03, OB-04 ; périmètre = sélection (A) |
| TR10-01 Arbre pour un tiers sans compte | PASS | ESPACE dédié + ARBRE |
| TR10-02 Bénéficiaire futur sans faux compte | PASS | DESIGNER → PERSONNE (« destinataire futur », MCD § 4.3) |
| TR10-03 Recherches attribuées | PASS | ACTIVITE, CREDIT, ACTEUR_GENIIUS |
| TR10-04 Partage d'une branche avec le projet | **FAIL** | (A) |
| TR10-05 Cadeau préparé sans accès | PASS | Aucune APPARTENIR avant acceptation |
| TR10-06 Invitation privée, limitée, révocable | PASS SOUS CONDITION | Schéma technique d'identité ; obligation MLD (AV-11) |
| TR10-07 Rôle accordé à l'acceptation | PASS | APPARTENIR |
| TR10-08 Transfert explicite et audité | PASS SOUS CONDITION | TRANSFERT_GOUVERNANCE ; précision : état, snapshot présenté, cessionnaire facultatif (P-8) |
| TR10-09 Chercheur collaborateur après transfert | PASS | APPARTENIR `collaborateur` |
| TR10-10 Le chercheur quitte l'arbre | PASS | Fin d'APPARTENIR ; crédits conservés (RG-B03, REV-02-D) |
| TR10-11 Pas de compte forcé | PASS | — |
| TR10-12 Invitation interceptée ou expirée | PASS SOUS CONDITION | Schéma technique ; vérification du bénéficiaire (AV-11) |
| TR11-01 Contribuer depuis son arbre GENIIUS | **FAIL** | (A) |
| TR11-02 Depuis l'arbre d'un tiers administré | **FAIL** | (A) |
| TR11-03 Depuis un arbre sans parenté connue | **FAIL** | (A) |
| TR11-04 Import GEDCOM Geneanet avec provenance | PASS | IMPORT, ACQUISITION_INFORMATION |
| TR11-05 Rapprochement proposé | PASS | RAPPROCHEMENT |
| TR11-06 Assertion contradictoire conservée | PASS | ASSERTION, POSITION_EPISTEMIQUE |
| TR11-07 Réimport sans écrasement | PASS | RECONCILIATION_IMPORT |
| TR11-08 Import identique sans doublon | PASS | OB-10 |
| TR11-09 Informations privées exclues | PASS | DI-E05, MASQUAGE, P20 |
| TR11-10 Publication avec crédits | PASS | PUBLICATION, CREDIT, RG-P02 |
| TR11-11 Aucune synchronisation Geneanet présumée | PASS | CDCF § 85 |
| TR11-12 Source externe disparue | PASS | ETAT_REFERENCE_EXTERNE, SOURCE_EXTERNE_DECLAREE |

### 3.3 REC-PR01 et critères 51 à 64

| ID | Verdict | Mécanisme ou concept manquant |
|---|---|---|
| PR01-01 Programme à plusieurs niveaux | PASS SOUS CONDITION | RELIER_PROJETS « sous-projet de » (CP-09) ; précision bilatérale (P-1) |
| PR01-02 Rejoindre Pointe-Noire seulement | PASS | APPARTENIR par projet |
| PR01-03 Projet frère privé, sans fuite d'existence | PASS | P20, RG-B11 |
| PR01-04 Administrateur du parent sans lecture | PASS | Aucune règle d'héritage ; CP-25 et CP-26 (MLD) |
| PR01-05 Deux sous-projets, deux rôles | PASS | APPARTENIR (0,n) |
| PR01-06 Révocation locale | PASS | Fin d'APPARTENIR |
| PR01-07 Contribuer une branche à un sous-projet | **FAIL** | (A) |
| PR01-08 Recherche transversale filtrée | PASS | P20, OB-03 |
| PR01-09 Déplacer un sous-projet sans élargir les droits | PASS SOUS CONDITION | Fin d'un rattachement et proposition d'un autre (P-1) ; aucun héritage |
| PR01-10 Clore un sous-projet | PASS | RG-K04, DI-K01 |
| PR01-11 Habitation référencée par deux projets | PASS | REFERENCE_INTER_ESPACE (RG-A08) |
| PR01-12 Trajectoire historisée | PASS | SITUATION, PRESENCE (DI-G08) |
| 51 Programme = projet ; administrateur sans lecture | PASS | PROJET ; CP-25, CP-26 |
| 52 Rattachement bilatéral, non transitif | PASS SOUS CONDITION | P-1 |
| 53 Axe ≠ relation historique | **FAIL** | (B) |
| 54 Sujet incertain sans entité fictive | **FAIL** | (B) |
| 55 Habilitation de groupe et admission | PASS SOUS CONDITION | GROUPE (objet d'un espace), MEMBRE_GROUPE, REGLE_ACCES ; P-2 |
| 56 Ressource sans accès | **FAIL** | (C) |
| 57 Lot rouvert sans droits | PASS SOUS CONDITION | TACHE ; délégation à cycle propre (P-3) |
| 58 Avancement constaté | PASS SOUS CONDITION | RG-K02 ; TACHE enrichie (P-3) |
| 59 Partage de branche non extensible | **FAIL** | (A) |
| 60 Consultation ≠ réutilisation | **FAIL** | (A), mode porté par la sélection ; plus valeur `réutiliser` dans D-10 (P-7) |
| 61 Arbre pour un tiers | PASS SOUS CONDITION | DESIGNER → PERSONNE ; P-8 |
| 62 Indicateur explicite et figé | PASS SOUS CONDITION | METHODE, CALCUL, RESULTAT ; P-4 |
| 63 Approbation éditoriale ≠ validation ≠ diffusion | PASS SOUS CONDITION → **requalifié FAIL** | (E) décision éditoriale et (F) diffusion manquent. ACTE_EVALUATION ne peut pas servir (AV-8). |
| 64 Révocation sans destruction | PASS | FILIATION, DEPENDANCE, DD-13 ; précisions P-7 |

*Note de décompte : le critère 63, d'abord classé PASS SOUS CONDITION, est requalifié FAIL après vérification. Le tableau du § 2 intègre cette requalification.*

### 3.4 Recettes des arbitrages AV (pour information)

| Recette | Verdict | Concept |
|---|---|---|
| Marie : lot rouvert sans droits (AV-6) | PASS SOUS CONDITION | P-3 |
| Rapport 2027 « 5 000 » figé et explicable (AV-7) | PASS SOUS CONDITION | P-4 ; snapshot et état de connaissance existants |
| Lettre n° 12 : approbation invalidée, envoi bloqué (AV-8) | **FAIL** | (D) série, (E), (F) |
| Financement par deux programmes (AV-9) | **FAIL** | (G) |
| Recherche transversale et révocation (AV-9) | PASS | P20 |
| Révocation partielle 2 sur 10 (AV-10) | **FAIL** | (A) |
| Lien d'invitation intercepté (AV-11) | PASS SOUS CONDITION | Schéma technique |
| Ressource utilisée par plusieurs projets (AV-5) | **FAIL** | (C) |

## 4. Concepts manquants : contenu du MCD V1.2

| Réf. | Concept | Nature | Définition proposée | FAIL couverts |
|---|---|---|---|---|
| **A** | `SELECTION_PARTAGE` | Entité ✓ (OBJET, versionnée), avec l'association `INCLURE_SELECTION` (SELECTION_PARTAGE — OBJET ou lien, version) | Sous-graphe gouverné d'un espace source, partagé avec un espace destinataire. Paramètres : point de départ, ascendance {aucune, paternelle, maternelle, les deux}, descendance, unions, conjoints sans ascendance, exclusions. Mode {consultation, réutilisation}. Évolution {figée, suivi par propositions}. État. Son **manifeste** (les objets et liens inclus, par version) est figé à chaque version : il sert de prévisualisation exacte. Les règles d'accès portent sur la sélection, jamais sur un individu racine. | CU-26 à 28, TR08-02 et 03, TR09 (9), TR10-04, TR11-01 à 03, PR01-07, critères 59 et 60, révocation partielle |
| **B** | `ETUDIER` | Association PROJET (0,n) — OBJET (0,n) | Axe de recherche : `type_axe`, période `DATE_HIST` facultative, statut, date. Un axe purement chronologique n'a pas d'objet cible. | CU-26, critères 53 et 54 |
| **C** | `UTILISER` | Association PROJET (0,n) — OBJET (0,n) | Ressource mobilisée : rôles (1..n, référentiel), date | CU-30, critère 56, recette AV-5 |
| **D** | `PARAITRE_DANS` | Association PUBLICATION numéro (0,n) — PUBLICATION série (0,n) | Rang, date ; la série est une PUBLICATION de type `série`, non figée | Lettre n° 12 |
| **E** | `DECISION_EDITORIALE` | Entité ✓ | Décision nominative sur une version de publication {relue, approuvée, refusée, approbation invalidée}, avec motif et date | Critère 63, Lettre n° 12 |
| **F** | `DIFFUSION` | Entité ✓ | Opération de diffusion d'une version : canal, audience, contexte d'évaluation, date, nombre de destinataires, résultat | Critère 63, Lettre n° 12 |
| **G** | `PRISE_EN_CHARGE` | Entité, ou association ESPACE financeur — ESPACE bénéficiaire | Ressource couverte, plafond, période, ordre d'imputation, état, référence facultative à un rattachement. **Recommandation : dans le MCD, domaine B, à côté d'ABONNEMENT**, puisque ABONNEMENT y est déjà. Même règle que RG-B05 : aucun lien vers les évaluations, rôles ou droits. | Financement par deux programmes |

**Invariants à ajouter au MCD V1.2 (proposition) :**

- **P23 — La hiérarchie des projets n'est pas une hiérarchie de la connaissance.** Coordonner, rattacher ou financer ne confère ni lecture, ni administration, ni autorité scientifique.
- **P24 — Partager une partie n'ouvre pas le tout.** Un partage porte sur une sélection explicite et versionnée. Ni la présence d'un conjoint, ni une relation, ni un parcours ne l'étendent.
- **P25 — Étudier, utiliser, publier et diffuser sont quatre actes distincts.**

## 5. Précisions du dictionnaire V1.2 (PASS SOUS CONDITION)

| Réf. | Précision | Origine |
|---|---|---|
| P-1 | RELIER_PROJETS « sous-projet de » en lien gouvernable : état {proposé, actif, refusé, terminé}, initiateur, deux décisions | AV-2 |
| P-2 | REGLE_ACCES au profit d'un groupe : fondement (rattachement), mode d'admission, admission individuelle | AV-3 |
| P-3 | TACHE : type, parent, dépendances, assignés multiples, périmètre de lot, délégation à cycle propre, échéance opérationnelle | AV-6 |
| P-4 | METHODE (profil indicateur), RESULTAT (contenu statistique), CALCUL (contexte d'évaluation) | AV-7 |
| P-5 | PUBLICATION : types éditoriaux ; VEILLE : profil d'abonnement éditorial | AV-8 |
| P-6 | D-45 : type de flux « contribution vers un espace partagé » ; DI-L06 généralisée | TR08-05 |
| P-7 | D-10 : action `réutiliser` ; filiation de réutilisation liée à la version de l'autorisation et de la licence ; réexamen sur révocation | AV-10 |
| P-8 | TRANSFERT_GOUVERNANCE : état, snapshot présenté, cessionnaire facultatif tant que l'état est `proposé`, droits résiduels | AV-11 |

## 6. Validation du porteur (9/10/2026)

**Décisions validées :** les sept concepts A à G ; `PRISE_EN_CHARGE` dans le MCD, domaine B, à côté d'`ABONNEMENT` ; les invariants P23 à P25, au même niveau normatif que P1 à P22. La validation porte sur les décisions présentées.

**Formulations normatives retenues** (elles remplacent celles du § 4) :

- **P23.** Les relations hiérarchiques ou fédératives entre projets constituent des relations d'organisation et de coordination. Elles ne créent, ne modifient ni ne valident aucune relation scientifique entre les objets étudiés et ne confèrent aucun droit implicite de lecture, d'administration ou de décision scientifique.
- **P24.** Le partage d'un sous-ensemble d'objets ou de relations n'autorise que les éléments explicitement inclus dans le périmètre versionné et effectivement autorisés. Il ne donne accès ni au reste de l'ensemble d'origine, ni aux objets nouvellement reliés, ni aux informations protégées accessibles par traversée indirecte du graphe.
- **P25.** Étudier un objet, utiliser une ressource, publier un contenu et diffuser une publication constituent quatre actes distincts, soumis chacun à leurs conditions et autorisations propres. Aucun de ces actes n'autorise implicitement les autres.

**Conditions posées :**

- **A — `SELECTION_PARTAGE` :** distinguer la définition (paramètres) du contenu (manifeste versionné). Une personne ajoutée ultérieurement à la branche BOVALO ne devient pas automatiquement accessible. « Une sélection définit quoi ; les mécanismes d'habilitation définissent à qui, pour quelles opérations et jusqu'à quand. » Conséquence : le destinataire et le mode (consultation / réutilisation) proposés au § 4 sont portés par `REGLE_ACCES`, pas par la sélection (MCD V1.2, choix C11).
- **G — `PRISE_EN_CHARGE` :** le MCD retient financeur, bénéficiaire, ressource, plafond, période, acceptation bilatérale, état et historique. Les détails de facturation (dont l'ordre d'imputation proposé au § 4) relèvent du MLD et du MPD. Aucune autorité (comme RG-B05) ; plusieurs accords peuvent coexister.
- **Pour tous :** pas de huitième concept ; pas de remodelage de `PROJET`, `CORPUS`, `PUBLICATION`, `TACHE` ni de la gouvernance. Pour chaque association : cardinalités, cycle de vie, droits et révocation ; « une association vers un objet privé peut révéler son existence ».
- **Vérification :** distinguer « spécifiée », « vérifiée documentairement » et « test exécuté » ; 173 contrôles à réévaluer (95 + 78).

**Statut :** rédaction du MCD V1.2 autorisée ; gel non prononcé. **Critère de réussite :** les sept ajouts couvrent les 26 FAIL sans altérer les 22 invariants existants, et les trois nouveaux invariants rendent explicites les frontières construites dans AV-FONC-001.

**Réalisation :** MCD V1.2 rédigé le 9/10/2026 (`docs/geniius_io_MCD_V1.md`, § 29 pour la synthèse et la couverture des 26 FAIL).

## 7. Suite

1. **Validation de ce rapport**, en particulier des sept concepts A à G et de l'emplacement de G dans le MCD.
2. **Rédaction du MCD V1.2 :**
   - ajout des concepts A à G et des invariants P23 à P25 ;
   - mise à jour de la traçabilité des critères (MCD § 23) avec les critères 51 à 64 ;
   - ajout des cas d'usage CU-26 à 31 à la mise à l'épreuve (MCD § 24).
3. **Réexécution des tests :** les 95 tests historiques (non-régression), plus les 78 contrôles de ce rapport, qui doivent tous passer en PASS ou PASS SOUS CONDITION. Nouveau rapport, puis nouveau gel du MCD.
4. **Étape 4** : dictionnaire V1.2, par la procédure de changement (précisions P-1 à P-8 et fiches des concepts A à G).
