# GENIIUS — Contrôle aveugle de la batterie V1.4 : justesse et couverture

**Date :** 11 octobre 2026.

**Documents contrôlés :**
- Contrat d'autorisation V1.4, candidat : `docs/04_CONTRAT_AUTORISATION/GENIIUS_CONTRAT_AUTORISATION.md`.
- Batterie V1.4 : `docs/04_CONTRAT_AUTORISATION/historique/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_4.md`, soit 230 scénarios.
- Tests : `spec/autorisation/tests/` (`base.py`, `test_scenarios.py`, `test_proprietes.py`, `test_transitions.py`).
- Modèle : `spec/autorisation/modele.py`, consulté seulement pour comprendre ce que vérifie chaque test.
- Références externes vérifiées :
  - `GENIIUS_MCD.md` : P24 ;
  - `GENIIUS_DICTIONNAIRE_DONNEES.md` : DI-L16, DI-L21, DI-A38, DI-A41, DI-E05, TI-11, OB-24 ;
  - `GENIIUS_MLD.md` : CP-27, CP-28, CP-40, ST-15.

**Méthode :**
1. **Rejeu des scénarios.** Chaque ligne a été relue contre le seul texte du contrat, selon les critères (a) à (e). Le test correspondant a été lu pour vérifier qu'il contrôle bien ce que dit la ligne.
2. **Instrumentation des codes de retour.** Les assertions `refus` et `refuse` de la batterie ont été instrumentées pour relever le code effectivement renvoyé (« refus » ou « introuvable »).
3. **Instrumentation des générateurs.** Les générateurs de `test_proprietes.py` ont été instrumentés : comptage des états atteints et des opérations réussies.
   - Réglages par défaut : 60 graines × 40 pas.
   - Réglages de `test_I08` : 120 graines × 60 pas, biais de transfert 25.
4. **Sondes ciblées.** Des scénarios ad hoc ont été écrits dans un dossier temporaire.
5. **Mutations.** 110 mutations du modèle ont été appliquées une à une sur une copie de `modele.py`, et la suite complète (257 tests) a été relancée contre chaque copie.

**Limites :**
- Le délai de réponse (« même délai », TI-11) n'est pas observable dans le modèle.
- Trois mutations sont équivalentes en pratique : M01, M02 et M106. Une règle redondante masque leur effet.
- La couverture d'une clause est jugée sur l'existence d'un test qui **échouerait** si la clause était violée, et non sur la seule mention de la clause dans un fondement.
- Aucun fichier existant n'a été modifié. Les scripts sont dans `%TEMP%\controle_b\`.

**État de départ :** suite complète verte, 257 tests en 7,7 s.

---

## Tableau A — Constats sur les scénarios

Les gravités suivent la règle de l'instruction :
- **M** : l'attendu exige une règle absente du contrat, ou le test ne vérifie pas réellement la ligne ;
- **m** : défaut mineur ;
- **O** : observation.

Un test est dit **non discriminant** lorsqu'il réussit encore après la suppression de la règle citée en fondement. Ce défaut est classé M lorsque la règle n'est vérifiée par aucun autre test, ce que les mutations du tableau D établissent.

| ID scénario | Critère | Description | Correction | Gravité |
|---|---|---|---|---|
| S-95 | (c) + test | L'attendu porte deux observations : « Accordé » et « RSP est notifié de l'entrée de Y ». Le test ne vérifie que l'accès. Or le modèle notifie l'acteur **nommé `RS`**, c'est-à-dire le RS de P, un tiers étranger à SP. `notifications = {'RS': [('admission_automatique', 'h9', 'Y')]}` : la notification ne va pas au bon destinataire, et elle fuit vers un tiers. La mutation M100, qui supprime la notification, survit. | Ajouter `assertIn(…, notifications['RSP'])` et l'absence de toute notification à un autre acteur. Corriger `_auto_admettre` : les RS de l'espace de l'HI. | **M** |
| S-129 | (d) + test | Z n'a aucun droit sur P et ne verrait pas O même sans embargo. Le test réussit donc quel que soit le § 9.5. La mutation M69 (bénéficiaire sans agrément) survit, et aucun test n'exerce le chemin positif `agreer_membre`. | Donner à Z une habilitation `voir` sur O ; vérifier « introuvable » sans agrément, puis « accordé » après l'agrément d'un gardien. | **M** |
| S-32 | (d) + test | Après le transfert, C n'a plus aucun droit sur ESP : T lui est invisible même sans embargo. La sonde le confirme : sans embargo, la recherche de C rend `[]`. La perte de la qualité de bénéficiaire et de gardien (§ 10.7) n'est pas testée, et la mutation M54 survit. | Rendre T public (diffusable) ou donner à C une HP de tiers sur T ; vérifier « introuvable » après le transfert. Vérifier aussi `C ∉ gardiens`. | **M** |
| S-202 | (d) + test | Le scénario porte sur une **HI**, qui ne dépend jamais de son signataire (F-1). Il ne peut donc pas éprouver la règle du § 2.5, qui concerne la dépendance des **HP**. La mutation M43 (une protection qui frappe le fondateur fait tomber l'HP) survit. C'est le seul test du § 2.5. | Réécrire sur une HP : TIT → V1 avec `repartager`, puis V1 → T ; protection posée sur V1 ; T doit rester « accordé ». | **M** |
| S-139, S-141 | (d) + test | Non discriminants :<br>• S-139 : o n'est pas diffusable, et le passage en `public` est refusé pour cette seule raison ;<br>• S-141 : `privé` est interdit pour le contenu, quel que soit l'auteur.<br>La mutation M87 (un non-RS change la visibilité du contenu) survit. La règle « un détenteur d'`éditer` sans `repartager` ne change pas la visibilité » (§ 13.2) n'est pas testée. | S-139 : o diffusable. Ajouter un cas où COL passe o de `public` à `projet` (réduction légale pour un RS) : attendu « Refus ». | **M** |
| S-227 | (d)(e) | Attendu : « la paternité de C reste attachée à O1 » après la voie (b). Le contrat ne pose la conservation de la paternité que pour le **versement** (§ 5.7, § 6.3). Le § 10.5, cité en fondement, n'en dit rien pour un changement de titulaire. L'attendu exige donc une règle absente du texte. | Ajouter au § 10.5 (b) : « la paternité est conservée » ; ou retirer le scénario. | **M** |
| ≈ 48 scénarios d'accès ou d'opération, dont S-07, S-15, S-22, S-26, S-28, S-29, S-30, S-33, S-37, S-52, S-69, S-89, S-90, S-94, S-97, S-113, S-115, S-125, S-161, S-162, S-164, S-165, S-166, S-170, S-206, S-212, S-218, S-221, S-225, S-226 et S-230 | (c)(d) | L'attendu dit « **Refus** », mais le contrat (§ 14 étape 6, § 15) impose « **introuvable** » pour un acteur qui ne connaît pas l'existence de la cible. Le modèle renvoie bien `introuvable`, mais le test n'affirme que `not ok`. La distinction refus / introuvable, centrale pour I-5, n'est donc vérifiée que par une poignée de tests. La mutation M44 (refus au lieu d'introuvable à l'étape 6) n'est détectée que par S-51. | Remplacer « Refus » par « Introuvable » quand l'acteur ne connaît pas la cible. Employer `absent()` au lieu de `refuse()`. | m |
| S-43 | (d) | ADM ne voit jamais le contenu (A2). Le résultat vide ne dépend donc pas de l'embargo, alors que le fondement cite A5 et § 14 étape 3. D'autres tests couvrent l'embargo en recherche (S-55, S-178). | Prendre RS2, membre non bénéficiaire, comme chercheur. | m |
| S-116 | test | L'attendu « M n'a aucun droit tant qu'il n'est pas admis » n'est pas vérifié par ce test. La règle est couverte par S-26. | Ajouter `refuse('M', o)`. | m |
| S-70, S-78 | test | « Journalisé » n'est pas vérifié : il n'y a aucune assertion sur `audit`. | Ajouter une assertion sur l'entrée d'audit (usage, désignation d'un gardien orphelin). | m |
| S-11, S-48 | test | « Le total est égal au nombre de lignes » (S-11) et « ni compté » (S-48) sont des tautologies : le modèle calcule `total = len(lignes)`. Le contrat exige des totaux calculés **après exclusion** ; il faut les comparer à l'état sans O. | Comparer au jumeau `retirer_objet_pour_test` (comme S-122), ou à une valeur attendue explicite. | m |
| S-11 | (b) | « l'objet non protégé Q » : le nom Q est déjà celui d'un espace type de la batterie. | Renommer l'objet (Q1). | m |
| S-112 | (b) | L'opération « RS1 délègue `voir` à V jusqu'à 20 » ne précise pas le périmètre. Le test prend le contenu de P. | Préciser « sur le contenu de P ». | m |
| S-133 | (a)(b) | La finalité n'est pas donnée dans les préconditions. Or, hors liste fermée, deux approbateurs sont requis de toute façon. Le scénario n'est discriminant qu'avec « diagnostic technique », que seul le test emploie. | Ajouter « finalité « diagnostic technique » » aux préconditions. | m |
| S-77 | (c) | L'opération annonce « SUP1 et SUP2 lèvent » ; le test appelle `lever_protection('SUP1', …)` seul. | Aligner la ligne (« SUP1, membre de l'autorité de dérogation, lève ») ou le test. | m |
| S-176, S-190 | (e) | Les fondements citent CD-10 (S-176) et CD-09 (S-190), absents du texte du contrat V1.4. | Citer la clause : § 10.6 pour S-176, § 12.3 pour S-190. | m |
| S-75, S-84, S-93 | test | « Rien n'est appliqué » n'est vérifié que par le propriétaire resté C. I-11 couvre l'atomicité par ailleurs. | Comparer un instantané de l'état avant et après. | m |
| S-24 | (d) | Refus dû au fait que LEC n'est pas gestionnaire, et non à A3 (S-06 couvre A3). | Aucune. | O |
| S-119 | (d) | Refus dû à « C n'est plus propriétaire ». La règle de la désignation de garde (premier transfert au seul bénéficiaire désigné) n'est pas éprouvée. | Voir le tableau E. | O |
| S-156 | (c) | Le contrat dit que la racine « reçoit » la liste ; le scénario la fait « demander ». | Aucune. | O |
| S-63 | (c) | « Même délai » n'est pas observable dans le modèle. | Résidu documenté. | O |
| S-15 | (a) | Le test clôt d'abord la nomination de RS2 par R0, ce que les préconditions ne disent pas. | Mentionner cette étape. | O |
| S-41 | (d) | Deux causes de refus cumulées : pas de rôle scientifique, et pas de droits déclarés. | Isoler une cause. | O |
| S-135 | (d) | A n'a aucun droit : le refus est acquis indépendamment du § 12.4. | Aucune. | O |
| S-172 | — | Pour une succession, le modèle impose d'office la voie (a) aux objets personnels du cédant. Le contrat ne le dit pas. Sans effet sur le scénario, puisque ESP3 n'a pas d'objet personnel. | Constat sur le modèle, à reporter. | O |

**Décompte :** 6 M, 12 m, 8 O. Aucun scénario n'a d'attendu **contraire** au contrat. Un seul exige une règle absente : S-227.

---

## Tableau B — Couverture par clause

Notation :
- P : au moins un test d'un cas permis ou accordé ;
- N : au moins un test d'un refus ou d'un cas introuvable ;
- (nd) : test présent mais non discriminant.

Les manques confirmés par une mutation survivante portent le numéro de la mutation.

| Clause | Tests | P / N | Manque |
|---|---|---|---|
| § 2.1 Survie des HI | S-16, S-35, S-108, S-146–148, S-152, S-179 ; S-153, S-177 | P / N | — |
| § 2.2 HP | S-14, S-17 ; S-22, S-69 | P / N | — |
| § 2.3 Restrictions | S-133, S-198/199, S-202, S-47, S-100/101, S-203–205, S-84 ; combinaisons | P / N | Effacement légal : jamais testé. Purge : seulement par la voie « purge » d'un transfert. |
| § 2.4 Protections d'existence | S-43 (nd), S-55, S-98, S-207, S-34, S-66 | P / N | Fin de phase d'une campagne : non testée. |
| § 2.5 Une protection n'est pas une perte de droit | S-202 (nd) | P seulement, sur une HI | Aucun test sur une HP (M43). |
| A1 | S-03, S-05, S-09, S-21, S-69, S-112–114 ; S-14, S-17, S-157 | P / N | Durée d'une HP (§ 8.1 (3), M81). Fondateur valide sans `repartager` (M39). |
| A2 | S-03, S-07, S-10, S-18, S-28, S-125, S-225, S-226 | N | — |
| A3 | S-01, S-02, S-04–06, S-24, S-44, S-137, S-161 ; S-117 | P / N | S'admettre (M04, élévation réelle). Se déclarer gardien ou bénéficiaire d'une protection existante : aucun test. |
| A4 | S-20, S-37, S-71, S-87, S-97, S-212, S-221 ; `test_hp_rupture_definitive` ; S-154 | P / N | Admission ou dérogation close non réactivée : aucun état généré (I-7). |
| A5 | S-46, S-48, S-55, S-98, S-177 | P / N | — |
| A6 | S-58, S-106 ; I-6, I-14 | N | Réévaluation à chaque page ou reprise : non testée. |
| A7 | S-156, S-228 | P | Aucun test négatif : qu'une prolongation, une confirmation ou une clôture ne réécrive pas l'identité du signataire. |
| I-1 | `test_I01`, S-109 | N | — |
| I-2 | `test_I02` | — | Affaibli (voir le tableau C). Aucune admission générée. |
| I-3 | `test_I03`, S-161 | N | Ensemble « rôle » non exercé. |
| I-4 | `test_I04`, S-206, S-125 | N | Pas de cible protégée dans `test_I04`. |
| I-5 | `test_I05`, S-122, S-11, S-99, S-223 | N | Opérations sur une habilitation à cible cachée non observées (fuite par `lever_examen`, tableau E). |
| I-6 | `test_I06`, S-58 | N | Seulement clôture et examen ; pas l'expiration, la restriction, le départ ni le retrait d'admission. |
| I-7 | `test_I07` | N | Habilitations seulement. |
| I-8 | `test_I08`, S-146–148, S-179 | P / N | « Aucune HI, nomination ni protection d'un tiers ne disparaît » : non vérifié. |
| I-9 | `test_I09` | N | Volet dérogation non exercé (M29). |
| I-10 | `test_I10` | — | Oracle auto-référent ; aucune rupture générée. |
| I-11 | `test_I11`, S-93, S-84 | N | Un seul point de panne. |
| I-12 | `test_I12` | — | Tautologique (voir le tableau C). |
| I-13 | `test_I13`, S-132, S-134 | N | — |
| I-14 | `test_I14` | N | Cycles et donnée indisponible : non testés. |
| T-01 | Très nombreux | P / N | HI sur une cible cachée au signataire (M104). |
| T-02 | S-90 ; `nomme()` | P / N | Acceptation pendant le gel (M14). |
| T-03 | — | — | `refuser_nomination` n'est **jamais appelée**. |
| T-04 | S-18, S-157, matrice | P / N | Prolongation dans un espace archivé (M91) ; pendant le gel (M17). |
| T-05 | S-158, matrice | P / N | — |
| T-06 | S-17, S-159 ; S-110 | P / N | — |
| T-07 | S-153 ; S-155 | P / N | — |
| T-08 | S-154, matrice | P | Levée après l'échéance (M51) ; pendant le gel (M16) ; sur une cible cachée (fuite). |
| T-09 | Nombreux | P / N | — |
| T-10 | S-71, S-87, matrice | N | — |
| T-11 | S-22, S-166, `test_hp_rupture_definitive` | N | — |
| T-12 | S-159 | P | Retrait du **dernier** fondateur, et retrait par un non-fondateur : non testés. |
| T-13 | S-29, S-97 | N | — |
| § 5.1 Espace | S-145, S-210–212, `test_espace` | P / N | Liste « restent possibles » en espace archivé (protections, transfert, dérogation) ; lecture en espace clos. |
| § 5.3 Admission | `test_admission`, S-164, S-165 | P / N | — |
| § 5.4 Protection | `test_protection`, S-200, S-201, S-78 | P / N | — |
| § 5.5 / § 12.5 Dérogation | `test_derogation`, S-71 | N | — |
| § 5.6 Transfert | `test_transfert`, `test_transfert_expire`, S-174/175 | P / N | Expiration non discriminante (M60). |
| § 5.7 / § 6.3 Titulaire | S-182–184, S-127 | P / N | Reprise des HP en HI au versement (`verser(reprises=…)`) jamais testée ; protections orphelines au versement : non testées. |
| § 6.1 | S-42, S-126, S-186, S-214 | P / N | Titulaire sans `contribuer au Core` : non testé. |
| § 6.2 | S-40, S-41, S-72, S-128, S-183, S-185 | P / N | — |
| § 7.1 | S-13, S-149, S-150, S-163, S-213–215 | P / N | — |
| § 7.2 | S-15, S-90, S-112, S-114 | P / N | Cible cachée au signataire (M104). |
| § 7.3 | S-16, S-153 | P / N | — |
| § 7.4 | S-111, S-151, S-168, S-182 | P / N | Renonciation du bénéficiaire nominatif : non testée. |
| § 7.5 | S-153–156 | P / N | — |
| § 7.6 | S-108, S-109, S-200 | P / N | — |
| § 8.1 | S-01, S-09, S-21, S-69 | N | Condition 3 (M81) ; condition 4 pour une HP (M82) et pour une HI (M83) ; condition 5 pour une HP. |
| § 8.2 | S-17, S-22, S-23, S-110, S-157, S-159 | P / N | Fondateur sans `repartager` (M39). |
| § 8.3 | S-160, S-17, S-229 | P / N | Admission au titre d'une HP sans la condition 1 (M79). |
| § 9.1 | S-06, S-24, S-26, S-116 | P / N | — |
| § 9.2 | S-162, S-163, combinaisons | P / N | — |
| § 9.3 | S-19, S-25, S-27, S-94–96, S-164, combinaisons | P / N | Mode `notification` sur une cible sensible ou protégée (M76, M77) ; admission par un RS hors périmètre (M80) ; notification de l'entrée (M100, et bogue de destinataire). |
| § 9.4 | S-161, S-165, S-170 | N | — |
| § 9.5 | S-129 (nd) | — | Agrément jamais exercé (M69). |
| § 10.1 | S-206, S-125, S-118, S-10 | P / N | Révocation d'un administrateur : non testée. |
| § 10.2 | S-225, S-226, S-116 | P / N | — |
| § 10.3 | S-11, S-12, S-99, S-222–224 | P / N | Réduction d'une habilitation à cibles mixtes (M34) ; totaux tautologiques. |
| § 10.4 | S-118, S-119, S-123, S-172 | P / N | Désignation de garde (premier transfert) : non testée ; le modèle ne la contrôle pas. |
| § 10.5 | S-39, S-67, S-68, S-75, S-85–87, S-93, S-228–231 | P / N | Gel des voies et des réémissions après présentation : non testé (le modèle renvoie `gel`). |
| § 10.6 | S-36, S-88, S-122, S-167, S-173–176, S-180, S-181 | P / N | **9 actes gelés sur 11 non testés** : M10–M17 et M19. |
| § 10.7 | S-30–38, S-146–148, S-168, S-177–179 | P / N | Perte des habilitations nominatives de C (M103), de ses qualités de bénéficiaire (M54), de ses groupes et admissions (M55, M56) ; maintien des interdictions qui visent C (M108). |
| § 10.8 | S-120, S-121, S-169–171 | P / N | Réintégration par une HP sur le contenu ou un groupe : non testée. |
| § 11.1 | S-76, S-131, S-74 | P / N | Créateur destinataire de sa propre interdiction (M68) ; RS hors périmètre. |
| § 11.2 | S-45, S-77–79, S-178, S-200, S-201 | P / N | — |
| § 11.3 | S-130 ; S-129 (nd) | P | Auto-ajout comme bénéficiaire : non testé. |
| § 11.4 | — | — | `ajouter_destinataire` n'est appelée que par le générateur aléatoire (0 succès). |
| § 11.5 | S-45, S-77, S-198, S-199 | P / N | — |
| § 11.6 | S-47, S-100, S-101, S-136, S-137, S-203–205 | P / N | Restriction enregistrée pour une autorité externe ; issue « maintien » ; contestation par un tiers ; période de validité. |
| § 12.3 | S-46, S-70, S-133, S-188–192, combinaisons | P / N | Accord du gardien revérifié à l'évaluation (M29) ; interdictions ; objet personnel public. |
| § 12.4 | S-81, S-132, S-134, S-135, S-187, S-197 | P / N | — |
| § 12.6 | S-193–196, `test_renouvellements` | P / N | — |
| § 12.7 | S-80, S-81 | N | Subordination (M70) ; lien d'intérêt (M71) ; identité renforcée (M72). |
| § 13.1 | S-89, S-216 | N | Public sans diffusabilité (M88). |
| § 13.2 | S-139 (nd), S-140–143, S-141 (nd), S-209 | P / N | Restriction aux détenteurs de `repartager` (M87). |
| § 13.3 | S-49–55, S-57, S-73, S-74, S-105 | P / N | — |
| § 13.4 | S-218–221 | N | — |
| § 13.6 | S-65 | N | Acceptation d'une insertion (`accepter_insertion`) jamais testée. |
| § 13.7 | S-64, S-91, S-144, S-217 | P / N | — |
| § 13.8 | S-61, S-62, S-107 | P / N | Lecture d'une contribution refusée par un autre acteur que l'auteur. |
| § 13.9 | S-59, S-60, S-83, S-106, S-138, S-208 | P / N | Absence des objets cachés dans la réplique : non testée. |
| § 13.10 | S-58, I-6 | N | Échéance des fondements d'une décision en cache. |
| § 13.11 | S-56 | P | — |
| § 13.13 | S-29, S-97 | N | — |
| § 13.14 | S-66, S-92 | N | — |
| § 14 | Étapes 1 (S-47), 2 (S-46), 3 (S-55, S-207), 4 (combinaisons), 6 (S-143), 7 (S-50, S-51) | P / N | Distinction refus / introuvable très peu vérifiée (tableau A). Étape 0 (purge) non testée. |
| § 15 | S-63, S-98, S-103, S-122, I-5 | N | Erreurs des opérations sur des habilitations (voir le tableau E). |
| § 16 | S-132, S-193–196 | N | `EXPIRATION_PRESENTATION` non discriminant (M60). |

---

## Tableau C — Propriétés et transitions

**Mesures** (graines et pas par défaut : 60 × 40 ; entre crochets, les réglages de `test_I08` : 120 × 60, biais 25) :

| État ou opération | Atteint |
|---|---|
| Admissions créées (`admettre` réussi) | **0 / 125 tentatives** [0 / 319] |
| Admissions automatiques | 0 [0] |
| HP créées | 7 [11] |
| HP en chaîne | 0 [2] |
| HP à plusieurs fondateurs | 0 [0] |
| Ruptures d'HP | **0** [0] |
| Confirmations réussies | **0 / 64** [0 / 160] |
| Dérogations, restrictions légales, sélections, lots | **0** (le générateur ne les produit pas) |
| Protections d'existence actives en fin de suite | 10 [20] |
| Protections orphelines | 1 [14] |
| `ajouter_beneficiaire`, `designer_gardien`, `lever_protection`, `lever_examen` réussis | 0, 0, 0, 0 [0, 1, 1, 0] |
| Transferts acceptés | **1** [521] |
| Transferts avec voie (b) | 5 [37] |
| Transferts avec réémission | 0 [0] |
| Espace archivé en fin de suite | 23 / 60 |
| HI suspendues | 4 [8] |
| `deleguer` réussi | 6 % des tentatives |
| Cas comparés par I-5 | 85 |
| Droits perdus et contrôlés par I-8 | 7 159, sur 521 acceptations |

| # | Test | Constat | Gravité |
|---|---|---|---|
| C-1 | Générateur | Il n'atteint **aucune** admission, aucune rupture d'HP, aucune confirmation, aucune dérogation et aucune restriction légale. Les « ensembles ouverts », les « dérogations » et les « HP en chaîne » ne sont donc pas réellement couverts par les propriétés : I-2, I-3, I-7, I-9 et I-10 ne voient pas ces états. Cause : `admettre` tire une habilitation et un acteur au hasard, alors que le groupe G n'a presque jamais de membre. | **M** |
| C-2 | `test_I12` | **Tautologique** sur sa première moitié : `_beneficiaire_effectif` renvoie vrai pour tout gardien, par construction (sonde : un gardien hors de `beneficiaires` → `True`). La seconde moitié vérifie le seul nom de l'opération, et non qu'elle émane d'un gardien. | **M** |
| C-3 | `test_I10` | L'oracle est la fonction même du modèle (`_hp_vivante`) ; aucune rupture n'est générée. La propriété ne peut échouer que si la propagation est désynchronisée de l'évaluation. | m |
| C-4 | `test_I02` | Affaibli de trois façons :<br>• droits limités à `voir`, `editer` et `exporter` ;<br>• la référence de restauration est l'**union de tous** les droits détenus à chaque archivage ou examen antérieur, et non ceux d'avant la suspension en cours ;<br>• aucune admission générée, donc M04 (s'admettre) survit. | m |
| C-5 | `test_I03` | Seuls ADM1 et ADM2 agissent, sur le seul groupe G. Les gestionnaires d'un rôle (les RS de F), la nomination d'administrateurs et les rattachements ne sont pas exercés. | m |
| C-6 | `test_I04` | Ne contrôle que les objets personnels ; « aucune cible protégée pour eux » n'est pas contrôlé ici. | m |
| C-7 | `test_I05` | Bonne construction (jumeau sans O). Mais :<br>• la surface observée omet les réponses des opérations sur des habilitations, les notifications, la réplique hors ligne, les unicités et l'écriture de références ;<br>• deux objets cachés au plus par acteur.<br>La fuite par `lever_examen` (tableau E) lui échappe. | m |
| C-8 | `test_I06` | Ne déclenche qu'à la clôture ou à l'examen. L'expiration, la restriction, le départ et le retrait d'admission ne sont pas couverts. L'oracle « reposait sur h » emploie `_fondements(chemin={h})` du modèle. | m |
| C-9 | `test_I07` | Admissions et dérogations jamais générées : la propriété ne porte que sur les habilitations. | m |
| C-10 | `test_I08` | Ne vérifie que les droits. Le second volet de l'invariant (« aucune HI, aucune nomination et aucune protection d'un tiers ne disparaît ») n'est pas testé. `par_c` inclut toute habilitation dont C est bénéficiaire, ce qui est plus large que « C en amont ». | m |
| C-11 | `test_I09` | Le volet « sauf dérogation dont le niveau satisfait les protections présentes » n'est pas exercé (0 dérogation) ; M29 survit. | m |
| C-12 | `test_I11` | Un seul point de panne (`_racine`). Acceptable, car les conditions préalables sont testées par les scénarios. | O |
| C-13 | `test_I13`, `test_I14` | Corrects. I-14 ne couvre ni les cycles ni la donnée indisponible. | O |
| C-14 | Matrice § 5.2 | HI seulement ; acteur R0 seulement. Pas de matrice HP (T-06, T-11, T-12). T-03 n'est jamais appelée. Certains refus de la matrice tiennent au **type** de l'habilitation (une délégation n'est pas « acceptable ») plutôt qu'à son état. | m |
| C-15 | `test_transfert_expire` | Non discriminant : la délégation faite à J+15 modifie l'empreinte, si bien que le renouvellement a lieu même sans expiration (M60 survit). | m |
| C-16 | `test_transfert_voies` | L'oracle juge que la voie (a) ou la purge réussit malgré un consentement retiré. Le § 10.5 cite le consentement retiré comme blocage, sans le restreindre aux voies (b) et (c) ; le § 10.7 ne mentionne que (b) et (c). L'oracle est une interprétation d'un texte ambigu. | m |
| C-17 | `test_derogation_niveaux` | Fidèle à la table du § 12.3 pour les cinq cibles. Absents : les interdictions (d'existence et d'action), la protection orpheline, l'objet personnel **public**, et la modification de la protection après l'octroi (seul S-189 le fait). | m |
| C-18 | `test_admission_x_beneficiaire`, `test_protections_x_acteur` | Oracles fidèles au texte. Une seule protection à la fois ; pas de cumul. | O |
| C-19 | Modèle (constat collatéral) | `lever_examen` ne contrôle pas la visibilité de la cible. Sur une HI dont la cible est cachée à la racine, elle **réussit** (`ok`) ; sur une HI inexistante, elle renvoie `refus`. Elle agit donc sur une cible cachée, ce qu'interdit le § 7.4, et sert d'oracle d'existence (§ 15). | **M** (modèle) |
| C-20 | Modèle (constat collatéral) | `_auto_admettre` notifie la chaîne littérale `'RS'` au lieu des RS de l'espace de l'HI (voir S-95). | **M** (modèle) |

---

## Tableau D — Mutations

**Résultat :** 110 mutations ; **68 détectées (61,8 %)**. Hors les trois mutations équivalentes en pratique (M01, M02, M106) : **68 / 107 = 63,6 %**.

Sur les règles de sécurité demandées :

| Règle | Détectées |
|---|---|
| A3 | 1 / 4, dont 2 équivalentes ; M04 survit (réelle) |
| Exclusions du § 9.4 | 3 / 3 |
| Gel du § 10.6 | 3 / 12 |
| Verrou du § 10.8 | 4 / 4 |
| Niveau de dérogation du § 12.3 | 6 / 7 |
| Filtrage du § 10.3 | 5 / 6 |
| Rupture des HP | 5 / 6 |
| Indépendance des approbateurs (§ 12.7, § 12.2) | 1 / 4 |

| Mutation | Clause | Détectée | Par quel test |
|---|---|---|---|
| M01 Auto-habilitation permise dans `deleguer` | A3 | non (équivalente : A1 refuse) | — |
| M02 Se nommer soi-même | A3 | non (équivalente : appartenance existante) | — |
| M03 S'ajouter à un groupe | A3 | oui | S-06, S-44 |
| M04 S'admettre soi-même | A3 | **non** | — |
| M05 Gestionnaire admis automatiquement | § 9.4 | oui | S-161, I-3 |
| M06 Cédant admis automatiquement sous verrou | § 9.4 / § 10.8 | oui | S-170 |
| M07 Admission automatique après retrait | § 9.4 | oui | S-165 |
| M08 Gel : création d'habilitation | § 10.6 | oui | S-180, `test_transfert` |
| M09 Gel : ajout d'un membre | § 10.6 | oui | S-36 |
| M10 Gel : levée d'une protection | § 10.6 | **non** | — |
| M11 Gel : désignation d'un gardien | § 10.6 | **non** | — |
| M12 Gel : ajout d'un bénéficiaire | § 10.6 | **non** | — |
| M13 Gel : nomination | § 10.6 | **non** | — |
| M14 Gel : acceptation d'une nomination | § 10.6 | **non** | — |
| M15 Gel : admission manuelle | § 10.6 | **non** | — |
| M16 Gel : levée d'un examen | § 10.6 | **non** | — |
| M17 Gel : prolongation d'une HI | § 10.6 | **non** | — |
| M18 Admission automatique non différée | § 10.6 | oui | S-181 |
| M19 Gel : nomination d'un administrateur | § 10.6 | **non** | — |
| M20 Verrou : nomination du cédant | § 10.8 | oui | S-120 |
| M21 Verrou : délégation au cédant | § 10.8 | oui | S-169 |
| M22 Verrou : admission manuelle | § 10.8 | oui | S-171 |
| M23 Verrou jamais posé | § 10.8 | oui | S-120, S-121, S-169–171 |
| M24 Restriction interne sans effet sur le niveau | § 12.3 | oui | S-133, combinaisons |
| M25 Objet sensible sans effet sur le niveau | § 12.3 | oui | S-192, combinaisons |
| M26 Objet personnel sans effet sur le niveau | § 12.3 | oui | S-190, combinaisons |
| M27 Accord du gardien non exigé à l'octroi | § 12.3 | oui | S-188, combinaisons |
| M28 Niveau non recalculé à l'évaluation | § 12.3 (CD-08) | oui | S-189 |
| M29 Accord du gardien non revérifié à l'évaluation | § 12.3 | **non** | — |
| M30 Un approbateur pour toute finalité | § 12.3 | oui | combinaisons |
| M31 Habilitation à cibles cachées listée | § 10.3 | oui | S-11 |
| M32 HP sur objet personnel listée | § 10.3 (CD-23) | oui | S-224 |
| M33 Journal : entrée sur cible cachée conservée | § 10.3 | oui | I-5 seulement |
| M34 Cible mixte non réduite | § 10.3 | **non** | — |
| M35 Explication sur cible cachée | § 10.3 / § 15 | oui | S-223 |
| M36 Protection sur objet caché listée | § 10.3 | oui | S-11, I-5 |
| M37 HP jamais close à la rupture | § 8.2 / T-11 | oui | `test_hp_rupture_definitive` |
| M38 Validité des fondateurs ignorée à l'évaluation | § 8.2 | oui | S-110 |
| M39 Fondateur valide sans `repartager` | § 8.2 | **non** | — |
| M40 Rupture jamais propagée | § 8.2 / T-11 | oui | `test_hp_rupture_definitive` |
| M41 HP vers l'amont permise | § 8.2 | oui | S-23 |
| M42 Confirmation circulaire permise | § 8.2 / T-06 | oui | S-110 |
| M43 Une protection sur le fondateur fait tomber l'HP | § 2.5 | **non** | — |
| M44 Refus au lieu d'introuvable (étape 6) | § 14 / § 15 | oui | S-51 seulement |
| M45 Restriction non levable ignorée | § 14 étape 1 | oui | S-203 |
| M46 Dérogation en `éditer` | § 12.4 / I-13 | oui | I-13 |
| M47 Trois renouvellements | § 12.6 | oui | S-193, `test_renouvellements` |
| M48 Carence ignorée | § 12.6 | oui | S-193, S-194, `test_renouvellements` |
| M49 Même justification acceptée | § 12.6 | oui | S-194 |
| M50 Examen par un RS non racine | § 7.5 | oui | S-155 |
| M51 Levée d'examen après l'échéance | T-08 | **non** | — |
| M52 HI dépendante de son signataire | § 2.1 | oui | S-16, S-35, S-146, S-154, S-181, I-8 |
| M53 K gardien de toutes les protections de C | § 10.7 | oui | S-178 |
| M54 C reste bénéficiaire des protections | § 10.7 | **non** | — |
| M55 C reste membre des groupes | § 10.7 | **non** | — |
| M56 Admissions de C conservées | § 10.7 | **non** | — |
| M57 Réémission plus large | § 10.7 | oui | S-85 |
| M58 Réémission d'une HP expirée | § 10.7 | oui | S-87 |
| M59 Empreinte courante non comparée | § 10.6 | oui | S-174, S-175 |
| M60 Présentation sans expiration | § 10.6 | **non** | — |
| M61 Engagements non filtrés pour K | § 10.6 / I-5 | oui | S-122 |
| M62 Voie (b) sur objet caché à K | § 10.5 | oui | S-231 |
| M63 Restriction non levable ignorée en voie (b) | § 10.7 | oui | S-84, `test_transfert_voies` |
| M64 Gardien désigné sans droit | § 11.2 | oui | S-201 |
| M65 Gardien qui garde sa qualité sans droit | § 11.2 | oui | S-78, S-79 |
| M66 Gardien d'office | § 11.2 | oui | S-78, S-79, S-178, I-12 |
| M67 Administrateur qui crée une protection | § 11.1 | oui | S-131 |
| M68 Créateur destinataire de sa propre interdiction | § 11.1 | **non** | — |
| M69 Membre d'un groupe bénéficiaire sans agrément | § 9.5 | **non** | — |
| M70 Subordination ignorée | § 12.7 | **non** | — |
| M71 Lien d'intérêt ignoré | § 12.7 | **non** | — |
| M72 Identité renforcée non exigée | § 12.2 | **non** | — |
| M73 Bénéficiaire qui est aussi approbateur | § 12.4 / § 12.7 | oui | S-81 |
| M74 Créateur qui examine la contestation | § 11.6 | oui | S-205 |
| M75 Notification admise partout | § 9.3 | oui | S-96, combinaisons |
| M76 Notification sur cible protégée | § 9.3 | **non** | — |
| M77 Notification sur objet sensible | § 9.3 | **non** | — |
| M78 HP vers un rôle de son espace sans admission | § 9.2 | oui | S-162, combinaisons |
| M79 Admission au titre d'une HP sans la condition 1 | § 9.3 / § 8.3 | **non** | — |
| M80 Admission au titre d'une HI hors périmètre | § 9.3 | **non** | — |
| M81 HP plus longue que les droits de l'auteur | § 8.1 (3) | **non** | — |
| M82 `repartager` implicite par une HP | § 8.1 (4) | **non** | — |
| M83 `repartager` implicite par une HI | § 8.1 (4) | **non** | — |
| M84 HI plus longue que le RS signataire | § 7.2 | oui | S-112 |
| M85 Clôture d'une nomination RS par un RS non signataire | § 7.4 | oui | S-111 |
| M86 Clôture d'une HP par un cofondateur | § 8.3 | oui | S-160 |
| M87 Visibilité changée par un non-RS | § 13.2 | **non** | — |
| M88 Public sans diffusabilité | § 13.1 | **non** | — |
| M89 Public désigné par un collaborateur | § 13.1 | oui | S-216 |
| M90 Écriture en espace archivé | § 5.1 | oui | S-145 |
| M91 Prolongation en espace archivé | § 5.1 / T-04 | **non** | — |
| M92 Admission en espace archivé | § 5.1 | **non** | — |
| M93 Cache sans contrôle d'époque | § 13.10 | oui | S-58, I-6 |
| M94 Échéance hors ligne de l'habilitant ignorée | § 13.9 | oui | S-208 |
| M95 Contribution intégrée sans réévaluation | § 13.8 | oui | S-61, S-107 |
| M96 Lot en `valider` | § 13.4 | oui | S-219 |
| M97 Fin de rattachement sans clôture | § 13.13 | oui | S-29, S-97 |
| M98 La racine quitte l'espace | § 7.6 | oui | S-109, I-1 |
| M99 Le titulaire détient `valider` | § 6.1 | oui | S-126 |
| M100 Notification de l'entrée supprimée | § 9.3 | **non** | — |
| M101 Sortie de l'ensemble sans clôture de l'admission | § 5.3 | oui | `test_admission` |
| M102 HI suspendue qui confère encore | § 7.3 / § 7.5 | oui | S-153 |
| M103 C garde ses habilitations nominatives | § 10.7 | **non** | — |
| M104 HI sur une cible cachée au signataire | § 7.2 | **non** | — |
| M105 Levée par un non-gardien | § 11.5 | oui | S-45, S-77, S-198 |
| M106 Proposition servie (calcul de périmètre) | § 13.3 | non (équivalente pour l'accès) | — |
| M107 Proposition servie (évaluation) | § 13.3 | oui | S-53 |
| M108 Interdictions visant C levées au transfert | § 10.7 (CD-21) | **non** | — |
| M109 Invité sans délégation qui crée un objet | § 6.2 | oui | S-185 |
| M110 Perte de gardien évaluée avec les protections | § 2.5 / § 11.2 | oui | S-78, S-79, S-200 |

M54, M55 et M56 forment des défenses redondantes : chacune survit seule parce que les deux autres suffisent à bloquer l'accès de C. Aucune n'est vérifiée isolément.

---

## Tableau E — Attaques absentes

| # | Attaque plausible | État du modèle | Test |
|---|---|---|---|
| E-1 | Un RS dont la nomination est bornée, ou à périmètre réduit, **s'admet lui-même** au titre d'une HI à un groupe dont il est membre. Son accès survit alors à sa nomination (A3). | Refusée, par sonde. | Aucun (M04). |
| E-2 | Contourner le gel pendant la fenêtre de présentation : nommer, faire accepter une nomination, admettre manuellement, lever un examen, prolonger, nommer un administrateur, lever une protection, ajouter un bénéficiaire, agréer un membre, désigner un gardien, changer de voie. Effet : élargir les engagements ou révéler un élément à K. | Refusée (`gel`). | Aucun pour 9 actes (M10–M17, M19), ni pour le changement de voie. |
| E-3 | **Sonder l'existence** d'une cible cachée par `lever_examen` (`ok` contre `refus`), et agir sur une HI dont la cible est cachée. | **Vulnérable** (C-19). | Aucun. |
| E-4 | Fuite par notification : l'admission automatique au titre d'une HI notifie un tiers (l'acteur `RS`) au lieu des RS de l'espace. | **Vulnérable** (C-20). | S-95 ne vérifie pas la notification. |
| E-5 | Le cédant garde, après le transfert :<br>• une délégation nominative sur ESP (M103) ;<br>• sa qualité de bénéficiaire d'une protection (M54) ;<br>• ses groupes et ses admissions (M55, M56). | Correct, mais par des défenses redondantes. | Non discriminé : S-30, S-31 et S-32 passent sous chaque mutation. |
| E-6 | Le cédant réintègre l'espace par une **HP** sur le contenu, signée par un collaborateur muni de `repartager`, ou par l'admission d'un groupe au titre d'une HP. | Refusée, par sonde (le texte du § 10.8, limité aux HI, est ambigu). | Aucun. |
| E-7 | Approbateurs non indépendants : un subordonné, un membre de l'espace concerné, une identité non renforcée. | Refusée. | Aucun (M70–M72). |
| E-8 | Dérogation sur une cible d'existence dont le gardien change après l'octroi : l'accord donné n'émane plus d'un gardien présent. | Le modèle ne revérifie que l'existence de l'accord par identifiant de protection. | Aucun (M29). |
| E-9 | Mode `notification` sur une cible sensible ou protégée, qui ouvre une admission automatique sur un objet sensible. | Refusée. | Aucun (M76, M77). |
| E-10 | Admission prononcée par un acteur non qualifié : un RS hors périmètre (HI), ou un tiers sans la condition 1 (HP). | Refusée. | Aucun (M79, M80). |
| E-11 | Chaîne d'HP qui allonge la durée au-delà des droits de l'auteur, ou transmet `repartager` sans l'accorder explicitement. | Refusée. | Aucun (M81–M83, M39). |
| E-12 | HI créée sur une cible cachée au signataire, qui devient un oracle d'existence et un accès donné à l'aveugle. | Refusée (`introuvable`). | Aucun (M104). |
| E-13 | Espace archivé : prolonger une habilitation, admettre un membre, lever un examen après l'échéance. | Refusée. | Aucun (M91, M92, M51). |
| E-14 | Habilitation à cibles mixtes listée en entier dans les métadonnées de gouvernance, ce qui révèle l'identifiant caché. | Réduite. | Aucun (M34). |
| E-15 | Un collaborateur rend public, ou réduit, un objet diffusable ; désignation du public sans diffusabilité. | Refusée. | Non discriminé (M87, M88). |
| E-16 | Un créateur d'interdiction s'y désigne lui-même destinataire pour se rendre « aveugle » ; un gardien s'ajoute bénéficiaire. | Refusée. | Aucun (M68). |
| E-17 | Une présentation expirée est acceptée avec l'ancienne empreinte. | Refusée. | Non discriminé (M60). |
| E-18 | Une réplique hors ligne contient un objet caché ; un tiers lit une contribution refusée. | Correct. | Aucun. |
| E-19 | Premier transfert d'un espace préparé pour un tiers proposé à un autre bénéficiaire (§ 10.4). | Le modèle **ne contrôle pas** la désignation de garde (sonde : transfert de ESPG à Z accepté). La clause est ambiguë. | Aucun. |
| E-20 | Une consultation par un acteur qui ne connaît pas la cible renvoie « refus » au lieu de « introuvable », ce qui divulgue l'existence. | Correct. | Un seul test (S-51) détecte M44 ; près de 48 scénarios ne distinguent pas les deux codes. |
| E-21 | Chemins jamais exercés : `refuser_nomination` (T-03), `agreer_membre`, `ajouter_destinataire`, `verser(reprises=…)`, `accepter_insertion`, `revoquer_administrateur`, `enregistrer_restriction_externe`, issue « maintien », effacement légal, lecture en espace clos. | — | Aucun. |

---

## Verdict sur le critère de gel

**1. « Aucun scénario dont l'attendu exige d'inventer une règle. »**
- **Presque atteint.** Un scénario, S-227, exige une règle absente du texte : la conservation de la paternité en voie (b). La correction se fait d'une ligne dans le contrat, ou par le retrait du scénario.
- Aucun attendu n'est **contraire** au contrat.
- Environ 48 attendus « Refus » sont imprécis là où le contrat impose « introuvable » (m).

**2. « Couverture suffisante pour servir de base de régression. » — Non atteint.**
- **6 constats majeurs sur les scénarios.** Quatre scénarios sont non discriminants, sur des règles qu'aucun autre test ne couvre : S-32, S-129, S-202, et S-139 avec S-141. S-95 a un attendu non vérifié et faux dans le modèle. S-227 exige une règle absente.
- **2 constats majeurs sur les propriétés** :
  - C-1 : les générateurs n'atteignent ni admission, ni rupture, ni confirmation, ni dérogation ;
  - C-2 : I-12 est tautologique.
- **2 défauts du modèle**, qu'aucun test ne voit (C-19, C-20). L'un est une fuite d'existence.
- **Taux de mutation de 63,6 %** hors mutations équivalentes. Le gel du § 10.6 n'est détecté que pour 3 mutations sur 12, et A3 laisse passer l'auto-admission.

Une batterie qui laisse survivre 39 mutations réelles, dont 9 sur le gel et 3 sur l'indépendance des approbateurs, ne protège pas le modèle contre une régression sur ses règles de sécurité. **Le gel est déconseillé en l'état.**

**Conditions minimales avant le gel :**
1. Rendre discriminants S-32, S-129, S-202, S-139 et S-141. Vérifier la notification de S-95. Corriger S-227 ou le contrat.
2. Ajouter un scénario par acte gelé du § 10.6, plus E-1, E-3, E-7, E-9, E-10 et E-11.
3. Corriger le générateur pour qu'il atteigne réellement les admissions (membres de G, rôle de F), les chaînes d'HP, les confirmations et les dérogations. Réécrire I-12 sans passer par `_beneficiaire_effectif`.
4. Remplacer `refuse()` par `absent()` là où le contrat impose « introuvable ».
5. Corriger `lever_examen` (contrôle de visibilité) et le destinataire des notifications dans le modèle.
