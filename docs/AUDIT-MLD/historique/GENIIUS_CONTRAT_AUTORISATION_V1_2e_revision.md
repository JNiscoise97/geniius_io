# GENIIUS — Contrat d'autorisation

**Version :** V1 révisée (2e révision) — **candidat** (10 octobre 2026). Révisions : arbitrages Q1 à Q4, puis D-1 à D-4 et quatre corrections du porteur (S-35, S-45, S-46, S-67/S-68) ; contradictions relevées (rapport : [AUDIT-MLD/RAPPORT_COHERENCE_CONTRAT_BATTERIE_V1_1.md](AUDIT-MLD/RAPPORT_COHERENCE_CONTRAT_BATTERIE_V1_1.md)). **Non gelé.** À valider par le porteur avec la batterie de scénarios, avant toute réécriture du MLD.
**Origine :** décision du porteur du 10/10/2026 (proposition A), après deux audits du MLD V1.1 ([audit](AUDIT-MLD/AUDIT_CONTRADICTOIRE_MLD_V1_1.md), [contre-audit](AUDIT-MLD/CONTRE_AUDIT_MLD_V1_1_D.md)).
**Statut normatif :** une fois validé, ce contrat **prime** sur toute règle d'accès du dictionnaire et du MLD.
- Le dictionnaire le reprend comme décision DD-28, qui remplace la DD-28 du 10/10/2026.
- Les contraintes d'accès du MLD (CP-23 à CP-26, CP-29, CP-30, CP-37, CP-46, CP-48) seront réécrites comme ses conséquences, et les textes remplacés seront retirés.

**Batterie de recette :** [GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_1.md](AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_2.md) (candidate, 93 scénarios ; V1 et V1.1 remplacées). Les résultats attendus y sont fixés avant la réécriture.

---

## 1. Vocabulaire

| Terme | Définition |
|---|---|
| **Droit d'opération** | Faculté, pour un acteur, d'exécuter une action (D-10 : `voir`, `commenter`, `proposer`, `transcrire`, `éditer`, `valider`, `exporter`, `réutiliser`, `contribuer au Core`) sur un **périmètre**. |
| **Périmètre** | Ensemble délimité de cibles : un objet ; un lien ; les objets d'un espace d'une visibilité donnée (`projet`, `famille`…) ; le manifeste actif d'une sélection ; les objets listés d'un lot. Un périmètre n'est jamais « tout ce qui sera ajouté plus tard » (P24). |
| **Pouvoir de délégation** | Faculté d'accorder à autrui un droit d'opération. Il est **distinct** du droit lui-même : détenir `voir` ne permet pas de faire voir. Il se note `déléguer(a)` pour une action *a*. L'action D-10 `repartager` en est l'expression. |
| **Pouvoir de gouvernance** | `administrer` : faculté d'exécuter les opérations de gouvernance listées au § 4, et de lire les seules métadonnées nécessaires à ces opérations. N'est ni un droit d'opération sur le contenu, ni un pouvoir de délégation de contenu. |
| **Fondement** | Origine d'un droit ou d'un pouvoir : attribution initiale par le système (§ 3.1), délégation (§ 3.2), transfert de gouvernance (§ 3.3), dérogation prédéfinie (§ 3.4). Un droit sans fondement valide n'est pas effectif. |
| **Chaîne d'autorisation** | Suite des fondements qui relie un droit à une attribution initiale. |
| **Protection opposable** | Restriction qui s'applique avant toute autorisation : existence protégée, embargo, consentement refusé ou retiré, protection des personnes vivantes et des mineurs (DI-E05), purge et effacement légal. |
| **Titulaire** | Acteur qui reçoit, par attribution initiale du système, les droits sur un objet `privé` qu'il crée (§ 3.1). Il n'est pas le « propriétaire » administratif de l'espace. |

## 2. Principes (validés le 10/10/2026)

**A1 — Nul ne donne ce qu'il n'a pas.**
- Toute délégation d'un droit d'opération exige que l'habilitant détienne, **au moment de l'acte et à chaque évaluation**, ce droit **et** le pouvoir de le déléguer (`déléguer(a)`), sur un périmètre au moins aussi large.
- Une délégation n'augmente jamais les prérogatives de sa chaîne : action, périmètre et durée accordés sont inférieurs ou égaux à ceux de l'habilitant.
- Un simple détenteur d'un droit, sans pouvoir de délégation, ne peut transformer sa permission personnelle en autorisation pour autrui, individu ou groupe.

**A2 — Gérer n'est pas lire.**
- `administrer` permet les opérations de gouvernance explicitement prévues (§ 4) et la lecture des seules métadonnées nécessaires.
- Il ne confère aucun droit implicite sur les contenus scientifiques, leurs versions, leurs preuves, leurs relations protégées ou leurs représentations dérivées.
- Il ne confère **aucun pouvoir de délégation** de contenu : créer ou modifier une règle d'accès sur un contenu exige le pouvoir de délégation correspondant (A1), indépendamment d'`administrer`.

**A3 — Aucune auto-attribution.**
- Aucun acteur n'augmente ses propres droits ou pouvoirs par un acte dont il est l'auteur, que ce soit par une règle, une appartenance, l'ajout à un groupe, une admission, un embargo dont il serait bénéficiaire, une règle de titulaire ou une désignation.
- Seul le système établit des droits initiaux, selon une procédure de création prédéfinie (§ 3.1), non réutilisable après coup.
- Un acte de délégation est toujours fait par un acteur différent du bénéficiaire, ou d'un membre du groupe bénéficiaire.

**A4 — Pas de résurrection des droits.** Admission, prolongation, transfert, réouverture d'un lot ou d'un projet, restauration et réimport ne réactivent jamais une autorisation révoquée ou expirée. Seul un nouvel acte de délégation, conforme à A1 et A3, crée un nouveau droit.

**A5 — Les protections priment.**
- Les protections opposables s'appliquent avant toute autorisation, administrateurs compris.
- Il n'existe **aucun droit générique de contournement**.
- La seule dérogation est la procédure prédéfinie du § 3.4 : fondement explicite, portée limitée, durée bornée, traçabilité renforcée.
- Certaines protections légales ne peuvent être levées par aucune décision interne (§ 3.4).

**A6 — Révocation et cohérence.** CP-28 (réplication hors ligne) et CP-40 (évaluation, caches, opérations longues, refus en cas d'échec) sont maintenues et s'appliquent à tout droit issu de ce contrat. **Précision D-4 (porteur, 10/10/2026)** : toute réplique hors ligne qui contient des données protégées, ou soumises à une autorisation révocable, porte une **échéance locale opposable**, y compris dans un espace à membre unique. Seuls les contenus véritablement publics et librement redistribuables peuvent en être dispensés. Le contrat ne présume jamais qu'une révocation distante efface immédiatement les données d'un appareil déconnecté : le résidu est borné par l'échéance locale, et le retrait a lieu à la prochaine synchronisation effective.

## 3. Fondements des droits

### 3.1 Attribution initiale par le système (contrat de création)

Le système, et lui seul, attribue des droits initiaux, dans la transaction de création, selon trois procédures fermées.

| Procédure | Droits attribués | Conditions |
|---|---|---|
| **Création d'un espace** | Au créateur : `administrer` sur l'espace ; appartenance `responsable scientifique`, qui porte les droits et pouvoirs du § 5 sur le contenu de l'espace. | Une seule fois, à la création. Non rejouable. |
| **Création d'un objet `privé`** | Au **titulaire** : `voir`, `commenter`, `proposer`, `éditer`, `exporter`, `réutiliser` sur l’objet, et le pouvoir de déléguer chacune de ces actions (`repartager`). | Titulaire = acteur réalisateur (activité manuelle ou assistée), ou déposant identifiable des entrées s'il en détient les droits (activité automatique, import). Sans titulaire : aucun droit personnel (DI-A39). |
| **Création d'un objet d'une autre visibilité** | Aucun droit nominatif : l'objet est régi par la visibilité par défaut (§ 5) et par les règles existantes. | — |

Un droit de titulaire :
- n’est jamais créé par un acteur, ni prolongé, ni modifié ; il n’est transféré que par l’opération distincte et explicitement acceptée du § 3.3.6, voie (b), et jamais par une règle ;
- s'éteint par la purge de l'objet, la renonciation du titulaire, ou dans le cas du § 3.3 ;
- ne bénéficie jamais à un acteur qui n'a, sur l'espace, qu'un pouvoir de gouvernance, sauf s'il est lui-même réalisateur ou déposant des entrées **et** qu'il détient les droits sur ces entrées.

### 3.2 Délégation

Une délégation est un acte par lequel un **habilitant** accorde à un **bénéficiaire** (acteur, groupe, rôle d'appartenance d'un espace) une ou plusieurs actions sur un périmètre, pour une durée et sous des conditions. Formes :
- règle d'accès ;
- appartenance scientifique ;
- ajout d'un membre à un groupe bénéficiaire de droits ;
- admission ;
- délégation de lot ;
- règle sur une sélection ;
- ajout d'un bénéficiaire d'embargo.

**Conditions (toutes requises) :**
1. L'habilitant détient chaque action accordée et `déléguer` de cette action sur un périmètre qui couvre celui accordé (A1).
2. L'habilitant n'est ni le bénéficiaire, ni membre du groupe bénéficiaire, ni titulaire du rôle bénéficiaire dans l'espace visé (A3).
3. La durée accordée ne dépasse pas celle des droits de l'habilitant, s'ils sont bornés.
4. Le pouvoir de délégation n'est transmis que s'il est accordé explicitement (`repartager`), et lui-même borné par A1. Une délégation sans `repartager` ne permet pas de redéléguer.
5. Aucune protection opposable ne s'y oppose.

**Dépendance.**
- Un droit délégué n'est effectif que tant qu'**au moins un** de ses fondements reste valide : l'habilitant d'origine, ou un habilitant ultérieur ayant confirmé ou prolongé l'acte en remplissant lui-même les conditions 1 à 3.
- Si tous les fondements disparaissent, le droit cesse, sans acte supplémentaire.
- La profondeur de la chaîne est bornée (CP-40) ; un cycle de délégation est refusé.

**Actes sur une délégation existante (A4).** La prolongation, la confirmation, la restriction, l'admission d'un membre et la clôture sont des actes **sur** la délégation, qui garde son identité.
- Prolonger ou admettre exige les conditions 1 à 3, et ajoute l'acteur aux fondements de la délégation.
- Restreindre ou clore est ouvert à tout fondateur de la délégation, ainsi qu'au titulaire ou au responsable scientifique du périmètre.
- Aucun de ces actes ne réactive une délégation close ou expirée.

### 3.3 Transfert de gouvernance

Le transfert n'est **pas** une délégation ordinaire. C'est une procédure explicite :
1. **Autorité de transfert :** un détenteur d'`administrer` sur l'espace, qui est aussi `responsable scientifique`, ou le créateur pour un espace préparé pour un tiers.
2. **Présentation** des engagements. Elle comprend :
   - les règles, sélections, rattachements, groupes et leurs membres, appartenances, admissions, embargos et leurs bénéficiaires, y compris les audiences des rôles d'autres espaces ;
   - la **liste des délégations à réémettre** (point 5) ;
   - le **sort de chaque objet `privé` du cédant** dans l'espace (point 6).

   Ces éléments sont désignés par la version de leur propriétaire, et une empreinte est calculée sur l'ensemble. Toute modification substantielle avant l'acceptation impose une nouvelle présentation.
3. **Acceptation** par le bénéficiaire vérifié, contre l'empreinte. Elle est **refusée** tant qu'un objet `privé` du cédant reste sans sort retenu, ou en blocage (point 6).
4. **Attribution par le système**, dans la transaction d'acceptation :
   - le cessionnaire reçoit `administrer` et `responsable scientifique` sur l'espace ;
   - toutes les appartenances, appartenances à des groupes de l'espace, qualités de bénéficiaire d'embargo, règles dont il est bénéficiaire nominatif et droits de titulaire du cédant sur l’espace **s’éteignent**, à l’exception des droits de titulaire transférés au cessionnaire par la voie (b) du point 6, et seulement eux.
5. **Aucune règle nominative n'est transférée.** Les délégations accordées par des tiers au cédant s'éteignent avec lui. Les interdictions ne sont jamais transférées.

   Les délégations accordées **par** le cédant perdent ce fondement. Elles ne survivent que si le cessionnaire les **réémet**, aux conditions suivantes :
   - **Annoncée :** chaque délégation à réémettre figure, nominativement, dans la présentation (point 2), avec son bénéficiaire, son périmètre, ses actions et son échéance.
   - **À l'identique ou plus étroite :** la réémission ne peut ni élargir le périmètre, ni ajouter d'action, ni allonger l'échéance par rapport à ce qui a été présenté ; elle peut seulement les restreindre.
   - **Conforme à A1 :** elle est vérifiée sur les droits **effectivement attribués au cessionnaire** au point 4 (contenu `projet` de l'espace, et objets `privé` reçus par la voie (b) du point 6). Une délégation portant sur des objets que le cessionnaire ne détient pas (par exemple un objet `privé` conservé ou extrait par le cédant) **ne peut pas** être réémise.
   - **Sans résurrection (A4) :** une délégation déjà expirée ou révoquée à l'instant de l'acceptation n'est pas réémise.
   - **Identité (correction S-35, porteur, 10/10/2026) :** une réémission crée une **nouvelle délégation**, avec sa propre identité, le cessionnaire pour habilitant et auteur, et la date de l'acceptation. Elle porte un lien explicite (« réémission de ») vers la délégation d'origine. L'auteur historique de la délégation d'origine n'est **jamais réécrit** ; la délégation d'origine est close à la même date. L'effet est continu pour le bénéficiaire, sans interruption, mais l'origine reste distincte et traçable. Les admissions qui dépendaient de la délégation d'origine ne sont reprises, comme admissions de la nouvelle délégation, que si elles figurent dans la présentation.
   - **Silence :** une délégation présentée mais non réémise s'éteint ; aucune n'est réémise implicitement.
6. **Objets `privé` du cédant dans l'espace (arbitrage Q1 du porteur, 10/10/2026).** Avant la présentation, le cédant choisit, objet par objet ou en bloc, l'une des trois voies suivantes. Le choix est figé dans la présentation.
   - **(a) Versement à l'espace :** l'objet reçoit une visibilité autorisée de l'espace (`projet`, `famille`…) et devient un contenu de l'espace, accessible au cessionnaire par son rôle. Sa provenance et la paternité scientifique du cédant (`activite`, `credit`) sont conservées ; seul son régime d'accès change, par une nouvelle version.
   - **(b) Transfert au bénéficiaire :** l'objet reste `privé` et le droit de titulaire passe au cessionnaire, par une **opération distincte**, explicitement acceptée objet par objet ou en bloc. Elle est soumise aux droits et protections applicables (embargos, consentements, DI-E05). Le cédant perd son droit de titulaire ; sa paternité scientifique est conservée.
   - **(c) Conservation par le cédant :** le cédant crée, dans son espace personnel, une **copie autonome** liée à l'original par une `FILIATION` documentée (provenance, version d'origine, licence), si la licence et les protections le permettent (embargo, consentement, DI-E05 : une copie ne fait jamais sortir une donnée protégée de son régime). L'original ne quitte jamais l'espace transféré : un objet ne change pas d'espace (DI-A01). L'original suit donc lui aussi la voie (a), la voie (b), ou une purge **légalement autorisée**, demandée explicitement par son titulaire avant la présentation (arbitrage D-1 : l’original ne change jamais d’espace).
   - **Blocage :** un objet qui ne peut suivre aucune voie (protection qui interdit le versement et le transfert, licence qui interdit la copie, titulaire indisponible) est signalé comme **blocage de transfert**. Le transfert ne peut pas être accepté tant que le blocage n'est pas résolu. Aucun objet n'est rendu invisible à tous par défaut.
7. **Atomicité (correction S-67, S-68, porteur, 10/10/2026).** L'acceptation est **une seule transaction**. Elle comprend :
   - l'attribution de la gouvernance au cessionnaire ;
   - les versements de la voie (a) ;
   - les changements de titulaire de la voie (b) ;
   - les copies et filiations de la voie (c) ;
   - les réémissions ;
   - l'extinction des droits du cédant.

   Toutes les conditions sont vérifiées **dans** cette transaction : empreinte, sort de chaque objet, protections applicables aux versements, transferts et copies, A1 pour les réémissions. Si une seule échoue, **rien n'est appliqué** : aucun transfert partiel, aucun changement de titulaire isolé, aucune copie orpheline, aucune extinction anticipée. Le transfert reste à l'état `proposé`, et la cause est signalée.
8. Seuls les crédits et activités du cédant subsistent (DD-26.4).

### 3.4 Dérogation prédéfinie (habilitation exceptionnelle)

- **Autorité de dérogation :** un rôle de plateforme désigné (ST-15), distinct de toute appartenance à l'espace concerné.
- **Deux opérations distinctes (correction S-46, porteur, 10/10/2026) :**
  - **Accès exceptionnel** : consulter ou traiter un contenu protégé pour une finalité déclarée, pendant une durée bornée. La protection sous-jacente (règle, embargo) **reste en place**. Autorité : l'autorité de dérogation, selon les règles d'approbation ci-dessous.
  - **Levée durable d'une protection** : supprimer ou réduire la protection elle-même. Autorité : celle de la protection, jamais la dérogation.
    - Embargo interne : un **gardien** (§ 6).
    - Règle d'interdiction : son auteur ou un fondateur (§ 3.2).
    - Restriction légale : l'autorité compétente désignée.

    Lorsqu'un embargo interne n'a plus aucun gardien, l'autorité de dérogation peut seulement **désigner un nouveau gardien** (le titulaire de l'objet, à défaut un responsable scientifique de l'espace), avec deux approbateurs ; c'est ce gardien qui décide ensuite de la levée.
- **Approbation (arbitrage Q3 du porteur, 10/10/2026 ; remplace la règle générale « deux personnes » de la version précédente) :**
  - **Dérogation qui franchit une protection d'existence** (règle ou embargo interne d'existence), et désignation d'un gardien : **deux approbateurs** de l'autorité de dérogation, **indépendants** (arbitrage D-3, porteur, 10/10/2026) :
    - deux acteurs humains distincts (`nature_acteur = personne`) ;
    - une identité suffisamment vérifiée (niveau de vérification renforcé) ;
    - des comptes distincts, sans compte commun ;
    - aucun conflit d'intérêts déclaré pour le dossier : pas de lien d'intérêt avec l'objet ou l'espace, pas de subordination déclarée entre eux ;
    - aucun des deux bénéficiaire.

    Le modèle ne prétend pas garantir absolument l'absence de fraude d'identité (deux identités vérifiées contrôlées par une même personne) : c'est un **résidu documenté**, traité par la vérification d'identité et l'audit des journaux.
  - **Autre dérogation** (accès à un contenu non protégé en existence) : **un seul approbateur** suffit lorsque la procédure applicable le permet, avec justification, durée limitée et journalisation.
  - Dans tous les cas, **aucun approbateur n'est bénéficiaire** de la dérogation, et aucun ne l'accorde à lui-même.
- **Forme :** nominative ; finalité et fondement explicites (mandat, demande du titulaire, décision de justice…) ; périmètre limité aux objets nécessaires ; durée bornée ; journalisation de chaque usage, renforcée pour une dérogation d'existence.
- **Portée :** un accès exceptionnel peut franchir une existence protégée par une règle ou un embargo **interne**, uniquement pour la finalité déclarée, pendant sa durée. Il ne lève jamais la protection : à son échéance, la protection s'applique de nouveau à l'identique. *[Révisé : la version précédente citait la levée d'un embargo comme exemple de dérogation.]*
- **Protections non levables par une décision interne :**
  - consentement refusé ou retiré ;
  - purge et effacement légal ;
  - **restriction légale** (arbitrage Q2 du porteur, 10/10/2026). Un embargo ou une restriction fondés sur une obligation légale portent une **référence structurée au fondement légal**, et non un simple indicateur :
    - nature de la restriction ;
    - fondement documenté (texte, décision, acte) ;
    - portée ;
    - période de validité ;
    - **autorité compétente pour la lever**.

    L'existence même de ces métadonnées peut être protégée. Seule l'autorité compétente désignée, par une décision enregistrée comme fondement, peut lever la restriction ou ouvrir l'accès, dans les limites de sa décision. **Aucune dérogation interne ne lève une restriction légale.**
- Une dérogation ne crée jamais de pouvoir de délégation.

## 4. Pouvoir de gouvernance (`administrer`)

**Opérations permises :**
- appartenances administratives (attribution, fin), jamais à soi-même ;
- cycle de vie de l'espace (archivage, réouverture, clôture) ;
- invitations : préparer et instruire une demande d'appartenance scientifique, sans la conférer (D1) ;
- rattachements de projets : proposition, décision de la partie, fin ;
- prises en charge : proposition, acceptation, révocation ;
- circuit éditorial de l'espace : paramétrage ;
- politique de réplication de l'espace ;
- transfert de gouvernance (§ 3.3, avec la condition de cumul).

**Métadonnées lisibles :**
- membres et rôles ;
- existence, auteur, bénéficiaires, dates et état des règles d’accès, **à l’exclusion** des règles d’existence et des embargos qui portent sur un objet dont l’existence est protégée pour l’administrateur : leur simple présence révélerait qu’un objet caché existe. *[Révisé : la version précédente listait ces règles « sans leur cible ».]* ;
- existence et état des sélections, rattachements, prises en charge et diffusions ;
- explication des accès (OB-24) ;
- journaux de gouvernance.

**Jamais :**
- un contenu, une version, une preuve, une relation protégée ou une représentation dérivée ;
- une métadonnée qui révélerait l'existence d'un objet protégé (titre, libellé, cible d'une règle d'existence) ;
- la création, la modification ou la prolongation d'une délégation de contenu sans le pouvoir de délégation correspondant (A1, A2).

## 5. Rôles d'appartenance : droits et pouvoirs par défaut

Sur les objets de visibilité `projet` de l'espace, sous réserve des protections. Les objets `privé` ne sont régis que par leur titulaire et ses délégations.

| Rôle | Droits d'opération par défaut | Pouvoir de délégation par défaut | Conféré par |
|---|---|---|---|
| propriétaire, administrateur | aucun | aucun | Système (création, transfert) ; détenteur d'`administrer`, jamais à soi-même |
| responsable scientifique | voir, commenter, proposer, transcrire, éditer, valider, exporter, réutiliser | `déléguer` de ces actions (`repartager`) sur le contenu `projet` de l’espace, y compris l’appartenance scientifique de rang inférieur ou égal | Système (création, transfert) ; un autre responsable scientifique |
| collaborateur | voir, commenter, proposer, transcrire, éditer | aucun | Responsable scientifique |
| lecteur | voir, commenter | aucun | Responsable scientifique |
| invité | aucun (délégations explicites seulement) | aucun | Responsable scientifique (invitation préparée par un administrateur) |

Hors titulaire et responsable scientifique, `exporter`, `réutiliser`, `repartager` et `contribuer au Core` ne sont jamais des droits par défaut : ils sont délégués explicitement, sous A1. `contribuer au Core` n’est jamais un droit par défaut, pour personne (DI-B14, DI-L06).

**Nomination d’un responsable scientifique (arbitrage Q4 du porteur, 10/10/2026).** Un responsable scientifique peut en nommer un autre (délégation de même rang), aux conditions suivantes :
- il détient réellement les droits et pouvoirs délégables sur le périmètre visé ; la nomination porte **au plus** sur ce périmètre ;
- la nomination est **nominative**, **acceptée** par le nommé et **tracée** (auteur, date, périmètre) ;
- elle ne contourne aucune révocation : si l’habilitant perd son rôle, la nomination perd ce fondement (§ 3.2), sauf fondement indépendant ;
- les droits attachés au **rôle** (contenu `projet`) sont distincts des droits **privés** de son titulaire : nommer un responsable scientifique ne donne aucun accès aux objets `privé` d’autres chercheurs, ni au nommé, ni par le nommé.

## 6. Application aux mécanismes

| Mécanisme | Règle issue du contrat |
|---|---|
| **Groupes** | La gouvernance d’un groupe (création, nom, membres d’un groupe **sans aucun droit de contenu**) relève d’`administrer`. Dès qu’un groupe bénéficie d’un droit de contenu, **ajouter un membre** est une délégation de chacun de ces droits : l’ajouteur doit détenir, pour **tous**, le droit et son pouvoir de délégation (A1). Sinon, l’ajout est **refusé** ; aucune appartenance « sans effet » n’est créée, ce qui évite les membres apparents sans droit. *[Révisé : la version précédente admettait un ajout qui ne transmettait que les droits couverts.]* Jamais à soi-même (A3). Un groupe extérieur (programme) suit les modes d'admission (DD-22), chaque admission étant une délégation par un habilitant de l'espace porteur. |
| **Règles d'accès** | Une règle est une délégation (§ 3.2). Son auteur est figé ; ses fondements s'enrichissent des actes de prolongation ou d'admission conformes. Bénéficiaire `public` : seulement par le titulaire, ou par un responsable scientifique pour un contenu `projet`, et toujours sous les protections. |
| **Sélections partagées** | Une règle sur une sélection est une délégation sur le périmètre « manifeste actif ». L'auteur détient `voir` et `déléguer(voir)` (ou `réutiliser` et `déléguer(réutiliser)`) sur chaque objet servi, à l'instant de l'évaluation. Aucun accès si la sélection est `révoquée` ou `close`. |
| **Délégation de lot** | Délégation sur les objets listés du lot, par un habilitant qui détient les actions et leur pouvoir de délégation. |
| **Embargos** | Création : **seulement** le titulaire de l’objet (objet `privé`), ou un responsable scientifique (contenu `projet`) ; toute autre création est refusée. Le créateur est bénéficiaire et gardien d’office. Bénéficiaires : ajoutés par le créateur ou un gardien, jamais à soi-même. Au moins un bénéficiaire **gardien** détient le pouvoir de délégation sur l’objet ; à défaut, le gardien d’office est **le titulaire** pour un objet `privé`, et **le responsable scientifique** pour un contenu `projet`. Un gardien peut lever l’embargo, mais n’acquiert aucun droit sur le contenu au-delà des siens. *[Révisé : la version précédente faisait du responsable scientifique le gardien d’office de tout objet, objets `privé` d’autrui compris, contrairement à Q4.]* Une **restriction légale** (§ 3.4) ne se lève que par l’autorité compétente désignée. Levée durable : un gardien seulement. Si aucun gardien n’existe plus, l’autorité de dérogation désigne un nouveau gardien (§ 3.4), qui décide ensuite ; la dérogation ne lève jamais elle-même un embargo. *[Révisé, correction S-46.]* Un administrateur n'est jamais bénéficiaire du fait de son rôle. |
| **Transfert** | § 3.3. |
| **Habilitation exceptionnelle** | § 3.4. |
| **Contributions** | Écrire (commenter, proposer, transcrire, contribuer) exige le droit correspondant, quel qu'en soit le fondement, sélection comprise. Une contribution hors ligne est reçue si son auteur détenait ce droit lors de l'opération locale, et réévaluée à l'intégration (CP-27). |
| **Hors ligne (D-4)** | Une réplique qui contient des données protégées, ou soumises à une autorisation révocable, a une échéance locale opposable, quel que soit le nombre de membres de l'espace. Un contenu public et librement redistribuable peut en être dispensé. Une réplique sans échéance ne peut contenir aucune donnée protégée ou révocable. Le retrait a lieu à la synchronisation effective (A6, CP-28, à réviser au MLD). |

## 7. Évaluation d'un accès

Pour un contexte (acteur, audience, instant, opération) et une cible :
0. **Protections non levables** (consentement refusé ou retiré, purge, effacement légal, restriction légale) : elles s’appliquent en premier ; aucune dérogation interne ne les franchit. *[Révisé : la version précédente plaçait la dérogation avant toute protection.]*
1. **Dérogation** : une dérogation active du § 3.4 couvre-t-elle la cible et l’opération ? Si oui, appliquer sa portée, limitée à sa finalité, journaliser, puis passer à l’étape 6.
2. **Protections opposables** : existence protégée par une règle ou un embargo dont l'acteur n'est pas bénéficiaire, cloisonnements temporaires (lecture aveugle, campagne indépendante) → la cible n'existe pas pour ce contexte.
3. **Interdictions** actives pour l'action → refus.
4. **Droits** :
   - droits de titulaire (§ 3.1) ;
   - droits par défaut du rôle (§ 5) ;
   - délégations dont au moins un fondement est valide **à cet instant**, chaîne vérifiée récursivement et bornée, et dont l'auteur ou le fondateur détient encore l'action et son pouvoir de délégation.

   Au moins un → accord, sinon refus.
5. **Visibilité par défaut** pour les visibilités communautaires et publiques.
6. **Rendu** : embargos de portée partielle, masquages, modes d'inclusion des sélections (DI-L21), protection DI-E05.

**Échec de vérification** → refus, indistinguable d'une absence (CP-40). La décision est mise en cache sous les conditions de CP-40.

## 8. Arbitrages du porteur intégrés (10/10/2026) : Q1 à Q4, D-1 à D-4

| # | Question | Arbitrage | Intégration |
|---|---|---|---|
| Q1 | Objets `privé` du cédant lors d'un transfert | **Modifié.** Trois voies explicites, choisies objet par objet ou en bloc avant l'acceptation et figées dans la présentation : (a) versement à l'espace ; (b) transfert au bénéficiaire par une opération distincte et acceptée ; (c) copie autonome du cédant, avec filiation. Un objet sans voie possible bloque le transfert ; aucun objet n'est rendu invisible par défaut. | § 3.3, points 2, 3 et 6 ; § 3.1 |
| Q2 | Embargos et restrictions légales | **Validé**, avec une référence structurée au fondement légal (nature, fondement documenté, portée, période, autorité compétente pour la levée), dont l'existence peut être protégée. Aucune dérogation interne. | § 3.4 ; § 6 (embargos) ; § 7, étape 0 |
| Q3 | Dérogations exceptionnelles | **Modifié.** Deux approbateurs distincts et indépendants pour toute dérogation qui franchit une protection d'existence ; un seul, si la procédure le permet, pour les autres. Aucun approbateur bénéficiaire ; pas deux comptes d'une même personne. | § 3.4 (la règle générale « deux personnes » est remplacée) |
| Q4 | Nomination d'un responsable scientifique par un pair | **Validé sous conditions** : pouvoir réellement détenu, périmètre au plus égal, nomination nominative, acceptée et tracée, sans contournement de révocation, sans accès aux objets `privé` d'autrui. | § 5 |

| D-1 | Voie (c) de Q1 | **Approuvé** : l’original ne change jamais d’espace ; copie autonome avec filiation ; l’original suit (a), (b) ou une purge légalement autorisée. | § 3.3.6 (c) |
| D-2 | Dérogation ordinaire | **Approuvé** : à tester positivement et négativement. | Batterie (S-70, S-71) |
| D-3 | Indépendance des approbateurs | **Approuvé sous conditions** : humains distincts, identité vérifiée, comptes distincts, aucun conflit d’intérêts, aucun bénéficiaire ; pas de garantie absolue contre la fraude d’identité (résidu documenté). | § 3.4 |
| D-4 | Hors ligne | **Seuil de deux membres rejeté.** Échéance locale opposable pour toute réplique contenant des données protégées ou révocables, y compris en espace à membre unique ; dispense possible pour le contenu public librement redistribuable. | A6 ; § 6 (hors ligne) |

Les corrections de cohérence faites lors de ces révisions sont signalées dans le texte par la mention *[Révisé : …]* et détaillées dans le rapport de cohérence.
