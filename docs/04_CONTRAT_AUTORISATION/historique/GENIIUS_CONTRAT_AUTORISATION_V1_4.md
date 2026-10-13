# GENIIUS — Contrat d'autorisation

**Version :** **V1.4 — candidat, non gelé** (10 octobre 2026).

Refonte selon les décisions F-1 à F-5 du porteur (instruction du contrôle V1.3, § 7) :
- distinction formelle entre habilitations institutionnelles, habilitations personnelles, restrictions et protections d'existence ;
- invariants et transitions d'état posés **avant** les règles et les scénarios ;
- corrections locales CD-03 à CD-26.

La V1.3 est archivée dans `04_CONTRAT_AUTORISATION/historique/GENIIUS_CONTRAT_AUTORISATION_V1_3.md`.

**Statut normatif :**
- une fois gelé, ce contrat **prime** sur toute règle d'accès du dictionnaire et du MLD ;
- il remplacera la DD-28 du dictionnaire, dont les actions par défaut du RS divergent du § 7 (CD-26) ;
- les contraintes d'accès du MLD seront réécrites comme ses conséquences.

**Composants :**

| Composant | Emplacement | Rôle |
|---|---|---|
| Ce texte | ici | **Référence.** En cas d'écart entre le texte et le modèle, le texte prime et l'écart est un constat. |
| Modèle de référence exécutable | `spec/autorisation/modele.py` | Implémente ce texte. Ce n'est pas le logiciel de production. |
| Batterie de scénarios V1.4 | `04_CONTRAT_AUTORISATION/historique/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_4.md` et `spec/autorisation/tests/test_scenarios.py` | Base de régression, pas une couverture exhaustive. |
| Tests de propriétés, de transitions et de combinaisons | `spec/autorisation/tests/` | Vérifient les invariants du § 4 sur des états générés. |

**Critère de gel** (décision du porteur) :
- zéro constat bloquant, zéro constat majeur ;
- aucun scénario dont le résultat attendu exige d'inventer une règle absente de ce texte ;
- tous les tests automatisés réussis. Leur réussite **ne remplace pas** le contrôle indépendant du texte.

---

## 1. Vocabulaire

| Terme | Définition |
|---|---|
| **Acteur** | Titulaire d'un compte. Il est relié à une **personne** : deux comptes peuvent appartenir à la même personne. Un acteur institutionnel n'est relié à aucune personne. |
| **Espace** | Unité de gouvernance. États : `actif`, `archivé`, `clos` (§ 5.1). |
| **Contenu de l'espace** | Objets de l'espace **sans titulaire**. Visibilités possibles : `projet`, `communauté`, `public`. |
| **Objet personnel** | Objet qui a un **titulaire**. Visibilités possibles : `privé`, `communauté`, `public`. Un « objet `privé` » est un objet personnel de visibilité `privé`. |
| **Action** | Opération sur une cible : `voir`, `commenter`, `proposer`, `transcrire`, `éditer`, `valider`, `exporter`, `réutiliser`, `contribuer au Core`. Les **actions d'écriture** sont `commenter`, `proposer`, `transcrire`, `éditer`, `valider` et `contribuer au Core`. |
| **Droit** | Le fait, pour un acteur, de pouvoir exécuter une action sur une cible à un instant donné. |
| **Pouvoir de partage** (`repartager`) | Faculté d'accorder à autrui les actions que l'on détient. Détenir `voir` ne permet pas de faire voir. |
| **Pouvoir de gouvernance** (`administrer`) | Opérations du § 10.2 et lecture des métadonnées du § 10.3. Ce n'est ni une action ni un pouvoir de partage. |
| **Propriétaire** | L'acteur unique qui détient la propriété administrative d'un espace. |
| **Responsable scientifique (RS)** | Rôle qui porte l'autorité scientifique sur le contenu de l'espace, sur tout ce contenu ou sur un **périmètre** (§ 7). |
| **Racine** | Le propriétaire, dans sa fonction de RS. Cette fonction lui est attribuée par le système. Tout espace non clos a exactement une racine. |
| **Titulaire** | Acteur à qui le système attribue les droits sur un objet personnel (§ 6). |
| **Habilitation** | Acte qui confère des droits à un bénéficiaire. Il y en a deux catégories : **institutionnelle** (HI) et **personnelle** (HP) (§ 2). |
| **Signataire** | RS qui a créé une HI. Son identité est conservée (A7), mais l'HI n'en dépend pas. |
| **Auteur, fondateur** | Auteur : acteur qui a créé une HP. Fondateurs : l'auteur, plus tout acteur qui l'a prolongée ou confirmée (§ 8). |
| **Bénéficiaire** | Acteur, groupe, rôle d'un espace, ou `public`. |
| **Ensemble ouvert** | Bénéficiaire dont la composition change sans acte de l'habilitant : un groupe, ou un rôle d'un espace. |
| **Gestionnaire d'un ensemble ouvert** | Qui en décide la composition :<br>• pour un groupe, le propriétaire et les administrateurs de l'espace du groupe ;<br>• pour un rôle, les RS de l'espace du rôle. |
| **Admission** | Acte nominatif par lequel un membre d'un ensemble ouvert bénéficie effectivement d'une habilitation (§ 9). |
| **Restriction** | Retire des droits sur une cible dont l'existence reste observable pour qui la voyait (§ 2.3). |
| **Protection d'existence** | Rend une cible inexistante pour ceux qu'elle frappe (§ 2.4). |
| **Gardien** | Acteur habilité à gérer une restriction interne ou une protection d'existence et à la lever (§ 11.2). |
| **Dérogation** | Accès exceptionnel, borné et journalisé, qui laisse la protection en place (§ 12). |
| **Périmètre** | Ensemble délimité de cibles :<br>• un objet ;<br>• une liste fermée d'objets (lot) ;<br>• le contenu d'un espace ;<br>• la version active d'une sélection.<br>Jamais « tout ce qui sera ajouté plus tard » à une sélection ou à un lot (P24). |

## 2. Les quatre catégories

| | **Habilitation institutionnelle (HI)** | **Habilitation personnelle (HP)** | **Restriction** | **Protection d'existence** |
|---|---|---|---|---|
| Effet | Confère des droits sur le contenu d'un espace ou un rôle scientifique | Confère des droits que l'auteur détient personnellement | Retire des droits ; l'existence reste observable | Rend la cible inexistante pour ceux qu'elle frappe |
| Créée par | Un RS actif de l'espace, dans son périmètre | Tout détenteur de l'action et de `repartager` | Titulaire ou RS (internes) ; autorité de dérogation ou autorité externe (légales) | Titulaire ou RS ; le système (cloisonnement) |
| Fondement | **L'autorité scientifique de l'espace** | La **chaîne enracinée** de ses fondateurs | L'acte de ses gardiens, ou une base légale | L'acte de ses gardiens |
| Sort au départ de son auteur | **Survit** | Tombe si plus aucun fondateur n'est valide | Survit | Survit |
| Fin | Clôture (§ 7.4), expiration | Clôture, expiration, rupture de la chaîne | Levée par un gardien ou par l'autorité compétente | Levée par un gardien |

### 2.1 Habilitation institutionnelle (F-1)

**Formes :**
- nomination à un rôle scientifique de l'espace : RS, collaborateur, lecteur ou invité ;
- délégation sur le contenu de l'espace : règle, règle de sélection ou lot ;
- admission prononcée au titre d'une HI.

**Est institutionnelle** toute habilitation créée par un RS actif d'un espace, qui porte sur le contenu de cet espace ou sur ses rôles, dans le périmètre de ce RS. Toute autre habilitation est personnelle.

**Fondement :** l'autorité scientifique de l'espace, et non la personne du signataire.

L'HI **survit** au départ, à la révocation, à l'interdiction et au transfert de son signataire. Elle reste soumise :
- à la clôture et à la mise en examen (§ 7.4, § 7.5) ;
- aux protections de chaque objet (A5) : l'autorité de l'espace n'est pas un droit d'accès au contenu protégé.

**Traçabilité :** le signataire, les confirmateurs et les auteurs de prolongation, de suspension et de clôture sont conservés (A7).

### 2.2 Habilitation personnelle

L'auteur accorde un droit qu'il détient lui-même :
- un titulaire sur son objet ;
- le bénéficiaire d'une habilitation qui comporte `repartager` ;
- un RS sur une cible qui n'est pas le contenu de son espace, par exemple un objet personnel qu'on lui a partagé.

Une HP dépend de sa **chaîne** à chaque évaluation (A1, § 8).

### 2.3 Restrictions

| Restriction | Effet | Levée |
|---|---|---|
| **Embargo de contenu** | Retire toutes les actions à tous, sauf aux bénéficiaires. | Un gardien |
| **Interdiction d'action** | Retire les actions désignées aux destinataires désignés. | Un gardien |
| **Restriction légale** | Retire toutes les actions. | L'autorité compétente désignée (§ 11.6) |
| **Consentement refusé ou retiré, effacement légal** | Retire toutes les actions. | Aucune décision interne |
| **Purge** | L'objet n'existe plus. | — |

Les quatre dernières lignes sont dites **non levables**.

### 2.4 Protections d'existence

| Protection | Qui elle frappe | Levée |
|---|---|---|
| **Embargo d'existence** | Tous, sauf ses bénéficiaires effectifs | Un gardien |
| **Interdiction d'existence** | Ses destinataires | Un gardien |
| **Cloisonnement temporaire** (campagne en phase indépendante) | Chaque participant, pour les réponses des autres | Fin de la phase |

### 2.5 Ce que les catégories ne font pas

- **Une restriction ou une protection n'est jamais une perte de droit** au sens de la dépendance des HP (CD-07, CD-18). Elle bloque l'accès de qui elle frappe, mais ne fait tomber aucune habilitation qu'il a créée ou fondée. A1 s'évalue sur les droits, **abstraction faite** des protections qui frappent l'auteur. Les protections s'appliquent au bénéficiaire, à l'évaluation de son propre accès.
- **L'autorité de l'espace** ne lève aucune protection et ne donne aucun accès à un objet personnel d'autrui ni à un contenu protégé (F-1).
- **La gouvernance** ne donne aucun droit de contenu (A2).

## 3. Principes

**A1 — Nul ne donne ce qu'il n'a pas.**
- **HP :** l'auteur, puis chaque fondateur, détient chaque action accordée, `repartager`, et un périmètre et une durée au moins aussi larges, **au moment de l'acte et à chaque évaluation**.
- **HI :** à l'acte, le signataire est un RS actif dont le périmètre et la durée couvrent l'habilitation, et les actions accordées font partie des actions du RS (§ 7.1). Ensuite, l'HI est bornée par l'autorité de l'espace : sa cible doit rester du contenu de l'espace.

**A2 — Gérer n'est pas lire.**
- `administrer`, la propriété et la gestion d'un ensemble ouvert ne confèrent aucun droit sur les contenus, leurs versions, leurs preuves, leurs relations protégées ou leurs représentations dérivées.
- Ils ne confèrent aucun pouvoir de partage.

**A3 — Nul n'augmente ses propres droits ni ses pouvoirs**, ni directement, ni par l'intermédiaire d'un ensemble dont il décide la composition (F-2).
- **Interdits :**
  - se créer une habilitation ;
  - s'ajouter à un groupe ou à un rôle, s'admettre ;
  - se déclarer bénéficiaire ou gardien d'une protection **existante** (le créateur d'une nouvelle protection en est gardien par le § 11.2 : cela ne lui donne aucun droit) ;
  - se nommer, se désigner autorité compétente ;
  - être admis automatiquement à un ensemble dont on est gestionnaire (§ 9.4).
- **Permis :** une habilitation au profit d'un groupe, d'un rôle ou du public dont l'habilitant fait partie. Elle ne lui donne rien qu'il ne détienne déjà.
- **Accepter** une nomination ou un transfert n'est pas une auto-attribution : l'attribution émane d'un autre acteur ou du système.

**A4 — Pas de résurrection.**
- La clôture, l'expiration et la rupture sont **définitives**.
- Prolongation, admission, transfert, réouverture, restauration, réimport ou nouveau rattachement ne réactivent jamais une habilitation close.
- Seul un nouvel acte conforme à A1 et à A3 crée un droit.
- Une **suspension** n'est pas une clôture : une HI suspendue puis confirmée n'est pas ressuscitée, puisqu'elle n'a jamais été close.

**A5 — Les protections priment.**
- Elles s'appliquent avant toute autorisation, propriétaire et administrateurs compris.
- Le seul contournement est la dérogation (§ 12). Elle ne franchit jamais une restriction non levable.

**A6 — Révocation effective, échec fermé** (rappel de CP-40) :
- une décision d'accès est évaluée sur un état d'habilitation qui ne peut ignorer aucune révocation déjà effective ;
- les caches sont coordonnés avec la prise d'effet ;
- chaque page, reprise ou étape d'une opération longue est réévaluée ;
- une impossibilité de vérifier vaut **refus**, indistinguable d'une absence.

**A7 — Traçabilité.** Aucun acte n'efface ni ne réécrit l'identité de qui a accordé, confirmé, prolongé, suspendu, retiré ou clos une habilitation ou une protection.

## 4. Invariants

Ils valent dans **tout** état atteignable. Le modèle les vérifie sur des états générés aléatoirement (`test_proprietes.py`) et sur des séquences de transitions (`test_transitions.py`).

| ID | Invariant |
|---|---|
| **I-1** Propriété | Tout espace non clos a exactement un propriétaire, qui est aussi sa racine (RS attribué par le système). |
| **I-2** Pas d'auto-élévation | Pour tout acte dont x est l'auteur, autre qu'une acceptation, les droits, pouvoirs de partage, pouvoirs de gouvernance et qualités de bénéficiaire ou de gardien de x, **sur les cibles, espaces et protections qui existaient avant l'acte**, sont inclus après l'acte dans ceux d'avant. Les attributions du système à la création d'un objet, d'un espace ou d'une protection (§ 6.1, § 11.2) ne sont pas des élévations. La réouverture d’un espace et la levée d’un examen ne sont pas non plus des élévations : elles rétablissent, sans les dépasser, des droits que l’archivage ou la suspension avaient neutralisés. |
| **I-3** Pas d'élévation réciproque (F-2) | Aucune suite d'actes dont les auteurs ne sont que des gestionnaires d'ensembles ouverts ou des détenteurs d'`administrer` n'augmente les droits de contenu de l'un d'eux. |
| **I-4** Pas d'accès implicite par la propriété ou la gouvernance | Le propriétaire et les administrateurs n'ont accès à aucun objet personnel d'autrui ni à aucune cible protégée pour eux, sauf par une habilitation personnelle explicite, une admission ou une dérogation. |
| **I-5** Non-divulgation d'existence | Pour tout acteur x et tout objet O dont l'existence est protégée pour x, toutes les observations de x (§ 15) sont identiques à celles qu'il aurait si O n'existait pas. |
| **I-6** Révocation effective | Après la clôture, l'expiration ou la suspension d'une habilitation h, aucun accès en ligne qui ne reposait que sur h, ou sur des HP dont la chaîne passait par h, n'est accordé, cache compris. Hors ligne, le résidu est borné par l'échéance locale (§ 13.9). |
| **I-7** Pas de résurrection | Aucune transition ne fait passer une habilitation, une admission ou une dérogation de `close` ou `expirée` à `active`. |
| **I-8** Continuité au transfert | Au transfert de C à K, un acteur y ≠ C ne perd que les accès qui reposaient exclusivement sur des HP dont la chaîne passait nécessairement par C (C auteur ou fondateur, ou C bénéficiaire en amont) et qui n'ont pas été réémises, ou sur un objet que C a purgé par la voie retenue. Aucune HI, aucune nomination et aucune protection d'un tiers ne disparaît. |
| **I-9** Primauté des protections | Aucun accès ne franchit une restriction ou une protection d'existence qui frappe l'acteur, sauf par une dérogation dont le niveau d'approbation satisfait les protections présentes à l'instant de l'évaluation. Aucun accès ne franchit une restriction non levable. |
| **I-10** Chaîne enracinée | Toute HP effective a au moins un fondateur valide dont le droit remonte, sans passer par cette HP, à une attribution par le système ou à une HI active. |
| **I-11** Atomicité | Une acceptation de transfert applique tous ses effets ou n'en applique aucun. |
| **I-12** Gardiens | Tout gardien d'un embargo en est bénéficiaire. Personne ne devient gardien sans désignation par un gardien, sans procédure de l'autorité de dérogation ou sans transfert d'un objet par la voie (b). Il n'y a pas de gardien d'office. |
| **I-13** Dérogation bornée | Une dérogation ne permet jamais `éditer`, `valider`, `repartager` ni `administrer`. Elle respecte sa durée maximale et le nombre maximal de renouvellements consécutifs (§ 12.6). |
| **I-14** Échec fermé | Si une évaluation ne peut conclure (profondeur, cycle, donnée indisponible), la décision est un refus. |

## 5. États et transitions

### 5.1 Espace

| Transition | Auteur | Effet |
|---|---|---|
| `actif` → `archivé` | Le propriétaire | Ferme les actions d'écriture et toute **nouvelle** habilitation sur le contenu de l'espace. Restent possibles : la lecture, la clôture, la restriction et la suspension d'habilitations, les départs, la création et la levée de protections, la désignation de gardiens, le transfert (réémissions comprises), les dérogations en lecture (CD-20). |
| `archivé` → `actif` | Le propriétaire | Rétablit les droits non expirés. Ne réactive aucune habilitation close entre-temps (A4). |
| `actif` ou `archivé` → `clos` | Le propriétaire | Définitif. Mêmes effets que l'archivage, sans réouverture ni transfert. |

### 5.2 Habilitation

États : `proposée` (nomination RS non encore acceptée), `active`, `suspendue` (HI seulement), `close`, `expirée`.

| ID | Transition | De → vers | Auteur | Condition |
|---|---|---|---|---|
| T-01 | Créer | ∅ → `active`, ou `proposée` pour une nomination RS | Signataire (HI) ou auteur (HP) | § 7.2 ou § 8.1 ; A3 ; protections ; espace actif ; § 10.8 ; gel du § 10.6 |
| T-02 | Accepter une nomination RS | `proposée` → `active` | Le nommé | — |
| T-03 | Refuser une nomination RS | `proposée` → `close` | Le nommé | — |
| T-04 | Prolonger | `active` → `active` | HI : tout RS qui pourrait la signer. HP : un acteur qui remplit A1 et en devient fondateur | Non expirée (A4) ; espace actif |
| T-05 | Restreindre (actions, périmètre, échéance) | `active` → `active` | Comme la clôture | — |
| T-06 | Confirmer (HP) | `active` → `active` | Acteur qui remplit A1 sans passer par cette HP | Sinon refus, car il y aurait un cycle |
| T-07 | Mettre en examen | `active` → `suspendue` | La racine | HI seulement (§ 7.5) |
| T-08 | Lever l'examen | `suspendue` → `active` | La racine | Non expirée |
| T-09 | Clore | `proposée`, `active` ou `suspendue` → `close` | § 7.4 (HI) ; § 8.3 (HP) | — |
| T-10 | Expirer | → `expirée` | Le temps | Échéance atteinte |
| T-11 | Rompre (HP) | `active` → `close` | Le système | Plus aucun fondateur valide (§ 8.2) |
| T-12 | Retirer son fondement (HP) | `active` → `active` ou `close` | Un fondateur | Si c'était le dernier fondateur valide : T-11 |
| T-13 | Fin d'un rattachement | `active` → `close` | Le système | Habilitation conditionnée par ce rattachement (§ 13.13) |

### 5.3 Admission

États : `active`, `close`.

Une admission est close par :
- son retrait (§ 9.3) ;
- la sortie du membre de l'ensemble ;
- la clôture, l'expiration ou la rupture de son habilitation ;
- pour une admission au titre d'une HP, la rupture de la chaîne de l'acteur qui l'a prononcée.

Un retour dans l'ensemble exige une **nouvelle** admission. Une admission dont le retrait a été prononcé par l'habilitant exclut l'admission automatique de ce membre pour cette habilitation (§ 9.4).

### 5.4 Protection

États : `active`, `levée`.

| Transition | Auteur |
|---|---|
| Créer | § 11.1 |
| Ajouter un bénéficiaire, un destinataire, un membre agréé | Un gardien, jamais à son profit |
| Désigner un gardien | Un gardien (§ 11.2) ; l'autorité de dérogation, pour une protection orpheline |
| Perdre la qualité de gardien | Le système (§ 11.2) |
| Lever | Un gardien ; l'autorité compétente (restriction légale) |

### 5.5 Dérogation

`demandée` → `active` (approbations réunies) → `expirée` | `révoquée`. Un renouvellement est une **nouvelle** dérogation (§ 12.6).

### 5.6 Transfert

`préparé` → `présenté` → `accepté`. Un transfert présenté peut aussi devenir `renouvelé` (nouvelle présentation automatique), `expiré` ou `annulé` par le cédant.

### 5.7 Objet personnel

| Transition | Effet |
|---|---|
| **Versement** au contenu de l'espace | Par renonciation, par élargissement au niveau `projet` ou par la voie (a) d'un transfert. Exige l'accord d'un RS. Fin du droit de titulaire ; la paternité est conservée (§ 6.3). |
| **Changement de titulaire** | Uniquement par la voie (b) du transfert (§ 10.5). |
| **Purge** | Légalement autorisée seulement. |

## 6. Attribution par le système

Le système, et lui seul, attribue des droits initiaux, dans la transaction de création, selon les procédures fermées suivantes.

### 6.1 Procédures

| Procédure | Attribution |
|---|---|
| **Création d'un espace** | Au créateur : la propriété et le rôle de RS **racine**, sur tout le contenu. |
| **Création d'un objet personnel** | Au titulaire : `voir`, `commenter`, `proposer`, `transcrire`, `éditer`, `exporter` et `réutiliser`, avec `repartager`.<br>**Pas `valider`** : le titulaire peut seulement marquer une **validation personnelle**, sans effet scientifique.<br>**Pas `contribuer au Core`** tant que l'objet est personnel. |
| **Transfert accepté** | Au cessionnaire : la propriété et le rôle de RS racine (§ 10.7). |
| **Amorçage du référentiel commun** | Un acteur institutionnel d'amorçage, sans droit de titulaire. Visibilité publique explicite. |

### 6.2 Création d'un objet

- **Droit de créer** : il exige l'appartenance `collaborateur` ou `RS` à l'espace.
  - Un invité qui détient `proposer` par une HI ne crée que des **propositions**.
  - Un lecteur, un invité sans délégation, un administrateur ou le propriétaire en tant que tels ne créent rien.
- **Titulaire** :
  - pour une activité manuelle ou assistée, son réalisateur ;
  - pour un import, le **déposant**, qui doit avoir le droit de créer et déclarer les droits sur ses entrées.

  **Lancer** un import pour un déposant n'est pas créer (CD-19).
- Un **objet personnel exige un titulaire.** Une activité automatique sans déposant identifiable ne crée pas d'objet personnel : la création est refusée (CD-19).
- Les droits sur un fichier externe sont **déclarés** par le déposant. La plateforme ne vérifie pas la propriété intellectuelle externe : c'est un résidu documenté.

### 6.3 Droit de titulaire

- Aucun acteur ne le crée, ne le prolonge ni ne le modifie.
- Il **ne dépend d'aucune appartenance.** Un titulaire qui quitte l'espace, ou qui en est exclu, garde ses objets personnels et ses droits sur eux (CD-12).
  - Il ne peut plus y créer d'objet.
  - Les RS sont informés de son départ.
  - Il peut verser ses objets (avec l'accord d'un RS) ou en faire une copie autonome (§ 10.5, voie c).
- Il s'éteint :
  - par la purge de l'objet ;
  - par le **versement** (renonciation ou élargissement au niveau `projet`), qui exige l'accord d'un RS ;
  - par la voie (b) d'un transfert.

  Sans versement possible ni purge autorisée, la renonciation est refusée.
- **Au versement** :
  - les HP du titulaire sur l'objet tombent, sauf celles que le RS qui accepte reprend, nominativement, en HI. Une telle reprise est présentée, faite à l'identique ou plus étroite, et crée une nouvelle habilitation liée à l'ancienne (« réémission de ») ;
  - les protections dont le titulaire était le seul gardien suivent le § 11.2 : elles deviennent **orphelines** si l'ancien titulaire ne détient plus aucun droit de contenu sur l'objet (par exemple par un rôle).

## 7. Rôles et habilitations institutionnelles

### 7.1 Rôles

Actions sur le contenu de l'espace, dans le périmètre du rôle, sous réserve des protections. Les objets personnels ne relèvent que de leur titulaire et de ses HP.

| Rôle | Actions | `repartager` | Conféré par |
|---|---|---|---|
| propriétaire | aucune | aucun | Système (création, transfert) |
| administrateur | aucune | aucun | Le propriétaire seul |
| RS | `voir`, `commenter`, `proposer`, `transcrire`, `éditer`, `valider`, `exporter`, `réutiliser`, `contribuer au Core` | Oui, en HI | Système (racine) ; un RS (nomination) |
| collaborateur | `voir`, `commenter`, `proposer`, `transcrire`, `éditer` | non | Un RS |
| lecteur | `voir`, `commenter` | non | Un RS |
| invité | aucune ; seulement les délégations explicites | non | Un RS, éventuellement sur une invitation préparée par un administrateur |

`contribuer au Core` exige en outre une évaluation de diffusabilité favorable de l'objet. Ce n'est l'action par défaut d'aucun autre rôle.

### 7.2 Création d'une HI

- **Conditions :**
  - le signataire est un RS actif de l'espace ;
  - son périmètre et sa durée couvrent ceux de l'habilitation ;
  - les actions accordées font partie de celles du RS ;
  - l'espace est actif ;
  - A3 est respecté ;
  - aucune protection ne s'y oppose : le signataire ne peut créer d'HI sur une cible dont l'existence lui est protégée ;
  - le verrou de réintégration (§ 10.8) et le gel du transfert (§ 10.6) sont respectés.
- **Nomination d'un RS (Q4) :**
  - elle est nominative et porte au plus sur le périmètre du signataire ;
  - elle est **acceptée** par le nommé ;
  - elle ne donne aucun accès aux objets personnels d'autrui.

### 7.3 Effets

L'HI est effective si :
- elle est `active` ;
- elle n'est ni suspendue ni expirée ;
- sa cible est du contenu de l'espace, et, pour une sélection, l'objet figure dans la version active.

Le maintien du signataire n'est **pas** une condition.

### 7.4 Clôture et restriction d'une HI

| HI | Peut la clore ou la restreindre |
|---|---|
| Nomination d'un RS | Son signataire, tant qu'il est RS de l'espace ; **la racine** (CD-02) ; le nommé lui-même (départ) |
| Toute autre HI | Son signataire, tant qu'il est RS ; tout RS dont le périmètre la couvre ; la racine ; le bénéficiaire nominatif lui-même (renonciation) |
| Rôle de racine | Personne ; il ne cesse qu'au transfert ou à la clôture de l'espace |

Un RS ne peut agir sur une HI dont la cible lui est cachée. Ce n'est pas une prérogative de l'autorité : c'est la primauté des protections, et la réponse est indistinguable d'une absence.

### 7.5 Mise en examen ciblée (F-1)

- La racine peut **mettre en examen** toute HI de l'espace. L'HI est aussitôt **suspendue** : elle ne confère plus rien, et les HP dont la chaîne passe par elle ne sont plus effectives.
- L'examen se termine :
  - par une **confirmation** de la racine, qui la rétablit (tracée) ;
  - ou par une **clôture**.
- Il n'existe aucune suspension automatique et collective des actes d'un RS, même révoqué pour abus. À la révocation d'un RS, la racine reçoit la liste des HI qu'il a signées, et elle choisit celles qu'elle examine.

### 7.6 Départ

- Un membre autre que la racine peut quitter l'espace à tout moment. Ses appartenances prennent fin ; les HI qu'il a signées **survivent**.
- Avant son départ, il peut désigner un autre gardien pour les protections dont il est le seul gardien (§ 11.2).
- La racine ne quitte l'espace que par un transfert ou par la clôture de l'espace.
- Le décès ou l'indisponibilité durable de la racine relève de la procédure de succession (§ 10.4).

## 8. Habilitations personnelles

### 8.1 Création

Conditions, toutes requises :
1. **A1 :** l'auteur détient chaque action accordée et `repartager`, sur un périmètre qui couvre celui accordé, abstraction faite des protections qui le frappent.
2. **A3.**
3. **Durée :** l'échéance accordée ne dépasse pas celle des droits de l'auteur.
4. **Redélégation :** `repartager` n'est transmis que s'il est accordé explicitement.
5. **Protections :** l'auteur voit la cible. Les protections s'appliquent ensuite au bénéficiaire.
6. **Espace actif** pour une cible du contenu d'un espace.

### 8.2 Fondateurs et chaîne

- **Fondateurs :**
  - l'auteur ;
  - tout acteur qui a **prolongé** ou **confirmé** l'HP en remplissant lui-même les conditions 1 et 3.

  Chaque fondateur couvre l'HP jusqu'à sa propre échéance.
- **Fondateur valide à l'instant t :** il détient, à t, les actions et `repartager` sur le périmètre, par une chaîne qui remonte à une attribution par le système ou à une HI effective, **sans passer par cette HP**.
- **Portée effective :** l'union des couvertures des fondateurs valides (CD-16).
- **Rupture :** si plus aucun fondateur n'est valide, l'HP est **close**, définitivement (A4), même si un fondateur retrouve plus tard un droit.
- **Cycles :**
  - une confirmation par un acteur dont le droit passe par l'HP qu'il confirme est **refusée** ;
  - une HP au profit d'un acteur situé en amont de la chaîne de l'auteur (un fondateur, direct ou indirect, des HP dont l'auteur tient son droit) est **refusée** ;
  - la profondeur d'évaluation est bornée (I-14).

### 8.3 Actes

| Acte | Auteur |
|---|---|
| Clore, restreindre | L'auteur ; le titulaire de la cible ; pour une cible du contenu d'un espace, tout RS de cet espace dont le périmètre la couvre |
| Retirer son fondement | Un fondateur (T-12) |
| Prolonger, confirmer | § 5.2, T-04 et T-06 |
| Admettre (§ 9) | Un acteur qui remplit la condition 1. Il est le fondateur de **cette admission seulement**. |

## 9. Ensembles ouverts et admission (E-2, F-2)

### 9.1 Appartenance à un ensemble

- **Groupe :** ses gestionnaires y ajoutent ou en retirent des membres, jamais eux-mêmes (A3).
- **Rôle :** il est conféré par les RS de son espace (§ 7.1).

L'appartenance seule ne confère aucun droit.

### 9.2 Quand une admission est requise

Une habilitation au profit d'un ensemble ouvert exige une admission, **sauf** une HI au profit d'un rôle de son propre espace : la composition de ce rôle est alors décidée par la même autorité qui accorde (CD-13).

Une HP d'un titulaire au profit d'un rôle de son propre espace exige donc une admission.

### 9.3 Modes d'admission

Le mode est choisi par l'habilitant.

- **`approbation préalable`** (mode par défaut) : un membre ne bénéficie de l'habilitation qu'après une admission nominative prononcée par :
  - un RS de l'espace (HI) ;
  - ou un acteur qui remplit la condition 1 (HP).

  C'est le **seul mode admis** pour un objet personnel non public, pour un objet sensible (DI-E05) et pour une cible sous restriction ou protection.
- **`notification`** : une autorisation **anticipée** de l'habilitant. Tout nouveau membre est admis automatiquement, dans les limites de l'habilitation, sauf les exclusions du § 9.4.
  - Pour une HI, les RS de l'espace sont notifiés de chaque entrée ; pour une HP, l'auteur est notifié.
  - Ils peuvent retirer l'admission.

### 9.4 Exclusions de l'admission automatique (F-2)

Ne sont jamais admis automatiquement, et doivent recevoir une admission nominative :
- un **gestionnaire** de l'ensemble (pour un groupe : le propriétaire et les administrateurs de son espace ; pour un rôle : les RS de son espace) ;
- le **cédant** d'un transfert de l'espace de l'habilitation, sous verrou de réintégration (§ 10.8) ;
- un membre dont l'admission à cette habilitation a été **retirée** par l'habilitant.

Deux administrateurs qui s'ajoutent mutuellement à un groupe n'en tirent donc aucun droit (I-3).

### 9.5 Admission à une protection d'existence

Lorsqu'un groupe est bénéficiaire d'un embargo d'existence, un de ses membres n'en devient bénéficiaire effectif qu'avec l'**agrément d'un gardien**. Ajouter un tiers au groupe ne lève rien.

## 10. Propriété, gouvernance, transfert

### 10.1 Propriété

- Chaque espace a un **propriétaire unique**, désigné par la création ou par un transfert.
- La propriété est **administrative** (A2). Le propriétaire lit le contenu de l'espace parce qu'il en est la racine, sous réserve des protections. Il ne lit jamais un objet personnel d'autrui sans HP (I-4).
- **Opérations réservées au propriétaire :**
  - transférer (§ 10.4) ;
  - nommer et révoquer les administrateurs (CD-15) ;
  - archiver, rouvrir et clore l'espace (CD-20) ;
  - consentir à la réintégration du cédant (§ 10.8).

### 10.2 Opérations de gouvernance (`administrer` : propriétaire et administrateurs)

- Gestion de l'appartenance aux groupes de l'espace (§ 9.1).
- **Invitations** : préparer et instruire une demande d'appartenance, sans la conférer.
- **Rattachements de projets** : les proposer, les décider, y mettre fin. Un rattachement ne confère aucun droit (§ 13.13).
- **Prises en charge** (un espace en assiste un autre) : les proposer, les accepter, les révoquer. Elles ne confèrent aucun droit de contenu.
- Paramétrage du circuit éditorial, et de la réplication dans le plafond de la plateforme.
- **Séries de publications** : accepter l'insertion d'une publication d'un autre espace (§ 13.6).

Aucune de ces opérations ne nomme un administrateur (§ 10.1).

### 10.3 Métadonnées de gouvernance lisibles (liste fermée)

Elles sont lisibles par tout détenteur d'`administrer` sur l'espace, et par ses RS.

- Membres, rôles, groupes et leurs membres.
- **Habilitations :**
  - signataire ou auteur, bénéficiaire, actions, dates, état ;
  - cible désignée par son identifiant et son type, sans titre ni libellé.
- Existence et état des sélections, des rattachements et des prises en charge, sans leur contenu.
- **Diffusions :** date, canal, audience déclarée, nombre de destinataires, résultat ; jamais le contenu diffusé.
- **Explication des accès** (OB-24).
- Journaux de gouvernance.

**Exclusions**, appliquées à chacune de ces lignes :
- tout élément qui porte **seulement** sur des objets dont l'existence est protégée pour le lecteur. Un élément qui porte à la fois sur des cibles visibles et cachées est présenté **réduit à ses cibles visibles**, sans indication de réduction : sinon, son absence de la liste, alors que l'explication des accès le cite, révélerait l'existence d'une cible cachée ;
- les HP qui portent sur un **objet personnel**, sauf pour son titulaire (CD-23).

Les listes, compteurs et paginations sont calculés **après** exclusion.

**Jamais :** un contenu, une version, une preuve, une relation protégée, une représentation dérivée.

### 10.4 Autorité de transfert

- Seul le **propriétaire** transfère.
- **Espace préparé pour un tiers :** il porte une désignation de garde (`DESIGNATION_GARDE`) au profit d'un bénéficiaire futur. Le premier transfert ne peut être proposé qu'à lui, ou à un autre bénéficiaire désigné explicitement par le propriétaire.
- **Succession** (décès, indisponibilité durable, perte de capacité) : une procédure distincte, que le moteur n'improvise jamais.
  - Elle exige une désignation de garde préalable, ou un fondement légal enregistré.
  - Deux approbateurs de l'autorité de dérogation l'examinent.
  - Elle aboutit à un **transfert ordinaire**, présenté puis accepté.

  À défaut de désignation ou de fondement légal, l'espace reste en l'état.

### 10.5 Préparation

**Objets personnels du cédant C dans l'espace.** Avant la présentation, C retient, objet par objet ou en bloc, l'une des voies suivantes :
- **(a) Versement** à l'espace : l'acceptation par K, qui devient RS, vaut l'accord d'un RS (CD-25).
- **(b) Changement de titulaire** au profit de K. K doit accepter explicitement chaque objet, ou le bloc. L'objet doit être visible de K dans la présentation : si une protection d'existence le cache à K, la voie (b) est impossible, sauf si C, comme gardien, rend d'abord K bénéficiaire. C'est alors un choix de C, et non une révélation par le système (F-4).
- **Purge** légalement autorisée.

En complément de (a) ou de (b) :
- **(c) Copie autonome** dans l'espace personnel de C, liée par `FILIATION`.
  - Elle exige que la licence permette la copie, et qu'aucune restriction ni protection ne porte sur l'objet.
  - L'original ne change jamais d'espace (DI-A01).

**Blocage :** un objet sans voie retenue, ou dont une voie retenue est impossible, empêche l'acceptation (S-75). La cause n'est signalée **qu'au cédant**.
- La présentation est refusée au cédant tant qu'un objet n'a pas de voie, et la voie (b) est refusée au cédant pour un objet que K ne voit pas.
- Un blocage qui survient après la présentation (consentement retiré, protection posée par C, licence) fait échouer l'acceptation avec un motif générique « blocage », sans désignation de l'objet.

**Réémissions** des HP de C sur ses objets :
- sur un objet en voie (a), elles sont reprises en HI par K ;
- sur un objet en voie (b), elles sont reprises en HP par K.

Une réémission :
- est annoncée nominativement ;
- est faite à l'identique ou plus étroite ;
- n'est jamais faite pour une HP déjà expirée ;
- n'est jamais implicite ;
- crée une **nouvelle** habilitation, dont K est l'auteur, avec un lien « réémission de ».

Les **admissions** de l'HP d'origine sont reprises si, et seulement si, elles figurent dans l'annonce (CD-14).

Les **HI** n'ont pas à être réémises : elles survivent (F-1).

### 10.6 Présentation (E-8, F-4)

Elle comprend trois parties.

| Partie | Contenu | Rôle |
|---|---|---|
| **Engagements** (vue du cessionnaire) | • Les habilitations de l'espace que K pourra voir et gérer : HI, et HP sur le contenu de l'espace ; leurs bénéficiaires désignés (un groupe ou un rôle **désigné**, jamais la composition d'un rôle d'un autre espace) ; les admissions.<br>• Les membres et leurs rôles.<br>• Les voies retenues pour les objets personnels de C visibles de K.<br>• Les réémissions annoncées. | Son **empreinte** fait foi pour l'acceptation. |
| **Aperçu** | Les objets que K pourra voir. | Informatif. Il est recalculé à chaque affichage et ne fait pas partie de l'empreinte. |
| **Scellé d'audit** | La totalité des engagements, protections invisibles à K comprises. | Archivé pour l'audit. Il n'est **jamais** une cause de refus observable par K. |

**Ce qui n'apparaît jamais à K :**
- un élément dont l’existence lui est protégée ; une habilitation à cibles mixtes est réduite à ses cibles visibles (§ 10.3) ;
- leur nombre, ou tout indice indirect.

**Gel des élargissements** pendant la fenêtre de présentation (F-4) :
- tout acte qui **ajouterait** un élément aux engagements, ou rendrait visible à K un élément caché, est refusé avec le motif « espace en cours de transfert » :
  - création d'une habilitation, nomination, acceptation d'une nomination, nomination d'un administrateur ;
  - prolongation, confirmation, levée d'un examen ;
  - admission manuelle ;
  - ajout d'un membre à un groupe de l'espace ;
  - changement de voie ou de réémission ;
  - levée d'une protection, ajout d'un bénéficiaire, agrément d'un membre, désignation d'un gardien ;
- une admission **automatique** qui surviendrait pendant la fenêtre (par exemple parce qu'un autre espace a nommé un membre d'un rôle bénéficiaire) est **différée** à la fin de la fenêtre, puis traitée selon le § 9.4 ;
- restent permis les actes qui **retirent** : clôture, restriction, suspension, retrait d'une admission ou d'un membre, départ, création d'une protection.

Les engagements ne peuvent donc que diminuer : **aucun tiers ne peut empêcher indéfiniment l'acceptation.** Les modifications de la composition d'un rôle d'un autre espace ne font pas partie des engagements et ne bloquent rien.

**Renouvellement :** si l'empreinte présentée diffère de l'empreinte courante au moment de l'acceptation, celle-ci est refusée avec un message unique, « présentation renouvelée », quelle qu'en soit la cause, et une nouvelle présentation est émise automatiquement. Une modification invisible à K n'apparaît, au plus, que comme le retrait d'un élément, indistinguable d'une clôture ordinaire.

**Expiration :** une présentation expire après un délai fixé (§ 16).

### 10.7 Acceptation : une seule transaction

**Conditions :**
- K est le bénéficiaire vérifié ;
- la présentation n'est pas expirée ;
- l'empreinte est égale ;
- aucun blocage ;
- chaque réémission est valide : non expirée, à l'identique ou plus étroite, conforme à A1 sur les droits que K reçoit ;
- aucune restriction non levable ne frappe un objet en voie (b) ou (c).

Si une seule condition échoue, **rien** n'est appliqué (I-11).

**Effets :**
- K devient **propriétaire** et **racine**. Une appartenance antérieure de K à l'espace est remplacée.
- **C perd :**
  - la propriété et toutes ses appartenances ;
  - ses appartenances aux groupes de l'espace et ses admissions ;
  - les habilitations, HI ou HP, dont il est bénéficiaire nominatif sur des cibles de l'espace ;
  - ses qualités de bénéficiaire et de gardien des protections de l'espace ;
  - ses droits de titulaire, selon les voies retenues.
- **Les HI**, y compris celles que C a signées et les nominations de RS, **demeurent** (I-8). K peut ensuite les clore (§ 7.4) ou les mettre en examen (§ 7.5).
- **Les HP de C** sur ses objets tombent, sauf réémission. Les HP de tiers fondées sur une chaîne qui passait par C suivent la règle de rupture (§ 8.2).
- **Protections :**
  - celles dont C était le seul gardien deviennent **orphelines**, sauf sur un objet en voie (b), dont K, nouveau titulaire, devient gardien ;
  - **aucune n'est révélée à K** (F-4) ;
  - les interdictions dont C est destinataire restent ce qu'elles sont : elles ne visent pas K (CD-21).
- Le **verrou de réintégration** de C est posé (§ 10.8).

### 10.8 Après le transfert : verrou de réintégration (CD-03)

Toute **HI**, admission ou admission automatique qui donnerait à C un droit sur le contenu de l'espace exige le **consentement explicite du propriétaire** :
- une appartenance ;
- une délégation ;
- une admission ;
- une entrée par `notification`.

Le verrou ne vise pas les HP qu'un titulaire accorde à C sur ses propres objets personnels : le propriétaire n'a aucune autorité sur eux (A2).

## 11. Restrictions et protections d'existence

### 11.1 Création (E-4)

- **Restrictions internes** (embargo de contenu, interdiction d'action) et **protections d'existence** (embargo d'existence, interdiction d'existence) :
  - **seulement** le titulaire, pour un objet personnel, ou un RS, pour le contenu de l'espace dans son périmètre ;
  - jamais un administrateur, un collaborateur, ni le propriétaire en tant que tel ;
  - le créateur ne peut pas être destinataire de sa propre interdiction.
- Une protection peut viser tout acteur, y compris un RS ou la racine. Elle ne fait tomber aucune habilitation (§ 2.5). Son créateur la lève seul s'il en est l'unique gardien.

### 11.2 Gardiens

- **Le créateur est gardien**, et bénéficiaire pour un embargo.
- **Désigner un gardien :** un gardien peut désigner un autre gardien parmi les acteurs qui détiennent un droit de contenu sur la cible, abstraction faite des protections (CD-17). Pour un embargo, le désigné devient aussi bénéficiaire.
- **Perte de la qualité de gardien :** un gardien qui ne détient plus **aucun** droit de contenu sur la cible, abstraction faite des protections, cesse d'être gardien. C'est le cas d'un départ, d'une révocation ou d'un transfert. Il cesse aussi d'être bénéficiaire, sauf désignation explicite distincte.
- **Pas de gardien d'office.** Une protection sans gardien est **orpheline** : elle reste en vigueur.
  - L'autorité de dérogation peut, sur la demande d'un RS (contenu de l'espace) ou du titulaire, désigner un gardien. Il faut deux approbateurs.
  - Le désigné doit détenir un droit de contenu sur la cible, abstraction faite des protections.
  - À défaut, la cible n'est accessible que par une dérogation, après la désignation d'un gardien.

### 11.3 Bénéficiaires d'un embargo

- Ils sont ajoutés par un gardien, jamais par eux-mêmes.
- Pour un groupe bénéficiaire, chaque membre doit être agréé par un gardien (§ 9.5).
- **Être bénéficiaire ne confère aucun droit** : cela soustrait seulement à la protection, et les droits ordinaires s'appliquent ensuite.

### 11.4 Destinataires d'une interdiction

Ils sont désignés par un gardien, à la création ou plus tard. Une interdiction d'existence leur cache la cible ; une interdiction d'action leur retire les actions désignées.

### 11.5 Levée

- Restriction interne ou protection d'existence : par un gardien, et par lui seul (CD-06).
- Aucune dérogation ne lève une protection.

### 11.6 Restrictions légales (Q2, E-7)

- **Création :** par l'autorité de dérogation, avec deux approbateurs, sur un fondement documenté ; ou enregistrement à la demande d'une autorité externe identifiée.
- **Référence structurée :**
  - nature ;
  - fondement ;
  - portée ;
  - période de validité ;
  - **autorité compétente pour la lever**, qui ne peut pas être l'un des créateurs (A3).
- **Levée :** par l'autorité compétente désignée seulement.
- **Contestation :**
  - le titulaire, ou un RS pour le contenu de l'espace, peut contester la qualification ;
  - deux approbateurs distincts des créateurs l'examinent ;
  - la restriction reste en vigueur pendant l'examen ;
  - l'issue est soit le **maintien**, soit l'**annulation** pour erreur de qualification.

## 12. Dérogation (Q3, E-6, F-3)

### 12.1 Accès ordinaire et dérogation

Un accès que les §§ 6 à 9 autorisent n'est pas une dérogation. Il n'exige aucun approbateur : un titulaire consulte son objet sans formalité.

### 12.2 Autorité de dérogation (ST-15)

- Un rôle de plateforme dont la **liste nominative** est tenue hors de tout espace.
- Ses membres sont des personnes physiques, d'identité vérifiée au niveau renforcé.
- Les rôles d'exploitation de la plateforme ne donnent **aucun** accès aux données métier : tout accès d'un membre du personnel à un contenu passe par une dérogation (rappel de ST-15).

### 12.3 Niveau d'approbation requis

Il se calcule sur la cible, **à l'instant de chaque évaluation** (CD-08).

| La cible, à l'instant de l'évaluation | Requis |
|---|---|
| est un objet personnel non public ; ou est sensible (DI-E05) ; ou est frappée, pour le bénéficiaire, par une restriction interne ou une protection d'existence | **Deux approbateurs indépendants** (§ 12.7) |
| est frappée par une protection d'existence | En plus, l'**accord d'un gardien** de chaque protection d'existence qui frappe le bénéficiaire. Une protection orpheline doit d'abord recevoir un gardien (§ 11.2). |
| n'est rien de ce qui précède | Un approbateur, pour une finalité de la liste fermée « diagnostic technique » ou « vérification d'intégrité » ; sinon deux |
| est frappée par une restriction non levable | Aucune dérogation possible |

Une dérogation dont les approbations ne satisfont plus le niveau requis, par exemple après la pose d'une protection, ne couvre plus la cible : l'évaluation se poursuit sans elle.

### 12.4 Contenu

- **Bénéficiaire nominatif**, qui n'est pas l'un des approbateurs.
- **Finalité déclarée.** Un usage hors finalité est refusé et journalisé.
- **Périmètre :** les objets nécessaires, listés.
- **Opérations :** `voir`. `exporter` seulement s'il est demandé et approuvé explicitement. Jamais `éditer`, `valider`, `repartager` ni `administrer`.
- **Durée** au plus égale à `DUREE_MAX_DEROGATION` (§ 16).
- **Journalisation** de chaque usage, renforcée lorsqu'une protection d'existence est franchie.
- Aucune habilitation n'en découle.

### 12.5 Révocation

Un membre de l'autorité de dérogation peut révoquer une dérogation à tout moment.

### 12.6 Renouvellement (plafond à tester, non gelé)

- Un renouvellement est une **nouvelle** dérogation, avec une **nouvelle justification**, distincte de la précédente, et de **nouvelles** approbations au niveau requis.
- **Consécutive :** une dérogation de même bénéficiaire, de même finalité, dont le périmètre recoupe celui d'une précédente, et qui commence avant la fin de celle-ci augmentée du délai de carence `CARENCE_RENOUVELLEMENT`.
- Au plus `RENOUVELLEMENTS_MAX` = **2** renouvellements consécutifs. Au-delà, la demande est refusée jusqu'à l'écoulement du délai de carence.

### 12.7 Indépendance des approbateurs

Deux approbateurs sont indépendants s'ils remplissent toutes les conditions suivantes :
- personnes distinctes ;
- comptes distincts ;
- aucune subordination déclarée entre eux ;
- aucun lien d'intérêt avec le dossier : appartenance à l'espace concerné, ou lien déclaré avec l'objet ;
- aucun n'est le bénéficiaire.

La fraude d'identité (deux identités vérifiées contrôlées par une même personne) est un **résidu documenté**.

## 13. Mécanismes

### 13.1 Règles d'accès et public

Une règle est une HI ou une HP. Son signataire ou son auteur est figé.

Un bénéficiaire `public` ne peut être désigné :
- que par le titulaire (objet personnel) ou un RS (contenu) ;
- après une évaluation de diffusabilité favorable ;
- sous les protections.

Un collaborateur qui détient `repartager` ne désigne pas le public.

### 13.2 Visibilité (E-5)

| Opération | Qui | Conditions |
|---|---|---|
| Modifier les données | Détenteur d'`éditer` | Aucun effet sur l'audience ni sur le titulaire. |
| Élargir (`projet` → `communauté` → `public`, ou `privé` → `communauté` → `public`) | Titulaire (objet personnel) ; RS (contenu) | C'est un partage : `repartager` requis. Diffusabilité favorable pour `communauté` et `public`. |
| Élargir `privé` → `projet` | — | C'est un versement (§ 6.3). |
| Réduire | Titulaire ; RS | Les habilitations explicites sont maintenues : seule l'audience par défaut est réduite. Les bénéficiaires de l'audience par défaut sont notifiés. Le contenu de l'espace ne descend jamais sous `projet` : aucune réduction ne prive un RS ni un titulaire. |

Un détenteur d'`éditer` sans `repartager` ne change pas la visibilité.

### 13.3 Sélections partagées

- Une règle sur une sélection est une habilitation sur sa **version active**.
- Pour une HP, l'auteur doit détenir l'action et `repartager` sur chaque objet servi, à l'instant de l'évaluation. Pour une HI, chaque objet servi doit être du contenu de l'espace.
- Aucun accès si la sélection est `révoquée` ou `close`.
- **Modes d'inclusion** (DI-L21) : un objet `exclu` ou `masqué` n'est pas servi. Ni ses attributs, ni ses relations, ni les mentions de son nom ne sont observables (DI-L16).
- **Réduction :** elle se calcule sur la version active. Une proposition en attente n'est jamais servie.
- **Inclure une copie réutilisée** dans une sélection partagée exige que sa licence permette la redistribution, qu'aucune restriction ne la frappe et qu'aucun droit de tiers déclaré ne s'y oppose (DI-A41).

### 13.4 Lots

- Un lot est une habilitation sur une liste d'objets **figée à la création**.
- Il exclut toujours `valider`, `administrer`, `repartager` et la publication.
- Son échéance est obligatoire.
- Ajouter un objet au lot n'étend pas l'habilitation. La clôture du lot la clôt, et rouvrir le lot ne la réactive pas (DD-23.4).

### 13.5 Archivage et clôture

§ 5.1.

### 13.6 Séries de publications

Insérer une publication dans une série d'un **autre** espace exige l'acceptation d'un détenteur d'`administrer` sur l'espace de la série. Avant l'acceptation, l'insertion n'occupe aucun rang.

### 13.7 Unicités (TI-11)

- Aucune règle d'unicité ne s'applique à des éléments dont la visibilité diffère pour les acteurs qui peuvent tenter une création concurrente.
- **Base justificative :**
  - de portée `privée`, elle est unique **par auteur** ;
  - de portée `projet`, elle est unique par espace et par assertion, et visible des membres qui détiennent `voir` sur l'assertion, sous les protections (CD-22).
- Une violation d'unicité ne révèle jamais un élément invisible au demandeur.

### 13.8 Contributions et contributions différées (rappel de CP-27)

- Écrire (commenter, proposer, transcrire, éditer, contribuer) exige l'action correspondante, quel qu'en soit le fondement, sélection comprise.
- Une opération hors ligne est d'abord **reçue**, puis **intégrée** seulement après une réévaluation de l'accès **à l'instant de l'intégration**.
- **Refusée** pour raison de droits, elle est conservée et reste lisible par son **seul auteur**. Elle ne contient que le **delta** saisi, jamais l'état de base : elle ne réexpose rien de retiré.

### 13.9 Hors ligne (D-4, rappel de CP-28)

- Une réplique ne contient que des objets que l'acteur peut voir. Les objets dont l'existence lui est protégée n'y figurent jamais.
- Toute réplique contenant une **donnée protégée** porte une **échéance locale opposable**, y compris dans un espace à membre unique.
  - Est donnée protégée tout objet qui n'est pas à la fois public et librement redistribuable, y compris les objets personnels du titulaire.
  - L'échéance est le minimum de :
    - `ECHEANCE_HORS_LIGNE_MAX` (plafond de la plateforme) ;
    - le paramètre de l'espace, qui ne dépasse jamais ce plafond ;
    - l'échéance plus courte qu'impose l'habilitant d'une habilitation.
- **Retraits :** à la synchronisation, le serveur transmet d'abord les retraits, sous une forme non qualifiée, et le client les applique avant toute autre opération. Les contributions locales ne sont jamais détruites ; elles passent par le § 13.8.
- **Résidu reconnu :** entre une révocation et la synchronisation, au plus jusqu'à l'échéance locale. Il s'écarte du CDCF § 122.2, qui demande un retrait immédiat (limite, § 17).

### 13.10 Caches (rappel de CP-40)

- La décision d'accès est la seule source d'autorisation.
- Toute écriture qui affecte un droit incrémente une **époque**, et une décision en cache n'est servie que si son époque est l'époque courante.
- Une décision en cache n'est jamais servie au-delà de la plus proche échéance de ses fondements.

### 13.11 Réutilisation

- `réutiliser` permet de créer une copie autonome liée par `FILIATION`, dont le copieur est titulaire.
- La copie survit à la révocation de l'habilitation qui l'a permise (DI-A38).
- Sa redistribution suit le § 13.3 (DI-A41).

### 13.12 Rôles de plateforme

§ 12.2.

### 13.13 Rattachement de projets

- Un rattachement n'est **jamais un fondement** (CD-05).
- Il peut seulement **conditionner** une habilitation. Si le rattachement prend fin, l'habilitation conditionnée est close (T-13). Un nouveau rattachement ne la réactive pas (A4).

### 13.14 Campagnes

- En phase indépendante, chaque participant ne voit que ses propres réponses : c'est un cloisonnement temporaire (§ 2.4).
- Une participation exige une personne reliée à un acteur identifié.

## 14. Évaluation d'un accès

Pour un contexte (acteur, instant, opération, finalité) et une cible :

| Étape | Contrôle | Issue |
|---|---|---|
| 0 | La cible existe-t-elle (non purgée) ? | Sinon : **introuvable**. |
| 1 | **Restriction non levable** | Si oui : **refus**, ou **introuvable** si l’acteur n’en connaîtrait pas l’existence (définition sous la table). Aucune dérogation ne la franchit. |
| 2 | **Dérogation** active de l'acteur, qui couvre la cible, l'opération et la finalité, et dont les approbations satisfont **à cet instant** le niveau du § 12.3 | Si oui : accord limité à la dérogation, journalisé ; passer à l'étape 7. |
| 3 | **Protections d'existence** qui frappent l'acteur | Si oui : **introuvable**, indistinguable d'une absence. |
| 4 | **Restrictions internes** pour l'opération | Si oui : **refus**, ou **introuvable** si l’acteur n’en connaîtrait pas l’existence (définition sous la table). |
| 5 | **Droits** : titulaire ; rôles ; HI effectives ; HP effectives ; admissions. Les actions d'écriture sont exclues dans un espace archivé ou clos. | Si un droit accorde : accord ; passer à l'étape 7. |
| 6 | **Visibilité par défaut** : `public` donne `voir` à tous ; `communauté` donne `voir` à tout acteur identifié. | Si elle accorde : accord ; passer à l'étape 7. Sinon : **refus** si l’acteur connaît l’existence de la cible, **introuvable** sinon. |
| 7 | **Rendu** | Modes d'inclusion, masquages, mentions filtrées, protection DI-E05. |

**Connaître l’existence d’une cible** : ne pas être frappé par une protection d’existence, et détenir un droit sur la cible ou la voir par sa visibilité par défaut, **abstraction faite des restrictions** (§ 2.3). Un acteur frappé par un embargo de contenu ou une interdiction d’action reçoit donc « refus », jamais « introuvable » : la restriction ne cache pas l’existence.

En cas d'échec de vérification, à n'importe quelle étape : **introuvable** (A6, I-14).

## 15. Observations et non-divulgation

Une **observation** est tout ce qu'un acteur peut constater du système. I-5 s'applique à chacune d'elles.

| Surface | Règle |
|---|---|
| Consultation, recherche, parcours de relations | Seulement les cibles que l'acteur voit (§ 14). |
| Totaux, compteurs, pagination | Calculés après exclusion. |
| Métadonnées et journaux de gouvernance | § 10.3. |
| Explication des accès | Jamais pour une cible dont l'existence est protégée pour le lecteur. |
| Présentation d'un transfert | § 10.6. |
| Erreurs | Une cible invisible et une cible inexistante produisent la même erreur et le même délai (TI-11). Une habilitation dont toutes les cibles sont invisibles, ou une protection sur une cible invisible, est elle-même traitée comme inexistante ; une habilitation à cibles mixtes est réduite à ses cibles visibles (§ 10.3). |
| Identifiants | Opaques : ils ne révèlent ni ordre ni nombre. Le modèle utilise des identifiants séquentiels pour la lisibilité seulement. |
| Export | Ne contient, ne liste ni ne compte rien d'invisible. |
| Réplique hors ligne | § 13.9. |
| Unicités | § 13.7. |

## 16. Paramètres

| Paramètre | Valeur | Statut |
|---|---|---|
| `DUREE_MAX_DEROGATION` | 30 jours | Candidat, à confirmer lors de la conception technique et juridique |
| `RENOUVELLEMENTS_MAX` | 2 | À tester dans le modèle, non gelé (F-3) |
| `CARENCE_RENOUVELLEMENT` | 30 jours dans le modèle | À fixer au MPD |
| `ECHEANCE_HORS_LIGNE_MAX` | 30 jours dans le modèle | À fixer au MPD |
| `EXPIRATION_PRESENTATION` | 14 jours dans le modèle | À fixer au MPD |
| `PROFONDEUR_MAX` | 16 dans le modèle | Borne des dépendances d'autorisation seulement (CP-40) |

## 17. Arbitrages, ajouts et limites

### 17.1 Arbitrages intégrés

| # | Arbitrage | Clauses |
|---|---|---|
| Q1, D-1 | Trois voies pour les objets personnels du cédant ; blocage plutôt qu'invisibilité ; copie sans déplacement de l'original | § 10.5 |
| Q2, E-7 | Restrictions légales | § 11.6 |
| Q3, D-3, E-6, **F-3** | Dérogation : niveau calculé à l'évaluation ; deux approbateurs dès qu'une protection, un objet personnel ou une donnée sensible est en jeu ; accord du gardien pour l'existence ; deux renouvellements au plus (à tester) | § 12 |
| Q4 | Nomination d'un RS par un pair | § 7.2 |
| D-4 | Échéance hors ligne | § 13.9 |
| E-1, **F-2** | Pas d'auto-élévation, ni directe ni réciproque | A3 ; § 9.4 ; I-2 ; I-3 |
| E-2 | Appartenance, admission aux droits et admission à une protection | § 9 |
| E-3 | Propriétaire unique et administratif ; espace préparé pour un tiers ; succession hors moteur | § 10.1 ; § 10.4 |
| E-4 | Création des protections par le titulaire ou un RS | § 11.1 |
| E-5 | Quatre opérations sur la visibilité | § 13.2 |
| E-8, **F-4** | Engagements, aperçu, scellé d'audit ; gel des élargissements ; renouvellement neutre ; aucune révélation au cessionnaire ; aucun veto implicite d'un tiers | § 10.6 ; § 10.7 |
| **F-1** | Autorité institutionnelle de l'espace ; survie des HI ; révocation par la racine ; mise en examen ciblée sans suspension collective | § 2.1 ; § 7.4 ; § 7.5 ; § 10.7 |
| **F-5** | Modèle de référence exécutable, préalable au gel | En-tête ; § 4 |
| CC-20 | Pas de `valider` pour le titulaire | § 6.1 |
| CC-28, CD-03 | Verrou de réintégration du cédant, étendu à toute HI et à toute admission | § 10.8 |

### 17.2 Ajouts de l'auteur, non arbitrés

Ils sont soumis à la validation du porteur :
- **pas de gardien d'office** : une protection dont le créateur part devient orpheline, et seule l'autorité de dérogation peut lui désigner un gardien (§ 11.2). Cela remplace le « gardien d'office » de la V1.3, incompatible avec F-1 et F-4 ;
- une protection peut viser un RS ou la racine, sans effet de cascade (§ 11.1, § 2.5) ;
- l'archivage, la réouverture et la clôture sont réservés au propriétaire (§ 5.1) ;
- l'élargissement d'un objet `privé` au niveau `projet` vaut versement (§ 13.2, § 6.3) ;
- le RS détient `contribuer au Core`, sous réserve de diffusabilité (§ 7.1) ;
- une HI au profit d'un rôle de son propre espace n'exige pas d'admission (§ 9.2) ;
- le gel des élargissements pendant la présentation (§ 10.6) ;
- une procédure à un seul approbateur, réservée à une liste fermée de finalités (§ 12.3).

### 17.3 Limites assumées

- Fraude d'identité entre approbateurs (§ 12.7).
- Résidu hors ligne borné par l'échéance, en écart avec le CDCF § 122.2 (§ 13.9).
- Un objet qui disparaît de l'aperçu ou des engagements d'une présentation est indistinguable d'une clôture, d'une purge ou d'un changement de visibilité. C'est le même résidu que pour tout membre (CP-28).
- Droits déclarés sur les fichiers externes (§ 6.2).
- Paramètres à fixer au MPD (§ 16).
