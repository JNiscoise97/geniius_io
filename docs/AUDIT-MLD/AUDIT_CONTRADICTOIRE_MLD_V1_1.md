# Audit contradictoire du MLD V1.1 (candidat)

- **Date :** 10 octobre 2026
- **Objet audité :** `docs/GENIIUS_MLD_V1_0.md` (MLD V1.1, révision V1.1-c, « candidat, non gelé »).
- **Référentiels de contrôle (seules sources utilisées) :**
  - `docs/geniius_io_MCD_V1.md` (MCD V1.2, invariants P1 à P25) ;
  - `docs/geniius_io_DICTIONNAIRE_DONNEES_V1.md` (dictionnaire V1.3 candidat : DD-*, DI-*, TI-*, OB-*) ;
  - `docs/geniius_io_CDCF_V1.md` (CDCF V1.2, Partie XXI) ;
  - `docs/GENIIUS_CDC_TECHNIQUE_V1_0.md` (consultation ciblée : TECH-002, TECH-011.6).
- **Méthode :**
  1. Lecture intégrale des § 0 à 5, 21 à 24 et 26 à 29 du MLD. Lecture des DDL des § 6 à 20. Confrontation, ligne à ligne, avec les fiches du dictionnaire concernées (domaines A, B, C, E, G, L, P et décisions DD-01 à DD-27).
  2. Recherche active de contre-exemples. Pour chaque règle, construction d'un scénario (acteurs, données, opérations) visant à la violer avec les seules contraintes déclarées (NN, UQ, FK, CK) et les CP telles qu'elles sont rédigées.
  3. Les mentions de conformité du MLD (matrices § 25, § 24, « citée », « couvert ») n'ont **pas** été prises pour preuves. Elles ont été revérifiées contre les DDL et le texte des CP.
  4. Échantillonnage de la matrice § 25.4 : **64 lignes**, dont 58 marquées « citée » (liste en fin de rapport).
- **Limites :**
  - Audit en aveugle partiel. Les dossiers `AUDIT-COHERENCE/` et `AV-FONC/`, les archives, les rapports de réexécution et le registre des versions n'ont pas été ouverts. Certains constats ont donc peut-être déjà été arbitrés par l'équipe.
  - Le texte du MCD n'a été lu que pour les invariants et le domaine D-10. Les règles RG-* sont citées d'après leur reprise dans le dictionnaire.
  - Le CDC technique n'a été consulté que ponctuellement. Les obligations TECH-* n'ont pas été vérifiées systématiquement.
  - Les § 25.1 à 25.3 (matrices entités et associations) ont été échantillonnés, pas contrôlés exhaustivement. Il en va de même des domaines M (Connect), N (Atlas) et des tables d'interprétation (§ 10.2), parcourus sans recherche approfondie.
  - Aucune exécution : les scénarios sont des raisonnements sur le schéma, pas des tests sur une base.

---

## Synthèse des constats

| ID | Gravité | Domaine | Titre court |
|---|---|---|---|
| AC-01 | Bloquant | Accès — privilèges administratifs | Personne ne contrôle qui crée une règle d'accès : un administrateur peut s'auto-habiliter, et un programme peut habiliter sur ses sous-projets |
| AC-02 | Bloquant | Accès — transfert | Après transfert, le cédant garde son appartenance scientifique et ses règles de propriétaire |
| AC-03 | Bloquant | Accès — privilèges administratifs | Le repli de CP-23 donne au `propriétaire` (rôle administratif) une règle `voir`/`éditer` sur des objets `privé` |
| AC-04 | Bloquant | Accès — existence protégée | L'embargo « existence même » est irréalisable : aucun bénéficiaire, et une interdiction ne peut exclure personne |
| AC-05 | Bloquant | Accès — absent ≠ caché | Des unicités ignorent la visibilité (`base_justificative`, `reference_inter_espace`, `selection_contexte`) : elles révèlent un objet privé d'autrui et bloquent un usage légitime |
| AC-06 | Bloquant | Accès — partage sélectif | Les modes `masqué` et `pseudonymisé` d'une inclusion ne sont pas appliqués par `acces()` : une personne vivante « masquée » est servie en clair |
| AC-07 | Bloquant | Accès — partage sélectif | Le filtrage des « relations frontières » se limite au profil `relation` : une branche exclue reste déductible par participation, présence ou situation |
| AC-08 | Majeur | Accès — absent ≠ caché | Écriture avec une clé étrangère vers un objet invisible : rien n'exige l'accès préalable, d'où un oracle d'existence |
| AC-09 | Majeur | Accès — publication | `paraitre_dans` permet d'insérer un numéro dans la série d'un autre espace et d'y occuper un rang |
| AC-10 | Majeur | Transitions d'état | Version en vigueur ≠ version courante (sélections, prises en charge) : CP-29, CP-36, CP-39 et MLD-16 se contredisent |
| AC-11 | Majeur | Accès — partage sélectif | L'« auteur » d'une règle, dont dépendent CP-29 et OB-23, n'est pas modélisé |
| AC-12 | Majeur | Accès — transfert | L'empreinte des engagements (DI-B41) ignore les membres de groupes et les appartenances |
| AC-13 | Majeur | Accès — hors ligne | CP-40 promet « aucune fenêtre » alors que CP-28 permet une réplique sans échéance, et un changement de `replication_hors_ligne` n'est jamais propagé |
| AC-14 | Majeur | Accès — hors ligne | Une contribution différée refusée reste lisible par son auteur alors que sa `charge` peut contenir le contenu retiré |
| AC-15 | Majeur | Accès — diffusion, circuit éditorial | Diffusions « visibles des administrateurs » (CP-35) incompatibles avec le CK de CP-26 ; invalidation automatique contraire à « acteur humain » |
| AC-16 | Majeur | Accès — partage de partage | La réutilisation ouvre un partage transitif : aucun contrôle de licence sur la resélection, la publication ou la diffusion des copies |
| AC-17 | Majeur | Accès — fichiers | La déduplication intra-espace fusionne les fichiers de deux membres : fuite entre eux, purge d'un fichier partagé |
| AC-18 | Majeur | Accès — exports | `export_exclusion` consigne les objets à existence protégée dans l'export même de l'acteur visé |
| AC-19 | Majeur | Fidélité scientifique | `assertion.temps` n'admet qu'un `DATE_HIST` : la `PERIODE_HIST` du dictionnaire est aplatie |
| AC-20 | Majeur | Fidélité scientifique | DI-A30 (« acquisition jamais amont d'une justification ») n'a aucune réalisation : CP-07 ne la contient pas |
| AC-21 | Majeur | Cardinalités | Quinze cardinalités minimales (1,n) du dictionnaire ne sont contrôlées par aucune contrainte |
| AC-22 | Majeur | Clés | Des unicités non partielles comptent les lignes purgées ou supprimées ; la purge fait même rentrer une ancienne cote dans une UQ partielle |
| AC-23 | Majeur | Historisation | CP-22 permet d'insérer une association dans une version existante, ce qui réécrit rétroactivement un état figé et son empreinte |
| AC-24 | Majeur | Purge | Des colonnes de contenu déclarées `NN` (et non `NN*`) empêchent la purge exigée par DD-27 et MLD-10 |
| AC-25 | Majeur | Purge — effacement légal | L'effacement de résolution (DD-27.3, CP-16) est irréalisable : NOT NULL sur `version_objet`, journal `activite` conservé, date de création lisible dans l'UUID v7 |
| AC-26 | Majeur | Purge — compte | DI-B05 est irréalisable (`email NN`, clés étrangères RESTRICT vers `compte`) ; DI-B08 est perdu après purge (pseudonyme réattribuable) |
| AC-27 | Majeur | Historisation | Les attributs figés (F), dont `objet.espace_id` (DI-A01), ne sont protégés par aucune contrainte |
| AC-28 | Mineur | Contraintes — règles DI | Neuf lignes « citées » de la matrice § 25.4 ne sont que partiellement réalisées |
| AC-29 | Mineur | Cardinalités | `DECIDER_RATTACHEMENT` (0,2) contredit CP-31, qui exige jusqu'à trois décisions |
| AC-30 | Mineur | Accès — algorithme | `acces()` est déclaré seule source de décision, mais n'intègre ni CP-19 ni DI-J09 |
| AC-31 | Observation | Accès — Core | L'amorçage du Core et CP-23 sont incompatibles : pas de propriétaire au Core |
| AC-32 | Observation | Exigences CDCF | « Faire remonter les indicateurs qu'il autorise » (CDCF § 120.2) n'a pas d'action dédiée dans D-10 |

**Bilan :** 7 bloquants, 20 majeurs, 3 mineurs, 2 observations.

---

## 1. Contrôle d'accès

### AC-01 — Personne ne contrôle qui crée une règle d'accès : un administrateur peut s'auto-habiliter, et un programme peut habiliter sur ses sous-projets

- **Gravité :** Bloquant
- **Références :**
  - MLD § 22.1 : les habilitations administratives « permettent de gérer l'espace (membres, règles, cycle de vie) sans lire le contenu ».
  - MLD § 22.2, étape 4 : « Visibilité par défaut (§ 22.1) pour l'action `voir` ; refus pour les autres actions sans règle ».
  - CK de `regle_acces` (CP-26) : il ne vise que `type_beneficiaire = 'rôle d''espace'` avec les rôles `propriétaire` ou `administrateur`.
  - CP-26, puce 2 : un administrateur ne lit que par « une autorisation ordinaire nominative accordée par un ayant droit ». La notion d'ayant droit n'est définie nulle part.
  - CP-24 : il s'applique selon la *finalité* déclarée (« mission d'administration, de support… »), ce qui n'est pas contrôlable.
  - Règles violées :
    - DI-B36 et DD-22.5 : « Seuls les administrateurs de l'espace porteur créent, élargissent ou admettent » ; « le programme ne le peut pas » ;
    - DI-K23 : « Être administrateur d'un projet parent ne donne aucune action sur l'enfant » ;
    - CDCF § 120.2 : « Être administrateur du programme ne donne pas accès aux données privées de ses sous-projets » ;
    - OB-22, CP-25.
- **Scénario de violation :**
  1. L'acteur X n'a qu'une appartenance `administrateur` (administrative) sur le projet P. Il ne lit rien, conformément à CP-25.
  2. **Voie A.** X « gère les membres » : il insère dans `appartenance_espace` la ligne (P, X, `lecteur`, `scientifique`, `lecture_scientifique = vrai`). Aucun CK ni aucune CP ne l'interdit (CP-06 ne contrôle que l'espace personnel). X lit désormais tous les objets `projet` de P.
  3. **Voie B.** X « gère les règles » : il crée une `regle_acces` avec `cible_espace_id = P`, `action = voir`, `type_beneficiaire = acteur`, `beneficiaire_acteur_id = X`, `nature = ordinaire`. Le CK CP-26 ne s'applique pas, puisque le bénéficiaire n'est pas un rôle d'espace. Le CK CP-24 non plus (règle `ordinaire`). À l'étape 3, la règle accorde `voir`, y compris sur les objets `privé` de P si une règle portant sur l'espace couvre ses objets (PORTER_SUR_ESPACE).
  4. **Voie C (programme).** L'administrateur du programme G crée une `regle_acces` dont l'objet vit dans G et dont `cible_espace_id` désigne le sous-projet S, au profit de son groupe « Coordination ». Aucune contrainte n'exige que l'auteur d'une règle ait `administrer` sur la cible, ni que la règle vive dans l'espace de la cible.
  5. **Résultat observé :** lecture de contenus `projet` et `privé` sans habilitation scientifique ni exceptionnelle. **Résultat attendu :** refus (CP-25, OB-22).
  6. **Corollaire :** à l'inverse, l'étape 4 n'accorde par défaut que `voir`. Aucun rôle ne reçoit donc `administrer`, `éditer` ou `repartager`, et la création de la toute première règle n'est fondée sur rien. Le schéma est soit inutilisable, soit complété ad hoc par l'application, ce qui ouvre les voies A à C.
- **Correction proposée :**
  1. Ajouter une CP « autorité sur les droits ». Seul un acteur qui détient `administrer` sur la cible (ou sur son espace) peut créer, élargir ou prolonger une `regle_acces`, une `appartenance_espace`, un `membre_groupe` ou une `regle_admission`. L'objet `regle_acces` vit dans l'espace de sa cible (`objet.espace_id = espace de la cible`).
  2. Interdire qu'un acteur s'accorde à lui-même une habilitation scientifique ou une règle `voir`/`éditer` (bénéficiaire ≠ auteur de l'activité de création), hors création de l'espace (CP-25).
  3. Publier une matrice normative « rôle d'appartenance → actions par défaut » (`administrer` pour `propriétaire` et `administrateur`, `éditer` pour `collaborateur`…), à appliquer à l'étape 4.
  4. Conserver l'auteur de la règle en colonne (voir AC-11).
- **Confiance :** élevée. Les voies A et B ne dépendent que des CK et CP telles qu'elles sont rédigées. La voie C repose sur l'absence de contrainte d'espace sur `regle_acces`.

### AC-02 — Après transfert, le cédant garde son appartenance scientifique et ses règles de propriétaire

- **Gravité :** Bloquant
- **Références :**
  - CP-37 : « Le passage à `accepté` (transaction unique : changement des appartenances `propriétaire`, renseignement du cessionnaire et de `date`)… le cédant ne garde aucune appartenance ni règle du seul fait du transfert ».
  - CP-25 : « À la création d'un espace, le créateur reçoit les deux » appartenances.
  - CP-23 : règle `voir`/`éditer` créée pour l'auteur de chaque objet `privé`.
  - Règles violées :
    - DD-26.4 : « Par défaut, le cédant ne garde **aucun** droit : seuls ses crédits et attributions subsistent. Un droit maintenu doit être accordé explicitement par le nouveau propriétaire, après le transfert » ;
    - DI-B42 ;
    - CDCF § 128 : « Aucun droit permanent ne découle de la qualité de créateur ».
- **Scénario de violation :**
  1. Le chercheur C crée l'espace « Arbre BOVALO » pour son cousin. CP-25 lui donne (`propriétaire`, administrative) et (`responsable scientifique`, scientifique). Il crée 400 objets `privé`, donc 400 règles nominatives (`voir`, `éditer`) à son profit (CP-23).
  2. Le transfert est accepté. La transaction CP-37 ne modifie que les appartenances `propriétaire`.
  3. **Observé :** C garde sa ligne `responsable scientifique` (lecture de tous les objets `projet`) et ses 400 règles sur les objets `privé`. Il continue de lire et d'éditer l'arbre transmis.
  4. **Attendu :** aucun droit résiduel, sauf octroi explicite postérieur du cessionnaire.
- **Correction proposée :** réécrire CP-37. La transaction d'acceptation clôt **toutes** les lignes d'`appartenance_espace` et d'`attribution_role` du cédant sur l'espace, ainsi que toutes les `regle_acces` dont il est bénéficiaire nominatif sur des objets de l'espace (règles CP-23 comprises). Elle incrémente l'époque (CP-40). Seuls `credit` et `activite` restent.
- **Confiance :** élevée sur le mécanisme. La formule « du seul fait du transfert » de CP-37 et DI-B42 est ambiguë, mais DD-26.4 et le CDCF ne le sont pas.

### AC-03 — Le repli de CP-23 donne au `propriétaire` (rôle administratif) une règle `voir`/`éditer` sur des objets `privé`

- **Gravité :** Bloquant
- **Références :**
  - CP-23 : « Une tâche planifiée de plateforme est rattachée à l'acteur qui l'a programmée, ou à défaut au propriétaire de l'espace cible ». Le même CP crée pour « l'acteur auteur » une `regle_acces` (`voir`, `éditer`) sur tout objet `privé` créé.
  - Règles violées : CP-25, CP-26, OB-22, § 22.1 (« Le rôle d'administrateur d'espace […] ne confère aucun droit de lecture implicite »).
- **Scénario de violation :**
  1. Une tâche automatique, dont l'acteur programmateur a quitté la plateforme ou n'est pas identifiable (migration, OCR planifié par la plateforme), crée dans l'espace E des objets `privé`, par exemple des transcriptions issues de fichiers déposés par un membre.
  2. Par repli, l'auteur devient le `propriétaire` de E, qui n'a qu'une habilitation administrative.
  3. CP-23 lui crée une règle nominative `voir`/`éditer` sur chacun de ces objets.
  4. **Observé :** l'administrateur lit des contenus privés qu'il n'a pas produits. **Attendu :** aucune lecture implicite.
  5. Même effet pour un import : l'auteur est `import.acteur_id`, qui peut être un administrateur lançant un import pour le compte d'un membre.
- **Correction proposée :**
  1. Distinguer l'**auteur imputé**, pour la traçabilité (DI-A39), du **titulaire des droits du propriétaire** de CP-23.
  2. Le repli ne crée aucune règle de lecture. Les objets produits sont rattachés à l'acteur qui a déposé les entrées (ou laissés sans titulaire, accessibles par habilitation exceptionnelle seulement).
  3. Interdire que la règle CP-23 bénéficie à un acteur qui n'a, sur l'espace, qu'une habilitation administrative.
- **Confiance :** élevée (lecture littérale de CP-23).

### AC-04 — L'embargo « existence même » est irréalisable : aucun bénéficiaire, et une interdiction ne peut exclure personne

- **Gravité :** Bloquant
- **Références :**
  - CP-46 : « un `embargo` de `portee = existence même` produit […] une `regle_acces` `interdire` / `objet_protege = existence` visant l'objet pour tous sauf les bénéficiaires de l'embargo ».
  - Table `embargo` (§ 5.4) : aucune colonne ni association ne désigne de bénéficiaires.
  - `regle_acces` : un seul bénéficiaire par règle ; `public` désigne tout le monde.
  - § 22.2, étape 1 : l'existence protégée retire la cible « avant toute autre étape ».
  - Règles violées : DI-B21 (« dérivée pour les non-bénéficiaires »), DD-18, P19, OB-04.
- **Scénario de violation :**
  1. Un témoignage T (projet P) est placé sous embargo `existence même`.
  2. Pour exprimer « tous sauf les bénéficiaires », l'implémenteur n'a que deux choix :
     - **(a)** une règle `interdire`/`existence` au profit de `public`. Elle s'applique aussi au déposant et au responsable scientifique, puisque l'interdiction l'emporte toujours (DI-B11) et que l'étape 1 précède toute autorisation. T disparaît pour tous, propriétaire compris, et plus personne ne peut lever l'embargo ;
     - **(b)** des règles `interdire` nominatives pour chaque non-bénéficiaire connu. Tout acteur futur (nouveau membre, lecteur public) n'est pas couvert et voit l'existence de T.
  3. **Observé :** (a) perte d'accès irréversible, ou (b) fuite d'existence. **Attendu :** T est inexistant pour tous, sauf pour les bénéficiaires.
- **Correction proposée :**
  1. Ajouter `embargo_beneficiaire [A:embargo]` (acteur ou groupe).
  2. Ajouter à `regle_acces` une portée d'exception (`exception_groupe_id`, ou règle `interdire` « sauf membres de G ») évaluée à l'étape 1.
  3. À défaut, convertir l'embargo d'existence en règle `autoriser`/`existence` pour les bénéficiaires, combinée avec une visibilité `privé` plafonnée et une interdiction d'indexation, plutôt qu'en interdiction universelle.
  4. Préciser qui conserve `administrer` sur l'embargo.
- **Confiance :** élevée (structure absente).

### AC-05 — Des unicités ignorent la visibilité : elles révèlent un objet privé d'autrui et bloquent un usage légitime

- **Gravité :** Bloquant
- **Références :**
  - `base_justificative` : `UQ (objet_justifie_id, portee) WHERE statut = 'en vigueur'`, sans espace ni auteur.
  - `reference_inter_espace` : `UQ (espace_referent_id, objet_cible_id) WHERE etat_courant <> 'retirée'`. Le lien a sa propre `visibilite`, qui peut être `privé`.
  - `selection_contexte` : `UQ (espace_contexte_id, entite_id, usage, predicat_id)`. L'objet peut être `privé`.
  - `position_epistemique` : `UQ (coalesce(contexte_espace_id, contexte_publication_id), objet_vise_id)`.
  - Règles violées : TI-11, OB-04, P19 ; DI-A27/§ 3.8 du dictionnaire (« une base en vigueur par portée », pensée par contexte).
- **Scénario de violation :**
  1. Les projets P1 et P2 justifient tous deux l'assertion du Core A, chacun avec une base de portée `projet`. La base de P1 est `en vigueur`. Le responsable de P2 tente de créer la sienne : **violation d'unicité**.
  2. Même avec la portée `privée`, l'acteur B ne peut pas créer sa base privée sur A parce que l'acteur A2, qu'il ne connaît pas, en a une. B apprend qu'une justification privée existe sur A, et son travail légitime est refusé.
  3. Dans le projet P, le membre A crée une référence `privé` vers l'objet du Core X. Le membre B tente de référencer X et obtient une violation d'unicité : il apprend l'existence de la référence privée de A.
  4. Même mécanisme pour une `selection_contexte` privée d'un membre : un autre membre ne peut pas choisir l'assertion affichée pour le même prédicat.
  5. **Observé :** distinction « absent / caché » par le code d'erreur, et blocage fonctionnel. Une réponse d'API uniforme ne peut pas corriger ce cas, car l'insertion légitime échoue quoi qu'il arrive. **Attendu :** chaque contexte (espace, auteur pour `privée`) a sa propre base, référence ou sélection.
- **Correction proposée :**
  - `base_justificative` : `UQ (espace_id, objet_justifie_id, portee) WHERE statut = 'en vigueur'`, plus l'auteur pour `privée`. Recopier `objet.espace_id` dans la table, comme `selection_contexte.predicat_id` (‡).
  - `reference_inter_espace` : soit l'unicité porte sur (espace, cible, visibilité ou auteur), soit la référence est un objet d'espace sans visibilité propre plus restrictive que l'espace.
  - Règle générale à ajouter au § 3 : une unicité ne peut porter que sur des lignes dont la visibilité est uniforme pour tous ceux qui peuvent tenter l'insertion concurrente.
- **Confiance :** élevée pour `base_justificative` (UQ littérale). Moyenne pour les autres, qui dépendent de la visibilité choisie pour ces objets.

### AC-06 — Les modes `masqué` et `pseudonymisé` d'une inclusion ne sont pas appliqués par `acces()`

- **Gravité :** Bloquant
- **Références :**
  - `selection_inclusion.mode_inclusion` ∈ {intégral, masqué, pseudonymisé} ; `selection_partage.traitement_vivants` ∈ {exclus, masqués}.
  - § 22.2, précisions de l'étape 3 : la règle sur une sélection vaut pour `o` si « `o` figure au manifeste de la version active […] ». Le mode d'inclusion n'est consulté nulle part.
  - L'étape 6 ne traite que les objets `masquage`, pas le mode d'inclusion.
  - Règles violées :
    - CP-45 (« une personne née "vers 1960", sans décès, n'est ni exposée […] ni dans une sélection partagée (`traitement_vivants`) […] sans évaluation favorable ») ;
    - DI-E05 (confidentialité R) ;
    - CDCF § 126.1 (« Les personnes vivantes et les données sensibles sont masquées ou exclues par défaut ») ;
    - P24.
- **Scénario de violation :**
  1. La sélection S a `traitement_vivants = masqués`. Le manifeste contient la personne vivante V et ses assertions de nom et de naissance, avec `mode_inclusion = masqué`.
  2. La règle `G1` (`voir`) bénéficie aux collaborateurs de COL.
  3. Un collaborateur demande V : V est au manifeste, `G1` est active, l'auteur a `voir`. L'étape 3 accorde `voir`, sans aucune transformation.
  4. **Observé :** les assertions de V sont servies intégralement. **Attendu :** une version masquée ou pseudonymisée, ou un refus sans évaluation favorable.
- **Correction proposée :**
  1. Ajouter à l'étape 3 : « si la règle est fondée sur une sélection, l'objet est servi selon `selection_inclusion.mode_inclusion` ; `masqué` et `pseudonymisé` exigent un `masquage` (objet public) référencé dans la ligne d'inclusion (`masquage_id`) ».
  2. Exiger une `evaluation_diffusabilite` favorable pour toute inclusion d'un objet couvert par DI-E05.
  3. Ajouter `masquage_id` à `selection_inclusion`, avec le CK `mode_inclusion <> 'intégral' ⇔ masquage_id IS NOT NULL`.
- **Confiance :** moyenne. Le sens exact de « masqué » n'est défini ni dans le MLD ni dans le dictionnaire, mais aucune réalisation n'existe.

### AC-07 — Le filtrage des « relations frontières » se limite au profil `relation` : une branche exclue reste déductible

- **Gravité :** Bloquant
- **Références :**
  - CP-33 : « une `assertion` de profil relation n'est incluse que si ses deux extrémités le sont […] aucun objet listé dans `selection_exclusion` […] n'est inclus ».
  - Dictionnaire, exemple de § 14.6 : le manifeste contient aussi des « sources ».
  - Règles violées :
    - DI-L16 (« une relation entre un objet inclus et un objet non inclus n'est jamais incluse ») ;
    - OB-23 (« aucune relation hors manifeste exposée, ni son existence ») ;
    - P24 ;
    - CDCF § 126.1 (« Les branches non sélectionnées […] ne sont ni exposées ni déductibles »).
- **Scénario de violation :**
  1. Le Sosa 16 est exclu. Le baptême du Sosa 31 (événement E, inclus comme source d'une assertion de naissance) a pour parrain le Sosa 16.
  2. L'assertion `participation` (sujet = Sosa 16, cible = E, rôle « parrain », `libelle_source` « Jean BOVALO, parrain ») n'a pas le profil `relation`, et ce n'est pas le Sosa 16 lui-même qui figure dans `selection_exclusion`.
  3. Aucune règle de CP-33 n'empêche son inclusion par motif `ajout explicite` ou par inclusion des assertions de l'événement.
  4. Même cas pour `présence` et `situation` avec cible (« au service de… »), et pour une assertion de profil `attribut` dont le **sujet** est le Sosa 16.
  5. **Observé :** le destinataire voit, sur E, une participation dont le sujet est retiré (TI-11) mais dont le verbatim nomme la personne exclue. La branche est déductible. **Attendu :** aucune assertion dont le sujet ou la cible est hors manifeste.
- **Correction proposée :** généraliser CP-33. Toute assertion, quel que soit son profil, n'est incluse que si son sujet **et** sa cible éventuelle sont inclus. Une assertion dont le sujet ou la cible est exclu est elle-même exclue. Les sources incluses le sont en mode `provenance masquée` si elles mentionnent des personnes exclues (ou font l'objet d'une évaluation de diffusabilité).
- **Confiance :** élevée pour la lacune de CP-33. Moyenne pour l'ampleur, qui dépend des règles de calcul du manifeste laissées au service (MLD-16).

### AC-08 — Écriture avec une clé étrangère vers un objet invisible : oracle d'existence

- **Gravité :** Majeur
- **Références :**
  - MLD § 22.3 : la ligne « API » ne traite que les réponses de lecture. Aucune CP n'impose `acces(contexte, cible, voir)` sur l'objet désigné par une FK fournie par l'utilisateur **avant** l'écriture.
  - Exemples de colonnes concernées :
    - `contribution_differee.espace_cible_id` : la réception est inconditionnelle (CP-27) ;
    - `relation_projets.projet_lie_id` : types déclarés par une seule partie, « sans effet sur l'autre projet, qui n'est ni notifié » ;
    - `reference_inter_espace.objet_cible_id`, `utiliser.ressource_id`, `etudier.cible_id`, `epingle.objet_id`, `tag_objet.objet_id`, `demande.objet_concerne_id`…
  - Règles violées : TI-11, OB-04 (« codes d'erreur, temps de réponse »), CDCF § 121.2 (« Recherche protégée »).
- **Scénario de violation :**
  1. L'acteur M, membre du projet A, soupçonne l'existence d'un projet confidentiel B dont il a obtenu un identifiant (lien partagé, journal, export ancien).
  2. Il déclare `relation_projets` (A, B, `conteste`). Si B n'existe pas, la FK `projet_lie_id → projet(id)` échoue. S'il existe, l'insertion réussit, ou échoue sur un contrôle d'accès dont le message diffère. La FK typée vers `projet` lui apprend en outre que l'identifiant désigne un **projet**.
  3. Variante hors ligne : une `contribution_differee` vers un `espace_cible_id` arbitraire est reçue (succès) ou rejetée (violation de FK).
- **Correction proposée :**
  1. Ajouter une CP « écriture référentielle ». Toute colonne de référence fournie par un appelant est validée par `acces(contexte, cible, voir)` avant l'évaluation des FK. Absent et inaccessible produisent la même erreur, avec le même délai.
  2. Pour `contribution_differee`, exiger une appartenance passée ou présente à l'espace cible, ou accepter la réception sans révéler l'existence (succès simulé, comme CP-41).
- **Confiance :** moyenne. Une implémentation prudente de l'API peut masquer l'erreur, mais rien dans le MLD ne l'impose pour les écritures.

### AC-09 — `paraitre_dans` permet d'insérer un numéro dans la série d'un autre espace et d'y occuper un rang

- **Gravité :** Majeur
- **Références :**
  - `paraitre_dans [A:publication]` : le propriétaire est le **numéro**, avec `UQ (serie_id, rang) WHERE v_fin IS NULL`.
  - CP-35 (Séries) : il contrôle les types et l'absence de cycle, pas l'espace.
  - Règles violées : DI-P14, CDCF § 130 (« chaque numéro est figé »), P25, OB-04.
- **Scénario de violation :**
  1. L'espace B crée une publication « numéro » et une ligne `paraitre_dans (numéro_B, série_A, rang 13)`. La série appartient à A et est `public`.
  2. Puisque le propriétaire de l'association est le numéro, aucune décision de A n'est requise.
  3. **Observé :**
     - la liste des numéros de la série de A contient un numéro de B ;
     - le rang 13 est occupé, et la publication du vrai n° 13 de A échoue sur l'UQ ;
     - si le numéro de B est privé, A apprend son existence par l'échec.
  4. **Attendu :** seule l'autorité éditoriale de la série y ajoute un numéro.
- **Correction proposée :** CP-35 : `serie.espace_id = numero.espace_id`, ou acceptation explicite par un acteur qui a `administrer` sur la série. Restreindre l'UQ de rang aux numéros acceptés.
- **Confiance :** élevée.

### AC-10 — Version en vigueur ≠ version courante (sélections, prises en charge)

- **Gravité :** Majeur
- **Références :**
  - MLD-16 : « Une proposition d'évolution (DI-L15) est une nouvelle version de la sélection à l'état `proposée`, avec ses propres lignes ».
  - CP-33 : « les lignes de `selection_inclusion` d'une version sont écrites dans la transaction de confirmation ».
  - CP-29 : « manifeste […] de la version **active** ».
  - CP-36 : « `etat = active` ⇔ deux […] acceptations sur la version courante […] tant qu'elles manquent, la version précédente reste celle qui s'applique ».
  - CP-39 : « Un accord `suspendue`, `proposée` […] n'est pas éligible ».
  - CP-02 : une seule version courante.
  - Règles violées : DI-L13, DI-L15, DI-B38, OB-23, OB-25.
- **Scénario de violation :**
  1. Sélection S en version 3, `active`. Un ajout dans l'arbre source produit la version 4, `proposée`. Elle devient la version courante (`objet.version_courante = 4`, `selection_partage.etat = proposée`).
  2. Le schéma ne désigne plus aucune version « active » : il faudrait chercher dans `selection_partage_hist` la dernière version dont `etat = 'active'`, sans contrainte qui garantisse son unicité.
  3. Une implémentation qui lit `selection_partage.etat` coupe l'accès des destinataires pendant l'attente de confirmation. Si la proposition est refusée, aucun état ne le représente (pas de `refusée`) : la transition est indéfinie.
  4. Même schéma pour une `prise_en_charge` :
     - la version 2 (plafond relevé) n'a pas d'acceptation, donc par CP-36 l'état courant n'est pas `active` ;
     - par CP-39, l'accord n'est alors pas éligible ;
     - or DI-B38 exige que la version 1 « reste active ».
- **Correction proposée :**
  1. Ajouter `version_active` (numéro) à `selection_partage` et `version_en_vigueur` à `prise_en_charge`, sous contrainte FK vers `version_objet`. Les définir comme les seules sources de CP-29 et CP-39.
  2. Ajouter l'état `refusée` (ou `abandonnée`) pour une proposition.
  3. Aligner CP-33 sur MLD-16 : les lignes d'une version proposée sont écrites à sa création et figées à sa confirmation.
- **Confiance :** élevée.

### AC-11 — L'« auteur » d'une règle, dont dépendent CP-29 et OB-23, n'est pas modélisé

- **Gravité :** Majeur
- **Références :**
  - CP-29 : « son **auteur** doit détenir encore l'action correspondante ».
  - CP-40 : « l'époque de la portée de l'auteur est donc incluse dans la clé ».
  - `regle_acces` n'a aucune colonne auteur. L'auteur ne se déduit que de `version_objet.activite_id → activite.acteur_id`, version par version.
  - `regle_admission [A:regle_acces]` lie chaque admission à une version de la règle.
  - Règles violées : DI-B35 (« l'acteur qui l'a posée »), DD-21.3, OB-23.
- **Scénario de violation :**
  1. Le chercheur R crée la règle `G1` sur la sélection S (version 1 ; auteur R).
  2. Un administrateur de l'espace source, sans `voir` sur S, prolonge `date_fin` : version 2, dont l'activité appartient à l'administrateur.
  3. Selon que « auteur » désigne le créateur ou l'auteur de la version courante :
     - **(a)** R quitte le projet, mais la règle continue de valoir sur la base de droits qu'il n'a plus ;
     - **(b)** l'évaluation récursive se fait sur l'administrateur, qui n'a pas `voir` : tout accès des destinataires cesse.
  4. Deux implémentations conformes divergent sur une décision d'accès.
- **Correction proposée :** ajouter `regle_acces.auteur_acteur_id` (NN, figé), égal à l'acteur de l'activité de création. Toute modification par un autre acteur crée une nouvelle règle. CP-29 et CP-40 citent cette colonne.
- **Confiance :** élevée.

### AC-12 — L'empreinte des engagements (DI-B41) ignore les membres de groupes et les appartenances

- **Gravité :** Majeur
- **Références :**
  - CP-37 : `transfert_engagement` ne reçoit que « règles, sélections, rattachements, avec versions ».
  - `membre_groupe` est versionné par le **groupe** ; `appartenance_espace` est hors du périmètre.
  - Règles violées : DI-B41, DD-26.3 (« Si les engagements ont changé entre la présentation et l'acceptation, celle-ci est rejetée »), OB-28, CDCF § 128.
- **Scénario de violation :**
  1. Le cédant présente le transfert. L'engagement présenté est la règle `voir` sur l'espace au profit du groupe « Cousins » (3 membres).
  2. Avant l'acceptation, il ajoute 40 membres au groupe et deux appartenances `lecteur`.
  3. La version de la règle et les versions des sélections et rattachements sont inchangées. L'empreinte recalculée est donc identique, et l'acceptation passe.
  4. **Observé :** le cessionnaire hérite d'un partage dont l'audience a été multipliée par 14, sans nouvelle présentation.
- **Correction proposée :** inclure dans `transfert_engagement` :
  - les versions des groupes bénéficiaires (`engagement_type = GROUPE`) ;
  - les appartenances actives (ou leur empreinte) ;
  - les admissions (`regle_admission`).
  
  Recalculer l'empreinte sur cet ensemble.
- **Confiance :** élevée.

### AC-13 — CP-40 promet « aucune fenêtre » alors que CP-28 permet une réplique sans échéance, et un changement de `replication_hors_ligne` n'est jamais propagé

- **Gravité :** Majeur
- **Références :**
  - CP-40 : « Il n'existe donc aucune fenêtre où la base a enregistré la révocation tandis qu'un serveur accepterait encore l'ancienne autorisation ».
  - CP-28 : expiration locale seulement pour `limitée`.
  - `espace.replication_hors_ligne` : défaut `autorisée`, `duree_max_hors_ligne_jours` NULL.
  - Les listes de retraits de CP-28 et d'événements d'époque de CP-40 ne mentionnent pas la modification de `replication_hors_ligne` ni de `duree_max_hors_ligne_jours`.
  - Règles concernées : OB-20, DI-L19, CDCF § 122.2 et § 132, TECH-011.6 (« fenêtre de risque jusqu'à la reconnexion »).
- **Scénario de violation :**
  1. Un projet sensible garde le défaut `autorisée`. Le membre M réplique, puis ne se reconnecte jamais. Sa révocation n'a aucun effet sur l'appareil : la consultation hors ligne est illimitée.
  2. Le responsable passe ensuite l'espace à `interdite`. Ce n'est ni une révocation, ni une restriction d'objet, ni un événement d'époque : à la synchronisation suivante, aucun retrait n'est émis, et la réplique existante persiste.
- **Correction proposée :**
  1. Restreindre CP-40 aux décisions évaluées côté serveur, et reconnaître explicitement la fenêtre hors ligne (TECH-011.6).
  2. Imposer une `duree_max_hors_ligne_jours` par défaut pour les espaces `projet`, `organisation` et `communauté`.
  3. Ajouter la modification de la politique de réplication aux retraits de CP-28 et aux événements d'époque de CP-40.
- **Confiance :** élevée.

### AC-14 — Une contribution différée refusée reste lisible par son auteur alors que sa `charge` peut contenir le contenu retiré

- **Gravité :** Majeur
- **Références :**
  - `contribution_differee.charge json NN*` : « opération sérialisée (format patrimonial, ETAT_FIGE) ».
  - CP-27 : « Refusée pour raison de droits, elle reste lisible par son seul auteur ».
  - CP-28 : les contributions détachées « ne réexposent jamais le contenu retiré ».
  - Règles concernées : OB-20, DI-L19, P24.
- **Scénario de violation :**
  1. M corrige hors ligne une date de la personne P, partagée par sélection. Le client sérialise l'opération sous forme d'ETAT_FIGE, donc l'état complet de P avec toutes ses assertions.
  2. Le partage est révoqué. À la synchronisation, la contribution est refusée pour raison de droits.
  3. **Observé :** M relit indéfiniment, dans sa contribution refusée, l'état complet de P. **Attendu :** seule sa propre modification (le delta) reste lisible.
- **Correction proposée :** CP-27 : la `charge` ne contient que le delta saisi par l'auteur et les identifiants de base, jamais l'état de base. À défaut, une contribution refusée est servie à son auteur avec la partie héritée de la base retirée.
- **Confiance :** moyenne. Le format de `charge` n'est pas normé, mais la mention ETAT_FIGE l'autorise.

### AC-15 — Diffusions « visibles des administrateurs » incompatibles avec le CK de CP-26 ; invalidation automatique contraire à « acteur humain »

- **Gravité :** Majeur
- **Références :**
  - CP-35 : « Sa visibilité [de `diffusion`] est restreinte aux administrateurs de l'espace et aux participants du circuit éditorial ».
  - CK de `regle_acces` (CP-26) : une règle `autoriser` au profit du rôle `propriétaire` ou `administrateur` ne porte que sur `administrer`, qui « n'implique aucune autre action ».
  - CP-35 : « une `decision_editoriale` `approbation invalidée` est créée » automatiquement, alors que le même CP pose « Une `decision_editoriale` est prise par un acteur de `nature_acteur = personne`, jamais par une activité d'IA ». `decision_editoriale.acteur_id` est NN.
  - Règles concernées : DD-25.3, DI-P12, DI-P13.
- **Scénario de violation :**
  1. Pour réaliser CP-35, l'implémenteur crée la règle « rôle `administrateur` → `voir` » sur les diffusions : elle est rejetée par le CK.
  2. Sans cette règle, l'administrateur ne voit pas les diffusions (§ 22.2, étape 4), ce qui contredit CP-35.
  3. Une correction technique crée la version 3 d'une lettre. Le système doit créer une `approbation invalidée` avec un `acteur_id` humain, NN, sans que CP-35 dise lequel.
- **Correction proposée :**
  1. Soit `administrer` inclut la consultation des **métadonnées de gouvernance** (diffusions, règles, explication des accès), en le disant dans CP-26 et § 22.2 ; soit les diffusions sont lues par les seuls participants nommés du circuit éditorial.
  2. Pour l'invalidation : `acteur_id` = auteur de la version substantielle, ou colonne `origine ∈ {humaine, automatique}`, avec la règle « humain » limitée aux types `relue`, `approuvée` et `refusée` (conformément à DD-25.3, qui ne vise que l'approbation).
- **Confiance :** élevée.

### AC-16 — La réutilisation ouvre un partage transitif

- **Gravité :** Majeur
- **Références :**
  - CP-33 (Flux) : les copies `réutilisation` sont créées dans l'espace de l'acteur, avec une filiation.
  - DI-A37 : « l'objet dérivé porte la licence applicable à l'objet d'origine ».
  - Aucune CP ne confronte `objet.licence_code` (`licence.redistribution`, `modification`) à une inclusion dans une nouvelle `selection_partage`, à une `publication_exposition` ou à une `diffusion`. Seul `export_exclusion` cite le motif `licence`.
  - Règles violées : CDCF § 126.2 (« L'autorisation ne peut jamais dépasser les droits effectifs de celui qui partage. Il n'y a aucun partage transitif ») ; DI-B35 (« Le bénéficiaire ne peut repartager qu'avec une règle `repartager` explicite ») ; DI-A38.
- **Scénario de violation :**
  1. R autorise `réutiliser` sur S, avec une licence sans redistribution.
  2. Q copie S dans son arbre (filiation `réutilisation`). Les copies sont des objets de Q.
  3. Q crée sa propre `selection_partage` sur ces copies et la partage avec un troisième espace, ou les publie. CP-33 (Origine) n'exige que `repartager` **de Q sur ses propres objets**, ce qu'il détient.
  4. **Observé :** partage transitif d'éléments sous licence non redistribuable, sans `repartager` accordé par R.
- **Correction proposée :** ajouter une CP. Un objet issu d'une filiation `réutilisation` ne peut être inclus dans une sélection, une publication, une diffusion ou un export qu'en respectant `licence.redistribution`. Son repartage exige une règle `repartager` de l'espace d'origine.
- **Confiance :** moyenne. Le CDCF parle de partage « transitif » au sens des droits, et la copie est un objet autonome ; l'esprit de § 126.2 et de DI-B35 est néanmoins contourné.

### AC-17 — La déduplication intra-espace fusionne les fichiers de deux membres

- **Gravité :** Majeur
- **Références :**
  - `fichier` : `UQ (espace_id, empreinte)` ; CP-41 : « Un dépôt de même empreinte dans le même espace réutilise le `fichier` existant ».
  - La non-observabilité (DI-C22) ne vaut que « d'un espace à l'autre ».
  - `fichier` est `[T]` : il n'a ni visibilité ni règles propres.
  - Règles concernées : DI-C13, DI-C22, P19, OB-04, DD-13, CP-16.
- **Scénario de violation :**
  1. Dans le projet P, A dépose en reproduction `privé` le scan de l'acte X. B, autre membre, dépose le même scan.
  2. CP-41 rattache la reproduction de B à la ligne `fichier` de A. B observe `date_depot` antérieure, un envoi instantané et un quota non décompté : il apprend qu'un autre membre détient ce document en privé.
  3. A obtient la purge légale de sa reproduction. CP-16 purge la ligne `fichier` (`est_purge`, `cle_stockage` retirée), qui est aussi celle de B : le fichier légitime de B disparaît. À l'inverse, si la purge est empêchée, la demande de A n'est pas satisfaite.
- **Correction proposée :** limiter la déduplication au même **déposant** (ou au même objet), ou étendre à l'intérieur d'un espace la règle de non-observabilité de CP-41, avec des `fichier` logiques distincts par dépôt et une mutualisation seulement physique (`cle_stockage`).
- **Confiance :** moyenne. Le défaut vient du dictionnaire (DI-C13), et le MLD le réalise fidèlement.

### AC-18 — `export_exclusion` consigne les objets à existence protégée dans l'export même de l'acteur visé

- **Gravité :** Majeur
- **Références :**
  - `export_exclusion [N]` : (`export_id`, `objet_id`, `motif` ∈ {…, `existence protégée`}), « confidentialité I ».
  - Dictionnaire § 1.4, code I : « visible uniquement du titulaire et des fonctions habilitées ».
  - `export.acteur_id` est le titulaire de l'export.
  - Règles concernées : DI-B12, TI-11, OB-04, MLD-14.
- **Scénario de violation :**
  1. L'acteur E exporte son projet. Un témoignage T est sous protection d'existence vis-à-vis de E.
  2. La ligne (`export_E`, T, `existence protégée`) est écrite, rattachée à un objet dont E est le titulaire.
  3. Selon la lecture de « I », E (titulaire) peut la consulter. Dans tous les cas, le personnel habilité apprend que T est caché à E, information qui n'est pas nécessaire.
- **Correction proposée :** ne jamais écrire d'exclusion de motif `existence protégée`. Pour la reproductibilité, ne stocker qu'un compteur interne non nominatif, ou une empreinte salée par l'espace porteur, conservée côté espace porteur, pas côté export. Préciser que le « titulaire » d'une donnée I d'un export n'est pas l'exportateur.
- **Confiance :** moyenne (dépend de l'interprétation de « titulaire »).

---

## 2. Fidélité scientifique

### AC-19 — `assertion.temps` n'admet qu'un `DATE_HIST` : la `PERIODE_HIST` du dictionnaire est aplatie

- **Gravité :** Majeur
- **Références :**
  - Table `assertion` : `⟨dh temps⟩`, un seul groupe de six colonnes.
  - Dictionnaire § 9.1 : `temps_historique` est de type « `DATE_HIST` ou `PERIODE_HIST` », 0..1. Le profil `SITUATION` dispose seul de début et de fin (`assertion_situation`).
  - Règles violées : G.3 / MLD § 0.4 (« aplatir `DATE_HIST` »), DD-10, OB-19, P4.
- **Scénario de violation :**
  1. Assertion de profil `présence` : « présent à Dolé de vers 1790 à avant 1810 ».
  2. Le seul groupe disponible impose soit `type = intervalle`, `min = 1790-01-01`, `max = 1809-12-31`, soit une seule borne. La sémantique « date ponctuelle quelque part dans [min, max] » (DATE_HIST `intervalle`) se confond avec « valable pendant toute la période ».
  3. L'incertitude propre à chaque borne (« vers 1790 », « avant 1810 ») est perdue.
  4. Même cas pour une participation à un événement long ou pour un attribut daté par période (« profession de 1820 à 1830 »).
- **Correction proposée :** ajouter à `assertion` un second groupe (`⟨ph temps⟩`, ou `temps_fin_*`) avec un discriminant `temps_forme ∈ {date, période}` et le CK correspondant. Aligner les requêtes indexées de MPD-01 (`temps_min`, `temps_max`).
- **Confiance :** élevée sur l'écart. Moyenne sur l'impact pratique, si le référentiel des prédicats oriente toutes les périodes vers le profil `situation`.

### AC-20 — DI-A30 (« acquisition jamais amont d'une justification ») n'a aucune réalisation

- **Gravité :** Majeur
- **Références :**
  - MLD § 24 : « une acquisition n'est jamais amont d'une justification (DI-A30, CP-07) ».
  - Le texte de CP-07 ne cite que narration, badge et lien exploratoire (DI-A16, DI-G13) ; sa colonne Origine ne contient pas DI-A30.
  - Matrice § 25.4 : « DI-A30 | §24. | citée ».
  - `dependance.amont_id → objet(id)` n'a aucune restriction de type.
  - Règles violées : DI-A30, P17, P18, G.3 (« confondre acquisition, production et justification »).
- **Scénario de violation :**
  1. Un import GEDCOM crée `ACQUISITION_INFORMATION` AQ1.
  2. Un utilisateur crée une `dependance` (aval = conclusion C, amont = AQ1, `categorie = justification`, rôle probatoire « principal »), puis une `base_justificative` publique qui l'invoque.
  3. Aucun CK ni aucune CP ne la rejette. « Importé de Geneanet » devient la preuve de C.
- **Correction proposée :** ajouter DI-A30 à CP-07, avec la règle « `categorie = justification` ⇒ type de l'amont ∉ {ACQUISITION_INFORMATION, ACQUISITION_DOCUMENTAIRE, BADGE, NARRATION, LIEN_EXPLORATOIRE} ». Mieux : ajouter `amont_type` et une FK composite vers `objet(id, type_objet)` pour rendre la règle déclarative.
- **Confiance :** élevée.

---

## 3. Cardinalités et clés

### AC-21 — Quinze cardinalités minimales (1,n) ne sont contrôlées par aucune contrainte

- **Gravité :** Majeur
- **Références :**
  - MLD-10 : « `1..n` contrôlé par CP-05 en fin de transaction ».
  - La liste de CP-05 ne couvre pas les cardinalités suivantes du dictionnaire :

    | Association | Cardinalité minimale non contrôlée |
    |---|---|
    | DECRIRE_ETAT | REFERENCE_INTER_ESPACE (1,n), « au moins l'état `active` initial » |
    | INVOQUER_PREUVE | BASE_JUSTIFICATIVE (1,n) |
    | ACQUERIR_DOC | ACQUISITION_DOCUMENTAIRE — OBJET (1,n) |
    | STOCKER | REPRODUCTION (1,n) |
    | DECOMPOSER | REPRODUCTION (1,n) |
    | SEGMENTER | TRANSCRIPTION (1,n) |
    | ETAPE | VOYAGE (1,n) |
    | STRUCTURER | RECONSTRUCTION (1,n) |
    | DEFINIR | PROTOCOLE (1,n) |
    | CONTENIR_SNAP | SNAPSHOT (1,n) |
    | PRODUIRE_RESULTAT | CALCUL (1,n) |
    | EXPOSER | PUBLICATION (1,n) |
    | CONTENIR_EXPORT | EXPORT (1,n) |
    | CONTENIR_CAPSULE | (1,n) ; le commentaire de `capsule_contenu` l'affiche, sans CP |
    | `OFFRE_DEPLACEMENT.categories_acceptees` | 1..n |

- **Scénario de violation :**
  1. Création d'une `base_justificative` `en vigueur`, de portée `publique`, sans aucune ligne `base_justificative_preuve`.
  2. L'objet justifié affiche une base publique « en vigueur » qui n'invoque rien : une justification vide présentée comme établie (P17).
  3. Variantes : un export dont le manifeste est vide mais l'empreinte publiée ; une `reference_inter_espace` sans état initial, dont `etat_courant` (dérivé, CP-10) n'est alors pas calculable.
- **Correction proposée :** compléter CP-05 avec ces quinze cardinalités. Pour les conteneurs à jalons (transcription, protocole, snapshot), préciser si le minimum s'applique au premier jalon plutôt qu'à la création.
- **Confiance :** élevée.

### AC-22 — Des unicités non partielles comptent les lignes purgées ou supprimées

- **Gravité :** Majeur
- **Références :**
  - Unicités sans filtre de purge sur des tables d'objets dont les lignes ne sont jamais supprimées (MLD-15) :
    - `noeud_arbre UQ (arbre_id, personne_id)` ;
    - `candidature UQ (position_id, entite_id)` ;
    - `selection_contexte UQ (…)` ;
    - `page UQ (exemplaire_id, rang)`, `segment UQ (transcription_id, rang)`, `vue UQ (reproduction_id, rang)`, `etape_voyage UQ`, `item_mission UQ`, `critere_protocole UQ`, `echange UQ`.
  - `identifiant_documentaire` : `UQ (porteur_id, coalesce(institution_emettrice,'')) WHERE type = 'cote actuelle' AND date_fin_type IS NULL`.
  - Règles concernées : DI-L04, DI-F07, DI-F14, DI-C08 et DI-C09, CP-16, DD-13.
- **Scénario de violation :**
  1. **Ligne purgée qui bloque.** La purge légale d'un nœud d'arbre (personne P dans l'arbre T) laisse la ligne avec ses clés. La personne ne peut plus jamais être rajoutée à T, ni sous une nouvelle personne si le rattachement est figé, ni après correction. Idem pour une candidature purgée, dont l'entité ne peut plus être candidate à la position.
  2. **Purge qui rentre dans le prédicat.** Une ancienne cote, close conformément à DI-C09 (`type = cote actuelle`, `date_fin` renseignée, institution « AD971 »), est purgée. Ses colonnes de contenu `date_fin_*` et `institution_emettrice` passent à NULL, tandis que `type` (NN) reste.
  3. La ligne purgée satisfait alors le prédicat `date_fin_type IS NULL` avec `coalesce = ''`. Elle entre en conflit avec la cote actuelle vivante du même porteur, si celle-ci est sans institution : la purge échoue, ou bloque toute future cote sans institution.
- **Correction proposée :**
  1. Ajouter `AND NOT est_purge` (et, si nécessaire, `etat_cycle_vie <> 'supprimé'`) à toute unicité d'une table d'objet. Rendre partielles les UQ aujourd'hui inconditionnelles.
  2. Ne jamais fonder un prédicat d'unicité partielle sur une colonne purgeable.
- **Confiance :** élevée.

---

## 4. Historisation et purge

### AC-23 — CP-22 permet d'insérer une association dans une version existante

- **Gravité :** Majeur
- **Références :**
  - CP-22 : « `v_debut` = version courante du propriétaire à l'insertion ; retrait = `v_fin` ».
  - CP-01 : sa portée se limite à « Toutes tables `[V]`, `[F]`, `[L]` ». Les tables `[A:p]` n'en font pas partie.
  - § 21.1, étape 5 : l'insertion se fait dans la séquence qui crée une **nouvelle** version.
  - Macro `⟨VA p⟩` : `CK v_fin > v_debut`.
  - Règles violées : P3, P4, TI-01, DI-A07, DD-01.5 (« Une version déjà référencée n'est jamais compactée ni supprimée »), empreinte d'état (MLD-02).
- **Scénario de violation :**
  1. Le groupe G est en version 5, citée par une `transfert_engagement` et par une décision d'accès.
  2. L'ajout du membre M dans `membre_groupe` avec `v_debut = 5` est conforme à CP-22 et ne crée pas de version 6.
  3. **Observé :** l'état figé de la version 5 change après coup. `empreinte_etat` de la version 5 devient fausse, et « qui était membre de G à la version 5 ? » donne une réponse différente avant et après l'insertion.
  4. Retirer M dans la même version (`v_fin = 5`) viole le CK `v_fin > v_debut`. Il faut donc soit une nouvelle version, ce qui contredit la lecture « version courante », soit une suppression, interdite.
- **Correction proposée :** CP-22 : « toute insertion ou clôture d'une ligne `[A:p]` crée une nouvelle version du propriétaire (§ 21.1) ; `v_debut` et `v_fin` valent ce nouveau numéro ». Étendre CP-01 aux tables `[A:p]`.
- **Confiance :** élevée.

### AC-24 — Des colonnes de contenu déclarées `NN` (et non `NN*`) empêchent la purge exigée par DD-27 et MLD-10

- **Gravité :** Majeur
- **Références :**
  - MLD-10 : « toute colonne qui n'est ni clé, ni discriminant, ni code de gouvernance, ni horodatage système est purgeable. C'est pourquoi les obligations `1` de ces colonnes sont écrites `CHECK (est_purge OR …)` plutôt que `NOT NULL` ».
  - Contre-exemples dans des tables d'objets :
    - `consentement.texte_version text NN` (confidentialité R) ;
    - `operation_flux.autorisation text NN` ;
    - `intervention_mission.perimetre_acces text NN` ;
    - `acte_evaluation.processus_applicable text NN` ;
    - `badge.libelle` et `critere_ou_procedure text NN` ;
    - `concept.libelle` et `definition text NN`, `referentiel.nom text NN` ;
    - `usage_terme.sens text NN`, `regroupement_traces.code text NN`, `alignement_reproduction.transformation text NN`, `comparaison.perimetre text NN`.
  - Codes de contenu NN conservés après purge : `personne.regime_protection` et `mineur_protege`, `consentement.portee`/`decision`/`mode_recueil`, `reponse.etat_memoire`, `interaction.type` (« note privée »).
  - Règles violées : DD-27.1 (« aucun attribut de contenu »), OB-12, OB-32, CP-16.
- **Scénario de violation :**
  1. Purge légale d'un consentement de biométrie retiré. `texte_version` ne peut pas être mis à NULL (NN). La purge échoue, ou laisse le texte du consentement intact.
  2. La purge d'une personne laisse `mineur_protege = vrai`, ce qui confirme publiquement, sur la tombstone, qu'il s'agissait d'un mineur.
- **Correction proposée :** passer en `NN*` toutes les colonnes de contenu des tables d'objets, sans exception. Lister explicitement les codes « de gouvernance » conservés après purge (`etat_cycle_vie`, `visibilite`…) et exclure de cette liste `regime_protection`, `mineur_protege` et les codes de consentement.
- **Confiance :** élevée pour les colonnes texte. Moyenne pour les codes, selon la lecture de « code de gouvernance ».

### AC-25 — L'effacement de résolution (DD-27.3, CP-16) est irréalisable

- **Gravité :** Majeur
- **Références :**
  - CP-16 : « `espace_id` est remplacé par l'espace technique neutre "purgé", `date_creation` est vidée et les lignes `version_objet` ne gardent que le numéro ».
  - `version_objet` : `date_debut_validite NN`, `nature_changement NN`, `activite_id NN` (FK), `empreinte_etat NN`, `CK (numero = 1) = (nature_changement = 'création')`.
  - `activite [N]` (journal non purgé) : `date_debut NN`, `acteur_id`.
  - DD-02 : identifiant en UUID v7 (« ordonné dans le temps »), « ne code ni type, ni espace, ni date métier ».
  - Règles violées : DD-27.3 (« rattachement à l'espace, date de création et numéros de versions sont effacés »), OB-32.
- **Scénario de violation :**
  1. Effacement de résolution du témoignage T, sur fondement légal.
  2. `version_objet` ne peut pas vider ses colonnes NN. Elle garde la date de validité de la version 1, c'est-à-dire la date de création, et `activite_id`.
  3. L'activité garde `acteur_id` et `date_debut`, ce qui donne la date de création et l'auteur.
  4. L'identifiant UUID v7 encode lui-même l'horodatage de création à la milliseconde.
  5. Les objets de l'espace d'origine qui référencent T (FK `assertion.sujet_id`, `noeud_arbre`, `dependance`) restent dans cet espace et désignent indirectement le rattachement effacé.
- **Correction proposée :**
  1. Rendre nullables, sous condition `objet.resolution_effacee`, les colonnes de `version_objet` ; supprimer ou neutraliser le CK sur le numéro 1.
  2. Ajouter à CP-16 la neutralisation des `activite` qui n'ont produit que des versions de l'objet effacé.
  3. Remplacer l'UUID v7 par un identifiant opaque (v4) pour les objets, ou documenter que l'horodatage de l'identifiant est une donnée conservée et l'exclure de DD-27.3.
- **Confiance :** élevée.

### AC-26 — DI-B05 est irréalisable ; DI-B08 est perdu après purge

- **Gravité :** Majeur
- **Références :**
  - `compte.email text NN`.
  - FK RESTRICT vers `compte` depuis des tables d'objets jamais supprimées physiquement : `workspace.compte_id`, `inbox_item.compte_id`, `veille.compte_id`, `lien_compte_personne.compte_id`, ainsi que `abonnement.titulaire_compte_id`.
  - MLD-15 : « coordonnées du compte supprimées physiquement ».
  - `acteur_geniius` : `UQ (lower(pseudonyme)) WHERE pseudonyme IS NOT NULL`, et `pseudonyme` est purgeable dans la table courante comme dans `_hist`.
  - Règles violées : DI-B05 (« La suppression d'un compte purge `identite_civile`, `email` »), DI-B08 (« jamais réattribué »).
- **Scénario de violation :**
  1. Suppression du compte K. La ligne `compte` ne peut pas être supprimée, puisque le workspace purgé la référence encore (RESTRICT). Elle ne peut pas non plus perdre son `email` (NN). DI-B05 est inapplicable.
  2. Purge de l'acteur « ArchivesDeshaies ». Le pseudonyme est vidé partout, et l'UQ partielle ne le protège plus. Un autre acteur peut prendre « ArchivesDeshaies », et CP-06 n'a aucune trace pour s'y opposer.
- **Correction proposée :**
  1. `compte.email` devient nullable sous condition (`etat_compte = 'supprimé' OR email IS NOT NULL`).
  2. Les FK des objets personnels pointent vers `acteur_geniius` ou vers l'espace personnel, et non vers `compte`.
  3. Ajouter un registre `pseudonyme_reserve [T]`, avec l'empreinte normalisée du pseudonyme, non purgeable, non réversible si besoin.
- **Confiance :** élevée.

### AC-27 — Les attributs figés (F), dont `objet.espace_id`, ne sont protégés par aucune contrainte

- **Gravité :** Majeur
- **Références :**
  - DI-A01 : « ce rattachement est figé : changer de régime crée un nouvel objet et une `FILIATION` ». La matrice § 25.4 donne « DI-A01 | `objet` | citée » : seul un commentaire existe.
  - CP-03 ne traite que des transitions d'état.
  - Autres attributs `F` du dictionnaire non protégés : `espace.type_espace`, `acteur_geniius.nature_acteur`, `assertion.nature`, `operation_flux.type`, `selection_partage.type_selection`, `reference_persistante.mode`/`identifiant`, `fichier.format`/`taille`/`date_depot`…
  - Règles violées : DI-A01, P7, DD-27 (seul l'effacement de résolution peut modifier `espace_id`).
- **Scénario de violation :**
  1. Une nouvelle version de l'objet O (privé, espace personnel) change `espace_id` vers un projet. CP-01 est respecté (nouvelle version), et aucune contrainte ne s'y oppose.
  2. L'objet change de régime de droits sans filiation. L'historique dit qu'il « a toujours été » le même objet, en violation de P7.
  3. Une `assertion` passe de `nature = attestée` à `dérivée` par nouvelle version, ce qui réécrit son statut d'origine.
- **Correction proposée :** ajouter une CP « attributs figés ». Toute colonne marquée F dans le dictionnaire est égale, dans toute nouvelle version, à sa valeur de la version 1, sauf purge et effacement de résolution. La liste des colonnes est générée depuis le dictionnaire.
- **Confiance :** élevée.

---

## 5. Contraintes, transitions d'état, réalisation des règles DI

### AC-28 — Neuf lignes « citées » de la matrice § 25.4 ne sont que partiellement réalisées

- **Gravité :** Mineur. Pris ensemble, ces écarts mettent en défaut l'affirmation « aucune n'est sans réalisation ».
- **Références et contre-exemples :**

  | Règle | Réalisation affichée | Ce qui manque | Contre-exemple |
  |---|---|---|---|
  | DI-A10 | `activite` | « les versions produites ont `etat_examen` ∈ {détecté, préstructuré automatiquement} » | Une activité `ia_generative` produit une version d'assertion `etat_examen = examiné` sans intervention humaine |
  | DI-A12 | `activite` | « aucun attribut R ou I ne figure dans le périmètre » ; `perimetre_donnees_transmises` est un texte libre | Envoi de `lieu_texte` (R) d'une session de mémoire à un prestataire externe, accepté |
  | DI-A37 | CP-33, `filiation` | La réutilisation exige un flux de type `réutilisation d'une sélection`. Le CK accepte `import_id` seul | `filiation` `réutilisation` avec `import_id` et sans flux |
  | DI-B09 | CP-44 | CP-44 ne traite que la vue, pas l'interdiction d'agir | Activité créée par un acteur sans compte actif, acceptée |
  | DI-B18 | § 22.3 | Aucune colonne d'effectif ; le CK ne borne pas la décision à `autorisation requise` | `evaluation_diffusabilite` `diffusable` pour un agrégat de 2 personnes |
  | DI-C15 | `zone` | Rien n'interdit une géométrie pour une `plage temporelle` (`polygone_image`, `x` seul) | Zone `plage temporelle` avec `polygone_image` renseigné |
  | DI-K11 | `recherche_effectuee` | « DI-K11 : application » ; rien n'identifie une recherche nominative | Recherche nominative sans `termes_et_variantes` |
  | DI-K12 | CP-20, `intervention_mission` | `perimetre_acces` est un texte libre, d'où aucune règle d'accès ne peut être dérivée mécaniquement | Le périmètre « registres 1840-1850 » ne désigne aucun objet cible |
  | DI-K18 | `regle_methodologique` | « adoptant humain » non vérifié (`nature_acteur = personne`) | Règle adoptée par un acteur `organisation` ou technique |

- **Correction proposée :** pour chaque règle, une CP explicite (ou un CK). Requalifier dans § 25.4 les lignes concernées en « partielle ».
- **Confiance :** élevée.

### AC-29 — `DECIDER_RATTACHEMENT` (0,2) contredit CP-31

- **Gravité :** Mineur
- **Références :**
  - Dictionnaire : « DECIDER_RATTACHEMENT † | RELIER_PROJETS (0,2) ».
  - CP-31 : deux décisions `acceptée`, puis une décision `terminée` d'une partie, donc au moins trois lignes ; voire quatre si les deux parties décident `terminée`, ce qu'autorise « au plus une décision `acceptée` non suivie d'une `terminée` par partie ».
  - `decision_rattachement PK (relation_projets_id, partie, date)` ne borne rien.
- **Scénario :** un rattachement actif puis terminé porte trois décisions, au-delà de la cardinalité maximale (2) du dictionnaire.
- **Correction proposée :** corriger le dictionnaire en (0,n), ou séparer la « terminaison » de DECIDER_RATTACHEMENT.
- **Confiance :** élevée.

### AC-30 — `acces()` est déclaré seule source de décision, mais n'intègre ni CP-19 ni DI-J09

- **Gravité :** Mineur
- **Références :**
  - CP-40 : « `acces()` (§ 22.2) est la seule décision ».
  - Les étapes 1 à 6 du § 22.2 n'incluent ni la lecture aveugle (CP-19, DI-D02) ni la phase indépendante d'une campagne (§ 22.3, DI-J09).
  - Dans une campagne, les participants sont des `personne` (`campagne_personne.personne_id`), alors que le contrôle d'accès porte sur des acteurs. Le passage de l'un à l'autre exige `lien_compte_personne` (R) et `lien_compte_acteur` (I).
- **Scénario :** un participant qui répond par son acteur, sans `lien_compte_personne` vérifié, n'est pas reconnu comme participant. Il voit les réponses des autres pendant la phase indépendante.
- **Correction proposée :** ajouter une étape 1 bis « cloisonnements temporaires (CP-19, DI-J09) » et une association `campagne_participant_acteur`.
- **Confiance :** moyenne.

### AC-31 — L'amorçage du Core et CP-23 sont incompatibles

- **Gravité :** Observation
- **Références :**
  - § 20.2, Amorçage : activité « `création` de mode `automatique` » dans le Core partagé.
  - CP-23 : « Une activité qui crée un objet sans acteur est rejetée […] à défaut au propriétaire de l'espace cible ».
  - DI-B04 : le Core n'a pas de propriétaire.
  - Défaut `visibilite = 'privé'`.
- **Constat :** l'amorçage est soit rejeté, soit rattaché à un acteur non spécifié qui recevrait des règles CP-23 sur l'ensemble du référentiel commun.
- **Correction proposée :** désigner un acteur institutionnel d'amorçage et une visibilité explicite des concepts du Core, sans règle CP-23.
- **Confiance :** élevée.

### AC-32 — « Faire remonter les indicateurs qu'il autorise » (CDCF § 120.2) n'a pas d'action dédiée dans D-10

- **Gravité :** Observation
- **Références :** CDCF § 120.2 ; D-10 (MCD) ; CP-34 (calcul sur le graphe accessible du lecteur).
- **Constat :** pour qu'un programme obtienne un indicateur sur un sous-projet privé, ce dernier doit soit accorder `voir`, ce qui ouvre le contenu, soit publier un résultat figé (DI-O17). Aucune action « agréger » ou « compter » ne permet un indicateur sans lecture. La voie « publication figée » est praticable, mais elle n'est pas décrite comme la réalisation de § 120.2.
- **Correction proposée :** documenter la voie « résultat publié » comme réalisation de § 120.2, ou ajouter l'action `agréger` (graphe accessible restreint au comptage, avec seuil de petit effectif).
- **Confiance :** moyenne.

---

## 6. Vérifications sans anomalie (couverture de l'audit)

| Point vérifié | Contre-exemple tenté | Résultat |
|---|---|---|
| Aucune colonne de fait sur `personne` (P1, MLD-09) | Chercher nom, sexe, date ou profession sur `personne` et `entite_historique` | Absentes ; `regime_protection` est admis par P1 |
| `DATE_HIST` : « vers 1840 » non stockable comme date unique | `type = vers`, `min = max` | Rejeté par `CK x_min < x_max` |
| Trois tables distinctes pour filiation, référence et rapprochement (G.3, P15) | Chercher une table générique « lien vers » | Aucune |
| Compte, acteur et personne distincts (P16) | Chercher des attributions pointant vers `compte` | Toutes pointent vers `acteur_geniius` (hors objets personnels, voir AC-26) |
| `nature = dérivée` ⇔ `calcul_id` (DI-G03, P6) | Assertion dérivée sans calcul | Rejetée par le CK |
| Approbation éditoriale ≠ validation scientifique (DI-P13) | FK de `decision_editoriale` vers `acte_evaluation` | Aucune ; `statut_validation` ne dérive que d'`acte_evaluation` (CP-10) |
| Axe de projet ≠ relation historique (DI-K25, CDCF § 121.2) | `etudier` créant une assertion | `etudier` est un lien ; CP-38 interdit toute écriture induite |
| Prise en charge sans effet sur les droits (RG-B15, P25) | FK de `regle_acces`, `appartenance_espace`, `acte_evaluation` ou `badge` vers `prise_en_charge` | Aucune |
| Rattachement non source de droit (P23, DI-K23) | `acces()` lisant `relation_projets` | Exclu (§ 22.2) ; seule `regle_acces.rattachement_id` fixe une fin (voir AC-01 pour la création des règles) |
| Assignation de tâche sans droit (DI-K28) | Règle dérivée d'une `tache_assignation` | Interdite (CP-32) |
| Délégation par lot bornée (DI-K29) | Règle `tache_lot_id` portant `valider` ou sans `date_fin` | Rejetée par le CK |
| Réouverture d'un lot (DI-K30) | Réactivation des délégations | Exclue (CP-32) |
| Accès exceptionnel journalisé (DI-B30) | Usage d'une règle exceptionnelle sans finalité | Rejeté par le CK de `contexte_evaluation` |
| Règle « les administrateurs voient tout » par rôle (DI-B29) | Rôle `administrateur` → `voir` | Rejetée par le CK (contournement par d'autres voies : AC-01) |
| Opérations longues et pagination après révocation (CP-40) | Page suivante d'une requête lancée avant la révocation | Revérifiée à chaque page ; export partiel interdit |
| Échec d'évaluation (fail closed) | Délai dépassé ou époque inconnue | Refus, indistinguable d'une absence |
| Mutualisation des fichiers entre espaces (DI-C22) | Détecter « déjà présent » depuis un autre espace | Non observable selon CP-41 (problème intra-espace : AC-17) |
| Un seul Core partagé (DI-B01) | Deuxième espace `Core partagé` | Rejeté par l'UQ partielle |
| Espace personnel `privé` (DI-B02, DI-B03) | `visibilite_max` public sur un espace personnel | Rejeté par le CK |
| Révocation de groupe (DI-B37) | Membre sorti du groupe gardant ses droits | Retrait à l'évaluation suivante, époque incrémentée (CP-30, CP-40) |
| Exclusions de sélection confidentielles (DI-L16) | Destinataire lisant `selection_exclusion` | Confidentialité I, jamais servie (MLD-16) |
| Indicateur multi-projets (DI-O16) | Somme naïve des sous-projets | Dédoublonnage imposé par CP-34 |
| ARK seulement à la publication (DI-A35) | ARK attribué à un objet privé | CP-17 |
| Macros `⟨VA p⟩` | Sur environ 48 des 70 tables `[A:p]` du schéma, vérifier que `p_id` existe et que la FK vise `version_objet` (ou `lien_version` pour `utiliser_role`) | Cohérentes |
| Diffusion non rappelable (DI-P17) | Modification d'une `diffusion` | Table `[F]` ; CP-35 |
| Notification hors graphe (DI-Q05) | Notification d'un événement inaccessible | Exclue (§ 22.3) |

**Échantillon de la matrice § 25.4 (64 lignes, dont 58 « citées »).**

- **Réalisation conforme vérifiée dans les DDL :** DI-A08, A11, A13, A14, A15, A19, A20, A26, A31, A34 ; B10, B17, B19, B27, B29, B30, B36 (CK) ; C08 (hors purge, voir AC-22), C10, C16, C17, C20 ; D01, D05, D08 ; E07 ; F01, F07, F08, F14, F16 ; G03, G06 ; H03 ; I06 ; J04, J05, J08, J11 ; K01, K08, K22, K24, K29 ; L02, L04, L20 ; M03 ; N02 ; O01, O02, O03, O08 ; P10, P12, P16 ; Q04 ; R01.
- **Réalisation absente, partielle ou contradictoire :**
  - DI-A01 (AC-27) ;
  - DI-A10, A12, A37, B09, B18, C15, K11, K12, K18 (AC-28) ;
  - DI-A30 (AC-20) ;
  - DI-B05, B08 (AC-26) ;
  - DI-B21 (AC-04) ;
  - DI-B41 (AC-12) ;
  - DI-B42 (AC-02) ;
  - DI-L15 (AC-10) ;
  - DI-L16 (AC-06, AC-07) ;
  - DI-P13 et CP-35 (AC-15).
