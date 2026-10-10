# GENIIUS — Instruction du contre-audit du MLD V1.1-d

**Date :** 10 octobre 2026
**Rapport instruit :** [CONTRE_AUDIT_MLD_V1_1_D.md](CONTRE_AUDIT_MLD_V1_1_D.md), produit par un nouvel agent séparé.
**Instructeur :** l'auteur du MLD, qui ne clôt aucun constat.

## 1. Résultat

| Batterie | Levés | Partiellement levés | Non levés |
|---|---|---|---|
| Constats ciblés (7 bloquants, AC-10, 11, 23, 28) | 2 (AC-06, AC-23) | 9 | 0 |
| Autres constats (non-régression) | 15 | 6 (AC-09, 12, 13, 22, 25, 30) | 0 |
| **Nouveaux constats** | — | — | **15 (NC-01 à NC-15), dont 2 bloquants** |

**Échantillon du § 25.4 :** sur 78 lignes, 58 sont conformes. Huit lignes marquées « réalisée et vérifiée » sont partielles ou contredites, et deux lignes « corrigées » ne sont pas réalisées (DI-A37, DI-K11).

## 2. Position de l'instructeur

**J'accepte le verdict.** J'ai revérifié les deux nouveaux bloquants dans le MLD : ils sont exacts, et je les ai introduits moi-même en corrigeant AC-01.
- **NC-01 :** le CK d'auto-habilitation de `regle_acces` exempte `nature = propriétaire`, et rien ne réserve cette nature à la création d'un objet. N'importe qui peut donc se créer une règle « propriétaire ».
- **NC-02 :** CP-48 fait de `administrer` la condition suffisante pour créer une règle de lecture, alors que l'administrateur ne détient pas lui-même `voir`. La borne « on ne donne pas plus que ce que l'on détient » (DI-B35) n'a été appliquée qu'aux sélections.

**Deux erreurs de ma part, à reconnaître :**
1. **AC-28 et CP-13.** J'ai classé « réalisée et vérifiée » une trentaine de règles réalisées seulement par leur présence dans la **liste** de CP-13, sans énoncé. Je l'ai fait en connaissance de cause, en estimant qu'une contrainte procédurale nommée suffisait. Ce n'est pas vérifiable : le statut était encore trop généreux. J'ai aussi déclaré DI-A37 et DI-K11 corrigées sans modifier la contrainte correspondante.
2. **Corrections par superposition.** Pour AC-10, j'ai ajouté des compléments sans retirer les anciens textes contradictoires (CP-33, MLD-16, CP-36).

**Diagnostic de fond.** Le problème principal n'est plus une liste de défauts ponctuels. **Le contrôle d'accès est spécifié par accumulation** : rôles, matrice par défaut, règles nominatives, nature « propriétaire », groupes, admissions, sélections, délégations, embargos, transferts, habilitations exceptionnelles, chacun corrigé par une contrainte rédigée en prose. Chaque correction ouvre une interaction que la précédente n'avait pas prévue (NC-01 à NC-05). Deux tours d'audit le démontrent, et un troisième tour de corrections locales a peu de chances de converger.

## 3. Instruction des nouveaux constats

| ID | Position | Gravité proposée | Orientation |
|---|---|---|---|
| NC-01 | Confirmé (vérifié) | Bloquant | Une règle `propriétaire` n'est créée que par le système, dans la transaction de création de l'objet ; jamais par un acteur. Ajouter la valeur au dictionnaire. |
| NC-02 | Confirmé (vérifié) | Bloquant | Généraliser à toute règle « nul ne donne ce qu'il n'a pas » ; dissocier l'autorité de gestion (`administrer`) de l'autorité de partage du contenu. Relève du modèle d'autorisation (§ 4). |
| NC-03 | Confirmé | Majeur | Le transfert clôt les règles du cédant sans les transférer ; seule la gouvernance passe au cessionnaire. Les règles accordées par des tiers restent attachées à leur auteur. |
| NC-04 | Confirmé | Majeur | Une admission ou une prolongation est un acte distinct de la règle : elle ne crée pas de nouvelle règle. Relève du § 4. |
| NC-05 | Confirmé | Majeur | Fixer l'autorité sur les embargos (création, bénéficiaires, levée) et une voie exceptionnelle qui franchit l'étape 1, journalisée. |
| NC-06 | Confirmé | Majeur | Lier visibilité et portée d'une base ; trancher la contradiction entre CP-12 et CP-49 ; restaurer l'unicité par portée. |
| NC-07 | Confirmé (confiance moyenne de l'auditeur) | Majeur | L'état `révoquée` ou `close` prime sur `version_active` ; une réduction pendant une proposition en attente s'applique à la version active, pas à la proposition. |
| NC-08 à NC-13, NC-15 | Confirmés | Mineurs | Corrections locales. NC-13 : réintroduire l'effacement des données techniques du compte supprimé, sans suppression de la ligne. |
| NC-14 | Observation | Observation | La règle des deux personnes ne protège pas contre la complaisance ; c'est une limite de gouvernance à documenter, pas à modéliser. |

Les constats partiellement levés (AC-01 à AC-05, AC-07, AC-10, AC-11, AC-28 ; AC-09, 12, 13, 22, 25, 30) sont confirmés selon les motifs du rapport.

## 4. Proposition de méthode (décision du porteur)

**Proposition A — recommandée : refondre le contrôle d'accès en un modèle d'autorisation unique, avant toute nouvelle correction locale.**

1. **Rédiger un modèle d'autorisation normatif**, court, dans un seul chapitre, sous forme d'axiomes dont toutes les contraintes d'accès découlent :
   - **A1 — Nul ne donne ce qu'il n'a pas.** Toute attribution d'un droit sur un contenu (règle, appartenance scientifique, membre d'un groupe bénéficiaire, admission, délégation, sélection) exige que l'attributeur détienne lui-même ce droit, et le droit attribué cesse s'il le perd.
   - **A2 — Gérer n'est pas lire.** `administrer` gère la gouvernance (membres administratifs, cycle de vie, métadonnées) ; il ne permet jamais d'attribuer un droit sur un contenu.
   - **A3 — Pas d'auto-attribution**, sans exception d'acteur ; seule la création d'un objet ou d'un espace attribue des droits initiaux, par le système.
   - **A4 — Les actes de gestion ne recréent pas les droits** (admission, prolongation, transfert de gouvernance).
   - **A5 — Les protections priment** (existence protégée, embargo, DI-E05), y compris sur l'administration ; une seule voie de dérogation, l'habilitation exceptionnelle, nominative et journalisée.
   - **A6 — Révocation, caches et hors ligne** : CP-40 et CP-28.
2. **Constituer une batterie de scénarios d'attaque exécutables sur papier** : les scénarios des deux audits (AC et NC), plus les cas légitimes, pour que les corrections ne rendent pas le partage impossible. Pour chaque scénario, le résultat attendu est fixé **avant** la réécriture.
3. **Réécrire CP-23 à CP-26, CP-29, CP-30, CP-37, CP-46 et CP-48** comme conséquences des axiomes, en retirant les textes remplacés, et non en les complétant.
4. **Contre-audit** par un nouvel agent séparé, avec les axiomes et la batterie de scénarios comme référentiel.

Les axiomes A1 et A2 modifient des arbitrages déjà rendus :
- **D1** : qui attribue une appartenance scientifique ? Avec A1, ce serait un détenteur de la lecture scientifique, pas l'administrateur.
- **D8** : portée exacte d'`administrer`.

Ils exigent donc une décision du porteur, et un passage par le dictionnaire (DD-28 serait remplacée).

**Proposition B — poursuivre les corrections locales** constat par constat. C'est plus rapide à court terme, mais le risque de non-convergence est démontré par deux tours.

**Pour la traçabilité (AC-28),** je propose aussi :
- un statut supplémentaire, « **obligation procédurale non énoncée** », pour les règles réalisées seulement par leur mention dans la liste de CP-13 ;
- soit l'énoncé explicite de chacune de ces règles dans une CP, soit leur maintien sous ce statut, avec un test exigé au MPD.

**Hors contrôle d'accès,** les autres corrections (AC-09, 22, 25, 30 ; NC-06 à NC-13, NC-15 ; DI-A37 et DI-K11 réellement corrigées ; textes contradictoires retirés) peuvent avancer en parallèle de la proposition A.

## 5. Décisions du porteur (10/10/2026)

*Le porteur précise que les fichiers du contre-audit ne lui étaient pas accessibles : ses décisions reposent sur l'instruction ci-dessus et sur les principes déjà arrêtés, sans vérification individuelle des 15 nouveaux constats.*

- **Proposition A approuvée :** refonte du contrôle d'accès par un contrat d'autorisation unique ; scénarios de recette fixés avant la réécriture ; contraintes contradictoires remplacées, et non empilées.
- **A1 à A6 validés**, avec des précisions :
  - A1 : l'habilitant détient le droit **et** le pouvoir de le déléguer ;
  - A5 : aucun droit générique de contournement ; une dérogation prédéfinie, justifiée, limitée et auditée ; certaines protections légales ne sont pas levables par décision interne.
- **D1 remplacé :** une appartenance scientifique ne peut être accordée que par un acteur disposant d'une autorité de délégation valide sur le périmètre, fondée sur des droits légitimement acquis et délégables. Le rôle administratif seul n'est pas un fondement : l'administrateur peut inviter, préparer ou instruire, pas conférer. L'attribution initiale à la création reste possible, sans être réutilisable.
- **D8 remplacé :** `administrer` autorise les opérations de gouvernance prévues et la lecture des seules métadonnées nécessaires. Il ne donne aucun droit implicite sur les contenus, versions, preuves, relations protégées ou représentations dérivées. Créer ou modifier une règle d'accès exige une vérification distincte de l'autorité de délégation.
- **DD-28 remplacée.** La nouvelle rédaction distingue le droit d'effectuer, le droit de déléguer, le périmètre, la durée et les conditions, et les protections opposables. Une délégation n'augmente jamais les prérogatives de sa chaîne. Un droit cesse si ses fondements disparaissent, sauf fondement indépendant. Le transfert de gouvernance est une procédure explicite, jamais une règle « propriétaire » librement créable.
- **Traçabilité :** statut « obligation procédurale non énoncée » adopté. Grille : réalisée et vérifiée, partiellement réalisée, obligation procédurale non énoncée, absente, non applicable. Les 207 lignes doivent renvoyer à un énoncé normatif précis. Un renvoi au MPD n'est acceptable que si le MLD formule le résultat obligatoire. Une règle critique d'autorisation ne peut pas rester une simple mention dans CP-13.
- **Corrections parallèles autorisées, sous contrôle de périmètre :** aucune ne doit définir, modifier ou présupposer une sémantique des droits ; elles restent candidates.
- **Ordre retenu :**
  1. Contrat.
  2. Scénarios figés.
  3. Dictionnaire (DD-28).
  4. Réécriture des sections d'accès du MLD.
  5. Requalification des 207 lignes.
  6. Audit indépendant du contrat et des scénarios, avec recherche de tout chemin d'auto-habilitation.

## 6. État au 10/10/2026, après décision

| Étape | État |
|---|---|
| 1. Contrat d'autorisation | **Rédigé** : [GENIIUS_CONTRAT_AUTORISATION_V1.md](../GENIIUS_CONTRAT_AUTORISATION_V1.md), candidat ; questions Q1 à Q4 |
| 2. Scénarios | **Rédigés, à figer** : [GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1.md](GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1.md) — 66 scénarios |
| 3 à 6 | Non commencées : elles attendent le gel du contrat et des scénarios |
| Corrections parallèles | Appliquées en V1.1-e, candidates. **Basculés dans la refonte**, parce qu'ils touchent à l'autorisation : AC-09 (S-65), AC-30 (S-66), NC-06 (S-64), NC-07 (S-52, S-53), NC-08 (S-36), NC-12 (S-62), ainsi que les éléments de NC-11 liés aux droits. |
