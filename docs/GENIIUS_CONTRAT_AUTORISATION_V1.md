# GENIIUS — Contrat d'autorisation

**Version :** V1 — **candidat** (10 octobre 2026). À valider par le porteur avec la batterie de scénarios, avant toute réécriture du MLD.
**Origine :** décision du porteur du 10/10/2026 (proposition A), après deux audits du MLD V1.1 ([audit](AUDIT-MLD/AUDIT_CONTRADICTOIRE_MLD_V1_1.md), [contre-audit](AUDIT-MLD/CONTRE_AUDIT_MLD_V1_1_D.md)).
**Statut normatif :** une fois validé, ce contrat **prime** sur toute règle d'accès du dictionnaire et du MLD.
- Le dictionnaire le reprend comme décision DD-28, qui remplace la DD-28 du 10/10/2026.
- Les contraintes d'accès du MLD (CP-23 à CP-26, CP-29, CP-30, CP-37, CP-46, CP-48) seront réécrites comme ses conséquences, et les textes remplacés seront retirés.

**Batterie de recette :** [GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1.md](AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1.md). Les résultats attendus y sont fixés avant la réécriture.

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

**A6 — Révocation et cohérence.** CP-28 (réplication hors ligne) et CP-40 (évaluation, caches, opérations longues, refus en cas d'échec) sont maintenues et s'appliquent à tout droit issu de ce contrat.

## 3. Fondements des droits

### 3.1 Attribution initiale par le système (contrat de création)

Le système, et lui seul, attribue des droits initiaux, dans la transaction de création, selon trois procédures fermées.

| Procédure | Droits attribués | Conditions |
|---|---|---|
| **Création d'un espace** | Au créateur : `administrer` sur l'espace ; appartenance `responsable scientifique`, qui porte les droits et pouvoirs du § 5 sur le contenu de l'espace. | Une seule fois, à la création. Non rejouable. |
| **Création d'un objet `privé`** | Au **titulaire** : `voir`, `commenter`, `proposer`, `éditer`, `exporter`, `réutiliser` sur l’objet, et le pouvoir de déléguer chacune de ces actions (`repartager`). | Titulaire = acteur réalisateur (activité manuelle ou assistée), ou déposant identifiable des entrées s'il en détient les droits (activité automatique, import). Sans titulaire : aucun droit personnel (DI-A39). |
| **Création d'un objet d'une autre visibilité** | Aucun droit nominatif : l'objet est régi par la visibilité par défaut (§ 5) et par les règles existantes. | — |

Un droit de titulaire :
- n'est jamais créé par un acteur, ni prolongé, ni transféré, ni modifié ;
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
2. **Présentation** des engagements : règles, sélections, rattachements, groupes et leurs membres, appartenances, admissions, embargos et leurs bénéficiaires, y compris les audiences des rôles d'autres espaces. Ils sont désignés par la version de leur propriétaire, et une empreinte est calculée.
3. **Acceptation** par le bénéficiaire vérifié, contre l'empreinte.
4. **Attribution par le système**, dans la transaction d'acceptation :
   - le cessionnaire reçoit `administrer` et `responsable scientifique` sur l'espace ;
   - toutes les appartenances, appartenances à des groupes de l'espace, qualités de bénéficiaire d'embargo, règles dont il est bénéficiaire nominatif et droits de titulaire du cédant sur l'espace **s'éteignent**.
5. **Aucune règle nominative n'est transférée.** Les délégations accordées par des tiers au cédant s'éteignent avec lui. Les délégations accordées **par** le cédant perdent ce fondement : elles ne survivent que si le cessionnaire les **réémet** explicitement dans la transaction d'acceptation, avec lui-même pour habilitant (A1 vérifié). Les engagements présentés indiquent celles qui seront réémises. Les interdictions ne sont jamais transférées.
6. **Objets privés du cédant dans l'espace :** voir la question Q1 (§ 8).
7. Seuls les crédits et activités du cédant subsistent (DD-26.4).

### 3.4 Dérogation prédéfinie (habilitation exceptionnelle)

- **Autorité de dérogation :** un rôle de plateforme désigné (ST-15), distinct de toute appartenance à l'espace concerné. Elle ne s'accorde jamais une dérogation à elle-même ; une dérogation est accordée par un second acteur de ce rôle (deux personnes).
- **Forme :** nominative ; finalité et fondement explicites (mandat, demande du titulaire, obligation légale) ; périmètre limité aux objets nécessaires ; durée bornée ; journalisation de chaque usage.
- **Portée :** elle peut franchir l'existence protégée par une règle ou un embargo **interne**, uniquement pour la finalité déclarée (par exemple, lever un embargo devenu impossible à lever). Elle est évaluée avant l'étape « existence protégée », avec un journal renforcé.
- **Protections non levables par décision interne :**
  - consentement refusé ou retiré ;
  - purge et effacement légal ;
  - embargo dont le motif est une obligation légale.

  Pour ces protections, seule une décision légale externe, enregistrée comme fondement, peut ouvrir l'accès, dans les limites de cette décision.
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
- existence, auteur, bénéficiaires, dates et état des règles d'accès, sans leur cible si celle-ci est protégée ;
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

## 6. Application aux mécanismes

| Mécanisme | Règle issue du contrat |
|---|---|
| **Groupes** | La gouvernance d'un groupe (création, nom) relève d'`administrer`. **Ajouter un membre** est une délégation de tous les droits dont le groupe bénéficie : l'ajouteur doit détenir, pour chacun, le droit et son pouvoir de délégation (A1). Sinon, le nouveau membre n'en bénéficie pas, pour les droits non couverts. Jamais à soi-même (A3). Un groupe extérieur (programme) suit les modes d'admission (DD-22), chaque admission étant une délégation par un habilitant de l'espace porteur. |
| **Règles d'accès** | Une règle est une délégation (§ 3.2). Son auteur est figé ; ses fondements s'enrichissent des actes de prolongation ou d'admission conformes. Bénéficiaire `public` : seulement par le titulaire, ou par un responsable scientifique pour un contenu `projet`, et toujours sous les protections. |
| **Sélections partagées** | Une règle sur une sélection est une délégation sur le périmètre « manifeste actif ». L'auteur détient `voir` et `déléguer(voir)` (ou `réutiliser` et `déléguer(réutiliser)`) sur chaque objet servi, à l'instant de l'évaluation. Aucun accès si la sélection est `révoquée` ou `close`. |
| **Délégation de lot** | Délégation sur les objets listés du lot, par un habilitant qui détient les actions et leur pouvoir de délégation. |
| **Embargos** | Création : le titulaire de l'objet, ou un responsable scientifique pour un contenu `projet`. Bénéficiaires : ajoutés par le créateur ou un gardien, jamais à soi-même. Au moins un bénéficiaire **gardien** détient le pouvoir de délégation sur l'objet ; à défaut, le responsable scientifique de l'espace l'est d'office. Levée : un gardien, ou la dérogation du § 3.4 si aucun gardien n'existe plus. Un administrateur n'est jamais bénéficiaire du fait de son rôle. |
| **Transfert** | § 3.3. |
| **Habilitation exceptionnelle** | § 3.4. |
| **Contributions** | Écrire (commenter, proposer, transcrire, contribuer) exige le droit correspondant, quel qu'en soit le fondement, sélection comprise. Une contribution hors ligne est reçue si son auteur détenait ce droit lors de l'opération locale, et réévaluée à l'intégration (CP-27). |

## 7. Évaluation d'un accès

Pour un contexte (acteur, audience, instant, opération) et une cible :
1. **Dérogation** : une dérogation active du § 3.4 couvre-t-elle la cible et l'opération ? Si oui, appliquer sa portée, journaliser, puis sauter à l'étape 6.
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

## 8. Questions ouvertes pour le porteur

| # | Question | Recommandation |
|---|---|---|
| Q1 | Au transfert, que deviennent les objets `privé` du cédant dans l'espace transféré (titulaire = cédant) ? | Avant la présentation, le cédant choisit, objet par objet ou en bloc : (a) les verser au contenu de l'espace (visibilité `projet` ou `famille`), auquel cas ils deviennent accessibles au cessionnaire par son rôle ; ou (b) les conserver privés : ils s'éteignent pour lui (aucun droit résiduel) et ne sont accessibles que par dérogation. Le choix fait partie des engagements présentés. Aucune bascule implicite. |
| Q2 | Les embargos fondés sur une obligation légale doivent-ils être distingués par un attribut (`fondement_legal`) ? | Oui : c'est la seule façon de les rendre non levables par décision interne (§ 3.4). |
| Q3 | L'autorité de dérogation de plateforme exige-t-elle deux personnes pour chaque dérogation ? | Oui pour toute dérogation qui franchit une existence protégée ; une seule personne, avec journal, pour les autres. |
| Q4 | Le responsable scientifique peut-il nommer un autre responsable scientifique (délégation de rang égal) ? | Oui, conformément à A1 (périmètre égal) ; le nommé ne peut pas nommer son nommant à un rang supérieur, puisqu'il n'en existe pas. |
