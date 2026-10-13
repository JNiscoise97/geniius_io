# GENIIUS — Contrat d'autorisation

**Version :** **V1.3 — candidat, non gelé** (10 octobre 2026). Réécriture complète intégrant :
- les arbitrages du porteur Q1 à Q4, D-1 à D-4 et E-1 à E-8 ;
- les corrections CC-01 à CC-32 du contrôle en aveugle de la V1.2.

La version précédente (2e révision) est conservée dans `AUDIT-MLD/historique/`.

**Statut normatif :** une fois gelé, ce contrat **prime** sur toute règle d'accès du dictionnaire et du MLD. Il remplacera la DD-28 du dictionnaire, et les contraintes d'accès du MLD seront réécrites comme ses conséquences.

**Batterie de recette :** [GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_3.md](GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_3.md).

**Critère de gel** (décision du porteur) : aucun constat bloquant ou majeur ouvert, et aucun scénario dont le résultat attendu exige d'inventer une règle absente de ce contrat.

---

## 1. Vocabulaire

| Terme | Définition |
|---|---|
| **Action** | Opération sur un contenu : `voir`, `commenter`, `proposer`, `transcrire`, `éditer` (modifier les données), `valider` (validation scientifique reconnue), `exporter`, `réutiliser`, `contribuer au Core`. |
| **Droit d'opération** | Faculté pour un acteur d'exécuter une action sur un périmètre. |
| **Périmètre** | Ensemble délimité de cibles : un objet ; un lien ; les objets d'un espace d'une visibilité donnée ; le manifeste actif d'une sélection ; les objets listés d'un lot. Jamais « tout ce qui sera ajouté plus tard » (P24). |
| **Pouvoir de délégation** | Faculté d'accorder à autrui une action sur un périmètre (`repartager`). Distinct de l'action elle-même : détenir `voir` ne permet pas de faire voir. |
| **Pouvoir de gouvernance** | `administrer` : opérations de gouvernance listées au § 4 et lecture des métadonnées de gouvernance du § 4.3. Ni action sur un contenu, ni pouvoir de délégation de contenu. |
| **Propriétaire** | L'acteur unique qui détient la **propriété administrative** d'un espace (§ 4.1). Distinct de l'autorité scientifique. |
| **Responsable scientifique (RS)** | Rôle d'appartenance qui porte l'autorité scientifique sur le contenu `projet` d'un espace (§ 5). |
| **Titulaire** | Acteur à qui le système attribue les droits sur un objet `privé` à sa création (§ 3.1). |
| **Délégation** | Acte par lequel un **habilitant** accorde une ou plusieurs actions sur un périmètre, pour une durée, à un **bénéficiaire** : acteur, groupe, rôle d'appartenance d'un espace, ou public. |
| **Fondement** | Origine valide d'un droit : attribution par le système (§ 3.1) ; délégation (§ 3.2) ; rattachement de projets (§ 3.2) ; transfert (§ 3.4) ; dérogation (§ 3.5). |
| **Chaîne enracinée** | Suite de fondements qui remonte, sans passer deux fois par le même acte, à une attribution par le système. |
| **Protection** | Restriction qui s'applique avant toute autorisation. Trois familles :<br>• **d'existence** : embargo d'existence, interdiction d'existence ;<br>• **de contenu** : embargo de contenu, interdiction d'action ;<br>• **non levable par une décision interne** : consentement refusé ou retiré, purge, effacement légal, restriction légale. |
| **Gardien** | Bénéficiaire d'un embargo ou d'une interdiction d'existence habilité à en gérer les bénéficiaires et à les lever (§ 6.4). Un gardien est toujours bénéficiaire. |
| **Appartenance à un groupe** | Le fait d'être membre d'un groupe, décidé par le gestionnaire du groupe (§ 3.3). |
| **Admission aux droits** | Le fait, pour un membre d'un groupe ou d'un rôle, de bénéficier effectivement d'une délégation (§ 3.3). |

## 2. Principes

**A1 — Nul ne donne ce qu'il n'a pas.** Toute délégation exige que l'habilitant détienne, au moment de l'acte **et** à chaque évaluation :
- chaque action accordée ;
- le pouvoir de la déléguer (`repartager`) ;
- un périmètre et une durée au moins aussi larges que ceux accordés.

Une délégation n'augmente jamais les prérogatives de sa chaîne. Un détenteur d'une action sans pouvoir de délégation ne peut pas en faire bénéficier autrui.

**A2 — Gérer n'est pas lire.** `administrer` et la propriété administrative ne confèrent aucun droit sur les contenus, leurs versions, leurs preuves, leurs relations protégées ou leurs représentations dérivées, ni aucun pouvoir de déléguer un contenu.

**A3 — Nul n'augmente ses propres droits ni son pouvoir de délégation** (arbitrage E-1). Aucun acte dont un acteur est l'auteur ne peut accroître ses propres droits ou pouvoirs.
- **Interdits :** se créer une règle à son profit, s'ajouter à un groupe ou à un rôle, s'admettre, se déclarer bénéficiaire ou gardien d'une protection, se nommer, se désigner autorité compétente.
- **Permis**, puisqu'ils ne lui donnent rien qu'il ne détienne déjà : une délégation au profit d'un groupe, d'un rôle ou du public dont l'habilitant fait partie.
- **Accepter** une nomination ou un transfert n'est pas une auto-attribution : l'attribution émane d'un autre acteur ou du système.
- Seul le système attribue des droits initiaux, selon les procédures fermées du § 3.1.

**A4 — Pas de résurrection.** Prolongation, admission, transfert, réouverture, restauration et réimport ne réactivent jamais un droit révoqué ou expiré. Seul un nouvel acte conforme à A1 et A3 crée un droit.

**A5 — Les protections priment.**
- Elles s'appliquent avant toute autorisation, administrateurs et propriétaire compris.
- Il n'existe aucun droit générique de contournement : la seule dérogation est la procédure fermée du § 3.5.
- Les protections non levables ne cèdent qu'à l'autorité légale compétente.

**A6 — Révocation et cohérence.** Une décision d'accès est évaluée sur un état d'habilitation qui ne peut ignorer aucune révocation déjà effective, et les caches sont coordonnés avec la prise d'effet des changements de droits (CP-40). En cas d'impossibilité de vérifier, la réponse est un refus, indistinguable d'une absence.

**Hors ligne** (arbitrage D-4) :
- toute réplique contenant des données protégées, ou soumises à une autorisation révocable, porte une **échéance locale opposable**, y compris dans un espace à membre unique ;
- seuls les contenus publics et librement redistribuables peuvent en être dispensés ;
- le contrat ne présume pas qu'une révocation distante efface un appareil déconnecté : le résidu est borné par l'échéance, et le retrait a lieu à la prochaine synchronisation effective ;
- l'échéance a un **plafond de plateforme** fixé au MPD, qu'aucun paramètre d'espace ne dépasse ; l'habilitant d'une délégation peut imposer une échéance plus courte pour les objets qu'il partage (CC-26) ;
- est **donnée protégée** au sens de cette règle tout objet qui n'est pas à la fois public et librement redistribuable, y compris les objets `privé` du titulaire lui-même.

## 3. Fondements des droits

### 3.1 Attribution par le système

Le système, et lui seul, attribue des droits initiaux, dans la transaction de création, selon des procédures fermées, non réutilisables après coup.

| Procédure | Attribution |
|---|---|
| **Création d'un espace** | Au créateur : la **propriété administrative** (propriétaire unique) et l'appartenance **responsable scientifique**. |
| **Création d'un objet `privé`** | Au **titulaire** : `voir`, `commenter`, `proposer`, `transcrire`, `éditer`, `exporter`, `réutiliser`, et le pouvoir de déléguer chacune de ces actions (`repartager`). **Pas `valider`** (CC-20) : le titulaire peut marquer une **validation personnelle** (statut propre à son objet, sans effet scientifique). La validation scientifique reconnue reste un acte d'évaluation, soumis à ses propres règles. |
| **Titulaire** | Acteur réalisateur d'une activité manuelle ou assistée ; pour une activité automatique ou un import, le **déposant identifiable des entrées**, s'il détient les droits sur ces entrées. À défaut, aucun droit personnel n'est créé ; l'activité est imputée à un acteur institutionnel technique, sans droit. Un acteur qui n'a qu'un pouvoir de gouvernance ne devient titulaire que s'il est lui-même réalisateur ou déposant, avec des droits sur les entrées. |
| **Droit de créer** (CC-27) | Créer un objet dans un espace exige une appartenance scientifique `collaborateur` ou `responsable scientifique`, ou une délégation explicite de `proposer` pour un invité, qui ne crée alors que des propositions. Un lecteur, un invité sans délégation, un administrateur ou un propriétaire en tant que tels ne créent pas d'objet. Les droits sur un fichier externe (GEDCOM, image) sont **déclarés** par le déposant, qui en répond ; la plateforme ne vérifie pas la propriété intellectuelle externe : c'est un résidu documenté. |
| **Création d'un objet d'une autre visibilité** | Aucun droit nominatif : l'objet est régi par les rôles (§ 5), la visibilité (§ 6.2) et les délégations. |
| **Amorçage du référentiel commun** | Acteur institutionnel d'amorçage ; aucun droit de titulaire ; visibilité publique explicite. |

**Droit de titulaire :**
- il n'est créé, prolongé ou modifié par aucun acteur ;
- il ne passe à un autre acteur que par la voie (b) du transfert (§ 3.4.6) ;
- il s'éteint par la purge de l'objet, par la **renonciation** du titulaire, ou au transfert. Une renonciation impose un **sort** à l'objet, comme au transfert (CC-29) : versement au contenu de l'espace, avec l'accord d'un RS, ou purge légalement autorisée. Sans sort possible, la renonciation est refusée. Aucun objet ne devient orphelin.

### 3.2 Délégation

**Formes :**
- règle d'accès ;
- appartenance scientifique, nomination comprise ;
- délégation au profit d'un groupe ou d'un rôle (§ 3.3) ;
- admission ;
- délégation de lot ;
- règle sur une sélection ;
- ajout d'un bénéficiaire de protection (§ 6.4).

**Conditions (toutes requises) :**
1. **A1 :** l'habilitant détient chaque action accordée et son pouvoir de délégation sur un périmètre qui couvre celui accordé.
2. **A3 :** l'acte n'augmente pas les droits ni le pouvoir de délégation de l'habilitant.
3. **Durée :** l'échéance accordée ne dépasse pas celle des droits de l'habilitant, s'ils sont bornés.
4. **Redélégation :** le pouvoir de délégation n'est transmis que s'il est accordé explicitement (`repartager`) ; sans lui, aucune redélégation.
5. **Protections :** aucune protection ne s'y oppose.

**Fondements et dépendance :**
- Les fondements d'une délégation sont :
  - son habilitant d'origine ;
  - tout acteur qui l'a **prolongée** ou **confirmée** en remplissant lui-même les conditions 1 à 3 ;
  - le cas échéant, un **rattachement de projets** actif qui la fonde (CC-21).
- Elle est effective tant qu'**au moins un** fondement est valide, **avec une chaîne enracinée** (CC-02). Un fondement n'est valide que si son acteur tient son propre droit par une chaîne qui remonte à une attribution du système **sans passer par la délégation évaluée**. Des fondements qui ne tiennent que les uns par les autres ne valent rien.
- Si tous les fondements disparaissent, ou si le rattachement qui la conditionne prend fin, le droit cesse, sans acte supplémentaire. Un **nouveau** rattachement ne réactive rien (A4).
- Les cycles de délégation sont refusés à leur création, et neutralisés à l'évaluation s'ils surviennent par confirmation ; la profondeur des chaînes est bornée (CP-40).

**Actes sur une délégation existante** (elle garde son identité) :

| Acte | Qui | Effet |
|---|---|---|
| Prolonger, confirmer | Un acteur qui remplit les conditions 1 à 3 | Il devient fondement de la délégation, dans les limites de ses propres droits. |
| Admettre un membre (§ 3.3) | Un acteur qui remplit les conditions 1 à 3 | Il devient fondement de **cette admission seulement**, pas de la délégation (CC-22). |
| Restreindre, clore | Un fondateur ; le titulaire pour une délégation portant sur son objet ; un RS pour une délégation portant sur le contenu `projet`, **sauf** une nomination de responsable scientifique, que seuls ses fondateurs peuvent clore (CC-14) | La délégation est restreinte ou close. |

Aucun de ces actes ne réactive une délégation close ou expirée (A4).

**Départ d'un habilitant** *(ajout de l'auteur en V1.3, soumis à la validation du porteur)*. La dépendance s'applique à toute perte de droit. Il faut donc distinguer :

| Cas | Effet |
|---|---|
| **Perte involontaire** (révocation, fin d'appartenance décidée par un tiers, interdiction) | Les droits qui dépendent de l'acteur cessent aussitôt, sauf fondement indépendant. C'est l'effet de sécurité recherché (A1). |
| **Départ volontaire d'un RS** | Il prend effet après une **présentation** des délégations et nominations dont il est le seul fondement. Avant la prise d'effet, un RS dont la chaîne est enracinée sans passer par le partant peut les **confirmer** ; il en devient fondement. Les délégations non confirmées cessent à la prise d'effet. |
| **Racine de l'espace** (le RS attribué par le système à la création ou au transfert) | Il ne peut ni quitter l'espace ni renoncer à son rôle de RS, sauf par un **transfert** (§ 3.4) ou par la **clôture** de l'espace. Sinon, toutes les chaînes de l'espace tomberaient sans possibilité de les rétablir. |
| **Décès, indisponibilité durable** de la racine | Procédure de succession (§ 3.4.2). |

### 3.3 Groupes et rôles d'autres espaces (arbitrage E-2)

Trois décisions distinctes :

1. **Appartenance.** Le gestionnaire d'un groupe décide qui en fait partie : le propriétaire ou un administrateur de l'espace du groupe, ou un programme pour son groupe de coordination. Pour le rôle d'un autre espace F, les membres de ce rôle sont décidés par F, selon ses propres règles. **L'appartenance ne confère aucun droit par elle-même.** S'ajouter soi-même à un groupe reste interdit (A3).
2. **Admission aux droits.** Toute délégation au profit d'un groupe ou du rôle d'un autre espace a un **mode d'admission**, choisi par l'habilitant :
   - **`approbation préalable`** (défaut, et seul mode admis pour un contenu protégé, un objet `privé` ou des données DI-E05) : un membre ne bénéficie de la délégation qu'après une admission nominative par un acteur qui remplit les conditions 1 à 3 ;
   - **`notification`** : une **autorisation anticipée de l'habilitant**, qui accepte d'avance les futurs membres dans les limites de la délégation. Ce n'est pas un droit du gestionnaire du groupe. Elle tombe avec les droits de l'habilitant (A1). L'habilitant est notifié de chaque entrée et peut retirer l'admission.
3. **Admission à une protection d'existence.** Pour un groupe bénéficiaire d'un embargo ou d'une interdiction d'existence, un membre ne devient bénéficiaire de la protection qu'avec l'**accord d'un gardien** (§ 6.4), quel que soit le mode d'admission ordinaire. Ajouter un tiers à un tel groupe ne lève rien.

Quitter un groupe ou un rôle retire immédiatement les droits qui en dérivaient (A6).

### 3.4 Propriété et transfert de gouvernance (arbitrages E-3, E-8, Q1)

**3.4.1 Propriété.**
- Chaque espace a un **propriétaire unique**, désigné par la création (§ 3.1) ou par un transfert.
- La propriété est **administrative** : elle ne donne aucun droit sur les contenus (A2). Le propriétaire ne lit que s'il est aussi responsable scientifique, ou par un autre fondement.
- Un administrateur n'est pas propriétaire.

**3.4.2 Autorité de transfert.**
- Seul le propriétaire, s'il est aussi responsable scientifique de l'espace, peut transférer (CC-03).
- **Espace préparé pour un tiers :** le créateur est propriétaire et RS, et l'espace porte la **désignation** du bénéficiaire futur (`DESIGNATION_GARDE`). Le premier transfert est proposé à ce bénéficiaire, ou à un autre désigné explicitement. L'autorité particulière du créateur **s'éteint au premier transfert accepté** (CC-04).
- **Succession, indisponibilité durable, perte de capacité :** ces cas relèvent d'une **procédure de succession distincte**, que le moteur d'autorisation n'improvise jamais. Elle s'appuie sur une désignation de garde préalable, ou sur un fondement légal enregistré, examiné par deux approbateurs de l'autorité de dérogation (§ 3.5), et aboutit à un transfert ordinaire. À défaut, l'espace reste en l'état.

**3.4.3 Présentation : vue du cessionnaire et représentation scellée (E-8).**

La **vue du cessionnaire** montre :
- les partages actifs qu'il pourra voir et gérer après le transfert : règles, sélections, groupes et rôles bénéficiaires, admissions ;
- les autres titulaires de rôles de l'espace, qui resteront en place ;
- les délégations à réémettre (§ 3.4.5) ;
- le sort de chaque objet `privé` du cédant (§ 3.4.6) ;
- les objets qu'il pourra voir.

Elle **ne montre pas** :
- les objets, embargos et interdictions dont l'existence lui est protégée ;
- leur nombre, ni aucun indice indirect : compteur, pagination, différence de réponse ou de délai, journal administratif.

La **représentation scellée** contient l'ensemble des engagements, protections invisibles comprises. Son empreinte fait foi. Est **substantielle** toute modification de la représentation scellée, y compris de l’audience d’un rôle d’un autre espace bénéficiaire (CC-18) ; elle impose une nouvelle présentation. Une présentation expire après un délai fixé (CC-18), si bien qu'un tiers ne peut pas bloquer un transfert indéfiniment.

**3.4.4 Acceptation et attribution, en une seule transaction (atomicité).**
- L'acceptation par le bénéficiaire vérifié se fait contre l'empreinte. Elle est refusée tant qu'un objet `privé` du cédant reste sans sort retenu ou en blocage.
- Effets, tous dans la même transaction :
  - le cessionnaire devient **propriétaire** et **responsable scientifique** ;
  - le cédant perd la propriété, toutes ses appartenances et attributions sur l'espace, ses appartenances aux groupes de l'espace, sa qualité de bénéficiaire et de gardien des protections de l'espace, et ses droits de titulaire (sauf voie (b)) ;
  - les **autres** administrateurs et responsables scientifiques **gardent leurs rôles**, et le cessionnaire peut les révoquer ensuite ;
  - les protections dont le cédant était le seul gardien passent au cessionnaire (contenu de l'espace) ou au nouveau titulaire (voie b), qui en devient gardien et bénéficiaire (CC-13) ; les protections qui ont d'autres gardiens sont inchangées ;
  - les voies (a), (b) et (c), les réémissions et les extinctions sont appliquées.
- Si une seule condition échoue, rien n'est appliqué.

**3.4.5 Délégations du cédant.**

| Situation | Effet |
|---|---|
| Délégations accordées **au** cédant par des tiers | Elles s'éteignent. |
| Interdictions | Jamais transférées. |
| Délégations accordées **par** le cédant, qui ont un **fondement indépendant** (prolongées par un autre RS, ou fondées sur un rattachement) | Elles **survivent** sans réémission ; la présentation l'indique (CC-01). |
| Délégations dont le cédant est le **seul** fondement | Elles s'éteignent, sauf **réémission** par le cessionnaire. |

Une réémission :
- est **annoncée** nominativement dans la présentation ;
- est faite **à l'identique ou plus étroite** ;
- est vérifiée selon A1 sur les droits que le cessionnaire reçoit ;
- n'est jamais faite pour une délégation déjà expirée ;
- n'est **jamais implicite** ;
- crée une **nouvelle délégation**, avec sa propre identité, le cessionnaire pour habilitant et auteur, et un lien « réémission de ». L'auteur historique n'est jamais réécrit, et la délégation d'origine est close à la même date. L'effet est continu pour le bénéficiaire.

Une nomination de responsable scientifique faite par le cédant suit les mêmes règles. Sa réémission n'exige pas de nouvelle acceptation du nommé, qui avait déjà accepté le rôle. Les délégations faites par ce RS conservent leur fondement, puisque son droit continue par la nouvelle nomination (CC-31).

La validité de chaque réémission (non-expiration, conformité à la présentation, A1) est une **condition de la transaction** : une seule réémission invalide fait échouer toute l'acceptation (§ 3.4.4).

**3.4.6 Objets `privé` du cédant (Q1, D-1).** Avant la présentation, le cédant choisit, objet par objet ou en bloc :
- **(a) Versement à l'espace :** l'objet prend une visibilité de l'espace ; sa provenance et la paternité du cédant sont conservées.
- **(b) Transfert au bénéficiaire :** l'objet reste `privé` ; le droit de titulaire passe au cessionnaire, par une opération distincte, acceptée explicitement objet par objet ou en bloc, sous les protections applicables.
- **(c) Copie autonome :** le cédant crée, dans son espace personnel, une copie liée par `FILIATION`, si la licence et les protections le permettent. L'original ne change jamais d'espace (DI-A01) : il suit (a), (b) ou une purge légalement autorisée.

Un objet qui ne peut suivre aucune voie est un **blocage** : le transfert ne peut pas être accepté. Aucun objet n'est rendu invisible par défaut.

**3.4.7 Après le transfert (CC-28).** Toute attribution d'un rôle au cédant sur l'espace, de gouvernance ou scientifique, exige l'**accord explicite du propriétaire**. Une nomination par un responsable scientifique resté en place ne suffit pas.

### 3.5 Dérogation (arbitrages Q2, Q3, D-3, E-6, E-7)

**3.5.1 Deux opérations distinctes.**
- **Accès exceptionnel :** accéder à un contenu pour une finalité déclarée, pendant une durée bornée. La protection sous-jacente **reste en place**.
- **Levée durable d'une protection :** elle relève de l'autorité de la protection, jamais de la dérogation :
  - embargo ou interdiction d'existence : un gardien ;
  - interdiction d'action : son auteur ou un fondateur ;
  - restriction légale : l'autorité compétente désignée.

  Lorsqu'une protection interne n'a plus aucun gardien, l'autorité de dérogation peut seulement **désigner un nouveau gardien**, avec deux approbateurs. C'est le cas, par exemple, d'un objet `privé` dont le titulaire est un acteur inactif (compte supprimé, DI-B09), ou d'un contenu `projet` sans RS. Seul est désignable un acteur qui détient déjà un droit de contenu sur l'objet (CC-19). À défaut d'un tel acteur, la protection reste en place, et l'objet n'est accessible que par accès exceptionnel.

**3.5.2 Autorité de dérogation.**
- Un rôle de plateforme (ST-15) dont la **liste nominative** est tenue hors de tout espace par la gouvernance de la plateforme.
- Ses membres sont des acteurs humains (`nature_acteur = personne`), d'identité vérifiée au niveau renforcé.
- Un membre ne peut agir sur un dossier dans lequel il a un lien d'intérêt (appartenance à l'espace concerné, lien déclaré avec l'objet).

**3.5.3 Approbation.**

| Cas | Approbateurs requis |
|---|---|
| Accès exceptionnel qui franchit **une protection**, de contenu ou d'existence | **Deux approbateurs indépendants :** personnes distinctes, comptes distincts, sans compte commun ni subordination déclarée, sans conflit d'intérêts ; aucun n'est bénéficiaire. |
| Désignation d'un gardien | Deux approbateurs indépendants. |
| Création d'une restriction légale | Deux approbateurs indépendants. |
| Accès exceptionnel à un contenu **sans aucune protection** | Un seul approbateur, non bénéficiaire, si la procédure applicable le permet. |

La fraude d'identité (deux identités vérifiées contrôlées par une même personne) est un **résidu documenté**, traité par la vérification d'identité et l'audit des journaux. Le modèle ne prétend pas l'exclure.

**3.5.4 Contenu d'une dérogation.**
- **Bénéficiaire nominatif.**
- **Finalité déclarée**, contrôlée : un usage hors finalité est refusé et journalisé.
- **Périmètre précis**, limité aux objets nécessaires.
- **Opérations fermées :** `voir` est l'opération de base ; `exporter` exige une autorisation explicite distincte, approuvée comme telle ; `éditer`, `valider`, `repartager` et `administrer` sont **exclus**.
- **Durée maximale :** plafond **candidat de 30 jours**, à confirmer lors de la conception technique et juridique. Un renouvellement est une **nouvelle** dérogation, avec ses approbations ; le journal compte les renouvellements.
- **Journalisation** de chaque usage, renforcée lorsqu'une protection d'existence est franchie.
- **Aucun pouvoir de délégation** n'en découle.
- **Ne franchit jamais une protection non levable.**

**3.5.5 Restrictions légales (E-7).**
- **Création :** une restriction légale n'est créée que par l'autorité de dérogation (deux approbateurs) sur un fondement documenté, ou enregistrée à la demande d'une autorité externe identifiée.
- **Référence structurée :**
  - nature de la restriction ;
  - fondement documenté ;
  - portée ;
  - période de validité ;
  - **autorité compétente pour la lever**.

  L'existence de ces métadonnées peut être protégée.
- **Pas d'auto-désignation :** les créateurs ne peuvent pas se désigner autorité compétente.
- **Contestation :** le titulaire de l'objet, ou le RS pour le contenu `projet`, peut contester la qualification. La contestation est examinée par deux approbateurs distincts des créateurs, et la restriction reste en vigueur pendant l'examen.

## 4. Gouvernance

### 4.1 Propriété administrative

Le propriétaire détient `administrer` sur l'espace. Opérations réservées au propriétaire :
- transfert (§ 3.4.2) ;
- nomination et révocation des administrateurs ;
- accord pour la réintégration du cédant (§ 3.4.7).

### 4.2 Opérations de gouvernance permises (`administrer`)

- Appartenances administratives : attribution et fin, jamais à soi-même.
- Gestion de l'appartenance aux groupes de l'espace (§ 3.3, point 1). Elle ne confère aucun droit.
- Invitations : préparer et instruire une demande d'appartenance scientifique, sans la conférer.
- Cycle de vie de l'espace : archivage, réouverture, clôture.
- Rattachements de projets : proposition, décision de la partie, fin.
- Prises en charge : proposition, acceptation, révocation.
- Paramétrage du circuit éditorial et de la politique de réplication, dans le plafond du MPD.

### 4.3 Métadonnées de gouvernance lisibles (liste fermée)

- Membres de l'espace, rôles et groupes, avec leurs membres.
- Règles d'accès et délégations : auteur, bénéficiaire, actions, dates, état, et **cible désignée par son identifiant et son type**, sans titre ni libellé (CC-30). **Sont exclues** les règles, embargos et interdictions qui portent sur un objet dont l'existence est protégée pour le lecteur.
- Existence et état des sélections, rattachements et prises en charge, sans leur contenu.
- Diffusions : date, canal, audience déclarée, nombre de destinataires, résultat ; jamais le contenu diffusé.
- Explication des accès (OB-24), **jamais** pour une cible dont l'existence est protégée pour le lecteur.
- Journaux de gouvernance, dans la même limite.

Les listes, compteurs et paginations sont calculés **après** exclusion : aucun total ne trahit un élément exclu.

**Jamais :** un contenu, une version, une preuve, une relation protégée, une représentation dérivée ; une métadonnée qui révélerait l'existence d'un objet protégé ; une délégation de contenu.

## 5. Rôles d'appartenance

Sur le contenu `projet` de l'espace, sous réserve des protections. Les objets `privé` ne relèvent que de leur titulaire et de ses délégations.

| Rôle | Actions par défaut | Pouvoir de délégation | Conféré par |
|---|---|---|---|
| propriétaire | aucune | aucun | Système (création, transfert) |
| administrateur | aucune | aucun | Propriétaire |
| responsable scientifique | voir, commenter, proposer, transcrire, éditer, valider, exporter, réutiliser | `repartager` de ces actions sur le contenu `projet` de l'espace, appartenance scientifique comprise | Système (création, transfert) ; un autre RS (nomination) |
| collaborateur | voir, commenter, proposer, transcrire, éditer | aucun | RS |
| lecteur | voir, commenter | aucun | RS |
| invité | aucune (délégations explicites seulement) | aucun | RS, sur invitation éventuellement préparée par un administrateur |

`contribuer au Core` n'est jamais une action par défaut. Les autres actions et `repartager` ne sont accordés que par délégation explicite.

**Nomination d'un responsable scientifique (Q4)** :
- elle est faite par un RS qui détient réellement les droits et pouvoirs délégables sur le périmètre ;
- elle porte **au plus** sur ce périmètre ;
- elle est **nominative**, **acceptée** par le nommé et **tracée** ;
- elle ne contourne aucune révocation ;
- elle ne donne aucun accès aux objets `privé` d'autrui ;
- seuls ses fondateurs peuvent la clore (§ 3.2).

## 6. Mécanismes

### 6.1 Règles d'accès

Une règle est une délégation (§ 3.2). Son auteur est figé. Un bénéficiaire `public` ne peut être désigné que par le titulaire (objet `privé`) ou par un RS (contenu `projet`), après une évaluation de diffusabilité favorable et sous les protections.

### 6.2 Visibilité et statut (arbitrage E-5)

Trois opérations distinctes :

| Opération | Qui | Conditions |
|---|---|---|
| **Modifier les données** | Détenteur d'`éditer` | Aucun effet sur l'audience ni sur la propriété. |
| **Élargir l'audience** (visibilité plus large) | Le titulaire (objet `privé`) ou un RS (contenu `projet`) | C'est un **partage** : `repartager` requis. Le passage à une visibilité communautaire ou publique exige une évaluation de diffusabilité favorable. Les protections s'appliquent. |
| **Réduire l'audience** (visibilité plus restreinte) | Le titulaire (objet `privé`) ou un RS (contenu `projet`) | Les **délégations explicites** déjà accordées sont maintenues : la réduction ne touche que l'audience par défaut. Les bénéficiaires dont l'accès par défaut disparaît sont notifiés. Une réduction ne peut pas servir à priver un RS ou un titulaire de ses droits, ni à contourner une obligation de conservation. |
| **Modifier le statut de propriété** (titulaire) | — | Uniquement par le transfert, voie (b), ou par la renonciation du titulaire. |

Un détenteur d'`éditer` sans `repartager` ne change pas la visibilité.

### 6.3 Sélections partagées, lots

- **Sélection partagée :**
  - une règle sur une sélection est une délégation sur le **manifeste actif** ;
  - son auteur détient l'action et son pouvoir de délégation sur chaque objet servi, à l'instant de l'évaluation ;
  - aucun accès si la sélection est `révoquée` ou `close` ;
  - modes d'inclusion : DI-L21 ;
  - une réduction de périmètre se calcule sur la **version active**, jamais sur une proposition en attente ; les ajouts proposés non confirmés ne sont jamais servis.
- **Lot :**
  - une délégation sur les objets listés, faite par un habilitant qui détient les actions et leur pouvoir de délégation ;
  - jamais `valider`, `administrer`, `repartager` ni publication ;
  - échéance obligatoire ;
  - ajouter un objet au lot n'étend pas la délégation, et rouvrir le lot ne la réactive pas (DD-23.4).
- **Archivage et clôture d'un espace** (CC-24) : ils ferment toute action d'écriture (éditer, transcrire, proposer, commenter, valider) et toute nouvelle délégation. Les droits de lecture existants sont conservés. Une réouverture rétablit les droits non expirés, mais ne réactive aucune délégation close entre-temps (A4).
- **Séries de publications** : insérer une publication dans une série d'un **autre** espace exige l'acceptation d'un détenteur d'`administrer` sur l'espace de la série (gouvernance éditoriale, DD-25). Avant l'acceptation, l'insertion n'occupe aucun rang.

### 6.4 Embargos et interdictions (arbitrage E-4)

- **Création** d'un embargo ou d'une interdiction, de contenu ou d'existence : **seulement** par le titulaire (objet `privé`) ou par un RS (contenu `projet`). Jamais par un administrateur, un collaborateur ou le propriétaire en tant que tel.
- **Créateur :** il est **bénéficiaire et gardien**.
- **Bénéficiaires** d'une protection d'existence (CC-25) : être bénéficiaire soustrait seulement à la protection ; cela **ne confère aucun droit de contenu**, et les droits ordinaires du bénéficiaire s'appliquent ensuite. Les bénéficiaires sont :
  - ajoutés par un gardien, jamais par soi-même ;
  - pour un groupe bénéficiaire, l'accord d'un gardien est requis pour chaque nouveau membre (§ 3.3, point 3).
- **Destinataires** d'une interdiction : les acteurs à qui elle s'applique. Une **interdiction d'existence** cache l'objet à ses destinataires. Un **embargo d'existence** cache l'objet à **tous sauf** ses bénéficiaires.
- **Gardiens :**
  - un gardien est toujours bénéficiaire ;
  - à défaut de gardien désigné, le gardien d'office, qui devient alors bénéficiaire, est le titulaire (objet `privé`) ou un RS (contenu `projet`) ;
  - un gardien n'acquiert aucun droit de contenu au-delà des siens.
  - un gardien qui perd tout droit sur l'objet (départ de l'espace, transfert, révocation) **cesse d'être gardien** et bénéficiaire, sauf s'il en reste bénéficiaire par une autre désignation explicite ;
- **Levée :** par un gardien seulement. Sans aucun gardien : désignation d'un nouveau gardien par l'autorité de dérogation (§ 3.5.1).
- **Restriction légale :** § 3.5.5.

### 6.5 Unicités

Aucune règle d'unicité ne s'applique à des éléments dont la visibilité diffère pour les acteurs qui peuvent tenter une création concurrente (TI-11). Une base justificative de portée `privée` est unique **par auteur** ; de portée `projet`, elle est unique par espace et visible de tous ses membres. Une violation d'unicité ne révèle jamais un élément invisible au demandeur.

### 6.6 Contributions

Écrire (commenter, proposer, transcrire, contribuer) exige l'action correspondante, quel qu'en soit le fondement, sélection comprise. Une contribution hors ligne n'est reçue que si son auteur détenait l'action lors de l'opération locale. Elle est réévaluée à l'intégration (CP-27).

## 7. Évaluation d'un accès

Pour un contexte (acteur, audience, instant, opération) et une cible :

| Étape | Contrôle | Issue |
|---|---|---|
| 0 | **Protections non levables** | Elles s'appliquent ; aucune dérogation ne les franchit. |
| 1 | **Dérogation** active, couvrant la cible, l'opération et la finalité | Si oui, accès limité à son périmètre, à ses opérations et à sa durée, journalisé ; passer à l'étape 7. |
| 2 | **Protections d'existence** : embargo d'existence (l'acteur n'est pas bénéficiaire), interdiction d'existence (l'acteur en est destinataire), cloisonnement temporaire (lecture aveugle ; campagne en phase indépendante, où une participation exige un acteur identifié) | La cible n'existe pas pour ce contexte : refus indistinguable d'une absence. |
| 3 | **Protections de contenu** pour l'action demandée | Refus. |
| 4 | **Droits** : titulaire ; rôle (§ 5) ; délégations et admissions dont au moins un fondement est valide, avec une chaîne enracinée | Si l'un d'eux accorde : accord, passer à l'étape 7. |
| 5 | **Visibilité par défaut** de la cible (communauté, public) | Si elle accorde : accord, passer à l'étape 7. |
| 6 | — | **Refus.** |
| 7 | **Rendu** | Embargos de contenu partiels, masquages, modes d'inclusion (DI-L21), protection DI-E05. |

En cas d'échec de vérification, à n'importe quelle étape : refus indistinguable d'une absence (A6).

## 8. Arbitrages intégrés

| # | Arbitrage | Clauses |
|---|---|---|
| Q1, D-1 | Trois voies pour les objets `privé` du cédant ; blocage plutôt qu'invisibilité ; copie autonome sans déplacement de l'original | § 3.4.6 |
| Q2, E-7 | Restrictions légales : référence structurée, autorité qualifiée, pas d'auto-désignation, contestation | § 3.5.5 |
| Q3, D-3, E-6 | Dérogation : deux approbateurs indépendants dès qu'une protection est franchie ; opérations fermées ; durée plafonnée (candidate) ; résidu de fraude d'identité documenté | § 3.5 |
| Q4 | Nomination d'un RS par un pair | § 5 |
| D-4 | Échéance hors ligne pour toute donnée protégée ou révocable | § 2 (hors ligne) |
| E-1 | Nul n'augmente ses propres droits ni son pouvoir de délégation | A3 ; § 3.2 |
| E-2 | Appartenance, admission aux droits et admission à une protection distinguées ; `notification` = autorisation anticipée de l'habilitant | § 3.3 |
| E-3 | Propriétaire unique, administratif ; transfert par le propriétaire RS ; espace préparé pour un tiers ; succession hors moteur | § 3.4.1, § 3.4.2, § 4.1 |
| E-4 | Interdictions : même autorité que les embargos | § 6.4 |
| E-5 | Modifier, élargir, réduire, changer de propriété : quatre opérations distinctes | § 6.2 |
| E-8 | Vue du cessionnaire et représentation scellée | § 3.4.3 |
| CC-20 | Pas de `valider` pour le titulaire ; validation personnelle distincte | § 3.1 |
| CC-28 | Réintégration du cédant : accord du propriétaire | § 3.4.7 |

**Ajouts de l’auteur, non arbitrés, soumis à la validation du porteur :**
- règles de **départ d’un habilitant** (§ 3.2) : présentation et confirmation avant un départ volontaire ; la racine ne part que par transfert ou clôture. Sans elles, la règle de dépendance ferait tomber toute l’équipe au départ de celui qui l’a constituée ;
- **perte de la qualité de gardien** et **gardien désignable** (§ 6.4, § 3.5.1) ;
- **droit de créer** un objet (§ 3.1) ;
- **sort imposé à la renonciation** (§ 3.1) ;
- effet de l’**archivage** sur les droits (§ 6.3) ;
- **unicités** (§ 6.5).

**Limites assumées :**
- fraude d'identité entre approbateurs (§ 3.5.3) ;
- résidu hors ligne borné par l'échéance (§ 2) ;
- plafonds (durée de dérogation, échéance hors ligne, expiration d'une présentation) à fixer au MPD.
