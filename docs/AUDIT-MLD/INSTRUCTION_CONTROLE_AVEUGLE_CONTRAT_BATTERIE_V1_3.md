# GENIIUS — Instruction du contrôle en aveugle du contrat V1.3 et de la batterie V1.3

**Date :** 10 octobre 2026
**Rapport instruit :** [CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_3.md](CONTROLE_AVEUGLE_CONTRAT_BATTERIE_V1_3.md), produit par un agent séparé, sans accès aux rapports antérieurs.
**Instructeur :** l'auteur du contrat et de la batterie, qui ne clôt aucun constat.

## 1. Résultat

| Ensemble | Bloquant | Majeur | Mineur | Observation |
|---|---|---|---|---|
| Contrat (CD-01 à CD-26) | 0 | 14 | 8 | 4 |
| Batterie | 0 | 9 | une vingtaine | — |

**Verdict du contrôleur : gel impossible.** Les deux critères du porteur ne sont pas remplis : 14 constats majeurs restent ouverts, et 9 scénarios exigent d'inventer une règle ou contredisent le contrat. **Je partage ce verdict.**

**Ce qui tient, selon le contrôleur :**
- A1 à A3 dans les cas simples ;
- l'atomicité du transfert ;
- les opérations fermées de la dérogation ;
- les exclusions et totaux du § 4.3 ;
- le partage sélectif, la réutilisation et le hors ligne ;
- les références citées : P23, P24, TI-11, DI-A01, DI-A38, DI-A41, DI-B09, DI-E05, DI-L16, DI-L21, DD-23, OB-24.

## 2. Constats vérifiés par l'instructeur

- **CD-01 — exact, et introduit par l'instructeur.**
  - Sur le contenu `projet`, toutes les chaînes remontent à la racine, et le transfert retire la racine au cédant.
  - Les nominations faites par le cédant, et tout ce qui en découle, tombent donc sauf réémission, malgré la promesse « les autres RS gardent leurs rôles ».
  - Les règles de départ que j'ai ajoutées en V1.3 (la racine ne part que par transfert) **déplacent** le problème au lieu de le résoudre.
- **CD-02 — exact.** Seuls les fondateurs d'une nomination peuvent la clore : le cessionnaire ne peut pas révoquer un RS qu'il n'a pas nommé, contrairement à ce que promettent le § 3.4.4 et le CDCF § 128.
- **S-54 et S-62 — exacts.** Le mode d'admission par défaut est l'`approbation préalable` ; sans admission, le contrat donne « Refus ». La batterie était fausse.
- **S-146 — exact.** La précondition se contredit.

## 3. Diagnostic de fond

Trois contrôles successifs (V1.1-d, V1.2, V1.3) ont chacun trouvé une quinzaine de constats majeurs. Les principes A1 à A6 tiennent, mais **leur traduction en prose ne converge pas** : chaque correction locale (départ, groupes, rattachement, dérogations) crée une interaction que le rédacteur, puis l'auditeur, ne voient qu'au tour suivant.

Deux causes :

1. **Le modèle de racine est individuel.** Tout droit sur le contenu `projet` dépend de la chaîne personnelle d'un responsable scientifique. Il faut alors traiter, un par un, le départ, le transfert, la révocation, la nomination croisée et la confirmation, et chaque traitement ouvre un nouveau cas (CD-01, CD-02, CD-05, CD-07, CD-14, CD-16, CD-18).
2. **La prose ne s'exécute pas.** 147 scénarios vérifiés à la main sur un texte de 400 lignes : chaque tour en trouve qui contredisent le texte (S-54, S-62, S-107, S-146), y compris de la part de l'auteur.

## 4. Arbitrages structurants demandés au porteur

### F-1 — Modèle de racine (CD-01, CD-02, CD-05, CD-07, CD-16, CD-18)

| Option | Principe | Conséquences |
|---|---|---|
| **F-1a — Autorité institutionnelle de l'espace** *(recommandée)* | Les droits sur le contenu `projet` d'un espace (appartenances scientifiques, délégations sur ce contenu) ont pour fondement **l'autorité scientifique de l'espace**, exercée par ses RS, et non la personne de l'RS qui a signé l'acte. | Ils survivent au départ, au transfert ou à la révocation de leur signataire, tant que l'acte n'est pas clos.<br>La racine (propriétaire RS) peut clore toute nomination de RS (CD-02).<br>Le transfert **re-racine** l'espace sur le cessionnaire, sans faire tomber l'équipe (CD-01).<br>A1 reste entier pour les objets `privé` (chaîne personnelle du titulaire) et pour toute redélégation hors de l'espace.<br>**Garde-fou** pour la révocation d'un RS pour abus : ses actes des N derniers jours sont **suspendus** et présentés à la racine, qui les confirme ou les clôt. |
| F-1b — Chaîne personnelle maintenue | On garde la dépendance individuelle et on corrige cas par cas (re-racinement au transfert, pouvoir de clôture de la racine, statut du rattachement…). | Sécurité théorique maximale, mais le risque de non-convergence est démontré par trois tours. |

### F-2 — Groupes en mode `notification` (CD-04, CD-13)

**Recommandation :** en mode `notification`, un membre n'est admis **que s'il n'a pas été ajouté par lui-même ou par un acteur qui aurait lui-même été ajouté par ce membre**, et un gestionnaire du groupe n'est **jamais** admis par `notification` : il lui faut une admission explicite de l'habilitant. Cela ferme l'ajout croisé entre deux administrateurs (A2).

Les délégations au profit d'un rôle de l'**espace lui-même** suivent les rôles (§ 5), sans mode d'admission. Pour un objet `privé`, le titulaire ne peut les accorder qu'à un rôle nominatif borné. *(À trancher : interdire purement et simplement la délégation d'un objet `privé` à un rôle ?)*

### F-3 — Dérogations et objets `privé` (CD-08, CD-09)

**Recommandation :**
- un objet `privé`, une donnée DI-E05 et toute cible protégée **après** l'octroi de la dérogation exigent **deux** approbateurs ;
- un seul approbateur ne vaut que pour un contenu `projet` sans protection et hors DI-E05 ;
- une protection posée après l'octroi suspend la dérogation pour la cible concernée ;
- les renouvellements sont plafonnés : au-delà d'un nombre fixé, l'autorité de dérogation de niveau supérieur doit les approuver.

### F-4 — Fuite par la présentation et blocage par un tiers (CD-10, CD-11)

**Recommandation :**
- un refus d'acceptation dû à une modification invisible au cessionnaire est présenté comme une **expiration ordinaire** de la présentation, sans motif ;
- une nouvelle présentation est émise automatiquement ;
- les modifications de tiers (audience d'un rôle d'un autre espace) sont **figées** à la présentation : la vue montre l'audience à cet instant, et la transaction transfère des délégations dont l'audience reste gouvernée par F, ce qui ne la modifie pas ;
- un tiers ne peut donc plus bloquer le transfert.

### F-5 — Méthode

**Recommandation :** passer d'un contrat en prose vérifié à la main à un **modèle de référence exécutable**.
- **Quoi :** un petit programme, en Python par exemple, implémente l'évaluation du § 7 et les opérations du contrat.
- **Batterie :** les scénarios deviennent des tests automatiques.
- **Contrôleur :** il vérifie alors deux choses :
  - la conformité du modèle au texte ;
  - la complétude des tests.

  Les scénarios ne sont plus rejoués à la main.
- **Pourquoi :** les contradictions de la batterie, du type de S-54 et S-62, deviennent des tests en échec, visibles immédiatement.
- **Statut :** ce modèle n'est pas le logiciel de production. Il sert de spécification exécutable, puis de référence pour la recette du MLD.

## 5. Constats corrigeables sans arbitrage

| Constats | Correction proposée |
|---|---|
| CD-03 | Le verrou de réintégration vise **tout** droit nouveau du cédant sur l'espace (règle, admission, rôle d'un autre espace), pas seulement les rôles. |
| CD-06 | Une seule autorité de levée par protection : **gardien** pour l'embargo et l'interdiction, de contenu ou d'existence. Le § 3.5.1 est aligné sur le § 6.4. |
| CD-12 | Départ ou exclusion d'un membre titulaire : ses objets `privé` restent les siens. Il peut choisir les voies (a) ou (c) ; ils restent dans l'espace, accessibles selon ses délégations. Le RS est informé. |
| CD-14 | Réémission : les admissions de la délégation d'origine sont reprises **si et seulement si** elles figurent dans la présentation. |
| CD-15 | Les administrateurs sont nommés par le propriétaire seulement : § 4.2 aligné sur § 4.1. |
| CD-17 à CD-22, CD-23 à CD-26 | Corrections locales, selon le rapport. CP-27, CP-40 et ST-15 sont **rappelés dans le contrat** (énoncé court), au lieu d'un simple renvoi au MLD. |
| Batterie (9 majeurs, mineurs) | S-54 et S-62 : ajouter l'admission. S-61 et S-107 : alignés après le rappel de CP-27. S-78 : précondition corrigée. S-35, S-36 : préciser. S-121, S-146 : réécrits selon F-1. Collisions de noms : renommer l'espace COL en CLM, l'espace E en ESP, l'acteur A2 en AD2. Couverture : ajouter les clauses non testées (lot, contestation, explication des accès, `contribuer au Core`, retrait d'une admission, chute d'une délégation non confirmée, archivage). |

## 6. Suite proposée

1. Décisions du porteur sur F-1 (modèle de racine) et F-5 (méthode), puis sur F-2 à F-4.
2. Si F-5 est retenu :
   - réécrire le contrat (V1.4) selon F-1 à F-4 et le § 5 ;
   - construire le modèle de référence exécutable et convertir la batterie en tests ;
   - faire passer tous les tests ;
   - contrôle indépendant du texte, du modèle et des tests.
3. Gel du contrat et de la batterie : aucun constat bloquant ni majeur, aucun scénario qui exige d'inventer une règle, et tous les tests au vert.

## 7. Décisions du porteur (10/10/2026)

**Non-gel de la V1.3 confirmé.** CD-01 et CD-02 exigent une correction à la racine du mécanisme de délégation, et non de nouvelles exceptions.

- **F-1 (validé sous conditions).** Trois notions distinctes :
  - **l'autorité de l'espace**, qui maintient les habilitations institutionnelles malgré les changements de personnes ;
  - **le droit d'accès au contenu**, qui reste soumis aux protections de chaque objet ;
  - **la traçabilité des décisions** : l'identité de qui a accordé, confirmé ou retiré une habilitation est conservée.

  Une habilitation institutionnelle survit au départ de son signataire sans devenir un droit permanent et incontrôlable. Le nouveau propriétaire, dans sa fonction de RS, peut révoquer les nominations institutionnelles existantes, mais cette autorité ne lui donne pas le droit de consulter un contenu privé ou protégé, ni de supprimer les protections imposées par un tiers légitime.

  **Refusé :** la suspension automatique de tous les actes récents d'un RS révoqué pour abus. **Retenu à la place :** une mise en examen ciblée des habilitations suspectes, avec suspension immédiate de celles qui présentent un risque identifié.
- **F-2 (validé).** Aucun mécanisme d'admission réciproque ne permet à deux administrateurs d'augmenter leurs propres droits.
- **F-3 (validé sur le principe).**
  - L'accès ordinaire autorisé n'est pas une dérogation : un titulaire qui consulte son objet n'a besoin d'aucun approbateur.
  - Deux approbateurs indépendants pour une dérogation qui franchit une protection, privée ou sensible ; pour une protection d'existence, l'accord du gardien reste une condition supplémentaire.
  - Au plus **deux renouvellements consécutifs**, chacun avec une nouvelle justification et une nouvelle double approbation. Ce plafond est à tester dans le modèle, pas encore gelé.
- **F-4 (validé).** Aucune protection d'existence révélée au cessionnaire ; aucun veto implicite d'un tiers.
- **F-5 (validé), désormais préalable au gel.**

**Méthode V1.4 :**
1. Un contrat formel qui distingue habilitations institutionnelles, habilitations personnelles, restrictions et protections d'existence.
2. Les invariants et les transitions d'état, définis avant les scénarios.
3. Un modèle exécutable, avec les 147 scénarios automatisés après correction.
4. Des tests de propriétés :
   - absence d'auto-élévation ;
   - non-divulgation d'existence ;
   - continuité des habilitations lors d'un transfert ;
   - révocation effective ;
   - absence d'accès implicite par la propriété.
5. Deux contrôles séparés : la conformité du modèle au contrat, et la couverture de la batterie.

**Critère de gel :**
- zéro constat bloquant, zéro constat majeur ;
- aucun scénario qui exige d'inventer une règle ;
- tous les tests automatisés réussis, sans que leur réussite remplace le contrôle indépendant du texte.

Les 147 scénarios sont une base de régression, pas une couverture exhaustive : ils sont à compléter par des tests de combinaisons et de transitions.
