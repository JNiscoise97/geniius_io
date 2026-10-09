# GENIIUS — Audit de cohérence interdocumentaire V1

## Matrice de traçabilité

**Date :** 9 octobre 2026
**Chaîne tracée :** exigence fonctionnelle (CDCF) → concept et règle MCD → règles du dictionnaire → structure ou contrainte MLD → exigence TECH → scénario de recette
**Documents :** [rapport](GENIIUS_AUDIT_COHERENCE_V1_RAPPORT.md) · [registre de corrections](GENIIUS_AUDIT_COHERENCE_V1_REGISTRE_CORRECTIONS.md)

## 1. Conventions

- **Référentiel fonctionnel.** Les identifiants A-01, K-01, CV-… cités dans les échanges de conception n'existent pas dans le CDCF du dépôt (ECD-03). Cette matrice utilise donc les identifiants réels du CDCF V1.1 :
  - les **50 critères de recette conceptuelle (§ 103)**, colonne `Crit.` ;
  - les **sections à portée technique**, colonne `§`.
- **Colonne MLD.**
  - Le **gras** signale une traduction citée explicitement (contrainte CP ou décision MLD).
  - Une table seule signale une structure présente, sans citation de la règle `DI-*`.
  - « — » signale l'absence de structure.
- **Statut de la chaîne :**
  - **T** — tracée de bout en bout, recette comprise ;
  - **P** — partielle : un maillon n'est pas démontré (règle `DI-*` non citée dans le MLD, ou recette manquante) ;
  - **R** — rupture : un maillon structurel est absent.
- **Écart** : renvoie au registre de corrections.

---

## 2. Les 50 critères de recette du CDCF (§ 103)

| Crit. | Exigence (résumé) | MCD | Dictionnaire | MLD | TECH | Recette | Statut | Écart |
|---|---|---|---|---|---|---|---|---|
| 1 | Statut épistémique compréhensible | `etat_examen`, `statut_validation`, ASSERTION nature/modalité/plausibilité | D-02, D-03, DD-11, DD-14 | `objet.etat_examen`, `statut_validation` (**CP-10**) | 018.6, 025.12 | REC-T07, S11 | T | — |
| 2 | Correction de transcription sans écrasement | RG-D01, VERSION_OBJET | DI-D04, DI-D05, OB-01 | `segment`, `segment_hist`, `version_objet` (**CP-01, CP-14**) | 031, REV-02-E | REC-K01, RB05 | P | ECD-13 (DI-D04) |
| 3 | Une autre source ne corrige pas une lecture | RG-D03 | DI-D04, DI-D05 | `segment` (**CP-14**) | 018 | REC-RB02 | P | ECD-13 (DI-D04) |
| 4 | Fusion incertaine réversible | RG-F04 | DI-F10 | `rapprochement` (**CP-13**) | AUDIT-TECH-010 | REC-I02, I05 | T | — |
| 5 | Personne sans Tree | RG-E02 | DI-E02, DD-04 | `personne` (**CP-13**) | 008.4 | — | P | ECD-30 |
| 6 | Personne sans descendant connu | RG-E02 | DI-E02 | `personne` | 018 | — | P | ECD-30 |
| 7 | Identité très incomplète | RG-E02 | DI-E02, DD-04 | `personne`, `position` | 018 | REC-R01 | T | — |
| 8 | Privé ne rejoint pas le Core sans action autorisée | RG-B01 | DI-L06, DI-B14 | `operation_flux` (**CP-04**) ; DI-B14 non citée | 003, 011 | REC-A02 | P | ECD-13 |
| 9 | Import Core → Tree non silencieux | RG-L02 | DI-A22, DI-L07 | `filiation.etat_divergence` ; DI non citées | 003.5 | REC-TR02, X13-05 | P | ECD-13 |
| 10 | Comparaison Tree ↔ Tree sans alimenter le Core | RG-L03 | DI-L08 | `comparaison` (**CP-04**) | 011 | REC-TR03 | T | — |
| 11 | Publication sans contourner un embargo | RG-P02, RG-P05 | DI-P01, DI-B20 | `publication` (**CP-13**), `embargo` ; DI-B20 non citée | 020, 026.11 | REC-J03, X14-14 | P | ECD-13 |
| 12 | Carte pas plus précise que les données | RG-N01 | DI-N01, DD-16 | `geometrie` (**CP-13, CP-14**) | 025.12 | REC-AT02, AT05, T06 | T | — |
| 13 | Statistique avec corpus et méthode | RG-O01 | DI-O10 | `calcul`, `corpus`, `methode` ; DI-O10 non citée | 016 | — | P | ECD-13, 30 |
| 14 | Proposition IA ≠ validation | RG-A06 | DI-A10, DD-15 | `activite` (**CK DI-A10**) | 017.2–3 | REC-TECH17, RB07 | T | — |
| 15 | Citation versionnée résoluble | RG-A05 | DI-A34–A36, DD-02 | `reference_persistante` (**MLD-12, CP-17**) ; DI-A36 non citée | AUDIT-TECH-010 | — | P | ECD-10, 30 |
| 16 | Preuve devenue inaccessible : vérifiabilité, pas histoire | RG-H04 | DD-13 | `acte_evaluation`, **MLD-15** | 020, AUDIT-TECH-002 | — | P | ECD-30 |
| 17 | Sources dépendantes non comptées comme indépendantes | RG-C03, RG-H02 | DD-05, DI-H02, OB-08, OB-18 | `independance()` (**CP-09, CP-10**) | 018 (L04) | REC-S01, S04–S07 | T | — |
| 18 | Mémoire capturée avant structuration | RG-Q02 | DI-Q01, DI-Q02 | `inbox_item` (**CP-05**) | 002.3 | REC-J01 | T | — |
| 19 | Recherche négative avec périmètre | RG-K01 | DI-G05, DI-K10 | `recherche_effectuee`, `recherche_perimetre` (**CP-13**) | 018 (L09) | REC-E05, E08 | T | — |
| 20 | Question rouvrable si ses fondements changent | RG-K03 | DI-K04 | `question` (**CP-21**) | 015.13 | REC-E02, X12 | T | — |
| 21 | Projet clôturé réouvrable | RG-K04 | DI-K01, DI-K02 | `projet` (**CP-03**) ; DI-K02 non citée | 031 | — | P | ECD-13, 30 |
| 22 | Nouvelle catégorie sans nouvelle application | RG-E06 | DI-E01 | `entite_historique` (**CP-08**) | 008, 031 | — | P | ECD-30 |
| 23 | Projet privé utilisant tout le Core | P7, MCD § 14 | DI-L01 | `arbre` (**CP-04**) | 008.4 | REC-A02 | T | — |
| 24 | Contribution = filiation, pas synchronisation | RG-A03 | DI-A01, DI-A20 | `filiation`, `operation_flux` (**CK DI-A20**) | 003 | REC-A02, X13 | T | — |
| 25 | Suppression ou restriction propagée aux dépendances | RG-A04 | DI-A18, DD-13, OB-09, OB-12 | `dependance.etat_impact` (**CP-21, CP-16**) | 015.13, 020 | REC-X12, X06 | P | ECD-06, 09 |
| 26 | Terme offensant conservé et contextualisé | RG-D04 | DI-G06 | `terme_historique`, `usage_terme`, `annotation` | 033.12 | — | P | ECD-30 |
| 27 | Classification non intrinsèque | RG-E03, RG-R02 | DI-E04, DI-G09, DI-G06 | `objet_classification.origine`, `assertion` ; DI-E04, G09 non citées | 018 | — | P | ECD-13, 30 |
| 28 | Groupe analytique ≠ groupe historique | RG-O05 | DI-O04 | `cohorte_analytique` ≠ `collectif_historique` | 018 | REC-R01 | T | — |
| 29 | Cooccurrence ≠ relation sociale | RG-G06 | DI-G07, DI-O11 | `resultat` (type cooccurrences) ; DI non citées | 018 | REC-R02 | P | ECD-29 |
| 30 | Proximité ≠ causalité | RG-G06 | DI-G07 | idem | 018, 025 | REC-AT03 | P | ECD-29 |
| 31 | Décision institutionnelle ≠ exécution | RG-E05 | (aucune `DI-*`) | `evenement`, `assertion` | 018 | — | P | ECD-29, 30 |
| 32 | Autorisation ≠ réalisation | RG-E05 | (aucune `DI-*`) | idem | 018 | — | P | ECD-29, 30 |
| 33 | Source prescrite ≠ source existante | RG-C05 | DI-C01 | `prescription`, `document` (**CP-13**) | 018 | — | P | ECD-30 |
| 34 | URL mort sans perte d'identité documentaire | RG-C06 | DI-C08, DI-C09 | `identifiant_documentaire`, `localisation_en_ligne` ; DI-C09 non citée | AUDIT-TECH-010 | — | P | ECD-13, 30 |
| 35 | Badge ≠ preuve | RG-H06 | DI-H04 | `badge` ; DI-H04 non citée | — | — | P | ECD-29, 30 |
| 36 | Majorité ≠ preuve décisive | RG-H03 | DI-H03 | `acte_evaluation` | REV-02-F | — | P | ECD-30 |
| 37 | Personne concernée témoigne sans posséder la vérité | RG-B04, RG-J07, RG-B10 | — | `lien_compte_personne` | 020 | — | P | ECD-30 |
| 38 | Communauté contextualise sans réécrire | RG-D04 | DI-G06 | `annotation` (note de contexte) | — | — | P | ECD-30 |
| 39 | Financement déclaré ≠ biais automatique | FINANCEMENT, RG-B05 | — | `financement` ; pas de FK vers évaluation (RG-B05) | REV-02-F | — | P | ECD-30 |
| 40 | Pseudonyme traçable en interne | `identite_civile`, `mode_affichage_public` | DI-B07, DI-B08 | `acteur_geniius`, `lien_compte_acteur` (**CP-06**) | 007.1 | — | P | ECD-30 |
| 41 | Résultat « potentiellement obsolète » sans recalcul | RG-O03 | DI-O09 | `resultat.fraicheur` (**CP-21**) | 015.13 | REC-X12, AT04 | T | — |
| 42 | Workspace privé sans modification du Core | RG-Q01 | — | `workspace` | 008 | — | P | ECD-30 |
| 43 | Inbox acceptant du brut | RG-Q02 | DI-Q02 | `inbox_item` (**CP-05**) | — | REC-J01 | T | — |
| 44 | API sans aplatissement de l'incertitude | RG-P07 | OB-19, DD-10 | **MLD-03**, § 3.4 | 018.6 | REC-T04 | T | — |
| 45 | Export patrimonial intelligible hors de GENIIUS | RG-P05 | DI-P06, DI-B19–B21 | `export` (**MLD-14**) ; DI-P06 non citée | 026, AUDIT-TECH-007 | REC-X05, TECH26 | P | ECD-25 |
| 46 | Restauration privée sans republication dans le Core | RG-P06 | DI-P09 | `reconciliation_import` (**CP-04**) | 003 | — | P | ECD-30 |
| 47 | Nouvelle publication sans réécriture de l'ancienne | RG-P03 | DI-P02 | `publication`, `correction_publication` ; DI-P02 non citée | 031 | REC-X12-10, AT04 | T | — |
| 48 | Ancien état reconstituable | P4, VERSION_OBJET, SNAPSHOT | OB-01, OB-02 | `version_objet`, `version_composant`, `snapshot` | 031, 012 | REC-TECH21 | T | — |
| 49 | Personnes peu documentées non dévalorisées | RG-E02 | — | — | 025 (UX) | — | P | ECD-30 |
| 50 | Dire « nous ne savons pas » sans fabriquer | LACUNE, POSITION | DI-G16 | `lacune`, `lacune_recherche` (**CP-05**) | 018 | REC-S09 | T | — |

**Bilan :** 19 critères tracés de bout en bout, 31 partiels, 0 rupture. Les critères partiels relèvent surtout de deux corrections transverses :
- la citation des règles `DI-*` dans le MLD (ECD-13, ECD-29) ;
- la création de recettes dédiées dans le CDC technique (ECD-30).

---

## 3. Sections du CDCF à portée technique

| § CDCF | Exigence | MCD | Dictionnaire | MLD | TECH | Recette | Statut | Écart |
|---|---|---|---|---|---|---|---|---|
| § 4.3–4.4, § 13 | Passage entre espaces par filiation explicite | RG-A03, RG-A08 | DI-A19–A23, DI-B14 | `filiation`, `reference_inter_espace`, `operation_flux` (**CP-04**) | 003, REV-02-G | REC-A02, X13 | T | — |
| § 26 | Tree souverain : trois flux | ARBRE, RAPPROCHEMENT, RG-F07, RG-L02–L03 | DI-L01–L10 | `arbre`, `noeud_arbre`, `operation_flux`, `comparaison` (**CP-04**) | 003, 011 | REC-X13, TR01–TR07 | T | — |
| (échanges CDC) | Partage sélectif de branche, réutilisation, projet collectif multi-arbres, arbre pour un tiers | C5 : ARBRE dans un espace privé ou familial | D-10 sans `réutiliser` ; D-45 | — | 003, 011 (L11-B) | REC-TR08–TR11 | R | ECD-20 (AV-FONC-001) |
| § 49 | Gouvernance : administration ≠ autorité | ATTRIBUER_ROLE | DI-B04, DI-B06 | `attribution_role`, `appartenance_espace` (**CP-25**) | 011.10, 027 | REC-X09–X11 | P | ECD-04, 18, 22, 23 |
| § 61–62 | Visibilité, découvrabilité, réutilisation ; permissions granulaires | REGLE_ACCES, RG-B11–B12 | DD-18, DI-B10–B14, OB-03–06 | `regle_acces`, § 22.1–22.3 (**CP-11, 12, 23–25**) | 011, AUDIT-TECH-004 | REC-X01, X08–X11 | P | ECD-04, 15 |
| § 64 | Conflits d'édition, jamais « last write wins » | CONFLIT_EDITION | DI-H08 | `conflit_edition.base_numero`, `proposition_modification` (**CP-05**) | 003.3–4 | REC-X17 | P | ECD-05 (hors ligne) |
| § 66–71 | Vivants, mineurs, masquage | PERSONNE.regime_protection, MASQUAGE | DI-E05–E07, DI-B22, F-2, EXT-02 | `personne.regime_protection`, `masquage` ; DI-E05, E06 non citées | 020.6 | REC-TR09-08, X14-11 | P | ECD-13, 27 |
| § 72, § 24.16 | Consentement Journal, volontés numériques | CONSENTEMENT, VOLONTE_NUMERIQUE | DI-B23–B25 | `consentement`, `volonte_numerique` ; DI-B23, B24 non citées | 020, L08 | REC-J10–J13 | P | ECD-11, 13 |
| § 73–75 | Droits par dépendance, vérifiabilité relative | DECISION_APPLICABILITE_DROIT, EVALUATION_DIFFUSABILITE | DI-B15–B18, DI-O12 | `decision_applicabilite_droit`, `evaluation_diffusabilite` (**CK DI-B17**) ; DI-O12 non citée | 011, REV-02-B, C | REC-X08, TECH16 | P | ECD-13 |
| § 82 | Export et format patrimonial | EXPORT, RG-P05 | DI-P05–P06 | `export`, `export_element`, `export_exclusion` (**MLD-14**) | 026, AUDIT-TECH-007 | REC-X05, TECH26 | P | ECD-21, 25 |
| § 83–84 | Réimport, restauration, import externe | IMPORT, RECONCILIATION_IMPORT | DI-P08–P10, OB-10 | `import`, `lignee_import`, `cle_import`, `reconciliation_import` (**MLD-11**) | 010, AUDIT-TECH-005 | REC-TR11, X20 | P | ECD-16 |
| § 85 | Synchronisation externe hors périmètre | — | — | — | (REC-TR11-11) | REC-TR11-11 | T | — |
| § 87 | Liens profonds, citation figée | REFERENCE_PERSISTANTE | DI-A34–A36 | `reference_persistante` (zone, fragment) | AUDIT-TECH-010 | — | P | ECD-10, 30 |
| § 88–89 | Pérennité, succession | DESIGNATION_GARDE, TRANSFERT_GOUVERNANCE | DI-B26–B28 | `designation_garde`, `transfert_gouvernance` | 012, 026, AUDIT-TECH-013, REV-02-H | REC-X21, X04 | P | ECD-09 |
| § 90 | Historique personnel et sessions | (historique) | DI-B05 | `historique_navigation` | 007.8 | — | P | ECD-17 |
| § 92 | Notifications sans révélation | NOTIFICATION | DI-Q05 | `notification`, § 22.3 | 011.4, REV-02-B | REC-X14 | T | — |
| § 93–94 | Sobriété, transparence et données sensibles en IA | ACTIVITE (DD-15) | DI-A10–A12, OB-15 | `activite` (moteur, version, fournisseur, données transmises) | 017 | REC-TECH17, J11 | P | ECD-11 |
| § 95 | Sécurité : MFA, sessions/appareils, URLs signées, chiffrement, audit | COMPTE | DD-07, OB-17 | `compte` (pas d'authentification ni d'appareil) ; **MPD-05** | 007, 019, 021, 030 | REC-TECH07, TECH19 | R | ECD-17, 26 |
| § 96 | Classification des données | CLASSIFICATION | DI-B* | `classification`, `objet_classification` | 020.7 | — | P | ECD-30 |
| § 97 | Suppression, archivage, dépendances | DD-13 (via dictionnaire) | DD-13, OB-12 | **MLD-15, CP-16** | 020, AUDIT-TECH-002 | REC-X06, X19 | P | ECD-07, 09, 10 |
| § 98 | Sources externes et liens morts | ETAT_REFERENCE_EXTERNE | DI-A24–A26, DI-C08–C09 | `etat_reference_externe`, `localisation_en_ligne` | 026 | REC-TR11-12 | P | ECD-13 |
| § 99 | Internationalisation | TERME_HISTORIQUE, langues | DD-12 | `terme_historique` (langue, écriture), `document_langue` ; `concept.libelle` monolingue | 033, AUDIT-TECH-011 | REC-NF07 | P | ECD-12 |
| § 100 | Monétisation compatible | ABONNEMENT, RG-B05 | — | `abonnement` (quotas en texte) | 029 | REC-NF08 | P | — |

---

## 4. Exigences TECH sans origine fonctionnelle dans le CDCF

M10-C08 impose, pour ces exigences, soit une origine fonctionnelle, soit une **justification technique explicite**.

| TECH | Objet | Origine trouvée | Ancrage MLD | Statut | Écart |
|---|---|---|---|---|---|
| 001 | Web + Desktop + Mobile | Aucune (décision des échanges CDC technique) | — | R | ECD-19 |
| 002 | Hors connexion (lecture de toute la base structurée sur Mobile) | Aucune | — | R | ECD-05, 19 |
| 003 | Cloud canonique, contributions hors ligne versionnées | Partielle : CDCF § 64 (conflits) | `conflit_edition` (base de version) | P | ECD-05 |
| 004 | Desktop installé, accès aux fichiers locaux | Aucune | — | R | ECD-19 |
| 005 | Synchronisation entre appareils | Aucune ; CDCF § 85 traite de la synchronisation externe, autre sujet | — | R | ECD-05, 19 |
| 008 | Monolithe modulaire | Justification technique (échanges) | — | P | — |
| 009 | Volumétrie et migrations massives | Cas « association de 40 généalogistes » (échanges) | MLD § 28.2 | P | ECD-19 |
| 012 | Sauvegardes, RPO, RTO | CDCF § 95 (« sauvegardes chiffrées, restauration testée ») | — (hors modèle) | T | — |
| 013–015 | Résilience, performance, tâches asynchrones | Justification technique | — | P | ECD-16 |
| 021–024 | Observabilité, environnements, CI/CD, tests | CDCF § 95 (logs d'audit), § 115 (phases) | — | P | — |
| 028–029 | SLO, coûts | CDCF § 100 (partiel) | `abonnement` | P | — |

---

## 5. Exigences P0 du CDC technique : chaîne de vérification

| Exigence P0 | Règle normative | MLD | Recette | Exécutable sur le MLD actuel ? |
|---|---|---|---|---|
| L14 — Aucun accès administratif implicite | REV-02-A, TECH-011.10 | § 22.1, CP-23 à CP-25, `appartenance_espace.nature_habilitation` et `lecture_scientifique` | REC-X09, X10 | **Oui** |
| L14 — Aucun contournement par une règle de rôle | REC-X11 arbitrage A | CK CP-26 sur `regle_acces` (révision du 9/10) | REC-X11-02 | **Oui** (ECD-04 corrigé) |
| L14 — Accès exceptionnel borné et audité | CP-24 | `regle_acces.nature`, `fondement`, `contexte_evaluation.regle_acces_id` (CP-24) | REC-X11-04, 09 | **Oui** (ECD-04 corrigé) |
| L01 — Propagation sans fausse certitude | REC-X12 A à C | CP-21 (asynchrone) | REC-X12-03 | **Partiellement** (ECD-06) |
| L11 — Souveraineté Tree | REC-X13 A à D | `arbre`, `filiation`, `rapprochement`, CP-04 | REC-X13 | **Oui** |
| L11-B — Partage sélectif, projets multi-arbres | Option C, TR08–TR11 | — | REC-TR08–TR11 | **Non** (ECD-20) |
| L13 — Confidentialité Connect | REC-X14 A à D | § 22.3 (campagnes), `participation_connect` | REC-X14 | **Oui** (sous réserve de ECD-04) |
| AUDIT-TECH-001 — Révocation hors ligne | CP-28 (retraits non qualifiés) | `espace.replication_hors_ligne`, `contexte_evaluation` ; schéma technique ST-01, ST-04 | REC-X02, X15 | **Oui**, sous réserve du protocole (architecture) |
| AUDIT-TECH-002 — Non-résurrection | — | CP-16 | REC-X19 | **Non** (ECD-09) |
