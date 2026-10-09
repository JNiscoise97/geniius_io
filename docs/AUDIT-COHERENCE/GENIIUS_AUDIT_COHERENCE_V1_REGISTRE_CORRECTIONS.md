# GENIIUS — Audit de cohérence interdocumentaire V1

## Registre de corrections

**Date :** 9 octobre 2026
**Documents :** [rapport](GENIIUS_AUDIT_COHERENCE_V1_RAPPORT.md) · [matrice de traçabilité](GENIIUS_AUDIT_COHERENCE_V1_MATRICE_TRACABILITE.md)

> **Règle.** Ce registre propose ; il ne modifie rien. Chaque correction touchant un document gelé ou candidat au gel suit la procédure de changement du CDC technique (§ 13) : demande, analyse d'impact, décision, nouvelle version, mise à jour de la traçabilité. Une correction n'est réputée intégrée que lorsqu'une version de référence la contient et qu'un contrôle de cohérence l'a vérifiée.

**Champs de chaque entrée :** gravité · formulation actuelle (avec référence exacte) · problème · correction proposée · documents concernés · décision attendue · condition GEL concernée · statut.

---

## Bloquants

### ECD-01 — Statut de gel de la chaîne documentaire non établi

- **Gravité :** Bloquant
- **Formulation actuelle :**
  - Dictionnaire (`docs/geniius_io_DICTIONNAIRE_DONNEES_V1.md`, l. 1 et 5) : « Dictionnaire de données V1.0 » — « première version, à soumettre à validation ». Annexe I, règle de sortie : « Les critères `REC-01` et `REC-16` sont les deux contrôles formels restant à exécuter avant de déclarer le dictionnaire **gelé** ». Annexe J (d) : « geler le dictionnaire ».
  - MLD (l. 5 et 7) : « première version, à soumettre à validation » ; source déclarée : `docs/GENIIUS_DICTIONNAIRE_DONNEES_V1_1_CONSOLIDE.md`.
  - CDC technique, en-tête : « Dictionnaire V1.1 🔒 → MLD V1.0 🔒 ».
- **Problème :**
  - Le fichier cité comme source du MLD n'existe pas dans le dépôt.
  - Le dictionnaire présent n'est ni en V1.1 ni gelé.
  - Les preuves de gel (rapport de réexécution des 95 tests, rapport de crash-test du MLD) ont été supprimées du dépôt au commit `863e70d`.
  - La chaîne « 🔒 » revendiquée par le CDC technique n'est donc pas démontrable. Le CDC technique s'appuie sur des versions non identifiées.
- **Correction proposée :**
  1. Retrouver ou reconstituer `GENIIUS_DICTIONNAIRE_DONNEES_V1_1_CONSOLIDE.md`, ou déclarer que `docs/geniius_io_DICTIONNAIRE_DONNEES_V1.md` est la référence (et corriger son en-tête).
  2. Exécuter REC-01 et REC-16 (dictionnaire, annexe I) ou constater formellement qu'ils l'ont été, preuve à l'appui.
  3. Réintégrer au dépôt les rapports de tests (95 tests MCD, crash-test MLD), ou leur version archivée.
  4. Publier un **registre des versions normatives** : fichier, version, date, statut (gelé ou candidat), preuve de gel.
  5. Aligner les en-têtes du CDC technique et du MLD sur ce registre.
- **Documents :** dictionnaire, MLD, CDC technique, dépôt Git.
- **Décision attendue :** désignation des versions de référence et décision de gel (ou de non-gel) du dictionnaire et du MLD.
- **GEL :** GEL-01, élargi à toute la chaîne.
- **Statut :** **corrigé le 9/10/2026 — partiellement levé**. Corrections réalisées :
  1. Le registre [`docs/GENIIUS_REGISTRE_VERSIONS_NORMATIVES.md`](../GENIIUS_REGISTRE_VERSIONS_NORMATIVES.md) désigne les fichiers de référence. `docs/geniius_io_DICTIONNAIRE_DONNEES_V1.md` y est identifié comme le dictionnaire « V1.1 consolidé » cité par le MLD : même corps que la version de la racine, plus les annexes G à J.
  2. Le rapport des 95 tests est restauré depuis le commit `774c487` dans `docs/`. Il prouve le gel du MCD V1.1. Le rapport de crash-test du MLD n'a jamais été versionné : il est déclaré introuvable.
  3. REC-01 a été exécuté : **conforme**. REC-16 reste à exécuter.
  4. Les en-têtes du dictionnaire, du MLD et du CDC technique ont été alignés sur le registre (statuts réels, chemin de la source du MLD).

  **Reste ouvert :** le gel du dictionnaire (REC-16 puis décision), le gel du MLD (nouveau rapport de crash-test et traitement des écarts) et le procès-verbal de gel du CDCF.

### ECD-02 — Trois versions concurrentes du CDC technique

- **Gravité :** Bloquant
- **Formulation actuelle :**
  - `docs/GENIIUS_CDC_TECHNIQUE_V1_0.md` : TECH-004 « Application Desktop installée », TECH-016 « Recherche et indexation ».
  - `docs/GENIIUS_CDC_TECHNIQUE_V1_0_CONSOLIDE_CANDIDAT.md` et `GENIIUS_CDC_TECHNIQUE_V1_0_DETAILLE_CONSOLIDE.md` (racine) : TECH-004 « Intégration aux fichiers », TECH-016 « Index et vues dérivées ».
- **Problème :**
  - Les intitulés et les contrats normatifs divergent.
  - La version « détaillée » mélange les décisions et le texte brut des échanges (options non retenues, questions).
  - Aucune version n'est désignée comme référence. Les conditions GEL-02 et GEL-03 ne peuvent donc pas être vérifiées.
- **Correction proposée :**
  - Désigner une version normative unique.
  - Archiver les deux autres sous un statut explicite (« historique » ou « annexe explicative »).
  - Si la version détaillée est conservée, ce doit être **en annexe non normative**, avec la règle déjà énoncée : les décisions validées prévalent sur le cadrage.
- **Documents :** les trois CDC techniques.
- **Décision attendue :** choix de la version de référence.
- **GEL :** GEL-02, GEL-03.
- **Statut :** **corrigé le 9/10/2026.**
  - Référence : `docs/GENIIUS_CDC_TECHNIQUE_V1_0.md`.
  - Archivés avec `git mv` dans [`docs/archives/cdc-technique/`](../archives/cdc-technique/), un README indiquant leur statut : `…CONSOLIDE_CANDIDAT.md` (remplacé), `…DETAILLE_CONSOLIDE.md` (annexe explicative non normative) et `échanges_CDC technique.txt` (source des décisions, conservée pour preuve).

### ECD-03 — Identifiants fonctionnels inexistants dans le CDCF de référence

- **Gravité :** Bloquant (rupture de traçabilité B2)
- **Formulation actuelle :** les échanges de conception (REV-03-D) citent « A-01 à A-04 », « K-01 à K-03 », « S-01 à S-04 », « CV-I01 à I03 », « CV-T01 à T03 », « CV-AT01 à AT03 », « CV-CN01 ». Ces identifiants proviennent de `CDCF_GENIIUS_V1.docx`. Les recettes du CDC technique qui en dérivent (REC-A02, K01–K04, I01–I03, T01–T03, S01–S04, AT01–AT04, CN01–CN04) n'avaient pas de rattachement au CDCF V1.1. Le CDC technique lui-même n'indiquait aucune origine fonctionnelle par exigence (§ 10 : « à compléter »).
  - *Rectification du 9/10/2026 : la première version de cet audit affirmait que le CDC technique citait ces identifiants. Vérification faite, ils n'apparaissent que dans les échanges. La rupture de traçabilité est réelle, mais elle se situe entre les recettes et le CDCF, et non dans le texte normatif.*
- **Problème :**
  - Aucun de ces identifiants n'existe dans `docs/geniius_io_CDCF_V1.md` (0 occurrence).
  - Le CDCF V1.1 utilise : sections (§ 1–118), cas d'usage CU-01 à CU-25, critères 1 à 50 (§ 103), décisions Q113 à Q245.
  - La condition M10-C08 (« origine fonctionnelle exacte ») ne peut pas être satisfaite.
- **Correction proposée :**
  - **Option A** : ajouter `CDCF_GENIIUS_V1.docx` au dépôt, et définir sa relation avec le CDCF V1.1 (version antérieure ? annexe ?).
  - **Option B (recommandée)** : remplacer dans le CDC technique les identifiants A, K, S, CV par les identifiants du CDCF V1.1. Correspondances proposées :
    - A-02 → critère 8 et § 4.3 ;
    - K-02 → critère 25 et § 5.4 ;
    - CV-I01 → CU-13 et CU-14 ;
    - CV-T01 → CU-15 ;
    - CV-AT02 → § 27.5 ;
    - CV-CN01 → CU-05 et § 32.
  - La matrice de traçabilité (§ 2 et § 3) fournit la base de cette correspondance.
- **Documents :** CDC technique (§ 7, § 8, § 10), CDCF.
- **Décision attendue :** option A ou B.
- **GEL :** GEL-03 (M10-C08).
- **Statut :** **corrigé le 9/10/2026 (option B).** L'annexe D du CDC technique contient :
  - D.1, la correspondance de chaque identifiant hérité vers les § / CU / critères du CDCF V1.1 et vers les recettes ;
  - D.2, l'origine fonctionnelle de chacune des 33 exigences TECH.

  Les exigences sans origine fonctionnelle (TECH-001, 002, 004, 005, 009, et les exigences purement techniques) sont marquées « justification technique ». Leur régularisation relève d'ECD-19.

### ECD-04 — Règles d'accès accordées à des rôles administratifs ; CP-24 non exécutable

- **Gravité :** Bloquant (P0, confidentialité)
- **Formulation actuelle :**
  - MLD § 5.3, `regle_acces` : `type_beneficiaire … {acteur, groupe, rôle d'espace, public}` ; `role_beneficiaire code CK IN rôles d'APPARTENIR`. Ces rôles incluent `propriétaire` et `administrateur`.
  - CP-24 : « toute autorisation accordée à un acteur sur un objet `privé` dont il n'est pas l'auteur, **en vertu d'un rôle d'administration**, exige `date_fin`, une `condition` justifiée… ».
  - CDC technique, REC-X11 arbitrage A : « une règle `autoriser` ciblant un rôle administratif ne peut jamais accorder une lecture ordinaire de contenu `projet` ou `privé` ».
- **Problème :**
  1. Le MLD permet de créer une règle explicite `voir` au profit du rôle `administrateur`, ce qui contourne CP-25. CP-25 n'interdit que l'accès *implicite*.
  2. Rien dans `regle_acces` ne permet de savoir qu'une autorisation est accordée « en vertu d'un rôle d'administration ». CP-24 ne peut donc être ni contrôlée ni testée (REC-X11-04 et 09).
  3. CP-24 ne couvre pas les objets `projet`.
- **Correction proposée (MLD) :**
  - Ajouter **CP-26** : « Une `regle_acces` d'effet `autoriser` dont `type_beneficiaire = rôle d'espace` et `role_beneficiaire ∈ {propriétaire, administrateur}` ne peut porter que sur l'action `administrer`. Toute autre action sur un contenu `projet` ou `privé` passe par une autorisation nominative de nature exceptionnelle (CP-24). »
  - Ajouter à `regle_acces` une colonne `nature code NN CK IN {ordinaire, exceptionnelle}`. Pour une règle exceptionnelle : `date_fin`, `condition` et un fondement sont obligatoires, et chaque usage est journalisé (`contexte_evaluation.finalite` non nulle).
  - Étendre CP-24 aux objets `projet`.
- **Documents :** MLD (§ 5.3, § 21.2, § 22), dictionnaire (§ 4.9 : DI-B nouvelle), CDC technique (§ 6.2 : référence à CP-26).
- **Décision attendue :** adoption de CP-26 et de la colonne `nature`, ou d'un mécanisme équivalent.
- **GEL :** GEL-05.
- **Statut :** **corrigé le 9/10/2026.** MLD : `regle_acces.nature` et `fondement` ; CK CP-26 (rôle administratif limité à `administrer`) ; CK CP-24 (règle exceptionnelle nominative, bornée, fondée) ; `contexte_evaluation.regle_acces_id` avec finalité obligatoire ; CP-24 étendue aux objets `projet`. Dictionnaire : DI-B29, DI-B30, OB-22. CDC technique § 6.2 mis à jour. REC-X11-02, 04 et 09 deviennent exécutables. *Reste à vérifier (GEL-05) : qu’aucune autre règle du modèle ne réintroduit de lecture implicite (M10-A01).*

### ECD-05 — Hors connexion et synchronisation sans support de données ni décision d'emplacement

- **Gravité :** Bloquant (décision différée non encadrée, B4)
- **Formulation actuelle :**
  - CDC technique :
    - TECH-002.1 : réplique locale de « l'intégralité des données structurées » accessibles ;
    - TECH-003.2 : opération hors ligne avec « identité, auteur/appareil, date, contexte, version canonique connue » ;
    - TECH-007.8 : révocation d'appareil ;
    - AUDIT-TECH-001.2 : durée maximale hors ligne ou interdiction de réplication par espace ;
    - AUDIT-TECH-003 : versions client, schéma et référentiel annoncées, états « reçue ≠ intégrée ≠ validée », zone de réconciliation.
  - MLD : aucune occurrence de « hors ligne », « synchronisation », « appareil », « réplique » ni « idempotence ».
  - `contexte_evaluation.operation` ∈ {consultation … API} et `canal` ∈ {interface, API, export, notification, page publique} : pas de réplication ni de synchronisation.
  - CDC technique § 9.2 : « Protocole de synchronisation … : Architecture ». Aucune entrée ne traite du **modèle de données** de la synchronisation.
- **Problème :**
  - La garantie centrale TECH-003 n'a aucune traduction de données, et personne n'est chargé de décider où elle vivra.
  - Trois éléments ont nécessairement une dimension scientifique et relèvent du modèle :
    - la zone de réconciliation (des contributions scientifiques en attente) ;
    - la politique de réplication par espace (une règle de confidentialité) ;
    - la propagation des révocations et purges vers les répliques (une règle de cycle de vie).
  - Le MLD fournit des appuis partiels (`conflit_edition.base_numero`, `proposition_modification`), mais ils ne couvrent ni l'idempotence, ni l'appareil, ni les états de réception.
- **Correction proposée :**
  1. **Décision d'emplacement** (registre des décisions différées) :
     - **dans le MLD** : politique de réplication de l'espace, zone de réconciliation, statut de réception d'une contribution ;
     - **dans un schéma technique décidé par ADR** : appareils, sessions de synchronisation, journal des opérations idempotentes, curseurs incrémentaux.
  2. **MLD** :
     - ajouter à `espace` les colonnes `replication_hors_ligne` {autorisée, limitée, interdite} et `duree_max_hors_ligne` ;
     - ajouter `réplication` et `synchronisation` aux domaines `operation` et `canal` de `contexte_evaluation` ;
     - rattacher la zone de réconciliation à `proposition_modification` et `conflit_edition`, avec un état de réception {reçue, intégrée, transformée, en attente, refusée, en erreur}, les versions client, schéma et référentiel déclarées, et l'identifiant d'opération d'origine ;
     - ajouter une CP : « une réplique ne contient que le graphe accessible du contexte de réplication ; les retraits (révocation, purge, protection d'existence) sont diffusés au prochain contact ».
  3. Arbitrer le **canal de révélation par retrait** : la disparition d'un objet d'une réplique révèle qu'il est devenu protégé. Est-ce acceptable ou faut-il un mécanisme de dilution ?
- **Documents :** MLD (§ 5.1, § 5.3, § 11, § 21.2), dictionnaire (ESPACE, CONTEXTE_EVALUATION), CDC technique (§ 9.2), CDCF (voir ECD-19).
- **Décision attendue :** décision d'emplacement, puis validation des ajouts au MLD.
- **GEL :** GEL-07.
- **Statut :** **corrigé le 9/10/2026 (décision d’emplacement prise).** Dans le MLD : `espace.replication_hors_ligne` et `duree_max_hors_ligne_jours` ; `contexte_evaluation` étendu (réplication, synchronisation, application locale, appareil) ; table `contribution_differee` (§ 5.6, idempotence, version de base, versions client, états de réception) ; CP-27 (réception différée) ; CP-28 (réplication, retraits non qualifiés). Hors MLD, schéma technique par ADR tenu par ST-01 à ST-08 (MLD § 28.3). Dictionnaire : § 4.25, DI-B31 à B33, OB-20, OB-21. **Arbitrage retenu sur le canal de révélation par retrait :** retraits non qualifiés ; résidu (la disparition est observable) accepté et documenté, conformément à AUDIT-TECH-001.5 — à confirmer par le porteur. Reste : protocole de synchronisation (architecture) et recettes X02, X15 à X17 à jouer.

---

## Majeurs

### ECD-06 — Fenêtre de fausse certitude pendant la propagation

- **Gravité :** Majeur
- **Formulation actuelle :**
  - MLD CP-21 : « une nouvelle version **scientifique** d'un amont fait passer ses dépendances à `potentiellement affecté` … ; asynchrone admis, délai = MPD-04 ».
  - CDC technique, REC-X12 arbitrage A : « dès qu'un changement amont est validé, les résultats dépendants peuvent être signalés … aucune fenêtre de fausse certitude ».
  - Scénario X12-03 : « propagation en cours → aucun résultat présenté silencieusement comme réexaminé ».
- **Problème :** entre l'écriture de l'amont et le traitement asynchrone, les dépendances restent `inchangé`. Aucune donnée ne permet à un lecteur de savoir qu'une propagation est en attente. X12-03 n'est pas vérifiable.
- **Correction proposée :**
  - Option 1 : marquer **dans la même transaction** les dépendances **directes** (`etat_impact = potentiellement affecté`), et ne laisser en asynchrone que la propagation transitive.
  - Option 2 : ajouter un indicateur synchrone de propagation en attente (sur `version_objet` ou dans une file d'impacts lisible), consulté à la lecture des dépendances.
- **Documents :** MLD (CP-21, `dependance`), dictionnaire (OB-09), CDC technique (TECH-015.13, REC-X12).
- **Décision attendue :** choix entre l'option 1 et l'option 2.
- **GEL :** GEL-06.
- **Statut :** ouvert.

### ECD-07 — Déduplication globale des fichiers, purge et cloisonnement

- **Gravité :** Majeur
- **Formulation actuelle :**
  - MLD § 6.3 : `fichier.empreinte hash NN UQ -- DI-C13`.
  - MLD-15 : « Les fichiers binaires associés sont effacés physiquement ».
  - CDC technique AUDIT-TECH-005 : doublon binaire, « mutualisation technique possible ».
- **Problème :** un même fichier peut être rattaché à des reproductions de plusieurs espaces.
  1. La purge légale dans un espace efface le binaire utilisé légitimement ailleurs, ou bien le conserve, en violation de l'effacement.
  2. Si la déduplication est perceptible (envoi instantané, « déjà présent »), elle révèle qu'un document existe dans un autre espace (AUDIT-TECH-004).
- **Correction proposée :**
  - Unicité par `(espace, empreinte)`, ou comptage de références avec purge physique seulement à la dernière référence.
  - CP : « la déduplication n'est jamais observable d'un espace à l'autre ».
  - Distinguer l'empreinte (contrôle d'intégrité) de la clé de stockage.
- **Documents :** MLD (`fichier`, MLD-15, CP-16), dictionnaire (DI-C13), CDC technique (TECH-006.5–6, TECH-020.4).
- **Décision attendue :** périmètre de la déduplication.
- **GEL :** GEL-07.
- **Statut :** ouvert.

### ECD-08 — États de conservation des fichiers

- **Gravité :** Majeur
- **Formulation actuelle :**
  - MLD : `fichier` ne porte que `est_purge` et `emplacement_stockage`.
  - CDC technique AUDIT-TECH-006.2 : « référence documentaire exploitable seulement une fois la conservation confirmée ».
  - AUDIT-TECH-006.9 : distinguer « temporairement inaccessible / manquant après contrôle / supprimé par procédure autorisée ».
  - AUDIT-TECH-012.10 : contrôles périodiques d'intégrité.
- **Problème :** aucun de ces états, ni la date du dernier contrôle, n'est représentable.
- **Correction proposée :**
  - Ajouter `fichier.etat_conservation` {en réception, confirmé, temporairement inaccessible, manquant, corrompu, purgé} et `date_dernier_controle`.
  - CP : « un `reproduction_fichier` de rôle `master` n'est exploitable scientifiquement que si son fichier est `confirmé` ».
- **Documents :** MLD § 6.3, dictionnaire § 5.8, CDC technique.
- **Décision attendue :** validation des ajouts.
- **GEL :** GEL-07.
- **Statut :** ouvert.

### ECD-09 — Registre de non-résurrection après restauration

- **Gravité :** Majeur
- **Formulation actuelle :**
  - CDC technique AUDIT-TECH-002.9 : « registre sécurisé des suppressions à réappliquer après restauration ».
  - REC-X19 : « aucune résurrection ».
  - MLD : purge en place (MLD-15), sans registre.
- **Problème :** une sauvegarde antérieure à une purge restaure les données purgées, puisque la tombstone n'existait pas encore dans la sauvegarde. Rien ne permet de réappliquer la purge.
- **Correction proposée :**
  - Un registre des purges (identifiant de l'objet, date, fondement minimal) conservé **hors du périmètre restauré**, ou restauré séparément puis réappliqué systématiquement.
  - Les informations du registre sont minimisées (AUDIT-TECH-002.10).
  - Emplacement : schéma technique par ADR, à documenter dans le MLD comme obligation.
- **Documents :** MLD (MLD-15, CP-16), CDC technique (TECH-012, TECH-020.5).
- **Décision attendue :** emplacement et contenu minimal du registre.
- **GEL :** GEL-07.
- **Statut :** ouvert.

### ECD-10 — Tombstones permanentes et effacement légal

- **Gravité :** Majeur
- **Formulation actuelle :**
  - MLD-15 : « purge en place, jamais de suppression physique d'un objet ; la ligne `objet` subsiste » (type, espace, date de création, état).
  - MLD-12 : la résolution « renvoie une tombstone si l'objet est purgé ».
  - CDC technique AUDIT-TECH-010.10 : « un effacement légal peut imposer la suppression d'informations de résolution normalement conservées ».
  - AUDIT-TECH-010.9 : tombstones soumises aux règles de confidentialité.
- **Problème :** le MLD interdit la suppression de ce que le CDC technique peut exiger d'effacer. La tombstone révèle qu'un objet a existé dans un espace donné, à une date donnée.
- **Correction proposée :**
  - Définir le contenu minimal d'une tombstone.
  - Soumettre sa résolution au graphe accessible (existence protégée par défaut pour les objets purgés d'espaces privés).
  - Prévoir un mode « effacement de résolution » qui vide `espace_id` et `date_creation`, ou les remplace par des valeurs neutres, et ne laisse que l'identifiant pour éviter sa réattribution.
- **Documents :** MLD (MLD-12, MLD-15, `objet`), dictionnaire (DD-02, DD-13), CDC technique.
- **Décision attendue :** arbitrage juridique et technique ; dépend de l'analyse RGPD (TECH-020).
- **GEL :** GEL-07.
- **Statut :** ouvert.

### ECD-11 — Consentement sans usage algorithmique

- **Gravité :** Majeur
- **Formulation actuelle :**
  - MLD § 5.5 : `consentement.portee` ∈ {enregistrement, transcription, usage familial, usage projet, publication, usage posthume, biométrie}.
  - CDC technique, L08 arbitrage E : autorisations distinctes pour « collecte, transcription, structuration, partage, contribution scientifique, publication, usages algorithmiques ».
  - REC-J11 : « consentement à la transcription, refus de l'IA ».
- **Problème :** il est impossible d'enregistrer un refus d'usage par l'IA, ni un consentement à la structuration, au partage ou à la contribution scientifique. OB-15 protège les attributs R et I, pas les choix de la personne.
- **Correction proposée :**
  - Étendre le domaine `portee` : `structuration`, `partage`, `contribution scientifique`, `usage algorithmique`, `transmission à un prestataire externe`.
  - CP : « une `activite` de mode `assisté` ou `automatique` dont `fournisseur` est non nul ne peut pas prendre en entrée un objet couvert par un consentement `usage algorithmique` refusé ou retiré ».
- **Documents :** MLD § 5.5, dictionnaire § 4.17 (DI-B25), CDC technique (TECH-017.7, TECH-020.7).
- **Décision attendue :** validation de l'extension du domaine.
- **GEL :** —
- **Statut :** ouvert.

### ECD-12 — Libellés de référentiels monolingues ; langue préférée absente

- **Gravité :** Majeur
- **Formulation actuelle :**
  - MLD § 20.2 : `concept.libelle text NN`, sans langue.
  - MLD § 5.2 : `compte` sans préférence de langue.
  - CDC technique TECH-033.11 : « identifiants et définitions indépendants des libellés traduits ».
  - TECH-033.2 : « langue préférée persistante dans le profil ».
  - CDCF § 99 : « architecture mondiale dès le départ ».
- **Problème :** un prédicat ne peut avoir qu'un libellé, et l'interface ne peut pas afficher « is the father of » sans dupliquer les concepts. La préférence de langue ne peut pas être synchronisée entre surfaces.
- **Correction proposée :**
  - Table `concept_libelle(concept_id, langue, libelle, definition, PK (concept_id, langue))`, avec une langue de repli.
  - `compte.langue_preferee lang`.
  - Rappel : la définition scientifique reste unique, ou bien ses traductions sont des représentations identifiées.
- **Documents :** MLD § 20.2 et § 5.2, dictionnaire (CONCEPT, COMPTE), CDC technique (TECH-033).
- **Décision attendue :** validation.
- **GEL :** GEL-08.
- **Statut :** ouvert.

### ECD-13 — Traçabilité dictionnaire → MLD incomplète

- **Gravité :** Majeur
- **Formulation actuelle :**
  - Dictionnaire, annexe G.2 : « Toute structure du futur MLD devra pouvoir être reliée… ».
  - Annexe I, REC-17 : « Chaque future structure MLD est traçable ».
  - Contrôle mécanique : **92 des 245 règles `DI-*` ne sont citées nulle part dans le MLD**.
- **Problème :** l'implémentation de ces règles n'est pas démontrée. Les cas sensibles sondés sont :
  - **DI-E05** : assertions R par défaut pour une personne vivante ou un mineur ;
  - **DI-E06** : présomption de personne vivante à 120 ans ;
  - **DI-B20** : un embargo survit à l'export, à la restauration et au transfert ;
  - **DI-B21** : un embargo d'existence produit une règle d'existence protégée ;
  - **DI-B23 et DI-B24** : retrait de consentement ;
  - **DI-O12** : évaluation de diffusabilité d'un agrégat ;
  - **DI-B13** : un lien n'est pas plus visible que ses extrémités ;
  - **DI-B14** : contribuer au Core exige un rôle sur l'espace source.
- **Correction proposée :**
  - Compléter la matrice du MLD (§ 25) d'une ligne par `DI-*` : table, contrainte, CK ou CP, ou mention explicite « hors MLD (service, MPD) » avec justification.
  - Pour DI-E05, DI-E06, DI-B20, DI-B21 et DI-B24 : ajouter une CP dédiée et une recette.
- **Documents :** MLD § 21.2 et § 25, dictionnaire annexe G.
- **Décision attendue :** acceptation de la tâche de complétion ; c'est un préalable au gel du MLD.
- **GEL :** GEL-03, GEL-01.
- **Statut :** ouvert.

### ECD-14 — Objets privés sans auteur, créés par un traitement automatique

- **Gravité :** Majeur (P0 : perte d'accès)
- **Formulation actuelle :**
  - CP-23 : « la création d'un objet `privé` crée … une `regle_acces` … pour l'**acteur auteur** ».
  - `activite.acteur_id` 0..1, avec `CK mode <> 'manuel' OR acteur_id IS NOT NULL` : une activité automatique peut être sans acteur.
  - `import` n'a pas de colonne acteur.
  - `objet.visibilite default 'privé'`.
- **Problème :** un objet privé créé par un worker (OCR, extraction IA, import) n'a pas d'auteur. Aucune règle n'est donc créée, et CP-25 interdit la lecture administrative : l'objet n'est lisible par personne.
- **Correction proposée :**
  - CP-23 étendue : « l'auteur est l'acteur **déclencheur** de l'activité de création ; toute activité créant un objet privé doit porter un acteur déclencheur ».
  - Ajouter `import.acteur_id`.
- **Documents :** MLD (CP-23, `activite`, `import`), dictionnaire (ACTIVITE, IMPORT).
- **Décision attendue :** validation.
- **GEL :** GEL-05.
- **Statut :** ouvert.

### ECD-15 — Historique de contributions après un départ

- **Gravité :** Majeur
- **Formulation actuelle :**
  - CDC technique REV-02-D : « l'ancien membre conserve … un historique personnel de ses contributions (titres, dates, rôles, identifiants, statuts, crédits), dans la limite des informations communicables ».
  - MLD : `regle_acces.objet_protege` ∈ {contenu, existence}. Aucun niveau « métadonnées ».
- **Problème :** après la perte de l'appartenance scientifique, aucune règle ne permet d'exposer les métadonnées de ses propres contributions sans en exposer le contenu.
- **Correction proposée :**
  - Option 1 : vue logique « mes contributions », fondée sur `activite.acteur_id` et `credit`, limitée aux métadonnées, avec une CP qui exclut le contenu et les objets dont l'existence est protégée.
  - Option 2 : ajouter la portée `métadonnées` à `objet_protege`.
- **Documents :** MLD (§ 5.3, § 23), dictionnaire, CDC technique.
- **Décision attendue :** choix entre l'option 1 et l'option 2.
- **GEL :** GEL-05.
- **Statut :** ouvert.

### ECD-16 — Tâches asynchrones et migrations patrimoniales

- **Gravité :** Majeur
- **Formulation actuelle :**
  - CDC technique TECH-015.2 : identité persistante des tâches.
  - TECH-015.3 : états minimaux des tâches.
  - TECH-010.5 : états de migration (préparée → … → partiellement terminée).
  - AUDIT-TECH-005.3 : manifeste d'import structuré.
  - MLD : `import [F]` (figé) avec `rapport text`. La table `tache` est la tâche de recherche Echo, sans rapport avec les tâches techniques.
- **Problème :** aucune structure pour les tâches, leurs états, tentatives et erreurs, ni pour l'inventaire multi-source d'une migration. Leur emplacement n'est pas décidé.
- **Correction proposée :**
  - Décision d'emplacement : schéma technique par ADR (recommandé) pour les tâches et l'orchestration.
  - MLD : manifeste d'import structuré (fichiers et empreintes, transformations, erreurs, éléments en attente), ou obligation explicite de le produire.
  - Rappel : une tâche n'est pas un objet scientifique, et le résultat d'une tâche suit le modèle (activité, version).
- **Documents :** MLD (`import`, `lignee_import`), CDC technique § 9.2.
- **Décision attendue :** emplacement et contenu minimal.
- **GEL :** —
- **Statut :** ouvert.

### ECD-17 — Authentification, sessions et appareils

- **Gravité :** Majeur
- **Formulation actuelle :**
  - CDCF § 95 : « MFA ; … gestion sessions/appareils ; … URLs signées ».
  - CDC technique TECH-007 : plusieurs moyens d'authentification, passkeys, révocation d'appareils, réauthentification.
  - MLD : `compte` (email, vérification, état), sans moyen d'authentification ni appareil.
- **Problème :** exigence fonctionnelle et technique sans aucune structure, et sans décision d'emplacement. Elle est liée à ECD-05 : la révocation d'un appareil doit révoquer sa réplique.
- **Correction proposée :**
  - Décision : schéma d'identité technique par ADR (fournisseur d'identité ou module dédié), avec obligations documentées dans le MLD :
    - lien `compte` ↔ appareil ;
    - révocation propagée aux répliques ;
    - aucune donnée biométrique stockée.
- **Documents :** CDC technique § 9.2, MLD § 5.2.
- **Décision attendue :** emplacement.
- **GEL :** —
- **Statut :** ouvert.

### ECD-18 — Rôles d'exploitation de la plateforme

- **Gravité :** Majeur
- **Formulation actuelle :**
  - CDC technique TECH-027.2 : rôles exploitation, support, sécurité, administration des données, déploiement.
  - TECH-027.5 : accès exceptionnels du support.
  - MLD : `attribution_role` est rattachée à un espace ; le rôle `administrateur technique` n'existe qu'au niveau d'un espace.
- **Problème :** le personnel GENIIUS n'a pas de rôle de plateforme représentable. CP-24 (« en vertu d'un rôle d'administration ») ne s'applique donc pas au support.
- **Correction proposée :**
  - Décider si les rôles de plateforme relèvent du MLD (rôle rattaché au Core partagé ou à un espace « plateforme ») ou du schéma technique.
  - Dans tous les cas, l'accès exceptionnel du support passe par CP-24 et CP-26 (ECD-04).
- **Documents :** MLD § 5.2, CDC technique.
- **Décision attendue :** emplacement.
- **GEL :** GEL-05.
- **Statut :** ouvert.

### ECD-19 — Garanties multi-surface et hors ligne sans origine fonctionnelle

- **Gravité :** Majeur
- **Formulation actuelle :**
  - CDC technique TECH-001, 002, 004 et 005 (décisions validées dans les échanges).
  - CDCF : aucune exigence de surface, de hors connexion ni de synchronisation entre appareils (§ 85 traite de la synchronisation **externe**).
- **Problème :** M10-C08 exige une origine fonctionnelle ou une justification technique explicite. Le CDCF ne connaît pas ces besoins pourtant structurants (lecture hors ligne de toute la base sur Mobile).
- **Correction proposée :**
  - Ouvrir un avenant **AV-FONC-002 — Multi-surface et hors connexion**, reprenant TECH-001, 002, 004, 005, AUDIT-TECH-001 et le cas du cimetière sans réseau.
  - À défaut, ajouter dans le CDC technique un champ « justification technique » pour ces exigences.
- **Documents :** CDCF (avenant), CDC technique (§ 10).
- **Décision attendue :** avenant ou justification.
- **GEL :** GEL-03.
- **Statut :** ouvert.

### ECD-20 — Partage sélectif, réutilisation et projets multi-arbres

- **Gravité :** Majeur
- **Formulation actuelle :**
  - MCD C5 : « un `ARBRE` est une vue sur des `PERSONNE` et `RELATION` de son espace » (espace privé ou familial).
  - D-10 : actions sans `réutiliser`.
  - D-45 : flux {contribution privé→Core, import Core→privé, comparaison, échange Tree↔Tree, restauration}.
  - CDC technique : REC-TR08 à TR11 (P0), option C (consultation ou réutilisation, consultation par défaut).
- **Problème :** les recettes P0 TR08 à TR11 ne sont pas exécutables. Il faudrait :
  - une sélection versionnée d'un sous-graphe ;
  - une permission de réutilisation distincte de la lecture ;
  - un flux vers un projet collectif ;
  - un bénéficiaire futur.
- **Correction proposée :** traiter via AV-FONC-001. Décider explicitement :
  - soit le périmètre V1, auquel cas l'avenant est intégré avant le gel ;
  - soit un report à V2, auquel cas TR08 à TR11 passent en recettes V2, avec un invariant V1 (« aucune contribution n'ouvre l'arbre source »).
- **Documents :** AV-FONC-001, CDCF, MCD, dictionnaire, MLD, CDC technique.
- **Décision attendue :** périmètre et calendrier d'AV-FONC-001 (déjà demandé par REV-03-M11).
- **GEL :** gel définitif.
- **Statut :** ouvert.

### ECD-21 — Version du référentiel scientifique non portée par les contributions

- **Gravité :** Majeur
- **Formulation actuelle :**
  - CDC technique TECH-031.2 : « versionner explicitement le référentiel scientifique ».
  - TECH-031.3 : « identifier les définitions applicables à une contribution historique ».
  - TECH-031.14 : exports.
  - AUDIT-TECH-003.1 : synchronisation.
  - MLD : `concept` versionné (objet), `referentiel` conteneur avec manifeste (`version_composant`). `assertion` référence le concept par `id` seul.
- **Problème :**
  - La définition en vigueur peut être retrouvée par la date, mais pas pour une contribution créée **hors ligne** sous un référentiel antérieur.
  - Aucun « numéro de version du référentiel » n'est attaché aux contributions, aux charges de synchronisation ni aux exports.
- **Correction proposée :**
  - Désigner la version du conteneur `referentiel` (manifeste DD-01) comme « version du référentiel ».
  - Enregistrer la version du référentiel utilisée sur l'`activite` de création.
  - Inclure les versions de référentiel dans le manifeste d'export.
- **Documents :** MLD (§ 4.2, § 20.2, `export`), dictionnaire (DD-01), CDC technique (TECH-031).
- **Décision attendue :** validation.
- **GEL :** GEL-06.
- **Statut :** ouvert.

---

## Mineurs

### ECD-22 — Origine de CP-23 à CP-25

- **Formulation actuelle :** MLD CP-23 et CP-25, colonne « Origine » : « § 22.1, CDCF § 49.2 ».
- **Problème :** CDCF § 49.2 dit « Administration technique ≠ autorité historique ». Il traite de l'autorité, pas de la lecture.
- **Correction proposée :**
  - Origine : TECH-011.10, TECH-027.4, REV-02-A, AUDIT-TECH-009.
  - Optionnellement, ajouter au CDCF § 49.2 ou § 62 la phrase « administrer ne confère pas de lecture ».
- **Documents :** MLD, CDCF.
- **Décision :** correction éditoriale.
- **Statut :** ouvert.

### ECD-23 — DI-B04 et l'arbitrage B de REC-X10

- **Formulation actuelle :**
  - DI-B04 : « Un espace a au moins un acteur de rôle `propriétaire` **ou** `administrateur` ».
  - REC-X10, arbitrage B : « le dernier **propriétaire** ne peut être retiré sans transfert ».
- **Problème :** la règle du dictionnaire admet un espace sans propriétaire ; la recette l'interdit.
- **Correction proposée :** aligner DI-B04 (« au moins un `propriétaire` ») ou préciser l'arbitrage B.
- **Documents :** dictionnaire, MLD (CP-06), CDC technique.
- **Décision :** choix de la règle.
- **Statut :** ouvert.

### ECD-24 — Nombre de tables du MLD

- **Formulation actuelle :** le rapport de crash-test cité en REV-01 annonce « 247 tables ». Le MLD présent en définit 246.
- **Correction proposée :** vérifier l'écart (table retirée ou renommée) lors du rétablissement des rapports (ECD-01).
- **Statut :** ouvert.

### ECD-25 — Niveaux et rapport de conversion des exports

- **Formulation actuelle :**
  - D-48 : {format patrimonial GENIIUS, GEDCOM, CSV, JSON, GeoJSON, bibliographique, médias originaux, package de reproductibilité}.
  - `export` sans rapport de pertes.
  - CDC technique AUDIT-TECH-007 : trois niveaux d'export.
  - TECH-026.6 : rapport de conversion.
- **Correction proposée :**
  - Ajouter `export.niveau` {consultation, interopérabilité, patrimonial} et `export.rapport_conversion`.
  - Ajouter au domaine D-48 les formats de consultation (PDF, rapport).
  - Inclure les versions de référentiel dans le manifeste (ECD-21).
- **Documents :** MCD (D-48), dictionnaire, MLD.
- **Statut :** ouvert.

### ECD-26 — Exigences du CDCF non explicites dans le CDC technique

- **Formulation actuelle :**
  - CDCF § 95 : URLs signées, hachage robuste.
  - CDCF § 33.2 : biométrie sur photos (détection visuelle ≠ identification, consentement).
  - CDCF § 78 : couche publique Web.
- **Problème :** le CDC technique ne les mentionne pas explicitement (TECH-007 traite de la biométrie d'authentification, pas de l'analyse de visages).
- **Correction proposée :**
  - Ajouter TECH-019.11 (URLs signées à durée limitée pour les fichiers, hachage de mots de passe selon un standard reconnu).
  - Ajouter TECH-017.15 (reconnaissance de visages : donnée biométrique, consentement `biométrie`, jamais d'identification automatique).
  - Ajouter TECH-016.13 ou TECH-018.13 (couche publique : seul `public indexable` est indexé, avec résolution ARK).
- **Documents :** CDC technique.
- **Statut :** ouvert.

### ECD-27 — Présomption de personne vivante dépendante du temps

- **Formulation actuelle :**
  - DI-E06 : « née … il y a moins de 120 ans ⇒ `raisonnablement présumé vivant` par défaut ».
  - MLD : `personne.regime_protection` stocké.
- **Problème :** avec le temps, une personne sort de la présomption sans qu'aucun recalcul soit prévu. À l'inverse, une date de naissance révisée change la présomption.
- **Correction proposée :**
  - CP de recalcul (statut dérivé, à la manière de CP-10) ou calcul à la lecture.
  - À relier à EXT-02 (seuil à valider juridiquement).
- **Documents :** MLD, dictionnaire.
- **Statut :** ouvert.

### ECD-28 — Colonnes CP-25 absentes du dictionnaire et du MCD

- **Formulation actuelle :**
  - MLD § 5.2 : `nature_habilitation` et `lecture_scientifique` (‡ CP-25).
  - Dictionnaire et MCD : APPARTENIR sans ces attributs.
- **Correction proposée :** reporter ces attributs comme écarts `†` (annexe C du dictionnaire) lors de la révision éditoriale.
- **Statut :** ouvert.

---

## Améliorations

| ID | Proposition | Documents | Décision |
|---|---|---|---|
| ECD-29 | Citer explicitement dans le MLD les règles des critères 29 à 32 et 35 (DI-G07, DI-O11, DI-H04 ; RG-E05 n'a pas de `DI-*`) | MLD, dictionnaire | Éditoriale |
| ECD-30 | Créer les recettes dédiées aux 22 critères du CDCF § 103 qui n'en ont pas (matrice § 2), et rattacher toutes les recettes aux critères et CU du CDCF | CDC technique § 8 | À planifier (GEL-04) |
| ECD-31 | Confirmer la visibilité par défaut `privé` dans les espaces projet : avec CP-25, les objets créés par un collaborateur sont invisibles à l'équipe tant qu'ils ne passent pas en `projet`. Choix fonctionnel à expliciter (CDCF § 61) | CDCF, MLD (`objet.visibilite default`) | Produit |
| ECD-32 | Résoudre les doublons de recettes (CDC technique § 8.15) | CDC technique | GEL-04 |

---

## Suivi des décisions

| ID | Gravité | Décideur | Étape | Statut |
|---|---|---|---|---|
| ECD-01 | Bloquant | Responsable documentaire | Avant gel | Partiellement levé (09/10) : reste gel dictionnaire (REC-16), MLD, PV CDCF |
| ECD-02 | Bloquant | Responsable documentaire | Avant gel | Corrigé (09/10) |
| ECD-03 | Bloquant | Responsable documentaire | Avant gel | Corrigé (09/10) — option B |
| ECD-04 | Bloquant | Modèle de données (MLD) | Avant gel | Corrigé (09/10) — vérification GEL-05 restante |
| ECD-05 | Bloquant | Architecture et MLD | Avant gel (décision d'emplacement) | Corrigé (09/10) — arbitrage « retraits non qualifiés » à confirmer |
| ECD-06 à ECD-21 | Majeur | MLD, architecture, juridique selon l'entrée | Avant MPD, ou inscription au registre des décisions différées | Ouverts |
| ECD-22 à ECD-28 | Mineur | Éditorial | Prochaine révision | Ouverts |
| ECD-29 à ECD-32 | Amélioration | Recette, produit | Planification | Ouverts |

Les décideurs sont à nommer (REV-03-C).

---

## Écarts ajoutés après l'audit initial

### ECD-33 — Réutilisations publiques d'une entité du Core

- **Gravité :** Majeur
- **Origine :** relevé le 9/10/2026, lors de la révision du MLD.
- **Formulation actuelle :**
  - MLD § 29, point V-5 : « Rapprochements vivant dans l'espace de leur auteur — garantit qu'un utilisateur ne découvre pas les rapprochements des autres ; **le Core ne sait donc pas combien d'arbres pointent une entité** ».
  - CDC technique, REC-TR07 (P1) : « depuis le Core, afficher les arbres publics qui réutilisent une connaissance, sans révéler les arbres protégés ».
- **Problème :** les deux exigences sont compatibles dans leur intention, mais le MLD ne dit pas comment calculer les réutilisations **publiques**. Les rapprochements et références vivent dans les espaces des auteurs.
- **Correction proposée :** calculer les réutilisations sur le graphe accessible du lecteur, en ne parcourant que les `rapprochement` et `reference_inter_espace` dont l'espace et le lien sont publiquement visibles (CP-12). Formuler V-5 ainsi : « le Core ne connaît que les réutilisations publiques ». Ajouter un test TR07-02 au MLD.
- **Documents :** MLD § 29 (V-5), § 22.3 ; CDC technique REC-TR07.
- **Décision attendue :** validation de la formulation.
- **GEL :** GEL-05.
- **Statut :** ouvert.
