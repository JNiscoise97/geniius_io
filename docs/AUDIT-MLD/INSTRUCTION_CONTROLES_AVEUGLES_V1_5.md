# GENIIUS — Instruction des contrôles en aveugle du contrat V1.5, du modèle et de la batterie

**Date :** 12 octobre 2026

**Rapports instruits :**
- [CONTROLE_AVEUGLE_CONTRAT_MODELE_V1_5.md](CONTROLE_AVEUGLE_CONTRAT_MODELE_V1_5.md) (contrôle A, 13 scripts) ;
- [CONTROLE_AVEUGLE_COUVERTURE_BATTERIE_V1_5.md](CONTROLE_AVEUGLE_COUVERTURE_BATTERIE_V1_5.md) (contrôle B, 33 mutations nouvelles et leurs témoins).

**Instructeur :** l'auteur. Il ne clôt aucun constat.

## 1. Résultat

| Ensemble | Bloquant | Majeur | Mineur | Observation |
|---|---|---|---|---|
| Texte (A : CT-01 à CT-29) | **2** | 10 | 15 | 2 |
| Modèle (A : CM-01 à CM-24) | 0 | 13 | 9 | 2 |
| Batterie, oracles, propriétés, banc (B) | — | 19 | 44 | 13 |

**Tests :** 373 réussis sur 373.

**Mutations :**
- banc de l'auteur : 156 détectées sur 160 ;
- mutations **indépendantes** du contrôleur B : 8 détectées sur 33 (24 %). Les 25 survivantes sont toutes non équivalentes, chacune démontrée par un témoin.

**Verdict des deux contrôleurs : gel impossible. Je partage ce verdict.**

## 2. Vérification par l'instructeur

- **Contrôle A :** j'ai relancé les 13 scripts. Ils reproduisent tous les comportements annoncés.
- **Contrôle B :** j'ai relancé les sondes de M010 et de M013 et les témoins des mutations nouvelles. Elles reproduisent toutes.

**Erreurs de l'auteur reconnues :**
- **Justifications M010 et M013 fausses.** M010 ignore les admissions différées, évaluées après une bascule. M013 ignore les HI au profit d'un rôle de son propre espace, sans admission. Ma sonde ne regardait que l'instant de chaque transition.
- **M104** ne tient que parce que G-10 est mal implémenté : le second passage à l'état orphelin n'est pas signalé.
- **Score du banc non indépendant.** J'ai écrit 21 scénarios (S-273 à S-292) pour tuer les mutants de mon propre banc. Le score de 156 sur 160 mesure donc en partie un ajustement de la suite au banc, ce que les 24 % du contrôleur B mettent en évidence.
- **Comptages publiés hors des suites des invariants.** `couverture_etats.json` vient de suites dédiées, et non des suites des invariants. Dans celles-ci, une quinzaine de transitions ne sont jamais générées (D-01, D-02).
- **Oracles dépendants du modèle.** `retirer_objet_pour_test`, `droits_de` et `pouvoirs_de` sont logés dans le modèle (B-01, B-02). L'état jumeau d'I-5 ignore les séries, les bases, les avis et les notifications, ce qui a laissé passer la fuite par les rangs de série (CM-09).
- **I-9 vérifie la monotonie, pas la primauté.** La propriété ne détecte aucune suppression d'étape du § 14 (D-10).
- **`test_transfert_voies`** attend l'acceptation d'une purge avec copie (c), ce que le § 10.5 contredit (A-02).
- **G-7, tel que je l'ai rédigé**, crée une fuite d'existence et un blocage par un tiers (CT-01, bloquant).

## 3. Diagnostic de fond

C'est le quatrième tour (V1.2, V1.3, V1.4, V1.5). Chaque tour lève les failles du précédent, mais les mécanismes ajoutés pour les lever en créent de nouvelles. En V1.5, les nouveaux constats bloquants et majeurs portent presque tous sur des mécanismes introduits en V1.4 ou en V1.5 :
- G-7 (CT-01) ;
- l'exception sans admission du § 9.2 (CT-02, M013) ;
- l'héritage des protections par les copies (CT-04 à CT-06) ;
- le gel « par l'effet » (CT-09, CT-26, CM-07, CM-08) ;
- la bascule (CT-11, CT-13, F-01, F-02) ;
- la succession (CT-14, CT-15, CM-12) ;
- les sélections partagées (CT-10, CM-18, CM-21).

**Deux causes, dont une nouvelle :**
1. **La surface normative croît plus vite que la capacité de vérification.** Chaque mécanisme se combine avec tous les autres : transfert × sélection × copie × suspension × personne. Le nombre de combinaisons à vérifier croît plus vite que le nombre de règles.
2. **La vérification est faite par l'auteur des règles.** Mes tests, mes oracles et mon banc partagent mes angles morts. Seules les mutations indépendantes mesurent vraiment la suite (24 %).

## 4. Arbitrages demandés au porteur

### H-0 — Stratégie (préalable aux autres)

| Option | Principe | Conséquences |
|---|---|---|
| **H-0a — Réduire le périmètre normatif de la V1** *(recommandée)* | Geler un **noyau** et déclarer les mécanismes complexes **hors V1, fermés par défaut** jusqu'à une V2 spécifiée et contrôlée séparément. Exemples de fermeture :<br>• réutilisation limitée aux objets publics, non protégés, non sensibles ;<br>• sélections partagées figées par version, sans proposition ni activation ;<br>• réémission au transfert supprimée (les HP du cédant tombent, comme si elles n'étaient pas réémises) ;<br>• gel de succession sans décision fine (maintien, ou versement par décision légale seulement). | Réduit fortement la surface, et donc les interactions. Les usages fermés sont **refusés**, jamais permis par défaut : la sécurité ne baisse pas, l'usage oui. Le noyau devient atteignable. |
| H-0b — Continuer à périmètre constant | Corriger tous les constats, puis un nouveau tour. | Le risque de non-convergence est démontré par quatre tours. |

**Recommandation pour la méthode, quelle que soit l'option :**
- les mutations indépendantes de chaque contrôle deviennent des tests de non-régression ;
- le **score de référence** est celui d'un banc **écrit par le contrôleur**, et non celui du banc de l'auteur ;
- les outils de test sortent du modèle.

### H-1 — G-7 sur les périmètres dynamiques (CT-01, bloquant)

| Option | Principe |
|---|---|
| **H-1a** *(recommandée)* | G-7 ne s'applique qu'aux cibles dont l'habilitant **connaît l'existence**. Pour les autres, l'habilitation ne confère rien sur les cibles où l'habilitant est frappé **à l'acte**. Cette exclusion est figée dans l'habilitation et produit la même réponse que dans un monde sans la cible. |
| H-1b | Interdire `contenu` et `sélection` comme périmètres de délégation par un acteur frappé ; il délègue par lot. La réponse « refus » fuit encore, sauf si elle est uniforme. |

### H-2 — HI au profit d'un rôle de son propre espace (CT-02, bloquant ; M013)

| Option | Principe |
|---|---|
| **H-2a** *(recommandée)* | Supprimer l'exception du § 9.2 : toute habilitation à un ensemble ouvert exige une admission. Le signataire n'est alors jamais admis, et l'élévation croisée par nomination disparaît. |
| H-2b | Garder l'exception, mais borner le bénéfice au **périmètre de la nomination** du membre, exclure le signataire et étendre I-3. Cette option ajoute une règle et donc des interactions. |

### H-3 — Copies réutilisées (CT-04 à CT-06, CM-06, N12, N13)

| Option | Principe |
|---|---|
| **H-3a** *(recommandée, cohérente avec H-0a)* | `réutiliser` exige un original **sans aucune protection, non sensible et non personnel non public**. La copie ne porte alors rien à hériter, sauf les restrictions non levables, toutes propagées dynamiquement à toute la chaîne de filiation (légales comprises), et la sensibilité. Cela remplace l'héritage de G-6 par une interdiction plus simple, qui atteint le même but : jamais de blanchiment. |
| H-3b | Garder l'héritage, et rattacher les gardiens hérités à l'original (leur droit s'apprécie sur l'original). Propagation dynamique des protections ultérieures. Cette option ajoute des interactions. |

### H-4 — Gel du transfert (CT-09, CT-26, CM-07, CM-08, N32)

| Option | Principe |
|---|---|
| **H-4a** *(recommandée)* | Gel **par liste d'opérations**, apprécié sur l'espace et non sur la vue de K, ce qui supprime la sonde de CT-26. Sont gelées : création, nomination, acceptation de nomination, administrateur, prolongation, confirmation, levée d'examen, admission, ajout à un groupe, activation, versement, changement de voie, levée **interne** de protection. Ne sont jamais gelés : les actes de l'autorité légale ou de contestation, les clôtures, les restrictions et les créations de protection. L'inclusion à l'acceptation reste le filet de sécurité, en comparant aussi l'effectivité et les fondateurs (CM-07). Le nombre de présentations successives est plafonné (CT-09). |
| H-4b | Garder le gel par l'effet et corriger CM-07, CM-08 et CT-26. Cette option est plus fine, mais les interactions restent plus nombreuses. |

**Note :** la règle transversale 1 (contrôle par les effets) reste satisfaite par l'inclusion à l'acceptation. H-4a ne revient que sur la manière de geler.

### H-5 — Personne partout (CT-07, CT-08, CT-12, CM-11, CM-12, N08, N09)

**Recommandation :**
- destinataires, bénéficiaires, gardiens, défunt et cédant s'entendent **par personne** ;
- un compte sans identité établie ne peut être ni admis automatiquement, ni gestionnaire, ni gardien, ni bénéficiaire nominatif.

C'est le prolongement direct de G-1.

### H-6 — Points ponctuels qui demandent une décision

| # | Question | Recommandation |
|---|---|---|
| H-6a | Admission différée puis bascule (F-01) | L'admission différée est réévaluée à son traitement, mode compris : rien n'est admis si l'habilitation a basculé. |
| H-6b | Bascule (CT-11, CT-13, F-02) | Bascule à toute entrée d'une cible protégée, sensible ou personnelle non publique, et à toute restriction légale. Elle ne vise que la portée concernée, et redevient possible après la levée. |
| H-6c | Consentement à la réintégration (CT-21, CM-17) | Par acte ; caduc au transfert suivant. |
| H-6d | Création d'un objet du contenu pendant la fenêtre (A-17 de B) | Non gelée : un nouvel objet n'élargit pas un engagement. À écrire au § 10.6. |
| H-6e | Rangs de série (CM-09) | Pas d'unicité de rang entre éléments de visibilité différente : rang attribué à l'acceptation, invisible à qui ne voit pas. |
| H-6f | Les justifications de mutations (en-tête, CT-24) | Durcir la définition : universalité exigée pour la redondance ; « oracle aveugle sur le canal » jamais recevable ; retirer l'exemple du libellé de journal. |
| H-6g | CT-28 (V1.4), toujours ouvert | À arbitrer avant tout gel. |

## 5. Corrections sans arbitrage proposées

**Texte :**
- CT-03 (prolonger ou confirmer à son profit) ;
- CT-05 (restriction légale propagée aux copies) ;
- CT-10 (gouvernance des sélections) ;
- CT-14 (le défunt perd sa qualité de gardien) ;
- CT-15 (finalité `succession`) ;
- CT-16 (rang = 1 + max) ;
- CT-17 à CT-20, CT-22, CT-23, CT-25, CT-27, CT-28 (contrôle A).

**Modèle :**
- CM-02 à CM-05 ;
- CM-13, CM-14, CM-16 ;
- CM-18 à CM-23 ;
- F-03 (second passage orphelin) ;
- F-04 (purge et copie).

**Tests :**
- outils de test sortis du modèle ;
- jumeau complet sur toutes les surfaces du § 15 ;
- I-9 réécrit pour vérifier qu'un acteur frappé est refusé ;
- comptages publiés par invariant ;
- générateur étendu aux quinze transitions absentes ;
- les 33 mutations et témoins du contrôleur B intégrés comme non-régression ;
- A-01 à A-24 corrigés.

## 6. Suite proposée

1. Décision du porteur sur H-0, puis sur H-1 à H-6.
2. Si H-0a est retenue : définir avec le porteur la liste du noyau et des mécanismes fermés.
3. Contrat V1.6, modèle et tests, selon les décisions.
4. Nouveau double contrôle en aveugle. Le contrôleur B écrit un banc indépendant, qui sert de mesure de référence.

## 7. Décision du porteur (12/10/2026)

- **H-0 : H-0b retenue.** Le périmètre de la V1 n'est pas réduit : tous les mécanismes restent dans la V1.
- **Conséquence instruite par l'auteur :** la recommandation H-3a (réutilisation limitée aux originaux sans protection) réduisait le périmètre. À périmètre constant, la recommandation devient **H-3b** : héritage maintenu ; gardiens hérités rattachés à l'original ; protections et restrictions ultérieures propagées dynamiquement ; sensibilité héritée.
- H-1, H-2 et H-4 à H-6 : en attente de décision au moment de la décision H-0 (tranchés ci-dessous).
- **H-1 à H-6 : recommandations validées** (12/10/2026) : H-1a, H-2a, H-3b, H-4a, H-5, H-6a à H-6f.
- **CT-28 : le cédant conserve** les HP que des titulaires tiers lui ont accordées sur leurs objets personnels (A2).

## 8. Réalisation de la V1.6 (12/10/2026)

### 8.1 Livrables

| Livrable | Emplacement | Contenu |
|---|---|---|
| Contrat V1.6 | `docs/GENIIUS_CONTRAT_AUTORISATION_V1.md` (V1.5 archivée dans `historique/`) | H-0b, H-1a à H-6f, CT-28, corrections du § 5 ; justification recevable d'une mutation (H-6f) dans l'en-tête. |
| Modèle | `spec/autorisation/modele.py` | Réécrit selon le texte V1.6. Gel par liste d'opérations, exclusions figées, admission toujours requise, héritage dynamique des copies, personne partout, consentement par acte, portée limitée des admissions automatiques. **Plus aucun outil de test.** |
| Outils de test | `spec/autorisation/tests/outils.py` | Observation par opérations publiques ; transcriptions du texte ; jumeau complet, qui purge aussi séries, bases, insertions, lots, avis, notifications, contributions, répliques et scellés. |
| Tests | `spec/autorisation/tests/` | 322 scénarios, dont 31 nouveaux ou ajoutés (S-293 à S-323) et 29 corrigés (tableau A du contrôle B et décisions H) ; 39 attaques V1.4 ; 55 tests de non-régression des contrôles V1.5 (`test_controles_v15.py`) ; invariants réécrits (I-2 par personne et aux échéances futures, I-9 en primauté, I-8 par personne) ; comptages publiés par invariant ; chaque transition du générateur exigée au moins une fois. |
| Banc de mutations | `spec/autorisation/mutations/` | 260 mutations : 160 de l'auteur réciblées, 67 nouvelles (V1.6), **33 indépendantes du contrôle B** réciblées par texte. Exécution parallèle sur un instantané des tests. |
| Batterie V1.6 | `docs/AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_6.md` | Générée ; la V1.5 est marquée remplacée. |

### 8.2 Mesures

- **Suite complète, volume nominal (40 × 50) : 459 tests, tous réussis (2 min 27 s).**
- Les 13 scripts du contrôle A échouent sur le modèle V1.5 et réussissent sur le V1.6.
- **Banc : 252 détectées sur 260.** Les 33 mutations indépendantes du contrôle B sont toutes détectées, contre 8 sur 33 en V1.5.
- Les 8 survivantes sont des mutations de l'auteur : M010, M013, M032, M033, M104, M312, M330 et M331. Elles sont proposées comme défenses redondantes ou équivalences, avec une démonstration et une sonde (`mutations/JUSTIFICATIONS.md`). **Elles attendent la décision du porteur.**
- Sept survivantes du premier passage ont révélé des trous dans les tests ; chacune est maintenant détectée :
  - M012 (S-318) ;
  - M034 et M036 (S-322, S-323 : un groupe d'un **autre** espace, non gelé, rend une cible visible à K pendant la fenêtre ; seule l'inclusion le rattrape) ;
  - M051 (S-319) ;
  - M343 (S-320) ;
  - M344 (S-321) ;
  - M382 (S-301 rendu discriminant).

  N53 est aussi détectée, par une restriction interne orpheline.
- Les comptages par état, par invariant et par opération sont dans `spec/autorisation/tests/couverture_etats.json`.

### 8.3 Points ouverts pour le porteur

Le générateur étendu a fait apparaître trois conflits **dans le texte**. Les tests les isolent explicitement en attendant l'arbitrage (marques `POINT OUVERT` dans `test_proprietes.py` et `test_controles_v15.py`). Aucune règle n'a été inventée dans le modèle.

- **P-1 — I-3 et les nominations réciproques.**
  - Le cas : deux RS à périmètre étroit d'un même espace nomment chacun le second compte de l'autre lecteur sur leur propre périmètre. Chacun gagne les actions du rôle sur le périmètre de l'autre.
  - A3 le permet : une nomination émane d'un autre acteur. I-3, tel que rédigé (« gestionnaires d'ensembles ouverts… n'augmente les droits d'aucun d'eux »), semble l'interdire.
  - Test : `ControleA.test_a02_role_propre_espace`.
  - Options : (a) restreindre I-3 aux droits obtenus **par les habilitations** dont ils gèrent les ensembles ; (b) traiter la réciprocité comme un acte direct (A3, contrôle par les effets), ce qui est difficile à rendre décidable.
- **P-2 — I-2 et le versement.**
  - Le cas : un titulaire qui est aussi RS verse son objet au contenu, avec l'accord d'un autre RS. Il gagne alors les actions de son rôle sur cet objet, dont `valider`, que le titulaire n'a pas (§ 6.1).
  - I-2 n'exempte pas le versement ; A3 ne l'interdit pas.
  - Options : (a) exempter le versement dans I-2, l'accord d'un autre RS valant attribution par autrui ; (b) exclure `valider` et `contribuer au Core` pour l'ancien titulaire sur son objet versé.
- **P-3 — Signalement d'une orpheline et non-divulgation.**
  - Le § 11.2 impose un signalement d'office à l'autorité de dérogation. Le § 15 et I-5 interdisent toute notification « sur une cible cachée au destinataire ». Or un membre de l'autorité à qui la cible est cachée apprend qu'une protection existe.
  - Options : (a) exception déclarée au § 15 pour l'autorité, dont le signalement ne désigne que la protection ; (b) signalement à un rôle, hors des observations des acteurs.

**Interprétations du modèle**, à faire confirmer par le contrôle en aveugle :
- **Gel :** une opération « porte sur l'espace » quand sa cible est un objet de l'espace, objet personnel compris (visibilité, protections). Les HP sur des objets personnels ne sont jamais gelées.
- **Prolongation d'une HI par un RS qui ne connaît pas une cible d'un périmètre dynamique :** la cible devient une exclusion figée de **toute** l'habilitation.
- **Confirmation ou prolongation d'une HP :** les exclusions figées sont propres au fondateur.
- **Protection héritée, gardiens :** ce sont ceux de l'ascendant, copiés à la création ; leur qualité est appréciée sur l'ascendant.
- **Protection héritée, ascendant purgé :** les gardiens perdent leur qualité, et aucune désignation n'est possible (personne ne détient de droit sur un objet purgé). C'est un cas que le texte ne tranche pas.
- **Protection orpheline :** la règle s'applique aussi aux restrictions internes (« aucune dérogation ne franchit une protection orpheline »).
- **Transfert expiré :** il doit être annulé avant qu'un nouveau transfert soit préparé. Le plafond `PRESENTATIONS_MAX` vaut par transfert ; une annulation avant le plafond n'ouvre pas de carence.
- **Restriction légale :** la limitation expresse de sa portée aux seules cibles est codée `portee = 'cible'` dans sa référence.

### 8.4 Suite

1. Arbitrage du porteur sur P-1 à P-3 et sur les 8 justifications.
2. Nouveau double contrôle en aveugle de la V1.6 : contrôle A (texte et modèle, attaques actives) ; contrôle B (batterie, oracles, couverture, **banc indépendant écrit par le contrôleur**, qui sert de mesure de référence).
3. Aucun gel n'est prononcé sans décision du porteur.
