# GENIIUS — Contrat d'autorisation

**Version :** **V1.5 — candidat, non gelé** (11 octobre 2026).

Révision selon :
- les arbitrages G-1 à G-11 du porteur et ses trois règles transversales (instruction des contrôles V1.4, § 6) ;
- les corrections sans arbitrage du § 4.1 de cette instruction.

La V1.4 est archivée dans `AUDIT-MLD/historique/GENIIUS_CONTRAT_AUTORISATION_V1_4.md`.

**Statut normatif :**
- une fois gelé, ce contrat **prime** sur toute règle d'accès du dictionnaire et du MLD ;
- il remplacera la DD-28 du dictionnaire, dont les actions par défaut du RS divergent du § 7 ;
- les contraintes d'accès du MLD seront réécrites comme ses conséquences.

**Composants :**

| Composant | Emplacement | Rôle |
|---|---|---|
| Ce texte | ici | **Référence.** En cas d'écart entre le texte et le modèle, le texte prime et l'écart est un constat. |
| Modèle de référence exécutable | `spec/autorisation/modele.py` | Implémente ce texte. Ce n'est pas le logiciel de production. |
| Batterie de scénarios V1.5 | `AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_5.md`, générée depuis `spec/autorisation/tests/` | Base de régression, pas une couverture exhaustive. |
| Tests de non-régression des attaques | `spec/autorisation/tests/test_attaques.py` | Une attaque reproductible par test, avec un oracle indépendant du modèle. |
| Tests de propriétés, de transitions et de combinaisons | `spec/autorisation/tests/` | Vérifient les invariants du § 4 sur des états générés, avec comptage des états atteints. |
| Banc de mutations | `spec/autorisation/mutations/` | Altère une règle de sécurité du modèle et vérifie qu'un test échoue. |

**Critère de gel** (décision du porteur, renforcée le 11/10/2026) :
- aucun constat bloquant ou majeur ne subsiste ;
- aucun scénario dont le résultat attendu exige d'inventer une règle absente de ce texte ;
- les scénarios de sécurité disposent d'**oracles indépendants du modèle testé** : un test ne déduit jamais le résultat attendu d'une fonction du modèle ;
- les invariants sont vérifiés sur les **transitions pertinentes**, et les états qu'ils visent sont effectivement atteints (comptages publiés) ;
- **aucune mutation survivante** affectant une règle de sécurité ne demeure sans justification documentée et acceptée par le porteur ;
- tous les tests automatisés réussissent. Leur nombre n'est pas une preuve : le taux de détection des mutations, la qualité des oracles et la couverture des transitions critiques s'examinent ensemble, et ne remplacent pas le contrôle indépendant du texte.

**Justification recevable d'une mutation survivante** (proposée par l'auteur, soumise au porteur) :
- **Équivalence démontrée :** le mutant et le modèle donnent les mêmes observations (§ 15) dans tout état atteignable. La démonstration est écrite, et une sonde la confirme.
- **Défense redondante déclarée :** la règle mutée est doublée par une autre règle **du contrat**, testée par ailleurs ; le registre nomme cette règle et son test. Une redondance que le contrat ne déclare pas n'est pas recevable.
- **Hors sécurité :** la mutation ne touche qu'une donnée sans effet sur un accès, une existence, un droit, un pouvoir ou une trace (par exemple un libellé de journal).

**Jamais recevables :** « difficile à tester », « peu probable », « couvert en pratique ». Les justifications sont tenues dans `spec/autorisation/mutations/JUSTIFICATIONS.md`, une ligne par mutation, avec la décision du porteur.

---

## 1. Vocabulaire

| Terme | Définition |
|---|---|
| **Acteur** | Titulaire d'un compte. Il est relié à une **personne** : plusieurs comptes peuvent appartenir à la même personne. Un acteur institutionnel n'est relié à aucune personne. |
| **Personne ; « soi »** | Dans tout le contrat, « soi », « lui-même », « son propre » et « le même acteur » désignent **la personne** : tout compte relié à la même personne (G-1). |
| **Identité établie** | Identité vérifiée au niveau renforcé, qui permet de rattacher le compte à une personne. Une identité qui ne l'est pas ne permet aucune opération sensible (§ 3, A3). |
| **Espace** | Unité de gouvernance. États : `actif`, `archivé`, `clos` (§ 5.1). |
| **Contenu de l'espace** | Objets de l'espace **sans titulaire**. Visibilités possibles : `projet`, `communauté`, `public`. |
| **Objet personnel** | Objet qui a un **titulaire**. Visibilités possibles : `privé`, `communauté`, `public`. Un « objet `privé` » est un objet personnel de visibilité `privé`. |
| **Régime d'une cible** | Soit le contenu d'un espace donné, soit les objets personnels d'un titulaire donné dans un espace donné. |
| **Action** | Opération sur une cible : `voir`, `commenter`, `proposer`, `transcrire`, `éditer`, `valider`, `exporter`, `réutiliser`, `contribuer au Core`. Les **actions d'écriture** sont `commenter`, `proposer`, `transcrire`, `éditer`, `valider` et `contribuer au Core`. |
| **Droit** | Le fait, pour un acteur, de pouvoir exécuter une action sur une cible à un instant donné. |
| **Droit effectif** | Droit dont tous les fondements sont actifs à l'instant considéré. Un droit peut être **inopérant** (un fondement est suspendu ; il peut redevenir effectif), **expiré** ou **clos** (définitivement). |
| **Pouvoir de partage** (`repartager`) | Faculté d'accorder à autrui les actions que l'on détient. Détenir `voir` ne permet pas de faire voir. |
| **Pouvoir de gouvernance** (`administrer`) | Opérations du § 10.2 et lecture des métadonnées du § 10.3. Ce n'est ni une action ni un pouvoir de partage. |
| **Propriétaire** | L'acteur unique qui détient la propriété administrative d'un espace. |
| **Responsable scientifique (RS)** | Rôle qui porte l'autorité scientifique sur le contenu de l'espace, sur tout ce contenu ou sur un **périmètre** (§ 7). |
| **Racine** | Le propriétaire, dans sa fonction de RS, attribuée par le système. Tout espace non clos a exactement une racine. |
| **Titulaire** | Acteur à qui le système attribue les droits sur un objet personnel (§ 6). |
| **Habilitation** | Acte qui confère des droits à un bénéficiaire. Deux catégories : **institutionnelle** (HI) et **personnelle** (HP) (§ 2). |
| **Signataire** | RS qui a créé une HI. Son identité est conservée (A7), mais l'HI n'en dépend pas. |
| **Auteur, fondateur** | Auteur : acteur qui a créé une HP. Fondateurs : l'auteur, plus tout acteur qui l'a prolongée ou confirmée (§ 8). |
| **Bénéficiaire** | Acteur, groupe, rôle d'un espace, ou `public`. |
| **Ensemble ouvert** | Bénéficiaire dont la composition change sans acte de l'habilitant : un groupe, ou un rôle d'un espace. |
| **Gestionnaire d'un ensemble ouvert** | Qui en décide la composition :<br>• pour un groupe, le propriétaire et les administrateurs de l'espace du groupe ;<br>• pour un rôle, les RS de l'espace du rôle. |
| **Admission** | Acte nominatif par lequel un membre d'un ensemble ouvert bénéficie effectivement d'une habilitation (§ 9). |
| **Restriction** | Retire des droits sur une cible dont l'existence reste observable pour qui la connaissait (§ 2.3). |
| **Protection d'existence** | Rend une cible inexistante pour ceux qu'elle frappe (§ 2.4). |
| **Gardien** | Acteur habilité à gérer une restriction interne ou une protection d'existence et à la lever (§ 11.2). |
| **Dérogation** | Accès exceptionnel, borné et journalisé, qui laisse la protection en place (§ 12). |
| **Périmètre** | Ensemble délimité de cibles **d'un seul régime** (G-5) :<br>• un objet ;<br>• une liste fermée d'objets (lot) ;<br>• le contenu d'un espace ;<br>• la version active d'une sélection.<br>Jamais « tout ce qui sera ajouté plus tard » à une sélection ou à un lot (P24). |
| **Copie réutilisée** | Objet créé par `réutiliser`, lié à son original par une `FILIATION` vérifiable (§ 13.11). |

## 2. Les quatre catégories

| | **Habilitation institutionnelle (HI)** | **Habilitation personnelle (HP)** | **Restriction** | **Protection d'existence** |
|---|---|---|---|---|
| Effet | Confère des droits sur le contenu d'un espace ou un rôle scientifique | Confère des droits que l'auteur détient personnellement | Retire des droits ; l'existence reste observable | Rend la cible inexistante pour ceux qu'elle frappe |
| Créée par | Un RS actif de l'espace, dans son périmètre | Tout détenteur effectif de l'action et de `repartager` | Titulaire ou RS (internes) ; autorité de dérogation ou autorité externe (légales) | Titulaire ou RS ; le système (cloisonnement, gel de succession) |
| Fondement | **L'autorité scientifique de l'espace** | La **chaîne enracinée** de ses fondateurs | L'acte de ses gardiens, ou une base légale | L'acte de ses gardiens, ou une procédure légale |
| Sort au départ de son auteur | **Survit** | Close si plus aucun fondateur n'est valide | Survit | Survit |
| Fin | Clôture (§ 7.4), expiration | Clôture, expiration, rupture de la chaîne | Levée par un gardien ou par l'autorité compétente | Levée par un gardien, ou fin de la procédure |

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
| **Restriction légale** | Retire toutes les actions. | L'autorité compétente (§ 11.6), ou l'annulation après contestation |
| **Consentement refusé ou retiré, effacement légal** | Retire toutes les actions. | Aucune décision interne |
| **Purge** | L'objet n'existe plus. | — |

Les **trois** dernières lignes sont dites **non levables** par une décision interne.

### 2.4 Protections d'existence

| Protection | Qui elle frappe | Levée |
|---|---|---|
| **Embargo d'existence** | Tous, sauf ses bénéficiaires effectifs | Un gardien |
| **Interdiction d'existence** | Ses destinataires | Un gardien |
| **Cloisonnement temporaire** (campagne en phase indépendante) | Chaque participant, pour les réponses des autres | Fin de la phase |
| **Gel de succession** (§ 10.4) | Tous, sur les objets personnels non publics d'une personne décédée | Décision de la procédure de succession |

### 2.5 Ce que les catégories ne font pas

- **Une restriction ou une protection n'est jamais une perte de droit** pour la survie des HP **existantes**. Elle bloque l'accès de qui elle frappe, sans faire tomber les habilitations qu'il a créées ou fondées.
- **Mais elle interdit de déléguer** ce qu'elle retire (G-7) : on ne crée, ne prolonge, ne confirme et n'admet qu'au titre d'actions que l'on peut **effectivement** exécuter, protections comprises (§ 8.1, § 7.2).
- **L'autorité de l'espace** ne lève aucune protection et ne donne aucun accès à un objet personnel d'autrui ni à un contenu protégé (F-1).
- **La gouvernance** ne donne aucun droit de contenu (A2).

## 3. Principes

**A1 — Nul ne donne ce qu'il n'a pas.**
- **HP :** l'auteur, puis chaque fondateur, détient chaque action accordée, `repartager`, et un périmètre et une durée au moins aussi larges, au moment de l'acte **et** à chaque évaluation. À l'acte, ces actions doivent lui être **effectivement** exécutables (§ 2.5).
- **HI :** à l'acte, le signataire est un RS actif dont le périmètre et la durée couvrent l'habilitation, les actions accordées font partie de celles du RS (§ 7.1) et lui sont effectivement exécutables. Ensuite, l'HI est bornée par l'autorité de l'espace : sa cible doit rester du contenu de l'espace, et, pour une sélection, dans le **périmètre du signataire à l'acte** (§ 13.3).

**A2 — Gérer n'est pas lire.**
- `administrer`, la propriété et la gestion d'un ensemble ouvert ne confèrent aucun droit sur les contenus, leurs versions, leurs preuves, leurs relations protégées ou leurs représentations dérivées.
- Ils ne confèrent aucun pouvoir de partage.

**A3 — Nul n'augmente ses propres droits ni ses pouvoirs** (G-1, G-2).
- « Soi » s'entend de la **personne** (§ 1).
- **Interdits :**
  - se créer une habilitation ;
  - s'ajouter à un groupe ou à un rôle, s'admettre ;
  - se déclarer bénéficiaire ou gardien d'une protection existante (le créateur d'une nouvelle protection en est gardien par le § 11.2 : cela ne lui donne aucun droit) ;
  - se nommer, se désigner autorité compétente, s'accorder une dérogation ;
  - être admis, automatiquement ou non, à une habilitation dont on est le signataire ou l'auteur ;
  - être admis automatiquement lorsqu'un pouvoir de gestion permettrait de s'habiliter indirectement (§ 9.4).
- **Contrôle par les effets** (règle transversale 1) : une suite d'actes, chacun permis isolément, ne peut produire une augmentation de droits que ces interdits proscrivent. Les chaînes croisées et les délégations réciproques sont traitées comme l'acte direct qu'elles reconstituent (§ 9.4, § 8.2).
- **Permis :** une habilitation au profit d'un groupe, d'un rôle ou du public dont l'habilitant fait partie. Elle ne lui donne rien : il n'y est jamais admis.
- **Accepter** une nomination ou un transfert n'est pas une auto-attribution : l'attribution émane d'un autre acteur ou du système.
- **Identité insuffisamment établie** (G-1) : pour les opérations sensibles, on refuse plutôt que de présumer l'indépendance ou la distinction des personnes. Sont sensibles : les approbations (§ 10.4, § 11.2, § 11.6, § 12), la nomination d'un RS et la nomination d'un administrateur.

**A4 — Pas de résurrection** (règle transversale 2).
- La clôture, l'expiration et la rupture sont **définitives**.
- Prolongation, admission, transfert, réouverture, restauration, réimport ou nouveau rattachement ne réactivent jamais une habilitation close ou expirée.
- Seul un nouvel acte conforme à A1 et à A3 crée un droit.
- Une **suspension** rend inopérant sans éteindre. À sa levée, un droit ne redevient effectif que si tous ses fondements sont encore valides et qu'aucune clôture, révocation ou expiration n'est intervenue entre-temps.

**A5 — Les protections priment.**
- Elles s'appliquent avant toute autorisation, propriétaire et administrateurs compris.
- Le seul contournement est la dérogation (§ 12). Elle ne franchit jamais une restriction non levable.
- Une copie hérite des protections opposables de son original (§ 13.11) : une copie n'est jamais un moyen de blanchir des droits.

**A6 — Révocation effective, échec fermé** (rappel de CP-40) :
- une décision d'accès est évaluée sur un état d'habilitation qui ne peut ignorer aucune révocation déjà effective ;
- les caches sont coordonnés avec la prise d'effet ;
- chaque page, reprise ou étape d'une opération longue est réévaluée ;
- une impossibilité de vérifier vaut **refus**, indistinguable d'une absence. Un échec d'évaluation ne modifie jamais l'état (il ne clôt, ne retire et ne désigne rien).

**A7 — Traçabilité.** Aucun acte n'efface ni ne réécrit l'identité de qui a accordé, confirmé, prolongé, suspendu, retiré ou clos une habilitation ou une protection, ni la paternité d'un objet, ni la filiation d'une copie.

## 4. Invariants

Ils valent dans **tout** état atteignable. Les tests les vérifient sur des états générés et sur les transitions qui peuvent les violer, avec des oracles indépendants du modèle.

| ID | Invariant |
|---|---|
| **I-1** Propriété | Tout espace non clos a exactement un propriétaire, qui est aussi sa racine (RS attribué par le système). |
| **I-2** Pas d'auto-élévation | Pour toute **personne** p et tout acte dont un compte de p est l'auteur, autre qu'une acceptation, les droits, pouvoirs de partage, pouvoirs de gouvernance et qualités de bénéficiaire ou de gardien de **tous les comptes de p**, sur les cibles, espaces et protections qui existaient avant l'acte, sont inclus après l'acte dans ceux d'avant. Ne sont pas des élévations : les attributions du système à la création d'un objet, d'un espace ou d'une protection ; la réouverture d'un espace et la levée d'un examen, qui rétablissent, sans les dépasser, des droits que l'archivage ou la suspension avaient rendus inopérants. |
| **I-3** Pas d’élévation réciproque | Aucune suite d’actes dont les auteurs ne sont que des gestionnaires d’ensembles ouverts bénéficiaires, en `notification`, d’habilitations portant sur un même espace E, ou des détenteurs d’`administrer` sur E, n’augmente les droits de contenu de l’un d’eux (personne) sur E, que ces ensembles relèvent d’un ou de plusieurs espaces. Un tiers que ces gestionnaires font entrer dans un ensemble reste admis selon le § 9.3 : c’est l’effet voulu de la `notification`. |
| **I-4** Pas d'accès implicite par la propriété ou la gouvernance | Le propriétaire et les administrateurs n'ont accès à aucun objet personnel d'autrui ni à aucune cible protégée pour eux, sauf par une HP explicite, une admission, une dérogation ou la visibilité par défaut de la cible. |
| **I-5** Non-divulgation d'existence | Pour tout acteur x et tout objet O dont l'existence est protégée pour x, toutes les observations de x (§ 15), réponses d'opérations et notifications comprises, sont identiques à celles qu'il aurait si O n'existait pas. |
| **I-6** Révocation effective | Après la clôture, l'expiration, la restriction ou la suspension d'une habilitation h, après la sortie d'un ensemble ou le retrait d'une admission, aucun accès en ligne qui ne reposait que sur ce qui a cessé n'est accordé, cache compris. Hors ligne, le résidu est borné par l'échéance locale (§ 13.9) ; un accès obtenu par dérogation n'est jamais répliqué. |
| **I-7** Pas de résurrection | Aucune transition ne fait passer une habilitation, une admission ou une dérogation de `close`, `expirée` ou `révoquée` à `active`. |
| **I-8** Continuité au transfert | Au transfert de C à K, un acteur y ≠ C ne perd que les accès qui reposaient exclusivement sur des HP dont la chaîne passait nécessairement par C et qui n'ont pas été réémises, ou sur un objet que C a purgé par la voie retenue. Aucune HI, aucune nomination autre que l'appartenance antérieure de K, et aucune protection d'un tiers ne disparaît. |
| **I-9** Primauté des protections | Aucun accès ne franchit une restriction ou une protection d'existence qui frappe l'acteur, sauf par une dérogation dont le niveau d'approbation satisfait les protections présentes à l'instant de l'évaluation. Aucun accès ne franchit une restriction non levable. Aucune copie n'est accessible à qui l'original est caché ou interdit par une protection héritée. |
| **I-10** Chaîne enracinée | Toute HP effective a au moins un fondateur valide dont le droit remonte, sans passer par cette HP, à une attribution par le système ou à une HI effective. |
| **I-11** Atomicité | Une acceptation de transfert applique tous ses effets ou n'en applique aucun. |
| **I-12** Gardiens | Tout gardien d'un embargo en est bénéficiaire. Personne ne devient gardien que par la création de la protection, la désignation par un gardien, la procédure de l'autorité de dérogation, l'héritage d'une copie (gardiens de l'original) ou le transfert d'un objet par la voie (b). Il n'y a pas de gardien d'office. |
| **I-13** Dérogation bornée | Une dérogation ne permet jamais `éditer`, `valider`, `repartager` ni `administrer`. Elle respecte sa durée maximale, la liste fermée des finalités et le nombre maximal de renouvellements consécutifs (§ 12.6). |
| **I-14** Échec fermé | Si une évaluation ne peut conclure (profondeur, cycle, donnée indisponible), la décision est un refus, et l'état n'est pas modifié. |

## 5. États et transitions

### 5.1 Espace

| Transition | Auteur | Effet |
|---|---|---|
| `actif` → `archivé` | Le propriétaire | Voir la table ci-dessous. |
| `archivé` → `actif` | Le propriétaire | Rétablit les droits non expirés et traite les admissions automatiques différées. Ne réactive aucune habilitation close entre-temps (A4). |
| `actif` ou `archivé` → `clos` | Le propriétaire | Définitif. Mêmes effets que l'archivage, sans réouverture ni transfert. |

| Dans un espace archivé ou clos | Contenu de l'espace | Objets personnels |
|---|---|---|
| Lecture | Permise | Permise |
| Actions d'écriture | **Fermées** | Permises au titulaire seulement |
| Nouvelle habilitation, prolongation, confirmation | **Fermées** | Permises au titulaire (HP) |
| Admission, manuelle ou automatique | **Fermée** ; les admissions automatiques sont différées jusqu'à la réouverture | Idem |
| Élargissement de visibilité | **Fermé** | **Fermé** |
| Clôture, restriction, suspension, retrait, départ, réduction de visibilité | Permis | Permis |
| Création, levée de protections ; désignation de gardiens | Permises | Permises |
| Copie autonome, purge autorisée, versement | — | Copie et purge permises ; versement fermé |
| Transfert (réémissions comprises) | Permis dans un espace archivé, fermé dans un espace clos | — |
| Dérogations en lecture | Permises | Permises |

### 5.2 Habilitation

États : `proposée` (nomination RS non encore acceptée), `active`, `suspendue` (HI seulement), `close`, `expirée`.

Une habilitation `active` peut être **inopérante** : un de ses fondements, ou une HI de sa chaîne, est suspendu. L'inopérance n'est pas un état stocké : elle s'évalue (règle transversale 2).

| ID | Transition | De → vers | Auteur | Condition |
|---|---|---|---|---|
| T-01 | Créer | ∅ → `active`, ou `proposée` pour une nomination RS | Signataire (HI) ou auteur (HP) | § 7.2 ou § 8.1 ; A3 ; protections ; § 5.1 ; § 10.8 ; gel du § 10.6 |
| T-02 | Accepter une nomination RS | `proposée` → `active` | Le nommé | Gel du § 10.6 |
| T-03 | Refuser une nomination RS | `proposée` → `close` | Le nommé | — |
| T-04 | Prolonger | `active` → `active` | HI : tout RS qui pourrait la signer. HP : un acteur qui remplit A1 et en devient fondateur | Non expirée (A4) ; § 5.1 ; gel |
| T-05 | Restreindre (actions, périmètre, échéance) | `active` → `active` | Comme la clôture, **sauf le bénéficiaire** | — |
| T-06 | Confirmer (HP) | `active` → `active` | Acteur qui remplit A1 sans passer par cette HP | Sinon refus (cycle) ; gel |
| T-07 | Mettre en examen | `active` → `suspendue` | La racine | HI seulement (§ 7.5) |
| T-08 | Lever l'examen | `suspendue` → `active` | La racine | Non expirée ; gel |
| T-09 | Clore | `proposée`, `active` ou `suspendue` → `close` | § 7.4 (HI) ; § 8.3 (HP) | — |
| T-10 | Expirer | → `expirée` | Le temps | Échéance atteinte |
| T-11 | Rompre (HP) | `active` → `close` | Le système | Plus aucun fondateur valide, **suspensions mises à part** (§ 8.2) |
| T-12 | Retirer son fondement (HP) | `active` → `active` ou `close` | Un fondateur | Si c'était le dernier fondateur valide : T-11 |
| T-13 | Fin d'un rattachement | `active` → `close` | Le système | Habilitation conditionnée par ce rattachement (§ 13.13) |

### 5.3 Admission

États : `active`, `close`.

Une admission est close par :
- son retrait (§ 9.3) ;
- la sortie du membre de l'ensemble (une **suspension** de l'appartenance n'est pas une sortie : l'admission est inopérante, non close) ;
- la clôture, l'expiration ou la rupture de son habilitation ;
- pour une admission manuelle au titre d'une HP, la rupture de la chaîne de l'acteur qui l'a prononcée, **qu'il soit ou non fondateur** de l'HP.

Un retour dans l'ensemble exige une **nouvelle** admission. Le retrait, par l'habilitant, d'une admission **existante** exclut l'admission automatique de ce membre pour cette habilitation (§ 9.4).

### 5.4 Protection

États : `active`, `levée`.

| Transition | Auteur |
|---|---|
| Créer | § 11.1 ; le système pour une copie (§ 13.11) et pour le gel de succession (§ 10.4) |
| Ajouter un bénéficiaire, un destinataire, un membre agréé | Un gardien, jamais à son profit |
| Désigner un gardien | Un gardien (§ 11.2) ; l'autorité de dérogation, pour une protection orpheline |
| Perdre la qualité de gardien | Le système (§ 11.2) |
| Devenir orpheline | Le système ; signalement d'office à l'autorité de dérogation (§ 11.2) |
| Lever | Un gardien ; l'autorité compétente (restriction légale) ; l'annulation après contestation ; la décision de succession (gel) |

### 5.5 Dérogation

`demandée` → `active` (approbations réunies) → `expirée` | `révoquée`. Un renouvellement est une **nouvelle** dérogation (§ 12.6).

### 5.6 Transfert

`préparé` → `présenté` → `accepté`.
- Un transfert présenté peut être `annulé` par le cédant.
- Une présentation dont le délai est écoulé est `expirée` : l'acceptation est refusée, et **seul le cédant** peut présenter de nouveau. K ne relance rien.

### 5.7 Objet personnel

| Transition | Effet |
|---|---|
| **Versement** au contenu de l'espace | Par renonciation, par élargissement au niveau `projet` ou par la voie (a) d'un transfert. Exige l'accord d'un RS. Fin du droit de titulaire ; la paternité est conservée (§ 6.3). |
| **Changement de titulaire** | Uniquement par la voie (b) du transfert (§ 10.5). La paternité est conservée. |
| **Gel de succession** | Au décès constaté du titulaire (§ 10.4). |
| **Purge** | § 6.3. |

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

- **Droit de créer** : il exige l'appartenance `collaborateur` ou `RS` à l'espace, et un espace actif.
  - Un invité qui détient `proposer` par une HI ne crée que des **propositions**.
  - Un lecteur, un invité sans délégation, un administrateur ou le propriétaire en tant que tels ne créent rien.
- **Titulaire** :
  - pour une activité manuelle ou assistée, son réalisateur ;
  - pour un import, le **déposant**, qui doit avoir le droit de créer et déclarer les droits sur ses entrées.
- **Lancer un import** n'est pas créer. Un acteur ne lance un import pour un déposant qu'avec un **mandat** de ce déposant pour cet espace (CT-31). Le déposant peut lancer lui-même.
- Un **objet personnel exige un titulaire.** Une activité automatique sans déposant identifiable ne crée pas d'objet personnel : la création est refusée.
- Les droits sur un fichier externe sont **déclarés** par le déposant. La plateforme ne vérifie pas la propriété intellectuelle externe : c'est un résidu documenté.

### 6.3 Droit de titulaire

- Aucun acteur ne le crée, ne le prolonge ni ne le modifie.
- Il **ne dépend d'aucune appartenance.** Un titulaire qui quitte l'espace, ou qui en est exclu, garde ses objets personnels et ses droits sur eux.
  - Il ne peut plus y créer d'objet.
  - Les RS sont informés de son départ.
- Il s'éteint :
  - par la purge de l'objet ;
  - par le **versement** (renonciation ou élargissement au niveau `projet`), qui exige l'accord d'un RS ;
  - par la voie (b) d'un transfert.
- **Purge :** demandée par le titulaire. Elle est refusée si une obligation de conservation, une restriction légale ou un gel de succession s'y oppose. Sans versement possible ni purge autorisée, la renonciation est refusée.
- **Au versement** :
  - les HP du titulaire sur l'objet tombent, sauf celles qu'un RS reprend nominativement en HI. Une reprise :
    - est faite à l'identique ou plus étroite (actions, échéance, bénéficiaire) ;
    - est signée par un RS dont le périmètre couvre l'objet ;
    - n'est jamais faite par un RS qui en serait bénéficiaire (A3) ;
    - crée une nouvelle habilitation liée à l'ancienne (« réémission de ») ;
  - les protections dont le titulaire était le seul gardien suivent le § 11.2 : elles deviennent **orphelines** si l'ancien titulaire ne détient plus aucun droit de contenu sur l'objet.

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
  - le signataire est un RS actif de l'espace, d'identité établie pour la nomination d'un RS ;
  - son périmètre et sa durée couvrent ceux de l'habilitation ;
  - les actions accordées font partie de celles du RS et lui sont **effectivement** exécutables sur chaque cible présente du périmètre (G-7) ;
  - toutes les cibles existent, sont du contenu de l'espace et sont connues du signataire (§ 14) ;
  - l'espace est actif ;
  - A3 est respecté (personne) ;
  - le verrou de réintégration (§ 10.8) et le gel du transfert (§ 10.6) sont respectés.
- **Nomination d'un RS (Q4) :**
  - elle est nominative et porte au plus sur le périmètre du signataire ;
  - elle est **acceptée** par le nommé ;
  - elle ne donne aucun accès aux objets personnels d'autrui.

### 7.3 Effets

L'HI est effective si :
- elle est `active`, ni suspendue ni expirée ;
- sa cible est du contenu de l'espace ; pour une sélection, l'objet figure dans la version active **et** dans le périmètre du signataire à l'acte (§ 13.3).

Le maintien du signataire n'est **pas** une condition.

### 7.4 Clôture et restriction d'une HI

| HI | Peut la clore | Peut la restreindre |
|---|---|---|
| Nomination d'un RS | Son signataire, tant qu'il est RS de l'espace ; **la racine** ; le nommé lui-même (départ) | Son signataire, tant qu'il est RS ; la racine |
| Toute autre HI | Son signataire, tant qu'il est RS ; tout RS dont le périmètre la couvre ; la racine ; le bénéficiaire nominatif (renonciation) | Les mêmes, **sauf le bénéficiaire** |
| Rôle de racine | Personne ; il ne cesse qu'au transfert ou à la clôture de l'espace | Personne |

Un acteur ne peut agir sur une habilitation dont il ne connaît pas l'existence d'au moins une cible (§ 14), sauf s'il la voit dans les métadonnées de gouvernance (§ 10.3). La réponse est alors indistinguable d'une absence.

### 7.5 Mise en examen ciblée (F-1, G-8)

- La racine peut **mettre en examen** toute HI de l'espace dont elle connaît la cible. L'HI est aussitôt **suspendue** : elle ne confère plus rien, et l'aval est **inopérant** : les HP dont la chaîne passe par elle, et les admissions prononcées à son titre, ne confèrent plus rien. L'aval n'est **ni clos ni détruit**.
- L'examen se termine :
  - par une **confirmation** de la racine, qui la rétablit (tracée) ; l'aval redevient effectif s'il est encore valide (A4) ;
  - ou par une **clôture**, qui ferme l'aval selon les règles ordinaires (rupture, § 8.2).
- Il n'existe aucune suspension automatique et collective des actes d'un RS, même révoqué pour abus. À la révocation d'un RS, la racine reçoit la liste des HI qu'il a signées, et elle choisit celles qu'elle examine.

### 7.6 Départ

- Un membre autre que la racine peut quitter l'espace à tout moment. Ses appartenances prennent fin, et ses nominations **proposées** non acceptées sont closes ; les HI qu'il a signées **survivent**.
- Avant son départ, il peut désigner un autre gardien pour les protections dont il est le seul gardien (§ 11.2).
- La racine ne quitte l'espace que par un transfert ou par la clôture de l'espace.
- Le décès ou l'indisponibilité durable de la racine relève de la procédure de succession (§ 10.4).

## 8. Habilitations personnelles

### 8.1 Création

Conditions, toutes requises :
1. **A1 :** l'auteur détient chaque action accordée et `repartager`, sur un périmètre qui couvre celui accordé.
2. **Exécution effective (G-7) :** chaque action accordée est effectivement exécutable par l'auteur sur chaque cible présente du périmètre, protections comprises : aucune protection d'existence, restriction ou restriction non levable ne la lui retire.
3. **A3** (personne), y compris le refus des cycles (§ 8.2).
4. **Durée :** l'échéance accordée ne dépasse pas celle des droits de l'auteur.
5. **Redélégation :** `repartager` n'est transmis que s'il est accordé explicitement.
6. **Régime unique (G-5) :** toutes les cibles relèvent d'un même régime.
7. **Espace actif** pour une cible du contenu d'un espace (§ 5.1).
8. **Copie réutilisée :** sa redistribution suit le § 13.11.

### 8.2 Fondateurs et chaîne

- **Fondateurs :**
  - l'auteur ;
  - tout acteur qui a **prolongé** ou **confirmé** l'HP en remplissant lui-même les conditions 1, 2 et 4.

  Chaque fondateur couvre l'HP jusqu'à sa propre échéance.
- **Fondateur valide à l'instant t :** il détient, à t, les actions et `repartager` sur le périmètre, par une chaîne qui remonte à une attribution par le système ou à une HI, **sans passer par cette HP**.
- **Effectivité :** l'HP est effective si au moins un fondateur est valide et si aucune HI de sa chaîne n'est suspendue ; sinon, elle est inopérante.
- **Portée effective :** l'union des couvertures des fondateurs valides.
- **Rupture :** si plus aucun fondateur n'est valide, **les suspensions étant tenues pour levées**, l'HP est **close**, définitivement (A4). Une suspension seule ne rompt donc jamais une chaîne (G-8).
- **Cycles :**
  - une confirmation par un acteur dont le droit passe par l'HP qu'il confirme est refusée ;
  - une HP au profit d'une personne située en amont de la chaîne de l'auteur est refusée ;
  - la profondeur d'évaluation est bornée (I-14).

### 8.3 Actes

| Acte | Auteur |
|---|---|
| Clore | L'auteur ; le titulaire de la cible ; pour une cible du contenu d'un espace, tout RS de cet espace dont le périmètre la couvre ; le **bénéficiaire nominatif** (renonciation, CT-15) |
| Restreindre | Les mêmes, **sauf le bénéficiaire** |
| Retirer son fondement | Un fondateur (T-12) |
| Prolonger, confirmer | § 5.2, T-04 et T-06 |
| Admettre (§ 9) | Un acteur qui remplit les conditions 1 et 2. Il est le fondateur de **cette admission seulement**. |

## 9. Ensembles ouverts et admission (E-2, F-2, G-2)

### 9.1 Appartenance à un ensemble

- **Groupe :** ses gestionnaires y ajoutent ou en retirent des membres, jamais eux-mêmes (personne).
- **Rôle :** il est conféré par les RS de son espace (§ 7.1).

L'appartenance seule ne confère aucun droit.

### 9.2 Quand une admission est requise

Une habilitation au profit d'un ensemble ouvert exige une admission, **sauf** une HI au profit d'un rôle de son propre espace : la composition de ce rôle est alors décidée par la même autorité qui accorde.

Une HP d'un titulaire au profit d'un rôle de son propre espace exige donc une admission.

### 9.3 Modes d'admission

Le mode est choisi par l'habilitant.

- **`approbation préalable`** (mode par défaut) : un membre ne bénéficie de l'habilitation qu'après une admission nominative prononcée par :
  - un RS de l'espace (HI) ;
  - ou un acteur qui remplit les conditions 1 et 2 du § 8.1 (HP).

  C'est le **seul mode admis** pour un objet personnel non public, pour un objet sensible (DI-E05) et pour une cible sous restriction ou protection. Si une cible **devient** protégée ou sensible, les habilitations en `notification` qui la visent **basculent** en `approbation préalable` ; les admissions déjà prononcées demeurent (CT-27).
- **`notification`** : une autorisation **anticipée** de l'habilitant. Tout nouveau membre est admis automatiquement, dans les limites de l'habilitation, sauf les exclusions du § 9.4.
  - Pour une HI, les **RS de l'espace** de l'habilitation sont notifiés de chaque entrée ; pour une HP, l'auteur est notifié. Personne d'autre ne l'est.
  - Ils peuvent retirer l'admission.

### 9.4 Exclusions de l'admission automatique (F-2, G-2)

Ne sont jamais admis automatiquement, et doivent recevoir une admission nominative d'un autre acteur que soi :
- le **signataire** ou l'**auteur** de l'habilitation (personne) — il n'y est jamais admis, ni automatiquement ni manuellement ;
- un **gestionnaire de l'ensemble** bénéficiaire ;
- un **gestionnaire de tout ensemble ouvert** bénéficiaire, en `notification`, d'une habilitation qui porte sur le **même espace** : son pouvoir de gestion lui permettrait de s'habiliter indirectement par un échange de membres (chaînes croisées) ;
- le **cédant** d'un transfert de l'espace de l'habilitation, sous verrou de réintégration (§ 10.8) ;
- un membre dont l'admission à cette habilitation a été **retirée** par l'habilitant.

Les exclusions s'apprécient **par personne**, au moment de l'admission. Deux administrateurs ou deux gestionnaires, d'un même ensemble ou d'ensembles différents, qui s'ajoutent mutuellement n'en tirent aucun droit (I-3).

### 9.5 Admission à une protection d'existence

Lorsqu'un groupe est bénéficiaire d'un embargo d'existence, un de ses membres n'en devient bénéficiaire effectif qu'avec l'**agrément d'un gardien**. Ajouter un tiers au groupe ne lève rien.

## 10. Propriété, gouvernance, transfert

### 10.1 Propriété

- Chaque espace a un **propriétaire unique**, désigné par la création ou par un transfert.
- La propriété est **administrative** (A2). Le propriétaire lit le contenu de l'espace parce qu'il en est la racine, sous réserve des protections. Il ne lit jamais un objet personnel d'autrui sans HP, admission, dérogation ou visibilité par défaut (I-4).
- **Opérations réservées au propriétaire :**
  - transférer (§ 10.4) et désigner la garde ;
  - nommer et révoquer les administrateurs ;
  - archiver, rouvrir et clore l'espace ;
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

Les protections **ne figurent pas** dans cette liste (CM-26).

**Exclusions**, appliquées à chacune de ces lignes :
- tout élément qui porte **seulement** sur des objets dont l'existence est protégée pour le lecteur. Un élément qui porte à la fois sur des cibles visibles et cachées est présenté **réduit à ses cibles visibles**, sans indication de réduction ;
- les HP qui portent sur un **objet personnel**, sauf pour son titulaire.

Les listes, compteurs et paginations sont calculés **après** exclusion.

**Jamais :** un contenu, une version, une preuve, une relation protégée, une représentation dérivée.

### 10.4 Autorité de transfert, garde et succession

- Seul le **propriétaire** transfère.
- **Espace préparé pour un tiers :** il porte une désignation de garde (`DESIGNATION_GARDE`) au profit d'un bénéficiaire futur. Tant qu'elle est en vigueur, un transfert ne peut être proposé qu'à ce bénéficiaire. Le propriétaire peut la **modifier** par un acte tracé avant de transférer à un autre (CT-29).
- **Décès** (G-9) :
  - il est constaté par deux approbateurs indépendants de l'autorité de dérogation (§ 12.7), sur un fondement documenté ;
  - à ce constat, les objets personnels **non publics** du défunt, dans tous les espaces, sont placés sous **gel de succession** (§ 2.4) : nul n'y accède, même par une HP antérieure, sauf par dérogation ; aucun nouveau partage, aucune publication, aucun versement, aucun transfert automatique de lecture ;
  - le gel n'est levé que par une **décision de succession** : deux approbateurs, un fondement documenté (volontés du défunt, fondement légal, obligation applicable), et un sort par objet : maintien du gel, purge autorisée, versement à l'espace avec l'accord d'un RS, ou changement de titulaire au profit d'un ayant droit désigné, qui l'accepte.
- **Succession de la propriété** (décès, indisponibilité durable, perte de capacité) : une procédure distincte, que le moteur n'improvise jamais.
  - Elle exige une désignation de garde préalable, ou un fondement légal enregistré.
  - Deux approbateurs indépendants de l'autorité de dérogation l'examinent. Le **dossier**, au sens du § 12.7, est l'espace et ses objets.
  - Elle aboutit à un **transfert ordinaire**, présenté puis accepté. Les objets personnels gelés du défunt y suivent la voie **(g) : maintien du gel**, sans changement de titulaire ni d'espace.

  À défaut de désignation ou de fondement légal, l'espace reste en l'état.

### 10.5 Préparation

**Objets personnels du cédant C dans l'espace.** Avant la présentation, C retient, objet par objet ou en bloc, l'une des voies suivantes :
- **(a) Versement** à l'espace : l'acceptation par K, qui devient RS, vaut l'accord d'un RS.
- **(b) Changement de titulaire** au profit de K. K doit accepter explicitement chaque objet, ou le bloc. L'objet doit être visible de K dans la présentation : la voie (b) est refusée au cédant pour un objet que K ne voit pas. La **paternité de C est conservée** (A7).
- **Purge** autorisée (§ 6.3).
- **(g) Maintien du gel**, pour les objets gelés d'un cédant décédé (§ 10.4).

En complément de (a) ou de (b) :
- **(c) Copie autonome** dans l'espace personnel de C, liée par `FILIATION`. Elle exige que la licence permette la copie, et qu'aucune restriction ni protection ne porte sur l'objet. L'original ne change jamais d'espace (DI-A01).

**Blocage :** un objet sans voie retenue, ou dont une voie retenue est impossible, empêche l'acceptation. La cause n'est signalée **qu'au cédant**.
- La présentation est refusée au cédant tant qu'un objet n'a pas de voie.
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

Les **admissions** reprises sont au plus les admissions **actives de l'HP d'origine** au moment de l'annonce ; à l'acceptation, ne sont reprises que celles qui sont encore actives et que ni une exclusion (§ 9.4) ni le verrou (§ 10.8) n'écartent.

Une réémission dont l'HP d'origine n'est plus active au moment de l'acceptation est **abandonnée** : elle disparaît des engagements (c'est un retrait), et l'acceptation n'échoue jamais pour cette cause (CT-09).

Les **HI** n'ont pas à être réémises : elles survivent (F-1).

### 10.6 Présentation (E-8, F-4, G-3)

Elle comprend trois parties.

| Partie | Contenu | Rôle |
|---|---|---|
| **Engagements** (vue du cessionnaire) | • Les habilitations de l'espace que K pourra voir et gérer : HI, et HP sur le contenu de l'espace ; leurs bénéficiaires désignés (un groupe ou un rôle **désigné**, jamais la composition d'un rôle d'un autre espace) ; leurs actions, périmètres (objets servis compris pour une sélection), échéances, modes et états ; les admissions.<br>• Les membres, leurs rôles, les administrateurs, la composition des groupes de l'espace.<br>• Les restrictions et protections visibles de K sur le contenu de l'espace.<br>• Les voies retenues pour les objets personnels de C visibles de K.<br>• Les réémissions annoncées. | Référence de l'acceptation, par **inclusion** (ci-dessous). |
| **Aperçu** | Les objets que K pourra voir. | Informatif. Recalculé à chaque affichage. |
| **Scellé d'audit** | La totalité des engagements, protections invisibles à K comprises. | Archivé pour l'audit. Il n'est **jamais** une cause de refus observable par K. |

**Ce qui n'apparaît jamais à K :**
- un élément dont l'existence lui est protégée ; une habilitation à cibles mixtes est réduite à ses cibles visibles (§ 10.3) ;
- leur nombre, ou tout indice indirect.

**Acceptation par inclusion (G-3).** L'acceptation vaut si les engagements **effectifs** au moment de l'acceptation sont **couverts** par ceux présentés, comparés sur leur **portée réelle** :
- chaque habilitation, appartenance, admission, membre de groupe, administrateur, voie et réémission courante figure dans la présentation ;
- pour chacune : même bénéficiaire et même signataire ou auteur ; actions incluses ; `repartager` non ajouté ; périmètre inclus (objets servis compris) ; échéance non plus lointaine ; mode non plus ouvert (`notification` est plus ouvert qu'`approbation préalable`) ; état non plus fort (`active` est plus fort que `suspendue` et `proposée`) ;
- chaque restriction ou protection présentée existe toujours (une levée est un élargissement).

Ce qui a été **retiré** depuis la présentation ne bloque rien : la liste des retraits visibles est notifiée à K après l'acceptation. Un engagement **nouveau ou élargi** n'est jamais accepté inaperçu : l'acceptation est refusée avec le motif « présentation renouvelée », et le cédant présente de nouveau.

**Gel des élargissements** pendant la fenêtre de présentation (CT-17) :
- est refusé, avec le motif « espace en cours de transfert », **tout acte dont l'effet** ajouterait un élément aux engagements ou en élargirait un, au sens de l'inclusion ci-dessus : création, nomination, acceptation de nomination, nomination d'administrateur, prolongation, confirmation, levée d'examen, admission, ajout à un groupe de l'espace, versement avec reprise, levée d'une protection visible, changement de voie ou de réémission ;
- le gel s'apprécie sur l'**effet** de l'acte (règle transversale 1) : un acte sans effet sur les engagements, par exemple une HP d'un titulaire tiers sur son objet personnel, n'est pas gelé ;
- une admission **automatique** qui surviendrait pendant la fenêtre est **différée** à la fin de celle-ci, puis traitée selon le § 9.4 ;
- restent permis les actes qui **retirent** : clôture, restriction, suspension, retrait d'une admission ou d'un membre, départ, création d'une protection.

**Aucun tiers ne peut empêcher l'acceptation :** les retraits ne bloquent pas, et les élargissements sont gelés. Les modifications de la composition d'un rôle d'un autre espace ne font pas partie des engagements.

**Expiration :** une présentation expire après un délai fixé (§ 16). L'acceptation d'une présentation expirée est refusée ; seul le cédant présente de nouveau (§ 5.6).

### 10.7 Acceptation : une seule transaction

**Conditions :**
- K est le bénéficiaire vérifié ;
- la présentation n'est pas expirée, et K accepte la présentation en vigueur (son empreinte) ;
- les engagements effectifs sont couverts par la présentation (§ 10.6) ;
- aucun blocage ;
- chaque réémission maintenue est conforme : à l'identique ou plus étroite, conforme à A1 sur les droits que K reçoit ;
- aucune restriction non levable ne frappe un objet en voie (b) ou (c).

Si une seule condition échoue, **rien** n'est appliqué (I-11).

**Effets :**
- K devient **propriétaire** et **racine**. Une appartenance antérieure de K à l'espace est remplacée.
- **C perd :**
  - la propriété et toutes ses appartenances ;
  - ses appartenances aux groupes de l'espace et ses admissions ;
  - les habilitations, HI ou HP, dont il est bénéficiaire nominatif sur le **contenu** de l'espace, et les HP qu'il tient d'une chaîne passant par ce contenu. Les HP que des **titulaires tiers** lui ont accordées sur leurs **objets personnels** sont également closes : ce point (CT-28) reste à arbitrer ;
  - ses qualités de bénéficiaire et de gardien des protections de l'espace ;
  - ses droits de titulaire, selon les voies retenues.
- **Les HI**, y compris celles que C a signées et les nominations de RS, **demeurent** (I-8). K peut ensuite les clore (§ 7.4) ou les mettre en examen (§ 7.5).
- **Les HP de C** sur ses objets tombent, sauf réémission. Les HP de tiers fondées sur une chaîne qui passait par C suivent la règle de rupture (§ 8.2).
- **Protections :**
  - celles dont C était le seul gardien deviennent **orphelines** (§ 11.2), sauf sur un objet en voie (b), dont K, nouveau titulaire, devient gardien ;
  - **aucune n'est révélée à K** (F-4) ;
  - les interdictions dont C est destinataire restent ce qu'elles sont : elles ne visent pas K.
- Les retraits visibles depuis la présentation sont notifiés à K.
- Le **verrou de réintégration** de C est posé (§ 10.8).

### 10.8 Après le transfert : verrou de réintégration (CT-06)

Toute habilitation, **HI ou HP**, et toute admission, manuelle ou automatique, qui donnerait à C (personne) un droit sur le **contenu** de l'espace exige le **consentement explicite du propriétaire**.

Le verrou ne vise pas les HP qu'un titulaire accorde à C sur ses propres objets personnels : le propriétaire n'a aucune autorité sur eux (A2).

## 11. Restrictions et protections d'existence

### 11.1 Création (E-4)

- **Restrictions internes** (embargo de contenu, interdiction d'action) et **protections d'existence** (embargo d'existence, interdiction d'existence) :
  - **seulement** le titulaire, pour un objet personnel, ou un RS, pour le contenu de l'espace dans son périmètre ;
  - jamais un administrateur, un collaborateur, ni le propriétaire en tant que tel ;
  - le créateur ne peut pas être destinataire de sa propre interdiction.
- Une protection peut viser tout acteur, y compris un RS ou la racine. Elle ne fait tomber aucune habilitation existante (§ 2.5).
- Le système crée en outre les protections **héritées** par une copie (§ 13.11) et le **gel de succession** (§ 10.4).

### 11.2 Gardiens

- **Le créateur est gardien**, et bénéficiaire pour un embargo.
- **Désigner un gardien :** un gardien peut désigner un autre gardien parmi les acteurs qui détiennent un droit de contenu sur la cible, abstraction faite des protections. Pour un embargo, le désigné devient aussi bénéficiaire.
- **Perte de la qualité de gardien :** un gardien qui ne détient plus **aucun** droit de contenu sur la cible, abstraction faite des protections **et des suspensions**, cesse d'être gardien. C'est le cas d'un départ, d'une révocation ou d'un transfert. Il cesse aussi d'être bénéficiaire, sauf désignation explicite distincte. Un échec d'évaluation ne retire jamais un gardien (A6).
- **Pas de gardien d'office.** Une protection sans gardien est **orpheline** : elle reste en vigueur.
- **Signalement d'office (G-10) :** le passage d'une protection à l'état orphelin est **signalé d'office à l'autorité de dérogation**, et à elle seule. Le signalement ne donne ni accès à la cible, ni pouvoir de lever la protection.
- **Désignation contrôlée :** l'autorité de dérogation, saisie par le signalement ou par la demande d'un RS (contenu) ou du titulaire, peut désigner un gardien, avec deux approbateurs indépendants (§ 12.7). Le désigné doit détenir un droit de contenu sur la cible, abstraction faite des protections. À défaut, la cible n'est accessible que par une dérogation, après la désignation d'un gardien.

### 11.3 Bénéficiaires d'un embargo

- Ils sont ajoutés par un gardien, jamais par eux-mêmes.
- Pour un groupe bénéficiaire, chaque membre doit être agréé par un gardien (§ 9.5).
- **Être bénéficiaire ne confère aucun droit** : cela soustrait seulement à la protection, et les droits ordinaires s'appliquent ensuite.

### 11.4 Destinataires d'une interdiction

Ils sont désignés par un gardien, à la création ou plus tard. Une interdiction d'existence leur cache la cible ; une interdiction d'action leur retire les actions désignées.

### 11.5 Levée

- Restriction interne ou protection d'existence : par un gardien, et par lui seul.
- Aucune dérogation ne lève une protection.
- La levée d'une protection sur un original ne lève pas la protection héritée par ses copies (§ 13.11).

### 11.6 Restrictions légales (Q2, E-7)

- **Internes :** créées par l'autorité de dérogation, avec deux approbateurs indépendants, sur un fondement documenté. L'autorité compétente pour les lever est désignée à la création et ne peut être aucun des créateurs (A3).
- **Externes :** enregistrées à la demande d'une autorité externe identifiée. Elles sont levées par cette autorité émettrice, ou par une décision qui l'emporte, enregistrée de la même manière (CT-23).
- **Référence structurée :**
  - nature ;
  - fondement ;
  - portée ;
  - période de validité ;
  - autorité compétente pour la lever.
- **Contestation :**
  - le titulaire, ou un RS pour le contenu de l'espace, peut contester la qualification ;
  - deux approbateurs indépendants (§ 12.7), distincts des créateurs, l'examinent ;
  - la restriction reste en vigueur pendant l'examen ;
  - l'issue est soit le **maintien**, soit l'**annulation**, qui vaut levée.

## 12. Dérogation (Q3, E-6, F-3, G-11)

### 12.1 Accès ordinaire et dérogation

Un accès que les §§ 6 à 9 autorisent n'est pas une dérogation. Il n'exige aucun approbateur : un titulaire consulte son objet sans formalité.

### 12.2 Autorité de dérogation (ST-15)

- Un rôle de plateforme dont la **liste nominative** est tenue hors de tout espace.
- Ses membres sont des personnes physiques, d'identité établie.
- Les rôles d'exploitation de la plateforme ne donnent **aucun** accès aux données métier : tout accès d'un membre du personnel à un contenu passe par une dérogation (rappel de ST-15).

### 12.3 Niveau d'approbation requis

Il se calcule sur la cible, **à l'instant de chaque évaluation**.

| La cible, à l'instant de l'évaluation | Requis |
|---|---|
| est un objet personnel non public ; ou est sensible (DI-E05) ; ou est frappée, pour le bénéficiaire, par une restriction interne ou une protection d'existence | **Deux approbateurs indépendants** (§ 12.7) |
| est frappée par une protection d'existence | En plus, l'**accord d'un gardien en fonction** de chaque protection d'existence qui frappe le bénéficiaire. Une protection orpheline doit d'abord recevoir un gardien (§ 11.2). Le gel de succession n'a pas de gardien : la dérogation exige alors deux approbateurs et le fondement de la procédure. |
| n'est rien de ce qui précède | Un approbateur, pour une finalité marquée « à un approbateur » dans la liste du § 12.4 ; sinon deux |
| est frappée par une restriction non levable | Aucune dérogation possible |

Une dérogation dont les approbations ne satisfont plus le niveau requis ne couvre plus la cible : l'évaluation se poursuit sans elle.

### 12.4 Contenu et finalités

- **Bénéficiaire nominatif**, qui n'est aucun des approbateurs (personne).
- **Finalité** choisie dans une **liste fermée, versionnée et contrôlée** par la gouvernance de la plateforme (`FINALITES`, § 16). Un texte libre complète la justification ; il ne crée jamais de nouvelle catégorie. Un usage hors finalité est refusé et journalisé.
- **Périmètre :** les objets nécessaires, listés.
- **Opérations :** `voir`. `exporter` seulement s'il est demandé et approuvé explicitement. Jamais `éditer`, `valider`, `repartager` ni `administrer`.
- **Durée** au plus égale à `DUREE_MAX_DEROGATION` (§ 16).
- **Journalisation** de chaque usage, renforcée lorsqu'une protection d'existence est franchie.
- **Aucune réplication hors ligne** (G-11) : un objet accessible au seul titre d'une dérogation n'entre jamais dans une réplique.
- Aucune habilitation n'en découle.

### 12.5 Révocation

Un membre de l'autorité de dérogation peut révoquer une dérogation à tout moment.

### 12.6 Renouvellement (plafond à tester, non gelé)

- Un renouvellement est une **nouvelle** dérogation, avec une **nouvelle justification**, distincte de la précédente, et de **nouvelles** approbations au niveau requis.
- **Consécutive :** une dérogation de même bénéficiaire (personne), dont le périmètre recoupe celui d'une précédente, **quelle que soit la finalité**, et qui commence avant la fin de la précédente augmentée du délai de carence `CARENCE_RENOUVELLEMENT`.
- Au plus `RENOUVELLEMENTS_MAX` = **2** renouvellements consécutifs. Au-delà, la demande est refusée jusqu'à l'écoulement du délai de carence.

### 12.7 Indépendance des approbateurs

Deux approbateurs sont indépendants s'ils remplissent toutes les conditions suivantes :
- personnes distinctes, d'identité établie ;
- aucune subordination déclarée entre eux ;
- aucun lien d'intérêt avec le **dossier** : appartenance, administration ou propriété d'un espace concerné, ou lien déclaré avec un objet concerné. Le dossier est l'ensemble des objets visés et des espaces qui les contiennent ; pour une succession ou un constat de décès, l'espace et les objets du défunt ;
- aucun n'est le bénéficiaire (personne).

Ces conditions s'appliquent à **toute** approbation du contrat : dérogation, désignation de gardien (§ 11.2), restriction légale et contestation (§ 11.6), constat de décès et succession (§ 10.4).

La fraude d'identité (deux identités établies contrôlées par une même personne) est un **résidu documenté**.

## 13. Mécanismes

### 13.1 Règles d'accès et public

Une règle est une HI ou une HP. Son signataire ou son auteur est figé.

Un bénéficiaire `public` :
- ne peut être désigné que par le titulaire (objet personnel) ou un RS (contenu) ;
- après une évaluation de diffusabilité favorable ;
- sous les protections ;
- ne reçoit que `voir`, `exporter` ou `réutiliser` (CT-21).

Un collaborateur qui détient `repartager` ne désigne pas le public.

### 13.2 Visibilité (E-5)

| Opération | Qui | Conditions |
|---|---|---|
| Modifier les données | Détenteur d'`éditer` | Aucun effet sur l'audience ni sur le titulaire. |
| Élargir (`projet` → `communauté` → `public`, ou `privé` → `communauté` → `public`) | Titulaire (objet personnel) ; RS (contenu) | C'est un partage : `repartager` requis. Diffusabilité favorable pour `communauté` et `public`. Espace actif (§ 5.1). |
| Élargir `privé` → `projet` | — | C'est un versement (§ 6.3). |
| Réduire | Titulaire ; RS | Les habilitations explicites sont maintenues : seule l'audience par défaut est réduite. La réduction est **notifiée** (avis général à l'audience perdue). Le contenu de l'espace ne descend jamais sous `projet`. |

Un détenteur d'`éditer` sans `repartager`, ou sans être titulaire ou RS, ne change pas la visibilité.

### 13.3 Sélections partagées (G-4)

- Une règle sur une sélection est une habilitation sur sa **version active**.
- Une sélection est **partagée** dès qu'une habilitation active la vise.
- **Ajouter** un objet à une sélection partagée crée une **proposition**, sans effet sur les accès. Seul l'**active** un acteur qui pourrait signer **chacune** des habilitations actives qui visent la sélection, pour les actions qu'elles accordent : un RS dont le périmètre couvre l'objet (HI) ; un acteur qui remplit les conditions 1 et 2 du § 8.1 sur l'objet (HP). L'activation est tracée.
- **Retirer** un objet de la version active est permis à l'auteur de la sélection, et à tout acteur qui peut clore l'une des habilitations qui la visent. Un objet retiré n'est jamais rétabli implicitement : le rajouter est une nouvelle proposition, qui suit la règle d'activation.
- Pour une **HP**, l'auteur doit détenir l'action et `repartager` sur chaque objet servi, à l'instant de l'évaluation.
- Pour une **HI**, chaque objet servi doit être du contenu de l'espace **et** compris dans le périmètre du signataire au moment de l'acte (A1).
- Aucun accès si la sélection est `révoquée` ou `close`.
- **Modes d'inclusion** (DI-L21) : un objet `exclu` ou `masqué` n'est pas servi. Ni ses attributs, ni ses relations, ni les mentions de son nom ne sont observables (DI-L16).
- Une proposition en attente n'est jamais servie.

### 13.4 Lots

- Un lot est une habilitation sur une liste d'objets **figée à la création**.
- Il exclut toujours `valider`, `administrer`, `repartager` et la publication.
- Son échéance est obligatoire.
- Ajouter un objet au lot n'étend pas l'habilitation. La clôture du lot la clôt, et rouvrir le lot ne la réactive pas (DD-23.4).

### 13.5 Archivage et clôture

§ 5.1.

### 13.6 Séries de publications

- Insérer une publication dans une série exige de **voir** la publication et d'être RS ou administrateur de son espace.
- Pour une série d'un **autre** espace, l'insertion exige l'acceptation d'un détenteur d'`administrer` sur l'espace de la série. Avant l'acceptation, l'insertion n'occupe aucun rang.
- Une publication invisible et une publication inexistante produisent la même réponse (§ 15).

### 13.7 Unicités (TI-11)

- Aucune règle d'unicité ne s'applique à des éléments dont la visibilité diffère pour les acteurs qui peuvent tenter une création concurrente.
- **Base justificative :**
  - de portée `privée`, elle est unique **par auteur** ;
  - de portée `projet`, elle est unique par espace et par assertion. Seul la crée un membre qui détient une action d'écriture sur l'assertion, dans un espace actif. Elle est visible des membres qui détiennent `voir` sur l'assertion, sous les protections.
- Une violation d'unicité ne révèle jamais un élément invisible au demandeur.

### 13.8 Contributions et contributions différées (rappel de CP-27)

- Écrire (commenter, proposer, transcrire, éditer, contribuer) exige l'action correspondante, quel qu'en soit le fondement, sélection comprise.
- Une opération hors ligne est d'abord **reçue**, puis **intégrée** seulement après une réévaluation de l'accès **à l'instant de l'intégration**.
- **Refusée** pour raison de droits, elle est conservée et reste lisible par son **seul auteur**. Elle ne contient que le **delta** saisi, jamais l'état de base.

### 13.9 Hors ligne (D-4, rappel de CP-28)

- Une réplique ne contient que des objets que l'acteur peut voir par un **accès ordinaire**. Les objets dont l'existence lui est protégée, et ceux qu'il ne voit qu'au titre d'une dérogation, n'y figurent jamais.
- Toute réplique contenant une **donnée protégée** porte une **échéance locale opposable**, y compris dans un espace à membre unique.
  - Est donnée protégée tout objet qui n'est pas à la fois public et librement redistribuable, y compris les objets personnels du titulaire.
  - L'échéance est le minimum de :
    - `ECHEANCE_HORS_LIGNE_MAX` (plafond de la plateforme) ;
    - le paramètre de l'espace, qui ne dépasse jamais ce plafond ;
    - l'échéance plus courte qu'impose l'habilitant d'une habilitation.
- **Retraits :** à la synchronisation, le serveur transmet d'abord les retraits, sous une forme non qualifiée. Les contributions locales ne sont jamais détruites ; elles passent par le § 13.8.
- **Résidu reconnu :** entre une révocation et la synchronisation, au plus jusqu'à l'échéance locale. Il s'écarte du CDCF § 122.2 (limite, § 17).

### 13.10 Caches (rappel de CP-40)

- La décision d'accès est la seule source d'autorisation.
- Toute écriture qui affecte un droit incrémente une **époque**, et une décision en cache n'est servie que si son époque est l'époque courante.
- Une décision en cache n'est jamais servie au-delà de la plus proche échéance de ses fondements.

### 13.11 Réutilisation et copies (G-6)

- `réutiliser` permet de créer une **copie réutilisée** dont le copieur est titulaire, liée à l'original par une `FILIATION` vérifiable et conservée (A7).
- La copie survit à la révocation de l'habilitation qui l'a permise (DI-A38).
- **Héritage des protections opposables** (règle transversale 3) :
  - à la création, la copie reçoit une **copie de chaque protection active** de l'original (restrictions, protections d'existence, restrictions légales), avec les mêmes bénéficiaires, destinataires et gardiens, et un lien « héritée de » ;
  - les restrictions non levables de l'original (consentement refusé ou retiré, effacement légal) s'appliquent à ses copies **pendant toute leur existence**, y compris celles posées après la copie (DI-A38 : une obligation légale prévaut) ;
  - la levée d'une protection sur l'original ne lève **pas** automatiquement la protection héritée : chacune est levée par ses propres gardiens, ou par l'autorité compétente, selon son fondement et sa portée ;
  - le copieur ne devient gardien d'une protection héritée que s'il l'était de l'original.
- **Redistribution :** toute redistribution d'une copie réutilisée, par HP, par inclusion dans une sélection partagée ou par élargissement de visibilité, exige que sa licence permette la redistribution, qu'aucune restriction ne la frappe et qu'aucun droit de tiers déclaré ne s'y oppose (DI-A41).

### 13.12 Rôles de plateforme

§ 12.2.

### 13.13 Rattachement de projets

- Un rattachement n'est **jamais un fondement**.
- Il peut seulement **conditionner** une habilitation. Si le rattachement prend fin, l'habilitation conditionnée est close (T-13). Un nouveau rattachement ne la réactive pas (A4).

### 13.14 Campagnes

- En phase indépendante, chaque participant ne voit que ses propres réponses : c'est un cloisonnement temporaire (§ 2.4).
- Une participation exige une **personne** reliée à un acteur identifié ; un acteur institutionnel ne participe pas.

## 14. Évaluation d'un accès

Pour un contexte (acteur, instant, opération, finalité) et une cible :

| Étape | Contrôle | Issue |
|---|---|---|
| 0 | La cible existe-t-elle (non purgée) ? | Sinon : **introuvable**. |
| 1 | **Restriction non levable**, y compris celles de l'original d'une copie | Si oui : **refus**, ou **introuvable** si l'acteur n'en connaîtrait pas l'existence. Aucune dérogation ne la franchit. |
| 2 | **Dérogation** active de l'acteur, qui couvre la cible, l'opération et la finalité, et dont les approbations satisfont **à cet instant** le niveau du § 12.3 | Si oui : accord limité à la dérogation, journalisé ; passer à l'étape 7. |
| 3 | **Protections d'existence** qui frappent l'acteur (gel de succession compris) | Si oui : **introuvable**, indistinguable d'une absence. |
| 4 | **Restrictions internes** pour l'opération | Si oui : **refus**, ou **introuvable** si l'acteur n'en connaîtrait pas l'existence. |
| 5 | **Droits effectifs** : titulaire ; rôles ; HI effectives ; HP effectives ; admissions. Les actions d'écriture sur le contenu sont exclues dans un espace archivé ou clos. | Si un droit accorde : accord ; passer à l'étape 7. |
| 6 | **Visibilité par défaut** : `public` donne `voir` à tous ; `communauté` donne `voir` à tout acteur identifié. | Si elle accorde : accord ; passer à l'étape 7. Sinon : **refus** si l'acteur connaît l'existence de la cible, **introuvable** sinon. |
| 7 | **Rendu** | Modes d'inclusion, masquages, mentions filtrées, filiation filtrée, protection DI-E05. |

**Connaître l'existence d'une cible** : ne pas être frappé par une protection d'existence, et détenir **un** droit effectif quelconque sur la cible, ou la voir par sa visibilité par défaut, **abstraction faite des restrictions** (§ 2.3). Un acteur frappé par un embargo de contenu ou une interdiction d'action reçoit donc « refus », jamais « introuvable » : la restriction ne cache pas l'existence.

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
| Réponses d'opérations | Une cible **invisible** (dont l'acteur ne connaît pas l'existence, § 14) et une cible inexistante produisent la même réponse et le même délai, **dans toute opération** : accès, délégation, nomination, admission, protection, sélection, série, unicité, référence. Une habilitation ou une protection dont l'acteur ne connaît aucune cible est elle-même traitée comme inexistante, sauf si elle lui est présentée par le § 10.3. |
| Notifications | Adressées aux seuls destinataires prévus par le contrat ; jamais à un tiers ; jamais sur une cible cachée au destinataire. |
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
| `FINALITES` | Liste fermée et versionnée ; version 1 du modèle : « diagnostic technique » et « vérification d'intégrité » (à un approbateur), « enquête », « demande légale », « succession » | À fixer par la gouvernance de la plateforme |
| `ECHEANCE_HORS_LIGNE_MAX` | 30 jours dans le modèle | À fixer au MPD |
| `EXPIRATION_PRESENTATION` | 14 jours dans le modèle | À fixer au MPD |
| `PROFONDEUR_MAX` | 16 dans le modèle | Borne des dépendances d'autorisation seulement (CP-40) |

## 17. Arbitrages, ajouts et limites

### 17.1 Arbitrages intégrés

| # | Arbitrage | Clauses |
|---|---|---|
| Q1, D-1 | Trois voies pour les objets personnels du cédant ; blocage plutôt qu'invisibilité ; copie sans déplacement de l'original | § 10.5 |
| Q2, E-7 | Restrictions légales | § 11.6 |
| Q3, D-3, E-6, F-3 | Dérogation : niveau calculé à l'évaluation ; deux approbateurs dès qu'une protection, un objet personnel ou une donnée sensible est en jeu ; accord du gardien pour l'existence ; deux renouvellements au plus (à tester) | § 12 |
| Q4 | Nomination d'un RS par un pair | § 7.2 |
| D-4 | Échéance hors ligne | § 13.9 |
| E-1, F-2 | Pas d'auto-élévation, ni directe ni réciproque | A3 ; § 9.4 |
| E-2 | Appartenance, admission aux droits et admission à une protection | § 9 |
| E-3 | Propriétaire unique et administratif ; espace préparé pour un tiers ; succession hors moteur | § 10.1 ; § 10.4 |
| E-4 | Création des protections par le titulaire ou un RS | § 11.1 |
| E-5 | Quatre opérations sur la visibilité | § 13.2 |
| E-8, F-4 | Engagements, aperçu, scellé d'audit ; gel des élargissements ; aucune révélation au cessionnaire ; aucun veto implicite d'un tiers | § 10.6 ; § 10.7 |
| F-1 | Autorité institutionnelle de l'espace ; survie des HI ; révocation par la racine ; mise en examen ciblée | § 2.1 ; § 7.4 ; § 7.5 |
| F-5 | Modèle de référence exécutable, préalable au gel | En-tête ; § 4 |
| **G-1** | Par personne ; refus en cas d'identité insuffisamment établie | § 1 ; A3 ; § 12.7 |
| **G-2** | Signataire jamais admis ; exclusion des gestionnaires qui pourraient s'habiliter indirectement, chaînes croisées comprises | A3 ; § 9.4 |
| **G-3** | Acceptation par inclusion sur la portée réelle | § 10.6 ; § 10.7 |
| **G-4** | Ajout à une sélection partagée = proposition activée par un acteur habilité ; retrait régi ; périmètre du signataire | § 13.3 ; A1 |
| **G-5** | Périmètre d'un seul régime | § 1 ; § 8.1 |
| **G-6** | Héritage des protections opposables par les copies ; filiation ; levées indépendantes | § 13.11 ; A5 ; § 11.5 |
| **G-7** | Pas de délégation d'une action interdite | § 2.5 ; § 8.1 ; § 7.2 |
| **G-8** | Mise en examen : aval inopérant, non détruit ; aucune résurrection | § 7.5 ; § 8.2 ; A4 |
| **G-9** | Gel de succession des objets privés d'un défunt | § 2.4 ; § 10.4 |
| **G-10** | Signalement d'office des protections orphelines à l'autorité de dérogation | § 11.2 |
| **G-11** | Aucune réplication de dérogation ; finalités en liste fermée et versionnée ; consécutivité indépendante de la finalité | § 12.4 ; § 12.6 ; § 13.9 |
| Transversales 1 à 3 | Contrôle par les effets ; suspension ≠ extinction ; protection héritée traçable | A3 ; § 10.6 ; A4 ; § 13.11 |
| CC-20 | Pas de `valider` pour le titulaire | § 6.1 |
| CC-28, CD-03, CT-06 | Verrou de réintégration du cédant, pour toute habilitation et toute admission | § 10.8 |

### 17.2 Ajouts de l'auteur, non arbitrés

Ils sont soumis à la validation du porteur :
- pas de gardien d'office (§ 11.2), complété par le signalement de G-10 ;
- une protection peut viser un RS ou la racine, sans effet de cascade (§ 11.1, § 2.5) ;
- l'archivage, la réouverture et la clôture sont réservés au propriétaire (§ 5.1) ;
- l'élargissement d'un objet `privé` au niveau `projet` vaut versement (§ 13.2, § 6.3) ;
- le RS détient `contribuer au Core`, sous réserve de diffusabilité (§ 7.1) ;
- une HI au profit d'un rôle de son propre espace n'exige pas d'admission (§ 9.2) ;
- la procédure à un seul approbateur, réservée aux finalités marquées dans la liste (§ 12.3) ;
- la définition de la justification recevable d'une mutation survivante (en-tête) ;
- le constat de décès par deux approbateurs, et le gel étendu aux objets non publics du défunt dans tous les espaces (§ 10.4) ;
- l'exclusion, au § 9.4, des gestionnaires de tout ensemble bénéficiaire en `notification` d'une habilitation sur le même espace (forme retenue pour G-2) ;
- l'écriture du titulaire sur ses objets personnels dans un espace archivé ou clos (§ 5.1) ;
- le mandat de lancement d'un import (§ 6.2).

**Point resté à arbitrer :** CT-28. Au transfert, C perd-il les HP que des titulaires tiers lui avaient accordées sur leurs objets personnels dans l'espace ? Le texte maintient la perte (§ 10.7) ; le contrôle A y voit un usage légitime coupé.

### 17.3 Limites assumées

- Fraude d'identité entre approbateurs, ou entre comptes réputés de personnes distinctes (§ 12.7).
- Résidu hors ligne borné par l'échéance, en écart avec le CDCF § 122.2 (§ 13.9).
- Un objet qui disparaît de l'aperçu ou des engagements d'une présentation est indistinguable d'une clôture, d'une purge ou d'un changement de visibilité. C'est le même résidu que pour tout membre (CP-28).
- Droits déclarés sur les fichiers externes (§ 6.2).
- Paramètres à fixer au MPD (§ 16).
