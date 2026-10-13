# GENIIUS — Batterie de scénarios du contrat d’autorisation

**Version :** V1.6 — **baseline de régression du contrat comportemental gelé le 12/10/2026**. Elle remplace la V1.5 (291 scénarios).

**Fichier généré** par `spec/autorisation/generer_batterie.py` à partir de `spec/autorisation/tests/` (scénarios, attaques, contrôles). Chaque ligne est un test automatisé : on modifie le test, puis on régénère ; on ne modifie jamais ce fichier à la main.

**Référentiel :** [contrat d’autorisation V1.6](GENIIUS_CONTRAT_AUTORISATION.md). Les fondements citent ses clauses (§ n, A1 à A7, I-n, T-n).

**Règles de la batterie**
- Chaque scénario a des préconditions atteignables, **une** opération (suivie, le cas échéant, de la consultation qui l’observe), un résultat binaire et observable, et un fondement qui existe dans le contrat.
- « **Refus** » : opération rejetée, rien n’est créé. « **Introuvable** » : réponse indistinguable d’une absence.
- Les identifiants V1.3 sont conservés ; les nouveaux commencent à S-149. S-124 n’est pas attribué.
- La batterie est une **base de régression**, pas une couverture exhaustive : elle est complétée par `test_proprietes.py` (invariants I-1 à I-14 sur des états aléatoires et sur les transitions qui peuvent les violer, comptages publiés par invariant dans `couverture_etats.json`) et `test_transitions.py` (matrices d’états et combinaisons).
- Les oracles n’appellent aucune fonction interne du modèle : observation par opérations publiques, état jumeau et transcriptions du texte dans `tests/outils.py`.
- Certaines préconditions sont des **faits externes** posés directement dans l’état (évaluation de diffusabilité, vérification d’identité, consentement retiré, effacement légal, obligation de conservation, subordination, liens d’intérêt) : le contrat ne leur donne pas d’opération (contrôle B, A-22).

**Espaces types :** P (projet), ESP (espace transféré de C à K), CLM (les Colimaçons), F (autre espace), PRG (programme) et SP (sous-projet), Q et TS (réutilisation).

**Acteurs types :** R0 racine et propriétaire de P ; RS, RS1, RS2, RS3 responsables scientifiques ; ADM, ADM1, ADM2, ADME administrateurs ; COL, TIT collaborateurs ; LEC lecteur ; INV invité ; C cédant ; K cessionnaire ; SUP1 à SUP4 membres indépendants de l’autorité de dérogation (SUP1b : second compte de SUP1) ; AUT autorité externe ; A bénéficiaire de dérogation ; V, W, X, Y, Z… tiers.

## 1. Auto-habilitation et gouvernance

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-01 | TIT titulaire de l'objet `privé` priv ; LEC membre de P, sans droit sur priv. | LEC crée sur priv une habilitation à son profit. | **Refus** : LEC ne détient rien sur priv (A3 est isolé par S-273 et S-291). | A1 ; § 6.3 |
| S-02 | RS de P ; TIT titulaire de l'objet `privé` priv. | RS crée sur priv une habilitation à son profit. | **Refus** : l'autorité de RS ne porte pas sur l'objet personnel d'autrui. | A1 ; § 2.5 ; § 6.3 ; § 7.1 |
| S-69 | RS de P ; TIT titulaire de priv, sans habilitation au profit de RS. | RS crée une habilitation `voir` sur priv au profit de LEC. | **Refus.** | A1 ; § 7.1 |
| S-03 | ADM administrateur de P ; Y sans droit. | ADM crée une habilitation `voir` sur le contenu de P au profit de Y. | **Refus.** | A1 ; A2 |
| S-04 | ADM administrateur de P. | ADM se nomme `lecteur` de P. | **Refus** : un administrateur ne nomme pas (l'interdit de se nommer est isolé par a17-6). | § 7.1 ; § 10.2 |
| S-05 | ADM administrateur de P. | ADM crée une habilitation `voir` sur le contenu de P à son profit. | **Refus** : la gouvernance ne confère aucun droit à partager. | A1 ; A2 |
| S-06 | ADM gestionnaire du groupe G de P, qui n'a aucun droit. | ADM s'ajoute à G. | **Refus** : s'ajouter soi-même à un groupe est interdit, quel que soit le groupe. | A3 ; § 9.1 |
| S-07 | ADM administrateur de P ; TIT titulaire de priv. | ADM crée une habilitation `voir` sur priv au profit du rôle `lecteur` de P. | **Refus.** | A1 ; A2 ; § 13.1 |
| S-08 | programme PRG ; XA administrateur de PRG, sans rôle dans le sous-projet SP. | XA crée une habilitation `voir` sur le contenu de SP au profit du groupe « Coordination ». | **Refus.** | A1 ; A2 |
| S-09 | LEC lecteur de P, sans `repartager` ; groupe H de P. | LEC crée une habilitation `voir` sur le contenu de P au profit de H. | **Refus.** | A1 ; § 8.1 (1) |
| S-10 | le propriétaire R0 a nommé Z administrateur de P ; Z n'a aucun rôle scientifique. | Z nomme ADM `lecteur` de P. | **Refus.** | A2 ; § 7.1 |
| S-11 | ADM administrateur de P ; l'objet O sous embargo d'existence dont ADM n'est pas bénéficiaire, avec une habilitation R' sur O ; une habilitation R sur l'objet non protégé Q1. | ADM affiche la liste des habilitations de P, avec son total. | La liste et le total sont identiques à ceux de l'état où O n'existe pas ; R y figure, désignée par identifiant et type, sans titre. | § 10.3 ; § 15 |
| S-12 | ADM administrateur de P ; une lettre publiée et diffusée par courriel ; ADM sans droit de lecture sur son contenu. | ADM consulte les diffusions de P. | Visibles : date, canal, audience déclarée, nombre de destinataires, résultat. Le contenu de la lettre n'est pas visible. | § 10.3 |

## 2. Habilitations institutionnelles et personnelles, chaînes, départs

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-13 | RS de P. | RS confère à M l'appartenance `collaborateur` ; puis M consulte un objet du contenu de P. | **Accordé.** | § 7.1 ; § 7.2 |
| S-149 | comme S-13. | M édite un objet du contenu de P. | **Accordé.** | § 7.1 |
| S-14 | TIT titulaire de priv ; V extérieur. | TIT crée une habilitation `voir` sur priv au profit de V ; puis V consulte priv. | **Accordé.** | § 6.1 ; § 8.1 |
| S-15 | RS1 nommé RS par R0 ; RS1 a nommé RS2, qui a accepté ; TIT titulaire de priv. | RS2 consulte priv. | **Introuvable.** | § 7.2 ; § 6.3 |
| S-150 | comme S-15. | RS2 consulte un objet du contenu de P. | **Accordé.** | § 7.1 |
| S-16 | RS, nommé par R0, a signé l'HI R (`voir`, contenu de P) au profit de V ; R0 révoque ensuite la nomination de RS. | V consulte un objet du contenu de P. | **Accordé** : l'HI survit à la révocation de son signataire (F-1). | § 2.1 ; § 7.3 |
| S-17 | TIT a accordé `voir` + `repartager` sur priv à V1 et à V2 ; V1 a délégué `voir` sur priv à T ; V2 a confirmé cette HP ; TIT clôt l'habilitation de V1. | T consulte priv. | **Accordé** : V2 reste fondateur valide. | § 8.2 |
| S-18 | HI R signée par RS ; ADM n'a pas `voir`. | ADM prolonge R. | **Refus.** | T-04 ; A2 |
| S-19 | HI R au profit du groupe extérieur « Coordination », en `approbation préalable`, signée par RS ; RS2 RS de P ; AD2 membre de la Coordination, non admis. | RS2 admet AD2 ; puis AD2 consulte un objet du contenu de P. | **Accordé.** | § 9.3 |
| S-20 | HI R au profit de la Coordination, close la veille. | RS admet un membre au titre de R. | **Refus.** | A4 |
| S-21 | COL détient `voir` sur le contenu de P, sans `repartager`. | COL crée une habilitation `voir` sur le contenu de P au profit de T. | **Refus.** | A1 ; § 8.1 (1) |
| S-22 | RS a délégué `voir` + `repartager` sur o à COL (HI) ; COL a délégué `voir` sur o à T (HP). | RS clôt l'HI de COL ; puis T consulte o. | **Introuvable** (rupture de la chaîne). | § 8.2 ; T-11 |
| S-23 | TIT a délégué `voir` + `repartager` sur priv à VA ; VA a délégué `voir` + `repartager` sur priv à VB. | VB délègue `voir` + `repartager` sur priv à VA. | **Refus** (cycle). | § 8.2 (cycles) |
| S-108 | RS (non racine) a nommé COL2 collaborateur. | RS quitte P ; puis COL2 consulte un objet du contenu de P. | **Accordé** : l'HI survit au départ de son signataire. | § 7.6 ; § 2.1 |
| S-109 | R0 racine de P ; RS2 existe. | R0 quitte P sans transfert. | **Refus.** | § 7.6 |
| S-110 | TIT a délégué `voir` + `repartager` sur priv à V1 ; V1 à V2 ; V2 à V3, chaque fois avec `repartager`. | V3 confirme l'HP de V1 vers V2. | **Refus** : le droit de V3 passe par l'HP qu'il confirmerait. | § 8.2 (cycles) ; T-06 |
| S-111 | RS1 a nommé RS2 ; RS3, nommé par R0, n'est pas signataire de cette nomination. | RS3 clôt la nomination de RS2. | **Refus.** | § 7.4 |
| S-112 | RS1 nommé RS jusqu'à D1 = 10. | RS1 délègue `voir` sur le contenu de P à V jusqu'à D2 = 20. | **Refus.** | A1 ; § 7.2 |
| S-113 | RS de P seulement ; l'espace Q a un objet oq. | RS délègue `voir` sur oq à V. | **Refus.** | A1 ; § 8.1 |
| S-114 | RS1 nommé RS sur un périmètre limité à l'objet o. | RS1 nomme RS3 sur tout P. | **Refus.** | § 7.2 ; A1 |
| S-151 | RS1 a nommé RS3, qui a accepté. | la racine R0 clôt la nomination de RS3. | **Accepté.** | § 7.4 (CD-02) |
| S-152 | RS1 a nommé RS3 ; R0 révoque ensuite la nomination de RS1. | RS3 consulte un objet du contenu de P. | **Accordé.** | § 2.1 ; § 7.3 |
| S-153 | RS a signé l'HI R au profit de V ; R0 a révoqué RS. | R0 met R en examen ; puis V consulte un objet du contenu de P. | **Introuvable** (suspension immédiate). | § 7.5 ; T-07 |
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
| S-24 | le groupe G de P est bénéficiaire d'une habilitation `voir` sur le contenu de P ; LEC membre de P, non membre de G. | LEC s'ajoute à G. | **Refus** : LEC n'est pas gestionnaire de G (A3 est isolé par S-06 et S-44). | § 9.1 |
| S-25 | G géré par ADM ; RS a délégué `voir` sur le contenu de P à G en `approbation préalable` ; ADM a ajouté M à G. | RS admet M ; puis M consulte un objet du contenu de P. | **Accordé.** | § 9.3 |
| S-26 | comme S-25, avant l'admission. | M consulte un objet du contenu de P. | **Introuvable** : l'appartenance seule ne confère rien. | § 9.1 ; A2 |
| S-27 | programme PRG ; groupe « Coordination » géré par PRG, dont AC est membre ; RSP, racine de SP, a délégué `voir` sur osp à la Coordination en `approbation préalable`. | RSP admet AC ; puis AC consulte osp. | **Accordé.** | § 9.3 |
| S-94 | comme S-27 ; B ajouté à la Coordination par RG, non admis. | B consulte osp. | **Introuvable.** | § 9.3 |
| S-95 | RSP a délégué `voir` sur osp à la Coordination en mode `notification`. | RG ajoute Y à la Coordination ; puis Y consulte osp. | **Accordé** ; RSP, RS de SP, est notifié de l'entrée de Y, et personne d'autre. | § 9.3 (notification) |
| S-96 | TIT titulaire de priv. | TIT délègue `voir` sur priv à la Coordination en mode `notification`. | **Refus** : seule l'`approbation préalable` est admise pour un objet personnel non public. | § 9.3 |
| S-28 | XA administrateur de PRG, sans rôle dans SP. | XA consulte osp. | **Introuvable.** | A2 |
| S-29 | RSP a délégué `voir` sur osp à V, conditionné par le rattachement SP → PRG. | le rattachement prend fin ; puis V consulte osp. | **Introuvable.** | § 13.13 ; T-13 |
| S-97 | comme S-29 ; un nouveau rattachement SP → PRG est ensuite établi. | V consulte osp. | **Introuvable** : aucune réactivation. | § 13.13 ; A4 |
| S-115 | HI de P au profit du rôle `collaborateur` de l'espace F, en `approbation préalable`. | RF, RS de F, nomme Z collaborateur de F ; puis Z consulte un objet du contenu de P. | **Introuvable** : Z n'est pas admis par P. | § 9.1 ; § 9.3 |
| S-116 | RS a délégué `voir` au groupe G de P ; ADM gère G. | ADM ajoute M à G ; puis M consulte o. | L'ajout est **accepté** (le groupe n'est pas gelé), et M reçoit « introuvable » tant qu'il n'est pas admis. | § 9.1 |
| S-117 | TIT titulaire de priv, membre du groupe « Équipe » de P. | TIT délègue `voir` sur priv à « Équipe ». | **Accepté.** | A3 (permis) |
| S-161 | RS a délégué `voir` sur le contenu de P au groupe G en mode `notification` ; ADM1 et ADM2 administrateurs de P. | ADM1 ajoute ADM2 à G, ADM2 ajoute ADM1 à G ; puis ADM1 consulte un objet du contenu de P. | **Introuvable** : un gestionnaire n'est jamais admis automatiquement. | § 9.4 (F-2) ; I-3 |
| S-162 | TIT a délégué `voir` sur priv au rôle `collaborateur` de P (son propre espace). | RS nomme N collaborateur ; puis N consulte priv. | **Introuvable** : une HP au profit d'un rôle exige une admission. | § 9.2 (CD-13) |
| S-163 | RS a délégué `exporter` sur le contenu de P au rôle `lecteur` de P (HI). | RS nomme N2 lecteur ; N2 exporte o ; RS2 admet N2 ; N2 exporte o. | **Refus**, puis **accordé** : même au profit d'un rôle de son propre espace, une habilitation exige une admission (V1.6, H-2a). | § 9.2 (H-2a) |
| S-164 | comme S-95, Y admis automatiquement. | RSP retire l'admission de Y ; puis Y consulte osp. | **Introuvable.** | § 9.3 ; § 5.3 |
| S-165 | comme S-164, admission de Y retirée. | RG retire Y de la Coordination puis l'y ajoute de nouveau ; puis Y consulte osp. | **Introuvable** : le retrait exclut l'admission automatique. | § 9.4 |
| S-166 | RS a délégué `voir` + `repartager` sur o à COL (HI) ; COL a délégué `voir` sur o au groupe G en `notification` (HP) ; ADM a ajouté M à G. | RS clôt l'HI de COL ; puis M consulte o. | **Introuvable** : l'autorisation anticipée tombe avec les droits de l'habilitant. | § 9.3 ; § 8.2 |

## 4. Propriété et transfert

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-30 | C propriétaire et racine de ESP ; transfert à K préparé. | K accepte ; puis C consulte un objet du contenu de ESP. | **Introuvable.** | § 10.7 |
| S-31 | comme S-30 ; C membre du groupe « Famille » de ESP, bénéficiaire d'une HI `voir` signée par RS2, et admis par RS2. | K accepte ; puis C consulte un objet ouvert à « Famille ». | **Introuvable.** | § 10.7 |
| S-32 | comme S-30 ; T objet public de ESP ; C est le seul bénéficiaire et gardien d'un embargo d'existence sur T. | K accepte ; puis C cherche T. | Aucun résultat : C a perdu sa qualité de bénéficiaire, alors que T est public. | § 10.7 |
| S-33 | comme S-30 ; TIT2, collaborateur de ESP, a accordé à C `voir` sur son journal `privé` J. | K accepte ; puis K consulte J ; puis C consulte J. | K : **introuvable** ; C : **accordé** : le cédant conserve les HP qu'un titulaire tiers lui a accordées sur ses objets personnels (CT-28). | § 10.7 (CT-28) ; A2 |
| S-34 | comme S-30 ; T objet du contenu de ESP ; une interdiction d'existence, posée par RS2, avait C pour seul destinataire. | K accepte ; puis K consulte T. | **Accordé** : l'interdiction vise C, pas K. | § 10.7 (CD-21) |
| S-35 | C (comme RS) a signé l'HI G1, règle de sélection sur le contenu de ESP au profit du rôle `collaborateur` de CLM, en `approbation préalable`, et a admis CC. | K accepte sans réémission ; puis CC consulte un objet de la sélection. | **Accordé** : l'HI et son admission institutionnelle survivent. | § 2.1 ; § 10.7 (F-1) |
| S-36 | HI de C au profit du groupe « Cousins » de ESP ; transfert présenté (fenêtre ouverte). | C ajoute ZZ au groupe « Cousins ». | **Refus** (« espace en cours de transfert »). | § 10.6 (gel) |
| S-37 | RS2 a délégué à C `voir` sur ot ; transfert accepté de C à K (l'habilitation est close) ; ESP archivé puis rouvert par K. | C consulte ot. | **Introuvable** : la réouverture ne réactive pas une habilitation close. | A4 ; § 5.1 |
| S-38 | comme S-30. | K accepte ; puis K consulte un objet du contenu de ESP. | **Accordé.** | § 10.7 |
| S-39 | C titulaire de trois objets `privé` dans ESP ; aucune voie retenue pour l'un d'eux. | C présente le transfert. | **Refus** ; la cause est signalée au cédant seulement. | § 10.5 (blocage) |
| S-118 | RS2 administrateur et RS de ESP, non propriétaire ; C propriétaire. | RS2 lance le transfert de ESP à K. | **Refus.** | § 10.4 |
| S-119 | ESP2 préparé pour un tiers par C (désignation de garde au profit de K) ; transfert accepté par K. | C, ancien propriétaire, lance un nouveau transfert de ESP2. | **Refus** : seul le propriétaire transfère (la garde est exercée par S-247 et S-248). | § 10.4 |
| S-120 | après le transfert de C à K, RS2, nommé par C, est resté RS de ESP (F-1). | RS2 nomme C collaborateur de ESP, sans le consentement de K. | **Refus.** | § 10.8 |
| S-121 | comme S-120, avec le consentement explicite de K, donné pour une nomination de C. | RS2 nomme C collaborateur de ESP ; puis RS2 nomme C lecteur d'un autre périmètre. | **Accepté**, puis **refus** : le consentement vaut pour un seul acte (H-6c). | § 10.8 (H-6c) |
| S-122 | transfert présenté ; l'objet T de ESP est sous embargo d'existence posé par RS2, dont K n'est pas bénéficiaire ; RS2 a délégué `voir` sur T à V. | K affiche la présentation et ses totaux. | Elle est identique à celle qu'il verrait si T n'existait pas : ni T, ni l'embargo, ni l'habilitation sur T, ni aucun total ne les révèle. | § 10.6 ; I-5 (F-4) |
| S-167 | comme S-122. | contrôle d'audit du scellé de la présentation. | Le scellé d'audit contient l'embargo sur T ; la présentation de K ne le contient pas. | § 10.6 (scellé d'audit) |
| S-123 | le propriétaire C, aussi racine, est décédé ; aucune désignation de garde ; aucun fondement légal enregistré. | SUP1 et SUP2 ouvrent une succession de ESP. | **Refus.** | § 10.4 (succession) |
| S-125 | ADME administrateur de ESP ; C propriétaire. | ADME consulte un objet du contenu de ESP. | **Introuvable.** | A2 ; § 10.1 |
| S-168 | C a nommé RS2 ; RS2 a nommé RS3. | K accepte ; puis K clôt la nomination de RS3. | **Accepté.** | § 7.4 ; § 10.7 (CD-02) |
| S-169 | transfert accepté ; RS2 resté RS. | RS2 crée une habilitation `voir` sur tout le contenu de ESP au profit de C. | **Refus.** | § 10.8 (CD-03) |
| S-170 | C avait délégué `voir` sur le contenu de ESP au rôle `collaborateur` de F en mode `notification` ; C est collaborateur de F ; transfert accepté ; C quitte F. | RF nomme de nouveau C collaborateur de F ; puis C consulte un objet du contenu de ESP. | **Introuvable** : C, signataire de l'habilitation, n'y est jamais admis (le cédant est isolé par S-277). | § 9.4 (signataire) ; § 10.8 |
| S-171 | HI de RS2 au profit du groupe « Famille » ; transfert accepté ; ADME ajoute C à « Famille ». | RS2 admet C. | **Refus.** | § 10.8 (CD-03) |
| S-172 | ESP3 porte une désignation de garde au profit de K ; son propriétaire C est indisponible durablement ; SUP1 et SUP2 ont ouvert la succession. | K accepte la présentation. | **Accepté** ; K devient propriétaire. | § 10.4 (succession) |
| S-173 | HI de C au profit du rôle `collaborateur` de F, en `approbation préalable` ; transfert présenté. | RF nomme N collaborateur de F ; puis K accepte avec l'empreinte présentée. | **Accepté** : la composition d'un rôle d'un autre espace n'est pas un engagement. | § 10.6 (F-4) |
| S-174 | HI R de RS2 sur le contenu de ESP ; transfert présenté ; RS2 clôt ensuite R. | K accepte avec l'empreinte présentée. | **Accepté** : un retrait ne bloque pas ; K est notifié du retrait après l'acceptation. | § 10.6 (inclusion, G-3) ; § 10.7 |
| S-175 | transfert présenté ; le délai de présentation est écoulé. | K accepte. | **Refus** « présentation expirée » ; K ne peut rien relancer. | § 5.6 ; § 10.6 (CT-16) |
| S-176 | transfert présenté ; RS2 pose ensuite un embargo d'existence sur l'objet T2, qui ne porte aucune habilitation, et dont K n'est pas bénéficiaire. | K accepte avec l'empreinte présentée. | **Accepté** : une modification invisible à K n'a aucun effet observable. | § 10.6 ; I-5 |
| S-177 | l'objet T de ESP est sous embargo d'existence posé par RS2, dont K n'est pas bénéficiaire. | K accepte ; puis K consulte T. | **Introuvable** : le propriétaire ne lève pas la protection d'un tiers. | § 10.7 ; F-1 |
| S-178 | C est le seul gardien et bénéficiaire d'un embargo d'existence sur l'objet T de ESP ; K n'en est pas bénéficiaire. | K accepte ; puis K cherche T. | Aucun résultat : la protection devient orpheline, sans révélation au cessionnaire. | § 10.7 ; § 11.2 (F-4) |
| S-179 | C a nommé COL2 collaborateur de ESP. | K accepte ; puis COL2 édite un objet du contenu de ESP. | **Accordé.** | I-8 ; § 10.7 |
| S-180 | transfert présenté (fenêtre ouverte). | RS2 crée une habilitation `voir` sur un objet du contenu de ESP au profit de V. | **Refus** (« espace en cours de transfert »). | § 10.6 (gel) |
| S-181 | HI de C au profit du rôle `collaborateur` de F en `notification` ; transfert présenté ; RF nomme N2 collaborateur de F pendant la fenêtre. | K accepte ; puis N2 consulte un objet du contenu de ESP. | **Accordé** : l'admission automatique, différée pendant la fenêtre, est traitée à sa fin. | § 10.6 (admission différée) |

## 5. Titulaire, création, renonciation

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-40 | tâche automatique de la plateforme, sans déposant identifiable. | la tâche importe des objets personnels dans P. | **Refus** : un objet personnel exige un titulaire. | § 6.2 |
| S-41 | ADM administrateur de P, sans rôle scientifique, détenteur d'un fichier GEDCOM sur lequel il n'a pas de droits. | ADM importe ce fichier comme déposant. | **Refus.** | § 6.2 |
| S-72 | M collaborateur de P dépose son GEDCOM, dont il déclare détenir les droits, et donne mandat à ADM. | ADM lance l'import pour M ; puis M consulte un objet créé. | **Accordé** (M titulaire). | § 6.2 |
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
| S-43 | le témoignage T sous embargo d'existence ; bénéficiaires TIT et RS ; RS2, RS de P, non bénéficiaire. | RS2 recherche « témoignage » dans P. | Aucun résultat. | A5 ; § 14 (étape 3) |
| S-98 | deux témoignages publics de P, T et T2 ; T sous embargo d'existence. | un lecteur anonyme demande le total des témoignages de P. | Le total vaut 1 : il exclut T. | A5 ; § 15 |
| S-99 | comme S-43. | ADM consulte les journaux de gouvernance de P. | Aucune entrée ne mentionne T ni son embargo. | § 10.3 |
| S-44 | embargo d'existence dont le groupe « Proches » est bénéficiaire ; ADM non membre. | ADM s'ajoute à « Proches ». | **Refus.** | A3 |
| S-129 | embargo d'existence sur O, dont le groupe « Proches » est bénéficiaire ; Z détient une HI `voir` sur O ; ADM ajoute Z à « Proches ». | Z consulte O. | **Introuvable** : Z n'est pas bénéficiaire sans l'agrément d'un gardien. | § 9.5 |
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
| S-133 | O sous embargo **de contenu** ; finalité « diagnostic technique » ; un seul approbateur. | SUP1 accorde à A un accès exceptionnel à O ; puis A consulte O. | **Refus** de la dérogation ; A reçoit « introuvable ». | § 12.3 |
| S-134 | dérogation valide en `voir` sur O accordée à A (S-46). | A exporte O. | **Introuvable.** | § 12.4 |
| S-135 | dérogation valide en `voir` sur O accordée à A (S-46). | A délègue `voir` sur O à B. | **Refus.** | § 12.4 |
| S-77 | O sous embargo d'existence devenu orphelin (son seul gardien RS1 a quitté P). | SUP1, membre de l'autorité de dérogation, lève l'embargo. | **Refus** : aucune dérogation ne lève une protection. | § 11.5 ; § 12 |
| S-78 | O, objet du contenu de P, sous embargo d'existence posé par RS1, seul gardien ; R0 a révoqué RS1 : l'embargo est orphelin ; R0 détient un droit de contenu sur O. | à la demande de RS2, SUP1 et SUP2 désignent R0 gardien. | **Accepté**, journalisé à l'audit. | § 11.2 |
| S-79 | R0 désigné gardien selon S-78. | R0 lève l'embargo. | **Accepté.** | § 11.5 |
| S-70 | O objet du contenu sans protection ; A sans droit ; SUP1 seul, non bénéficiaire ; finalité « diagnostic technique » ; 7 jours. | SUP1 accorde l'accès ; puis A consulte O pour cette finalité. | **Accordé**, et l'usage est journalisé. | § 12.3 ; § 12.4 |
| S-71 | comme S-70 ; l'accès a expiré. | A consulte O. | **Introuvable.** | § 12.4 ; A4 |
| S-47 | restriction légale sur l'objet `privé` D de TIT. | SUP1 et SUP2 accordent à A un accès exceptionnel à D ; puis A consulte D. | **Refus.** | § 14 (étape 1) ; § 11.6 |
| S-100 | comme S-47 ; créateurs SUP1 et SUP2 ; autorité compétente désignée : AUT. | SUP1 lève la restriction. | **Refus.** | § 11.6 |
| S-101 | comme S-100. | AUT enregistre la levée ; puis TIT consulte D. | **Accordé.** | § 11.6 |
| S-136 | RS et RS2 de P ; O objet du contenu. | RS et RS2 créent une restriction légale sur O. | **Refus.** | § 11.6 |
| S-137 | SUP1 et SUP2 créent une restriction légale sur O. | ils se désignent autorité compétente pour la lever. | **Refus.** | § 11.6 ; A3 |
| S-48 | EXP détient `voir` et `exporter` sur le contenu de P ; O sous embargo d'existence dont EXP n'est pas bénéficiaire. | EXP exporte l'espace. | L'export, objets et total, est identique à celui de l'état où O n'existe pas. | A5 ; § 15 |
| S-189 | O sans protection ; SUP1 seul accorde à A un accès « diagnostic technique » ; RS pose ensuite un embargo d'existence sur O. | A consulte O pour cette finalité. | **Introuvable** : le niveau d'approbation se calcule à l'évaluation. | § 12.3 (CD-08) |
| S-190 | TIT titulaire du journal `privé` priv, sans protection. | SUP1 seul accorde à A un accès « diagnostic technique » à priv. | **Refus** : un objet personnel non public exige deux approbateurs. | § 12.3 (F-3) |
| S-191 | comme S-190. | SUP1 et SUP2 accordent l'accès ; puis A consulte priv pour cette finalité. | **Accordé.** | § 12.3 |
| S-192 | objet du contenu sensible (DI-E05), sans protection. | SUP1 seul accorde à A un accès « diagnostic technique ». | **Refus.** | § 12.3 |
| S-193 | une dérogation à A sur priv, puis deux renouvellements consécutifs, chacun justifié et doublement approuvé. | un troisième renouvellement consécutif est demandé. | **Refus** (plafond de deux renouvellements, à tester, non gelé). | § 12.6 (F-3) |
| S-194 | une dérogation à A sur priv, justification « j ». | un renouvellement consécutif est demandé avec la même justification. | **Refus.** | § 12.6 |
| S-195 | une dérogation à A sur priv, puis un renouvellement. | un second renouvellement consécutif, justifié et doublement approuvé, est demandé. | **Accepté.** | § 12.6 |
| S-196 | une dérogation et deux renouvellements ; le délai de carence s'est ensuite écoulé. | une nouvelle dérogation est demandée. | **Accepté** : ce n'est plus un renouvellement consécutif. | § 12.6 |
| S-197 | dérogation valide à A sur O, finalité « vérification d'intégrité ». | A consulte O pour une autre finalité. | **Introuvable**, journalisé comme usage hors finalité. | § 12.4 |
| S-198 | RS a posé un embargo de contenu sur O ; RS2 n'en est pas gardien. | RS2 lève l'embargo. | **Refus.** | § 11.5 (CD-06) |
| S-199 | comme S-198. | RS, gardien, lève l'embargo de contenu. | **Accepté.** | § 11.5 |
| S-200 | RS1 a posé un embargo d'existence sur O et a désigné RS2 co-gardien ; RS1 quitte ensuite P. | RS2 lève l'embargo. | **Accepté.** | § 11.2 (CD-17) |
| S-201 | RS gardien de l'embargo d'existence sur O ; V n'a aucun droit sur O. | RS désigne V gardien. | **Refus.** | § 11.2 |
| S-202 | TIT a délégué `voir` + `repartager` sur priv à V1 ; V1 a délégué `voir` sur priv à T (HP) ; TIT pose ensuite une interdiction d'action `voir` sur priv visant V1. | T consulte priv. | **Accordé** : une protection qui frappe un fondateur ne fait pas tomber une HP existante. | § 2.5 |
| S-203 | restriction légale sur priv ; TIT la conteste ; la contestation est en examen. | TIT consulte priv. | **Refus** : la restriction reste en vigueur pendant l'examen. | § 11.6 |
| S-204 | comme S-203. | SUP3 et SUP4, distincts des créateurs, annulent la restriction ; puis TIT consulte priv. | **Accordé.** | § 11.6 |
| S-205 | comme S-203. | SUP1 (créateur) et SUP3 examinent la contestation. | **Refus.** | § 11.6 |
| S-206 | R0 propriétaire et racine de P ; TIT titulaire de priv. | R0 consulte priv. | **Introuvable.** | I-4 ; § 10.1 |
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
| S-52 | comme S-49 ; la sélection est `révoquée`. | CC consulte un objet du dernier manifeste. | **Introuvable.** | § 13.3 |
| S-53 | comme S-49 ; une proposition d'ajout du Sosa 16 est en attente. | RS réduit la sélection (retrait de l'assertion) ; puis CC consulte le Sosa 16. | **Introuvable** : une proposition en attente n'est jamais servie. | § 13.3 |
| S-54 | RS a créé une HI `voir` sur la sélection S au profit du rôle `collaborateur` de CLM, en `approbation préalable`. | RS admet CC ; puis CC consulte le Sosa 31. | **Accordé.** | § 13.3 ; § 9.3 |
| S-55 | comme S-54 ; RS2 pose sur le Sosa 31 un embargo d'existence dont ni RS ni CC ne sont bénéficiaires. | CC consulte le Sosa 31. | **Introuvable.** | § 14 (étape 3) |

## 8. Réutilisation, révocation, hors ligne, contributions

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-56 | M, membre de Q, a repris une copie Q' grâce à une habilitation `réutiliser` active ; l'habilitation est ensuite close. | M consulte Q'. | **Accordé.** | DI-A38 ; § 13.11 |
| S-57 | comme S-56 ; licence de Q' autorisant la redistribution ; aucune protection ni droit de tiers ; M a partagé sa sélection avec le rôle collaborateur de TS, où N est collaborateur. | M inclut Q' dans sa sélection partagée, puis active la proposition ; M admet N ; N consulte Q'. | L'inclusion crée une **proposition**, sans effet sur l'accès (N : introuvable) ; après l'activation et l'admission, N **voit** Q'. | DI-A41 ; § 13.3 ; § 13.11 |
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
| S-139 | COL détient `éditer` sur l'objet o du contenu de P ; o est diffusable. | COL passe o en visibilité `public`. | **Refus** : ni titulaire ni RS. | § 13.2 |
| S-140 | RS de P ; évaluation de diffusabilité favorable sur o. | RS passe o en `public` ; puis un lecteur anonyme consulte o. | **Accordé.** | § 13.2 ; § 14 (étape 6) |
| S-141 | o, objet du contenu de P, est public et diffusable ; COL collaborateur. | COL réduit la visibilité de o à `projet`. | **Refus** : ni titulaire ni RS. | § 13.2 |
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
| S-212 | HI R `voir` sur o au profit de V ; P archivé ; RS clôt R pendant l'archivage ; R0 rouvre P. | V consulte o. | **Introuvable** : la réouverture ne réactive rien. | § 5.1 ; A4 |
| S-213 | o diffusable ; COL collaborateur. | COL contribue o au Core. | **Refus.** | § 7.1 |
| S-214 | o diffusable. | RS contribue o au Core. | **Accordé.** | § 7.1 |
| S-215 | o non diffusable. | RS contribue o au Core. | **Refus.** | § 7.1 |
| S-216 | RS a délégué `voir` + `repartager` sur o à COL ; o diffusable. | COL désigne le public bénéficiaire de `voir` sur o. | **Refus.** | § 13.1 |
| S-218 | lot {o, o2} délégué en `voir` à V jusqu'à 10. | RS ajoute o3 au lot ; puis V consulte o3. | **Introuvable** : la liste est figée. | § 13.4 |
| S-219 | lot {o, o2}. | RS délègue le lot en `valider` à V. | **Refus.** | § 13.4 |
| S-220 | lot {o, o2}. | RS délègue le lot en `voir` à V sans échéance. | **Refus.** | § 13.4 |
| S-221 | lot {o, o2} délégué en `voir` à V ; le lot est clos, puis rouvert. | V consulte o. | **Introuvable.** | § 13.4 ; A4 |
| S-222 | RS a délégué `voir` sur o à V. | ADM demande l'explication des accès de V à o. | L'explication cite l'HI de RS. | § 10.3 (OB-24) |
| S-223 | T sous embargo d'existence dont ADM n'est pas bénéficiaire ; V a une habilitation sur T. | ADM demande l'explication des accès de V à T. | **Introuvable.** | § 10.3 ; § 15 |
| S-224 | TIT a partagé priv avec V. | ADM affiche la liste des habilitations de P. | Aucune ligne ne porte sur priv. | § 10.3 (CD-23) |
| S-225 | ADM prépare une invitation de X dans P. | X consulte o. | **Introuvable** : préparer une invitation ne confère rien. | § 10.2 |
| S-226 | ADM propose une prise en charge de P par l'espace F, dont AF est administrateur. | AF consulte o. | **Introuvable.** | § 10.2 |

## 10. Transfert : objets personnels, atomicité, réémission

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-67 | C titulaire de l'objet `privé` O1 (sans embargo) dans ESP ; voie (b) retenue ; K a accepté explicitement O1. | K accepte le transfert ; puis K consulte O1. | **Accordé** (K titulaire). | § 10.5 (b) ; § 10.7 |
| S-227 | comme S-67. | contrôle de la paternité de O1 après le transfert. | La paternité de C reste attachée à O1. | § 10.5 |
| S-93 | comme S-67, mais K n'a pas accepté explicitement O1. | K accepte le transfert. | **Refus** ; rien n'est appliqué. | § 10.5 ; § 10.7 (I-11) |
| S-68 | C titulaire de O1 ; voie (a) avec copie (c), licence permettant la copie. | K accepte ; puis C consulte la copie dans son espace personnel. | **Accordé** ; la copie porte une `FILIATION` vers O1, resté dans ESP. | § 10.5 (c) |
| S-75 | comme S-68, mais la licence interdit la copie. | K accepte. | **Refus** ; rien n'est appliqué. | § 10.5 (blocage) ; § 10.7 |
| S-84 | voie (b) pour O1, acceptée par K ; voie (a) avec copie pour O2 ; un consentement couvrant O1 est retiré entre la présentation et l'acceptation. | K accepte. | **Refus** de toute l'acceptation. | § 10.7 |
| S-85 | O1 en voie (b) ; HP de C `voir` sur O1 au profit de V jusqu'à 20. | C annonce sa réémission jusqu'à 30. | **Refus** de l'annonce : une réémission est à l'identique ou plus étroite (V1.6 : contrôlé dès l'annonce). | § 10.5 |
| S-86 | O1 en voie (b), accepté par K ; HP de C sur O1 au profit de V, non réémise. | K accepte ; puis V consulte O1. | **Introuvable.** | § 10.5 ; § 10.7 |
| S-87 | O1 en voie (b), accepté par K ; HP de C `voir` sur O1 au profit de V, qui expire à 5 ; réémission annoncée à l'identique. | K accepte à 6 ; puis V consulte O1. | L'acceptation **réussit**, la réémission est **abandonnée**, et V reçoit « introuvable » (il n'a plus aucun droit sur O1, devenu objet de K). | § 10.5 (CT-09) ; A4 |
| S-88 | HI de C au profit du rôle `collaborateur` de F ; transfert présenté ; F nomme ensuite de nouveaux collaborateurs. | K accepte avec l'empreinte présentée. | **Accepté** : aucun veto implicite d'un tiers. | § 10.6 (F-4) |
| S-89 | ADME administrateur de ESP ; C titulaire de O1. | ADME crée une habilitation `voir` sur O1 au profit du `public`. | **Refus.** | A1 ; A2 ; § 13.1 |
| S-90 | RS2 a nommé RS3 RS de ESP ; RS3 n'a pas accepté. | RS3 consulte un objet du contenu de ESP. | **Introuvable.** | § 7.2 |
| S-146 | C (comme RS) a signé l'HI D `voir` sur le contenu de ESP au profit de V. | K accepte sans réémission ; puis V consulte un objet du contenu de ESP. | **Accordé** : l'HI survit au transfert. | § 10.7 ; I-8 (F-1) |
| S-147 | C a nommé RS2 (base de la section). | K accepte ; puis RS2 consulte le contenu de ESP, sans nouvelle acceptation. | **Accordé.** | § 10.7 (F-1) |
| S-148 | comme S-147 ; RS2 avait délégué `voir` sur ot à V avant le transfert. | après l'acceptation, V consulte ot. | **Accordé.** | § 10.7 (F-1) |
| S-228 | O1 en voie (b), accepté par K ; HP de C `voir` sur O1 au profit de V, réémission annoncée à l'identique. | K accepte ; puis V consulte O1. | **Accordé** ; la nouvelle HP a K pour auteur et un lien « réémission de ». | § 10.5 |
| S-229 | HP de C `voir` sur O1 au profit du groupe GK, M admis par C ; O1 en voie (b) ; réémission annoncée avec l'admission de M. | K accepte ; puis M consulte O1. | **Accordé.** | § 10.5 (CD-14) |
| S-230 | comme S-229, mais l'annonce ne liste pas l'admission de M. | K accepte ; puis M consulte O1. | **Introuvable.** | § 10.5 (CD-14) |
| S-231 | C a posé un embargo d'existence sur son objet O1, dont K n'est pas bénéficiaire. | C retient la voie (b) pour O1. | **Refus** : K doit voir l'objet. | § 10.5 (F-4) |

## 11. Arbitrages G-1 à G-11 et corrections V1.5

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-232 | SUP1 et SUP3, membres de l'autorité ; SUP3 est déclaré subordonné de SUP1. | SUP1 et SUP3 accordent à A un accès « enquête » à priv. | **Refus.** | § 12.7 |
| S-233 | SUP2 est aussi lecteur de P. | SUP1 et SUP2 accordent à A un accès « enquête » à priv, objet de P. | **Refus** : lien d'intérêt avec le dossier. | § 12.7 |
| S-234 | SUP3 est membre de l'autorité, mais son identité n'est pas établie. | SUP1 et SUP3 accordent à A un accès « enquête » à priv. | **Refus** : on refuse plutôt que de présumer l'indépendance. | A3 ; § 12.7 (G-1) |
| S-235 | l'identité de N n'est pas établie. | R0 nomme N RS de P. | **Refus** (opération sensible). | A3 (G-1) ; § 7.2 |
| S-236 | RS1 nommé RS sur le seul objet o ; HI de R0 au profit du groupe G de P, en `approbation préalable` ; ADM a ajouté M à G. | RS1 admet M. | **Refus** : le périmètre de RS1 ne couvre pas celui de l'habilitation. | § 2.1 ; § 7.2 ; § 9.3 |
| S-237 | HP de TIT `voir` sur priv au profit du groupe G, en `approbation préalable` ; V n'a aucun droit sur priv. | V admet M. | **Introuvable** : V ne connaît pas priv. | § 9.3 ; § 15 |
| S-238 | O sous embargo d'existence dont RS2 n'est pas bénéficiaire. | RS2 crée une HI `voir` sur O au profit de V. | **Introuvable.** | § 7.2 ; § 15 |
| S-239 | P archivé ; HI de RS au profit du groupe G ; ADM a ajouté M à G. | RS admet M. | **Refus.** | § 5.1 |
| S-240 | HI de RS en `notification` au profit du groupe G2 de l'espace F (gestionnaire AF) ; P archivé ; AF ajoute M à G2. | R0 rouvre P ; puis M consulte o. | **Accordé** : l'admission automatique, différée pendant l'archivage, est traitée à la réouverture. | § 5.1 (CT-18) |
| S-241 | HI R `voir` sur {o, O} au profit de V ; O sous embargo d'existence dont ADM n'est pas bénéficiaire. | ADM affiche la liste des habilitations de P. | R y figure, réduite à la seule cible o. | § 10.3 |
| S-242 | o, objet du contenu, n'est pas diffusable. | RS délègue `voir` sur o au public. | **Refus.** | § 13.1 |
| S-243 | RS crée une interdiction d'existence sur o. | RS s'y désigne destinataire. | **Refus.** | § 11.1 |
| S-244 | RS gardien d'un embargo d'existence sur o ; RS_bis est un second compte de RS. | RS ajoute RS_bis comme bénéficiaire. | **Refus** (personne). | A3 (G-1) ; § 11.3 |
| S-245 | M a annoté o hors ligne ; sa contribution a été refusée à l'intégration. | V lit la contribution de M. | **Introuvable.** | § 13.8 |
| S-246 | M détient `voir` sur le contenu de P ; O est sous embargo d'existence dont M n'est pas bénéficiaire. | M active la réplication de P. | La réplique ne contient pas O. | § 13.9 |
| S-247 | l'espace G2 porte une désignation de garde au profit de K. | son propriétaire R0 prépare un transfert à Z. | **Refus.** | § 10.4 |
| S-248 | comme S-247 ; R0 modifie d'abord la désignation au profit de Z, par un acte tracé. | R0 prépare un transfert à Z. | **Accepté.** | § 10.4 (CT-29) |
| S-249 | embargo d'existence sur o, dont le groupe « Proches » est bénéficiaire ; RS gardien ; Z membre de « Proches » et détenteur d'une HI `voir` sur o. | RS agrée Z ; puis Z consulte o. | **Accordé.** | § 9.5 |
| S-250 | RS gardien d'une interdiction d'action `éditer` et `commenter` sur o, visant COL. | RS ajoute LEC aux destinataires ; puis LEC commente o. | **Refus** : LEC, qui connaît o, est désormais destinataire. | § 11.4 |
| S-251 | série S de l'espace SA ; numéro N de l'espace SB, inséré par RB au rang 13, en attente. | RA, administrateur de SA, accepte l'insertion. | **Accepté** ; N occupe le rang 13 pour RB, qui la voit ; RA, qui ne la voit pas, ne voit aucun rang occupé (H-6e). | § 13.6 |
| S-252 | ADM administrateur de P. | R0 révoque ADM ; puis ADM affiche la liste des habilitations de P. | **Refus.** | § 10.1 ; § 10.3 |
| S-253 | restriction légale sur priv, contestée par TIT. | SUP3 et SUP4 maintiennent la restriction ; puis TIT consulte priv. | **Refus.** | § 11.6 |
| S-254 | effacement légal prononcé sur priv. | SUP1 et SUP2 accordent à A un accès « demande légale » à priv. | **Refus** : restriction non levable. | § 2.3 ; § 12.3 |
| S-255 | V détient une HI `voir` sur o ; P est clos. | V consulte o. | **Accordé** : la lecture est conservée. | § 5.1 |
| S-256 | TIT titulaire de priv, sous restriction légale. | TIT renonce à priv par la purge. | **Refus.** | § 6.3 (CT-30) |
| S-257 | M collaborateur de P n'a donné aucun mandat. | ADM lance l'import du fichier de M, qui en déclare les droits. | **Refus.** | § 6.2 (CT-31) |
| S-258 | TIT a partagé priv avec V. | COL, qui ne connaît pas priv, clôt cette HP. | **Introuvable.** | § 7.4 ; § 15 (CT-25) |
| S-259 | RS a nommé RS3, qui n'a pas encore accepté. | RS3 quitte P ; puis RS3 accepte la nomination. | **Refus** : le départ clôt les nominations proposées. | § 7.6 (CM-34) |
| S-260 | campagne en phase indépendante dont un participant est l'acteur institutionnel AMORCE. | AMORCE répond. | **Refus** : une participation exige une personne. | § 13.14 |
| S-261 | M, collaborateur de Q, a repris une copie c de l'objet src, sous embargo de contenu posé par RS dont M est bénéficiaire. | RS lève l'embargo sur src ; puis M partage c avec Z ; puis RS lève l'embargo hérité par c ; M partage c. | **Refus**, puis **accepté** : l'embargo hérité reste en vigueur après la levée sur l'original (une copie protégée n'est pas redistribuable) ; il est levé par ses propres gardiens. | § 13.11 ; § 11.5 (G-6, H-3b) |
| S-262 | comme S-261, avant la levée. | contrôle de la filiation de la copie. | La copie conserve un lien vérifiable vers src, et le copieur n'est pas gardien de la protection héritée. | § 13.11 ; A7 |
| S-263 | sélection partagée S = {o} (HI de RS au profit de V) ; RS en retire o, puis l'auteur la propose de nouveau. | V consulte o. | **Introuvable** : un objet retiré n'est jamais rétabli implicitement. | § 13.3 (G-4) |
| S-264 | comme S-263. | RS active la proposition ; puis V consulte o. | **Accordé.** | § 13.3 |

## 12. Décès et succession (G-9)

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-265 | TIT a partagé priv avec V ; deux approbateurs indépendants constatent le décès de TIT. | V consulte priv. | **Introuvable** : gel de succession. | § 10.4 ; § 2.4 (G-9) |
| S-266 | comme S-265. | un lecteur anonyme consulte l'objet public de TIT. | **Accordé** : le gel ne vise que les objets non publics. | § 10.4 |
| S-267 | comme S-265. | SUP3 seul accorde à A un accès « succession » à priv. | **Refus** : deux approbateurs sont requis. | § 12.3 |
| S-268 | comme S-265. | SUP3 et SUP4 accordent à A un accès « succession » à priv ; puis A le consulte pour cette finalité. | **Accordé.** | § 12.3 |
| S-269 | comme S-265. | SUP3 et SUP4 décident le versement de priv à P, avec l'accord de RS, sur un fondement documenté ; puis RS consulte priv. | **Accordé** ; V reçoit « introuvable » (les HP du défunt sont closes). | § 10.4 |
| S-270 | comme S-265 ; SUP3 et SUP4 ont désigné X ayant droit de priv. | X accepte ; puis X consulte priv. | **Accordé** (X titulaire). | § 10.4 |
| S-271 | comme S-265. | SUP3 et SUP4 décident un sort sans fondement documenté. | **Refus.** | § 10.4 |
| S-272 | SUP2 est collaborateur de P, où TIT a ses objets. | SUP1 et SUP2 constatent le décès de TIT. | **Refus** : lien d'intérêt avec le dossier. | § 10.4 ; § 12.7 |

## 13. Scénarios ajoutés après le banc de mutations V1.5

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-273 | RS_bis est un second compte de RS. | RS délègue `voir` sur o à RS_bis. | **Refus** (A3, personne). | A3 (G-1) |
| S-274 | HI de RS2 au profit du groupe G de P, en `approbation préalable` ; ADM a ajouté RS à G. | RS s'admet lui-même. | **Refus.** | A3 |
| S-275 | HI de RS au profit du groupe G de P, en `approbation préalable` ; ADM a ajouté RS, son signataire, à G. | RS2 admet RS. | **Refus** : le signataire n'est jamais admis à sa propre habilitation. | § 9.4 (G-2) |
| S-276 | RS, membre du groupe g de l'espace GS, signe une HI `exporter` sur le contenu de P au profit de g, en `notification` ; RS est ensuite révoqué comme RS, et nommé collaborateur (sans `exporter`). | RS exporte o. | **Refus** : le signataire n'est jamais admis à sa propre habilitation, qui survit à sa révocation. | § 9.4 (G-2) ; § 2.1 |
| S-277 | ESP transféré de C à K ; avant le transfert, RS2 avait délégué `voir` sur le contenu de ESP au rôle `collaborateur` de F, en `notification` ; C est collaborateur de F ; après le transfert, C quitte F. | RF nomme de nouveau C collaborateur de F ; puis C consulte un objet du contenu de ESP. | **Introuvable** : le cédant est exclu de l'admission automatique, même pour une HI d'un tiers. | § 9.4 ; § 10.8 |
| S-278 | RS a délégué `voir` + `repartager` sur o à A (HI) ; A a délégué `voir` sur o au groupe G, en `approbation préalable` (HP), que RS a confirmée ; A a admis M ; R0 met l'HI de A en examen. | M consulte o. | **Introuvable** : l'admission prononcée par A est inopérante pendant l'examen. | § 5.3 ; § 7.5 (G-8) |
| S-279 | ESP : sélection S de C = {ot}, HI de C `voir` sur S au profit de V ; C propose d'ajouter o2 ; transfert présenté. | C active la proposition. | **Refus** (« espace en cours de transfert ») : l'activation élargit un engagement. | § 10.6 (G-3) |
| S-280 | ESP : restriction légale sur ot, valable jusqu'à 5 ; transfert présenté à 0. | K accepte à 6, avec l'empreinte présentée. | **Refus** « présentation renouvelée » : la fin d'une restriction présentée élargit les engagements. | § 10.6 (G-3) |
| S-281 | HP de C `voir` sur son objet O1 au profit du groupe GK, M admis ; voie (b) ; réémission annoncée avec M ; transfert présenté ; C retire ensuite l'admission de M. | K accepte ; puis M consulte O1. | **Introuvable** : seules les admissions encore actives sont reprises. | § 10.5 (CM-14) |
| S-282 | HI de RS2 `voir` sur ot au profit du rôle `collaborateur` de F, en `approbation préalable` ; C est collaborateur de F et a été admis par RS2. | K accepte le transfert ; puis C consulte ot. | **Introuvable** : C perd ses admissions, même au titre d'un rôle d'un autre espace. | § 10.7 |
| S-283 | RS2 a délégué `voir` sur ot à C (HI nominative). | K accepte le transfert ; puis C consulte ot. | **Introuvable.** | § 10.7 |
| S-284 | T, objet public de ESP ; RS2 y a posé un embargo d'existence dont C est bénéficiaire explicite. | K accepte le transfert ; puis C cherche T. | Aucun résultat : C perd sa qualité de bénéficiaire. | § 10.7 |
| S-285 | RS interdit `voir` à RS2 sur o ; HI de RS `voir` sur o au profit du groupe G, en `approbation préalable` ; ADM a ajouté M à G. | RS2 admet M. | **Refus** : on n'admet pas au titre d'une action qu'on ne peut pas exécuter. | § 9.3 ; § 2.5 (G-7) |
| S-286 | sélection partagée S = {o} (HI de RS au profit de V) ; RS propose d'y ajouter o2. | LEC, lecteur qui connaît o2 mais ne peut signer l'habilitation, active la proposition. | **Refus.** | § 13.3 (G-4) |
| S-287 | M, collaborateur de Q, a repris une copie c de src (objet de P) ; M a délégué `voir` sur c à V, qui ne voit pas src. | V affiche c. | La filiation n'est pas révélée à V. | § 14 (étape 7) ; § 15 |
| S-288 | TIT a délégué `voir` + `repartager` sur priv à V1 jusqu'à 20. | V1 délègue `voir` sur priv à T jusqu'à 30. | **Refus.** | § 8.1 (4) |
| S-289 | TIT a délégué `voir` sur priv à V, sans `repartager`. | V délègue `voir` sur priv à T. | **Refus.** | § 8.1 (5) |
| S-290 | ADM administrateur de P. | ADM archive P. | **Refus** : réservé au propriétaire. | § 5.1 ; § 10.1 |
| S-291 | TIT_bis est un second compte de TIT. | TIT délègue `voir` sur priv à TIT_bis. | **Refus** (A3, personne). | A3 (G-1) |
| S-292 | ESP : T sous embargo d'existence posé par RS2, dont K n'est pas bénéficiaire ; HI de RS2 `voir` sur {ot, T} au profit de V, présentée à K réduite à ot ; transfert présenté. | RS2 lève l'embargo sur T. | **Refus** (« espace en cours de transfert ») : la levée élargirait, pour K, le périmètre d'un engagement. | § 10.6 (G-3) |

## 14. Règles nouvelles ou corrigées de la V1.6 (décisions H-1 à H-6, corrections CT et CM)

| ID | Préconditions | Opération | Résultat attendu | Fondement |
|---|---|---|---|---|
| S-293 | transfert de ESP préparé ; C a délégué à V `voir` sur ses objets O1 (voie a) et O2 (voie b), par une seule HP. | C annonce la réémission de cette HP. | **Refus** : une HP qui porte sur des objets de voies différentes ne peut pas être annoncée. | § 10.5 (CT-22) |
| S-294 | R0 a nommé N RS de P (nomination proposée) ; R0 archive P. | N accepte la nomination ; puis R0 rouvre P et N accepte. | **Refus**, puis **accepté** : l'acceptation de nomination est fermée dans un espace archivé. | § 5.1 ; T-02 (CT-27) |
| S-295 | RS1 nommé RS sur le seul objet o ; HI de R0 `voir` sur le contenu de P au profit du groupe G ; M admis. | RS1 retire l'admission de M ; puis RS le fait. | **Refus**, puis **accepté** : seul un RS dont le périmètre couvre l'habilitation la retire. | § 8.3 ; § 9.3 (CM-19) |
| S-296 | RS a délégué à V `voir` sur les objets o et o2. | RS restreint le périmètre à {o, o3} ; puis à {o}. | **Invalide** (le périmètre n'est pas inclus), puis **accepté** : V voit o, plus o2. | T-05 (CM-20) |
| S-297 | RS gardien d'une interdiction d'action `editer` sur o, visant COL ; RS2 détient un droit sur o. | RS ajoute RS2 (personne) aux destinataires après l'avoir désigné gardien ; puis RS désigne COL gardien. | **Refus** dans les deux cas : gardien et destinataire s'excluent. | § 11.2 (CM-23) |
| S-298 | TIT a délégué à V `voir` avec `repartager` sur priv, et `voir` avec `repartager` sur priv au groupe G ; V, qui remplit les conditions 1 et 2, a admis M (membre de G). | M délègue `voir` sur priv à V. | **Refus** : V, auteur de l'admission qui porte le droit de M, est en amont de sa chaîne. | § 8.2 (cycles, à toute profondeur) |
| S-299 | C, propriétaire de ESP avec une désignation de garde au profit de K, est décédé. | SUP1 et SUP2 ouvrent la succession de ESP ; puis l'audit contrôle le scellé. | **Accepté** ; la présentation de la succession est scellée (scellé d'audit archivé). | § 10.4 ; § 10.6 (CM-22) |
| S-300 | comme S-299 ; C avait aussi un objet personnel dans l'espace F, dont SUP3 est membre. | SUP3 et SUP4 ouvrent la succession de ESP. | **Refus** : le dossier comprend tous les objets et espaces du défunt ; SUP3 a un lien d'intérêt. | § 10.4 ; § 12.7 (CM-22) |
| S-301 | C, propriétaire de ESP, où SUP4 est lecteur, avait un objet personnel dans l'espace F ; C est décédé. | SUP4 et SUP1 décident le maintien du gel de l'objet de F ; puis SUP1 et SUP2. | **Refus**, puis **accepté** : le dossier d'une décision de succession comprend tous les espaces du défunt, et SUP4, membre de ESP, a un lien d'intérêt. | § 10.4 ; § 12.7 (CM-22) |
| S-302 | TIT a délégué à V `voir` avec `repartager` sur priv ; V a délégué `voir` sur priv à W. | TIT clôt l'HP de V au profit de W ; puis W consulte priv. | **Accepté**, puis **introuvable** : le titulaire de la cible clôt toute HP qui la vise. | § 8.3 |
| S-303 | priv diffusable ; TIT a délégué à V `voir` avec `repartager` sur priv. | V désigne le public bénéficiaire de `voir` sur priv. | **Refus** : seul le titulaire (objet personnel) ou un RS (contenu) désigne le public. | § 13.1 |
| S-304 | V lecteur de P ; RS pose une interdiction d'action `commenter` sur o visant V_bis, second compte de V. | V commente o. | **Refus** : une interdiction vise la personne. | § 2.3 ; § 11.4 (H-5) |
| S-305 | RS pose sur o un embargo d'existence dont V_bis, second compte de V, est bénéficiaire ; RS a délégué `voir` sur o à V. | V consulte o. | **Accordé** : le bénéficiaire s'entend de la personne. | § 2.4 (H-5) |
| S-306 | RS gardien d'un embargo de contenu sur o. | RS_bis, second compte de RS, lève l'embargo. | **Accepté** : le gardien s'entend de la personne. | § 11.2 ; § 11.5 (H-5) |
| S-307 | transfert de ESP préparé de C à K ; C2, second compte de C, collaborateur de ESP, y a un objet personnel O2 (nommé par RS2), sans voie retenue. | C présente le transfert. | **Blocage** : les objets personnels du cédant s'entendent de la personne. | § 10.5 (H-5) |
| S-308 | HI de RS `voir` sur o au groupe G, en `notification` ; ADM ajoute à G le compte NONV, sans identité établie. | NONV consulte o. | **Introuvable** : un compte sans identité établie n'est jamais admis automatiquement. | § 1 ; § 9.4 (H-5) |
| S-309 | NONV, compte sans identité établie, est collaborateur de P et titulaire de l'objet personnel q. | NONV pose un embargo de contenu sur q ; puis TIT, gardien d'un embargo sur priv, désigne NONV gardien. | **Refus** dans les deux cas : ni créateur de protection ni gardien sans identité établie. | § 1 ; § 11.1 ; § 11.2 (H-5) |
| S-310 | TIT a délégué `voir` avec `repartager` sur priv à V et à W ; W a délégué `voir` sur priv à V_bis, second compte de V. | V confirme l'HP de W au profit de V_bis ; puis TIT la confirme. | **Refus**, puis **accepté** : nul ne confirme une habilitation dont sa personne est bénéficiaire. | A3 ; T-06 (CT-03) |
| S-311 | sélection S de RS, non partagée, avec une proposition en attente de o2 (elle était partagée lors de l'ajout, puis l'habilitation a été close). | RS2 active la proposition ; puis RS, auteur, l'active. | **Refus**, puis **accepté** : une sélection non partagée est gérée par son auteur. | § 13.3 (CT-10) |
| S-312 | RS2 est frappé par une interdiction d'action `voir` sur o, qu'il connaît (posée par RS). | RS2 délègue `voir` sur le contenu de P à V. | **Refus** : sur une cible connue, une action non exécutable fait refuser l'acte (pas d'exclusion figée). | § 2.5 (G-7, H-1a) |
| S-313 | o2 est caché à R0 par une interdiction d'existence posée par RS. | R0 nomme N lecteur sur le contenu de P ; puis N consulte o et o2. | **Accepté** ; N voit o, et o2 est une exclusion figée de la nomination : **introuvable**. | § 2.5 (H-1a) ; § 7.2 |
| S-314 | comme S-313 ; HI de RS `voir` sur le contenu de P au profit du groupe G ; M membre de G. | R0 admet M ; puis M consulte o et o2. | **Accepté** ; M voit o ; o2 est une exclusion figée de l'admission : **introuvable**. | § 2.5 (H-1a) ; § 8.3 |
| S-315 | comme S-313 ; RS a délégué à Q `voir` avec `repartager` sur le contenu de P ; Q a délégué `voir` sur le contenu de P à B (HP). | R0 confirme l'HP de Q ; RS clôt l'HI de Q ; puis B consulte o et o2. | B voit o (fondateur R0) ; o2 est une exclusion figée de R0 : **introuvable**. | § 2.5 (H-1a) ; § 8.2 |
| S-316 | M, collaborateur de Q, a repris une copie c de l'objet src ; Y lecteur de P ; M a délégué `voir` sur c à Y. | RS pose sur src une interdiction d'existence visant Y ; puis Y consulte c. | **Introuvable** : une protection créée plus tard sur un ascendant est propagée aux copies. | § 13.11 (H-3b) |
| S-317 | M, collaborateur de Q, a repris une copie c de l'objet src ; src est ensuite évalué sensible (fait externe, DI-E05). | M délègue `voir` sur c à Y. | **Refus** : la sensibilité d'un ascendant est héritée ; une copie sensible n'est pas redistribuable. | § 13.11 (H-3b) |
| S-318 | RS2, membre du groupe g de ESP, signe une HI `voir` sur le contenu de ESP au profit de g, en `notification` ; transfert de ESP présenté à K. | K lit les admissions des engagements présentés. | aucune admission de RS2 : le signataire n'est jamais admis, même automatiquement. | § 9.4 (G-2) ; § 10.6 |
| S-319 | O1 en voie (b), accepté par K ; HP de C `voir` sur O1 au profit de V jusqu'à 30, annoncée en réémission à l'identique ; transfert présenté ; C restreint ensuite l'HP à l'échéance 20. | K accepte. | **Refus** de toute l'acceptation : la réémission maintenue serait plus large que l'HP d'origine. | § 10.5 ; § 10.7 |
| S-320 | RS pose un embargo d'existence sur o, dont il est gardien ; R0 a délégué `voir` sur o à RS_bis, second compte de RS. | RS_bis consulte o. | **Accordé** : le gardien d'un embargo en est bénéficiaire, par personne. | § 11.2 ; I-12 (H-5) |
| S-321 | T2, second compte de la personne T, est RS de P et gardien unique d'un embargo d'existence sur o. | SUP1 et SUP2 constatent le décès de T (premier compte). | la protection devient orpheline et est signalée à l'autorité de dérogation : le défunt s'entend de la personne. | § 10.4 (CT-14, H-5) ; § 11.2 |
| S-322 | embargo d'existence sur o1 (contenu de ESP) au profit du groupe g2 de l'espace GS, K agréé ; HI de RS2 `voir` sur {o1, ot} au profit de V ; RG retire K de g2 ; transfert présenté (K ne voit pas o1). | RG, gestionnaire de g2, hors de l'espace transféré, rajoute K à g2 (non gelé) ; puis K accepte. | **Présentation renouvelée** : le périmètre réel d'un engagement présenté s'est élargi. | § 10.6 (G-3, H-4a) |
| S-323 | comme S-322, l'HI de RS2 portant sur o1 seul (invisible à K à la présentation). | RG rajoute K à g2 ; puis K accepte. | **Présentation renouvelée** : un engagement nouveau pour K est apparu. | § 10.6 (G-3, H-4a) |

## Non-régression des attaques du contrôle en aveugle A (V1.4)

Chaque ligne est un test de `spec/autorisation/tests/test_attaques.py`. L’attendu est tiré du texte V1.6.

| Attaque | Attendu et fondement |
|---|---|
| a01 | A3, § 9.4, I-3 : deux gestionnaires de groupes d'espaces différents s'ajoutent l'un l'autre ; aucun n'est admis automatiquement. |
| a01 (variante) | deux RS de deux espaces se nomment lecteurs l'un chez l'autre. |
| a02 | § 10.6 (G-3), § 8.3 : le bénéficiaire ne restreint pas sa propre nomination ; un retrait ne bloque pas l'acceptation. |
| a03 | § 13.3 (G-4), A1, I-2 : un ajout à une sélection partagée est une proposition ; une HI ne sert jamais un objet hors du périmètre du signataire. |
| a04 | § 15 (CM-04) : nommer sur une cible cachée ou inexistante produit la même réponse. |
| a05 | § 13.6, § 15 (CM-05) : insérer une publication cachée ou inexistante produit la même réponse. |
| a06 | § 6.3 (CM-06) : une reprise au versement est à l'identique ou plus étroite, et signée par un RS dont le périmètre couvre l'objet. |
| a06 | A3 : le RS qui accepte le versement ne reprend pas une HP dont il est bénéficiaire. |
| a07 | § 1, § 8.1 (G-5) : une délégation ne mêle pas des cibles de deux régimes. |
| a08 | § 10.4, § 12.7 (G-9) : un administrateur de l'espace n'approuve pas la succession ; les objets personnels du défunt ne sont jamais versés implicitement. |
| a09 | § 5.6 (CT-16) : une présentation expirée n'est pas relancée par le cessionnaire. |
| a10 | § 7.5, § 5.3 (G-8) : la mise en examen rend l'aval inopérant sans le détruire ; la suspension d'une appartenance n'est pas une sortie. |
| a11 | § 5.3 (CM-10) : l'admission prononcée par un acteur dont la chaîne est rompue est close, qu'il soit ou non fondateur. |
| a12 | § 5.1 (CT-18) : aucune admission automatique dans un espace clos. |
| a13 | A3, § 9.4 (G-2) : le signataire n'est jamais admis à sa propre habilitation ; révoqué, il ne garde rien. |
| a14 | § 2.5, § 8.1 (G-7) : une interdiction effective empêche de déléguer l'action interdite. |
| a15 | § 13.11 (G-6) : la copie hérite des protections et des restrictions non levables de l'original. |
| a16 | § 12.4, § 12.7 (G-1) : un membre de l'autorité ne s'accorde pas une dérogation par un second compte. |
| a17-1 | § 11.6 (CT-23) : une restriction externe est levée par son autorité émettrice. |
| a17-2 | § 10.6 (H-4a) : pendant la fenêtre, la désignation d'un gardien, y compris par l'autorité de dérogation, est gelée quel qu'en soit l'effet (gel par liste d'opérations). Après l'annulation, C est désignable ; K, sans droit de contenu, ne l'est pas (§ 11.2). |
| a17-3 | § 7.4, § 15 (C-19) : la racine n'agit pas sur une HI dont la cible lui est cachée. |
| a17-4 | § 13.1 (CT-21) : le public ne reçoit que voir, exporter ou réutiliser. |
| a17-5 | A3, § 9.4 (G-1) : un administrateur n'ajoute pas son second compte à un groupe. |
| a17-6 | A3 (G-1) : nommer RS son second compte est refusé. |
| a18-1 | § 10.5 (CT-09), I-5 : une réémission invalide est abandonnée ; l'acceptation a la même issue avec ou sans l'objet caché à K. |
| a18-2 | § 8.3 (CT-15), § 10.5 : le bénéficiaire clôt l'HP ; la réémission est abandonnée ; le transfert n'est pas bloqué. |
| a18-3 | § 10.5 (CM-14) : seules les admissions actives de l'HP d'origine peuvent être annoncées. |
| a18-4 | § 10.6 (CT-17) : un versement avec reprise élargit les engagements et est gelé ; une HP d'un titulaire tiers sur son objet personnel ne l'est pas. |
| a19-1 | § 5.1 : le titulaire partage son objet personnel dans un espace archivé. |
| a19-2 | § 14 (CM-21) : un acteur qui ne détient que `commenter` connaît l'existence : « refus ». |
| a19-3 | § 13.7 (CM-22) : un non-membre ne crée pas de base de portée `projet`. |
| a19-4 | § 5.1 (CT-20) : aucun élargissement de visibilité dans un espace clos. |
| a19-5 | § 12.4, § 13.9 (G-11) : un objet vu par dérogation n'entre jamais dans une réplique. |
| a19-6 | § 8.3 (CT-15) : le bénéficiaire d'une HP la clôt, mais ne la restreint pas. |
| a20-1 | § 11.2 (G-10) : une protection orpheline est signalée d'office à l'autorité de dérogation, et à elle seule ; le signalement ne donne aucun accès. |
| a20-2 | § 5.3, § 9.4 (CM-24) : on ne retire qu'une admission existante ; aucune exclusion préventive. |
| a20-3 | § 12.4, § 12.6 (G-11) : finalités en liste fermée ; consécutivité quelle que soit la finalité. |
| a20-4 | I-4 : le propriétaire voit un objet personnel `communauté` par sa seule visibilité par défaut. |
| a20-5 | § 9.3 (H-6b, remplace la bascule de CT-27) : une admission automatique ne confère rien sur une cible devenue exigeante, et continue de valoir sur les autres cibles du périmètre. |

## Non-régression : Attaques du contrôle en aveugle A (V1.5)

Chaque ligne est un test de `spec/autorisation/tests/test_controles_v15.py`. L’attendu est tiré du texte V1.6.

| Test | Attendu et fondement |
|---|---|
| a01 | § 2.5 (H-1a), I-5 : sur un périmètre dynamique, une cible cachée à l'habilitant ne fait pas refuser l'acte ; la réponse est celle d'un monde sans cette cible, et l'habilitation ne confère rien sur elle (exclusion figée). |
| a02 | § 9.2 (H-2a), A3 : une HI au profit d'un rôle de son propre espace exige une admission. Deux RS à périmètre étroit qui se nomment l'un l'autre (seconds comptes) dans ce rôle n'en tirent que les actions du rôle sur le périmètre nommé (une nomination émane d'un autre acteur, A3) et rien par l'HI ; un tiers nommé sur un périmètre étroit n'obtient rien hors de lui. P-1 validé le 12/10/2026 : I-3 interdit le gain par les ensembles gérés, et permet cette nomination par autrui. |
| a03 | A3, T-04 (CT-03) : nul ne prolonge une habilitation dont il (sa personne) est bénéficiaire, HI ou nomination. |
| a04 | § 12.6 (CT-16), I-13 : le rang d'une demande est 1 + le maximum des rangs de toutes les dérogations consécutives qu'elle recoupe ; intercaler une dérogation « fraîche » ne remet pas le compteur à zéro. |
| a05-1 | § 11.6 (CT-05), § 13.11 (H-3b) : une restriction légale posée sur l'original après la copie frappe aussi la copie. |
| a05-2 | § 11.2, § 13.11 (H-3b) : les gardiens d'une protection héritée sont ceux de l'ascendant, appréciés sur l'ascendant : la protection n'est pas orpheline, le copieur ne peut ni la lever ni se faire désigner, et la copie reste cachée au destinataire. |
| a05-3 | § 13.11 (H-3b), § 12.3 : la sensibilité est héritée : la copie n'est pas redistribuable et une dérogation à un approbateur ne la couvre pas. |
| a06 | § 5.1 (CM-03, CM-04) : dans un espace archivé ou clos, écritures, HP et confirmations sur un objet personnel au titulaire seulement ; sur le contenu, fermées. |
| a07-1 | § 10.4 (H-5) : le gel de succession porte sur les objets de tous les comptes de la personne. |
| a07-2 | § 10.4 (CT-14), § 11.2, § 12.3 : le défunt perd la qualité de gardien ; la protection devient orpheline et est signalée ; aucune dérogation ne la franchit tant qu'un gardien n'est pas désigné ; la désignation contrôlée est possible. |
| a07-3 | § 12.3 (CT-15) : une dérogation sur un objet gelé exige la finalité `succession`. |
| a08-2 | § 10.3 (CT-20) : les actes sur les protections ne figurent pas dans les journaux de gouvernance. |
| a08-3 | § 11.4 (H-5) : une interdiction qui vise un compte vise tous les comptes de la personne. |
| a08b | § 13.6 (H-6e), I-5 : un rang n'est occupé, pour un acteur, que par une publication qu'il voit ; la réponse est celle d'un monde sans la publication cachée. |
| a09-1 | § 10.7 (H-5), § 10.8 : le cédant s'entend de la personne : son second compte perd ses appartenances et reste sous verrou. |
| a09-2 | § 10.7 (CT-19) : l'acceptation est refusée si l'espace a été clos pendant la fenêtre ; la clôture n'est pas gelée. |
| a09-3 | § 10.6 (H-4a), § 5.6 (CT-09) : les actes de l'autorité légale ne sont jamais gelés ; un nouvel engagement fait renouveler la présentation ; un transfert compte au plus PRESENTATIONS_MAX présentations, après quoi le cédant l'annule et une carence s'ouvre. |
| a09-4 | § 10.6 (CT-26) : la décision de geler ne dépend pas de ce que voit K ; un tiers n'apprend rien. |
| a10-1 | § 9.3 (H-6b) : une protection posée puis levée par un RS étroit ne change pas le mode de l'HI de la racine ; l'admission automatique ne vaut pas sur la cible tant qu'elle est exigeante, et vaut de nouveau après la levée. |
| a10-2 | § 7.6 (CT-17) : le départ clôt les nominations proposées que le partant a signées. |
| a10-3 | § 7.2 (CM-02), § 2.5 : une nomination ne confère pas une action que le signataire ne peut pas exécuter sur une cible qu'il connaît. |
| a10-4 | § 10.8 (H-6c) : un consentement vaut pour un seul acte et devient caduc au transfert suivant. |
| a11 | § 10.6 (H-4a) : la confirmation figure dans la liste gelée ; elle est refusée pendant la fenêtre quel qu'en soit l'effet ; l'aval de l'HI en examen reste inopérant. |
| a12 | § 10.6 : la création d'une protection n'est jamais gelée, même si elle cache à K une restriction présentée (une protection devenue invisible à K est un retrait, CT-18). |
| a13-1 | § 9.3 (H-6b) : un objet sensible activé dans une sélection servie en `notification` n'est jamais conféré par une admission automatique. |
| a13-2 | § 13.3 (CT-10) : l'auteur d'une sélection partagée qui ne peut pas restreindre chacune des habilitations qui la visent ne la révoque pas, ni ne la réduit. |

## Non-régression : Témoins des mutations survivantes du contrôle en aveugle B (V1.5)

Chaque ligne est un test de `spec/autorisation/tests/test_controles_v15.py`. L’attendu est tiré du texte V1.6.

| Test | Attendu et fondement |
|---|---|
| N01 | § 7.5, T-07 : une HP ne se met pas en examen. |
| N02 | T-04, § 7.2 : un RS dont le périmètre ne couvre pas l'HI ne la prolonge pas. |
| N03 | § 2.5, T-04 : une prolongation exige l'exécution effective des actions sur les cibles connues. |
| N04 | § 2.5, T-06 : une confirmation exige l'exécution effective. |
| N06 | § 8.3, § 9.3 : admettre au titre d'une HP exige les conditions 1 et 2 du § 8.1. |
| N07 | § 8.3 (CM-19) : seul l'habilitant retire une admission. |
| N08 | § 9.4 (H-5) : l'exclusion après retrait s'apprécie par personne. |
| N09 | § 12.6 (H-5) : la consécutivité des dérogations s'apprécie par personne. |
| N10 | A6, § 11.2 : un échec d'évaluation ne retire jamais un gardien. |
| N12 | § 13.11 (G-6, H-3b) : une copie hérite des destinataires de l'interdiction ; une dérogation sans l'accord d'un gardien ne la franchit pas. |
| N13 | § 13.11 (H-3b), § 2.3 : les non-levables d'un ascendant quelconque s'appliquent à la copie. |
| N14 | § 10.3, A2 : les métadonnées de gouvernance ne sont lues que par les administrateurs et les RS. |
| N15 | § 10.3 : les HP sur un objet personnel ne figurent pas dans les journaux, sauf pour le titulaire. |
| N16 | § 10.3 (OB-24) : jamais d'explication des accès à l'objet personnel d'autrui. |
| N17 | § 10.6 : la présentation n'est lisible que par le cessionnaire. |
| N18 | § 12.5 : seul un membre de l'autorité de dérogation révoque une dérogation. |
| N19 | § 11.6 : seul le titulaire (ou un RS pour le contenu) conteste une restriction légale. |
| N20 | § 11.6, § 12.7 : une contestation est examinée par deux approbateurs indépendants. |
| N21 | § 10.1, § 10.8 : seul le propriétaire consent à la réintégration du cédant. |
| N22 | § 11.1 : un RS ne pose une protection que dans son périmètre. |
| N23 | § 13.7 : une base de portée projet exige une action d'écriture sur l'assertion. |
| N24 | § 13.6 : insérer exige d'être RS ou administrateur de l'espace de la publication. |
| N32 | § 10.6 (H-4a) : la levée d'une restriction légale n'est jamais gelée ; elle élargit un engagement présenté, et l'acceptation est refusée pour présentation renouvelée. |
| N40 | § 8.2 : une HP au profit d'une personne en amont de la chaîne, à quelque profondeur que ce soit, est refusée. |
| N50 | § 13.10 (CP-40) : une décision en cache n'est jamais servie au-delà de l'échéance. |
| N53 | § 12.3 : aucune dérogation ne franchit une protection orpheline. |
| M010 (sonde du contrôle B) | § 9.4, § 10.6 (H-6a) : une admission automatique différée par la fenêtre de transfert est réévaluée à son traitement : le membre devenu gestionnaire pendant la fenêtre n'est pas admis ; l'autre l'est. |
| M013 (sonde du contrôle B) | § 9.4 (G-2), § 2.1 : le signataire n'est jamais admis à sa propre HI au profit d'un rôle de son espace, même après sa révocation et sa nomination dans ce rôle. |
| M104 (sonde du contrôle B) | § 11.2 (G-10, F-03) : chaque passage à l'état orphelin est signalé ; la désignation d'office n'est saisie que par le signalement du passage en cours. |

## Contrôles indépendants de clôture V1.6

| Test | Attendu et fondement |
|---|---|
| test_p1_nomination_autre_rs_sans_gain_par_ensemble_gere | P-1, A3, § 9.4 : nomination croisée limitée au périmètre ; aucune admission du gestionnaire. |
| test_p2_versement_accord_autre_personne | P-2, § 6.3 : versement autorisé par un autre RS, puis droits scientifiques ordinaires sur le contenu. |
| test_p3_signalement_minimal_sans_cible_ni_titre | P-3, § 11.2 : seul un identifiant de protection est notifié à l'autorité ; la cible reste cachée. |
| test_p2_versement_active_hi_preexistante_du_contenu | P-2, § 6.3 : une HI préexistante du contenu devient applicable au seul objet versé. |
| test_m312_purge_ascendant_ne_libere_pas_copie_sensible | M312, § 13.11 : la purge logique de l'original ne supprime pas la sensibilité héritée. |
| test_m033_m330_prolongation_gelee_et_restriction_admise | § 10.6 : prolonger pendant la fenêtre est gelé ; retirer des actions conserve une présentation valable. |

## Bilan

- **Scénarios : 322**, dont 147 repris de la V1.3 et 175 nouveaux depuis la V1.3 (S-149 à S-323).
- **Attaques de non-régression : 39** (contrôle A V1.4).
- **Non-régression des contrôles V1.5 : 55** (13 scripts du contrôle A, témoins du contrôle B).
- **Contrôles indépendants de clôture V1.6 : 6** (P-1 à P-3 et défenses redondantes).
- **Tous automatisés** : `python -m unittest discover -s spec/autorisation/tests`.

### Scénarios modifiés en V1.6

| ID | Modification |
|---|---|
| S-01 | Fondement corrigé : le refus vient de A1 (contrôle B, A-03). |
| S-02 | Fondement corrigé : A1, § 2.5 (contrôle B, A-03). |
| S-04 | Fondement corrigé : § 7.1, § 10.2 (contrôle B, A-04). |
| S-05 | Fondement corrigé : A1, A2 (contrôle B, A-03). |
| S-09 | Fondement « § 8.1 (1) » (contrôle B, A-08). |
| S-11 | Jumeau construit par `tests/outils.py` ; type de la cible vérifié (contrôle B, A-18, B-01). |
| S-21 | Fondement « § 8.1 (1) » (contrôle B, A-08). |
| S-24 | Fondement corrigé : § 9.1 (contrôle B, A-05). |
| S-33 | Le cédant conserve l’HP d’un titulaire tiers (CT-28). |
| S-37 | Porte sur une habilitation close au transfert (contrôle B, A-15). |
| S-48 | Jumeau construit par `tests/outils.py` (contrôle B, B-01). |
| S-51 | Masque et relation posés par des opérations publiques (contrôle B, A-21). |
| S-53 | L’ajout à une sélection partagée est une proposition (CM-21 : `proposer_ajout` retiré). |
| S-57 | Attendu : proposition, puis activation et accès du tiers (contrôle B, A-13). |
| S-85 | Réémission plus large refusée dès l’annonce. |
| S-87 | Attendu « introuvable » (contrôle B, A-01). |
| S-95 | Toutes les notifications comparées (contrôle B, A-12). |
| S-99 | Journaux comparés au jumeau ; aucune ligne de protection (CT-20, contrôle B, A-11). |
| S-107 | Conservation vérifiée par la lecture de l’auteur (contrôle B, A-19). |
| S-119 | Reformulé : un ancien propriétaire ne transfère pas (contrôle B, A-06). |
| S-121 | Consentement par acte (H-6c). |
| S-122 | Jumeau construit par `tests/outils.py` (contrôle B, B-01). |
| S-123 | Décès constaté par la voie contractuelle (contrôle B, A-14). |
| S-163 | Attendu inversé (H-2a) : admission requise, même pour un rôle de son propre espace. |
| S-170 | Fondement : exclusion du signataire (contrôle B, A-07). |
| S-236 | Fondement « § 2.1 ; § 7.2 ; § 9.3 » (contrôle B, A-09). |
| S-251 | Rangs lus par `lire_serie`, par acteur (H-6e). |
| S-261 | Effet observé : la copie protégée n’est pas redistribuable (contrôle B, A-16). |
| S-276 | Oracle observationnel : le droit lui-même (contrôle B, A-10). |

- **Statut : baseline de régression du contrat V1.6 gelé le 12/10/2026 ; paramètres et limites réservés au contrat.**
