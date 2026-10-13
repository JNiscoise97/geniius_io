# GENIIUS — Batterie de scénarios du contrat d'autorisation

**Version :** V1.3 — **remplacée** par la V1.4 ([GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_4.md](GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_4.md), automatisée). Elle remplaçait la V1.2 (93 scénarios).
**Référentiel :** [contrat d'autorisation V1.3](../GENIIUS_CONTRAT_AUTORISATION.md). Les fondements citent ses clauses : § n, A1 à A6.

**Règles de la batterie**
- Chaque scénario a des **préconditions** atteignables selon le contrat, **une** opération, un **résultat binaire et observable**, et un **fondement** qui existe dans le contrat ou dans une règle explicitement citée.
- Les identifiants V1.2 sont conservés ; les nouveaux scénarios commencent à S-94.
- « **Refus** » : opération rejetée, rien n'est créé, et la réponse est indistinguable d'une absence lorsqu'une cible protégée est en jeu.

**Acteurs types**
- **R0** : racine de l'espace (RS attribué par le système), aussi propriétaire ;
- **RS**, **RS2**, **RS3** : responsables scientifiques nommés, chaîne enracinée par R0 ;
- **ADM** : administrateur seul ;
- **COL** : collaborateur ; **LEC** : lecteur ;
- **TIT** : titulaire ;
- **SUP1**, **SUP2** : personnes distinctes et indépendantes de l'autorité de dérogation ;
- **A** : bénéficiaire d'une dérogation ;
- **C** : cédant ; **K** : cessionnaire ;
- **P**, **E** : espaces.

**Hypothèse commune aux transferts** (sauf mention contraire) : présentation valide et non expirée, empreinte inchangée, aucun objet `privé` de C dans E, aucun rôle de C dans un autre espace bénéficiaire.

## 1. Auto-habilitation et gouvernance

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-01 | M, titulaire de la note `privé` N ; X membre de P, sans droit sur N. | X crée une règle de titulaire sur N à son profit. | **Refus.** | § 3.1 ; A3 |
| S-02 | RS de P ; COL titulaire de la note `privé` N. | RS crée une règle de titulaire sur N à son profit. | **Refus.** | § 3.1 ; A3 ; § 5 |
| S-69 | RS de P ; COL titulaire de l’objet `privé` O, sans règle au profit de RS. | RS crée une règle `voir` sur O au profit de LEC. | **Refus.** | A1 ; § 5 |
| S-03 | ADM sur P ; Y sans droit. | ADM crée une règle `voir` sur le contenu `projet` de P au profit de Y. | **Refus.** | A1 ; A2 |
| S-04 | ADM sur P. | ADM s'attribue l'appartenance `lecteur` de P. | **Refus.** | A3 ; § 5 |
| S-05 | ADM sur P. | ADM crée une règle `voir` à son profit sur P. | **Refus.** | A1 ; A3 |
| S-06 | ADM sur P ; groupe G de P, sans aucun droit. | ADM s'ajoute à G. | **Refus** (s'ajouter soi-même à un groupe est interdit, quel que soit le groupe). | A3 ; § 3.3 (1) |
| S-07 | ADM sur P ; TIT a l'objet `privé` O. | ADM crée une règle `voir` sur O au profit du rôle `lecteur` de P. | **Refus.** | A1 ; A2 ; § 6.1 |
| S-08 | Programme G parent de SP ; X administrateur de G, sans rôle dans SP. | X crée une règle `voir` sur le contenu de SP au profit du groupe « Coordination ». | **Refus.** | A1 ; A2 ; § 6.1 |
| S-09 | LEC de P, sans `repartager`. | LEC crée une règle `voir` sur le contenu `projet` de P au profit du groupe H. | **Refus.** | A1 ; § 3.2 (4) |
| S-10 | ADM, seul administrateur de P, a nommé Z administrateur ; Z sans rôle scientifique. | Z nomme ADM `lecteur` de P. | **Refus.** | A2 ; § 5 |
| S-11 | ADM sur P ; l'objet O est sous embargo d'existence dont ADM n'est pas bénéficiaire ; une règle ordinaire R porte sur l'objet non protégé Q. | ADM affiche la liste des règles de P, avec son total. | La liste contient R (cible Q désignée par identifiant et type, sans titre) et **aucune** règle ni protection concernant O ; le total affiché est égal au nombre de lignes listées. | § 4.3 |
| S-12 | ADM sur P ; une lettre publiée et diffusée par e-mail ; ADM sans droit de lecture sur son contenu. | ADM consulte les diffusions de P. | Visibles : date, canal, audience déclarée, nombre de destinataires, résultat. Le contenu de la lettre n'est pas visible. | § 4.3 |

## 2. Délégation, chaîne, dépendance et départ

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-13 | RS de P. | RS confère à M l'appartenance `collaborateur`. | M voit, commente et édite le contenu `projet` de P. | § 3.2 ; § 5 |
| S-14 | TIT, titulaire de l'objet `privé` O ; V collègue. | TIT crée une règle `voir` sur O au profit de V. | V voit O. | § 3.1 ; § 3.2 |
| S-15 | RS1 de P ; COL titulaire de l'objet `privé` O ; RS2 a reçu la nomination de RS1. | RS2 accepte sa nomination de RS. | RS2 voit le contenu `projet` de P et **ne voit pas** O. | § 5 ; § 3.2 |
| S-16 | RS a créé la règle R (`voir`, contenu `projet`) au profit de V ; R n'a pas d'autre fondement ; R0 révoque l'appartenance de RS (perte involontaire). | V consulte le contenu `projet` de P. | **Refus.** | § 3.2 (dépendance, départ) |
| S-17 | Comme S-16, mais RS2 (mêmes droits que RS) a prolongé R jusqu'à D2 avant la révocation. | V consulte le contenu `projet` de P avant D2. | **Accordé.** | § 3.2 (fondements) |
| S-18 | R créée par RS ; ADM n'a pas `voir`. | ADM prolonge R. | **Refus.** | § 3.2 ; A2 |
| S-19 | Règle R au profit du groupe extérieur « Coordination », en `approbation préalable`, créée par RS ; RS2 a les mêmes droits que RS ; A2, membre de la Coordination, non admis. | RS2 admet A2. | A2 voit ce que R ouvre ; RS2 est fondement de cette admission seulement. | § 3.2 (actes) ; § 3.3 |
| S-20 | Règle R révoquée la veille. | RS admet un membre au titre de R. | **Refus.** | A4 |
| S-21 | COL a `voir` sur le contenu `projet`, sans `repartager`. | COL crée une règle `voir` au profit de T. | **Refus.** | A1 ; § 3.2 (4) |
| S-22 | RS a délégué `voir` avec `repartager` à COL ; COL a délégué `voir` à T. | RS clôt la délégation faite à COL ; puis T consulte l'objet. | **Refus** pour T. | § 3.2 (dépendance) |
| S-23 | A a délégué `voir` avec `repartager` à B. | B délègue `voir` avec `repartager` à A sur le même périmètre. | **Refus** (cycle). | § 3.2 |
| S-108 | RS (non racine) a nommé COL ; RS annonce son départ volontaire ; la présentation liste la nomination de COL ; R0 la confirme avant la prise d'effet. | COL consulte le contenu `projet` après le départ de RS. | **Accordé.** | § 3.2 (départ) |
| S-109 | R0, racine de P ; RS2 existe. | R0 quitte P sans transfert. | **Refus.** | § 3.2 (départ, racine) |
| S-110 | R0 nomme RS1 ; RS1 nomme RS2 ; RS2 nomme RS3 ; RS3 confirme la nomination de RS2 ; R0 révoque RS1. | RS2 consulte le contenu `projet` de P. | **Refus** : aucune chaîne enracinée (RS2 et RS3 ne se fondent que l'un l'autre). | § 3.2 (chaîne enracinée) |
| S-111 | RS1 a nommé RS2 ; RS3 n'est pas fondateur de cette nomination. | RS3 clôt la nomination de RS2. | **Refus.** | § 3.2 (actes) ; § 5 |
| S-112 | RS dont les droits expirent à D1. | RS délègue `voir` à V jusqu'à D2 > D1. | **Refus.** | § 3.2 (3) |
| S-113 | RS de P (contenu `projet` de P seulement). | RS délègue `voir` sur un objet de l'espace Q, où il n'a aucun rôle. | **Refus.** | A1 ; § 3.2 (1) |
| S-114 | RS1 nommé RS sur un périmètre limité au sous-ensemble X de P. | RS1 nomme RS2 sur tout P. | **Refus.** | § 5 ; A1 |

## 3. Groupes, rôles externes, programmes, rattachements

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-24 | Groupe G bénéficiaire d'une règle `voir` sur le contenu de P ; X membre de P, non membre de G. | X s'ajoute à G. | **Refus.** | A3 |
| S-25 | G géré par ADM ; RS a délégué `voir` sur le contenu `projet` de P au profit de G en `approbation préalable` ; ADM a ajouté M à G. | RS admet M. | M voit le contenu `projet` de P. | § 3.3 |
| S-26 | Comme S-25, avant l'admission ; ADM a ajouté M à G. | M consulte le contenu `projet` de P. | **Refus** : l'appartenance seule ne confère rien. | § 3.3 (1, 2) ; A2 |
| S-27 | Programme G ; groupe « Coordination » géré par G, dont A est membre ; RS de SP a délégué `voir` sur l'objet O de SP au profit de la Coordination, en `approbation préalable`. | RS de SP admet A nominativement. | A voit O. | § 3.3 |
| S-94 | Comme S-27 ; B ajouté à la Coordination par G, non admis. | B consulte O. | **Refus.** | § 3.3 (2) |
| S-95 | RS de SP a délégué `voir` sur O au profit de la Coordination en mode `notification` ; G ajoute Y à la Coordination. | Y consulte O. | **Accordé** ; RS est notifié de l'entrée de Y. | § 3.3 (2, notification) |
| S-96 | Comme S-95, mais O est un objet `privé` de TIT, partagé par TIT avec la Coordination. | TIT choisit le mode `notification` pour cette délégation. | **Refus** : seul `approbation préalable` est admis pour un objet `privé`. | § 3.3 (2) |
| S-28 | Programme G parent de SP ; X administrateur de G, sans rôle dans SP. | X consulte un objet `projet` de SP. | **Refus.** | A2 ; P23 |
| S-29 | Règle R conditionnée par le rattachement SP → G. | Le rattachement prend fin ; puis le bénéficiaire de R consulte la cible. | **Refus.** | § 3.2 (fondements) |
| S-97 | Comme S-29 ; un nouveau rattachement SP → G est établi ensuite. | Le bénéficiaire de R consulte la cible. | **Refus** (aucune réactivation). | § 3.2 ; A4 |
| S-115 | Règle de P au profit du rôle `collaborateur` de l'espace F, en `approbation préalable` ; RS de F nomme Z collaborateur de F. | Z consulte un objet `projet` de P. | **Refus** : Z n'est pas admis par un habilitant de P. | § 3.3 (1, 2) |
| S-116 | X (habilitant légitime) délègue `voir` au groupe G de P ; ADM gère G. | ADM ajoute M à G. | **Accepté** comme appartenance : le groupe n'est pas gelé ; M n'a aucun droit tant qu'il n'est pas admis. | § 3.3 (1) |
| S-117 | TIT, titulaire de l'objet `privé` O, est membre du groupe « Équipe ». | TIT délègue `voir` sur O au profit de « Équipe ». | **Accepté.** | A3 ; § 3.2 (2) |

## 4. Propriété et transfert

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-30 | C propriétaire et racine de E ; transfert à K présenté. | K accepte ; puis C consulte un objet `projet` de E. | **Refus** pour C. | § 3.4.4 |
| S-31 | Comme S-30 ; C membre du groupe « Famille » de E, bénéficiaire de `voir`. | K accepte ; puis C consulte un objet ouvert à « Famille ». | **Refus.** | § 3.4.4 |
| S-32 | Comme S-30 ; C bénéficiaire et seul gardien d'un embargo d'existence sur T. | K accepte ; puis C cherche T. | Aucun résultat. | § 3.4.4 |
| S-33 | Comme S-30 ; TIT a accordé à C `voir` sur son journal `privé` J. | K accepte ; puis K consulte J. | **Refus.** | § 3.4.5 |
| S-34 | Comme S-30 ; T contenu `projet` de E sans autre protection ; une interdiction d'existence avait C pour seul destinataire. | K accepte ; puis K consulte T. | **Accordé** : l'interdiction n'est pas transférée. | § 3.4.5 |
| S-35 | Comme S-30 ; C seul fondement de la règle de sélection G1 (contenu `projet` de E vers les Colimaçons), annoncée à réémettre à l'identique, non expirée. | K accepte en réémettant G1. | Une nouvelle délégation G1' existe (auteur K, lien « réémission de G1 ») ; G1 est close, avec son auteur C conservé ; les Colimaçons gardent l'accès. | § 3.4.5 |
| S-36 | Transfert présenté (empreinte E1) ; C ajoute ensuite 40 membres au groupe bénéficiaire « Cousins ». | K accepte. | **Refus** ; rien n'est appliqué. | § 3.4.3 ; § 3.4.4 |
| S-37 | Transfert accepté de C à K ; E archivé puis rouvert. | C consulte un objet `projet` de E. | **Refus.** | A4 |
| S-38 | Comme S-30. | K accepte ; puis K consulte un objet `projet` de E. | **Accordé.** | § 3.4.4 |
| S-39 | C titulaire de trois objets `privé` dans E ; aucun sort retenu pour l'un d'eux. | K accepte. | **Refus**, cause signalée. | § 3.4.4 ; § 3.4.6 |
| S-118 | RS2 administrateur et RS de E, non propriétaire ; C propriétaire. | RS2 lance le transfert de E à K. | **Refus.** | § 3.4.2 |
| S-119 | E préparé pour un tiers par C ; premier transfert accepté par K. | C lance un nouveau transfert de E. | **Refus.** | § 3.4.2 |
| S-120 | Après le transfert C → K, RS2, resté RS de E. | RS2 nomme C collaborateur de E, sans accord de K. | **Refus.** | § 3.4.7 |
| S-121 | Comme S-120, avec l'accord explicite de K. | RS2 nomme C collaborateur de E. | **Accepté.** | § 3.4.7 |
| S-122 | Transfert présenté ; l'objet T de E est sous embargo d'existence posé par RS2, dont K ne sera pas bénéficiaire. | K affiche la vue de présentation et ses totaux. | Ni T, ni l'embargo, ni aucun total ou indice ne les révèle ; l'empreinte scellée les inclut. | § 3.4.3 |
| S-123 | Propriétaire C, aussi racine, décédé ; aucune désignation de garde ; aucun fondement légal enregistré. | Une demande de transfert de E est faite au nom de C. | **Refus** : la procédure de succession exige une désignation ou un fondement légal. | § 3.4.2 (succession) |
| S-125 | P créé par R0 ; ADM administrateur ; R0 propriétaire. | ADM consulte un objet `projet` de P. | **Refus.** | A2 ; § 3.4.1 |

## 5. Titulaire, création, renonciation

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-40 | Tâche automatique de plateforme, sans déposant identifiable. | La tâche crée des objets `privé` dans E ; puis tout membre consulte l'un d'eux. | **Refus.** | § 3.1 |
| S-41 | ADM sur E, sans rôle scientifique ; GEDCOM de M déposé par ADM, sans droit d'ADM sur ce fichier. | ADM lance l'import ; puis ADM consulte un objet `privé` créé. | **Refus.** | § 3.1 |
| S-72 | M, collaborateur de E, dépose son GEDCOM, dont il déclare détenir les droits. | ADM lance l'import ; puis M consulte un objet `privé` créé. | **Accordé** (M titulaire). | § 3.1 |
| S-42 | Référentiel commun en amorçage. | Création des concepts par l'acteur institutionnel d'amorçage ; puis un lecteur anonyme consulte un concept. | **Accordé** (visibilité publique) ; aucun droit de titulaire n'existe. | § 3.1 |
| S-126 | TIT titulaire de l'objet `privé` O. | TIT valide scientifiquement O (`valider`). | **Refus** ; seule une validation personnelle est possible. | § 3.1 (CC-20) |
| S-127 | TIT titulaire de l'objet `privé` O ; aucun sort retenu. | TIT renonce à son droit de titulaire. | **Refus.** | § 3.1 (renonciation) |
| S-128 | LEC de P. | LEC crée un objet dans P. | **Refus.** | § 3.1 (droit de créer) |

## 6. Embargos, interdictions, restrictions légales et dérogations

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-43 | Témoignage T sous embargo d'existence ; bénéficiaires TIT et RS ; ADM non bénéficiaire. | ADM recherche « T » dans P. | Aucun résultat. | A5 ; § 7 (2) |
| S-98 | Comme S-43 ; un lecteur anonyme a accès aux témoignages publics de P. | Il demande le total des témoignages de P. | Le total exclut T. | A5 ; § 7 (2) |
| S-99 | Comme S-43. | ADM consulte les journaux de gouvernance de P. | Aucune entrée ne mentionne T ni son embargo. | § 4.3 |
| S-44 | Embargo d'existence dont le groupe « Proches » est bénéficiaire ; ADM non membre. | ADM s'ajoute à « Proches ». | **Refus.** | A3 |
| S-129 | Comme S-44 ; ADM ajoute Z (tiers) à « Proches ». | Z cherche l'objet sous embargo. | Aucun résultat : Z n'est pas bénéficiaire sans l'accord d'un gardien. | § 3.3 (3) |
| S-130 | RS gardien de l'embargo d'existence sur O ; V a un droit `voir` sur O. | RS ajoute V comme bénéficiaire ; puis V consulte O. | **Accordé.** | § 6.4 |
| S-45 | RS1 et RS2, RS de P ; RS1 a créé sur l'objet `projet` O un embargo d'existence (seul bénéficiaire et gardien) ; RS1 quitte P (départ volontaire). | RS2 lève l'embargo. | **Accepté** : RS2 est gardien d'office, et bénéficiaire. | § 6.4 |
| S-76 | COL de P ; objet `projet` O. | COL crée un embargo d'existence sur O. | **Refus.** | § 6.4 |
| S-131 | ADM sur P ; objet `projet` O. | ADM crée une interdiction d'existence sur O visant RS. | **Refus.** | § 6.4 |
| S-46 | O sous embargo d'existence ; A, agent de support, demande un accès exceptionnel en lecture, finalité « vérification d'intégrité », 2 jours ; SUP1 et SUP2 indépendants, non bénéficiaires. | SUP1 et SUP2 approuvent ; A consulte O. | **Accordé** à A pendant 2 jours, avec un journal renforcé ; l'embargo reste. | § 3.5.1 ; § 3.5.3 |
| S-80 | Comme S-46, mais la seconde approbation vient de SUP1 sous un autre compte. | A consulte O. | **Refus.** | § 3.5.3 |
| S-81 | Comme S-46, mais SUP2 est aussi bénéficiaire de l'accès. | A consulte O. | **Refus.** | § 3.5.3 |
| S-82 | Comme S-46, mais seul SUP1 approuve. | A consulte O. | **Refus.** | § 3.5.3 |
| S-132 | Comme S-46, pour 31 jours. | SUP1 et SUP2 approuvent la dérogation. | **Refus** (plafond candidat de 30 jours). | § 3.5.4 |
| S-133 | Contenu `projet` O sous embargo de **contenu** ; un seul approbateur. | SUP1 accorde à A un accès exceptionnel à O ; A consulte O. | **Refus** : deux approbateurs sont requis pour franchir une protection. | § 3.5.3 |
| S-134 | Dérogation valide en `voir` sur O accordée à A. | A exporte O. | **Refus.** | § 3.5.4 |
| S-135 | Dérogation valide en `voir` sur O accordée à A. | A délègue `voir` sur O à B. | **Refus.** | § 3.5.4 |
| S-77 | O sous embargo d'existence, sans gardien ; SUP1 et SUP2. | SUP1 et SUP2 approuvent la levée de l'embargo. | **Refus.** | § 3.5.1 |
| S-78 | Objet `projet` O de E sous embargo d'existence ; ses gardiens ont tous quitté E ; E n'a plus de RS autre que R0, qui n'est pas bénéficiaire ; R0 détient un droit de contenu sur O. | SUP1 et SUP2 désignent R0 gardien. | **Accepté**, journalisé. | § 3.5.1 |
| S-79 | R0 gardien désigné selon S-78. | R0 lève l'embargo. | **Accepté.** | § 6.4 |
| S-70 | Objet `projet` O sans protection ; A sans droit ; SUP1 seul, non bénéficiaire ; procédure à un approbateur ; « diagnostic », 7 jours. | SUP1 accorde l'accès ; A consulte O. | **Accordé**, journalisé. | § 3.5.3 |
| S-71 | Comme S-70 ; l'accès a expiré. | A consulte O. | **Refus.** | § 3.5.4 ; A4 |
| S-47 | Restriction légale sur D ; SUP1 et SUP2. | SUP1 et SUP2 accordent à A un accès exceptionnel à D ; A consulte D. | **Refus.** | § 7 (0) ; § 3.5.5 |
| S-100 | Comme S-47. | SUP1 et SUP2 lèvent la restriction. | **Refus.** | § 3.5.5 |
| S-101 | Comme S-47 ; l'autorité compétente désignée enregistre une décision de levée. | La levée est appliquée ; puis le titulaire consulte D. | **Accordé.** | § 3.5.5 |
| S-136 | RS de P ; objet `projet` O. | RS crée une restriction légale sur O. | **Refus.** | § 3.5.5 |
| S-137 | SUP1 et SUP2 créent une restriction légale. | Ils se désignent autorité compétente pour la lever. | **Refus.** | § 3.5.5 ; A3 |
| S-48 | O, existence protégée pour E ; E détient `exporter` sur l'espace. | E exporte l'espace. | O n'est ni exporté, ni listé, ni compté sous aucune forme. | A5 ; § 7 |

## 7. Partage sélectif

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-49 | Sélection active « BOVALO depuis le Sosa 31 », Sosa 16 exclu ; règle `voir` au profit des collaborateurs de COL. | Un collaborateur de COL recherche « Sosa 16 ». | Aucun résultat. | P24 ; § 6.3 |
| S-102 | Comme S-49. | Le collaborateur parcourt les relations du Sosa 31. | Aucune relation vers le Sosa 16. | P24 ; DI-L16 |
| S-103 | Comme S-49. | Le collaborateur demande le nombre de personnes de la branche. | Le total n'inclut ni le Sosa 16 ni sa branche. | P24 |
| S-104 | Comme S-49 ; le collaborateur détient `exporter` par délégation. | Le collaborateur exporte la sélection. | L'export ne contient rien du Sosa 16 ni de sa branche. | P24 |
| S-50 | Comme S-49 ; verbatim « parrain Jean BOVALO » dans une assertion incluse. | Le collaborateur consulte l'assertion. | Le nom « Jean BOVALO » n'est pas observable. | DI-L21 |
| S-51 | Personne vivante V en mode `masqué`. | Un destinataire consulte la branche. | Ni nom, ni attribut, ni relation de V n'est observable. | DI-L21 |
| S-52 | Sélection S `révoquée`. | Un destinataire consulte un objet du dernier manifeste. | **Refus.** | § 6.3 |
| S-53 | Version active 3, proposition 4 en attente. | Le titulaire crée une réduction ; puis un destinataire consulte un objet ajouté par la version 4. | **Refus.** | § 6.3 |
| S-54 | RS de P détient `voir` et `repartager` sur les objets de S. | RS crée une règle `voir` sur S au profit du rôle `collaborateur` de COL ; puis un collaborateur de COL consulte un objet de S. | **Accordé.** | § 6.3 ; § 3.2 |
| S-55 | Comme S-54 ; RS2 crée sur l'objet O du manifeste un embargo d'existence dont RS n'est pas bénéficiaire. | Un collaborateur de COL consulte O. | **Refus.** | § 3.2 (dépendance) ; § 6.3 |

## 8. Réutilisation, révocation, hors ligne, contributions

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-56 | Q a repris une copie Q' grâce à une règle `réutiliser` active ; la règle est ensuite révoquée. | Q consulte Q'. | **Accordé.** | DI-A38 |
| S-57 | Comme S-56 ; licence de Q' autorisant la redistribution ; aucune protection ni droit de tiers. | Q inclut Q' dans sa sélection partagée avec un troisième espace. | **Accepté.** | DI-A41 (arbitrage DR-1) |
| S-73 | Comme S-57, mais la licence interdit la redistribution. | Même opération. | **Refus.** | DI-A41 |
| S-74 | Comme S-57, mais Q' est sous embargo de contenu. | Même opération. | **Refus.** | DI-A41 ; A5 |
| S-105 | Comme S-57, mais un droit de tiers déclaré s'oppose à la diffusion de Q'. | Même opération. | **Refus.** | DI-A41 |
| S-58 | Décision positive en cache ; la règle de M est révoquée à T. | M demande O en ligne à T + 1 s. | **Refus.** | A6 |
| S-59 | Appareil de M hors ligne, réplique avec échéance locale T0 + D ; révocation à T. | M consulte O hors ligne à T + x, avec T + x < T0 + D. | **Accordé** localement (résidu reconnu). | § 2 (hors ligne) |
| S-106 | Comme S-59. | L'appareil se synchronise ; puis M consulte O hors ligne. | **Refus** : O a été retiré de l'appareil. | § 2 (hors ligne) ; A6 |
| S-107 | Comme S-59 ; M a annoté O hors ligne. | L'appareil se synchronise. | L'annotation est conservée et transmise en contribution différée. | § 6.6 ; CP-27 |
| S-60 | Espace `privé` à membre unique M ; réplique avec un objet partagé à M par une règle révocable. | M active la réplication sans échéance. | **Refus.** | § 2 (hors ligne) |
| S-83 | Espace à membre unique, uniquement des objets publics librement redistribuables. | Le membre active la réplication sans échéance. | **Accepté.** | § 2 (hors ligne) |
| S-138 | Plafond de plateforme : 30 jours. | ADM fixe une échéance locale de 100 jours pour P. | **Refus.** | § 2 (hors ligne) |
| S-61 | Contribution hors ligne de M ; partage révoqué avant l'intégration. | Intégration ; puis M relit sa contribution refusée. | M ne lit que son delta. | CP-27 |
| S-62 | Collaborateur de COL autorisé à `commenter` par la sélection S ; règle active à l'intégration. | Il commente hors ligne, puis se synchronise. | Commentaire **intégré**. | § 6.6 ; § 6.3 |
| S-63 | O invisible pour M ; identifiant de O connu ; identifiant fictif F. | M écrit une référence vers O, puis vers F. | Même erreur et même délai. | A5 ; TI-11 |

## 9. Visibilité, unicités, publications, campagnes

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-139 | COL de P a `éditer` sur l'objet `projet` O. | COL passe O en visibilité `public`. | **Refus.** | § 6.2 |
| S-140 | RS de P ; évaluation de diffusabilité favorable sur O. | RS passe O en `public` ; puis un lecteur anonyme consulte O. | **Accordé.** | § 6.2 ; § 7 (5) |
| S-141 | COL de P. | COL réduit la visibilité de l'objet `projet` O à `privé`. | **Refus.** | § 6.2 |
| S-142 | RS de P ; V bénéficie d'une règle explicite `voir` sur l'objet `projet` O. | RS réduit la visibilité de O ; puis V consulte O. | **Accordé** : la délégation explicite est maintenue. | § 6.2 |
| S-143 | Objet public O, sans protection. | Un lecteur anonyme, sans aucun droit, consulte O. | **Accordé.** | § 7 (5) |
| S-64 | M1 a une base justificative de portée `projet`, en vigueur, sur l'assertion A. | M2 crée une base de portée `projet` sur A. | Conflit signalé ; M2 voit la base de M1. | § 6.5 |
| S-91 | M1 a une base de portée `privée` sur A. | M2 crée sa base de portée `privée` sur A. | **Accepté**, sans conflit. | § 6.5 |
| S-144 | M1 a une base de portée `privée` sur A, invisible pour M2. | M2 crée une base de portée `projet` sur A. | **Accepté**, sans conflit. | § 6.5 |
| S-65 | Série S de l’espace A ; numéro N de l’espace B ; aucune acceptation par un détenteur d’`administrer` sur A. | B insère N dans S au rang 13. | **Refus** ; le rang 13 reste libre. | § 6.3 (séries) ; DD-25 |
| S-66 | Campagne en phase indépendante ; participant Y relié à un acteur. | Y consulte les réponses des autres participants. | Rien n'est servi. | § 7 (2) |
| S-92 | Campagne en phase indépendante ; personne Y non reliée à un acteur. | Y répond. | **Refus.** | § 7 (2) |
| S-145 | Espace P archivé ; COL de P. | COL édite un objet `projet` de P. | **Refus.** | § 6.3 (archivage) |

## 10. Transfert : objets `privé`, atomicité, réémission

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-67 | C titulaire de l'objet `privé` O (sans embargo) dans E ; voie (b) retenue ; K a accepté explicitement O. | K accepte ; puis K consulte O. | **Accordé** (K titulaire) ; la paternité de C reste attachée à O. | § 3.4.6 (b) ; § 3.4.4 |
| S-93 | Comme S-67, mais K n'a pas accepté explicitement O. | K accepte le transfert. | **Refus** ; rien n'est appliqué. | § 3.4.6 ; § 3.4.4 |
| S-68 | C titulaire de O ; voie (c), licence permettant la copie ; l'original O suit la voie (a). | K accepte ; puis C consulte la copie O' dans son espace personnel. | **Accordé** ; O' porte une `FILIATION` vers O ; O est resté dans E. | § 3.4.6 (c) |
| S-75 | Comme S-68, mais la licence interdit la copie. | K accepte. | **Refus**, cause signalée ; rien n'est appliqué. | § 3.4.6 ; § 3.4.4 |
| S-84 | Voie (b) pour O1, voie (c) pour O2 ; un consentement couvrant O1 est retiré entre la présentation et l'acceptation. | K accepte. | **Refus** de toute l'acceptation. | § 3.4.4 |
| S-85 | Comme S-35, avec une échéance réémise plus lointaine que celle présentée. | K accepte. | **Refus.** | § 3.4.5 |
| S-86 | Comme S-35 ; G1 n'a pas d'autre fondement que C ; K ne réémet pas G1. | K accepte ; puis un collaborateur des Colimaçons consulte un objet de G1. | **Refus.** | § 3.4.5 |
| S-87 | Comme S-35, mais G1 a expiré avant l'acceptation. | K accepte en réémettant G1. | **Refus** de toute l'acceptation. | § 3.4.5 |
| S-88 | Transfert présenté ; une règle de E bénéficie au rôle `collaborateur` de F ; F ajoute ensuite des collaborateurs. | K accepte. | **Refus** (modification substantielle). | § 3.4.3 |
| S-89 | ADM sur P ; TIT a l'objet `privé` O. | ADM crée une règle `voir` sur O au profit du `public`. | **Refus.** | A1 ; A2 ; § 6.1 |
| S-90 | RS1 a nommé RS2 ; RS2 n'a pas accepté. | RS2 consulte un objet `projet` de P au titre de la nomination. | **Refus.** | § 5 |
| S-146 | C seul fondement d'une délégation D au profit de V, prolongée par RS2 avant le transfert (fondement indépendant). | K accepte sans réémettre D ; puis V consulte la cible de D. | **Accordé** : D survit par RS2. | § 3.4.5 |
| S-147 | C a nommé RS2 ; la nomination est réémise par K. | Après l'acceptation, RS2 consulte le contenu `projet` sans nouvelle acceptation. | **Accordé.** | § 3.4.5 |
| S-148 | Comme S-147 ; RS2 avait délégué `voir` à V avant le transfert. | Après l'acceptation, V consulte la cible. | **Accordé** (chaîne continue par la nouvelle nomination). | § 3.4.5 |

## 11. Bilan

- **Scénarios actifs : 147.**
  - Les identifiants S-01 à S-93 sont conservés, corrigés selon le contrôle en aveugle.
  - S-94 à S-148 sont ajoutés.
  - S-124 n’est pas attribué : un propriétaire est toujours RS, ce qui rend la précondition prévue inatteignable.

- **Couverture des attaques jugées absentes par le contrôleur (C.2) :**

  | Attaque | Scénarios |
  |---|---|
  | Nomination circulaire | S-110 |
  | Interdiction d'existence posée sans autorité | S-131 |
  | Passage en `public` par un collaborateur | S-139 |
  | Gel d'un groupe | S-116 |
  | Groupe bénéficiaire d'un embargo | S-129 |
  | Clôture de la nomination d'un pair | S-111 |
  | Dérogations excessives | S-132 à S-135 |
  | Fausse restriction légale | S-136, S-137 |
  | Présentation du transfert | S-122 |
  | Nouveau transfert par le créateur | S-119 |
  | Transfert par un co-administrateur | S-118 |
  | Réintégration du cédant | S-120, S-121 |
  | Rôle d'un autre espace | S-115 |
  | Partage d'un titulaire avec son équipe | S-117 |
  | Programme en mode `notification` | S-95 |
  | Compteurs et pagination | S-11, S-98, S-103 |

- **Statut : candidate, non gelée.**
