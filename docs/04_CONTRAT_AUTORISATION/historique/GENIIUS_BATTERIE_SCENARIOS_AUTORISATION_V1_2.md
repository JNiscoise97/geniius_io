# GENIIUS — Batterie de scénarios du contrat d'autorisation

**Version :** V1.2 — **remplacée** par la [V1.3 candidate](GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_3.md) (10/10/2026). Conservée pour l’historique.
**Référentiel :** [contrat d'autorisation V1 révisé](../GENIIUS_CONTRAT_AUTORISATION.md).
**Rapport de cohérence :** [RAPPORT_COHERENCE_CONTRAT_BATTERIE_V1_1.md](../travaux/RAPPORT_COHERENCE_CONTRAT_BATTERIE_V1_1.md), § 9 (révision V1.2). Le porteur a exclu ce rapport des preuves de conformité du contrôle indépendant.

**Règles de la batterie**
- Les résultats attendus sont fixés **avant** la réécriture du dictionnaire et du MLD.
- Le futur audit indépendant rejouera chaque scénario contre le MLD réécrit ; un écart sera un constat.
- Chaque scénario a des **préconditions** explicites, **une** opération, un **résultat observable et binaire** (aucune variante interne) et un **fondement** normatif (clause du contrat, principe, règle).

**Acteurs types**
- **ADM** : administrateur seul (appartenance administrative, aucun rôle scientifique) ;
- **RS**, **RS2** : responsables scientifiques ;
- **COL** : collaborateur ; **LEC** : lecteur ;
- **TIT** : titulaire d'un objet `privé` ;
- **SUP1**, **SUP2** : personnes distinctes de l'autorité de dérogation de plateforme ;
- **C** : cédant ; **K** : cessionnaire.
- **P** désigne un projet.

**« Refus »** signifie : opération rejetée, aucune donnée créée, réponse indistinguable d'une absence lorsqu'une cible protégée est en jeu (CP-40, OB-04).

## 1. Auto-habilitation et privilèges administratifs

| ID | Préconditions | Opération | Résultat attendu (observable) | Fondement |
|---|---|---|---|---|
| S-01 | M a créé une note `privé` N (M titulaire). X est membre de P, sans droit sur N. | X crée une règle de titulaire sur N à son profit. | **Refus.** Aucune règle créée ; X ne voit pas N. | § 3.1 ; A3 |
| S-02 | RS de P (aussi administrateur) ; COL a une note `privé` N. | RS crée une règle de titulaire sur N à son profit. | **Refus.** RS ne voit pas N. | § 3.1 ; A3 ; § 5 (Q4) |
| S-03 | ADM sur P, sans droit de contenu ; Y complice, sans droit. | ADM crée une règle `voir` sur le contenu `projet` de P au profit de Y. | **Refus.** Y ne voit rien. | A1 ; A2 ; § 4 |
| S-04 | ADM sur P. | ADM s'attribue l'appartenance `lecteur` de P. | **Refus.** Aucune appartenance créée. | A3 ; § 5 |
| S-05 | ADM sur P. | ADM crée une règle nominative `voir` à son profit sur l'espace P. | **Refus.** | A1 ; A3 |
| S-06 | ADM sur P ; groupe G créé par ADM, vide. | ADM s'ajoute à G. | **Refus** (auto-ajout). G reste vide. | A3 ; § 6 (groupes) |
| S-07 | ADM sur P ; TIT a un objet `privé` O. | ADM crée une règle `voir` sur O au profit du rôle `lecteur` de P. | **Refus.** Aucune règle créée ; les lecteurs de P ne voient pas O. | A1 ; A2 ; § 6 (règles) |
| S-08 | Programme G parent de P (rattachement actif) ; X administrateur de G, sans rôle dans P. | X crée une règle `voir` sur le contenu de P au profit du groupe « Coordination ». | **Refus.** Aucune règle ; la Coordination ne voit rien de P. | A1 ; A2 ; P23 ; § 6 |
| S-09 | LEC de P (`voir`, sans `repartager`) ; groupe H. | LEC crée une règle `voir` sur le contenu `projet` de P au profit de H. | **Refus.** Les membres de H ne voient rien. | A1 ; § 3.2 (condition 1) |
| S-10 | ADM, seul administrateur de P, a nommé Z administrateur (gouvernance, journalisée) ; Z n'a aucun rôle scientifique. | Z nomme ADM `lecteur` de P. | **Refus** : un administrateur ne confère pas d'appartenance scientifique. ADM ne lit rien. | A2 ; § 4 ; § 5 |
| S-11 | ADM sur P ; P contient une règle d'existence protégée sur un objet O. | ADM consulte les métadonnées de gouvernance de P. | Visibles : membres et rôles, règles (auteur, bénéficiaires, dates, état) ; **non visibles** : cible, titre et libellé de O, ni même la règle d'existence qui le concerne. | A2 ; § 4 |
| S-12 | ADM sur P ; une lettre publiée et diffusée par e-mail ; ADM n'a pas de droit de lecture sur son contenu. | ADM consulte les diffusions de P. | Visibles : date, canal, audience, nombre de destinataires, résultat ; **non visible** : le contenu de la lettre. | § 4 |

## 2. Délégation, chaîne et dépendance

| ID | Préconditions | Opération | Résultat attendu (observable) | Fondement |
|---|---|---|---|---|
| S-13 | RS de P (droits et `repartager` par défaut sur le contenu `projet`). | RS confère à M l'appartenance `collaborateur`. | M voit, commente, édite le contenu `projet` de P ; journal : auteur RS, date, fondement. | § 3.2 ; § 5 |
| S-14 | TIT, titulaire de l'objet `privé` O ; V collègue. | TIT crée une règle `voir` sur O au profit de V. | V voit O, et seulement O. | § 3.1 ; § 3.2 |
| S-15 | RS1 de P (droits et pouvoirs délégables sur le contenu `projet` de P) ; COL a un objet `privé` O ; RS2 membre de P a reçu la nomination. | RS2 accepte sa nomination de `responsable scientifique`, faite nominativement par RS1. | RS2 est responsable scientifique de P, sur le contenu `projet` de P et rien de plus. Journal : auteur, date, périmètre, acceptation. RS2 **ne voit pas** O. | § 5 (Q4) ; § 3.2 ; A1 |
| S-16 | RS crée une règle R `voir` sur le contenu `projet` au profit de V ; personne d'autre n'a confirmé ni prolongé R. | RS perd son rôle (fin d'appartenance). | À l'évaluation suivante, V **ne voit plus** le contenu ; aucun acte supplémentaire n'est requis. | § 3.2 (dépendance) |
| S-17 | Comme S-16 ; avant le départ de RS, RS2 (droits et pouvoirs sur le même périmètre) a prolongé R jusqu'à la date D2, dans les limites de ses propres droits. | RS perd son rôle. | R **reste effective**, avec RS2 pour fondement, **sur le périmètre et jusqu'à l'échéance que RS2 pouvait lui-même accorder**, et pas au-delà. | § 3.2 (dépendance, actes sur une délégation) ; A1 |
| S-18 | R créée par RS ; ADM n'a pas `voir`. | ADM prolonge R. | **Refus.** R et son échéance restent inchangées. | § 3.2 ; A2 |
| S-19 | Règle R au profit du groupe extérieur « Coordination », en `approbation préalable`, créée par RS ; A1 déjà admis par RS ; RS2 a les mêmes droits et pouvoirs que RS. | RS2 admet A2. | R garde son identité ; A1 reste admis ; A2 est admis, avec RS2 pour fondement de cette admission. | § 3.2 ; A4 |
| S-20 | Règle R révoquée la veille ; groupe extérieur en `approbation préalable`. | RS admet un membre au titre de R. | **Refus.** R n'est pas réactivée. | A4 |
| S-21 | COL a `voir` sur le contenu `projet`, sans `repartager`. | COL crée une règle `voir` au profit d'un tiers T. | **Refus.** T ne voit rien. | A1 ; § 3.2 (condition 4) |
| S-22 | RS a délégué `voir` avec `repartager` à COL ; COL a délégué `voir` à T. | RS retire la délégation faite à COL. | COL **et** T perdent l'accès à l'évaluation suivante. | § 3.2 (dépendance) |
| S-23 | A a délégué `voir` avec `repartager` à B. | B délègue `voir` avec `repartager` à A, sur le même périmètre. | **Refus** (cycle de délégation). | § 3.2 ; CP-40 |

## 3. Groupes, programmes et rattachements

| ID | Préconditions | Opération | Résultat attendu (observable) | Fondement |
|---|---|---|---|---|
| S-24 | Groupe G bénéficiaire d'une règle `voir` sur le contenu `projet` de P ; X membre de P, non membre de G. | X s'ajoute à G. | **Refus.** X ne voit rien de plus. | A3 |
| S-25 | G bénéficiaire **uniquement** d'une règle `voir` sur le contenu `projet` de P ; RS détient `voir` et `repartager` sur ce contenu. | RS ajoute M à G. | M est membre de G et voit le contenu `projet` de P. | § 6 (groupes) ; § 3.2 |
| S-26 | G bénéficiaire d'une règle `voir` sur le contenu `projet` de P ; ADM sur P. | ADM ajoute M à G. | **Refus** : aucune appartenance à G n'est créée, qu'elle soit effective ou « sans effet ». | § 6 (groupes, révisé) ; A1 ; A2 |
| S-27 | Groupe « Coordination » du programme, bénéficiaire d'une règle sur le sous-projet SP en `approbation préalable` ; RS de SP ; B nouveau membre de la Coordination, non admis. | RS de SP admet nominativement A. | A voit ce que la règle ouvre ; B ne voit rien. | § 6 ; DD-22 |
| S-28 | Programme G parent de SP ; X administrateur de G, sans rôle dans SP. | X consulte un objet `projet` de SP. | **Refus.** | A2 ; P23 |
| S-29 | Règle R fondée sur le rattachement SP → G ; une autre règle R' accordée à la même personne par RS de SP, sans lien avec le rattachement. | Le rattachement prend fin. | R cesse ; R' reste effective. | § 3.2 (dépendance) |

## 4. Transfert de gouvernance

| ID | Préconditions | Opération | Résultat attendu (observable) | Fondement |
|---|---|---|---|---|
| S-30 | C propriétaire et responsable scientifique de l'espace E ; transfert à K présenté. | K accepte le transfert. | C ne détient plus aucune appartenance, aucun rôle ni règle sur E ; il ne lit plus rien de E (sauf objets traités par la voie (c), dans son propre espace) ; ses crédits restent. | § 3.3.4 ; DD-26.4 |
| S-31 | Comme S-30 ; C membre du groupe « Famille » de E, bénéficiaire de `voir`. | K accepte le transfert. | C n'est plus membre de « Famille » ; il ne lit plus rien par ce groupe. | § 3.3.4 |
| S-32 | Comme S-30 ; C bénéficiaire d'un embargo d'existence sur le témoignage T. | K accepte le transfert. | C n'est plus bénéficiaire ; T n'existe plus pour lui. | § 3.3.4 |
| S-33 | Comme S-30 ; TIT, membre de E, a accordé à C une règle `voir` sur son journal `privé` J. | K accepte le transfert. | La règle au profit de C est éteinte ; **K n'acquiert aucun droit sur J** ; TIT garde les siens. La règle n'apparaît pas parmi les délégations réémissibles (habilitant TIT, pas C). | § 3.3.5 |
| S-34 | Comme S-30 ; une règle `interdire` d'existence visait C sur T. | K accepte le transfert. | L'interdiction n'est pas transférée ; K n'en hérite pas ; T reste régi par ses autres règles. | § 3.3.5 |
| S-35 | C a posé la règle de sélection G1 (BOVALO → Colimaçons), présentée **nominativement** à réémettre à l'identique (bénéficiaire, périmètre, actions, échéance), non expirée. Transfert présenté de C à K. | K accepte le transfert en réémettant G1 à l'identique. | Une **nouvelle** délégation G1' existe : identité propre, habilitant et auteur K, date de l'acceptation, lien « réémission de G1 ». G1 est close à la même date, et **son auteur reste C** dans l'historique. Les collaborateurs des Colimaçons gardent l'accès sans interruption. | § 3.3.5 (identité) ; A1 |
| S-36 | Transfert présenté de C à K (empreinte E1) ; ensuite, C ajoute 40 membres au groupe bénéficiaire « Cousins ». | K accepte le transfert. | **Refus** de l'acceptation (empreinte modifiée) ; nouvelle présentation exigée ; rien n'est appliqué. | § 3.3.2 ; § 3.3.3 ; § 3.3.7 |
| S-37 | Transfert accepté de C à K ; E archivé puis rouvert. | La réouverture de E. | C n'a toujours aucun droit sur E. | A4 |
| S-38 | Transfert de C à K. | K accepte le transfert. | K administre E et lit son contenu `projet` (rôle `responsable scientifique` attribué par le système). | § 3.3.4 |
| S-39 | C titulaire de trois objets `privé` dans E ; un sort est retenu pour deux d'entre eux ; le troisième n'a aucune voie retenue. | K tente d'accepter le transfert. | **Refus** de l'acceptation ; blocage signalé à C et à K. Aucun objet n'est rendu invisible ; C garde ses droits de titulaire jusqu'à la résolution. | § 3.3.3 ; § 3.3.6 (Q1) |

## 5. Titulaire et créations automatiques

| ID | Préconditions | Opération | Résultat attendu (observable) | Fondement |
|---|---|---|---|---|
| S-40 | Tâche automatique de plateforme, sans déposant identifiable. | La tâche crée des objets `privé` dans E. | Aucun droit personnel créé ; l'activité est imputée à l'acteur institutionnel technique ; les objets ne sont accessibles que par dérogation. | § 3.1 ; DI-A39 |
| S-41 | ADM sur E, sans rôle scientifique ; un GEDCOM appartenant à M est déposé par ADM depuis son poste ; ADM n'a aucun droit sur ce fichier. | ADM lance l'import. | ADM **n'est pas** titulaire des objets `privé` créés ; aucun droit personnel n'est créé. | § 3.1 |
| S-42 | Référentiel commun en amorçage. | Création des concepts par l'acteur institutionnel d'amorçage. | Aucun droit de titulaire ; visibilité publique explicite. | § 3.1 |

## 6. Embargos, restrictions légales et dérogations

| ID | Préconditions | Opération | Résultat attendu (observable) | Fondement |
|---|---|---|---|---|
| S-43 | Témoignage T sous embargo interne d'existence ; bénéficiaires : TIT et RS ; ADM non bénéficiaire. | ADM, puis un lecteur public, recherchent, comptent, parcourent, exportent, consultent notifications et métadonnées de gouvernance. | Aucune trace de T : ni résultat, ni compteur, ni lien, ni ligne d'export, ni notification, ni métadonnée. | A5 ; § 7 (étape 2) |
| S-44 | Embargo d'existence dont le groupe « Proches » est bénéficiaire ; ADM non membre. | ADM s'ajoute à « Proches ». | **Refus** (auto-ajout ; ADM ne détient pas le pouvoir de délégation requis). | A1 ; A3 ; § 6 |
| S-45 | RS1 et RS2 responsables scientifiques de P ; RS1 a créé sur l'objet `projet` O un embargo interne d'existence, dont il est seul bénéficiaire ; RS1 quitte ensuite P. | RS2 lève l'embargo. | Levée **acceptée** : RS2 est gardien d'office pour un contenu `projet`. O redevient visible selon ses autres règles. RS2 n'acquiert aucun droit au-delà des siens. | § 6 (embargos) ; § 5 (Q4) |
| S-46 | Objet O sous embargo interne d'existence ; SUP1 et SUP2, personnes distinctes et indépendantes de l'autorité de dérogation, aucune bénéficiaire ; finalité « vérification d'intégrité », 2 jours. | SUP1 demande et SUP2 approuve un **accès exceptionnel** à O. | Accès accordé à SUP1, pour la finalité et pendant 2 jours, avec un journal renforcé. **L'embargo reste en place** : pour tout autre acteur, O n'existe toujours pas ; à l'échéance, SUP1 ne voit plus O. | § 3.4 (deux opérations ; Q3 ; D-3) |
| S-47 | Restriction légale sur un document D : référence structurée (nature, fondement, portée, période, autorité compétente pour la levée). | SUP1 et SUP2 approuvent une dérogation interne pour lever ou franchir la restriction. | **Refus.** Seule une décision de l'autorité compétente, enregistrée comme fondement, peut lever ou ouvrir l'accès, dans ses limites. | § 3.4 (Q2) ; § 7 (étape 0) |
| S-48 | Objet O dont l'existence est protégée pour l'acteur E. | E exporte l'espace. | O n'est ni exporté, ni listé, ni compté nominativement dans l'export de E. | A5 ; CP-46 |

## 7. Partage sélectif

| ID | Préconditions | Opération | Résultat attendu (observable) | Fondement |
|---|---|---|---|---|
| S-49 | Sélection active « BOVALO depuis le Sosa 31 », Sosa 16 exclu ; règle `voir` au profit des collaborateurs du projet COL. | Un collaborateur de COL recherche, parcourt, compte et exporte autour du Sosa 31. | Aucune information sur le Sosa 16 ni sa branche : ni relation, participation, présence, situation, résultat de recherche, compteur, ni export. | P24 ; DI-L16 ; § 6 (sélections) |
| S-50 | Comme S-49 ; l'assertion de naissance du Sosa 31, incluse, a un verbatim « parrain Jean BOVALO » (Sosa 16, exclu). | Le collaborateur consulte l'assertion. | Le nom « Jean BOVALO » n'est pas observable : la partie du verbatim qui le nomme est remplacée par une mention neutre. | P24 ; DI-L21 |
| S-51 | Personne vivante V incluse en mode `masqué` dans une sélection active. | Un destinataire consulte la branche. | Aucun nom, attribut, relation ni référence indirecte de V n'est observable. Seule une mention neutre peut signaler une place, sans rien révéler. | DI-L21 |
| S-52 | Sélection S passée à `révoquée`. | Un collaborateur du destinataire consulte un objet du dernier manifeste actif. | **Refus.** | § 6 (sélections) |
| S-53 | Sélection S, version active 3 ; proposition 4 (élargissement) en attente. | Le titulaire crée une réduction. | La réduction est calculée sur la version 3 ; les ajouts de la version 4 restent non confirmés et non servis. | DI-L22 |
| S-54 | RS de P détient `voir` et `repartager` sur les objets de la sélection S. | RS crée une règle `voir` sur S au profit du rôle `collaborateur` du projet COL. | Les collaborateurs de COL voient le manifeste actif de S, selon les modes d'inclusion. | § 6 (sélections) ; § 3.2 |
| S-55 | Comme S-54 ; RS perd `voir` sur l'objet O du manifeste (O passe en `privé` d'un autre titulaire). | Un collaborateur de COL consulte O, puis un autre objet du manifeste. | O n'est **plus servi** ; les autres objets le restent. | § 3.2 (dépendance) ; § 6 |

## 8. Réutilisation, révocation, hors ligne et contributions

| ID | Préconditions | Opération | Résultat attendu (observable) | Fondement |
|---|---|---|---|---|
| S-56 | Q a repris une copie Q' d'un objet de S grâce à une règle `réutiliser` active lors de la reprise ; la règle est ensuite révoquée. | Q consulte Q'. | Q' est conservée, avec sa provenance et sa licence ; elle ne reçoit plus de mise à jour depuis l'origine. | DI-A38 ; DI-A41 |
| S-57 | Q a repris une copie Q' d'un objet de S grâce à une règle `réutiliser` active lors de la reprise ; la licence de Q' autorise la redistribution ; aucun embargo, consentement refusé, protection DI-E05 ni droit de tiers sur Q'. | Q inclut Q' dans sa propre sélection, partagée avec un troisième espace. | **Permis**, sans accord de l'espace d'origine. | DI-A41 ; arbitrage D3 |
| S-58 | M a consulté O en ligne ; une décision positive est en cache ; la règle de M est révoquée à T. | M demande O en ligne à T + 1 s. | **Refus.** Le cache n'est pas servi. | A6 ; CP-40 |
| S-59 | Appareil de M hors ligne avec une réplique de l'espace E, réplication `limitée` (durée maximale D) depuis la dernière revalidation T0 ; la règle de M est révoquée à T. | M consulte O hors ligne à T + x, puis se reconnecte. | Hors ligne, consultation possible au plus jusqu'à min(reconnexion, T0 + D) : **résidu reconnu**. À la synchronisation, les retraits sont transmis d'abord, sous forme non qualifiée ; O disparaît de l'appareil ; les contributions locales de M sont conservées et transmises en contribution différée ; aucune donnée nouvelle n'est reçue. | A6 ; CP-28 |
| S-60 | Espace `privé` E à **membre unique** M ; sa réplique hors ligne contient un objet partagé avec M par une règle révocable d'un autre titulaire. | M active la réplication hors ligne de E sans échéance locale. | **Refus** : une échéance locale opposable est exigée, même avec un seul membre. | A6 (D-4) ; § 6 (hors ligne) |
| S-61 | Contribution hors ligne de M sur un objet dont le partage a été révoqué entre-temps. | Intégration de la contribution. | Refusée pour raison de droits ; M relit seulement son delta, jamais le contenu retiré. | CP-27 ; CP-28 |
| S-62 | Collaborateur du projet COL autorisé à `commenter` par la sélection S, sans appartenance à l'espace source ; règle encore active à l'intégration. | Il commente hors ligne, puis se synchronise. | La contribution est reçue, puis **intégrée**. | § 6 (contributions) ; CP-27 |
| S-63 | Objet O invisible pour M ; identifiant de O connu de M ; identifiant fictif F. | M écrit une référence vers O, puis vers F. | Même erreur et même délai dans les deux cas. | A5 ; TI-11 |

## 9. Unicités, publications et campagnes

| ID | Préconditions | Opération | Résultat attendu (observable) | Fondement |
|---|---|---|---|---|
| S-64 | M1 et M2 membres de P ; M1 a une base justificative de portée `projet`, en vigueur, sur l'assertion A, visible de tous les membres (visibilité liée à la portée). | M2 crée une base de portée `projet` sur A. | Conflit signalé à M2, qui **voit** la base existante. Aucune base invisible pour M2 ne peut provoquer ce conflit. | TI-11 ; OB-04 ; CP-49 (à réécrire) |
| S-65 | Série S de l'espace A ; numéro N de l'espace B. | B insère N dans S au rang 13. | **Refus** sans acceptation par un détenteur de l'autorité éditoriale de S ; le rang 13 reste libre. | A2 ; § 4 |
| S-66 | Campagne en phase indépendante ; participant Y relié à un acteur. | Y consulte les réponses des autres participants. | Rien n'est servi. | § 7 (étape 2) |

## 10. Arbitrages Q1 et Q4 : cas ajoutés en V1.1

| ID | Préconditions | Opération | Résultat attendu (observable) | Fondement |
|---|---|---|---|---|
| S-67 | C titulaire de l'objet `privé` O dans E ; voie (b) retenue pour O et figée dans la présentation ; K a accepté explicitement le transfert de O. | K accepte le transfert. | **Dans une seule transaction :** K reçoit la gouvernance de E et devient titulaire de O (droits et `repartager`) ; C n'a plus aucun droit sur O ni sur E ; la paternité scientifique de C (activités, crédits) est conservée ; embargos et consentements sur O sont inchangés. | § 3.3.6 (b) ; § 3.3.7 ; § 3.1 |
| S-68 | C titulaire de l'objet `privé` O dans E ; voie (c) retenue, avec une licence qui autorise la copie et aucune protection qui s'y oppose ; l'original O suit la voie (a). | K accepte le transfert. | **Dans une seule transaction :** une copie O' est créée dans l'espace personnel de C, liée à O par une `FILIATION` (provenance, version d'origine, licence) ; O reste dans E, versé au contenu de l'espace, et K y accède par son rôle ; aucun déplacement de O. | § 3.3.6 (c) ; § 3.3.7 ; DI-A01 |
| S-69 | RS de P ; COL titulaire de l'objet `privé` O, sans règle au profit de RS. | RS crée une règle `voir` sur O au profit de LEC. | **Refus.** RS ne détient ni `voir` ni `repartager` sur O ; LEC ne voit rien. | A1 ; § 5 (Q4) |

## 11. Cas ajoutés en V1.2 (arbitrages D-1 à D-4, corrections du porteur, variantes éclatées)

| ID | Préconditions | Opération | Résultat attendu (observable) | Fondement |
|---|---|---|---|---|
| S-70 | Contenu `projet` O de P, sans protection d'existence ; SUP1 de l'autorité de dérogation, non bénéficiaire, sans lien d'intérêt ; procédure de support permettant un seul approbateur ; finalité « diagnostic d'affichage », 7 jours. | SUP1 accorde à l'agent de support A un accès exceptionnel en lecture à O. | Accès accordé à A, sur O seulement, pendant 7 jours, motivé et journalisé ; aucun autre objet n'est accessible. | § 3.4 (Q3, dérogation ordinaire) |
| S-71 | Comme S-70 ; l'accès exceptionnel de A a expiré la veille. | A consulte O. | **Refus.** | § 3.4 ; A4 |
| S-72 | ADM sur E, sans rôle scientifique ; M, membre de E, dépose lui-même son GEDCOM, dont il détient les droits. | ADM lance l'import du fichier déposé par M. | M est titulaire des objets `privé` créés ; ADM n'en reçoit aucun droit. | § 3.1 |
| S-73 | Comme S-57, mais la licence de Q' interdit la redistribution. | Q inclut Q' dans sa sélection partagée avec un troisième espace. | **Refus.** | DI-A41 ; arbitrage D3 |
| S-74 | Comme S-57, mais un embargo interne protège Q', ou un droit de tiers s'oppose à sa diffusion. | Q inclut Q' dans sa sélection partagée avec un troisième espace. | **Refus.** | DI-A41 ; arbitrage D3 ; A5 |
| S-75 | Comme S-68, mais la licence de O interdit la copie. | K tente d'accepter le transfert. | **Refus** de l'acceptation ; blocage signalé ; aucune copie, aucun changement de titulaire, aucune extinction : E reste entièrement à C. | § 3.3.6 (blocage) ; § 3.3.7 |
| S-76 | COL de P, sans pouvoir de délégation ; objet `projet` O de P. | COL crée un embargo d'existence sur O. | **Refus.** Seuls le titulaire (objet `privé`) ou un responsable scientifique (contenu `projet`) créent un embargo. | § 6 (embargos) |
| S-77 | Objet O sous embargo interne d'existence, sans plus aucun gardien ; SUP1 et SUP2 indépendants. | SUP1 et SUP2 approuvent la **levée** de l'embargo par dérogation. | **Refus** : une dérogation ne lève pas une protection ; l'embargo reste. | § 3.4 (deux opérations) |
| S-78 | Comme S-77 ; TIT est titulaire de O. | SUP1 et SUP2 désignent TIT comme gardien de l'embargo. | TIT devient gardien ; désignation journalisée (deux approbateurs, fondement) ; l'embargo est inchangé. | § 3.4 ; § 6 |
| S-79 | TIT gardien de l'embargo d'existence sur O, désigné selon S-78. | TIT lève l'embargo. | Levée **acceptée** ; O redevient visible selon ses autres règles. | § 6 ; § 3.4 |
| S-80 | Comme S-46, mais l'approbation est donnée par SUP1 sous un second compte. | Demande et approbation de l'accès exceptionnel. | **Refus** : un seul être humain. | § 3.4 (D-3) |
| S-81 | Comme S-46, mais SUP2 est aussi bénéficiaire de l'accès demandé. | SUP2 approuve l'accès exceptionnel demandé par SUP1 pour SUP1 et SUP2. | **Refus** : un approbateur ne peut pas être bénéficiaire. | § 3.4 (Q3, D-3) |
| S-82 | Comme S-46 ; seul SUP1 approuve. | SUP1 accorde l'accès exceptionnel à O, protégé en existence. | **Refus** : deux approbateurs sont requis pour franchir une existence protégée. | § 3.4 (Q3) |
| S-83 | Espace `privé` E à membre unique, ne contenant que des objets publics librement redistribuables. | Son membre active la réplication hors ligne sans échéance locale. | **Permis.** | A6 (D-4) ; § 6 (hors ligne) |
| S-84 | Transfert présenté : voie (b) pour O1, voie (c) pour O2 ; entre la présentation et l'acceptation, un consentement couvrant O1 est retiré, ce qui interdit son transfert. | K accepte le transfert. | **Refus** de toute l'acceptation : ni gouvernance transférée, ni titulaire changé, ni copie de O2 créée, ni droit éteint. Cause signalée. | § 3.3.7 (atomicité) ; § 3.3.2 |
| S-85 | Comme S-35, mais K réémet G1 avec une échéance plus lointaine que celle présentée. | K accepte le transfert avec cette réémission. | **Refus** de l'acceptation : une réémission ne peut pas élargir ce qui a été présenté. | § 3.3.5 ; A1 |
| S-86 | Comme S-35, mais K ne réémet pas G1, présentée comme réémissible. | K accepte le transfert. | Transfert accepté ; G1 est close à la date de l'acceptation ; les Colimaçons perdent l'accès qu'elle ouvrait. | § 3.3.5 (silence) |
| S-87 | Comme S-35, mais G1 a expiré avant l'acceptation. | K accepte le transfert en réémettant G1. | **Refus** de l'acceptation : une délégation expirée n'est pas réémise. | § 3.3.5 ; A4 |
| S-88 | Transfert présenté (empreinte E1) ; une règle de E bénéficie au rôle `collaborateur` du projet F ; ensuite, F ajoute des collaborateurs. | K accepte le transfert. | **Refus** de l'acceptation (audience modifiée) ; nouvelle présentation exigée. | § 3.3.2 ; § 3.3.3 |
| S-89 | ADM sur P ; TIT a un objet `privé` O. | ADM crée une règle `voir` sur O au profit du `public`. | **Refus** ; O reste invisible du public. | A1 ; A2 ; § 6 (règles) |
| S-90 | RS1 a nommé RS2 ; RS2 n'a pas encore accepté. | RS2 consulte un objet `projet` de P au titre de la nomination. | **Refus** : sans acceptation, aucune nomination n'existe. | § 5 (Q4) |
| S-91 | M1 a une base justificative de portée `privée` sur l'assertion A. | M2 crée sa propre base de portée `privée` sur A. | Création acceptée, sans conflit ; aucune des deux bases n'est visible de l'autre auteur. | TI-11 ; CP-49 (à réécrire) |
| S-92 | Campagne en phase indépendante ; personne Y invitée, non reliée à un acteur. | Y répond à la campagne. | **Refus** : une participation exige un acteur identifié. | § 7 (étape 2) |
| S-93 | Comme S-67, mais K n'a pas accepté explicitement le transfert de O. | K accepte le transfert. | **Refus** de l'acceptation ; rien n'est appliqué. | § 3.3.6 (b) ; § 3.3.7 |

## 12. Bilan

- **93 scénarios**, chacun avec une opération unique et un résultat binaire :
  - les 69 de la V1.1, dont 16 réécrits : S-07, S-10, S-15, S-35, S-36, S-41, S-45, S-46, S-50, S-51, S-57, S-60, S-64, S-66, S-67, S-68 ;
  - 24 ajoutés : S-70 à S-93.
- **Statut : candidate, non gelée.** Le gel relève du porteur, après un contrôle indépendant en aveugle.
