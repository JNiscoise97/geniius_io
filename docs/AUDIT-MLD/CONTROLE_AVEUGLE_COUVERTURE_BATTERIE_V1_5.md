# GENIIUS — Contrôle en aveugle de la batterie V1.5 (couverture, oracles, banc de mutations)

## En-tête

| Rubrique | Contenu |
|---|---|
| Date | 12 octobre 2026 |
| Objet | Batterie de tests du contrat d'autorisation V1.5 (candidat, non gelé) : justesse des scénarios, qualité des oracles, couverture, propriétés et transitions, banc de mutations |
| Documents lus | `docs/GENIIUS_CONTRAT_AUTORISATION_V1.md` (V1.5) ; `docs/AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_5.md` ; `spec/autorisation/tests/` (`base.py`, `test_scenarios.py`, `test_attaques.py`, `test_proprietes.py`, `test_transitions.py`, `couverture_etats.json`) ; `spec/autorisation/modele.py` (pour comprendre ce que vérifie chaque test) ; `spec/autorisation/mutations/` (`mutations.py`, `lancer.py`, `RESULTATS.md`, `JUSTIFICATIONS.md`) ; `spec/autorisation/generer_batterie.py` (pour vérifier la génération) ; pour les références externes : `geniius_io_DICTIONNAIRE_DONNEES_V1.md`, `geniius_io_MCD_V1.md`, `GENIIUS_MLD_V1_0.md` (CP-27, CP-28, CP-40, ST-15). |
| Documents non lus | Tout autre fichier de `docs/AUDIT-MLD/` (rapports, instructions, anciennes batteries, `historique/`), l'historique git. |
| Méthode | 1. Lecture intégrale du contrat, puis des 291 scénarios et 39 attaques, ligne par ligne contre le test Python correspondant (critères a à e). 2. Régénération de la batterie depuis les docstrings : le Markdown est **identique** au fichier livré. 3. Exécution de la suite complète sur une copie (`C:\Users\nisco\AppData\Local\Temp\controle_b15\`) : **373 tests, OK, 123 s**. 4. Sondes de discriminance : chaque scénario suspect est rejoué sous la mutation de la règle qu'il cite. 5. Mesure, test par test, des états réellement atteints par les générateurs (40 graines × 50 pas, valeurs par défaut). 6. Démonstration de la dépendance des oracles : une mutation de sécurité du banc est combinée avec l'altération d'un « outil de test » logé dans `modele.py`. 7. Banc : contrôle de validité, réexécution des 4 survivantes et de 2 témoins, examen des justifications avec un **témoin de non-équivalence** quand c'est possible. 8. **33 mutations nouvelles** sur des règles de sécurité, lancées sans arrêt au premier échec, au volume du banc (6 × 40) puis, pour les survivantes, au volume nominal (40 × 50) ; un témoin par survivante démontre qu'elle n'est pas équivalente. |
| Outils de contrôle (hors dépôt) | `C:\Users\nisco\AppData\Local\Temp\controle_b15\sondes\` : `mutations_controle.py`, `lancer_controle.py`, `temoins.py`, `sonde_m010.py`, `sonde_m013b.py`, `sonde_m013_m104.py`, `sonde_divers.py`, `mesure_etats.py`, `oracles_modele.py`, `i02.py`, `i09.py`, `discriminance.py`, résultats JSON. Aucun fichier du dépôt n'a été modifié. |
| Limites | Les verdicts « déductible / non déductible » portent sur le seul texte du contrat ; les codes de rapports cités entre parenthèses (CD-xx, CM-xx…) n'ont pas pu être résolus, faute d'accès aux rapports. Les sondes s'exécutent sur le modèle, qui n'est pas la production. Les états générés sont aléatoires à graines fixes : une absence de détection à 40 × 50 n'est pas une preuve d'équivalence ; c'est pourquoi chaque survivante a un témoin déterministe. « Même délai » (§ 15) n'est pas mesurable dans le modèle. |

**Gravités :** **M** majeur (bloque le gel : scénario qui exige une règle absente du contrat, test qui ne vérifie pas réellement ce qu'il annonce, oracle dépendant du modèle sur une règle de sécurité, état visé non atteint) ; **m** mineur ; **O** observation.

### Synthèse chiffrée

| Mesure | Résultat |
|---|---|
| Suite automatisée | 373 tests, tous réussis |
| Batterie régénérée | identique au fichier livré (291 scénarios, 39 attaques) |
| Constats | **M : 19** · **m : 44** · **O : 13** (A : 2/15/7 ; B : 4/3/1 ; D : 6/9/1 ; E : 3/2/1 ; F : 4/15/3 — F-05 renvoie à E-2 et n'est pas compté deux fois) |
| Banc publié | 156/160 détectées ; 4 survivantes confirmées (M010, M013, M032, M104) |
| Justifications | M010 **non recevable** (contre-exemple) ; M013 **non recevable** (contre-exemple) ; M032 recevable ; M104 recevable sous réserve (démonstration inexacte, repose sur un défaut G-10) |
| Mutations nouvelles | **33**, dont **8 détectées (24 %)**, au volume du banc comme au volume nominal (40 × 50) ; **25 survivantes, toutes non équivalentes** (témoin pour chacune) |
| Écarts du modèle non couverts par un test | 4 démontrés (admission différée après bascule ; pas de bascule sur restriction légale ; second passage orphelin non signalé ; purge + copie (c) acceptée) |

---

## Tableau A — Scénarios

Critères : (a) préconditions atteignables ; (b) noms sans ambiguïté ; (c) une opération, un résultat binaire et observable, et un test qui vérifie bien la ligne ; (d) attendu déductible du contrat ; (e) fondement exact. Les scénarios et attaques non cités ci-dessous ont été vérifiés conformes.

| ID | Critère | Description | Correction | Gravité |
|---|---|---|---|---|
| A-01 · S-87 | c | La ligne annonce « V reçoit « refus » ». Le test vérifie `absent` (« introuvable »). Le test a raison au regard du § 14 (V n'a plus aucun droit sur O1, devenu objet de K : il n'en connaît plus l'existence), mais la ligne et le test divergent, alors que la batterie distingue explicitement les deux réponses. | Docstring : « V reçoit « introuvable » ». | M |
| A-02 · `Combinaisons.test_transfert_voies` | d | L'oracle attend une acceptation réussie pour `voie='purge'` avec `copie=True` (8 cas). Or le § 10.5 réserve la copie autonome (c) « en complément de (a) ou de (b) ». Sonde : le modèle accepte, purge l'original et laisse à C une copie d'un objet purgé. De plus, pour la voie (a) ou la purge avec consentement retiré, l'oracle attend un succès alors que le § 10.5 cite le consentement retiré comme exemple de blocage sans le limiter à (b) ou (c) : non déductible. | Oracle : `copie` avec `purge` ou `g` → refus de `choisir_voie` ; trancher au contrat le sort du consentement retiré en voie (a) et purge. | M |
| A-03 · S-01, S-02, S-05 | e, c | Fondement A3 (« se créer une habilitation ») ; mais l'auteur ne détient aucun droit sur la cible : le refus vient de A1. Sondé : sous M001 (auto-délégation permise), les trois tests **réussissent**. Ils ne vérifient pas la règle citée. | Fondement A1 ; la règle A3 n'est réellement testée que par S-273 et S-291. | m |
| A-04 · S-04 | e, c | ADM n'est pas RS : le refus vient du § 7.1, pas de A3. Sous M002 (se nommer), le test réussit. | Fondement § 7.1, ou faire nommer par un RS sa propre personne (déjà couvert par a17-6). | m |
| A-05 · S-24 | e, c | LEC n'est pas gestionnaire du groupe : refus par le § 9.1. Sous M003 (s'ajouter soi-même), le test réussit. | Fondement § 9.1 (S-06 et S-44 couvrent A3). | m |
| A-06 · S-119 | b, e, c | Pré : « désignation de garde au profit de K » ; mais, après le premier transfert, C n'est plus propriétaire : le refus vient de « seul le propriétaire transfère ». Sous M062 (désignation ignorée), le test réussit. Le scénario n'exerce pas la désignation de garde. | Reformuler (« un ancien propriétaire ne transfère pas ») ; S-247 et S-248 couvrent la garde. | m |
| A-07 · S-170 | e, c | L'HI est signée par C : l'exclusion du **signataire** (§ 9.4, 1er tiret) suffit. Sous M014 (cédant non exclu), le test réussit. | Fondement § 9.4 (signataire) ; S-277 isole le cédant. | m |
| A-08 · S-09, S-21 | e | « § 8.1 (4) » désigne la **durée** ; le refus tient à l'absence de `repartager` (condition 1, A1). | « § 8.1 (1) ». | m |
| A-09 · S-236 | e | Le fondement « § 9.3 » ne contient pas la règle de périmètre de l'admetteur ; elle se déduit du § 2.1 (une admission au titre d'une HI est une HI, « dans le périmètre de ce RS ») et du § 7.2. | Fondement « § 2.1 ; § 7.2 ; § 9.3 ». | m |
| A-10 · S-276 | c, e | Oracle indirect : absence d'une ligne `admission_automatique` dans les journaux. Le contrat n'exige pas qu'une admission automatique soit journalisée : si le modèle cessait de la journaliser, le test deviendrait tautologique. La Pré annonce « sur le contenu de P » ; le test utilise `('objets', {o})`. | Observer le droit lui-même avec une action que le signataire ne détient pas autrement (RS révoqué puis renommé collaborateur, cf. E-2 M013) ; aligner la Pré. | m |
| A-11 · S-99 | c | Ligne : « aucune entrée ne mentionne T **ni son embargo** » ; le test ne vérifie que l'identifiant de T dans le champ des cibles visibles. Une ligne `creation_protection` à cibles vides (révélant qu'une protection a été posée) ne serait pas détectée par S-99 (elle l'est par I-5). | Vérifier l'absence de toute ligne née d'un acte sur T (comparaison au jumeau, comme S-11). | m |
| A-12 · S-95 | c | « …et personne d'autre » n'est vérifié que pour un message de forme exacte `('admission_automatique', h, 'Y')`. | Comparer l'ensemble des notifications de tous les acteurs avant/après. | m |
| A-13 · S-57 | d, c | « Accepté » pour l'inclusion de Q' dans une sélection **partagée** : le § 13.3 en fait une **proposition** sans effet sur l'accès ; le test ne vérifie ni la nature du résultat ni l'activation, où s'exerce la redistribution (§ 13.11). S-73, S-74, S-105 appliquent DI-A41 à l'ajout, ce que le texte ne précise pas. | Attendu : « proposition créée » ; ajouter l'activation et l'accès du tiers. | m |
| A-14 · S-123 | a | « Le propriétaire C est décédé » est simulé par `acteurs['C'].actif = False` alors que l'opération `constater_deces` existe ; la précondition n'est pas construite par la voie contractuelle (§ 10.4). | Constater le décès par deux approbateurs indépendants. | m |
| A-15 · S-33, S-37 | c, e | Assertions triviales : K n'a jamais eu de droit sur J (S-33) ; C a perdu tout droit à l'acceptation, avant l'archivage (S-37). La règle citée (A4 pour S-37) n'est pas mise en jeu. | S-37 : faire porter l'archivage/réouverture sur une habilitation close ; S-33 : vérifier le sort de l'HP de C (point CT-28 non arbitré). | m |
| A-16 · S-261 | c | Le maintien de l'embargo hérité est vérifié en lisant `herite_de` dans l'état ; aucun effet d'accès n'est observé. | Vérifier qu'un tiers non bénéficiaire reste « refusé » sur la copie après la levée sur l'original. | m |
| A-17 · `TransitionsAutres`/`test_gel_par_effet` (« créer objet ») | d | Attendu « non gelé » pour la création d'un objet du contenu pendant la fenêtre. Le § 10.6 ne dit pas si un nouvel objet du contenu élargit la « portée réelle » d'une HI dont le périmètre est le contenu de l'espace. | Trancher au contrat (§ 10.6) puis aligner. | m |
| A-18 · S-11 | c | « désignée par identifiant **et type** » : le type n'est pas vérifié. | Vérifier le champ `cible[0]`. | O |
| A-19 · S-107 | c | « reçue, réévaluée, refusée **et conservée** » : seul l'état final est vérifié. | Vérifier la conservation (lecture par l'auteur, déjà dans S-61). | O |
| A-20 · S-85 | c | « Refus de toute l'acceptation » sans contrôle « rien n'est appliqué » (contrairement à S-84, S-93, S-75). | Ajouter `instantane()`. | O |
| A-21 · S-51 | a | Les masques sont écrits directement dans l'état alors que `creer_selection(masques=…)` existe. | Utiliser l'opération publique. | O |
| A-22 · Systémique | a | Préconditions par écriture directe d'attributs : `diffusable`, `consentement_retire`, `effacement_legal`, `conservation_obligatoire`, `subordonnes`, `identite_renforcee`, `actif`, `relations`, `mentions`. Ce sont des faits externes (évaluation de diffusabilité, vérification d'identité, décision légale) ; acceptable, mais à déclarer comme tels dans la batterie. | Une note dans les règles de la batterie. | O |
| A-23 · Systémique | e | Les codes cités entre parenthèses CD-02…CD-23, CM-04…CM-34, CT-16, CT-18, CT-20, CT-25, CT-30, C-19 n'existent pas dans le contrat ; ils renvoient à des rapports. Le § cité à côté suffit, mais le code n'est pas résoluble depuis le référentiel. | Les retirer, ou les définir au § 17. | O |
| A-24 · Docstrings | b | `test_scenarios.py` et `base.py` se disent « V1.4 » et générer `…_V1_4.md` ; `test_attaques.py` annonce « 20 attaques » (39 tests). | Mettre à jour. | O |

---

## Tableau B — Oracles dépendants du modèle

Le critère de gel exige, pour les scénarios de sécurité, des oracles indépendants du modèle : « un test ne déduit jamais le résultat attendu d'une fonction du modèle ».

| # | Test(s) | Dépendance | Démonstration | Gravité |
|---|---|---|---|---|
| B-01 | `test_I05_non_divulgation` ; S-11, S-48, S-122 ; a04, a05 | L'état jumeau « O n'existe pas » est construit par `Systeme.retirer_objet_pour_test`, **fonction du modèle testé**. Elle n'efface pas les notifications, l'audit, les scellés, les contributions, les bases, les insertions en série, les lots ni les répliques : une fuite par ces canaux est présente dans les deux états et reste invisible (les notifications font partie des observations comparées). | M152 (journaux non filtrés) et M166 (compteur avant exclusion) font échouer I-5 ; **combinées avec l'outil neutralisé, I-5 réussit** (`oracles_modele.py`). | M |
| B-02 | `test_I02`, `test_I03`, `test_I08` | Les gains sont calculés par `droits_de` et `pouvoirs_de` (dans `modele.py`) ; I-2 utilise aussi `_objets_du_perimetre` (interne) pour l'exemption de levée d'examen. | I-3 détecte M011 seule ; **avec `droits_de` neutralisé, I-3 réussit**. | M |
| B-03 | `test_I04`, `test_I06b`, `test_I08`, `test_I09`, `test_I10`, `test_I12` | Oracle différentiel : la décision attendue est celle du **même** `acces`/`deleguer` sur un jumeau dont l'état est édité à la main (`h.etat='close'`, `p.etat='levee'`). Un défaut commun aux deux évaluations est invisible ; I-9 en est le cas extrême (D-10). | I-9 ne détecte ni M159, ni M160, ni M161, ni M091 (`i09.py`). | M |
| B-04 | `test_I06_cache_coherent` | Compare deux fonctions du modèle (`acces_en_ligne` et `acces`) au même instant ; aucun attendu extérieur. Le cache n'étant servi qu'au même instant (`c[3] == now`), le test ne voit pas un cache servi après une échéance. | N50 (cache servi au-delà de l'instant et de l'échéance) survit (tableau E-3). | m |
| B-05 | `SondesEquivalences` (justifications M010, M013, M032, M104) | Les sondes réécrivent la règle du modèle avec ses propres fonctions (`_gestionnaires_exclus`, `_meme`, `_gestionnaires`) et ne regardent que l'instant de chaque transition ; elles ne peuvent pas trouver un état où l'exclusion est évaluée plus tard (admission différée). | Contre-exemples M010 et M013 (E-2). | M |
| B-06 | `test_I13_derogation_bornee` | Le plafond de renouvellements est vérifié par le chaînage `renouvellement_de` tenu par le modèle : si le modèle ne chaînait plus, le contrôle passerait toujours. | — (S-193 et a20-3, observationnels, couvrent le cas). | m |
| B-07 | S-276 | Oracle porté par un comportement de journalisation non exigé par le contrat (A-10). | — | m |
| B-08 | S-167, S-227, S-228, S-261, S-262, S-72, S-87, S-107, S-62, S-65, S-251, a08 | Lecture directe d'attributs d'état (`scelles`, `presente`, `herite_de`, `copie_de`, `paternite`, `titulaire`, `reemission_de`, `contributions[k].etat`, `series`). Ce ne sont pas des fonctions, et les contrôles d'audit n'ont pas d'autre surface ; mais rien ne prouve que ces attributs pilotent l'accès. | — | O |
| B-09 | Points positifs | `frappe_existence` (I-5) est une transcription indépendante du § 2.4, § 9.5, § 11.3 ; les tables de `test_transitions.py` et les attaques n'appellent pas de fonction interne (hors a04/a05, B-01). | — | — |

---

## Tableau C — Couverture par clause

« + » : test où l'action est accordée ou l'opération réussit ; « − » : test de refus ou d'introuvable. Les manques marqués **(Nxx)** sont démontrés par une mutation survivante du tableau E-3.

| Clause | Tests positifs | Tests négatifs | Manques |
|---|---|---|---|
| § 2.1 HI (F-1) | S-16, S-108, S-152, S-35, S-146, S-147, S-148 | S-153 (examen) | Survie au **transfert du signataire non RS** et à l'interdiction du signataire non testée. |
| § 2.2 HP | S-14, S-17, S-157 | S-22, S-166 | — |
| § 2.3 Restrictions | S-101, S-199, S-204 | Combinaisons (protections × acteur), S-198, S-203, S-253, S-254 | « Consentement refusé » et « effacement légal » posés par écriture d'état ; levée « par une décision qui l'emporte » (restriction externe) non testée. |
| § 2.4 Protections d'existence | S-130, S-249, S-200 | S-43, S-207, S-55, S-66, S-265 | Gel de succession absent des suites aléatoires (D-01). |
| § 2.5 Ce que les catégories ne font pas | S-202 | a14, S-285 | G-7 non testé pour **prolonger** (N03) et **confirmer** (N04). |
| § 3 A1 | S-13, S-14, S-157 | S-69, S-03, S-21, S-112, S-113, S-114, S-288, a03 | HI prolongée par un RS dont le périmètre ne la couvre pas (N02) ; admission à une HP sans A1 (N06). |
| A2 | — | S-03, S-07, S-08, S-10, S-18, S-28, S-125, S-206, S-225, S-226 | Métadonnées de gouvernance lues par un simple membre (N14). |
| A3 | S-117 | S-273, S-291, S-274, S-275, S-244, S-06, S-44, S-137, a16, a17-5, a17-6 | S-01, S-02, S-04, S-05, S-24 non discriminants (A-03 à A-05) ; se désigner gardien soi-même (aucun test) ; contrôle par les effets limité à a01, a01b, S-161. |
| A4 | S-154 | S-20, S-37, S-97, S-212, S-221, S-71, T-11, `test_examen_expiration_pendant_suspension` | Dérogation révoquée puis « renouvelée » : non testé. |
| A5 | S-46 | S-43, S-48, S-98, S-55, S-74, a15 | Copie de copie (N13) ; destinataires hérités (N12). |
| A6 | — | S-58, S-106, I-6 | Un échec d'évaluation ne retire pas un gardien (N10) ; cache servi après échéance (N50). |
| A7 | S-156, S-227, S-262, S-78 | — | Traces des auteurs de suspension, prolongation, clôture : non vérifiées. |
| § 4 Invariants | Voir tableau D | | |
| § 5.1 Espace | S-240, S-255, a19-1, `test_espace_archive_table` | S-145, S-210, S-211, S-212, S-239, S-290, a12, a19-4, `test_espace` | Écriture du titulaire dans un espace **clos** ; dérogation en lecture dans un espace archivé ; transfert avec réémissions dans un espace archivé ; admission différée puis bascule (F-01). |
| § 5.2 T-01 | nombreux | nombreux | — |
| T-02 / T-03 | `nomme()` ; matrice HI | S-259, S-90 ; matrice HI (`refuser`) | — |
| T-04 | S-157, T04 | S-18, T04, T11 | N02, N03. |
| T-05 | a02 | S-158, T05, a19-6 | — |
| T-06 | S-17, T06 | S-110, T06 | N04. |
| T-07 / T-08 | S-153, S-154, a10 | S-155, matrice HI | **Mise en examen d'une HP** (N01). |
| T-09 | S-151, S-168, T09 | S-111, S-160, S-258 | — |
| T-10 | matrice HI (`expiree`), S-71 | — | Expiration d'une HP par le seul temps des fondateurs : couverte par S-157 seulement. |
| T-11 / T-12 | S-159 | S-22, T11, T06_T12 | — |
| T-13 | — | S-29, S-97 | — |
| § 5.3 Admission | `test_admission`, a10 | S-164, S-278, a11, a20-2 | Retrait d'une admission par un tiers (N07). |
| § 5.4 Protection | S-79, S-200 | `test_protection`, S-45, S-77 | Second passage à l'état orphelin (F-03). |
| § 5.5 Dérogation | S-46, S-70 | `test_derogation`, S-71 | Révocation par un non-membre de l'autorité (N18). |
| § 5.6 Transfert | `test_transfert` | S-175, a09, `test_transfert_expire` | — |
| § 5.7 Objet personnel | S-184, S-67, S-270 | S-127, S-256 | — |
| § 6.1 – 6.3 | S-42, S-72, S-182, S-184, S-185, S-186 | S-40, S-41, S-126, S-127, S-128, S-183, S-256, S-257, a06 | **Purge** : aucun test d'une purge réussie suivie d'une consultation (§ 14 étape 0). |
| § 7.1 – 7.3 | S-13, S-149, S-150, S-163, S-214 | S-15, S-90, S-112, S-114, S-213, S-215, S-235, S-238 | — |
| § 7.4 | S-151, S-168, a02 | S-111, S-258, a17-3 | Restreindre une nomination RS par un signataire qui n'est plus RS. |
| § 7.5 | S-154, a10 | S-153, S-155 | N01. |
| § 7.6 | S-108, S-200 | S-109, S-259 | — |
| § 8.1 | S-14, S-117 | S-09, S-21, S-113, S-288, S-289, a07, a14 | Conditions 1 et 2 pour admettre au titre d'une HP (N06). |
| § 8.2 | S-17, S-157, S-159 | S-22, S-23, S-110, S-166 | Cycle à trois niveaux (N40). |
| § 8.3 | T09, a18-2, a19-6 | S-160, T05 | — |
| § 9.1 – 9.2 | S-117, S-163 | S-06, S-24, S-26, S-115, S-116, S-162 | — |
| § 9.3 | S-19, S-25, S-27, S-54, S-95 | S-94, S-96, S-164, S-166, S-236, S-237, S-285, a20-5 | Pas de bascule sur **restriction légale** (F-02) ; admission différée traitée après bascule (F-01) ; N06, N07. |
| § 9.4 | S-181, S-240 | S-161, S-165, S-170, S-275, S-276, S-277, a01, a13, a17-5, a20-2 | Exclusion par **personne** après retrait (N08) ; gestionnaire devenu tel pendant le différé (E-2 M010). |
| § 9.5 | S-249 | S-129 | — |
| § 10.1 – 10.2 | S-248 | S-118, S-125, S-206, S-211, S-225, S-226, S-252, S-290 | — |
| § 10.3 | S-12, S-222, S-241 | S-11, S-99, S-223, S-224, S-252 | Lecture par un non-gestionnaire (N14) ; journaux d'une HP sur objet personnel (N15) ; explication sur l'objet personnel d'autrui (N16). |
| § 10.4 | S-172, S-248, S-269, S-270 | S-119, S-123, S-247, S-265, S-271, S-272, a08 | — |
| § 10.5 | S-67, S-68, S-228, S-229 | S-39, S-75, S-84, S-85, S-86, S-93, S-230, S-231, S-281, a18-3 | Purge + copie (c) (A-02, F-04). |
| § 10.6 | S-173, S-174, S-176, S-181, S-88 | S-36, S-122, S-175, S-180, S-279, S-280, S-292, `test_gel_par_effet` | Présentation lue par un tiers (N17) ; levée d'une restriction légale visible non gelée (N32). |
| § 10.7 | S-34, S-35, S-38, S-146 – S-148, S-179 | S-30 – S-33, S-177, S-178, S-282 – S-284 | — |
| § 10.8 | S-121 | S-120, S-169, S-171, S-277 | Consentement donné par un non-propriétaire (N21). |
| § 11.1 – 11.4 | S-130, S-249, S-200 | S-76, S-131, S-243, S-244, S-201, S-250 | Protection posée par un RS hors de son périmètre (N22). |
| § 11.5 | S-79, S-199, S-200 | S-45, S-77, S-198 | — |
| § 11.6 | S-101, S-204, a17-1 | S-47, S-100, S-136, S-137, S-203, S-205, S-253 | Contestation par un tiers (N19) ; examen par un seul approbateur (N20). |
| § 12.1 – 12.4 | S-46, S-70, S-191, S-268, `test_derogation_niveaux` | S-80 – S-82, S-132 – S-135, S-188 – S-190, S-192, S-197, S-254, S-267, a16, a19-5 | Protection orpheline : dérogation sans gardien (N53) ; protection qui ne frappe pas le bénéficiaire (niveau 1) ; gel : « fondement de la procédure » non exigé ni testé. |
| § 12.5 | `test_derogation` | — | N18. |
| § 12.6 | S-195, S-196, `test_renouvellements` | S-193, S-194, a20-3 | Consécutivité par **personne** (N09). |
| § 12.7 | — | S-80, S-81, S-232 – S-234, S-272, a08, a16 | — |
| § 13.1 – 13.2 | S-140, S-142, S-143, a20-4 | S-139, S-141, S-209, S-216, S-242, a17-4 | Notification de la réduction (avis) non testée. |
| § 13.3 – 13.4 | S-54, S-264, S-35 | S-49 – S-53, S-55, S-263, S-286, S-218 – S-221, a03 | — |
| § 13.6 – 13.7 | S-251, S-64, S-91, S-144 | S-65, S-217, a05, a19-3 | Insertion par un non-RS non-administrateur (N24) ; base `projet` sans action d'écriture (N23). |
| § 13.8 – 13.10 | S-59, S-62, S-83 | S-58, S-60, S-61, S-106, S-107, S-138, S-208, S-245, S-246, a19-5 | Cache après échéance (N50). |
| § 13.11 | S-56, S-57 | S-73, S-74, S-105, S-261, S-262, S-287, a15 | N12, N13. |
| § 13.13 – 13.14 | — | S-29, S-97, S-66, S-92, S-260 | — |
| § 14 | S-140, S-143, a20-4 | S-43, S-47, S-55, S-207, a19-2, Combinaisons | **Étape 0** (cible purgée) jamais testée. |
| § 15 | — | S-11, S-48, S-63, S-98, S-103, S-104, S-122, S-223, S-237, S-238, S-258, a04, a05, a17-3 | Notifications sur cible cachée (invisibles à l'oracle, B-01) ; identifiants opaques (hors modèle). |
| § 16 | — | S-132, S-138, S-175, S-193, S-196, I-14, a20-3 | — |

---

## Tableau D — Propriétés et transitions

Mesures obtenues avec `mesure_etats.py` (40 graines × 50 pas, poids par défaut des tests).

| # | Objet | Constat | Gravité |
|---|---|---|---|
| D-01 | `couverture_etats.json` | Les comptages publiés ne viennent pas des tests d'invariants : `ComptageEtats` génère ses propres suites, dont une avec `transfert=25` et `deces=1`. Dans les suites **par défaut** (I-1, I-2, I-4, I-6, I-7, I-9, I-12), sur 40 graines : **1** transfert accepté, **0** gel de succession, **0** réémission, `ajouter_destinataire` 0 réussite sur 18, `activer_proposition` 1, `retirer_membre` 1, `lever_examen` 2, `modifier_visibilite` 2, `prolonger` 4, `designer_gardien` 4, `reutiliser` 4. **Jamais générés** : `refuser_nomination`, `retirer_fondement`, `verser`/`renoncer`/purge, `clore_espace`, `designer_gardien_orphelin`, `agreer_membre`, `contester`/`examiner_contestation`, `lever_restriction_legale`, `revoquer_derogation`, `annoncer_reemission`, `rattacher`/`fin_rattachement`, `deleguer_lot`, `consentir_reintegration`, `nommer_administrateur`, `decider_succession`, `synchroniser`. Le critère « états visés effectivement atteints, comptages publiés » n'est pas satisfait pour ces transitions. | M |
| D-02 | Comptages par invariant | Les compteurs `I-5 cas vérifiés`, `I-6 clôtures vérifiées`, `I-8 transferts vérifiés`, `I-10 HP vérifiées`, `I-12 gardiens vérifiés` sont calculés mais **jamais publiés** : `ComptageEtats` s'exécute avant `Invariants` (ordre alphabétique) et écrit le JSON à ce moment-là. | M |
| D-03 | I-2 | Oracle dépendant (B-02). Les exemptions de `rouvrir` et `lever_examen` couvrent **tous** les gains sur les cibles concernées, sans vérifier « sans les dépasser ». Pouvoir de détection quasi nul sur A3 : I-2 seul ne détecte ni M001, ni M002, ni M003, ni M004, ni M011, ni M107 (`i02.py`, `oracles_modele.py`). | M |
| D-04 | I-3 | Seuls les actes de gestion de groupes, `preparer_invitation`, `nommer`/`quitter` dans F sont tirés ; pas d'HP en `notification`, pas de rattachement ni de prise en charge ; oracle `droits_de` (B-02). I-3 ne détecte pas M010. | m |
| D-05 | I-4 | Le jumeau clôt délégations et dérogations ; la partie « cible protégée pour eux » de I-4 n'est pas vérifiée. | m |
| D-06 | I-5 | 806 cas d'embargo d'existence, **14** d'interdiction d'existence, **0** gel de succession, **4** cas où x est cessionnaire d'une présentation, 33 objets copiés. Les sondes de réponses d'opérations omettent `admettre`, `clore`, `lever_protection`, `inserer_serie`, `ecrire_reference`, `ajouter_a_selection`. Jumeau construit par le modèle (B-01). | M |
| D-07 | I-6 | Seule la clôture a un oracle « accès qui ne reposait que sur ce qui a cessé » (I06b) ; expiration, restriction, suspension, sortie et retrait d'admission ne sont vérifiés que par cohérence du cache au même instant (B-04). | m |
| D-08 | I-7 | Correct sur les états stockés ; ne vérifie pas l'inopérance (non stockée). | O |
| D-09 | I-8 | 284 transferts acceptés, dont 22 en voie (b), 25 avec purge, **0** avec réémission : la clause « HP … qui n'ont pas été réémises » n'est jamais exercée par la propriété. | m |
| D-10 | I-9 | La propriété vérifie seulement la **monotonie** (« un accès accordé l'est aussi sans protection »), pas la primauté (« un acteur frappé est refusé »). Elle ne détecte ni M159 (étape 3 supprimée), ni M160 (étape 4 supprimée), ni M161 (étape 1 supprimée), ni M091 (non-levable franchie par dérogation). Les clauses « niveau d'approbation à l'instant de l'évaluation » et « aucune copie accessible » ne sont pas vérifiées. | M |
| D-11 | I-10 | **14 graines sur 40 écartées en entier** dès qu'une HI est suspendue ; seuls les périmètres `objet` sans protection sont vérifiés ; l'oracle est l'opération `deleguer` du modèle. | m |
| D-12 | I-11 | Une seule injection de panne (`_racine`) ; aucune variation des conditions de refus (couvertes par S-75, S-84, S-93). | m |
| D-13 | I-12 | La voie `designer_gardien_orphelin` est autorisée par l'oracle mais jamais générée ; la règle « tout gardien d'un embargo en est bénéficiaire » n'est vérifiée que si la cible n'a qu'une protection ; le second passage orphelin n'est pas observé (F-03). | m |
| D-14 | I-13, I-14 | I-13 : plafond lu sur `renouvellement_de` (B-06) ; un seul objet, deux approbateurs fixes. I-14 : seule la profondeur est testée (pas de cycle ni de donnée indisponible) ; N10 (un échec retire un gardien) survit. | m |
| D-15 | Transitions HI | La matrice ne porte que sur une nomination RS signée par la racine : la mise en examen d'une HP (N01), la prolongation hors périmètre (N02) et la restriction d'une délégation par un RS non signataire ne sont pas couvertes. | m |
| D-16 | Combinaisons | `test_transfert_voies` : oracle contraire au § 10.5 (A-02). `test_derogation_niveaux` : pas de protection qui ne frappe pas le bénéficiaire, ni de restriction non levable, ni de protection orpheline (N53), ni de gel. `test_gel_par_effet` : manquent `lever_restriction_legale` (N32), `examiner_contestation` (annulation), `agreer_membre`, `designer_gardien`, `consentir_reintegration`, `modifier_visibilite`. | M |

---

## Tableau E — Banc de mutations

### E-1 Validité du banc

| Point | Constat | Avis |
|---|---|---|
| Passage de référence | `lancer.py` exécute d'abord le modèle non muté et s'arrête s'il échoue. Réexécuté : « REFERENCE ok ». Suite complète au volume nominal : 373 tests OK. | Valide. |
| Cibles | `--verifier` : 160 mutations, 0 cible invalide ; les 160 mutants compilent (contrôle `compile`) ; aucune mutation identique à l'original. | Valide. |
| Reproduction | M010, M013, M032, M104 : survivent ; M062 et M159 : détectées par les tests publiés (S-247, I-5). | Conforme à `RESULTATS.md`. |
| Mode d'échec | Détection = code de retour non nul : un `ERROR` (exception) ou un dépassement de délai compte comme une détection ; `-f` ne conserve que le premier test. Aucune fausse détection constatée sur les mutants contrôlés, mais le banc ne distingue pas FAIL et ERROR. | m : enregistrer le type d'échec et tous les tests en échec. |
| Volume | Propriétés à 6 graines × 40 pas pendant le banc. | O. |
| Indépendance du score | 21 des 156 détections ont pour premier test un scénario S-273 à S-292, écrits **après** le banc pour tuer des mutants connus. Le score 156/160 mesure donc en partie l'ajustement de la suite au banc. Sur 33 mutations indépendantes, le taux tombe à 24 % (E-3). | M (le taux publié n'est pas une mesure indépendante). |

### E-2 Justifications des 4 survivantes

Définition (en-tête du contrat) : équivalence démontrée (mêmes observations dans **tout** état atteignable, démonstration écrite et sonde), défense redondante **déclarée par le contrat** (règle et test nommés), ou hors sécurité.

| Mutation | Justification proposée | Avis | Motif |
|---|---|---|---|
| M010 | Équivalence : les gestionnaires de l'ensemble bénéficiaire sont toujours parmi les « gestionnaires exclus » de l'espace. | **Non recevable** (M). | Contre-exemple atteignable (`sonde_m010.py`) : HI de RS en `notification` au profit du groupe g2 de GS ; P en fenêtre de transfert (ou archivé) ; X entre dans g2, son admission automatique est **différée** ; X devient administrateur de GS ; une protection posée sur o fait basculer l'HI en `approbation`. À la fin de la fenêtre (ou à la réouverture), `_traiter_differes` rappelle `_auto_admettre` : l'HI n'étant plus en `notification`, elle ne figure plus dans `_gestionnaires_exclus`. **Origine** : X n'est pas admis. **M010** : X est admis et obtient `editer` sur o. L'équivalence est fausse dès que l'exclusion est évaluée après la bascule. Accessoirement, la justification relève de la « défense redondante » (deux tirets du § 9.4), mais le registre ne nomme pas le test de la règle doublante. |
| M013 | Équivalence (défense en profondeur) : aucune voie ne crée d'admission de l'auteur. | **Non recevable** (M). | Contre-exemple (`sonde_m013b.py`) : une HI au profit d'un **rôle de son propre espace** ne demande **pas d'admission** (§ 9.2). X, RS, signe une HI `exporter` au profit du rôle `collaborateur` de P ; R0 révoque X, puis le nomme collaborateur. **Origine** : X n'exporte pas (le contrôle à l'évaluation l'écarte, A3 : « il n'y est jamais admis », « elle ne lui donne rien »). **M013** : X exporte o. La démonstration ignore le cas sans admission. |
| M032 | Équivalence : aucune opération n'ajoute d'action ni `repartager` à une habilitation existante. | **Recevable.** | Inventaire vérifié : seule `restreindre` écrit `h.actions`, avec contrôle d'inclusion ; `repartager` n'est jamais réécrit ; réémissions et reprises créent de nouvelles clés. Réserve : la sonde lit l'état du modèle, ce qui est admis pour une sonde de justification. |
| M104 | Équivalence : toute protection orpheline est signalée dans la même écriture. | **Recevable sous réserve** (m). | L'équivalence tient, mais pour une raison que la démonstration ne dit pas : `signalements` est une liste qui ne se vide jamais. Une protection redevenue orpheline une **seconde** fois n'est **pas re-signalée** (`orpheline_signalee` reste vrai : sonde `sonde_m013_m104.py`, une seule notification à SUP1), et la désignation d'office passe quand même. Le contrôle muté est donc inutile parce que G-10 est mal implémenté (F-03). La démonstration (« aucune autre voie ne retire de gardien ») est aussi inexacte : le transfert retire C des gardiens. À réexaminer après correction de G-10. |

### E-3 Mutations nouvelles (33)

Aucune ne reprend une mutation du banc (cible ou règle différente). Volume du banc : 6 graines × 40 pas, sans arrêt au premier échec. Chaque survivante a un témoin déterministe (`temoins.py`) : un état atteignable par des opérations publiques où l'origine et le mutant donnent des observations différentes (aucune n'est équivalente).

| Mutation | Règle | Détectée | Par quel test | Témoin de non-équivalence (origine → mutant) |
|---|---|---|---|---|
| N01 mise en examen d'une HP | § 7.5, T-07 | **Non** | — | R0 met en examen l'HP de COL : refus → accepté ; V : accordé → introuvable |
| N02 HI prolongée par un RS hors périmètre | T-04, § 7.2 | **Non** | — | RS1 (périmètre {o}) prolonge une HI sur le contenu : refus → accepté (échéance 10 → 20) |
| N03 prolongation sans exécution effective | § 2.5, T-04 (G-7) | **Non** | — | A, frappé d'une interdiction `voir`, prolonge son HP : refus → accepté |
| N04 confirmation sans exécution effective | § 2.5, T-06 (G-7) | **Non** | — | V2, frappé d'une interdiction `voir`, confirme : refus → devient fondateur |
| N06 admission à une HP sans conditions 1 et 2 | § 9.3, § 8.1 | **Non** | — | V (voir sans repartager) admet M : refus → admission créée |
| N07 retrait d'admission par un tiers | § 9.3 | **Non** | — | V retire l'admission de M : refus → M perd l'accès |
| N08 exclusion après retrait appréciée par compte | § 9.4 (G-1) | **Non** | — | second compte de Y admis automatiquement : introuvable → accordé |
| N09 consécutivité des dérogations par compte | § 12.6 (G-1) | **Non** | — | 4e dérogation consécutive au second compte de A : refus → accepté |
| N10 un échec d'évaluation retire un gardien | A6, § 11.2 | **Non** | — | gardien à chaîne trop profonde : conservé → retiré |
| N11 un échec d'évaluation rompt une HP | A6, I-14 | Oui | `test_I14_echec_ferme` | — |
| N12 destinataires d'une interdiction non hérités par la copie | § 13.11 (G-6) | **Non** | — | dérogation au destinataire B sur la copie sans accord du gardien : refus → accordée, B voit la copie |
| N13 non-levable d'un original de second rang | § 13.11 | **Non** | — | consentement retiré sur l'original ; copie de copie : refus → accordé |
| N14 gouvernance lisible par tout membre | § 10.3, A2 | **Non** | — | LEC liste les habilitations, COL lit les journaux : refus → accordé |
| N15 journaux : HP sur objet personnel visible | § 10.3 | **Non** | — | ADM voit la ligne de l'HP de TIT sur priv : non → oui |
| N16 explication des accès sur l'objet personnel d'autrui | § 10.3 (OB-24) | **Non** | — | ADM et R0 obtiennent l'explication sur priv : introuvable → accordé |
| N17 présentation lue par un tiers | § 10.6 (F-4) | **Non** | — | V lit la présentation : introuvable → accordé |
| N18 révocation d'une dérogation par un non-membre | § 12.5 | **Non** | — | V révoque la dérogation de A : refus → accepté |
| N19 contestation d'une restriction légale par un tiers | § 11.6 | **Non** | — | V conteste : refus → « en examen » |
| N20 contestation examinée par un seul approbateur | § 11.6, § 12.7 | **Non** | — | SUP3 seul annule : refus → restriction levée, TIT accède |
| N21 consentement à la réintégration par un non-propriétaire | § 10.8 | **Non** | — | RS2 consent puis délègue à C : refus → C accède au contenu |
| N22 protection posée par un RS hors périmètre | § 11.1 | **Non** | — | RS1 cache o2 à RS2 : refus → introuvable pour RS2 |
| N23 base `projet` sans action d'écriture | § 13.7 | **Non** | — | INV (voir seul) crée la base : refus → accepté |
| N24 insertion en série sans être RS ni administrateur | § 13.6 | **Non** | — | COL insère o au rang 1 : refus → inséré |
| N25 échéance hors ligne de l'habilitant ignorée | § 13.9 | Oui | S-208 | — |
| N26 contribution refusée lisible par autrui | § 13.8 | Oui | S-245 | — |
| N27 étape 1 : « refus » révèle l'existence | § 14, § 15 | Oui | S-47, `test_I05` | — |
| N28 étape 4 : « refus » révèle l'existence | § 14, § 15 | Oui | S-133 | — |
| N32 levée d'une restriction légale non gelée | § 10.6 (CT-17) | **Non** | — | AUT lève pendant la fenêtre : « gel » → accepté (l'acceptation de K échoue ensuite en « renouvelée ») |
| N35 le titulaire ne clôt plus une HP d'autrui | § 8.3 | Oui | `test_T09_auteurs_de_cloture` | — |
| N40 amont limité aux fondateurs directs | § 8.2 (cycles) | **Non** | — | V3 délègue à V1 (amont à deux niveaux) : refus → accepté |
| N41 public désigné par un non-titulaire non-RS | § 13.1 | Oui | S-216 | — |
| N50 cache servi au-delà de l'instant et de l'échéance | § 13.10 (CP-40) | **Non** | — | HP échue à 5 ; M interroge en ligne à 6 : introuvable → accordé |
| N53 protection orpheline : dérogation sans gardien | § 12.3 | **Non** | — | dérogation sur o (embargo orphelin) : refus → accordée, A voit o |

**Taux de détection : 8/33 (24 %) au volume du banc.** Volume nominal (40 × 50) sur les 25 survivantes : voir la ligne ci-dessous.

**Au volume nominal (40 graines × 50 pas, référence comprise) : les 25 survivantes survivent toutes.** Le taux reste de **8/33 (24 %)** ; les propriétés, même à pleine charge, ne compensent aucun des manques.

---

## Tableau F — Attaques absentes

Les quatre premières sont des **écarts du modèle au contrat**, démontrés par sonde, qu'aucun test ne voit.

| # | Attaque | Clause | Constat | Gravité |
|---|---|---|---|---|
| F-01 | Admission automatique **différée** (fenêtre de transfert ou archivage) traitée **après une bascule** en `approbation préalable` | § 9.3 (CT-27), § 5.1, § 10.6 | `sonde_m010.py` : Y, entré pendant la fenêtre, est admis automatiquement à la fin de la fenêtre alors que l'HI est en `approbation` (idem à la réouverture). `_traiter_differes` et `rouvrir` ne revérifient pas le mode. Le contrat ne dit pas explicitement le sort d'une admission différée après bascule : à trancher, puis à tester. | M |
| F-02 | Cible devenue protégée par une **restriction légale** (ou devenue sensible) sans bascule | § 9.3 | `sonde_divers.py` : après une restriction légale sur o, l'HI reste en `notification` ; M y entre, est admis automatiquement et, la restriction levée, accède à o. `_basculer` n'est appelé que par `creer_protection`. | M |
| F-03 | Second passage d'une protection à l'état **orphelin** | § 11.2 (G-10), § 5.4 | `sonde_m013_m104.py` : pas de nouveau signalement à l'autorité ; la désignation d'office reste possible sans saisine nouvelle. | M |
| F-04 | **Purge + copie (c)** au transfert : le cédant garde une copie d'un objet purgé | § 10.5 | `sonde_divers.py` : acceptée par le modèle, et attendue par `test_transfert_voies` (A-02). | M |
| F-05 | Contournement d'A3 et de G-2 par une **HI au profit d'un rôle de son propre espace** après révocation (M013) | A3, § 9.2, § 9.4 | Aucun test ; la survie de M013 le montre. | M (= E-2, non recompté) |
| F-06 | Admission ou retrait d'admission sur une HP par un acteur qui la **connaît sans en être fondateur** | § 9.3, § 8.1 | N06, N07. | m |
| F-07 | **Second compte** d'un exclu (§ 9.4) ou d'un bénéficiaire de dérogation (§ 12.6) | G-1 | N08, N09. | m |
| F-08 | Lecture de la gouvernance, des journaux d'HP personnelles et de l'explication d'accès par qui n'y a pas droit | § 10.3, A2 | N14, N15, N16. | m |
| F-09 | Lecture d'une **présentation** de transfert par un tiers | § 10.6 (F-4) | N17. | m |
| F-10 | **Révocation de dérogation**, **contestation** et **examen** par des acteurs non habilités | § 12.5, § 11.6 | N18, N19, N20. | m |
| F-11 | **Consentement à la réintégration** donné par un RS resté en place | § 10.8 | N21. | m |
| F-12 | **Cycle de délégation à trois niveaux** | § 8.2 | N40. | m |
| F-13 | **Blanchiment par copie de copie**, et destinataires d'interdiction perdus par la copie | A5, § 13.11 | N12, N13. | m |
| F-14 | **Dérogation sur protection orpheline** sans gardien | § 12.3 | N53. | m |
| F-15 | **Mise en examen d'une HP**, prolongation et confirmation malgré une interdiction | T-07, G-7 | N01, N03, N04. | m |
| F-16 | **Échec d'évaluation** qui modifie l'état (gardien retiré) ; **cache** servi après l'échéance | A6, § 13.10 | N10, N50. | m |
| F-17 | Levée d'une **restriction légale visible** pendant la fenêtre de transfert | § 10.6 (CT-17) | N32. | m |
| F-18 | Fuite par **notification** sur une cible cachée | § 15 | Non observable par l'oracle d'I-5 (B-01) ; aucun test dédié. | m |
| F-19 | Consultation d'une cible **purgée** (étape 0), et purge réussie suivie d'un accès | § 14, § 6.3 | Aucun test. | m |
| F-20 | Protection posée hors périmètre, base `projet` sans écriture, insertion en série par un non-RS | § 11.1, § 13.7, § 13.6 | N22, N23, N24. | m |
| F-21 | Dérogation sur un objet sous **gel** sans « fondement de la procédure » | § 12.3 | Le modèle n'exige que deux approbateurs (S-268 passe avec la justification « j ») ; le texte ne précise pas la forme du fondement. | O |
| F-22 | Mode d'inclusion **pseudonymisé** (DI-L21) | § 13.3 | Non modélisé ni testé. | O |
| F-23 | Restriction externe levée par « une décision qui l'emporte » | § 11.6 (CT-23) | Non testé. | O |

---

## Verdict sur le critère de gel

**Le critère de gel n'est pas satisfait.** Cinq conditions sur six échouent :

1. **Constats bloquants ou majeurs** : 19 constats M subsistent (A-01, A-02 ; B-01, B-02, B-03, B-05 ; D-01, D-02, D-03, D-06, D-10, D-16 ; E-1 indépendance du score, E-2 M010, E-2 M013 ; F-01 à F-04, quatre écarts du modèle au contrat).
2. **Scénario qui invente une règle** : `test_transfert_voies` attend l'acceptation d'une copie (c) avec purge, contraire au § 10.5.
3. **Oracles indépendants** : non. I-2, I-3, I-5 et I-8 tirent leur attendu de `droits_de`, `pouvoirs_de` ou `retirer_objet_pour_test`, logés dans le modèle ; la démonstration est faite pour I-3 et I-5.
4. **Invariants vérifiés sur les transitions pertinentes, états atteints et comptages publiés** : non. Les comptages publiés ne correspondent pas aux suites des invariants ; gel de succession, réémission et une quinzaine de transitions ne sont jamais générés ; I-9 ne teste que la monotonie et ne détecte aucune suppression d'étape du § 14.
5. **Aucune survivante sans justification acceptée** : non. Deux des quatre justifications sont réfutées par contre-exemple (M010, M013). Aucune n'est acceptée par le porteur. Sur 33 mutations indépendantes, 25 survivent, toutes non équivalentes.
6. **Tous les tests réussissent** : oui (373/373).

**Conditions minimales pour un nouveau contrôle :** corriger F-01 à F-04 dans le modèle, ou trancher le texte ; ajouter des tests qui tuent N01 à N53 et M010, M013 ; sortir `retirer_objet_pour_test`, `droits_de` et `pouvoirs_de` du modèle, ou les réécrire dans les tests à partir du texte ; réécrire I-9 pour vérifier qu'un acteur frappé est refusé ; publier les comptages de chaque test d'invariant, et faire générer les transitions absentes.
