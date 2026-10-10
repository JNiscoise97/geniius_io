# GENIIUS — Batterie de scénarios du contrat d'autorisation

**Version :** V1 — **à figer** par le porteur (10 octobre 2026), avant la réécriture du dictionnaire et du MLD.
**Référentiel :** [contrat d'autorisation V1](../GENIIUS_CONTRAT_AUTORISATION_V1.md).
**Règle :** les résultats attendus sont fixés **avant** la réécriture. Le futur audit indépendant rejouera chaque scénario contre le MLD réécrit. Un scénario qui n'obtient pas le résultat attendu est un constat.

**Sources :**
- **P** : scénarios donnés par le porteur ;
- **AC** : premier audit ;
- **CA** : variantes du contre-audit ;
- **NC** : nouveaux constats du contre-audit ;
- **L** : cas légitimes, qui protègent contre un modèle trop fermé.

**Acteurs types :**
- **ADM** : administrateur seul, sans rôle scientifique ;
- **RS** : responsable scientifique ;
- **COL** : collaborateur ;
- **LEC** : lecteur ;
- **TIT** : titulaire d'un objet `privé` ;
- **SUP1** et **SUP2** : autorité de dérogation de plateforme ;
- **C** : cédant ; **K** : cessionnaire.

## 1. Auto-habilitation et privilèges administratifs

| ID | Source | Scénario | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-01 | P | Un acteur crée une règle « titulaire » (ex-« propriétaire ») sur l'objet `privé` d'autrui | **Refus** : aucun acteur ne crée de droit de titulaire | § 3.1, A3 |
| S-02 | NC-01 | RS de l'espace se crée une règle de titulaire sur la note `privé` d'un membre | **Refus** | § 3.1, A3 |
| S-03 | P | ADM, sans lecture, accorde la lecture d'un contenu `projet` à un complice | **Refus** : ADM ne détient ni `voir` ni son pouvoir de délégation | A1, A2 |
| S-04 | AC-01 A | ADM s'inscrit `lecteur` | **Refus** : auto-attribution, et ADM ne peut pas conférer d'appartenance scientifique | A3, § 5 |
| S-05 | AC-01 B | ADM se crée une règle nominative `voir` | **Refus** | A1, A3 |
| S-06 | P, CA-01(1) | ADM crée un groupe G, s'y ajoute, puis crée une règle `voir` au profit de G | **Refus** (auto-ajout), et la règle est **refusée** faute de pouvoir de délégation | A1, A3, § 6 |
| S-07 | CA-01(3), NC-02 | ADM ouvre un objet `privé` d'un membre au rôle `lecteur` ou au `public` | **Refus** | A1, A2 |
| S-08 | AC-01 C, P | L'administrateur d'un programme crée une règle sur un sous-projet | **Refus**, sans autorité locale explicite | A1, A2, § 6 |
| S-09 | P | LEC, sans pouvoir de délégation, invite un autre lecteur ou crée une règle `voir` pour un groupe | **Aucun accès créé** | A1 |
| S-10 | NC-14 | ADM unique nomme un second administrateur de complaisance, qui le nomme `lecteur` | **Refus** : un administrateur ne confère pas d'appartenance scientifique ; l'appartenance administrative ne donne aucune lecture. La nomination croisée est journalisée. | A2, § 5 |
| S-11 | P | ADM consulte les métadonnées de gouvernance | **Seules** les métadonnées du § 4 sont visibles ; aucune cible protégée, aucun titre ni libellé d'objet protégé | A2, § 4 |
| S-12 | AC-15 | ADM consulte les diffusions et les décisions éditoriales de l'espace | **Métadonnées** visibles (date, canal, audience, résultat) ; jamais le contenu de la publication s'il ne le lit pas par ailleurs | § 4 |

## 2. Délégation, chaîne et dépendance

| ID | Source | Scénario | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-13 | P, L | RS délègue `voir` sur le contenu `projet` à COL | **Autorisation effective**, journalisée (auteur, fondement) | § 3.2, § 5 |
| S-14 | L | TIT partage son objet `privé` avec un collègue (`voir`) | **Autorisation effective** | § 3.1, § 3.2 |
| S-15 | L | RS nomme un autre RS ; celui-ci nomme un collaborateur | **Effectif** | § 3.2, Q4 |
| S-16 | P | La règle de partage perd son fondement : son auteur perd son rôle | **Droits dépendants désactivés** à l'évaluation suivante, sans acte | § 3.2 |
| S-17 | L | Variante de S-16 : un second RS a prolongé la règle avant le départ de l'auteur | **Règle maintenue** : le second RS en est un fondement valide | § 3.2 |
| S-18 | AC-11, CA | ADM, sans `voir`, prolonge la règle d'un RS | **Refus** de la prolongation ; la règle reste inchangée, son échéance aussi | § 3.2, A2 |
| S-19 | NC-04 | Un second habilitant approuve l'admission d'un membre dans un groupe extérieur | La règle garde son identité ; les admissions déjà accordées restent ; l'habilitant devient fondement de cette admission | § 3.2, A4 |
| S-20 | P | Une admission réactive une ancienne règle révoquée | **Refus** : aucune résurrection | A4 |
| S-21 | L | COL délègue `voir` sans `repartager` | **Refus** | A1 |
| S-22 | L | RS délègue `voir` avec `repartager` à COL, qui délègue `voir` à un tiers ; puis RS retire la délégation | **Le tiers perd l'accès** : chaîne rompue | § 3.2 |
| S-23 | CA | Cycle de délégation : A délègue à B avec `repartager`, B redélègue à A | **Refus** du cycle | § 3.2, CP-40 |

## 3. Groupes, programmes et rattachements

| ID | Source | Scénario | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-24 | P | Un acteur s'auto-attribue un rôle via un groupe (s'ajoute à un groupe bénéficiaire) | **Refus** | A3 |
| S-25 | L | RS ajoute un membre à un groupe bénéficiaire de `voir` sur le contenu `projet` | **Effectif** | § 6 |
| S-26 | CA | ADM ajoute un membre à un groupe bénéficiaire de `voir` | Le membre est ajouté au groupe (gouvernance), mais **n'en reçoit pas les droits** de contenu | A1, A2, § 6 |
| S-27 | L, CDCF § 122 | Groupe « Coordination » du programme, `approbation préalable` : RS du sous-projet admet nommément A | **Effectif** pour A seul ; un nouveau membre du groupe sans admission n'a rien | § 6, DD-22 |
| S-28 | CDCF § 120 | L'administrateur d'un programme, sans rôle dans le sous-projet, lit son contenu | **Refus** | A2, P23 |
| S-29 | CDCF § 122.2 | La fin du rattachement d'un sous-projet | Les habilitations fondées sur ce rattachement s'éteignent ; les autres restent | § 3.2 |

## 4. Transfert de gouvernance

| ID | Source | Scénario | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-30 | P, AC-02 | Après un transfert, le cédant lit encore (appartenance, règles CP-23) | **Refus** : tous ses droits sur l'espace sont éteints | § 3.3 |
| S-31 | CA-02(1) | Le cédant était membre du groupe « Famille », bénéficiaire de `voir` | **Refus** : son appartenance aux groupes de l'espace est éteinte | § 3.3 |
| S-32 | CA-02(2) | Le cédant était bénéficiaire d'un embargo d'existence | **Refus** : sa qualité de bénéficiaire est éteinte | § 3.3 |
| S-33 | NC-03 a | Un membre avait accordé au cédant `voir` sur son journal `privé` | Après le transfert, **ni le cédant ni le cessionnaire** ne lisent le journal | § 3.3.5 |
| S-34 | NC-03 b | Une interdiction d'existence visait le cédant | **Non transférée** ; le cessionnaire n'en hérite pas | § 3.3.5 |
| S-35 | NC-03 d | Le cédant avait posé la règle de sélection BOVALO → Colimaçons, présentée comme engagement | Si le cessionnaire la **réémet** dans l'acceptation, elle continue avec lui pour auteur ; sinon elle s'éteint, **et c'était annoncé** dans les engagements présentés | § 3.3.5 |
| S-36 | AC-12, CA, NC-08 | Entre la présentation et l'acceptation, le cédant ajoute 40 membres à un groupe bénéficiaire, ou l'espace destinataire d'une règle par rôle ajoute des membres | **Acceptation rejetée**, nouvelle présentation | § 3.3.2 |
| S-37 | P | Le transfert recrée les droits du cédant sur une réouverture ultérieure | **Refus** | A4 |
| S-38 | L | Le cessionnaire lit le contenu `projet` et l'administre après l'acceptation | **Effectif** | § 3.3.4 |
| S-39 | Q1 | Objets `privé` du cédant dans l'espace | Selon le choix du cédant présenté : versés à l'espace (lisibles par le cessionnaire) ou éteints (dérogation seulement) ; **aucune bascule implicite** | § 3.3.6, Q1 |

## 5. Titulaire et créations automatiques

| ID | Source | Scénario | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-40 | AC-03 | Une tâche automatique sans déposant identifiable crée des objets `privé` | **Aucun** droit personnel ; accès par dérogation seulement | § 3.1 |
| S-41 | CA-03(1) | ADM dépose lui-même le GEDCOM d'un membre et lance l'import « pour son compte » | ADM ne devient titulaire **que s'il détient les droits sur le fichier déposé** ; sinon aucun droit. Cas recommandé : le membre dépose, ADM ne fait que lancer, et le membre est titulaire. | § 3.1 |
| S-42 | AC-31 | Amorçage du référentiel commun | Acteur institutionnel ; aucun droit de titulaire ; visibilité publique explicite | § 3.1 |

## 6. Embargos et existence protégée

| ID | Source | Scénario | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-43 | P, AC-04 | Embargo d'existence sur un témoignage | **Aucune divulgation** directe ou indirecte (recherche, compteur, lien, sélection, export, notification, métadonnée de gouvernance) aux non-bénéficiaires, administrateurs compris | A5, § 7 |
| S-44 | CA-04(1) | ADM s'ajoute à un groupe bénéficiaire de l'embargo | **Refus** de l'auto-ajout ; par un tiers, ajout soumis à A1 (gardien) | A1, A3, § 6 |
| S-45 | CA-04(2), NC-05 | Un collaborateur pose un embargo d'existence dont il est seul bénéficiaire, sans pouvoir de délégation | Le RS de l'espace est **gardien d'office** ; il peut lever l'embargo. Aucune impasse. | § 6 |
| S-46 | NC-05 | Plus aucun gardien (départ, purge du compte) | Levée possible par **dérogation** : deux personnes, fondement, journal | § 3.4, Q3 |
| S-47 | Q2 | Embargo fondé sur une obligation légale | **Non levable** par dérogation interne | § 3.4 |
| S-48 | AC-18 | Export par un acteur à qui un objet est caché | Objet ni exporté, ni listé, ni compté de façon nominative | A5 |

## 7. Partage sélectif

| ID | Source | Scénario | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-49 | P, AC-07 | Une sélection masque une branche (Sosa 16) | **Aucun contournement** : relations, participations, présences, situations, recherches, compteurs, exports | P24, DI-L16 |
| S-50 | CA-07 | Le verbatim d'une assertion incluse nomme une personne exclue | Le verbatim est **masqué** (ou l'assertion exclue) | P24, DI-L21 |
| S-51 | AC-06 | Personne vivante en mode `masqué` dans une sélection | **Omise** ou remplacée par une mention neutre, sans reconstitution possible | DI-L21 |
| S-52 | NC-07 | Sélection `révoquée` : un collaborateur du destinataire y accède encore | **Refus** | § 6 |
| S-53 | NC-07 | Une réduction intervient pendant une proposition d'élargissement en attente | La réduction s'applique à la **version active** ; les ajouts proposés restent non confirmés | DI-L22 |
| S-54 | L | RS, qui détient `voir` et son pouvoir de délégation, partage une sélection avec le projet COL | **Effectif** pour les collaborateurs de COL | § 6 |
| S-55 | CA | L'auteur de la règle de sélection perd `voir` sur un objet du manifeste | Cet objet **n'est plus servi**, les autres le restent | § 3.2, § 6 |

## 8. Réutilisation, révocation et hors ligne

| ID | Source | Scénario | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-56 | P | Une copie a été légitimement réutilisée avant la révocation | **Conservée** selon ses droits autonomes (licence, provenance) ; plus de mise à jour | DI-A38, DI-A41 |
| S-57 | AC-16 | La copie est resélectionnée ou publiée par son nouvel espace | **Permis** si la licence l'autorise et qu'aucune protection ne s'y oppose ; sinon refus | DI-A41 |
| S-58 | P | Un cache contient une décision positive antérieure à une révocation | **Refus** de toute nouvelle lecture connectée | A6, CP-40 |
| S-59 | P | Un appareil est hors ligne lors d'une révocation | **Résidu temporaire** conforme à CP-28 (borné par la durée maximale) ; retrait à la synchronisation effective | A6, CP-28 |
| S-60 | NC-09 | Espace `familial` partagé par plusieurs personnes, réplication hors ligne | Réplication **bornée** (durée maximale) dès que l'espace a plus d'un membre | A6 |
| S-61 | AC-14 | Une contribution hors ligne refusée pour raison de droits | Son auteur relit **seulement son delta**, jamais le contenu retiré | CP-27 |
| S-62 | NC-12 | Un collaborateur du projet destinataire, autorisé à commenter par une sélection, commente hors ligne | La contribution est **reçue et intégrée** si le droit existe encore à l'intégration | § 6 |
| S-63 | AC-08 | Écriture avec une référence vers un objet invisible | **Même erreur, même délai** que pour un objet absent | A5, TI-11 |

## 9. Unicités, publications et campagnes

| ID | Source | Scénario | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-64 | AC-05, CA-05 | Deux membres créent chacun une base justificative, une référence ou un choix d'affichage sur la même cible | **Aucune violation d'unicité** ne révèle l'objet d'autrui ; chaque contexte légitime peut créer le sien | TI-11 |
| S-65 | AC-09 | Un numéro d'un autre espace s'insère dans la série d'un espace | **Refus** sans acceptation par l'autorité éditoriale de la série ; aucun rang occupé avant l'acceptation | A2, § 4 |
| S-66 | AC-30 | Un participant de campagne non relié à un acteur, pendant la phase indépendante | **Cloisonné** : ne voit pas les réponses des autres (la participation exige un acteur identifié) | § 7 |

## 10. Bilan

- **66 scénarios** : les 15 du porteur ; tous les scénarios d’attaque des deux audits qui touchent l’autorisation ; 10 cas légitimes (L).
- **Hors batterie :** les constats sans lien avec l'autorisation (AC-19 à AC-27, NC-13, NC-15, DI-A37, DI-K11), traités dans les corrections parallèles.
- **À figer par le porteur** : la batterie entière, et les réponses aux questions Q1 à Q4 du contrat, dont dépendent S-39, S-46, S-47 et S-15.
