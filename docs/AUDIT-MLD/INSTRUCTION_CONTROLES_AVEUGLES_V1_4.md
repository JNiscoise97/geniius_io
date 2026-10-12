# GENIIUS — Instruction des contrôles en aveugle du contrat V1.4, du modèle et de la batterie

**Date :** 11 octobre 2026

**Rapports instruits :**
- [CONTROLE_AVEUGLE_CONTRAT_MODELE_V1_4.md](CONTROLE_AVEUGLE_CONTRAT_MODELE_V1_4.md) (contrôle A : texte et conformité du modèle, 20 scripts d'attaque) ;
- [CONTROLE_AVEUGLE_COUVERTURE_BATTERIE_V1_4.md](CONTROLE_AVEUGLE_COUVERTURE_BATTERIE_V1_4.md) (contrôle B : justesse et couverture de la batterie, 110 mutations).

Ils ont été produits par deux agents séparés, sans accès aux rapports ni aux instructions antérieurs, et sans accès l'un à l'autre.

**Instructeur :** l'auteur du contrat, du modèle et de la batterie. Il ne clôt aucun constat.

## 1. Résultat

| Ensemble | Bloquant | Majeur | Mineur | Observation |
|---|---|---|---|---|
| Texte (CT-01 à CT-31) | 0 | 13 | 14 | 4 |
| Modèle (CM-01 à CM-34, C-19, C-20) | 0 | 14 (+2 de B) | 15 | 5 |
| Scénarios (tableau A de B) | — | 6 | 12 | 8 |
| Propriétés et transitions (tableau C de B) | — | 2 (+2 modèle) | 12 | 3 |

**Mutations :** 68 détectées sur 110 (63,6 % hors mutations équivalentes).

**Verdict des deux contrôleurs : gel impossible. Je partage ce verdict.**

## 2. Vérification par l'instructeur

**Scripts du contrôle A.**
- J'ai relancé les 20 scripts : tous reproduisent le résultat cité dans le rapport.
- CT-01, CT-02, CT-03, CT-04, CT-07, CT-12 et CT-13 sont des violations effectives d'invariants ou de principes du contrat. Ce ne sont pas des interprétations.

**Erreurs de l'auteur reconnues :**
- **S-95.** J'ai écrit un attendu double (« RSP est notifié ») sans le tester. Le modèle notifie l'acteur littéral `RS` (C-20, CM-32), c'est-à-dire un tiers.
- **Test de I-12.** Il est tautologique (C-2) : il passe par la fonction du modèle qu'il prétend vérifier. I-10 souffre du même défaut, à un moindre degré (C-3).
- **Générateur des propriétés.** Il n'atteint ni admission, ni rupture, ni confirmation, ni dérogation (C-1). J'ai présenté les propriétés comme couvrant ces états, ce qui est inexact.
- **Scénarios non discriminants.** Quatre réussissent sans la règle qu'ils citent (S-32, S-129, S-202, S-139 et S-141).
- **S-227.** Il exige une règle que j'ai supposée sans l'écrire : la paternité en voie (b).
- **Codes de réponse.** Environ 48 tests vérifient « échec » là où le contrat impose « introuvable ».
- **Lacunes du modèle.** Il a inventé deux règles : la voie (a) imposée en succession (CM-08), et la relance d'une présentation expirée par K (CM-09). Il oublie aussi des contrôles que le texte prévoit : `lever_examen` sans test de visibilité (C-19, CM-16), et `nommer` qui accepte un identifiant inexistant (CM-04).

**Leçon de méthode.** Un test dont l'oracle appelle le modèle ne contrôle rien. Les oracles doivent être écrits à partir du texte, ou comparer à un état jumeau, comme pour I-5.

## 3. Arbitrages demandés au porteur

Ces constats engagent le fond du modèle. Je propose des options, avec une recommandation, sans trancher.

| # | Constats | Question | Options | Recommandation |
|---|---|---|---|---|
| **G-1** | CT-04, CM (a16, a17) | À quel niveau s'appliquent A3, § 9.4, I-2 à I-4, et la règle « bénéficiaire ≠ approbateur » ? | (a) La **personne** : « soi » désigne tout compte relié à la même personne.<br>(b) Le compte, avec un résidu déclaré. | **(a).** Le § 12.7 raisonne déjà en personnes. Le seul résidu reste la fraude d'identité (§ 17.3). |
| **G-2** | CT-01, CT-13 | Comment fermer l'élévation réciproque entre ensembles différents, et la perpétuation d'un RS par auto-admission ? | (a) Le signataire ou l'auteur n'est jamais admis à sa propre habilitation, ni automatiquement ni par lui-même. **Et** un acteur n'est pas admis automatiquement s'il gère un ensemble bénéficiaire, en `notification`, d'une habilitation qui porte sur le même espace.<br>(b) Réserver `notification` aux groupes de coordination d'un programme (CDCF § 122.1).<br>(c) Restreindre I-3 et déclarer le résidu. | **(a)**, qui garde l'usage de `notification`. (b) est plus sûre mais plus restrictive. (c) est déconseillée. |
| **G-3** | CT-02, CM-02 | Le transfert reste bloquable : des restrictions d'échéance répétées changent l'empreinte à chaque fois. | (a) **Inclusion** : l'acceptation vaut si les engagements courants sont inclus dans ceux présentés. Les retraits sont notifiés à K après coup.<br>(b) Pendant la fenêtre, aucune restriction d'échéance, seulement des clôtures.<br>(c) Plafonner les renouvellements. | **(a)** : K ne s'engage jamais au-delà de ce qu'il a vu, et aucun tiers ne peut bloquer. |
| **G-4** | CT-03, CM-03 | Qui fait évoluer une sélection partagée, et jusqu'où une HI sur sélection s'étend-elle ? | (a) Reprendre RG-L05 et RG-L06 : un ajout à une sélection partagée est une **proposition**, que seul un acteur pouvant signer chaque règle qui la vise peut activer. **Et**, pour une HI, ne servir que les objets compris dans le périmètre du signataire à l'acte.<br>(b) Figer le manifeste à la création de la règle. | **(a)**, conforme au MCD. (b) contredit la nature d'une sélection. |
| **G-5** | CT-05, CM-07 | Une délégation peut-elle mêler le contenu d'un espace et d'autres cibles ? | (a) **Interdire** les périmètres mixtes.<br>(b) Décomposer en une habilitation par espace et par régime. | **(a)**, plus simple, sans perte d'usage : on crée deux délégations. |
| **G-6** | CT-07 | Une copie réutilisée blanchit les protections et les restrictions non levables. | (a) `réutiliser` exige qu'aucune restriction ni protection ne frappe l'original. La copie hérite des restrictions non levables. Un retrait de consentement ou un effacement légal sur l'original s'étend aux copies (DI-A38). Toute redistribution de la copie, HP comprises, suit DI-A41.<br>(b) Interdire `réutiliser` sur un objet protégé seulement. | **(a)** : DI-A38 l'exige déjà. |
| **G-7** | CT-12 | Un acteur sous interdiction d'action peut-il accorder cette action à un tiers ? | (a) Non : à la **création**, l'auteur doit pouvoir exécuter l'action, protections comprises. L'abstraction des protections ne vaut que pour la survie des HP existantes.<br>(b) Oui, et le résidu est déclaré. | **(a).** |
| **G-8** | CT-08 | La mise en examen d'une HI détruit définitivement les HP en aval. Est-ce voulu ? | (a) Pendant l'examen, l'aval est **inopérant mais non clos**, et la levée le rétablit.<br>(b) Destruction assumée, dite au § 7.5. | **(a)** : c'est le sens d'une suspension (F-1, « mise en examen ciblée »). |
| **G-9** | CT-10, CM-08 | Quel sort pour les objets personnels d'un défunt en succession ? | (a) **Gel** par défaut : objets inaccessibles à tous sauf par dérogation, aucun nouveau partage, aucun versement implicite. Le sort est ensuite fixé par le fondement légal ou par la désignation de garde.<br>(b) Purge, sauf obligation de conservation. | **(a).** |
| **G-10** | CT-11 | Une protection orpheline est indétectable, donc irrécupérable. | (a) Signalement **d'office** à l'autorité de dérogation, sans révéler la cible à quiconque d'autre. L'autorité peut désigner un gardien selon le § 11.2.<br>(b) La racine devient gardien de secours. Cela contredit F-1 (« ne supprime pas les protections d'un tiers légitime ») et F-4.<br>(c) Informer la racine qu'« une protection orpheline existe ». C'est une fuite de nombre. | **(a).** |
| **G-11** | CT-22 | Dérogation et réplique hors ligne ; plafond des renouvellements contourné en variant la finalité. | (a) Exclure de toute réplique les cibles atteintes par dérogation. Liste fermée de finalités. Consécutivité appréciée sur le bénéficiaire et le périmètre, quelle que soit la finalité.<br>(b) Statu quo. | **(a).** |

## 4. Corrections sans arbitrage proposées

### 4.1 Texte

| Constats | Correction |
|---|---|
| CT-06 | § 10.8 : le verrou vise **toute** habilitation (HI ou HP) et toute admission qui donnerait à C un droit sur le contenu. Exception maintenue : les HP d'un titulaire sur ses objets personnels. |
| CT-09 | Une réémission dont l'HP d'origine n'est plus active est abandonnée. Elle est un retrait d'engagement si elle est visible de K, ignorée en silence sinon. L'acceptation n'échoue jamais pour cette cause. |
| CT-14 | § 2.3 : « les **trois** dernières lignes ». |
| CT-15 | § 8.3 : le bénéficiaire nominatif peut **clore** une HP qui le vise, mais ne la restreint pas. La même restriction s'applique au § 7.4 pour les HI. Cela réduit aussi CT-02. |
| CT-16 | Une présentation expirée est close. Seul le cédant présente de nouveau. Le « renouvellement automatique » est réservé à l'empreinte modifiée, dans la fenêtre. |
| CT-17 | Le gel est défini par sa finalité, « tout acte qui ajoute un élément aux engagements ». Le versement avec reprise est cité. Les HP d'un titulaire tiers sur ses objets personnels ne sont pas gelées. |
| CT-18, CT-19, CT-20 | § 5.1 :<br>• aucune admission, manuelle ou automatique, dans un espace archivé ou clos (différée jusqu'à la réouverture) ;<br>• aucun élargissement de visibilité ;<br>• ligne propre aux objets personnels : lecture, partage, copie et purge permis ; écriture du titulaire permise. |
| CT-21 | § 13.1 : le public ne reçoit que `voir`, et `exporter` ou `réutiliser` sous licence. |
| CT-23 | § 11.6 : distinguer les restrictions internes (A3) des restrictions externes, levées par l'émetteur ou par une décision qui l'emporte. Citer l'annulation après contestation aux § 2.3 et § 5.4. |
| CT-24 | Reformuler I-4 (visibilité par défaut), I-8 (appartenance antérieure de K) et I-12 (création). |
| CT-25 | § 15 : « invisible » signifie « dont l'acteur ne connaît pas l'existence » (§ 14). Cette définition s'applique aux erreurs sur les habilitations et sur les protections. |
| CT-26 | Renvoi explicite au § 12.7 pour la succession, la désignation de gardien et les restrictions légales. Le « dossier » est l'espace et ses objets. |
| CT-27 | Une cible qui devient protégée ou sensible fait basculer les habilitations en `notification` vers l'`approbation préalable`. |
| CT-28 | Au transfert, C conserve les HP que des titulaires tiers lui ont accordées sur leurs objets personnels. Ce point est à valider : il contredit le § 10.7 actuel. |
| CT-29, CT-30, CT-31 | Préciser la désignation de garde (CM-25), la purge (cas, auteur) et le mandat de lancement d'un import. |
| S-227 | § 10.5 (b) : « la paternité de C est conservée ». A7 l'implique déjà. |

### 4.2 Modèle

- **Conformité au texte V1.4 :**
  - CM-04, CM-05 : `nommer` et `inserer_serie`, réponse `introuvable` uniforme et `voir` exigé ;
  - CM-06 : reprise au versement ;
  - CM-09 : présentation expirée ;
  - CM-10 : admetteur fondateur ;
  - CM-11 : admissions automatiques hors espace actif ;
  - CM-13 : autorité externe ;
  - CM-14 : admissions annoncées ;
  - CM-15 à CM-24 ;
  - CM-28 : un échec d'évaluation ne retire jamais un gardien ;
  - CM-30 à CM-34 ;
  - C-19 : `lever_examen` ;
  - C-20 : destinataire des notifications.
- **Le reste suit les arbitrages G-1 à G-11 :** CM-01 à CM-03, CM-07, CM-08, CM-12 et CM-29.

### 4.3 Batterie et tests

- **Scénarios non discriminants.** Réécrire S-32, S-129, S-202, S-139 et S-141 selon le tableau A du contrôle B.
- **Attendus multiples non vérifiés.** Tester les attendus de S-95, S-70, S-78 et S-116, ou les scinder.
- **Codes de réponse.** Remplacer `refuse()` par `absent()` partout où le § 14 impose « introuvable », soit environ 48 tests.
- **Totaux.** Ceux de S-11 et S-48 sont comparés à l'état jumeau sans O.
- **Nouveaux scénarios :**
  - un par acte gelé du § 10.6 ;
  - les attaques E-1 à E-21 du contrôle B ;
  - chaque script d'attaque du contrôle A, conservé comme test de non-régression.
- **Générateur :**
  - atteindre réellement les admissions (membres de G, rôles de F), les chaînes d'HP, les confirmations, les dérogations et les restrictions légales ;
  - instrumenter et publier les comptes d'états atteints.
- **Oracles indépendants du modèle :**
  - I-12 et I-10 réécrits ;
  - I-8 complété (aucune HI, nomination ni protection d'un tiers ne disparaît) ;
  - I-3 sur plusieurs ensembles ;
  - I-2 sur les sélections et les reprises ;
  - I-5 étendu aux réponses d'opérations, aux notifications, aux répliques et aux unicités.
- **Matrices d'états :** une matrice HP (T-06, T-11, T-12) et T-03.
- **Mutations.** Conserver le banc de mutations du contrôle B comme outil de recette. Objectif : toute mutation non équivalente sur une règle de sécurité est détectée.

## 5. Suite proposée

1. Décisions du porteur sur G-1 à G-11.
2. Contrat V1.5 : arbitrages et corrections du § 4.1.
3. Modèle et tests : corrections des § 4.2 et § 4.3, puis tous les tests au vert, banc de mutations compris.
4. Nouveau double contrôle en aveugle : texte et modèle, puis couverture.
5. Gel seulement si :
   - zéro constat bloquant ou majeur ;
   - aucun scénario qui exige d'inventer une règle ;
   - tous les tests au vert ;
   - aucune mutation de sécurité survivante non justifiée.

Le dernier point est un **ajout de l'instructeur** au critère du porteur, soumis à sa validation.

## 6. Décisions du porteur (11/10/2026)

**Non-gel de la V1.4 confirmé.** Les 257 tests verts face à 20 attaques reproductibles montrent que le modèle et ses oracles ne garantissent pas encore les propriétés annoncées.

Principes directeurs : absence d'auto-habilitation, protection de l'existence des données, continuité contrôlée des droits.

| ID | Décision | Précisions du porteur |
|---|---|---|
| G-1 | Validé : par personne | A3 et les règles anti-auto-habilitation s'appliquent à la personne réelle. Plusieurs comptes d'une même personne ne permettent pas de contourner les interdictions. Identité insuffisamment établie : refuser les opérations sensibles plutôt que présumer l'indépendance. |
| G-2 | Validé avec renforcement | Le signataire ne bénéficie d'aucune admission qui lui confère des droits nouveaux. Les gestionnaires d'ensembles sont exclus de l'admission automatique lorsque leur pouvoir de gestion pourrait leur permettre de s'habiliter indirectement. Même règle pour les chaînes croisées et les délégations réciproques. |
| G-3 | Validé sous condition | L'acceptation vaut si les engagements effectifs sont couverts par ceux présentés, comparés sur leur portée réelle : bénéficiaires, droits, objets, durées, protections. Aucun engagement nouveau ou élargi ne passe inaperçu. |
| G-4 | Validé | Un ajout à une sélection partagée est une proposition sans effet tant qu'un acteur habilité ne l'a pas activé. Le retrait est régi explicitement, sans résurrection lors d'un ajout ultérieur. |
| G-5 | Validé | Pas de délégation mêlant le contenu d'un espace et des cibles d'autres espaces ou autorités : délégations distinctes. |
| G-6 | Validé avec renforcement | La copie hérite des protections opposables de l'original (restrictions légales, consentements, protections d'existence applicables) et conserve une filiation vérifiable. Jamais un moyen de blanchir des droits. |
| G-7 | Validé | Une interdiction effective sur une action empêche de la déléguer. |
| G-8 | Validé sous condition | La mise en examen rend l'aval inopérant sans le détruire. À la levée, les droits ne redeviennent effectifs que si tous leurs fondements sont encore valides et qu'aucune clôture, révocation ou expiration définitive n'est intervenue. |
| G-9 | Validé | Objets privés d'un défunt gelés par défaut ; ni publication ni transfert automatique de lecture ; succession par procédure distincte, documentée. |
| G-10 | Validé avec conditions | Signalement à l'autorité de dérogation, sans accès automatique ni pouvoir de lever ; désignation contrôlée d'un gardien si nécessaire. |
| G-11 | Validé | Aucune dérogation répliquée hors ligne. Liste fermée, versionnée et contrôlée de finalités ; un texte libre complète la justification sans créer de catégorie. |

**Règles transversales à inscrire :**
1. Les contrôles portent sur les **effets**, pas seulement sur les opérations : une suite d'actes individuellement valides ne produit pas d'augmentation de droits interdite (G-2, G-4, G-7).
2. Une **suspension n'est pas une extinction** : distinguer droits inopérants, expirés et clos ; G-8 ne ressuscite rien.
3. Une **protection héritée reste traçable** : la copie garde le lien d'origine ; la levée d'une protection sur l'original ne s'étend pas automatiquement aux copies, selon le fondement et la portée de chaque protection.

**Critère de gel renforcé :** le contrat ne peut être gelé que si aucun constat bloquant ou majeur ne subsiste, si les scénarios de sécurité disposent d'oracles indépendants du modèle testé, si les invariants sont vérifiés sur les transitions pertinentes, et si aucune mutation survivante affectant une règle de sécurité ne demeure sans justification documentée et acceptée. Une justification recevable reste à définir pour éviter qu'une mutation dangereuse soit simplement classée comme acceptable.

**Exigences V1.5 :** les 20 attaques du contrôle A deviennent des tests de non-régression indépendants ; les états non atteints par les tests de propriétés sont effectivement générés et vérifiés ; le nombre de tests verts n'est pas une preuve : taux de détection des mutations, qualité des oracles et couverture des transitions critiques s'examinent ensemble.

**Réserve du porteur :** arbitrages rendus sur le compte rendu de l'instructeur, sans examen du texte intégral de la V1.4 ni des rapports.

## 7. Réalisation V1.5 (12/10/2026)

Rédigé par l'auteur. Aucun constat n'est clos : le prochain double contrôle en aveugle dira s'ils sont levés.

### 7.1 Livrables

| Livrable | Emplacement |
|---|---|
| Contrat V1.5 (réécriture complète ; V1.4 archivée) | `docs/GENIIUS_CONTRAT_AUTORISATION_V1.md` ; `historique/GENIIUS_CONTRAT_AUTORISATION_V1_4.md` |
| Modèle V1.5 (réécriture complète) | `spec/autorisation/modele.py` |
| Batterie V1.5 : 291 scénarios, 39 attaques de non-régression | `GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_5.md` (générée) |
| Tests de propriétés (I-1 à I-14), transitions et combinaisons, sondes d'équivalence | `spec/autorisation/tests/` |
| Banc de mutations : 160 mutations, 156 détectées | `spec/autorisation/mutations/` (`RESULTATS.md`, `JUSTIFICATIONS.md`) |

### 7.2 Traitement des constats

| Constats | Traitement | Où |
|---|---|---|
| CT-01, CM-01 (élévation croisée), CT-13 (perpétuation d'un RS) | G-2 : signataire jamais admis ; exclusion des gestionnaires de tout ensemble en `notification` sur le même espace ; I-3 reformulé | A3 ; § 9.4 ; I-3 ; a01, a13 |
| CT-02, CM-02 (blocage du transfert) | G-3 : acceptation par inclusion ; le bénéficiaire ne restreint plus | § 10.6 ; § 7.4 ; § 8.3 ; a02 ; S-174 |
| CT-03, CM-03 (sélections) | G-4 : proposition, activation contrôlée, périmètre du signataire | § 13.3 ; A1 ; a03 ; S-263, S-264, S-286 |
| CT-04 (comptes) | G-1 : « soi » = personne ; identité établie exigée pour les opérations sensibles | § 1 ; A3 ; § 12.7 ; a16, a17-5, a17-6 ; S-232 à S-235 |
| CT-05, CM-07 (périmètres mixtes) | G-5 : régime unique | § 1 ; § 8.1 ; a07 |
| CT-06, CM-27 (verrou) | Verrou étendu à toute habilitation | § 10.8 |
| CT-07 (copies) | G-6 : héritage des protections, non-levables dynamiques, levées indépendantes, redistribution contrôlée | § 13.11 ; a15 ; S-261, S-262, S-287 |
| CT-08 (mise en examen) | G-8 : aval inopérant, non détruit ; rupture évaluée suspensions levées | § 7.5 ; § 8.2 ; a10 ; S-278 |
| CT-09, CM-12 (réémission invalide) | Abandon de la réémission | § 10.5 ; a18-1 ; S-87 |
| CT-10, CM-08 (succession) | G-9 : constat de décès, gel, décision de succession, voie (g) | § 2.4 ; § 10.4 ; a08 ; S-265 à S-272 |
| CT-11 (orphelines) | G-10 : signalement d'office à l'autorité | § 11.2 ; a20-1 |
| CT-12 (prête-nom sous interdiction) | G-7 : exécution effective exigée pour déléguer, confirmer, prolonger, admettre | § 2.5 ; § 8.1 ; a14 ; S-285 |
| CT-14 à CT-31, CM-04 à CM-34 | Corrections locales (§ 4.1 et § 4.2 de cette instruction) | Voir le contrat et `test_attaques.py` |
| CT-28 | **Non traité : à arbitrer** (perte, au transfert, des HP de titulaires tiers accordées à C) | § 10.7 ; § 17.2 |
| Batterie (contrôle B, tableau A) | Scénarios rendus discriminants (S-11, S-32, S-43, S-48, S-129, S-139, S-141, S-202) ; attendus vérifiés (S-70, S-78, S-95, S-116) ; 38 tests passés à « introuvable » ; S-227 fondé (§ 10.5 b) | Batterie V1.5, tableau des modifications |
| Propriétés (contrôle B, tableau C) | Générateur à structures de départ ; comptage publié et exigé ; oracles par opérations publiques ou par état jumeau (I-1, I-4, I-6, I-8, I-9, I-10, I-12) ; I-3 sur plusieurs ensembles ; I-5 étendu aux réponses d'opérations, notifications et répliques | `test_proprietes.py` ; `couverture_etats.json` |
| Transitions (C-14 à C-17) | Matrice HI avec T-03 ; matrice HP ; table de l'archivage ; gel par acte ; dérogation × 8 cibles | `test_transitions.py` |
| C-19, C-20 | `lever_examen` sur cible inconnue : introuvable ; notifications aux seuls RS de l'espace | a17-3 ; S-95 |

### 7.3 Défauts trouvés par l'auteur pendant la réalisation

- **Purge refusée après un retrait de consentement :** contraire au § 6.3, corrigé.
- **Content restriction traitée comme protection d'existence :** corrigé en V1.4 tardive, confirmé.
- **Connaissance d'une habilitation par son auteur malgré une cible cachée :** retirée (§ 7.4).
- **Restriction légale échue maintenue dans les engagements :** corrigé (S-280, trouvé par la mutation M037).
- **Banc de mutations du premier passage invalide :** le test de comptage échouait à faible volume, même sans mutation. Le banc exige désormais un passage de référence vert.

### 7.4 Points soumis au porteur

1. **Ajouts de l'auteur non arbitrés** (contrat, § 17.2), dont cinq nouveaux en V1.5 :
   - constat de décès à deux approbateurs ;
   - gel étendu à tous les espaces ;
   - forme retenue pour G-2 ;
   - écriture du titulaire en espace archivé ;
   - mandat d'import.
2. **CT-28.**
3. **Les 4 justifications de mutations survivantes** (`JUSTIFICATIONS.md`), toutes proposées comme équivalences sondées.
4. **Conséquence de G-7 à signaler :** un RS frappé par une protection sur **un seul** objet ne peut plus déléguer le contenu entier de l'espace (il doit déléguer objet par objet ou par lot). C'est la lettre du § 7.2 ; la sévérité est à confirmer.

### 7.5 État au regard du critère de gel

- Tests : verts au volume par défaut ; passage renforcé en cours.
- Mutations : 156 sur 160 détectées ; 4 survivantes justifiées, en attente de décision.
- Constats : aucun n'est clos par l'auteur. **Nouveau double contrôle en aveugle requis.**
