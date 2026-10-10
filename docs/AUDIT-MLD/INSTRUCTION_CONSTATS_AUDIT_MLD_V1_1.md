# GENIIUS — Instruction des constats de l'audit contradictoire du MLD V1.1

**Date :** 10 octobre 2026
**Rapport instruit :** [AUDIT_CONTRADICTOIRE_MLD_V1_1.md](AUDIT_CONTRADICTOIRE_MLD_V1_1.md) — 32 constats (7 bloquants, 20 majeurs, 3 mineurs, 2 observations), produits par un agent séparé, en aveugle partiel.
**Instructeur :** l'auteur du MLD V1.1. Conformément à la règle fixée par le porteur, **l'instructeur ne clôt aucun constat**. Il donne :
- sa position ;
- la gravité qu'il propose ;
- le ou les documents à corriger ;
- la correction proposée ;
- les points qui exigent un arbitrage.

La décision appartient au porteur.

## 1. Position générale

**L'audit atteint son objectif.**
- Il a construit de vrais contre-exemples, dont plusieurs sur des contraintes que j'ai rédigées le jour même (CP-23 étendue, CP-33, CP-37, CP-46, § 25.4).
- J'ai revérifié dans le MLD les constats AC-05 (UQ de `base_justificative`, ligne 550), AC-20 (CP-07 ne contient pas DI-A30), AC-22 (prédicat de cote sur colonne purgeable), AC-23 (texte de CP-22) et AC-24 (`consentement.texte_version NN`). Ils sont exacts.

**Erreur de ma part, à corriger.** Le § 25.4 du MLD affirme qu'« aucune règle n'est sans réalisation ». C'est **faux**. Sur 64 lignes échantillonnées, l'audit en trouve une vingtaine absentes ou partielles. La ligne marquée « citée » avait été établie mécaniquement, ce que le § 25.4 signale, mais la phrase de synthèse dépassait ce que le contrôle prouvait. Elle sera requalifiée, avec un statut « partielle » par ligne concernée.

**Aucun constat n'est contesté sur le fond.** Trois sont nuancés (AC-13, AC-16, AC-32) : la correction proposée par l'auditeur va au-delà de l'exigence ou suppose un choix qui revient au porteur.

**Effet sur la séquence.**
- **Le gel du MLD est exclu en l'état** : 7 bloquants confirmés.
- **Le dictionnaire V1.3 n'est pas prêt à être validé.** Onze constats exigent aussi une modification du dictionnaire (§ 3), dont deux défauts que le MLD reproduisait fidèlement (AC-17 sur DI-C13 V1.3, AC-29).

## 2. Instruction constat par constat

Légende des documents : **MLD** ; **DICT** = dictionnaire V1.3 (procédure DC-DICT-02 encore ouverte) ; **ARB** = arbitrage du porteur requis (§ 4).

### 2.1 Bloquants (7)

| ID | Position | Gravité proposée | Documents | Correction proposée par l'instructeur |
|---|---|---|---|---|
| AC-01 Création de règles et d'appartenances non contrôlée | **Confirmé.** Les voies A (s'ajouter `lecteur`), B (règle nominative ordinaire sur soi) et C (programme créant une règle sur un sous-projet) passent les CK et CP actuels. | Bloquant | MLD, DICT, ARB D1 | Nouvelle CP « autorité sur les droits » : seul un acteur qui a `administrer` sur la cible crée, élargit ou prolonge une règle, une appartenance, un membre de groupe ou une admission ; la règle vit dans l'espace de sa cible ; aucun acteur ne s'accorde à lui-même une habilitation scientifique ni `voir`/`éditer`, hors création de l'espace. Matrice normative « rôle → actions par défaut » pour l'étape 4 du § 22.2 (le corollaire de l'audit est juste : sans elle, personne ne détient `administrer`). |
| AC-02 Le cédant garde ses droits après un transfert | **Confirmé.** CP-37 ne clôt que les appartenances `propriétaire` et laisse l'appartenance scientifique et les règles CP-23. | Bloquant | MLD | Réécrire CP-37 : l'acceptation clôt **toutes** les appartenances et attributions du cédant sur l'espace, et toutes les règles dont il est bénéficiaire nominatif sur des objets de l'espace ; elle incrémente l'époque. Seuls `credit` et `activite` restent (DD-26.4). |
| AC-03 Le repli de CP-23 donne des droits de lecture au propriétaire | **Confirmé.** Défaut introduit par ma correction d'ECD-14. | Bloquant | MLD, DICT (DI-A39), ARB D9 | Distinguer l'**auteur imputé** (traçabilité, DI-A39) du **titulaire des droits** (CP-23). Le repli ne crée aucune règle de lecture. Titulaire = déposant des entrées de la tâche, sinon aucun : accès par habilitation exceptionnelle seulement. Une règle CP-23 ne bénéficie jamais à un acteur qui n'a qu'une habilitation administrative. |
| AC-04 Embargo « existence même » irréalisable | **Confirmé.** CP-46, que j'ai rédigée, suppose des « bénéficiaires » que ni le dictionnaire ni le MLD ne modélisent, et une interdiction universelle masquerait l'objet à ses propres ayants droit. | Bloquant | MLD, DICT (EMBARGO, DI-B21) | Ajouter les bénéficiaires d'un embargo (`embargo_beneficiaire`, acteur ou groupe). À l'étape 1 du § 22.2, une protection d'existence issue d'un embargo s'applique à tous **sauf** à ses bénéficiaires et à ceux qui ont `administrer` sur l'embargo. Plutôt qu'une interdiction universelle avec exception générique, une portée d'exception propre à l'embargo. |
| AC-05 Unicités qui ignorent la visibilité | **Confirmé** pour `base_justificative`. Probable pour `reference_inter_espace`, `selection_contexte` et `position_epistemique`. | Bloquant | MLD, DICT (portée d'une base en vigueur) | Unicités par contexte : espace (et auteur pour une base `privée`). Règle générale au § 3 : une unicité ne porte que sur des lignes de visibilité uniforme pour tous ceux qui peuvent tenter l'insertion concurrente. |
| AC-06 Modes `masqué` et `pseudonymisé` non appliqués | **Confirmé.** Le sens de « masqué » n'est défini nulle part, ce qui est un défaut du dictionnaire. | Bloquant | MLD, DICT, ARB D7 | Définir les modes au dictionnaire. `masqué` et `pseudonymisé` exigent un `masquage` référencé dans la ligne d'inclusion (`masquage_id`). L'étape 3 sert l'objet selon son mode. Une évaluation de diffusabilité favorable est exigée pour tout objet couvert par DI-E05. |
| AC-07 Relations frontières limitées au profil `relation` | **Confirmé.** CP-33 traduit DI-L16 trop étroitement. | Bloquant | MLD | Généraliser : toute assertion, quel que soit son profil, n'est incluse que si son sujet **et** sa cible éventuelle sont inclus. Une source qui mentionne une personne exclue est incluse en `provenance masquée` ou après évaluation de diffusabilité. |

### 2.2 Majeurs (20)

| ID | Position | Gravité proposée | Documents | Correction proposée |
|---|---|---|---|---|
| AC-08 Oracle d'existence par clé étrangère à l'écriture | Confirmé | Majeur | MLD | CP « écriture référentielle » : toute référence fournie par l'appelant est validée par `acces(…, voir)` **avant** l'évaluation des FK, avec la même erreur et le même délai pour absent ou inaccessible. Pour `contribution_differee` : réception sans révéler l'existence. |
| AC-09 Numéro inséré dans la série d'un autre espace | Confirmé | Majeur | MLD | CP-35 : même espace que la série, ou acceptation par un acteur qui a `administrer` sur la série ; unicité de rang limitée aux numéros acceptés. |
| AC-10 Version en vigueur ≠ version courante | Confirmé. Défaut de conception de MLD-16 et CP-36. | Majeur, **à traiter avant gel** | MLD, DICT | `selection_partage.version_active` et `prise_en_charge.version_en_vigueur` (FK vers `version_objet`), seules sources de CP-29 et CP-39. État `refusée` pour une proposition. Aligner CP-33 sur MLD-16. |
| AC-11 Auteur d'une règle non modélisé | Confirmé | Majeur, **à traiter avant gel** (CP-29 et CP-40 en dépendent) | MLD, DICT (REGLE_ACCES) | `regle_acces.auteur_acteur_id` (NN, figé) ; une modification par un autre acteur crée une nouvelle règle. |
| AC-12 Empreinte des engagements incomplète | Confirmé | Majeur | MLD | Inclure groupes bénéficiaires (versions), appartenances actives et admissions dans `transfert_engagement`. |
| AC-13 Réplique hors ligne sans échéance | **Confirmé, nuancé.** CP-40 promet trop (« aucune fenêtre ») : la fenêtre hors ligne est un résidu accepté (CP-28, TECH-011.6). En revanche, l'absence de propagation d'un changement de politique de réplication est un vrai défaut. | Majeur | MLD, ARB D2 | Limiter CP-40 aux décisions évaluées côté serveur et renvoyer explicitement à CP-28 pour le hors ligne. Ajouter le changement de politique de réplication aux retraits (CP-28) et aux événements d'époque (CP-40). Durée maximale par défaut pour les espaces collectifs : **ARB D2**. |
| AC-14 Contribution refusée lisible avec le contenu retiré | Confirmé | Majeur | MLD | La `charge` d'une contribution différée ne contient que le delta saisi et les identifiants de base, jamais l'état de base. |
| AC-15 Diffusions visibles des administrateurs ; invalidation « humaine » | Confirmé | Majeur | MLD, ARB D8 | (a) Lecture des diffusions : soit `administrer` inclut les métadonnées de gouvernance (**ARB D8**), soit les seuls participants nommés du circuit. (b) Invalidation : colonne `origine` {humaine, automatique} ; la règle « acteur humain » ne vaut que pour `relue`, `approuvée` et `refusée`. |
| AC-16 Partage transitif par réutilisation | **Confirmé, nuancé.** Les copies réutilisées sont des objets autonomes (CDCF § 126.2 : « reprendre dans leurs propres arbres »). Exiger un `repartager` de l'espace d'origine pour tout repartage irait au-delà du CDCF. Le contrôle de licence manque, en revanche. | Majeur | MLD, ARB D3 | Recommandation : toute inclusion d'une copie réutilisée dans une sélection, une publication, une diffusion ou un export respecte `licence.redistribution` et `modification`. **ARB D3** sur l'exigence supplémentaire. |
| AC-17 Déduplication dans un espace entre deux membres | Confirmé. **Défaut du dictionnaire V1.3** (DI-C13), que j'ai réécrit. | Majeur | DICT, MLD | Un `fichier` logique par dépôt ; mutualisation seulement physique (`cle_stockage`) ; non-observabilité étendue à l'intérieur d'un espace ; purge par référence. |
| AC-18 Exclusions d'export nominatives pour l'existence protégée | Confirmé | Majeur | MLD | Ne jamais écrire d'exclusion nominative de motif `existence protégée` ; tenir un compteur interne non nominatif, côté espace porteur. |
| AC-19 Période historique aplatie dans `assertion.temps` | Confirmé : le dictionnaire prévoit `DATE_HIST` **ou** `PERIODE_HIST` | Majeur | MLD | Second groupe `⟨dh temps_fin⟩` et discriminant `temps_forme`. |
| AC-20 DI-A30 sans réalisation | Confirmé (vérifié) | Majeur | MLD | `dependance.amont_type` avec FK composite. CK : `justification` ⇒ amont ∉ {acquisitions, badge, narration, lien exploratoire}. |
| AC-21 Quinze cardinalités minimales non contrôlées | Confirmé | Majeur | MLD | Compléter CP-05 ; préciser le minimum au premier jalon pour les conteneurs. |
| AC-22 Unicités qui comptent les lignes purgées | Confirmé (vérifié) | Majeur | MLD | `AND NOT est_purge` sur toute unicité de table d'objet ; aucun prédicat d'unicité sur une colonne purgeable. |
| AC-23 CP-22 réécrit une version existante | Confirmé (vérifié). Défaut de rédaction ancien (V1.0). | Majeur, **à traiter avant gel** (empreintes et transferts en dépendent) | MLD | Toute insertion ou clôture `[A:p]` crée une nouvelle version du propriétaire ; CP-01 étendue aux tables `[A:p]`. |
| AC-24 Colonnes de contenu `NN` non purgeables | Confirmé (vérifié) | Majeur | MLD, ARB D4 | Toutes les colonnes de contenu en `NN*`. Liste explicite des codes de gouvernance conservés après purge. Sort de `regime_protection`, `mineur_protege` et des codes de consentement : **ARB D4**. |
| AC-25 Effacement de résolution irréalisable | Confirmé. Défaut de ma correction d'ECD-10. | Majeur | MLD, DICT (DD-02, DD-27), ARB D5 | Colonnes de `version_objet` nullables sous `resolution_effacee` ; neutralisation des `activite` propres à l'objet. Identifiant : **ARB D5** (UUID v4 opaque, ou horodatage de l'UUID v7 documenté comme donnée conservée). |
| AC-26 Purge du compte irréalisable ; pseudonyme réattribuable | Confirmé | Majeur | MLD, DICT (COMPTE, DI-B08) | `email` nullable pour un compte supprimé ; FK des objets personnels vers l'acteur ou l'espace personnel ; registre `pseudonyme_reserve` (empreinte non réversible). |
| AC-27 Attributs figés non protégés | Confirmé | Majeur | MLD | CP « attributs figés », générée depuis les marques F du dictionnaire ; seuls la purge et l'effacement de résolution y dérogent. |

### 2.3 Mineurs et observations (5)

| ID | Position | Gravité proposée | Documents | Correction proposée |
|---|---|---|---|---|
| AC-28 Neuf lignes « citées » seulement partielles | Confirmé ; il rejoint mon erreur de synthèse du § 25.4 | **Majeur** (proposé à la hausse : il invalide la preuve d'ECD-13) | MLD | CP ou CK pour DI-A10, A12, A37, B09, B18, C15, K11, K12, K18 ; requalifier les lignes en « partielle » ; **rejouer un contrôle de réalisation sur les 207 lignes « citées »**, et pas seulement sur l'échantillon. |
| AC-29 `DECIDER_RATTACHEMENT` (0,2) | Confirmé. **Défaut du dictionnaire.** | Mineur | DICT | Cardinalité (0,n). |
| AC-30 `acces()` sans lecture aveugle ni campagnes | Confirmé | Mineur | MLD | Étape 1 bis « cloisonnements temporaires » ; participation de campagne côté acteur. |
| AC-31 Amorçage du Core incompatible avec CP-23 | Confirmé | Observation → **Mineur** | MLD | Acteur institutionnel d'amorçage ; visibilité explicite des concepts du Core ; aucune règle CP-23. |
| AC-32 Remontée d'indicateurs sans action dédiée | **Nuancé.** La publication d'un résultat figé (DI-O17) réalise déjà « faire remonter les indicateurs qu'il autorise », sans ouvrir le contenu. | Observation | MLD (rédaction), ARB D6 | Documenter la voie « résultat publié » comme réalisation de CDCF § 120.2 ; action `agréger` seulement si le porteur la juge nécessaire (**ARB D6**). |

## 3. Constats qui modifient aussi le dictionnaire V1.3

AC-01, AC-03, AC-04, AC-05, AC-06, AC-10, AC-11, AC-17, AC-25, AC-26, AC-29.

**Le dictionnaire V1.3 ne peut donc pas être validé dans son état actuel.** Ces corrections s'ajoutent à la procédure DC-DICT-02, encore ouverte.

## 4. Arbitrages demandés au porteur

| # | Constat | Question | Recommandation de l'instructeur |
|---|---|---|---|
| D1 | AC-01 | Qui peut accorder une appartenance scientifique ? | Un acteur ayant déjà une habilitation scientifique `responsable scientifique` sur l'espace, ou le propriétaire pour un tiers, mais **jamais à lui-même**, hors création de l'espace. Dans un espace à une seule personne, le créateur garde les deux habilitations reçues à la création. |
| D2 | AC-13 | Durée maximale de consultation hors ligne par défaut pour les espaces collectifs ? | `limitée` par défaut pour `projet`, `organisation` et `communauté`, avec une durée fixée au MPD ; `autorisée` reste le défaut pour les espaces personnels, privés et familiaux. La fenêtre résiduelle est documentée (TECH-011.6). |
| D3 | AC-16 | Le repartage d'une copie réutilisée exige-t-il, en plus de la licence, un accord de l'espace d'origine ? | **Non** : contrôle par la licence seulement (CDCF § 126.2 : copies autonomes, avec provenance et crédits). |
| D4 | AC-24 | Que conserve une tombstone de `regime_protection`, `mineur_protege` et des codes de consentement ? | Rien : ils sont purgés, car ce sont des contenus sensibles. Seuls les codes de gouvernance listés restent. |
| D5 | AC-25 | Identifiant des objets : UUID v7 (horodaté) ou UUID v4 (opaque) ? | **UUID v4 pour les objets**, v7 conservé pour les journaux techniques. DD-02 dit déjà « opaque, ne code ni date » : l'horodatage du v7 contredit DD-02 lui-même. |
| D6 | AC-32 | Action `agréger` dédiée, ou voie « résultat publié » ? | Voie « résultat publié » ; pas de nouvelle action en V1. |
| D7 | AC-06 | Sens de `masqué` et `pseudonymisé` dans une sélection ? | `masqué` : existence et relations visibles, attributs identifiants retirés ; `pseudonymisé` : pseudonyme stable par sélection (`masquage` de type pseudonymisation). Les deux exigent une évaluation de diffusabilité pour une personne vivante. |
| D8 | AC-15 | `administrer` inclut-il la lecture des métadonnées de gouvernance (règles, diffusions, explication des accès) ? | **Oui**, limité aux métadonnées, jamais aux contenus. Cette formulation explicite ce que § 22.1 entend déjà par « gérer l'espace ». |
| D9 | AC-03 | Sans déclencheur humain identifiable, qui détient les droits du propriétaire sur les objets créés ? | Le déposant des entrées de la tâche ; s'il n'y en a pas, personne (habilitation exceptionnelle seulement). L'auteur imputé reste tracé. |

## 5. Suite proposée

1. **Arbitrage du porteur** sur D1 à D9, et validation des positions et gravités ci-dessus.
2. **Corrections** : dictionnaire V1.3 (11 constats) et MLD (32 constats), chacune tracée vers son AC.
3. **Contrôle de réalisation** des 207 lignes « citées » du § 25.4 (AC-28) : vérification de la contrainte, pas seulement de la mention.
4. **Contre-audit ciblé**, de préférence par un nouvel agent séparé, sur les corrections des 7 bloquants et des AC-10, AC-11, AC-23 et AC-28, avant toute décision de gel.
5. Recettes documentaires, puis décision de gel.

## 6. Décisions du porteur (10/10/2026)

*Le porteur valide comme objectif la correction des 32 constats, le passage d'AC-28 en majeur et le contrôle exhaustif des 207 lignes. Il ne prononce pas la clôture des constats : les rapports, non versionnés, ne lui étaient pas accessibles.*

| Arbitrage | Verdict | Règle retenue |
|---|---|---|
| D1 | Validé avec exception contrôlée | Aucun acteur ne s'accorde lui-même un rôle scientifique, sauf l'attribution initiale prévue à la création de l'espace. Toute attribution ultérieure exige un habilitant indépendant et effectivement autorisé. |
| D2 | Validé | Consultation hors ligne `limitée` par défaut dans les espaces collectifs. Une autorisation explicite et bornée peut l'étendre ; retrait à la prochaine synchronisation effective. |
| D3 | Validé sous condition | Le repartage d'une copie dépend des droits durablement acquis sur elle et de sa licence, sans nouvel accord de l'espace d'origine. La licence ne suffit pas si des restrictions légales ou des droits de tiers subsistent. |
| D4 | Validé avec réserve | Les codes rattachés aux données effacées sont purgés s'ils permettent de les reconstituer ou n'ont plus de justification de conservation. Seules subsistent les traces minimales légalement nécessaires, protégées et non résolubles. |
| D5 | Validé | UUID v4 pour les nouveaux identifiants opaques d'objets ; pas d'UUID v7 lorsque son horodatage contredit l'opacité ; aucune renumérotation automatique des identifiants existants. |
| D6 | Validé | Un résultat figé publié peut alimenter un indicateur autorisé, sans action `agréger`, sous réserve de sa diffusabilité et de sa méthode. |
| D7 | Validé, avec définition normative | **Masqué** : l'élément est omis de la représentation remise, ou remplacé par une indication neutre si elle ne révèle rien de protégé ; ni ses attributs, ni ses relations, ni ses références indirectes ne permettent de le reconstituer. **Pseudonymisé** : l'élément est représenté par un pseudonyme propre au contexte autorisé ; identifiants réels et correspondance inaccessibles au destinataire ; relations conservées filtrées contre la réidentification indirecte. La pseudonymisation n'est pas une anonymisation : les données restent personnelles. Les tests d'AC-06 et AC-07 portent sur le **graphe effectivement rendu** (participations, présences, situations, index, exports). |
| D8 | Validé | `administrer` ouvre seulement les métadonnées nécessaires à la gouvernance ; aucun accès implicite aux contenus scientifiques privés ni aux métadonnées protégées sans nécessité administrative établie. |
| D9 | Validé sous condition | Les droits vont au déposant identifiable des entrées, s'il possède les droits nécessaires ; sinon, aucun droit de lecture personnel n'est créé. Quatre rôles distincts : déclencheur technique, déposant des entrées, auteur scientifique identifiable, bénéficiaire d'une autorisation de lecture. Aucun n'est confondu avec le propriétaire administratif. |

**Constats nuancés :**
- **AC-13** : CP-40 reconnaît explicitement le résidu hors ligne ; la révocation est immédiate pour les lectures connectées.
- **AC-16** : les copies légitimement réutilisées sont autonomes.
- **AC-32** : pas d'action `agréger`.

**AC-28 :** reclassé **majeur**. Chacune des 207 lignes reçoit un statut parmi : réalisée et vérifiée, partielle, absente, non applicable avec justification. Le § 25.4 est corrigé selon les résultats.

**Ordre de correction approuvé :**
1. Les onze défauts du dictionnaire.
2. AC-01 à AC-07 dans le MLD, puis les autres constats.
3. Vérification des 207 lignes.
4. Contre-audit indépendant sur les sept bloquants, AC-10, AC-11, AC-23 et AC-28, avec non-régression.
5. Gel du dictionnaire V1.3 et du MLD seulement après résolution documentée.

## 7. Corrections appliquées (V1.1-d du MLD, dictionnaire V1.3 complété) — 10/10/2026

*Statut : corrections rédigées par l'auteur. Aucun constat n'est clos : le contre-audit indépendant et la décision du porteur restent nécessaires.*

| Constat | Dictionnaire V1.3 | MLD V1.1-d |
|---|---|---|
| AC-01 | DD-28 ; DI-B29 complétée | CP-48 ; CK d'auto-habilitation sur `regle_acces` ; § 22.2 étape 4 |
| AC-02 | — | CP-37 réécrite (toutes les appartenances et règles du cédant closes et transférées) |
| AC-03 | DI-A39 réécrite (quatre rôles) | CP-23 réécrite (titulaire ≠ propriétaire administratif ; aucun droit par repli) ; `regle_acces.nature = propriétaire` |
| AC-04 | `BENEFICIER_EMBARGO`, DI-B21 réécrite | `embargo_beneficiaire` ; CP-46 réécrite ; § 22.2 étape 1 |
| AC-05 | Unicité de BASE_JUSTIFICATIVE par espace et auteur | UQ de `base_justificative` ; CP-49 (visibilité uniforme) |
| AC-06 | DI-L21 (définitions D7), `masquage` d'inclusion | `selection_inclusion.masquage_id` + CK ; CP-29 (rendu effectif) |
| AC-07 | DI-L16 étendue à tous les profils | CP-33 |
| AC-08 | — | CP-50 |
| AC-09 | — | CP-35 (même espace ou acceptation) |
| AC-10 | `version_active`, `etat_proposition`, `version_en_vigueur`, DI-L22, DI-B38 | Colonnes et FK ; CP-29, 33, 36, 39 ; MLD-16 |
| AC-11 | `POSER_REGLE`, DI-B44 | `regle_acces.auteur_acteur_id` |
| AC-12 | — | `transfert_engagement` (groupes, appartenances, admissions) ; CP-37 |
| AC-13 | Réplication `limitée` par défaut en espace collectif (D2) | CK de `espace` ; CP-28 et CP-40 (résidu hors ligne reconnu) |
| AC-14 | — | CP-27 (`charge` = delta) |
| AC-15 | DD-28.4 (D8) | CP-35 ; `decision_editoriale.origine` |
| AC-16 | DI-A41 (D3) | CP-51 |
| AC-17 | DI-C13 réécrite, DI-C22 étendue | UQ d'empreinte supprimée ; CP-41 réécrite |
| AC-18 | — | CK de `export_exclusion` ; CP-46 |
| AC-19 | — | `assertion.temps_forme`, `⟨dh temps_fin⟩` |
| AC-20 | — | `dependance.amont_type`, FK composite, CK ; § 24 corrigé |
| AC-21 | — | CP-05 |
| AC-22 | — | Unicités `WHERE NOT est_purge` (dix tables) ; prédicat de cote |
| AC-23 | — | CP-22 réécrite ; CP-01 étendue |
| AC-24 | DD-27 (D4) | Vingt colonnes en `NN*` |
| AC-25 | DD-02 (UUID v4, D5) ; DD-27.3 | `version_objet` nullable sous `resolution_effacee` |
| AC-26 | `email` conditionnelle ; `PSEUDONYME_RESERVE` | CK de `compte` ; `pseudonyme_reserve` |
| AC-27 | — | CP-52 |
| AC-28 | — | CP-53 ; `activite_perimetre_transmis`, `intervention_perimetre`, `evaluation_diffusabilite.effectif` ; § 25.4 refait (207 lignes vérifiées ; 21 lacunes corrigées, dont 3 trouvées par ce contrôle) |
| AC-29 | Cardinalité (0,n) | — |
| AC-30 | — | § 22.2 étape 1 bis ; `campagne_personne.acteur_id` |
| AC-31 | — | CP-23 (acteur institutionnel d'amorçage) |
| AC-32 | DD-24, point 6 (D6) | CP-34 |

**Prochaine étape :** contre-audit indépendant ciblé sur les sept bloquants, AC-10, AC-11, AC-23 et AC-28, avec non-régression sur les autres corrections.
