# GENIIUS — Rapport de vérification de cohérence : contrat d'autorisation V1 révisé et batterie V1.1

**Date :** 10 octobre 2026
**Objet :**
- intégrer les arbitrages Q1 à Q4 du porteur ;
- corriger les scénarios désignés et en ajouter trois ;
- vérifier la structure de chaque scénario ;
- contrôler les contradictions entre la batterie, les principes A1 à A6 et le contrat ;
- établir la traçabilité.

**Livrables :**
- [contrat d'autorisation V1 révisé](../GENIIUS_CONTRAT_AUTORISATION.md) ;
- [batterie candidate V1.1, 69 scénarios](../historique/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_1.md) ;
- le présent rapport.

**Périmètre respecté :** ni le MLD, ni le dictionnaire, ni le MPD, ni aucun statut de gel n'ont été modifiés. La batterie V1 (66 scénarios) reste dans le dépôt pour l'historique ; elle est remplacée par la V1.1. **Rien n'est déclaré gelé.**

**Limite :** ce contrôle a été fait par l'auteur du contrat et de la batterie ; il n'est pas indépendant.

## 1. Intégration des arbitrages Q1 à Q4

| Arbitrage | Changement dans le contrat | Scénarios concernés |
|---|---|---|
| **Q1** — objets `privé` du cédant | § 3.3, point 6 réécrit, avec trois voies :<br>• (a) versement à l'espace, avec provenance et paternité conservées ;<br>• (b) transfert au bénéficiaire, par une opération distincte et explicitement acceptée ;<br>• (c) copie autonome par `FILIATION` dans l'espace personnel du cédant.<br>Un objet sans voie possible est un blocage. Le choix est figé dans la présentation, et l'acceptation est refusée tant qu'un objet est sans sort ou bloqué (points 2 et 3). Le § 3.1 admet le transfert du droit de titulaire par la seule voie (b). | S-30, S-39, S-67, S-68 |
| **Q2** — restrictions légales | § 3.4 : référence structurée au fondement légal (nature, fondement documenté, portée, période, autorité compétente pour la levée), dont l'existence peut être protégée ; aucune dérogation interne. § 6 (embargos) et § 7, étape 0. | S-47 |
| **Q3** — dérogations | § 3.4 : la règle générale « deux personnes » est **remplacée**. Deux approbateurs distincts et indépendants si la dérogation franchit une existence protégée ; un seul sinon, si la procédure le permet. Aucun approbateur bénéficiaire ; pas deux comptes d'une même personne. | S-46, S-47 |
| **Q4** — nomination d'un responsable scientifique | § 5 : nomination nominative, acceptée et tracée, dans un périmètre au plus égal, sans contournement de révocation ; droits du rôle distincts des droits privés. | S-15, S-45, S-69 |

## 2. Corrections des scénarios désignés

| Scénario | V1 | V1.1 | Motif |
|---|---|---|---|
| S-15 | « Effectif » (RS nomme un RS) | Nomination nominative et acceptée, périmètre au plus égal, aucun accès aux objets `privé` d'autrui ; sans acceptation, aucune nomination | Q4 |
| S-17 | Règle maintenue grâce au second RS | Maintenue **seulement** dans le périmètre et jusqu'à l'échéance que le second RS pouvait accorder | A1 ; la V1 laissait croire à un maintien intégral |
| S-25 | RS ajoute un membre, effectif | Précondition explicite : le groupe ne bénéficie que de droits couverts par RS | Lever l'ambiguïté avec la règle révisée des groupes (§ 6) |
| S-26 | Ajout accepté « sans droits » | **Refus** de l'ajout ; aucune appartenance « sans effet » | Contradiction corrigée avec A1 et § 6 (C-04) |
| S-33 | « Ni le cédant ni le cessionnaire » | Précision : la règle du tiers n'est pas réémissible (son habilitant est TIT) ; TIT garde ses droits | Cohérence avec la réémission (§ 3.3.5) |
| S-35 *(hors liste, ajouté par l'instructeur)* | Réémission ou extinction | Réémission annoncée, à l'identique ou plus étroite, conforme à A1 sur les droits reçus, sans résurrection ; silence = extinction | Point de vigilance du porteur sur la réémission |
| S-39 | Selon le choix (verser ou éteindre) | Objet sans voie : **acceptation refusée**, blocage signalé, aucun objet invisible | Q1 |
| S-45 | RS gardien d'office de tout embargo | RS gardien d'office pour un contenu `projet` seulement ; titulaire pour un objet `privé` | Q4 ; contradiction C-03 |
| S-46 | « Deux personnes » | Deux approbateurs distincts et indépendants, aucun bénéficiaire ; refus en cas de second compte d'une même personne | Q3 |
| S-57 | Permis si licence et absence de protection | Conditions complètes de l'arbitrage D3 : droits durablement acquis, licence, aucune protection ni droit de tiers ; variante de refus explicite | D3 (DI-A41) |
| S-59 | « Résidu conforme à CP-28 » | Résidu borné par min(reconnexion, T0 + D) ; retraits d'abord, non qualifiés ; contributions locales conservées ; aucune donnée nouvelle | Résultat rendu observable |
| S-60 | Réplication bornée dès plus d'un membre | Opération précise : l'ajout d'un deuxième membre est refusé tant qu'aucune durée n'est fixée | Opération et résultat observables |
| S-64 | Trois types d'objets en une ligne | Une seule opération (base justificative de portée `projet`) ; conflit **visible** du demandeur ; portée `privée` sans conflit | Exigence « une opération » ; la règle générale reste CP-49, à réécrire |

**Ajouts :** S-67 (Q1, voie b), S-68 (Q1, voie c), S-69 (un RS tente de déléguer un objet `privé` d'autrui).

## 3. Contrôle de structure (point 4)

Les 69 scénarios sont rédigés selon quatre colonnes : préconditions, opération unique, résultat attendu observable, fondement.

**Résultat : 69 sur 69 conformes après reformulation.** Les reformulations de la V1 à la V1.1 n'ont pas changé les résultats attendus, hormis les 13 scénarios du § 2, et S-11 (contradiction C-09).

Trois scénarios gardent une **variante** dans le résultat, sans seconde opération autonome :
- S-41 : rôle de lanceur seul ;
- S-57 : licence interdisant la redistribution ;
- S-68 : licence interdisant la copie.

Si le porteur exige une variante par scénario, ces trois cas se scindent sans changer le fond.

## 4. Contradictions relevées et leur résolution

| # | Contradiction | Entre | Résolution |
|---|---|---|---|
| C-01 | Le § 3.4 exigeait deux personnes pour toute dérogation | § 3.4 et Q3 | § 3.4 remplacé par Q3, signalé par une mention *[Révisé]* (relevé par le porteur) |
| C-02 | La dérogation était évaluée **avant** toute protection, y compris légale (§ 7, étape 1) | § 7 et § 3.4, Q2 | Étape 0 ajoutée : protections non levables d'abord ; la dérogation ne les franchit jamais |
| C-03 | Le RS était gardien d'office de tout embargo, objets `privé` d'autrui compris | § 6 et Q4 | Gardien d'office : titulaire (`privé`), RS (`projet`) ; un gardien n'acquiert aucun droit de contenu |
| C-04 | L'ajout d'un membre à un groupe pouvait être accepté en ne transmettant que les droits couverts, d'où des membres apparents sans droit | § 6, S-26 et A1 | Ajout refusé s'il ne couvre pas tous les droits de contenu du groupe ; un administrateur ne gère que les groupes sans droit de contenu |
| C-05 | « Un droit de titulaire n'est jamais transféré » | § 3.1 et Q1 (voie b) | Transfert admis par la seule opération distincte et acceptée de la voie (b), jamais par une règle |
| C-06 | Au transfert, « les droits de titulaire du cédant s'éteignent », sans exception | § 3.3.4 et Q1 (voie b) | Exception limitée aux droits transférés par la voie (b) |
| C-07 | Réémission : la vérification A1 pouvait porter sur des objets que le cessionnaire ne reçoit pas | § 3.3.5 et A1 | Vérifiée sur les droits effectivement attribués au cessionnaire ; réémission annoncée, à l'identique ou plus étroite, sans résurrection, non implicite |
| C-08 | Q1, voie 3 (« extraire ou conserver l'objet dans un espace personnel ») et l'invariant DI-A01 : un objet ne change jamais d'espace | Arbitrage Q1 et MCD/dictionnaire | **Interprétation proposée, à valider (§ 5, D-1)** : la voie (c) crée une copie autonome par `FILIATION` ; l'original suit (a), (b) ou une purge explicite |
| C-09 | Le § 4 listait les règles « sans leur cible » ; S-11 et S-43 exigent qu'aucune métadonnée ne révèle un objet caché | § 4, S-11 et S-43 | § 4 révisé : les règles d'existence et embargos portant sur un objet caché à l'administrateur ne sont pas listés |
| C-10 | S-64 (V1) mêlait trois objets aux règles d'unicité différentes | Batterie et exigence « une opération » | Scindé : S-64 porte sur la base justificative ; les références et choix d'affichage relèvent de CP-49, à réécrire avec le MLD |

**Principes A1 à A6 :** après ces corrections, aucun des 69 résultats attendus ne contredit un principe. Les scénarios positifs (S-13, S-14, S-15, S-17, S-19, S-25, S-27, S-35, S-38, S-45, S-46, S-54, S-57, S-62, S-67, S-68) respectent tous A1 (habilitant qui détient droit et pouvoir) et A3 (habilitant différent du bénéficiaire).

## 5. Désaccords et points soumis au porteur

| # | Point | Position de l'instructeur |
|---|---|---|
| D-1 | **Q1, voie 3.** L'arbitrage parle d'« extraire ou conserver l'objet dans un espace personnel du cédant ». Or un objet ne change jamais d'espace (DI-A01, MCD P7). | Ne pas déplacer l'objet. La voie (c) crée une copie autonome par `FILIATION`, ce que l'arbitrage prévoit aussi (« avec une filiation documentée si une copie autonome est créée »). L'original suit (a), (b) ou une purge explicite. Confirmation demandée. |
| D-2 | **Dérogation ordinaire** (vérification n° 6 du porteur : « procédure limitée, motivée et journalisée »). Aucun des 69 scénarios ne la couvre : S-46 et S-47 portent sur l'existence protégée et sur la restriction légale. | **Lacune.** Proposition d'un S-70 : « SUP1 seul accorde, pour une finalité de support, un accès en lecture à un contenu `projet` non protégé en existence, 7 jours → accordé, journalisé, expire seul ». Non ajouté, pour respecter le nombre de 69 demandé. À décider. |
| D-3 | **Indépendance des deux approbateurs** (Q3). Le contrat exige deux personnes distinctes, sans compte commun ni lien de subordination déclaré. Vérifier qu'il s'agit d'êtres humains distincts suppose des données d'identité (vérification renforcée des comptes, lien compte–acteur). | À traduire au MLD : exiger deux `acteur_geniius` de nature `personne`, liés à des comptes de vérification renforcée distincts. Aucune garantie absolue contre deux identités vérifiées frauduleuses : c'est une limite à documenter. |
| D-4 | **S-60.** Faut-il étendre la borne de réplication aux espaces `privé` à un seul membre ? | Non : la batterie ne l'exige qu'à partir de deux membres actifs, conformément à NC-09. |

## 6. Couverture des dix vérifications du porteur

| # | Vérification | Scénario(s) | État |
|---|---|---|---|
| 1 | Transfert avec objets `privé` non traités | S-39 | Couvert |
| 2 | Transfert avec objets `privé` transmis | S-67 | Couvert (ajout) |
| 3 | Cédant conservant une copie autonome | S-68 | Couvert (ajout) |
| 4 | Embargo fondé sur une obligation légale | S-47 | Couvert |
| 5 | Dérogation franchissant une existence protégée | S-46 | Couvert |
| 6 | Dérogation ordinaire | — | **Non couvert** (D-2) |
| 7 | RS nommant un pair | S-15 | Couvert |
| 8 | RS tentant de déléguer des objets `privé` d'autrui | S-69 (et S-02) | Couvert (ajout) |
| 9 | Transfert avec engagements modifiés après présentation | S-36 | Couvert |
| 10 | Réémission de délégations après transfert | S-35 | Couvert (précisé) |

## 7. Matrice de traçabilité

*Constats : AC = premier audit ; CA = variante du contre-audit ; NC = nouveau constat du contre-audit ; P = scénario du porteur ; Q = arbitrage. Clauses : sections du contrat.*

| Scénario | Constats et sources | Clauses du contrat | Principes |
|---|---|---|---|
| S-01 | P ; NC-01 | § 3.1 | A3 |
| S-02 | NC-01 ; Q4 | § 3.1 ; § 5 | A3 |
| S-03 | P ; AC-01 ; NC-02 | § 4 ; § 3.2 | A1, A2 |
| S-04 | AC-01 (voie A) | § 5 | A3 |
| S-05 | AC-01 (voie B) | § 3.2 | A1, A3 |
| S-06 | P ; AC-01 (CA-1) ; NC-02 | § 6 (groupes) | A3 |
| S-07 | AC-01 (CA-3) ; NC-02 | § 6 (règles) | A1, A2 |
| S-08 | P ; AC-01 (voie C) | § 6 ; § 4 | A1, A2 |
| S-09 | P | § 3.2 (condition 1) | A1 |
| S-10 | NC-14 | § 4 ; § 5 | A2 |
| S-11 | P ; AC-15 | § 4 (révisé) | A2, A5 |
| S-12 | AC-15 | § 4 | A2 |
| S-13 | P (légitime) | § 3.2 ; § 5 | A1 |
| S-14 | Légitime ; NC-02 (effet inverse) | § 3.1 ; § 3.2 | A1 |
| S-15 | Légitime ; Q4 | § 5 ; § 3.2 | A1, A3 |
| S-16 | P | § 3.2 (dépendance) | A1 |
| S-17 | Légitime ; AC-11 | § 3.2 | A1 |
| S-18 | AC-11 | § 3.2 ; § 4 | A2 |
| S-19 | NC-04 | § 3.2 (actes) | A4 |
| S-20 | P | § 3.2 | A4 |
| S-21 | Légitime | § 3.2 (condition 4) | A1 |
| S-22 | Légitime | § 3.2 (dépendance) | A1 |
| S-23 | CA (cycles) | § 3.2 | A1, A6 |
| S-24 | P ; NC-02 | § 6 | A3 |
| S-25 | Légitime | § 6 ; § 3.2 | A1 |
| S-26 | AC-01 (CA-1) ; NC-02 | § 6 (révisé) | A1, A2 |
| S-27 | Légitime (CDCF § 122) | § 6 | A1 |
| S-28 | AC-01 ; CDCF § 120 | § 4 | A2 |
| S-29 | CDCF § 122.2 | § 3.2 | A1 |
| S-30 | P ; AC-02 | § 3.3.4 | A4 |
| S-31 | AC-02 (CA-1) | § 3.3.4 | A4 |
| S-32 | AC-02 (CA-2) | § 3.3.4 | A4, A5 |
| S-33 | NC-03 a | § 3.3.5 | A1 |
| S-34 | NC-03 b | § 3.3.5 | A5 |
| S-35 | NC-03 d ; vigilance du porteur | § 3.3.5 | A1, A4 |
| S-36 | AC-12 ; NC-08 | § 3.3.2-3 | — |
| S-37 | P | § 3.3 | A4 |
| S-38 | Légitime | § 3.3.4 | — |
| S-39 | Q1 | § 3.3.3, § 3.3.6 | A5 |
| S-40 | AC-03 | § 3.1 | A3 |
| S-41 | AC-03 (CA-1) | § 3.1 | A2, A3 |
| S-42 | AC-31 | § 3.1 | A3 |
| S-43 | P ; AC-04 | § 7 (étape 2) | A5 |
| S-44 | AC-04 (CA-1) ; NC-05 | § 6 (embargos) | A1, A3 |
| S-45 | AC-04 (CA-2) ; NC-05 ; Q4 | § 6 (embargos, révisé) | A1, A5 |
| S-46 | NC-05 ; Q3 | § 3.4 | A5 |
| S-47 | Q2 | § 3.4 ; § 7 (étape 0) | A5 |
| S-48 | AC-18 | § 7 | A5 |
| S-49 | P ; AC-07 | § 6 (sélections) | A5 (P24) |
| S-50 | AC-07 (CA-1) | § 6 ; § 7 (étape 6) | A5 |
| S-51 | AC-06 | § 7 (étape 6) | A5 |
| S-52 | NC-07 | § 6 (sélections) | A4 |
| S-53 | NC-07 | § 6 | A4 |
| S-54 | Légitime | § 6 ; § 3.2 | A1 |
| S-55 | AC-11 ; CA | § 3.2 ; § 6 | A1 |
| S-56 | P | § 6 | A4 |
| S-57 | AC-16 ; D3 | § 6 | A1, A5 |
| S-58 | P | § 7 ; CP-40 | A6 |
| S-59 | P ; AC-13 | CP-28 | A6 |
| S-60 | NC-09 | CP-28 | A6 |
| S-61 | AC-14 | CP-27 | A5 |
| S-62 | NC-12 | § 6 (contributions) | A1 |
| S-63 | AC-08 | § 7 | A5 |
| S-64 | AC-05 ; NC-06 | § 7 ; CP-49 (à réécrire) | A5 |
| S-65 | AC-09 | § 4 | A2 |
| S-66 | AC-30 | § 7 (étape 2) | A5 |
| S-67 | Q1 (voie b) | § 3.3.6 ; § 3.1 | A3, A4 |
| S-68 | Q1 (voie c) | § 3.3.6 ; DI-A01 | A5 |
| S-69 | Q4 | § 5 ; § 3.2 | A1 |

**Constats d'audit touchant l'autorisation sans scénario dédié :** aucun. Les constats hors autorisation (AC-19 à AC-27, NC-13, NC-15, DI-A37, DI-K11) sont traités par les corrections parallèles V1.1-e du MLD, hors batterie.

## 8. Décisions attendues du porteur

1. Validation du contrat V1 révisé, en particulier C-02, C-04 et C-09, qui modifient des règles et pas seulement leur rédaction.
2. Position sur les désaccords D-1 (voie c) et D-2 (scénario S-70 de dérogation ordinaire).
3. Gel de la batterie, V1.1 ou V1.2 si S-70 est ajouté.

Les étapes 3 à 6 (dictionnaire, réécriture du MLD, requalification des 207 lignes, audit indépendant) restent suspendues jusqu'à ce gel.

## 9. Révision V1.2 (arbitrages D-1 à D-4 et corrections du porteur, 10/10/2026)

**Contrat (2e révision).**

| Point | Changement | Clause |
|---|---|---|
| D-1 | Voie (c) : copie autonome avec filiation, soumise aux protections ; l'original suit (a), (b) ou une purge **légalement autorisée** | § 3.3.6 (c) |
| D-3 | Indépendance des deux approbateurs : humains distincts, identité vérifiée, comptes distincts, aucun conflit d'intérêts, aucun bénéficiaire ; résidu de fraude d'identité documenté | § 3.4 |
| D-4 | Seuil de deux membres abandonné : échéance locale opposable pour toute réplique contenant des données protégées ou révocables, y compris en espace à membre unique ; dispense pour le public librement redistribuable ; aucune présomption d'effacement distant immédiat. CP-28 sera révisée au MLD. | A6 ; § 6 (hors ligne) |
| S-35 | Une réémission crée une **nouvelle** délégation, avec un lien « réémission de » ; l'auteur historique n'est jamais réécrit ; effet continu, origine distincte | § 3.3.5 |
| S-45 | Création d'un embargo réservée au titulaire (objet `privé`) et au responsable scientifique (contenu `projet`) ; créateur gardien d'office | § 6 (embargos) |
| S-46 | Deux opérations distinctes : **accès exceptionnel** (dérogation, protection maintenue) et **levée durable** (autorité de la protection : gardien, auteur, autorité légale). Sans gardien, la dérogation désigne un gardien ; elle ne lève jamais | § 3.4 ; § 6 |
| S-67, S-68 | Atomicité : l'acceptation est une transaction unique (gouvernance, voies a, b et c, réémissions, extinctions) ; un échec annule tout | § 3.3.7 |

**Batterie V1.2 :**
- 93 scénarios, tous binaires ;
- 16 réécrits : S-07, S-10, S-15, S-35, S-36, S-41, S-45, S-46, S-50, S-51, S-57, S-60, S-64, S-66, S-67, S-68 ;
- 24 ajoutés : S-70 à S-93.

**Variantes éclatées en scénarios distincts :**

| Variante | Scénario d'origine | Nouveau scénario |
|---|---|---|
| Public au lieu du rôle `lecteur` | S-07 | S-89 |
| Second test de nomination croisée | S-10 | intégré : S-10 devient une opération unique |
| Sans acceptation de la nomination | S-15 | S-90 |
| Réémission élargie | S-35 | S-85 |
| Délégation non réémise | S-35 | S-86 |
| Délégation expirée | S-35 | S-87 |
| Audience d'un rôle d'un autre espace | S-36 | S-88 |
| Rôle de lanceur seul | S-41 | S-72 |
| Licence interdisant la redistribution | S-57 | S-73 |
| Protection ou droit de tiers | S-57 | S-74 |
| Portée `privée` | S-64 | S-91 |
| Participant non relié à un acteur | S-66 | S-92 |
| Sans acceptation explicite de l'objet | S-67 | S-93 |
| Licence interdisant la copie | S-68 | S-75 |

**Nouveaux tests :**
- S-70 et S-71 : dérogation ordinaire, cas positif et cas négatif (D-2) ;
- S-76 : embargo créé sans autorité ;
- S-77 à S-79 : levée par dérogation refusée, puis désignation d'un gardien et levée par ce gardien ;
- S-80 à S-82 : refus d'approbation (second compte, approbateur bénéficiaire, approbateur unique) ;
- S-83 : contenu public hors ligne ;
- S-84 : échec atomique.

**Traçabilité des nouveaux scénarios.**

| Scénario | Sources | Clauses | Principes |
|---|---|---|---|
| S-70 | D-2 ; Q3 | § 3.4 | A5 |
| S-71 | D-2 | § 3.4 | A4, A5 |
| S-72 | AC-03 | § 3.1 | A3 |
| S-73, S-74 | AC-16 ; D3 | § 6 ; DI-A41 | A1, A5 |
| S-75 | Q1 ; D-1 | § 3.3.6, § 3.3.7 | A5 |
| S-76 | Correction S-45 ; NC-05 | § 6 | A1 |
| S-77 | Correction S-46 | § 3.4 | A5 |
| S-78, S-79 | Correction S-46 ; NC-05 | § 3.4 ; § 6 | A5 |
| S-80 à S-82 | Q3 ; D-3 | § 3.4 | A3, A5 |
| S-83 | D-4 | A6 ; § 6 | A6 |
| S-84 | Correction S-67/S-68 | § 3.3.7 | A4 |
| S-85 à S-87 | Correction S-35 ; NC-03 d | § 3.3.5 | A1, A4 |
| S-88 | AC-12 ; NC-08 | § 3.3.2-3 | — |
| S-89 | AC-01 ; NC-02 | § 6 | A1, A2 |
| S-90 | Q4 | § 5 | A3 |
| S-91 | AC-05 ; NC-06 | § 7 ; CP-49 | A5 |
| S-92 | AC-30 | § 7 | A5 |
| S-93 | Q1 | § 3.3.6, § 3.3.7 | A4 |

**Statut :** contrat et batterie V1.2 candidats, non gelés. Contrôle indépendant en aveugle lancé, sans le présent rapport comme preuve.
