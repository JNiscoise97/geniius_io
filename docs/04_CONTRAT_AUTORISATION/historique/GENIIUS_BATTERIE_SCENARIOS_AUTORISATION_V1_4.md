# GENIIUS — Batterie de scénarios du contrat d’autorisation

**Version :** V1.4 — **remplacée** par la V1.5 ([GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_5.md](GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_5.md)). Elle remplaçait la V1.3 (147 scénarios).

**Fichier généré** par `spec/autorisation/generer_batterie.py` à partir de `spec/autorisation/tests/test_scenarios.py`. Chaque ligne est un test automatisé : on modifie le test, puis on régénère ; on ne modifie jamais ce fichier à la main.

**Référentiel :** [contrat d’autorisation V1.4](../GENIIUS_CONTRAT_AUTORISATION.md). Les fondements citent ses clauses (§ n, A1 à A7, I-n, T-n).

**Règles de la batterie**
- Chaque scénario a des préconditions atteignables, **une** opération (suivie, le cas échéant, de la consultation qui l’observe), un résultat binaire et observable, et un fondement qui existe dans le contrat.
- « **Refus** » : opération rejetée, rien n’est créé. « **Introuvable** » : réponse indistinguable d’une absence.
- Les identifiants V1.3 sont conservés ; les nouveaux commencent à S-149. S-124 n’est pas attribué.
- La batterie est une **base de régression**, pas une couverture exhaustive : elle est complétée par `test_proprietes.py` (invariants I-1 à I-14 sur des états aléatoires) et `test_transitions.py` (matrices d’états et combinaisons).

**Espaces types :** P (projet), ESP (espace transféré de C à K), CLM (les Colimaçons), F (autre espace), PRG (programme) et SP (sous-projet), Q et TS (réutilisation).

**Acteurs types :** R0 racine et propriétaire de P ; RS, RS1, RS2, RS3 responsables scientifiques ; ADM, ADM1, ADM2, ADME administrateurs ; COL, TIT collaborateurs ; LEC lecteur ; INV invité ; C cédant ; K cessionnaire ; SUP1 à SUP4 membres indépendants de l’autorité de dérogation (SUP1b : second compte de SUP1) ; AUT autorité externe ; A bénéficiaire de dérogation ; V, W, X, Y, Z… tiers.

## 1. Auto-habilitation et gouvernance

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-01 | TIT titulaire de l'objet `privé` priv ; LEC membre de P, sans droit sur priv. | LEC crée sur priv une habilitation à son profit. | **Refus.** | A3 ; § 6.3 |
| S-02 | RS de P ; TIT titulaire de l'objet `privé` priv. | RS crée sur priv une habilitation à son profit. | **Refus.** | A3 ; § 6.3 ; § 7.1 |
| S-69 | RS de P ; TIT titulaire de priv, sans habilitation au profit de RS. | RS crée une habilitation `voir` sur priv au profit de LEC. | **Refus.** | A1 ; § 7.1 |
| S-03 | ADM administrateur de P ; Y sans droit. | ADM crée une habilitation `voir` sur le contenu de P au profit de Y. | **Refus.** | A1 ; A2 |
| S-04 | ADM administrateur de P. | ADM se nomme `lecteur` de P. | **Refus.** | A3 ; § 7.1 |
| S-05 | ADM administrateur de P. | ADM crée une habilitation `voir` sur le contenu de P à son profit. | **Refus.** | A1 ; A3 |
| S-06 | ADM gestionnaire du groupe G de P, qui n'a aucun droit. | ADM s'ajoute à G. | **Refus** : s'ajouter soi-même à un groupe est interdit, quel que soit le groupe. | A3 ; § 9.1 |
| S-07 | ADM administrateur de P ; TIT titulaire de priv. | ADM crée une habilitation `voir` sur priv au profit du rôle `lecteur` de P. | **Refus.** | A1 ; A2 ; § 13.1 |
| S-08 | programme PRG ; XA administrateur de PRG, sans rôle dans le sous-projet SP. | XA crée une habilitation `voir` sur le contenu de SP au profit du groupe « Coordination ». | **Refus.** | A1 ; A2 |
| S-09 | LEC lecteur de P, sans `repartager` ; groupe H de P. | LEC crée une habilitation `voir` sur le contenu de P au profit de H. | **Refus.** | A1 ; § 8.1 (4) |
| S-10 | le propriétaire R0 a nommé Z administrateur de P ; Z n'a aucun rôle scientifique. | Z nomme ADM `lecteur` de P. | **Refus.** | A2 ; § 7.1 |
| S-11 | ADM administrateur de P ; l'objet O sous embargo d'existence dont ADM n'est pas bénéficiaire, avec une habilitation R' sur O ; une habilitation R sur l'objet non protégé Q. | ADM affiche la liste des habilitations de P, avec son total. | La liste contient R (cible désignée par identifiant et type, sans titre) et **aucune** ligne concernant O ; le total est égal au nombre de lignes. | § 10.3 ; § 15 |
| S-12 | ADM administrateur de P ; une lettre publiée et diffusée par courriel ; ADM sans droit de lecture sur son contenu. | ADM consulte les diffusions de P. | Visibles : date, canal, audience déclarée, nombre de destinataires, résultat. Le contenu de la lettre n'est pas visible. | § 10.3 |

## 2. Habilitations institutionnelles et personnelles, chaînes, départs

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-13 | RS de P. | RS confère à M l'appartenance `collaborateur` ; puis M consulte un objet du contenu de P. | **Accordé.** | § 7.1 ; § 7.2 |
| S-149 | comme S-13. | M édite un objet du contenu de P. | **Accordé.** | § 7.1 |
| S-14 | TIT titulaire de priv ; V extérieur. | TIT crée une habilitation `voir` sur priv au profit de V ; puis V consulte priv. | **Accordé.** | § 6.1 ; § 8.1 |
| S-15 | RS1 nommé RS par R0 ; RS1 a nommé RS2, qui a accepté ; TIT titulaire de priv. | RS2 consulte priv. | **Refus.** | § 7.2 ; § 6.3 |
| S-150 | comme S-15. | RS2 consulte un objet du contenu de P. | **Accordé.** | § 7.1 |
| S-16 | RS, nommé par R0, a signé l'HI R (`voir`, contenu de P) au profit de V ; R0 révoque ensuite la nomination de RS. | V consulte un objet du contenu de P. | **Accordé** : l'HI survit à la révocation de son signataire (F-1). | § 2.1 ; § 7.3 |
| S-17 | TIT a accordé `voir` + `repartager` sur priv à V1 et à V2 ; V1 a délégué `voir` sur priv à T ; V2 a confirmé cette HP ; TIT clôt l'habilitation de V1. | T consulte priv. | **Accordé** : V2 reste fondateur valide. | § 8.2 |
| S-18 | HI R signée par RS ; ADM n'a pas `voir`. | ADM prolonge R. | **Refus.** | T-04 ; A2 |
| S-19 | HI R au profit du groupe extérieur « Coordination », en `approbation préalable`, signée par RS ; RS2 RS de P ; AD2 membre de la Coordination, non admis. | RS2 admet AD2 ; puis AD2 consulte un objet du contenu de P. | **Accordé.** | § 9.3 |
| S-20 | HI R au profit de la Coordination, close la veille. | RS admet un membre au titre de R. | **Refus.** | A4 |
| S-21 | COL détient `voir` sur le contenu de P, sans `repartager`. | COL crée une habilitation `voir` sur le contenu de P au profit de T. | **Refus.** | A1 ; § 8.1 (4) |
| S-22 | RS a délégué `voir` + `repartager` sur o à COL (HI) ; COL a délégué `voir` sur o à T (HP). | RS clôt l'HI de COL ; puis T consulte o. | **Refus** (rupture de la chaîne). | § 8.2 ; T-11 |
| S-23 | TIT a délégué `voir` + `repartager` sur priv à VA ; VA a délégué `voir` + `repartager` sur priv à VB. | VB délègue `voir` + `repartager` sur priv à VA. | **Refus** (cycle). | § 8.2 (cycles) |
| S-108 | RS (non racine) a nommé COL2 collaborateur. | RS quitte P ; puis COL2 consulte un objet du contenu de P. | **Accordé** : l'HI survit au départ de son signataire. | § 7.6 ; § 2.1 |
| S-109 | R0 racine de P ; RS2 existe. | R0 quitte P sans transfert. | **Refus.** | § 7.6 |
| S-110 | TIT a délégué `voir` + `repartager` sur priv à V1 ; V1 à V2 ; V2 à V3, chaque fois avec `repartager`. | V3 confirme l'HP de V1 vers V2. | **Refus** : le droit de V3 passe par l'HP qu'il confirmerait. | § 8.2 (cycles) ; T-06 |
| S-111 | RS1 a nommé RS2 ; RS3, nommé par R0, n'est pas signataire de cette nomination. | RS3 clôt la nomination de RS2. | **Refus.** | § 7.4 |
| S-112 | RS1 nommé RS jusqu'à D1 = 10. | RS1 délègue `voir` à V jusqu'à D2 = 20. | **Refus.** | A1 ; § 7.2 |
| S-113 | RS de P seulement ; l'espace Q a un objet oq. | RS délègue `voir` sur oq à V. | **Refus.** | A1 ; § 8.1 |
| S-114 | RS1 nommé RS sur un périmètre limité à l'objet o. | RS1 nomme RS3 sur tout P. | **Refus.** | § 7.2 ; A1 |
| S-151 | RS1 a nommé RS3, qui a accepté. | la racine R0 clôt la nomination de RS3. | **Accepté.** | § 7.4 (CD-02) |
| S-152 | RS1 a nommé RS3 ; R0 révoque ensuite la nomination de RS1. | RS3 consulte un objet du contenu de P. | **Accordé.** | § 2.1 ; § 7.3 |
| S-153 | RS a signé l'HI R au profit de V ; R0 a révoqué RS. | R0 met R en examen ; puis V consulte un objet du contenu de P. | **Refus** (suspension immédiate). | § 7.5 ; T-07 |
| S-154 | comme S-153, R en examen. | R0 lève l'examen ; puis V consulte un objet du contenu de P. | **Accordé.** | § 7.5 ; T-08 ; A4 |
| S-155 | HI R signée par RS. | RS2, qui n'est pas la racine, met R en examen. | **Refus.** | § 7.5 |
| S-156 | RS a signé l'HI R ; R0 a révoqué RS. | R0 demande la liste des HI signées par RS. | La liste contient R. | § 7.5 ; A7 |
| S-157 | TIT a délégué `voir` + `repartager` sur priv à V1 jusqu'à 20 et à V2 jusqu'à 30 ; V1 a délégué `voir` à T jusqu'à 10 ; V2 a prolongé cette HP jusqu'à 25 ; il est 15. | T consulte priv. | **Accordé** : la portée effective est l'union des fondateurs valides. | § 8.2 (CD-16) |
| S-158 | RS a délégué `voir` + `commenter` sur o à V ; RS restreint ensuite l'habilitation à `voir`. | V commente o. | **Refus.** | T-05 |
| S-159 | comme S-17 avant la clôture : l'HP de T a pour fondateurs V1 et V2. | V1 retire son fondement ; puis T consulte priv. | **Accordé.** | T-12 ; § 8.2 |
| S-160 | comme S-159, avant le retrait. | V2, cofondateur mais ni auteur ni titulaire, clôt l'HP. | **Refus** : il ne peut que retirer son fondement. | § 8.3 |

## 3. Groupes, rôles, programmes, rattachements

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-24 | le groupe G de P est bénéficiaire d'une habilitation `voir` sur le contenu de P ; LEC membre de P, non membre de G. | LEC s'ajoute à G. | **Refus.** | A3 ; § 9.1 |
| S-25 | G géré par ADM ; RS a délégué `voir` sur le contenu de P à G en `approbation préalable` ; ADM a ajouté M à G. | RS admet M ; puis M consulte un objet du contenu de P. | **Accordé.** | § 9.3 |
| S-26 | comme S-25, avant l'admission. | M consulte un objet du contenu de P. | **Refus** : l'appartenance seule ne confère rien. | § 9.1 ; A2 |
| S-27 | programme PRG ; groupe « Coordination » géré par PRG, dont AC est membre ; RSP, racine de SP, a délégué `voir` sur osp à la Coordination en `approbation préalable`. | RSP admet AC ; puis AC consulte osp. | **Accordé.** | § 9.3 |
| S-94 | comme S-27 ; B ajouté à la Coordination par RG, non admis. | B consulte osp. | **Refus.** | § 9.3 |
| S-95 | RSP a délégué `voir` sur osp à la Coordination en mode `notification`. | RG ajoute Y à la Coordination ; puis Y consulte osp. | **Accordé** ; RSP est notifié de l'entrée de Y. | § 9.3 (notification) |
| S-96 | TIT titulaire de priv. | TIT délègue `voir` sur priv à la Coordination en mode `notification`. | **Refus** : seule l'`approbation préalable` est admise pour un objet personnel non public. | § 9.3 |
| S-28 | XA administrateur de PRG, sans rôle dans SP. | XA consulte osp. | **Refus.** | A2 |
| S-29 | RSP a délégué `voir` sur osp à V, conditionné par le rattachement SP → PRG. | le rattachement prend fin ; puis V consulte osp. | **Refus.** | § 13.13 ; T-13 |
| S-97 | comme S-29 ; un nouveau rattachement SP → PRG est ensuite établi. | V consulte osp. | **Refus** : aucune réactivation. | § 13.13 ; A4 |
| S-115 | HI de P au profit du rôle `collaborateur` de l'espace F, en `approbation préalable`. | RF, RS de F, nomme Z collaborateur de F ; puis Z consulte un objet du contenu de P. | **Refus** : Z n'est pas admis par P. | § 9.1 ; § 9.3 |
| S-116 | RS a délégué `voir` au groupe G de P ; ADM gère G. | ADM ajoute M à G. | **Accepté** comme appartenance (le groupe n'est pas gelé) ; M n'a aucun droit tant qu'il n'est pas admis. | § 9.1 |
| S-117 | TIT titulaire de priv, membre du groupe « Équipe » de P. | TIT délègue `voir` sur priv à « Équipe ». | **Accepté.** | A3 (permis) |
| S-161 | RS a délégué `voir` sur le contenu de P au groupe G en mode `notification` ; ADM1 et ADM2 administrateurs de P. | ADM1 ajoute ADM2 à G, ADM2 ajoute ADM1 à G ; puis ADM1 consulte un objet du contenu de P. | **Refus** : un gestionnaire n'est jamais admis automatiquement. | § 9.4 (F-2) ; I-3 |
| S-162 | TIT a délégué `voir` sur priv au rôle `collaborateur` de P (son propre espace). | RS nomme N collaborateur ; puis N consulte priv. | **Refus** : une HP au profit d'un rôle exige une admission. | § 9.2 (CD-13) |
| S-163 | RS a délégué `exporter` sur le contenu de P au rôle `lecteur` de P (HI). | RS nomme N2 lecteur ; puis N2 exporte o. | **Accordé** : HI au profit d'un rôle de son propre espace, sans admission. | § 9.2 |
| S-164 | comme S-95, Y admis automatiquement. | RSP retire l'admission de Y ; puis Y consulte osp. | **Refus.** | § 9.3 ; § 5.3 |
| S-165 | comme S-164, admission de Y retirée. | RG retire Y de la Coordination puis l'y ajoute de nouveau ; puis Y consulte osp. | **Refus** : le retrait exclut l'admission automatique. | § 9.4 |
| S-166 | RS a délégué `voir` + `repartager` sur o à COL (HI) ; COL a délégué `voir` sur o au groupe G en `notification` (HP) ; ADM a ajouté M à G. | RS clôt l'HI de COL ; puis M consulte o. | **Refus** : l'autorisation anticipée tombe avec les droits de l'habilitant. | § 9.3 ; § 8.2 |

## 4. Propriété et transfert

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-30 | C propriétaire et racine de ESP ; transfert à K préparé. | K accepte ; puis C consulte un objet du contenu de ESP. | **Refus.** | § 10.7 |
| S-31 | comme S-30 ; C membre du groupe « Famille » de ESP, bénéficiaire de `voir`, et admis par RS2. | K accepte ; puis C consulte un objet ouvert à « Famille ». | **Refus.** | § 10.7 |
| S-32 | comme S-30 ; C bénéficiaire et seul gardien d'un embargo d'existence sur l'objet T. | K accepte ; puis C cherche T. | Aucun résultat. | § 10.7 |
| S-33 | comme S-30 ; TIT2, collaborateur de ESP, a accordé à C `voir` sur son journal `privé` J. | K accepte ; puis K consulte J. | **Refus.** | § 10.7 |
| S-34 | comme S-30 ; T objet du contenu de ESP ; une interdiction d'existence, posée par RS2, avait C pour seul destinataire. | K accepte ; puis K consulte T. | **Accordé** : l'interdiction vise C, pas K. | § 10.7 (CD-21) |
| S-35 | C (comme RS) a signé l'HI G1, règle de sélection sur le contenu de ESP au profit du rôle `collaborateur` de CLM, en `approbation préalable`, et a admis CC. | K accepte sans réémission ; puis CC consulte un objet de la sélection. | **Accordé** : l'HI et son admission institutionnelle survivent. | § 2.1 ; § 10.7 (F-1) |
| S-36 | HI de C au profit du groupe « Cousins » de ESP ; transfert présenté (fenêtre ouverte). | C ajoute ZZ au groupe « Cousins ». | **Refus** (« espace en cours de transfert »). | § 10.6 (gel) |
| S-37 | transfert accepté de C à K ; ESP archivé puis rouvert par K. | C consulte un objet du contenu de ESP. | **Refus.** | A4 |
| S-38 | comme S-30. | K accepte ; puis K consulte un objet du contenu de ESP. | **Accordé.** | § 10.7 |
| S-39 | C titulaire de trois objets `privé` dans ESP ; aucune voie retenue pour l'un d'eux. | C présente le transfert. | **Refus** ; la cause est signalée au cédant seulement. | § 10.5 (blocage) |
| S-118 | RS2 administrateur et RS de ESP, non propriétaire ; C propriétaire. | RS2 lance le transfert de ESP à K. | **Refus.** | § 10.4 |
| S-119 | ESP2 préparé pour un tiers par C (désignation de garde au profit de K) ; premier transfert accepté par K. | C lance un nouveau transfert de ESP2. | **Refus.** | § 10.4 |
| S-120 | après le transfert de C à K, RS2, nommé par C, est resté RS de ESP (F-1). | RS2 nomme C collaborateur de ESP, sans le consentement de K. | **Refus.** | § 10.8 |
| S-121 | comme S-120, avec le consentement explicite de K. | RS2 nomme C collaborateur de ESP. | **Accepté.** | § 10.8 |
| S-122 | transfert présenté ; l'objet T de ESP est sous embargo d'existence posé par RS2, dont K n'est pas bénéficiaire ; RS2 a délégué `voir` sur T à V. | K affiche la présentation et ses totaux. | Elle est identique à celle qu'il verrait si T n'existait pas : ni T, ni l'embargo, ni l'habilitation sur T, ni aucun total ne les révèle. | § 10.6 ; I-5 (F-4) |
| S-167 | comme S-122. | contrôle d'audit du scellé de la présentation. | Le scellé d'audit contient l'embargo sur T. | § 10.6 (scellé d'audit) |
| S-123 | le propriétaire C, aussi racine, est décédé ; aucune désignation de garde ; aucun fondement légal enregistré. | SUP1 et SUP2 ouvrent une succession de ESP. | **Refus.** | § 10.4 (succession) |
| S-125 | ADME administrateur de ESP ; C propriétaire. | ADME consulte un objet du contenu de ESP. | **Refus.** | A2 ; § 10.1 |
| S-168 | C a nommé RS2 ; RS2 a nommé RS3. | K accepte ; puis K clôt la nomination de RS3. | **Accepté.** | § 7.4 ; § 10.7 (CD-02) |
| S-169 | transfert accepté ; RS2 resté RS. | RS2 crée une habilitation `voir` sur tout le contenu de ESP au profit de C. | **Refus.** | § 10.8 (CD-03) |
| S-170 | C avait délégué `voir` sur le contenu de ESP au rôle `collaborateur` de F en mode `notification` ; C est collaborateur de F ; transfert accepté ; C quitte F. | RF nomme de nouveau C collaborateur de F ; puis C consulte un objet du contenu de ESP. | **Refus** : le cédant est exclu de l'admission automatique. | § 9.4 ; § 10.8 (CD-03) |
| S-171 | HI de C au profit du groupe « Famille » ; transfert accepté ; ADME ajoute C à « Famille ». | RS2 admet C. | **Refus.** | § 10.8 (CD-03) |
| S-172 | ESP3 porte une désignation de garde au profit de K ; son propriétaire C est indisponible durablement ; SUP1 et SUP2 ont ouvert la succession. | K accepte la présentation. | **Accepté** ; K devient propriétaire. | § 10.4 (succession) |
| S-173 | HI de C au profit du rôle `collaborateur` de F, en `approbation préalable` ; transfert présenté. | RF nomme N collaborateur de F ; puis K accepte avec l'empreinte présentée. | **Accepté** : la composition d'un rôle d'un autre espace n'est pas un engagement. | § 10.6 (F-4) |
| S-174 | HI R de RS2 sur le contenu de ESP ; transfert présenté ; RS2 clôt ensuite R. | K accepte avec l'empreinte présentée. | **Refus** « présentation renouvelée » ; une nouvelle présentation est émise. | § 10.6 (renouvellement) |
| S-175 | comme S-174, présentation renouvelée. | K lit la nouvelle présentation et l'accepte. | **Accepté.** | § 10.6 |
| S-176 | transfert présenté ; RS2 pose ensuite un embargo d'existence sur l'objet T2, qui ne porte aucune habilitation, et dont K n'est pas bénéficiaire. | K accepte avec l'empreinte présentée. | **Accepté** : une modification invisible à K n'a aucun effet observable. | § 10.6 (CD-10) |
| S-177 | l'objet T de ESP est sous embargo d'existence posé par RS2, dont K n'est pas bénéficiaire. | K accepte ; puis K consulte T. | **Introuvable** : le propriétaire ne lève pas la protection d'un tiers. | § 10.7 ; F-1 |
| S-178 | C est le seul gardien et bénéficiaire d'un embargo d'existence sur l'objet T de ESP ; K n'en est pas bénéficiaire. | K accepte ; puis K cherche T. | Aucun résultat : la protection devient orpheline, sans révélation au cessionnaire. | § 10.7 ; § 11.2 (F-4) |
| S-179 | C a nommé COL2 collaborateur de ESP. | K accepte ; puis COL2 édite un objet du contenu de ESP. | **Accordé.** | I-8 ; § 10.7 |
| S-180 | transfert présenté (fenêtre ouverte). | RS2 crée une habilitation `voir` sur un objet du contenu de ESP au profit de V. | **Refus** (« espace en cours de transfert »). | § 10.6 (gel) |
| S-181 | HI de C au profit du rôle `collaborateur` de F en `notification` ; transfert présenté ; RF nomme N2 collaborateur de F pendant la fenêtre. | K accepte ; puis N2 consulte un objet du contenu de ESP. | **Accordé** : l'admission automatique, différée pendant la fenêtre, est traitée à sa fin. | § 10.6 (admission différée) |

## 5. Titulaire, création, renonciation

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-40 | tâche automatique de la plateforme, sans déposant identifiable. | la tâche importe des objets personnels dans P. | **Refus** : un objet personnel exige un titulaire. | § 6.2 (CD-19) |
| S-41 | ADM administrateur de P, sans rôle scientifique, détenteur d'un fichier GEDCOM sur lequel il n'a pas de droits. | ADM importe ce fichier comme déposant. | **Refus.** | § 6.2 |
| S-72 | M collaborateur de P dépose son GEDCOM, dont il déclare détenir les droits. | ADM lance l'import pour M ; puis M consulte un objet créé. | **Accordé** (M titulaire). | § 6.2 |
| S-42 | référentiel commun en amorçage. | l'acteur institutionnel d'amorçage crée un concept ; puis un lecteur anonyme le consulte. | **Accordé** (visibilité publique) ; aucun droit de titulaire n'existe. | § 6.1 |
| S-126 | TIT titulaire de priv. | TIT valide scientifiquement priv (`valider`). | **Refus.** | § 6.1 (CC-20) |
| S-127 | TIT titulaire de priv, soumis à une obligation de conservation ; aucun RS ne consent au versement. | TIT renonce à son droit de titulaire par la purge. | **Refus** : aucun sort possible. | § 6.3 |
| S-128 | LEC lecteur de P. | LEC crée un objet dans P. | **Refus.** | § 6.2 |
| S-182 | RS exclut COL, titulaire de l'objet `privé` pc dans P. | COL consulte pc. | **Accordé** : le droit de titulaire ne dépend d'aucune appartenance. | § 6.3 (CD-12) |
| S-183 | comme S-182. | COL crée un objet dans P. | **Refus.** | § 6.3 ; § 6.2 |
| S-184 | TIT titulaire de priv ; RS consent au versement. | TIT renonce par versement. | **Accepté** ; priv devient du contenu de P, paternité conservée. | § 6.3 |
| S-185 | INV invité de P ; RS lui a délégué `proposer` sur le contenu de P. | INV crée un objet dans P. | Une **proposition** est créée, et non un objet. | § 6.2 |
| S-186 | TIT titulaire de priv. | TIT marque une validation personnelle de priv. | **Accepté.** | § 6.1 |

## 6. Restrictions, protections d'existence, dérogations

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-43 | le témoignage T sous embargo d'existence ; bénéficiaires TIT et RS ; ADM non bénéficiaire. | ADM recherche « témoignage » dans P. | Aucun résultat. | A5 ; § 14 (étape 3) |
| S-98 | deux témoignages publics de P, T et T2 ; T sous embargo d'existence. | un lecteur anonyme demande le total des témoignages de P. | Le total vaut 1 : il exclut T. | A5 ; § 15 |
| S-99 | comme S-43. | ADM consulte les journaux de gouvernance de P. | Aucune entrée ne mentionne T ni son embargo. | § 10.3 |
| S-44 | embargo d'existence dont le groupe « Proches » est bénéficiaire ; ADM non membre. | ADM s'ajoute à « Proches ». | **Refus.** | A3 |
| S-129 | comme S-44 ; ADM ajoute le tiers Z à « Proches ». | Z cherche l'objet sous embargo. | Aucun résultat : Z n'est pas bénéficiaire sans l'agrément d'un gardien. | § 9.5 |
| S-130 | RS gardien de l'embargo d'existence sur O ; V détient une habilitation `voir` sur O. | RS ajoute V comme bénéficiaire ; puis V consulte O. | **Accordé.** | § 11.3 |
| S-45 | RS1 et RS2, RS de P ; RS1 a posé sur O un embargo d'existence dont il est le seul bénéficiaire et gardien ; RS1 quitte P. | RS2 lève l'embargo. | **Refus**, indistinguable d'une absence : il n'y a pas de gardien d'office. | § 11.2 ; § 11.5 |
| S-76 | COL collaborateur de P ; O objet du contenu. | COL pose un embargo d'existence sur O. | **Refus.** | § 11.1 |
| S-131 | ADM administrateur de P ; O objet du contenu. | ADM pose sur O une interdiction d'existence visant RS. | **Refus.** | § 11.1 |
| S-46 | O sous embargo d'existence (gardien RS) ; A demande un accès exceptionnel en lecture, finalité « vérification d'intégrité », 2 jours ; SUP1 et SUP2 indépendants approuvent ; RS, gardien, donne son accord. | A consulte O pour cette finalité. | **Accordé** ; l'embargo reste en place. | § 12.3 (F-3) |
| S-187 | comme S-46. | A consulte O ; contrôle du journal d'audit. | L'usage est journalisé avec le marqueur « renforcé ». | § 12.4 |
| S-188 | comme S-46, sans l'accord du gardien. | SUP1 et SUP2 accordent la dérogation. | **Refus.** | § 12.3 (F-3) |
| S-80 | comme S-46, mais la seconde approbation vient de SUP1 sous un autre compte (SUP1b). | la dérogation est demandée ; puis A consulte O. | **Refus.** | § 12.7 |
| S-81 | comme S-46, mais le bénéficiaire de l'accès est SUP2 lui-même. | SUP1 et SUP2 accordent la dérogation à SUP2. | **Refus.** | § 12.4 ; § 12.7 |
| S-82 | comme S-46, mais seul SUP1 approuve. | la dérogation est demandée ; puis A consulte O. | **Refus.** | § 12.3 |
| S-132 | comme S-46, pour une durée égale au plafond plus un jour (31 jours). | SUP1 et SUP2 accordent la dérogation. | **Refus.** | § 12.4 ; § 16 |
| S-133 | O sous embargo **de contenu** ; un seul approbateur. | SUP1 accorde à A un accès exceptionnel à O ; puis A consulte O. | **Refus** : deux approbateurs sont requis pour franchir une restriction. | § 12.3 |
| S-134 | dérogation valide en `voir` sur O accordée à A (S-46). | A exporte O. | **Refus.** | § 12.4 |
| S-135 | dérogation valide en `voir` sur O accordée à A (S-46). | A délègue `voir` sur O à B. | **Refus.** | § 12.4 |
| S-77 | O sous embargo d'existence devenu orphelin (son seul gardien RS1 a quitté P). | SUP1 et SUP2 lèvent l'embargo. | **Refus** : aucune dérogation ne lève une protection. | § 11.5 ; § 12 |
| S-78 | O, objet du contenu de P, sous embargo d'existence posé par RS1, seul gardien ; R0 a révoqué RS1 : l'embargo est orphelin ; R0 détient un droit de contenu sur O. | à la demande de RS2, SUP1 et SUP2 désignent R0 gardien. | **Accepté**, journalisé. | § 11.2 |
| S-79 | R0 désigné gardien selon S-78. | R0 lève l'embargo. | **Accepté.** | § 11.5 |
| S-70 | O objet du contenu sans protection ; A sans droit ; SUP1 seul, non bénéficiaire ; finalité « diagnostic technique » ; 7 jours. | SUP1 accorde l'accès ; puis A consulte O pour cette finalité. | **Accordé**, journalisé. | § 12.3 |
| S-71 | comme S-70 ; l'accès a expiré. | A consulte O. | **Refus.** | § 12.4 ; A4 |
| S-47 | restriction légale sur l'objet `privé` D de TIT. | SUP1 et SUP2 accordent à A un accès exceptionnel à D ; puis A consulte D. | **Refus.** | § 14 (étape 1) ; § 11.6 |
| S-100 | comme S-47 ; créateurs SUP1 et SUP2 ; autorité compétente désignée : AUT. | SUP1 lève la restriction. | **Refus.** | § 11.6 |
| S-101 | comme S-100. | AUT enregistre la levée ; puis TIT consulte D. | **Accordé.** | § 11.6 |
| S-136 | RS et RS2 de P ; O objet du contenu. | RS et RS2 créent une restriction légale sur O. | **Refus.** | § 11.6 |
| S-137 | SUP1 et SUP2 créent une restriction légale sur O. | ils se désignent autorité compétente pour la lever. | **Refus.** | § 11.6 ; A3 |
| S-48 | EXP détient `voir` et `exporter` sur le contenu de P ; O sous embargo d'existence dont EXP n'est pas bénéficiaire. | EXP exporte l'espace. | O n'est ni exporté, ni listé, ni compté. | A5 ; § 15 |
| S-189 | O sans protection ; SUP1 seul accorde à A un accès « diagnostic technique » ; RS pose ensuite un embargo d'existence sur O. | A consulte O pour cette finalité. | **Introuvable** : le niveau d'approbation se calcule à l'évaluation. | § 12.3 (CD-08) |
| S-190 | TIT titulaire du journal `privé` priv, sans protection. | SUP1 seul accorde à A un accès « diagnostic technique » à priv. | **Refus** : un objet personnel non public exige deux approbateurs. | § 12.3 (CD-09, F-3) |
| S-191 | comme S-190. | SUP1 et SUP2 accordent l'accès ; puis A consulte priv pour cette finalité. | **Accordé.** | § 12.3 |
| S-192 | objet du contenu sensible (DI-E05), sans protection. | SUP1 seul accorde à A un accès « diagnostic technique ». | **Refus.** | § 12.3 |
| S-193 | une dérogation à A sur priv, puis deux renouvellements consécutifs, chacun justifié et doublement approuvé. | un troisième renouvellement consécutif est demandé. | **Refus** (plafond de deux renouvellements, à tester, non gelé). | § 12.6 (F-3) |
| S-194 | une dérogation à A sur priv, justification « j ». | un renouvellement consécutif est demandé avec la même justification. | **Refus.** | § 12.6 |
| S-195 | une dérogation à A sur priv, puis un renouvellement. | un second renouvellement consécutif, justifié et doublement approuvé, est demandé. | **Accepté.** | § 12.6 |
| S-196 | une dérogation et deux renouvellements ; le délai de carence s'est ensuite écoulé. | une nouvelle dérogation est demandée. | **Accepté** : ce n'est plus un renouvellement consécutif. | § 12.6 |
| S-197 | dérogation valide à A sur O, finalité « vérification d'intégrité ». | A consulte O pour une autre finalité. | **Refus**, journalisé comme usage hors finalité. | § 12.4 |
| S-198 | RS a posé un embargo de contenu sur O ; RS2 n'en est pas gardien. | RS2 lève l'embargo. | **Refus.** | § 11.5 (CD-06) |
| S-199 | comme S-198. | RS, gardien, lève l'embargo de contenu. | **Accepté.** | § 11.5 |
| S-200 | RS1 a posé un embargo d'existence sur O et a désigné RS2 co-gardien ; RS1 quitte ensuite P. | RS2 lève l'embargo. | **Accepté.** | § 11.2 (CD-17) |
| S-201 | RS gardien de l'embargo d'existence sur O ; V n'a aucun droit sur O. | RS désigne V gardien. | **Refus.** | § 11.2 |
| S-202 | RS2 a délégué `voir` sur O à V (HI) ; RS pose ensuite une interdiction d'action `voir` sur O visant RS2. | V consulte O. | **Accordé** : une protection n'est pas une perte de droit. | § 2.5 (CD-07, CD-18) |
| S-203 | restriction légale sur priv ; TIT la conteste ; la contestation est en examen. | TIT consulte priv. | **Refus** : la restriction reste en vigueur pendant l'examen. | § 11.6 |
| S-204 | comme S-203. | SUP3 et SUP4, distincts des créateurs, annulent la restriction ; puis TIT consulte priv. | **Accordé.** | § 11.6 |
| S-205 | comme S-203. | SUP1 (créateur) et SUP3 examinent la contestation. | **Refus.** | § 11.6 |
| S-206 | R0 propriétaire et racine de P ; TIT titulaire de priv. | R0 consulte priv. | **Refus.** | I-4 ; § 10.1 |
| S-207 | RS pose sur O une interdiction d'existence visant RS2. | RS2 consulte O. | **Introuvable.** | § 11.1 ; § 14 (étape 3) |

## 7. Partage sélectif

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-49 | sélection active « BOVALO depuis le Sosa 31 », branche du Sosa 16 exclue ; HI `voir` au profit des collaborateurs de CLM ; CC admis. | CC recherche « Sosa 16 ». | Aucun résultat. | P24 ; § 13.3 |
| S-102 | comme S-49. | CC parcourt les relations du Sosa 31. | Aucune relation vers le Sosa 16. | P24 ; DI-L16 |
| S-103 | comme S-49. | CC demande le nombre de personnes de P. | Le total vaut 1 : il n'inclut ni le Sosa 16 ni sa branche. | P24 ; § 15 |
| S-104 | comme S-49 ; l'HI accorde aussi `exporter`. | CC exporte les objets de P. | L'export ne contient rien du Sosa 16 ni de sa branche. | P24 ; § 15 |
| S-50 | comme S-49 ; Jean BOVALO appartient à la branche exclue du Sosa 16 ; l'assertion incluse « baptême » a pour verbatim « parrain Jean BOVALO ». | CC consulte l'assertion. | La mention de Jean BOVALO n'est pas observable. | DI-L16 ; DI-L21 ; § 14 (étape 7) |
| S-51 | comme S-49 ; la personne vivante VV figure dans la sélection en mode `masqué`, en relation avec le Sosa 31. | CC consulte la branche (le Sosa 31 et ses relations). | Ni le nom, ni les attributs, ni les relations de VV ne sont observables. | DI-L21 |
| S-52 | comme S-49 ; la sélection est `révoquée`. | CC consulte un objet du dernier manifeste. | **Refus.** | § 13.3 |
| S-53 | comme S-49 ; une proposition d'ajout du Sosa 16 est en attente. | RS réduit la sélection (retrait de l'assertion) ; puis CC consulte le Sosa 16. | **Refus** : une proposition en attente n'est jamais servie. | § 13.3 |
| S-54 | RS a créé une HI `voir` sur la sélection S au profit du rôle `collaborateur` de CLM, en `approbation préalable`. | RS admet CC ; puis CC consulte le Sosa 31. | **Accordé.** | § 13.3 ; § 9.3 |
| S-55 | comme S-54 ; RS2 pose sur le Sosa 31 un embargo d'existence dont ni RS ni CC ne sont bénéficiaires. | CC consulte le Sosa 31. | **Introuvable.** | § 14 (étape 3) |

## 8. Réutilisation, révocation, hors ligne, contributions

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-56 | M, membre de Q, a repris une copie Q' grâce à une habilitation `réutiliser` active ; l'habilitation est ensuite close. | M consulte Q'. | **Accordé.** | DI-A38 ; § 13.11 |
| S-57 | comme S-56 ; licence de Q' autorisant la redistribution ; aucune protection ni droit de tiers. | M inclut Q' dans sa sélection partagée avec un troisième espace. | **Accepté.** | DI-A41 ; § 13.3 |
| S-73 | comme S-57, mais la licence interdit la redistribution. | même opération. | **Refus.** | DI-A41 |
| S-74 | comme S-57, mais Q' est sous embargo de contenu. | même opération. | **Refus.** | DI-A41 ; A5 |
| S-105 | comme S-57, mais un droit de tiers déclaré s'oppose à la diffusion de Q'. | même opération. | **Refus.** | DI-A41 |
| S-58 | décision positive en cache pour M2 sur o ; l'habilitation de M2 est close à T. | M2 demande o en ligne juste après T. | **Refus.** | A6 ; § 13.10 |
| S-59 | appareil de M hors ligne, réplique avec échéance locale T0 + 30 ; révocation à T = 5. | M consulte o hors ligne à 10 (< T0 + 30). | **Accordé** localement (résidu reconnu). | § 13.9 |
| S-106 | comme S-59. | l'appareil se synchronise ; puis M consulte o hors ligne. | **Refus** : o a été retiré de l'appareil. | § 13.9 ; A6 |
| S-107 | comme S-59, l'habilitation portant aussi `commenter` ; M a annoté o hors ligne à t = 2, avant la révocation à T = 5. | l'appareil se synchronise à 6. | La contribution est reçue, réévaluée à l'intégration, **refusée**, et conservée. | § 13.8 (CP-27) |
| S-61 | comme S-107, après la synchronisation. | M relit sa contribution refusée. | M ne lit que son delta, sans rien du contenu retiré. | § 13.8 (CP-27) |
| S-60 | espace personnel PM à membre unique M, qui contient un objet personnel de M. | M active la réplication sans échéance. | **Refus** : les objets personnels du titulaire sont des données protégées. | § 13.9 |
| S-83 | espace à membre unique qui ne contient que des objets publics librement redistribuables. | le membre active la réplication sans échéance. | **Accepté.** | § 13.9 |
| S-138 | plafond de la plateforme : 30 jours. | ADM fixe une échéance locale de 100 jours pour P. | **Refus.** | § 13.9 |
| S-62 | CC, collaborateur de CLM, admis au titre d'une HI `voir` + `commenter` sur la sélection S de P ; l'HI est active à l'intégration. | CC commente hors ligne un objet de S, puis se synchronise. | Commentaire **intégré**. | § 13.8 ; § 13.3 |
| S-63 | priv invisible pour COL, qui en connaît l'identifiant ; identifiant fictif F ; COL peut éditer o. | COL écrit dans o une référence vers priv, puis vers F. | Même erreur et même délai. | A5 ; TI-11 ; § 15 |
| S-208 | RS a délégué `voir` sur o à M en imposant une échéance hors ligne de 5 jours ; M a répliqué P. | M consulte o hors ligne au 6e jour. | **Refus.** | § 13.9 |

## 9. Visibilité, unicités, publications, campagnes, archivage, lots, gouvernance

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-139 | COL détient `éditer` sur l'objet o du contenu de P. | COL passe o en visibilité `public`. | **Refus.** | § 13.2 |
| S-140 | RS de P ; évaluation de diffusabilité favorable sur o. | RS passe o en `public` ; puis un lecteur anonyme consulte o. | **Accordé.** | § 13.2 ; § 14 (étape 6) |
| S-141 | COL collaborateur de P. | COL réduit la visibilité de o à `privé`. | **Refus.** | § 13.2 |
| S-209 | RS de P. | RS réduit la visibilité de o à `privé`. | **Refus** : le contenu ne descend jamais sous `projet`. | § 13.2 |
| S-142 | o public ; V bénéficie d'une habilitation explicite `voir` sur o. | RS réduit la visibilité de o à `projet` ; puis V consulte o. | **Accordé** : l'habilitation explicite est maintenue. | § 13.2 |
| S-143 | objet public o, sans protection. | un lecteur anonyme, sans aucun droit, consulte o. | **Accordé.** | § 14 (étape 6) |
| S-64 | M1 a une base justificative de portée `projet` sur l'assertion A. | M2 crée une base de portée `projet` sur A. | Conflit signalé ; M2 voit la base de M1. | § 13.7 |
| S-91 | M1 a une base de portée `privée` sur A. | M2 crée sa base de portée `privée` sur A. | **Accepté**, sans conflit. | § 13.7 |
| S-144 | M1 a une base de portée `privée` sur A, invisible pour M2. | M2 crée une base de portée `projet` sur A. | **Accepté**, sans conflit. | § 13.7 |
| S-217 | ADM administrateur de P, sans `voir` sur l'assertion o. | ADM crée une base justificative de portée `projet` sur o. | **Refus**, indistinguable d'une absence. | § 13.7 (CD-22) |
| S-65 | série S de l'espace SA ; numéro N de l'espace SB ; aucune acceptation par un détenteur d'`administrer` sur SA. | RB, racine de SB, insère N dans S au rang 13. | **Refus** ; le rang 13 reste libre. | § 13.6 |
| S-66 | campagne en phase indépendante ; les participants Y et W sont reliés à des acteurs ; W a répondu. | Y consulte les réponses des autres participants. | Rien n'est servi. | § 13.14 ; § 2.4 |
| S-92 | campagne en phase indépendante ; la personne Yp n'est reliée à aucun acteur. | Yp répond. | **Refus.** | § 13.14 |
| S-145 | P archivé ; COL collaborateur. | COL édite un objet du contenu de P. | **Refus.** | § 5.1 |
| S-210 | P archivé. | RS crée une habilitation `voir` sur o au profit de V. | **Refus.** | § 5.1 |
| S-211 | P archivé ; RS2 n'est pas propriétaire. | RS2 rouvre P. | **Refus.** | § 5.1 ; § 10.1 |
| S-212 | HI R `voir` sur o au profit de V ; P archivé ; RS clôt R pendant l'archivage ; R0 rouvre P. | V consulte o. | **Refus** : la réouverture ne réactive rien. | § 5.1 ; A4 |
| S-213 | o diffusable ; COL collaborateur. | COL contribue o au Core. | **Refus.** | § 7.1 |
| S-214 | o diffusable. | RS contribue o au Core. | **Accordé.** | § 7.1 |
| S-215 | o non diffusable. | RS contribue o au Core. | **Refus.** | § 7.1 |
| S-216 | RS a délégué `voir` + `repartager` sur o à COL ; o diffusable. | COL désigne le public bénéficiaire de `voir` sur o. | **Refus.** | § 13.1 |
| S-218 | lot {o, o2} délégué en `voir` à V jusqu'à 10. | RS ajoute o3 au lot ; puis V consulte o3. | **Refus** : la liste est figée. | § 13.4 |
| S-219 | lot {o, o2}. | RS délègue le lot en `valider` à V. | **Refus.** | § 13.4 |
| S-220 | lot {o, o2}. | RS délègue le lot en `voir` à V sans échéance. | **Refus.** | § 13.4 |
| S-221 | lot {o, o2} délégué en `voir` à V ; le lot est clos, puis rouvert. | V consulte o. | **Refus.** | § 13.4 ; A4 |
| S-222 | RS a délégué `voir` sur o à V. | ADM demande l'explication des accès de V à o. | L'explication cite l'HI de RS. | § 10.3 (OB-24) |
| S-223 | T sous embargo d'existence dont ADM n'est pas bénéficiaire ; V a une habilitation sur T. | ADM demande l'explication des accès de V à T. | **Introuvable.** | § 10.3 ; § 15 |
| S-224 | TIT a partagé priv avec V. | ADM affiche la liste des habilitations de P. | Aucune ligne ne porte sur priv. | § 10.3 (CD-23) |
| S-225 | ADM prépare une invitation de X dans P. | X consulte o. | **Refus** : préparer une invitation ne confère rien. | § 10.2 |
| S-226 | ADM propose une prise en charge de P par l'espace F, dont AF est administrateur. | AF consulte o. | **Refus.** | § 10.2 |

## 10. Transfert : objets personnels, atomicité, réémission

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-67 | C titulaire de l'objet `privé` O1 (sans embargo) dans ESP ; voie (b) retenue ; K a accepté explicitement O1. | K accepte le transfert ; puis K consulte O1. | **Accordé** (K titulaire). | § 10.5 (b) ; § 10.7 |
| S-227 | comme S-67. | contrôle de la paternité de O1 après le transfert. | La paternité de C reste attachée à O1. | § 10.5 |
| S-93 | comme S-67, mais K n'a pas accepté explicitement O1. | K accepte le transfert. | **Refus** ; rien n'est appliqué. | § 10.5 ; § 10.7 (I-11) |
| S-68 | C titulaire de O1 ; voie (a) avec copie (c), licence permettant la copie. | K accepte ; puis C consulte la copie dans son espace personnel. | **Accordé** ; la copie porte une `FILIATION` vers O1, resté dans ESP. | § 10.5 (c) |
| S-75 | comme S-68, mais la licence interdit la copie. | K accepte. | **Refus** ; rien n'est appliqué. | § 10.5 (blocage) ; § 10.7 |
| S-84 | voie (b) pour O1, acceptée par K ; voie (a) avec copie pour O2 ; un consentement couvrant O1 est retiré entre la présentation et l'acceptation. | K accepte. | **Refus** de toute l'acceptation. | § 10.7 |
| S-85 | O1 en voie (b), accepté par K ; HP de C `voir` sur O1 au profit de V jusqu'à 20, annoncée en réémission jusqu'à 30. | K accepte. | **Refus** de toute l'acceptation. | § 10.5 ; § 10.7 |
| S-86 | O1 en voie (b), accepté par K ; HP de C sur O1 au profit de V, non réémise. | K accepte ; puis V consulte O1. | **Refus.** | § 10.5 ; § 10.7 |
| S-87 | comme S-85, mais l'HP expire (à 5) avant l'acceptation ; réémission annoncée à l'identique. | K accepte à 6 en réémettant. | **Refus** de toute l'acceptation. | § 10.5 ; A4 |
| S-88 | HI de C au profit du rôle `collaborateur` de F ; transfert présenté ; F nomme ensuite de nouveaux collaborateurs. | K accepte avec l'empreinte présentée. | **Accepté** : aucun veto implicite d'un tiers. | § 10.6 (F-4) |
| S-89 | ADME administrateur de ESP ; C titulaire de O1. | ADME crée une habilitation `voir` sur O1 au profit du `public`. | **Refus.** | A1 ; A2 ; § 13.1 |
| S-90 | RS2 a nommé RS3 RS de ESP ; RS3 n'a pas accepté. | RS3 consulte un objet du contenu de ESP. | **Refus.** | § 7.2 |
| S-146 | C (comme RS) a signé l'HI D `voir` sur le contenu de ESP au profit de V. | K accepte sans réémission ; puis V consulte un objet du contenu de ESP. | **Accordé** : l'HI survit au transfert. | § 10.7 ; I-8 (F-1) |
| S-147 | C a nommé RS2 (base de la section). | K accepte ; puis RS2 consulte le contenu de ESP, sans nouvelle acceptation. | **Accordé.** | § 10.7 (F-1) |
| S-148 | comme S-147 ; RS2 avait délégué `voir` sur ot à V avant le transfert. | après l'acceptation, V consulte ot. | **Accordé.** | § 10.7 (F-1) |
| S-228 | O1 en voie (b), accepté par K ; HP de C `voir` sur O1 au profit de V, réémission annoncée à l'identique. | K accepte ; puis V consulte O1. | **Accordé** ; la nouvelle HP a K pour auteur et un lien « réémission de ». | § 10.5 |
| S-229 | HP de C `voir` sur O1 au profit du groupe GK, M admis par C ; O1 en voie (b) ; réémission annoncée avec l'admission de M. | K accepte ; puis M consulte O1. | **Accordé.** | § 10.5 (CD-14) |
| S-230 | comme S-229, mais l'annonce ne liste pas l'admission de M. | K accepte ; puis M consulte O1. | **Refus.** | § 10.5 (CD-14) |
| S-231 | C a posé un embargo d'existence sur son objet O1, dont K n'est pas bénéficiaire. | C retient la voie (b) pour O1. | **Refus** : K doit voir l'objet. | § 10.5 (F-4) |

## 11. Bilan

- **Scénarios : 230**, dont 147 repris de la V1.3 et 83 nouveaux (S-149 à S-231).
- **Tous automatisés** : `python -m unittest discover -s spec/autorisation/tests`.

### Scénarios V1.3 modifiés

| ID | Modification |
|---|---|
| S-10 | Précondition : c’est le propriétaire qui nomme Z (CD-15). |
| S-11 | Précondition : une habilitation R′ porte sur l’objet caché, pour tester son exclusion. |
| S-13 | Scindé : une seule observation ; l’édition passe en S-149. |
| S-15 | Scindé : une seule observation ; l’accès au contenu passe en S-150. |
| S-16 | Attendu inversé (F-1) : l’HI survit à la révocation de son signataire. La suspension passe par S-153. |
| S-17 | Réécrit sur une HP à deux fondateurs : la dépendance personnelle ne vaut plus pour les HI. |
| S-19 | Acteur A2 renommé AD2. |
| S-23 | Réécrit sur une chaîne d’HP ; règle de cycle explicitée au § 8.2. |
| S-35 | Réécrit (F-1, CD-14) : l’HI et son admission survivent sans réémission. |
| S-36 | Réécrit (F-4) : ajouter un membre pendant la fenêtre est gelé. |
| S-39 | Opération : la présentation est refusée au cédant ; cause signalée au seul cédant. |
| S-40 | Attendu précisé (CD-19) : pas d’objet personnel sans titulaire. |
| S-41 | Précondition (CD-19) : ADM est lui-même le déposant. |
| S-45 | Attendu inversé : il n’y a plus de gardien d’office (§ 11.2). |
| S-46 | Précondition : accord du gardien (F-3) ; journal renforcé testé en S-187. |
| S-48 | Acteur E renommé EXP. |
| S-50 | Précondition : Jean BOVALO appartient à la branche exclue (DI-L16). |
| S-54 | Précondition : admission ajoutée (approbation préalable par défaut). |
| S-55 | Fondement : § 14 (étape 3), et non la dépendance. |
| S-60 | Précondition : un objet personnel de M suffit (donnée protégée). |
| S-61 | Aligné sur S-107 (rappel de CP-27 au § 13.8). |
| S-62 | Précondition : admission ajoutée. |
| S-65 | Fondement : § 13.6 seul. |
| S-70 | Finalité de la liste fermée du § 12.3. |
| S-78 | Précondition : embargo réellement orphelin (révocation de son seul gardien). |
| S-81 | Précondition : le bénéficiaire est l’approbateur lui-même. |
| S-85 | Réécrit sur la réémission d’une HP (voie b) : les HI n’ont plus à être réémises. |
| S-86 | Idem S-85. |
| S-87 | Idem S-85. |
| S-88 | Attendu inversé (F-4) : aucun veto implicite d’un tiers. |
| S-100 | Précondition : créateurs et autorité compétente nommés. |
| S-107 | Précondition datée (annotation avant la révocation) ; attendu aligné sur S-61. |
| S-108 | Réécrit (F-1) : le départ du signataire ne fait rien tomber. |
| S-110 | Réécrit sur une chaîne d’HP : la confirmation circulaire est refusée. |
| S-114 | RS2 remplacé par RS3 dans l’opération. |
| S-121 | Précondition (F-1) : RS2 reste RS sans réémission. |
| S-122 | Comparaison avec l’état sans T ; le scellé d’audit passe en S-167. |
| S-127 | Libellé : aucun sort possible. |
| S-132 | Durée paramétrée : plafond + 1. |
| S-146 | Réécrit (F-1) : HI de C, survie sans réémission. |
| S-147 | Réécrit (F-1) : la nomination survit sans réémission. |
| S-148 | Idem S-147. |

- **Statut : candidate, non gelée.**
