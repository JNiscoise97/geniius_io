# GENIIUS — Instruction du contrôle en aveugle du contrat d'autorisation et de la batterie V1.2

**Date :** 10 octobre 2026
**Rapport instruit :** [CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_2.md](CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_2.md), produit par un agent séparé. Il n'avait accès qu'au contrat, à la batterie et au contexte normatif (MCD, dictionnaire, CDCF).
**Instructeur :** l'auteur du contrat et de la batterie, qui ne clôt aucun constat.

## 1. Résultat et position

| Ensemble | Bloquant | Majeur | Mineur | Observation |
|---|---|---|---|---|
| Contrat (CC-01 à CC-32) | 0 | 17 | 14 | 1 |
| Batterie | 1 (S-46) | 6 | une vingtaine | 5 |

**Verdict du contrôleur : gel impossible en l'état.** Je partage ce verdict.

**Ce qui tient :** les principes A1 à A6, l'atomicité du transfert, les règles de réémission, la séparation entre gérer et lire, les protections non levables. 51 scénarios passent sans anomalie.

**Ce qui ne tient pas :**
- l'algorithme d'évaluation (§ 7) ;
- plusieurs mécanismes d'application : groupes, rôles d'autres espaces, embargos, dérogations, changement de visibilité ;
- les définitions manquantes : propriétaire, créateur d'une interdiction, créateur d'une restriction légale.

**Vérifications de l'instructeur :**
- **S-46 :** SUP1 est à la fois demandeur et bénéficiaire. Il ne reste donc qu'un seul approbateur non bénéficiaire, et le contrat impose un refus. Le résultat attendu contredit le § 3.4. **Exact.**
- **CC-07 :** « sinon refus » termine l'étape 4, avant l'étape 5 (visibilité publique ou communautaire). **Exact.**
- **CC-02 :** une prolongation ajoute l'acteur aux fondements, et rien n'exige que les fondements soient enracinés. **Exact.**

**Lecture de fond.** Les failles ne remettent pas en cause les principes. Elles viennent de trois sources :
- une règle trop littérale : A3 (« l'habilitant n'est pas membre du groupe bénéficiaire ») bloque des usages légitimes sans rien protéger (CC-09) ;
- un modèle des groupes construit sur le seul A1, qui gèle les groupes et casse les programmes (CC-10 à CC-12) ;
- des opérations non régies : interdiction, restriction légale, changement de visibilité, propriétaire.

## 2. Constats que l'instructeur propose de corriger sans arbitrage

| ID | Correction proposée |
|---|---|
| CC-01 | Une délégation du cédant qui a un **fondement indépendant** (prolongée par un autre responsable scientifique) survit **sans réémission**, et la présentation l'indique. Le § 3.3.5 ne vise que les délégations dont le cédant est le **seul** fondement. |
| CC-02 | **Chaîne enracinée** : un fondement n'est valide que si l'acteur tient son droit par une chaîne qui remonte à une attribution du système **sans repasser par la délégation évaluée** ; aucun ensemble de fondements ne se soutient mutuellement. |
| CC-04 | L'autorité de transfert du créateur d'un espace préparé pour un tiers **s'éteint au premier transfert accepté**. |
| CC-06 | Étape 2 réécrite : une règle d'interdiction d'existence vise ses **destinataires** (les acteurs à qui l'objet est caché), conformément à DI-B12 ; un embargo d'existence s'applique à tous **sauf** ses bénéficiaires. Les deux cas sont distingués. |
| CC-07 | Ordre corrigé : étape 4, accord si un droit est trouvé, sinon passer à l'étape 5 ; étape 5, visibilité par défaut ; refus seulement si rien n'a accordé. |
| CC-13 | **Un gardien est toujours bénéficiaire** de l'embargo qu'il garde. Le gardien d'office (titulaire ou responsable scientifique) devient bénéficiaire. Dans un transfert, le nouveau titulaire (voie b) ou le cessionnaire (voie a, contenu `projet`) devient gardien et bénéficiaire des embargos de l'objet transféré, et la présentation l'indique. |
| CC-14 | Seuls les **fondateurs** d'une nomination peuvent la clore, ainsi que le propriétaire en cas de départ. Le gardien d'office n'intervient que si **aucun** gardien désigné ne reste. Un responsable scientifique ne peut donc ni écarter un pair ni prendre la garde de son embargo. |
| CC-21 | Ajouter le **rattachement** comme fondement admis d'une délégation au § 3.2 : fin du rattachement, fin des délégations fondées sur lui (DD-22.6, DI-B37). Corrige aussi S-29. |
| CC-22 | Admettre un membre ne prolonge pas la délégation elle-même : un admetteur n'est fondement que de **l'admission** qu'il prononce. |
| CC-23 | A3 précisée : accepter une nomination ou un transfert n'est pas une auto-attribution, parce que l'acte d'attribution émane d'un autre acteur ou du système. |
| CC-20 | Ajouter `transcrire` aux droits du titulaire. |
| CC-24 | Délégation de lot : reprendre DD-23.4 (jamais `valider`, `administrer`, `repartager` ni publication ; échéance obligatoire). |
| CC-18 à CC-31 (autres mineurs) | Compléter, chacun dans sa clause :<br>• blocage d'un transfert par un tiers : délai d'expiration de la présentation ;<br>• ajout d'un bénéficiaire d'embargo par un gardien ;<br>• échéance hors ligne plafonnée au MPD ;<br>• droit de créer un objet ;<br>• réintégration du cédant par un nouvel acte seulement ;<br>• renonciation du titulaire ;<br>• liste fermée des métadonnées lisibles par un administrateur ;<br>• une nomination est une délégation réémissible. |
| CC-32 | Corriger le lien V1_1 → V1_2 ; renommer l'arbitrage de réutilisation « D3 » en « DR-1 » pour ne plus le confondre avec « D-3 ». |

## 3. Arbitrages demandés au porteur

| # | Constat | Question | Recommandation de l'instructeur |
|---|---|---|---|
| E-1 | CC-09 | A3, condition 2 (« l'habilitant n'est ni bénéficiaire, ni membre du groupe bénéficiaire ») empêche un titulaire de partager avec son équipe et rend toute règle `public` impossible. | Remplacer la condition par la règle de fond : **nul n'augmente ses propres droits.** Une délégation au profit d'un groupe, d'un rôle ou du public dont l'habilitant fait partie est permise, puisqu'elle ne lui donne rien qu'il ne détienne déjà. L'interdiction de s'ajouter soi-même à un groupe bénéficiaire est maintenue. |
| E-2 | CC-10, CC-11, CC-12 | Modèle des groupes et des rôles d'autres espaces. | **Généraliser le mode d'admission (DD-22) à toute délégation au profit d'un groupe ou du rôle d'un autre espace.** La composition du groupe relève de la gouvernance de son espace : un administrateur ou un programme gère librement son groupe de coordination. Un nouveau membre ne reçoit les droits délégués qu'en mode `notification`, choisi par l'habilitant, ou après approbation de l'habilitant (`approbation préalable`, mode par défaut pour un contenu protégé). Pour un groupe bénéficiaire d'un embargo, l'approbation d'un **gardien** est toujours requise. Effets : plus de gel de groupe, les programmes fonctionnent, et ajouter un tiers à un groupe d'embargo ne lève plus rien. |
| E-3 | CC-03 | Qu'est-ce que le « propriétaire », et qui peut transférer ? | Un seul `propriétaire` par espace. **Seul** le propriétaire, s'il est aussi responsable scientifique, peut transférer. Le transfert rend K propriétaire. Les autres administrateurs et responsables scientifiques gardent leurs rôles, listés dans la présentation, et K peut les révoquer ensuite. |
| E-4 | CC-05 | Qui peut créer une règle d'interdiction, en particulier d'existence ? | Les mêmes autorités que pour un embargo : le titulaire (objet `privé`) et un responsable scientifique (contenu `projet`). Une interdiction d'existence a un auteur et un gardien, comme un embargo. Un administrateur ou un collaborateur n'en crée pas. |
| E-5 | CC-08 | Qui peut changer la visibilité d'un objet ? | Changer la visibilité est un acte de **partage**, pas d'édition. Élargir la visibilité exige `repartager` sur l'objet : le titulaire, ou un responsable scientifique pour le contenu `projet`. La passer à `public` exige en plus l'évaluation de diffusabilité. La restreindre est ouvert à ceux qui ont `éditer`. Un collaborateur qui a `éditer` ne publie donc pas. |
| E-6 | CC-15 | Encadrement des dérogations. | Opérations **fermées** : `voir` par défaut, et `exporter` seulement si l'opération est demandée et approuvée explicitement. **Durée plafonnée**, valeur fixée au MPD (ordre de grandeur : 30 jours). Un renouvellement est une nouvelle dérogation, avec ses approbations, et le nombre de renouvellements est visible dans le journal. **Deux approbateurs** pour toute dérogation qui franchit une protection, de contenu ou d'existence. Les étapes « interdictions » et « protections » sont franchies **seulement** pour la finalité déclarée. La composition de l'autorité de dérogation est définie dans le contrat (rôle ST-15, liste nominative tenue hors des espaces). |
| E-7 | CC-16 | Qui peut créer une restriction légale ? | Seule l'autorité de dérogation, avec deux approbateurs et sur un fondement documenté, ou une autorité externe enregistrée. L'auteur d'une restriction ne peut pas se désigner autorité compétente pour la lever. Une qualification abusive est contestable par le titulaire. |
| E-8 | CC-17 | Que montre la présentation du transfert au futur cessionnaire ? Le CDCF § 128 lui fait voir les partages actifs, mais la présentation ne doit pas révéler une protection d'existence posée par un tiers. | La présentation montre les **partages actifs** (ce qui ouvre l'accès : règles, sélections, groupes, rôles) et les objets que K pourra voir après le transfert. Elle **ne montre pas** les embargos ni les interdictions d'existence qui ne le concernent pas. Ces protections restent en place, avec leurs gardiens, et l'empreinte les inclut sans les afficher. |

## 4. Instruction des scénarios

| Scénario | Constat | Correction proposée |
|---|---|---|
| **S-46** (bloquant) | Demandeur bénéficiaire ; un seul approbateur restant | Réécrire : SUP1 et SUP2 approuvent, au profit de l'agent A (tiers non approbateur). Ajuster S-80 et S-81 sur ce modèle. |
| S-78, S-79 | « Plus aucun gardien » est inatteignable, puisque le titulaire est gardien d'office | Précondition réalisable : titulaire dont l'acteur est inactif (compte supprimé) et aucun responsable scientifique dans l'espace. |
| S-55 | Aucune opération ne fait passer un objet en « privé d'un autre titulaire » | Précondition : un embargo d'existence posé par un autre gardien rend O inexistant pour l'auteur de la règle de sélection. |
| S-29 | Le résultat ne découle pas du contrat | Corrigé par CC-21. |
| S-30 | « Ne lit plus rien de E » va trop loin | « Aucun droit **fondé sur E** » ; accès public et droits tirés d'autres espaces hors champ. |
| S-45 | RS2 n'est pas bénéficiaire, donc ne voit pas O | Corrigé par CC-13 : le gardien d'office devient bénéficiaire. |
| Mineurs et observations | Opérations multiples (S-43, S-47, S-49, S-59, S-74), fondements imprécis, préconditions incomplètes | Corrections une à une, selon le tableau B du rapport. |

**Couverture :** ajouter les 16 scénarios d'attaque du tableau C.2 et les cas positifs du tableau C.1 jugés nécessaires, en priorité :
- nomination circulaire ;
- interdiction d'existence par un collaborateur ;
- passage en `public` par un collaborateur ;
- groupe d'embargo ;
- renouvellement de dérogation ;
- fausse restriction légale ;
- présentation et existence protégée ;
- partage par un titulaire avec son équipe (cas positif) ;
- groupe de coordination en mode `notification` ;
- visibilité publique par défaut (cas positif).

Cela portera la batterie à environ 115 scénarios.

## 5. Suite proposée

1. **Arbitrages E-1 à E-8** par le porteur.
2. Contrat (3e révision) : corrections du § 2 et arbitrages du § 3.
3. Batterie V1.3 : scénarios corrigés et ajoutés.
4. **Nouveau contrôle en aveugle**, par un agent qui n'a pas fait le contrôle V1.2, sans aucun rapport antérieur.
5. Gel, avec procès-verbal daté et version identifiée, si aucun constat bloquant ni majeur ne subsiste.

## 6. Décisions du porteur (10/10/2026)

**Refus de gel de la V1.2 validé.** Les anomalies relevées peuvent permettre une élévation de privilèges, empêcher des usages légitimes ou révéler des données protégées.

**Arbitrages E-1 à E-8 retenus pour la V1.3, avec précisions :**
- **E-1 (validé) :** « nul n'augmente ses propres droits ni son pouvoir de délégation » ; le titulaire peut partager avec son équipe même s'il en est membre.
- **E-2 (validé avec conditions) :** distinguer trois choses :
  - l'**appartenance** au groupe, décidée par son gestionnaire ;
  - l'**admission aux droits**, décidée par chaque délégation ;
  - l'**admission à une protection d'existence**, qui exige toujours l'accord d'un gardien habilité.

  Le mode `notification` est une **autorisation anticipée de l'habilitant**, jamais un droit autonome du gestionnaire du groupe ; il ne contourne aucune protection.
- **E-3 (validé avec conditions) :**
  - un propriétaire unique, désigné par la création ou par un transfert ;
  - la propriété administrative est distincte de l'autorité scientifique : le propriétaire ne lit pas les contenus protégés du seul fait de sa propriété ;
  - seul un propriétaire qui est aussi responsable scientifique peut transférer, avec une procédure particulière pour les espaces préparés pour un tiers ;
  - une procédure explicite de succession, d'indisponibilité durable ou de perte de capacité, qui n'est pas improvisée dans le moteur d'autorisation.
- **E-4 (validé).**
- **E-5 (validé avec conditions) :** distinguer modifier les données, réduire l'audience et modifier le statut de propriété. L'élargissement est un partage. Une réduction respecte les protections, les responsabilités scientifiques et les droits déjà accordés ; un simple détenteur d'`éditer` ne réduit pas arbitrairement l'audience d'un contenu commun.
- **E-6 (validé avec conditions) :**
  - deux approbateurs indépendants (identité humaine vérifiée, sans conflit d'intérêts) dès qu'une protection est franchie ;
  - périmètre précis, justification, durée maximale, journalisation, contrôle de finalité ;
  - `voir` comme opération de base ; `exporter` sur autorisation explicite distincte ; `éditer`, `valider`, `repartager` et `administrer` exclus ;
  - protections non levables prioritaires ; aucun pouvoir de délégation ;
  - 30 jours comme plafond **candidat**, à confirmer techniquement et juridiquement.
- **E-7 (validé) :** autorité qualifiée, fondement documenté, contestation possible, pas d'auto-désignation.
- **E-8 (validé avec conditions) :** distinguer la vue du cessionnaire de la représentation technique scellée. Les protections invisibles entrent dans l'empreinte sans apparaître dans la vue. Les fuites indirectes sont à tester : compteurs, pagination, différences de réponse, journaux administratifs.

**Points supplémentaires :**
- **CC-20 :** ne pas accorder `valider` au titulaire ; distinguer validation personnelle et validation scientifique reconnue.
- **CC-28 :** toute réintégration du cédant à un rôle, après le transfert, exige l'accord explicite du nouveau propriétaire. Une nomination par un responsable scientifique resté en place ne contourne pas le transfert.

**Critère de gel :**
- aucun constat bloquant ou majeur ouvert ;
- aucun scénario dont le résultat attendu exige d'inventer une règle absente du contrat.

**Séquence :**
1. 3e révision du contrat.
2. Batterie V1.3.
3. Nouveau contrôle réellement aveugle.
4. Éventuel gel.

## 7. Réalisation (10/10/2026)

- **Contrat V1.3** (`docs/GENIIUS_CONTRAT_AUTORISATION_V1.md`), réécrit en entier. Il intègre :
  - les arbitrages E-1 à E-8, avec les précisions du porteur ;
  - CC-20 (pas de `valider` pour le titulaire) et CC-28 (réintégration du cédant soumise à l'accord du propriétaire) ;
  - les corrections du § 2 de cette instruction ;
  - les constats mineurs CC-18 à CC-31.

  La 2e révision est conservée dans `historique/`.
- **Ajouts de l'auteur, non arbitrés**, signalés au § 8 du contrat :
  - règles de départ d'un habilitant ;
  - gardien désignable ;
  - droit de créer ;
  - renonciation ;
  - archivage ;
  - unicités.

  Le départ d'un habilitant comble une lacune trouvée en rédigeant la batterie : la règle de dépendance faisait tomber toute l'équipe au départ de celui qui l'avait constituée.
- **Batterie V1.3** (`GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_3.md`), 147 scénarios :
  - identifiants S-01 à S-93 conservés et corrigés selon le tableau B ;
  - S-94 à S-148 ajoutés : attaques du tableau C.2, cas positifs du tableau C.1, tests des arbitrages E et des ajouts de l'auteur ;
  - S-124 non attribué.
- **Nouveau contrôle en aveugle lancé**, par un agent distinct, sans accès à aucun rapport ni à aucune instruction antérieurs.
