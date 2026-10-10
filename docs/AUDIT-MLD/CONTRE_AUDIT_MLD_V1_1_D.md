# Contre-audit des corrections V1.1-d du MLD

- **Date :** 10 octobre 2026
- **Objet :** vérifier si les corrections marquées [V1.1-d] dans le MLD lèvent les constats AC-01 à AC-32 du premier audit contradictoire, sans en introduire de nouveaux.
- **Documents consultés (et seulement ceux-là) :**
  - `docs/GENIIUS_MLD_V1_0.md` (MLD V1.1-d) : § 2 (MLD-10, MLD-15, MLD-16, MLD-18), DDL des § 4, 5, 6.2, 6.3, 9, 10.1, 13, 14, 15, 19, § 21, § 22, § 24, § 25.4 ;
  - `docs/geniius_io_DICTIONNAIRE_DONNEES_V1.md` (V1.3 candidat) : DD-13, DD-21 à DD-28, § 3.8, § 4.4 à 4.14, § 14.6 (sélection), règles DI citées, annexe C.7 ;
  - `docs/geniius_io_CDCF_V1.md` : § 49.2, § 120.2, § 126.1, § 126.2 (consultation ciblée) ;
  - `docs/geniius_io_MCD_V1.md` : domaine D-09 seulement ;
  - `docs/AUDIT-MLD/AUDIT_CONTRADICTOIRE_MLD_V1_1.md` : constats et scénarios d'origine.
- **Documents non ouverts (conformément à la consigne) :** l'instruction de l'auteur, `AUDIT-COHERENCE/`, `AV-FONC/`, `archives/`, rapports de réexécution, `GENIIUS_DICTIONNAIRE_REC16_*`, registre des versions normatives. Git n'a pas été utilisé. Le CDC technique n'a pas été rouvert.
- **Méthode :**
  1. Pour chaque constat ciblé, relecture du scénario d'origine, puis rejeu contre les contraintes **telles qu'elles sont rédigées** (NN, UQ, FK, CK du DDL et texte des CP). Un texte de correction qui existe ne suffit pas : le constat n'est levé que si le scénario d'origine **et** au moins une variante ne passent plus.
  2. Pour les autres constats, vérification sommaire de la correction, puis recherche des défauts qu'elle introduit : contradictions entre CP, entre CK et CP, entre MLD et dictionnaire ; contournements de l'accès ; fuites « absent / caché » ; pertes de garanties.
  3. Les mentions de l'auteur (« corrigée », « Réalisée et vérifiée », bilans du § 25.4) n'ont pas été prises pour preuves.
  4. Échantillon de **78 lignes** du § 25.4 : 45 « Réalisée et vérifiée » et 33 « Réalisée (corrigée V1.1-d) ».
- **Limites :**
  - Aucune exécution : les scénarios sont des raisonnements sur le schéma.
  - Les DDL des domaines D, H, I, M, N, O, Q et R n'ont été lus que là où une correction les touchait.
  - Le MCD n'a pas été relu, hormis D-09. Les règles RG-* ne sont connues que par le dictionnaire.
  - Les lignes « Réalisée » (non revérifiées par l'auteur) n'ont pas été échantillonnées.
  - Dans plusieurs cas, le verdict dépend de la lecture de « `administrer` sur la cible » pour une cible objet : la matrice DD-28.3 n'accorde `administrer` que « sur l'espace ». Les deux lectures sont examinées quand elles changent le résultat.

---

## Synthèse

| Ensemble | Levé | Partiellement levé | Non levé |
|---|---|---|---|
| Constats ciblés (11) | 2 (AC-06, AC-23) | 9 (AC-01, 02, 03, 04, 05, 07, 10, 11, 28) | 0 |
| Autres constats (21) | 15 (dont AC-26 avec une régression mineure) | 6 (AC-09, 12, 13, 22, 25, 30) | 0 |

**Nouveaux constats :** 2 bloquants, 5 majeurs, 7 mineurs, 1 observation (NC-01 à NC-15).

**Point principal.** Les corrections de l'accès créent deux voies d'auto-habilitation nouvelles, plus simples que celles de l'audit d'origine :
- **NC-01 :** une règle de `nature = propriétaire` peut être créée à tout moment par un acteur pour lui-même ;
- **NC-02 :** `administrer` suffit pour accorder une lecture que l'auteur ne détient pas, et l'auto-ajout à un groupe n'est pas interdit.

Le cœur de AC-01 (un administrateur sans lecture qui finit par lire des contenus `projet` ou `privé`) reste donc reproductible.

---

## Tableau 1 — Constats ciblés

| ID | Verdict | Scénario rejoué | Variante tentée | Justification (références) |
|---|---|---|---|---|
| AC-01 | **Partiellement levé** | **Voie A** (X, administrateur seulement, s'inscrit `lecteur`) : bloquée par CP-48, puce « Pas d'auto-habilitation ». **Voie B** (règle `voir` nominative au profit de X) : bloquée par le CK de `regle_acces` (l. 801-802). **Voie C** (le programme crée une règle sur un sous-projet) : bloquée par CP-48, puces 1 et 2, et DD-28.1. | **(1)** X crée un groupe G dans P et s'y ajoute (`membre_groupe` : CP-48 lui donne l'autorité ; ni CP-48 ni DD-28.2 n'interdisent de s'ajouter soi-même à un groupe). Il crée ensuite une règle `voir` sur l'espace P au profit de G. Le CK ne joue pas (`type_beneficiaire <> 'acteur'`) ; X lit les objets `projet`. **(2)** X crée une règle `voir` de nature `propriétaire` à son profit sur un objet `privé` (voir NC-01). **(3)** X ouvre au rôle `lecteur` ou au `public` un objet `privé` d'un membre, sans détenir lui-même `voir` (voir NC-02). | Les voies d'origine sont fermées. En revanche, CP-48 et DD-28.1 fondent l'autorité sur la seule possession d'`administrer`, sans exiger que l'auteur détienne l'action qu'il accorde. La borne « auteur » de DI-B35 n'est appliquée qu'aux sélections (CP-29 ; § 22.2, précisions de l'étape 3). L'interdiction d'auto-habilitation ne couvre ni `membre_groupe` ni les bénéficiaires `groupe`, `rôle d'espace` ou `public`, et elle exempte la nature `propriétaire`. La matrice des rôles par défaut (DD-28.3, CP-48, étape 4) règle bien le corollaire 6 d'origine. Voir NC-01 et NC-02. |
| AC-02 | **Partiellement levé** | C crée l'espace, reçoit (`propriétaire`, `responsable scientifique`) et 400 règles CP-23, puis le transfert est accepté. CP-37 clôt désormais toutes ses appartenances, attributions et règles nominatives. Scénario d'origine bloqué. | **(1)** Avant le transfert, C est membre (ou se rend membre, voir NC-02) du groupe « Famille » de l'espace, bénéficiaire d'une règle `voir` sur l'espace. CP-37 ne clôt pas `membre_groupe` : sa colonne « Portée » ne cite que `appartenance_espace`, `attribution_role` et `regle_acces`. C garde la lecture. **(2)** C reste inscrit dans `embargo_beneficiaire` : CP-37 ne le touche pas, et CP-46 dit qu'un transfert ne lève pas l'embargo. Avec (1), C voit un témoignage sous embargo d'existence que le cessionnaire, non bénéficiaire, ne voit pas. | DD-26.4 et DI-B42 exigent qu'aucun droit ne subsiste. CP-37 traite les droits nominatifs, pas les droits dérivés d'un groupe de l'espace ni la qualité de bénéficiaire d'embargo. La correction introduit en outre le transfert des règles du cédant au cessionnaire (NC-03). |
| AC-03 | **Partiellement levé** | Tâche automatique sans programmateur identifiable : le repli sur le propriétaire est supprimé. L'activité est imputée à un acteur institutionnel sans droit, et sans titulaire aucune règle n'est créée (CP-23, DI-A39). Bloqué. | **(1)** Un administrateur sans habilitation scientifique dépose lui-même le GEDCOM d'un membre puis lance l'import. CP-23, puce 4, l'exempte explicitement (« sauf s'il est lui-même le réalisateur ou le déposant ») : il reçoit `voir`/`éditer` sur tous les objets `privé` créés, soit exactement le cas 5 du constat d'origine. **(2)** À l'acceptation d'un transfert, CP-37 transfère au cessionnaire (propriétaire administratif) les règles `propriétaire` du cédant. Il devient bénéficiaire de règles `propriétaire` sur des objets qu'il n'a ni réalisés ni déposés, contrairement à la définition du titulaire (CP-23, puce 2). **(3)** Création manuelle de règles `propriétaire` (NC-01). | Le mécanisme de repli est corrigé. La propriété peut toujours aboutir chez un acteur de nature administrative par l'import « pour le compte de », par CP-37 et par NC-01. |
| AC-04 | **Partiellement levé** | Embargo `existence même` sur le témoignage T. Les bénéficiaires existent désormais (`embargo_beneficiaire`, au moins un, auteur d'office : CP-05 et CP-46). L'exception est évaluée à l'étape 1 et ce n'est plus une interdiction universelle. Les deux impasses d'origine, (a) et (b), ne se produisent plus. | **(1)** L'embargo désigne le groupe « Proches » de l'espace comme bénéficiaire. L'administrateur X s'ajoute à ce groupe (CP-48 l'y autorise ; aucune interdiction d'auto-ajout). Il devient bénéficiaire, contrairement à CP-46 (« y compris les administrateurs »). Couplé à NC-02, il lit T. **(2)** Un collaborateur pose sur T un embargo d'existence dont il est le seul bénéficiaire, avec seulement une `condition_levee`. Aucun bénéficiaire ne détient `administrer` sur l'embargo, et personne ne peut le lever (CP-46, puce 2). L'objet disparaît pour son propriétaire, sans issue : c'est l'impasse (a) d'origine par une autre voie. **(3)** Une habilitation exceptionnelle, présentée par DD-28.4 comme la voie d'accès aux métadonnées protégées, est une règle évaluée à l'étape 3. Elle ne peut pas franchir l'étape 1. | Aucune règle ne dit qui peut créer un embargo ni qui peut modifier `embargo_beneficiaire` : CP-48 ne les cite pas, et l'auteur de l'embargo n'est pas modélisé, alors que c'est le défaut corrigé pour les règles en AC-11. Voir NC-05. |
| AC-05 | **Partiellement levé** | Bases de P1 et P2 sur l'assertion A du Core : l'UQ inclut désormais `espace_id`, et l'auteur pour la portée `privée` (l. 574). Bloqué. Référence `privé` de A vers X : CP-49 impose une visibilité d'espace. Bloqué si CP-49 est respectée. | **(1)** `base_justificative` de portée `projet` créée avec la visibilité par défaut `privé` (`objet.visibilite` vaut `'privé'` par défaut ; aucun CK ne lie portée et visibilité). Le membre B tente sa propre base de portée `projet` : violation d'UQ, il apprend l'existence d'une base privée. **(2)** `selection_contexte` de visibilité espace qui retient une assertion `privé` d'un membre : B voit le choix et son `assertion_id`, sans voir l'assertion, et ne peut pas retenir sa propre assertion (UQ). **(3)** Une `reference_inter_espace` dont la cible n'est visible que par règle nominative. CP-12 (TI-10) impose une visibilité de lien ≤ celle de la cible (`privé`), CP-49 une visibilité d'espace : les deux sont incompatibles (NC-06). | CP-49 énonce la bonne règle générale, mais ne la réalise ni par CK ni pour l'objet visé par la ligne unique (assertion retenue, cible du lien). Par ailleurs, `auteur_acteur_id` n'est pas interdit hors de la portée `privée` : deux bases `projet` « en vigueur » d'auteurs différents coexistent dans le même espace, ce qui fait perdre la garantie du dictionnaire (§ 3.8) (NC-06). |
| AC-06 | **Levé** | Sélection S `traitement_vivants = masqués`, V au manifeste en mode `masqué`, règle G1. CP-29 [V1.1-d] impose désormais le rendu selon `mode_inclusion` (DI-L21) : `masqué` signifie omis ou neutre, sans attribut, relation ni référence indirecte. Un DI-E05 n'est servi en mode `intégral` qu'avec une évaluation favorable. Bloqué. | **(1)** V en mode `masqué`, mais son assertion de naissance incluse en mode `intégral` (ligne d'inclusion distincte) : rejeté par la clause « sans attribut… permettant de le reconstituer » et par le contrôle sur le « graphe effectivement rendu ». **(2)** Compteurs et recherches : couverts par la même clause. | Réalisation textuelle suffisante. Réserves mineures, sans réouverture du scénario : `masquage_id` n'est contraint ni sur l'objet masqué, ni sur le type `pseudonymisation`, ni sur l'unicité par sélection exigée par DI-L21 ; le contexte de l'« évaluation favorable » n'est pas précisé (NC-10). |
| AC-07 | **Partiellement levé** | Sosa 16 exclu, participation « parrain » au baptême E. CP-33 [V1.1-d] et DI-L16 V1.3 : toute assertion n'est incluse que si son sujet et sa cible sont inclus. La participation de Sosa 16 est exclue. Bloqué. | **(1)** Assertion `attribut` de naissance du Sosa 31 (sujet inclus, sans cible), `niveau = attestée`, dont le `libelle_source` (verbatim obligatoire, DI-G06) cite « parrain Jean BOVALO ». Elle passe la règle sujet/cible. La clause « source ou événement qui mentionne une personne exclue » ne vise pas le verbatim d'une assertion incluse. **(2)** CP-33 exige d'inclure la source « en `provenance masquée` », or `selection_inclusion.mode_inclusion` ∈ {intégral, masqué, pseudonymisé} n'a pas cette valeur : la règle n'a pas de représentation. | La branche exclue reste déductible par le verbatim (CDCF § 126.1, OB-23). Il faut étendre la règle aux textes sources des assertions incluses (verbatim, `TEXTE_SOURCE`) et ajouter un mode `provenance masquée`, ou renvoyer explicitement au mode `masqué`. |
| AC-10 | **Partiellement levé** | Sélection v3 active, proposition v4 : `version_active_numero` reste à 3 (DDL l. 2671 ; CP-29 ; MLD-16 ; DI-L22). `etat_proposition = refusée` est ajouté. Prise en charge : `version_en_vigueur_numero`. Le cœur du constat est levé. | **(1)** Contradictions résiduelles : CP-33, puce 1 (« écrites dans la transaction de confirmation, puis jamais modifiées ») et MLD-16, puce 1 (même texte) sont conservées à côté du correctif « écrites à la création de la proposition et figées à sa confirmation ». `selection_inclusion` est `[N]` et CP-01 interdit toute modification d'un journal `[N]`. **(2)** CP-36, phrase 1, garde « `etat = active` ⇔ deux acceptations sur la version **courante** », ce qui contredit le correctif de la même CP ; le commentaire du DDL (l. 1070) aussi. **(3)** Le CK l. 2674 impose `version_active_numero` non nul y compris pour `révoquée` et `close`, et CP-29 en fait la « seule source » de l'accès. Aucune phrase du MLD ne reprend le « ne fonde plus aucun accès » du dictionnaire (§ 14.6, `etat`) (NC-07). **(4)** Une réduction créée pendant qu'une proposition attend : rien ne dit qu'elle se calcule sur la version active plutôt que sur la version courante. Elle peut activer, sans confirmation, les ajouts de la proposition (NC-07). | Le correctif est juste sur le fond, mais les textes antérieurs n'ont pas été retirés : deux implémentations conformes peuvent encore diverger. |
| AC-11 | **Partiellement levé** | `regle_acces.auteur_acteur_id` NN, figé (CP-52), égal à l'auteur de l'activité de création (DI-B44). Une modification par un autre acteur crée une nouvelle règle. L'ambiguïté (a)/(b) disparaît. | Rejeu exact de l'étape 2 : un administrateur prolonge `date_fin` de G1. Par DI-B44, la nouvelle règle a pour auteur l'administrateur. Or celui-ci n'a pas `voir` (DD-28.3), donc par CP-29 la règle ne sert plus rien : c'est l'issue (b) d'origine, désormais certaine. **Variante :** chaque admission (`regle_admission [A:regle_acces]`) décidée par un administrateur autre que l'auteur est, par CP-22, une nouvelle version de la règle ; par DI-B44, c'est donc une nouvelle règle, et les admissions déjà accordées sont perdues (NC-04). | Le défaut de modélisation est corrigé et le résultat est désormais déterministe. En revanche, le résultat nuisible du scénario d'origine (les destinataires perdent l'accès à la suite d'un acte administratif) reste atteint. Par ailleurs, CP-48 exige `administrer` pour créer la règle et CP-29 exige que l'auteur ait `voir` : seul un acteur qui cumule les deux habilitations peut partager efficacement. |
| AC-23 | **Levé** | Ajout de M à G en version 5 : CP-22 réécrite impose une nouvelle version 6 ; `v_debut` et `v_fin` valent ce nouveau numéro ; CP-01 est étendue aux `[A:p]`. La version 5 et son empreinte ne changent plus. Bloqué. | **(1)** Retrait dans la même version (`v_fin = v_debut`) : impossible, puisque toute clôture crée une version, et le CK `v_fin > v_debut` est respecté. **(2)** `[A:p]` dont le propriétaire est `[F]` : aucun cas dans le schéma (recherche exhaustive des `[A:…]`). | Levé. Réserve de forme : la colonne « Portée » de CP-01 reste « Toutes tables `[V]`, `[F]`, `[L]` ». Effet de bord sur les règles et leurs admissions : NC-04. |
| AC-28 | **Partiellement levé** | Les neuf règles d'origine. DI-A10 : CP-53 affaiblit la règle (« tant qu'aucun examen humain n'a eu lieu »). DI-A12 : réalisée par une table enfant, mais l'ancienne colonne texte subsiste et n'est pas contrôlée. **DI-A37 : non corrigée.** Le CK de `filiation` (l. 533) reste `operation_flux_id IS NOT NULL OR import_id IS NOT NULL`, de sorte qu'une filiation `réutilisation` avec `import_id` seul et sans flux passe encore, alors que CP-53 affirme le contraire. DI-B09 : réalisée (CP-53). DI-B18 : partielle (`effectif` nullable et rien ne désigne une évaluation d'agrégat, donc un agrégat de 2 sans effectif passe). DI-C15 : réalisée (CP-53). **DI-K11 : non corrigée.** Aucune colonne ne distingue une recherche nominative, et le commentaire du DDL dit encore « DI-K11 : application ». DI-K12 et DI-K18 : réalisées. | Échantillon de 78 lignes (ci-dessous) : 20 lignes sont partielles, contredites ou non réalisées. Parmi elles, 8 sont marquées « Réalisée et vérifiée » et 12 « corrigée V1.1-d », dont 2 non réalisées. Une soixantaine de lignes « vérifiées » ne sont réalisées que par la mention de la règle dans la liste de CP-13, sans énoncé. | L'affirmation « 0 partielle, 0 absente » du § 25.4 n'est pas confirmée. Deux des neuf contre-exemples d'origine passent encore (DI-A37, DI-K11), et un troisième partiellement (DI-B18). |

---

## Tableau 2 — Non-régression des autres constats

| ID | Verdict | Remarque |
|---|---|---|
| AC-08 | Levé | CP-50 : validation `acces(…, voir)` avant les FK, avec la même erreur et le même délai. Effet de bord sur les contributions différées : NC-12. |
| AC-09 | Partiellement levé | CP-35 : même espace ou acceptation par un détenteur d'`administrer` sur la série. Cette acceptation n'a aucune représentation (ni colonne d'état dans `paraitre_dans`, ni table). L'UQ `(serie_id, rang) WHERE v_fin IS NULL` n'est pas restreinte aux numéros acceptés, comme le demandait le constat. Une ligne en attente occupe donc le rang si elle est insérée avant l'acceptation. |
| AC-12 | Partiellement levé | Groupes, appartenances et admissions sont ajoutés à l'empreinte (CP-37). Avec CP-22, la version d'un groupe change bien à chaque ajout de membre. **Variante non couverte :** une règle au profit d'un rôle d'un **autre** espace (`espace_role`, DI-B34). L'empreinte ne contient que la version de la règle, pas les appartenances de l'espace destinataire, qui peut multiplier son audience entre la présentation et l'acceptation. Par ailleurs, `transfert_engagement.engagement_id` (uuid) ne peut pas désigner une ligne d'`appartenance_espace` ou de `regle_admission`, qui n'ont qu'une clé composite (NC-08). |
| AC-13 | Partiellement levé | CK de `espace` : réplication bornée dans les espaces `projet`, `organisation` et `communauté` ; changement de politique traité dans CP-28 et CP-40. Les espaces `familial` et `privé` (D-09), souvent partagés entre plusieurs personnes, restent `autorisée` sans durée. Or CP-28 affirme un résidu « borné par la durée maximale », ce qui est faux pour eux. Le défaut du DDL (`'autorisée'`) diffère de celui du dictionnaire (`limitée` en espace collectif) (NC-09). |
| AC-14 | Levé | CP-27 : la `charge` ne contient que le delta. Le commentaire du DDL (l. 1115, « format patrimonial, ETAT_FIGE ») contredit encore la CP, et un delta de modification peut contenir l'ancienne valeur, qui fait partie du contenu de base. Correction d'écriture à faire. |
| AC-15 | Levé | `decision_editoriale.origine` et CK (l. 2974-2975) ; lecture des diffusions par `administrer`. DD-28.4 ne cite pas les décisions éditoriales, alors que CP-35 les y rattache (NC-11). |
| AC-16 | Levé (par arbitrage D3) | CP-51 et DI-A41 : licence, embargo, consentement et DI-E05 contrôlés. Le porteur a écarté la demande d'un `repartager` de l'espace d'origine. Ce choix est cohérent avec DI-A41 ; il reste discutable au regard de CDCF § 126.2, mais il est arbitré. |
| AC-17 | Levé | Plus d'unicité d'empreinte ; un `fichier` par dépôt ; CP-41 (non-observabilité intra-espace, purge indépendante). DI-C13 et DI-C22 sont alignées. |
| AC-18 | Levé | `export_exclusion.motif` sans `existence protégée` ; CP-46 « ni exporté, ni listé ». |
| AC-19 | Levé | `temps_forme` et `⟨dh temps_fin⟩`, avec CK. Une double représentation est possible pour une `situation` (`assertion_situation.debut/fin` et `temps_forme = 'période'`), alors que le dictionnaire (§ 9.1) prescrit `date_debut/date_fin` pour ce profil (NC-15). |
| AC-20 | Levé | CK de `dependance` sur `amont_type` (l. 498-499), FK composite vers `objet(id, type_objet)`. |
| AC-21 | Levé | CP-05 complété par les quinze cardinalités, la règle du premier jalon et le bénéficiaire d'embargo. |
| AC-22 | Partiellement levé | `NOT est_purge` ajouté sur les unicités citées. **Variantes restantes :** `candidature UQ (position_id) WHERE statut = 'retenue'` (`statut` NN reste après purge) ; `lien_compte_personne UQ (personne_id) WHERE statut = 'vérifié'` ; `element_reconstruit UQ (…)` (l. 2084). Une ligne purgée y bloque encore une ligne légitime. |
| AC-24 | Levé | Colonnes passées en `NN*`, codes de protection et de consentement compris. Les CK combinés (`reponse`, l. 2175) incluent `OR est_purge`. |
| AC-25 | Partiellement levé | `version_objet` devient nullable sous `resolution_effacee` ; DD-02 passe en UUID v4. En revanche, la neutralisation des activités exigée par DD-27.3 V1.3 n'est pas reprise dans CP-16, et `activite` (journal `[N]`, `date_debut`, `type_activite`, `mode` en NN) n'a pas de colonne d'effacement : l'auteur et la date de création restent lisibles dans le journal. |
| AC-26 | Levé, avec régression mineure | `email` conditionnel et CK ; `pseudonyme_reserve`. Mais la ligne `compte` n'est plus jamais supprimée, si bien que les cascades `ON DELETE` depuis `compte` (`historique_navigation`, `notification`, `blocage`…) ne se déclenchent plus. Aucun autre mécanisme n'efface ces données (MLD-15, DI-B05, DI-Q03) (NC-13). L'empreinte d'un pseudonyme, à faible entropie, n'est « non réversible » que par le sel de plateforme. |
| AC-27 | Levé | CP-52 ; `auteur_acteur_id` figé. |
| AC-29 | Levé | Dictionnaire : DECIDER_RATTACHEMENT (0,n). |
| AC-30 | Partiellement levé | Étape 1 bis et `campagne_personne.acteur_id`. Cette colonne est nullable : un participant non relié à un acteur n'est pas cloisonné, ce qui est le scénario d'origine. La colonne est absente du dictionnaire (NC-11). |
| AC-31 | Levé | CP-23, puce « Amorçage du Core ». |
| AC-32 | Levé | CP-34 et DD-24.6. |

---

## Tableau 3 — Nouveaux constats

| ID | Gravité | Références | Scénario de violation pas à pas | Correction proposée | Confiance |
|---|---|---|---|---|---|
| **NC-01** | **Bloquant** | CK de `regle_acces` (l. 801-804) ; CP-23 ; CP-48, puce 3 (« sauf … les règles `propriétaire` de CP-23 ») ; CP-25 ; DD-28.2 ; dictionnaire § 4.9 (`nature` ∈ {ordinaire, exceptionnelle}) | 1. C crée le projet P : par CP-25, il reçoit `propriétaire` (administrative) et `responsable scientifique`, donc il détient `administrer` et une habilitation scientifique. 2. Le membre M crée une note `privé` N, avec une règle CP-23 à son seul profit. 3. C crée `regle_acces` (cible N, `voir`, `nature = propriétaire`, bénéficiaire et auteur C). 4. Premier CK : vrai par `nature = 'propriétaire'`. Second CK : satisfait (acteur, `autoriser`, `voir`, objet). CP-48 : C détient `administrer`, et l'exception d'auto-habilitation vise les règles `propriétaire`. CP-23, puce 4 : ne s'applique pas, puisque C a aussi une habilitation scientifique. Aucun texte ne réserve la nature `propriétaire` à la transaction de création de l'objet. 5. **Observé :** C lit et édite tout objet `privé` des membres. **Attendu :** aucune lecture sans autorisation du titulaire (§ 22.1, CDCF § 126.2). **Contradictions associées :** CP-23 crée la règle pour un titulaire qui n'a en général pas `administrer`, ce que CP-48, puce 1, interdit sans exception ; DD-28.2 n'exempte pas les règles `propriétaire` de l'interdiction d'auto-habilitation ; le dictionnaire ne connaît pas la valeur `propriétaire`. | Réserver `nature = 'propriétaire'` à la transaction qui crée la version 1 de la cible : CP + CK `cible_objet_id` créé dans la même activité. Imposer bénéficiaire = titulaire (DI-A39) et une création par le système uniquement, exemptée de CP-48. Interdire toute création manuelle, toute prolongation et tout transfert (CP-37) d'une telle règle. Ajouter la valeur au dictionnaire, avec l'exception dans DD-28.2. | Élevée |
| **NC-02** | **Bloquant** | CP-48, puces 1 et 3 ; DD-28.1 et DD-28.2 ; DI-B35 (« Une règle n'autorise jamais plus que ce que détient … l'acteur qui l'a posée ») ; CP-29 et § 22.2 (borne de l'auteur limitée aux sélections) ; § 22.1 ; CDCF § 49.2, § 120.2, § 126.2 | 1. X n'a qu'une appartenance `administrateur` sur P, donc aucune lecture (DD-28.3). 2. Il crée le groupe G dans P et s'y ajoute : CP-48 lui donne l'autorité sur `membre_groupe`, et l'interdiction d'auto-habilitation ne vise que les appartenances scientifiques et les règles. 3. Il crée une règle (cible : l'espace P, ou un objet `privé` d'un membre ; `voir` ; bénéficiaire : G). Le CK passe (`type_beneficiaire <> 'acteur'`). 4. À l'étape 3, la règle est retenue : aucune condition n'exige que son auteur détienne `voir`. 5. **Observé :** X lit les contenus `projet` et `privé`. Variantes : bénéficiaire `public` ou `rôle d'espace` (`lecteur`), qui ouvrent les objets `privé` d'un membre à tous sans son accord. **Effet inverse :** le titulaire d'un objet `privé` (règle CP-23 `voir`/`éditer`) ne détient pas `administrer` et ne peut pas partager son propre objet, alors que le CDCF § 126.2 dit que « le propriétaire choisit ». **Ambiguïté aggravante :** DD-28.3 n'accorde `administrer` que « sur l'espace ». Si `administrer` ne s'hérite pas sur les objets, personne ne peut créer de règle sur un objet, sélections comprises. S'il s'hérite, le scénario ci-dessus s'applique. | Appliquer DI-B35 à **toute** règle `autoriser` dans § 22.2 : la règle ne vaut que si son auteur détient l'action à l'instant de l'évaluation. Distinguer l'autorité de **gestion** (`administrer`) du droit d'**accorder** une action de contenu, ce second droit exigeant que l'auteur détienne l'action (ou `repartager`). Étendre l'interdiction d'auto-habilitation à `membre_groupe` et à tout bénéficiaire dont l'habilitant est membre (groupe, rôle). Préciser la portée d'`administrer` sur les objets de l'espace. Ouvrir au titulaire le partage de ses objets `privé`. | Élevée sur le texte ; moyenne sur l'intention (DD-28.1 peut avoir voulu cette autorité) |
| **NC-03** | Majeur | CP-37, puce « Acceptation », tiret 3 ; DI-B44 ; CK d'auto-habilitation ; CP-29 ; DD-26.3 et DD-26.4 ; § 22.1 | 1. Le membre M a accordé à C (cédant) une règle ordinaire `voir` sur son journal `privé`. Une règle `interdire`/`existence` vise C sur le témoignage T. C a posé la règle de sélection G1 (BOVALO → Colimaçons). 2. Le transfert est accepté. CP-37 clôt **et transfère au cessionnaire** toutes les règles dont C est bénéficiaire nominatif. 3. **Effets :** (a) le cessionnaire lit le journal de M sans décision de M, et les règles `propriétaire` de C lui donnent les objets `privé` de C ; (b) l'interdiction d'existence visant C passe au cessionnaire, qui perd T, tandis que C en est libéré (avec le groupe résiduel de AC-02, il peut voir T) ; (c) la règle « transférée » est une nouvelle règle : si son auteur est l'acteur de l'acceptation (DI-B44), il est aussi bénéficiaire, et le CK la rejette (nature `ordinaire`), donc la transaction échoue ; sinon l'auteur est fictif ; (d) G1, présentée comme engagement repris, cesse silencieusement de valoir, puisque son auteur figé C n'a plus aucun droit (CP-29). | Ne transférer aucune règle nominative. Clore celles du cédant et laisser au nouveau propriétaire le soin d'accorder (DD-26.4). Pour les sélections engagées, prévoir une réémission explicite par le cessionnaire, avec un nouvel auteur, dans la transaction d'acceptation, et le dire dans les engagements présentés. Exclure les interdictions de tout transfert. | Élevée |
| **NC-04** | Majeur | CP-22 (réécrite) ; DI-B44 ; `regle_admission [A:regle_acces]` ; CP-30 ; CP-29 | 1. L'administrateur R pose la règle G (groupe extérieur, `approbation préalable`). 2. L'administrateur S (≠ R) approuve l'admission de A. Par CP-22, l'insertion dans `regle_admission` crée une nouvelle version de G. 3. Par DI-B44, une modification par un autre acteur que l'auteur crée une **nouvelle règle** et clôt l'ancienne. Les admissions déjà accordées, rattachées à l'ancienne règle, tombent, et la nouvelle règle a pour auteur S. 4. Si G porte sur une sélection et que S n'a pas `voir`, la règle ne sert plus rien (CP-29). Même effet pour toute prolongation, ou toute fin de délégation de lot (CP-32), faite par un tiers. | Préciser que les associations possédées par une règle (admissions) et les actes de cycle de vie (clôture, prolongation, admission) ne sont pas des « modifications » au sens de DI-B44. Réserver la création d'une nouvelle règle aux changements de portée, d'action ou de bénéficiaire. | Moyenne à élevée |
| **NC-05** | Majeur | CP-46 ; DI-B21 ; CP-48 (n'inclut ni `embargo` ni `embargo_beneficiaire`) ; DD-28.4 ; § 22.2, étape 1 ; DI-B19 | 1. Ajout de soi-même comme bénéficiaire : rien ne dit qui peut modifier `embargo_beneficiaire`. Un administrateur s'y inscrit, ou s'ajoute à un groupe bénéficiaire, ce qui annule le « y compris les administrateurs ». 2. **Impasse :** un collaborateur pose un embargo d'existence (`condition_levee` seule, sans `date_fin`), dont il est le seul bénéficiaire. Il n'a pas `administrer` sur l'embargo. Les administrateurs, qui ont `administrer`, ne sont pas bénéficiaires et ne voient pas l'objet. Personne ne peut lever l'embargo, et l'objet disparaît pour son propriétaire. 3. Après un transfert, le cessionnaire ne voit pas les objets sous embargo et ne peut pas les lever. 4. L'habilitation exceptionnelle prévue par DD-28.4 est évaluée à l'étape 3, après l'étape 1 : elle ne peut jamais rien révéler d'un objet sous embargo d'existence. | Ajouter à CP-48 l'autorité sur `embargo` et `embargo_beneficiaire`, avec interdiction de l'auto-ajout. Modéliser l'auteur de l'embargo (colonne figée). Exiger qu'au moins un bénéficiaire détienne `administrer` sur la cible, ou désigner un gardien. Prévoir une procédure de levée exceptionnelle, motivée et journalisée, évaluée avant l'étape 1. Réserver la création d'un embargo d'existence aux détenteurs d'`administrer` et au titulaire de l'objet. | Élevée sur l'absence de règle ; moyenne sur la gravité |
| **NC-06** | Majeur | CP-49 ; CP-12 (TI-10) ; DDL de `base_justificative` (l. 571-575), `selection_contexte`, `reference_inter_espace` ; dictionnaire § 3.8 | 1. **Contradiction de visibilité :** une `reference_inter_espace` vers un objet que le référent ne voit que par règle nominative doit avoir une visibilité ≤ `privé` (CP-12) et une visibilité d'espace (CP-49). Elle est impossible, ou fuit. 2. **Choix d'espace vers un objet privé :** une `selection_contexte`, de visibilité espace, retient une assertion `privé`. Les membres voient le choix et l'identifiant de l'assertion (TI-11), et ne peuvent plus choisir eux-mêmes (UQ). 3. **Base :** la portée `projet` reste compatible avec `objet.visibilite = 'privé'`, ce qui reproduit la fuite AC-05 par l'UQ. 4. **Perte d'unicité :** `auteur_acteur_id` reste admis hors de la portée `privée`. Deux bases `projet` « en vigueur » d'auteurs différents coexistent dans un même espace, contrairement à « au plus une base en vigueur par (objet, portée, espace) ». | CK : `portee = 'privée'` ⇔ `auteur_acteur_id IS NOT NULL`. CK ou CP : visibilité de la base fixée par sa portée. Pour `selection_contexte` et `position_epistemique`, l'objet visé doit être visible de tous les membres de l'espace. Pour `reference_inter_espace`, choisir entre CP-12 et CP-49, par exemple en n'admettant une référence que vers une cible visible de tous les membres de l'espace référent. | Élevée pour 3 et 4 ; moyenne pour 1 et 2 |
| **NC-07** | Majeur | CK de `selection_partage` (l. 2674) ; CP-29 [V1.1-d] ; MLD-16 ; CP-33 ; dictionnaire § 14.6 (`etat` : « `révoquée`, `close` : ne fonde plus aucun accès ») ; DI-L15, DI-L22 | 1. La sélection S est révoquée (`etat = révoquée`). Le CK impose de conserver `version_active_numero`. 2. CP-29 et le DDL désignent `version_active_numero` comme « seule source de l'accès », et aucune phrase du MLD ne subordonne l'accès à `etat`. Une implémentation littérale continue de servir le manifeste après révocation (OB-23, DI-L19). 3. **Variante :** proposition v4 (ajouts) en attente, puis réduction : si la réduction v5 est calculée sur la version courante (v4), elle devient active sans confirmation et embarque les ajouts non confirmés. | Ajouter à CP-29 et à l'étape 3 : « accès seulement si `etat` ∈ {active, proposée} ». Préciser qu'une réduction se calcule sur `version_active_numero`. Supprimer les phrases contradictoires de CP-33, puce 1, et de MLD-16, puce 1. | Moyenne |
| **NC-08** | Mineur | `transfert_engagement` (l. 992-1001) ; CP-37 ; DI-B41 | `engagement_type` admet `appartenance_espace` et `regle_admission`, mais ces lignes n'ont pas d'identifiant propre (PK composites incluant `v_debut`), si bien que `engagement_id` (uuid) ne peut pas les désigner. De plus, l'audience d'une règle au profit d'un rôle d'un autre espace (`espace_role`) n'entre pas dans l'empreinte (variante de AC-12). | Désigner ces engagements par la version du propriétaire (`ESPACE` n, `REGLE_ACCES` n). Inclure la version des espaces destinataires des règles par rôle. | Élevée |
| **NC-09** | Mineur | CK de `espace` (l. 664-665) ; CP-28, CP-40 [V1.1-d] ; D-09 (MCD) ; dictionnaire § 4.1 (`replication_hors_ligne`) | Un espace `familial` partagé entre cousins garde `autorisée` sans durée. Un cousin révoqué hors ligne garde la réplique indéfiniment, alors que CP-28 affirme un résidu « borné par la durée maximale ». Le défaut du DDL (`'autorisée'`) diffère de celui du dictionnaire (`limitée` en espace collectif). | Étendre le CK à tout espace ayant plus d'un membre, ou corriger le texte de CP-28. Aligner le défaut sur le dictionnaire. | Élevée |
| **NC-10** | Mineur | `selection_inclusion` (l. 2696-2698) ; `masquage` ; DI-L21 ; CP-29 | Une ligne `pseudonymisé` peut référencer le masquage d'un autre objet, un masquage de type `masquage` sans pseudonyme, ou le même masquage dans deux sélections destinées à des espaces différents, ce qui permet de recouper les pseudonymes et contredit « un par sélection ». Le contexte de l'évaluation « favorable » exigée pour un DI-E05 en mode `intégral` n'est pas précisé (audience de la sélection ? toute évaluation antérieure ?). | CP : `masquage.objet_original_id = objet_id`, `type = 'pseudonymisation'`, masquage propre à la sélection. Évaluation dont le contexte est l'audience destinataire de la version active. | Élevée |
| **NC-11** | Mineur | MLD ↔ dictionnaire V1.3 | (a) `regle_acces.nature = 'propriétaire'` absent du domaine du dictionnaire (§ 4.9). (b) DD-28.2 : pas d'exception pour CP-23 ; liste sans `exporter` (le CK du MLD l'ajoute) ; `invité` non cité. (c) Colonnes et tables V1.1-d absentes du dictionnaire : `evaluation_diffusabilite.effectif`, `campagne_personne.acteur_id`, `intervention_perimetre`, `activite_perimetre_transmis` (le dictionnaire garde `perimetre_donnees_transmises` en `TEXTE_LONG`). (d) CP-35 rattache les décisions éditoriales à DD-28.4, qui ne les cite pas. (e) § 22.1 (« Administrateur technique uniquement : administration Oui ») contredit DD-28.3, qui ne donne `administrer` qu'aux appartenances `propriétaire` et `administrateur`. (f) § 25.4 : le texte dit que les 4 règles V1.3 ont le statut « Réalisée », le tableau dit « Réalisée (corrigée V1.1-d) » ; DI-P13, citée parmi les 18 corrigées, reste « Réalisée et vérifiée » ; la colonne « Portée » de CP-01 n'est pas mise à jour. | Reporter ces éléments dans l'annexe C.7 du dictionnaire (procédure DC-DICT-02), ou les marquer ‡ dans le MLD. Corriger § 22.1 et § 25.4. | Élevée |
| **NC-12** | Mineur | CP-50 ; CP-27 ; CP-28 (« Retrait ≠ destruction des contributions ») ; DD-21.2 ; `contribution_differee` (objet de l'espace cible, `objet.espace_id` NN) | Un membre des Colimaçons, autorisé à `commenter` par une sélection mais sans appartenance à l'espace source, commente hors ligne. CP-50 donne un « succès simulé » et un refus à l'intégration : une contribution légitime est perdue. Pour un espace inexistant, la « réception » ne peut être stockée nulle part (FK de `objet.espace_id`), ce qui est incompatible avec la conservation de CP-27. | Remplacer « jamais eu d'appartenance » par « jamais eu de droit d'écriture ou de commentaire à aucun titre ». Stocker les réceptions simulées dans l'espace personnel de l'auteur. | Moyenne |
| **NC-13** | Mineur | `compte` [V1.1-d] (l. 688-696) ; MLD-15 ; § 3.5 ; DI-B05, DI-Q03 | La suppression d'un compte vide désormais `email` et `identite_civile` en place, sans supprimer la ligne. Les données techniques (`historique_navigation`, `notification`, `blocage`, `compte_categorie_sollicitation`) n'étaient effacées que par `ON DELETE CASCADE` depuis `compte`, qui ne se déclenche donc plus. | Ajouter à CP-16, ou à une CP « suppression de compte », la suppression explicite de ces tables. Corriger MLD-15. | Moyenne |
| **NC-14** | Observation | DD-28.2 ; CP-48 ; CK de `regle_acces` | La règle des deux personnes se contourne : le seul administrateur nomme un administrateur de complaisance (appartenance administrative, que l'interdiction d'auto-habilitation ne couvre pas), qui l'habilite ensuite. La « voie exceptionnelle » de DD-28.2 pour un administrateur seul est impossible, car le CK interdit qu'un acteur s'accorde lui-même une règle exceptionnelle. | Journaliser et notifier toute habilitation croisée. Faire passer par le support de plateforme (habilitation exceptionnelle accordée par un tiers identifié) le cas de l'administrateur unique. | Moyenne |
| **NC-15** | Mineur | `assertion` (l. 1732-1734), `assertion_situation` ; dictionnaire § 9.1 (`temps_historique` : « Pour `SITUATION` : utiliser `date_debut`/`date_fin` ») | Une assertion `situation` peut porter une période dans `temps`/`temps_fin` et une autre dans `assertion_situation.debut/fin`, sans contrainte de cohérence. | CK ou CP-07 : `profil = 'situation'` ⇒ `temps_forme = 'date'` (ou `temps` vide). | Élevée |

---

## Résultat de l'échantillon du § 25.4

Les 78 lignes ont été contrôlées en confrontant le texte de la règle DI (dictionnaire V1.3) à la contrainte citée. Statuts constatés :
- **Conforme :** la contrainte énonce la règle.
- **Conforme par renvoi :** la règle n'est réalisée que par sa mention dans la liste de CP-13, sans énoncé. C'est acceptable comme engagement procédural, mais invérifiable dans le MLD.
- **Partielle**, **Contredite** ou **Non réalisée**.

### A. Lignes marquées « Réalisée et vérifiée » (45)

| Règle | Statut constaté | Commentaire |
|---|---|---|
| DI-A02 | Conforme | CP-02 |
| DI-A04 | Conforme | CK `objet` l. 365 |
| DI-A05 | Conforme | CP-11 |
| DI-A08 | Conforme | CK `version_objet` l. 398 |
| DI-A11 | Conforme | CK `activite` l. 432-433 |
| DI-A13 | Conforme | CK `activite` l. 430 |
| DI-A14 | Conforme | CK `dependance` l. 510 |
| DI-A15 | Conforme | CK l. 511-512 |
| DI-A19 | Conforme | CK `filiation` l. 532 |
| DI-A20 | Conforme | CK l. 533 |
| DI-A26 | Partielle (mineure) | CK `redirigée` ⇔ redirection ; la clause « jamais une modification automatique » n'est pas énoncée |
| DI-A31 | Conforme | CK l. 595 |
| DI-A34 | Conforme | CK l. 631 |
| DI-B10 | Conforme | CK l. 817, 822-824 |
| DI-B17 | Conforme | CK l. 886 |
| DI-B19 | Conforme | CK l. 910 |
| DI-B27 | Conforme | CK l. 1013 |
| DI-B30 | Conforme | CK l. 820-821, 857 |
| **DI-B34** | **Partielle** | CP-29 limite les actions, mais n'exclut pas un bénéficiaire `public` (DI-B34 : « acteur, groupe ou rôle d'un espace désigné ») |
| **DI-B35** | **Partielle** | La borne « jamais plus que ce que détient l'auteur » n'est réalisée que pour les règles sur sélection (voir NC-02) |
| DI-B37 | Conforme | CP-30 |
| DI-B39 | Conforme | CP-36, CP-39 |
| DI-B40 | Conforme | CK l. 988 ; CP-37 |
| **DI-C11** | **Partielle** | CP-07 énonce « original récupérable » mais pas « jamais ancrage probatoire des détails produits » |
| **DI-C23** | **Partielle** | CP-41 ne vise que la reproduction `master` ; DI-C23 vise aussi la zone et la transcription d'appui |
| DI-D02 | Conforme | CP-19 et étape 1 bis |
| DI-F08 | Conforme | UQ l. 1663 (restriction de purge : voir AC-22) |
| DI-F13 | Conforme | CP-07 |
| DI-G03 | Conforme | CK l. 1741 ; CP-18 |
| DI-G06 | Conforme | CK l. 1742 |
| **DI-G13** | **Partielle** | CP-07 et le CK de `dependance` couvrent l'amont, mais pas « ni sujet d'un ANCRER » |
| DI-K20 | Conforme | `snapshot [F]` ; CP-03 |
| DI-K23 | Conforme | CP-31 |
| DI-K29 | Conforme | CK l. 813-815 |
| DI-L02 | Conforme | CK `arbre` |
| DI-L09 | Conforme | CP-03 |
| DI-L14 | Conforme | CP-33 (mais voir la contradiction AC-10 sur l'écriture des lignes) |
| DI-L17 | Conforme | CP-33, puce « Origine » |
| DI-P13 | Conforme (statut mal tenu) | Aucune FK ; la ligne aurait dû être requalifiée « corrigée » puisque l'auteur la range parmi les 18 |
| DI-P15 | Conforme | CP-35 ; CK `diffusion` |
| DI-P17 | Conforme | `diffusion [F]` ; CP-35 |
| DI-P18 | Conforme | CP-35 |
| **DI-P19** | **Contredite** | DI-P19 : l'importateur est l'auteur des objets privés, sans condition. CP-23 ajoute « s'il détient les droits sur le fichier importé ». Le dictionnaire est lui-même incohérent avec DI-A39 réécrite. |
| DI-Q05 | Conforme | § 22.3 |
| **DI-O14** | **Partielle (mineure)** | CP-34 omet la « couverture » exigée par DI-O14 |

**Bilan A :** 37 conformes, 8 partielles ou contredites (B34, B35, C11, C23, G13, O14, P19, A26). **Hors échantillon**, au moins 30 lignes « Réalisée et vérifiée » citent CP-13 comme réalisation principale : C01, C02, C04, C14, D03, E02, E08, F03, F09, F10, G04, G05, G12, I01, J02, J06, K03, K05, K10, K16, N01, O06, O07, P01, P03, B15, B22, B25… Elles ne sont « vérifiées » qu'au sens d'un renvoi nominal.

### B. Lignes marquées « Réalisée (corrigée V1.1-d) » (33)

| Règle | Statut constaté | Commentaire |
|---|---|---|
| DI-A01 | Conforme | CP-52 |
| DI-A07 | Conforme | CP-02 [V1.1-d] |
| **DI-A10** | **Partielle** | CP-53 ajoute « tant qu'aucun examen humain n'a eu lieu », ce qui permet à une activité IA déclarant `intervention_humaine = examen` de produire `examiné` ; DI-A10 est absolue |
| DI-A12 | Conforme, avec réserve | Table enfant et CP-53 ; l'ancienne colonne texte `perimetre_donnees_transmises` subsiste, liée par CK, sans contrôle |
| DI-A16 | Conforme | CK de `dependance`, domaine Q inclus |
| DI-A27 | Conforme | CP-53 |
| DI-A30 | Conforme | CK sur `amont_type` |
| **DI-A37** | **Non réalisée** | CK l. 533 inchangé : réutilisation avec `import_id` seul acceptée ; type de flux non contrôlé. CP-53 affirme à tort le contraire |
| DI-B05 | Conforme | CK `compte` l. 695-696 (voir NC-13 pour la purge des données techniques) |
| DI-B08 | Conforme | `pseudonyme_reserve` ; CP-06 |
| DI-B09 | Conforme | CP-53 |
| **DI-B18** | **Partielle** | `effectif` nullable ; aucune marque d'« évaluation d'agrégat » |
| **DI-B21** | **Partielle** | Structure présente ; autorité sur les bénéficiaires et sur la levée non définie (NC-05) |
| DI-B29 | Conforme | CK l. 818-819 ; CP-26 ; CP-48 |
| **DI-B36** | **Partielle** | Autorité et décideur énoncés ; l'auto-ajout au groupe n'est pas couvert (NC-02) |
| DI-B41 | Partielle (mineure) | Voir NC-08 |
| **DI-B42** | **Partielle** | `membre_groupe` et `embargo_beneficiaire` non clos ; transfert de règles (AC-02, NC-03) |
| DI-B44 | Conforme | Colonne NN, CP-48 et CP-52 (effet de bord : NC-04) |
| DI-C13 | Conforme | CP-41 ; plus d'UQ d'empreinte |
| DI-C15 | Conforme | CP-53 (le CK seul admet encore `polygone_image` pour une plage temporelle, mais la CP l'énonce) |
| DI-C22 | Conforme | CP-41 |
| DI-F07 | Conforme | UQ l. 1662 |
| DI-F14 | Conforme | UQ l. 1687 (visibilité : NC-06) |
| **DI-K11** | **Non réalisée** | Aucun discriminant « recherche nominative » ; le commentaire du DDL dit encore « application » |
| DI-K12 | Conforme | `intervention_perimetre` ; CP-20 ; CP-53 |
| DI-K18 | Conforme | CP-53 |
| DI-L04 | Conforme | UQ l. 2627 |
| **DI-L16** | **Partielle** | Verbatim des assertions incluses ; « provenance masquée » non représentable (AC-07) |
| DI-L21 | Conforme, avec réserve | CP-29 ; cohérence de `masquage_id` (NC-10) |
| DI-L22 | Partielle (mineure) | Correct, mais MLD-16 et CP-33 gardent l'ancien texte ; accès non subordonné à `etat` (NC-07) |
| DI-P12 | Conforme | CK `origine` ; CP-35 |
| DI-P14 | Partielle (mineure) | Acceptation inter-espaces non représentée (AC-09) |
| DI-J09 | Partielle (mineure) | `acteur_id` nullable (AC-30) |

**Bilan B :** 21 conformes (dont 2 avec réserve), 10 partielles, 2 non réalisées (DI-A37, DI-K11).

**Bilan global de l'échantillon :** 58 conformes sur 78, 20 non conformes. Le résultat annoncé au § 25.4 (« 0 partielle, 0 absente ») n'est pas confirmé.

---

## Vérifié sans anomalie

| Point | Contre-exemple tenté | Résultat |
|---|---|---|
| Voie C de AC-01 (programme → sous-projet) | Règle créée dans G avec cible dans S | Rejetée : la règle vit dans l'espace de sa cible, et l'auteur doit avoir `administrer` (CP-48) |
| Auto-inscription scientifique | Administrateur qui s'inscrit `lecteur` ou `collaborateur` | Rejetée (CP-48) |
| Auto-admission | `regle_admission` dont le décideur est le bénéficiaire | Rejetée (CK l. 838) |
| Règle de rôle administratif ≠ `administrer` | Rôle `administrateur` → `voir` | Rejetée (CK l. 818-819) |
| Habilitation exceptionnelle sans fondement ni échéance | `nature = exceptionnelle`, `date_fin` vide | Rejetée (CK l. 820-821) |
| Délégation de lot avec `valider` | `tache_lot_id` et `valider` | Rejetée (CK) |
| Sélection : règle d'un auteur sans `voir` | Auteur dont les droits baissent | Accès réduit à l'évaluation suivante (CP-29, CP-40) |
| Historisation des `[A:p]` | Rattacher une ligne à une version existante | Interdit (CP-22, CP-01) |
| Attributs figés | Changer `objet.espace_id` par nouvelle version | Interdit (CP-52) |
| Acquisition comme preuve | `dependance` de justification avec amont `ACQUISITION_INFORMATION` | Rejetée (CK, FK composite) |
| Base vide en vigueur | `base_justificative` sans preuve | Rejetée (CP-05) |
| Déduplication intra-espace | Deux dépôts du même binaire | Deux `fichier` ; purge indépendante (CP-41) |
| Export d'un objet à existence protégée | Motif `existence protégée` dans `export_exclusion` | Valeur absente du domaine (CK l. 3075) |
| Invalidation éditoriale automatique | `origine = automatique` pour `approuvée` | Rejetée (CK l. 2975) |
| Purge d'un consentement | `texte_version` et codes à NULL | Admis (`NN*`) |
| Effacement de résolution d'une version | `version_objet` sans date ni activité | Admis sous `resolution_effacee` (CK l. 391, 397) |
| Unicités purgées citées par AC-22 | Nœud, candidature, choix, cote purgés | Exclus des UQ (`NOT est_purge`) |
| Amorçage du Core | Création sans propriétaire | Acteur institutionnel, sans règle `propriétaire` (CP-23) |
| Indicateur de programme | Calcul sur les données d'un sous-projet | Exclu ; voie « résultat publié » (CP-34, DD-24.6) |
| Contribution différée | `charge` contenant l'état de base | Interdit (CP-27 [V1.1-d]) |
| Changement de politique de réplication | Passage à `interdite` | Retraits et événement d'époque (CP-28, CP-40) |
| Rattachement : cardinalité | Trois ou quatre décisions | Admis : (0,n) dans le dictionnaire |
| Masquage d'une personne masquée | Assertion de V en mode `intégral` | Exclue par CP-29 (rendu effectif) |
