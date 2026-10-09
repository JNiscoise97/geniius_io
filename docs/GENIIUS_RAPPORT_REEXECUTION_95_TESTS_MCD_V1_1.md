# GENIIUS --- Rapport de réexécution complète des tests du MCD V1.1 canonique

**Date :** 7 octobre 2026\
**Objet :** réexécution indépendante de la batterie de tests sur la
dernière version du MCD\
**Périmètre :** 25 cas d'usage + 50 critères de recette + 20 tests
canoniques de non-régression = **95 contrôles**

## 1. Méthode

Chaque contrôle a été rejoué contre les structures, associations,
cardinalités conceptuelles, invariants et règles de gestion présents
dans le MCD V1.1. Un test n'est déclaré PASS que si le modèle contient
un mécanisme permettant réellement le scénario sans violer un invariant.
La simple présence du scénario dans la section des tests n'est pas
considérée comme une preuve.

Statuts possibles : **PASS**, **PASS SOUS CONDITION**, **FAIL**.

## 2. Résultat global

  Batterie                     Nombre     PASS   PASS sous condition    FAIL
  -------------------------- -------- -------- --------------------- -------
  Cas d'usage                      25       25                     0       0
  Critères de recette              50       50                     0       0
  Non-régression canonique         20       20                     0       0
  **TOTAL**                    **95**   **95**                 **0**   **0**

**Verdict : 95/95 PASS. Aucun échec structurel détecté.**

Ce résultat ne signifie pas que les choix de MLD/MPD sont résolus : il
signifie que les scénarios testés sont représentables conceptuellement
sans contradiction ni ajout d'un nouveau type fondamental.

## 3. Réexécution des 25 cas d'usage

  --------------------------------------------------------------------------------
  Test              Cas               Verdict           Justification
  ----------------- ----------------- ----------------- --------------------------
  CU-01             Charles TANCRÈDE  **PASS**          EVENEMENT
                    1881--1890                          (décision/réalisation),
                                                        RECIT, PRESENCE, QUESTION,
                                                        RECHERCHE_EFFECTUEE
                                                        négative, INTERPRETATION
                                                        versionnée et DEPENDANCE
                                                        permettent de conserver
                                                        chronologie, trous et
                                                        conclusions sans les
                                                        confondre.

  CU-02             Habitation Dolé   **PASS**          PERSONNE à
                    1793                                individualisation
                                                        minimale,
                                                        COLLECTIF_HISTORIQUE,
                                                        CANDIDATURE et protocole
                                                        documentaire couvrent
                                                        l'exploitation exhaustive
                                                        sans favoriser les
                                                        personnes les mieux
                                                        documentées.

  CU-03             Registre perdu de **PASS**          DOCUMENT perdu,
                    Deshaies                            RECONSTRUCTION
                                                        concurrente,
                                                        ELEMENT_RECONSTRUIT,
                                                        appuis, candidatures
                                                        rejetées et références
                                                        figées permettent une
                                                        reconstruction sans
                                                        fabriquer l'original.

  CU-04             Projet CHARBONNÉ  **PASS**          ARBRE privé, flux
                                                        explicites, FILIATION,
                                                        SNAPSHOT, DECOUVERTE,
                                                        garde et export
                                                        patrimonial couvrent
                                                        recherche, transmission et
                                                        souveraineté.

  CU-05             Photo familiale   **PASS**          Recto/verso, album,
                                                        annotations, regroupements
                                                        visuels, propositions
                                                        concurrentes, protection
                                                        et consentement
                                                        biométrique sont séparés.

  CU-06             Mémoire familiale **PASS**          SESSION_MEMOIRE, ECHANGE,
                                                        REPONSE, états de mémoire,
                                                        EMBARGO, CAPSULE, campagne
                                                        et garde couvrent
                                                        collecte, révision,
                                                        consentement et
                                                        transmission.

  CU-07             Mission aux       **PASS**          MISSION, ITEM_MISSION,
                    archives                            délégation, MICRO_MISSION,
                                                        niveau de consultation,
                                                        reproduction et recherche
                                                        négative conservent ce qui
                                                        a été fait et par qui.

  CU-08             Reconstruction    **PASS**          LIEU multi-couches,
                    territoriale                        relations spatiales,
                                                        SITUATION, EVENEMENT et
                                                        GEOMETRIE incertaine
                                                        permettent des territoires
                                                        concurrents et temporels.

  CU-09             Statistique       **PASS**          CORPUS, METHODE, CALCUL,
                    historique                          RESULTAT et
                                                        DIFF_CONNAISSANCE
                                                        distinguent source,
                                                        calcul, état de
                                                        connaissance et
                                                        obsolescence.

  CU-10             Désaccord         **PASS**          ACTE_EVALUATION, ARGUMENT,
                    scientifique                        groupes/liens d'intérêt,
                                                        réexamen et CREDIT
                                                        autorisent des positions
                                                        concurrentes sans vote de
                                                        vérité.

  CU-11             Publication à     **PASS**          Licences par composant,
                    droits mixtes                       embargo, masquage, mode
                                                        d'exposition et
                                                        indexabilité indépendante
                                                        permettent une publication
                                                        sélective.

  CU-12             Pérennité         **PASS**          EXPORT, IMPORT,
                                                        RECONCILIATION_IMPORT,
                                                        FILIATION et garde
                                                        permettent portabilité et
                                                        restauration sans
                                                        publication implicite.

  CU-13             « Un des fils de  **PASS**          POSITION_RELATIONNELLE +
                    Jean DUPONT »                       CANDIDATURE + ARGUMENT
                                                        représentent une place
                                                        relationnelle inconnue
                                                        sans créer une fausse
                                                        personne.

  CU-14             CHARBONNET /      **PASS**          Deux assertions de nom
                    CHARBONNIER                         peuvent coexister, chacune
                                                        ancrée ; CHOIX_AFFICHAGE
                                                        ne transforme pas la
                                                        préférence en vérité.

  CU-15             Emploi 1834 /     **PASS**          Les trois SITUATION
                    1837 / 1841                         restent des points
                                                        attestés ; toute
                                                        continuité doit être une
                                                        assertion/interprétation
                                                        distincte.

  CU-16             Photo « Joseph /  **PASS**          Annotations et assertions
                    Paul »                              concurrentes coexistent ;
                                                        une réponse Journal peut
                                                        apporter une nouvelle
                                                        trace sans écraser les
                                                        précédentes.

  CU-17             Convoi de 24      **PASS**          COLLECTIF_HISTORIQUE +
                    personnes                           POSITION_RELATIONNELLE
                                                        permettent de représenter
                                                        l'effectif sans inventer
                                                        23 PERSONNE.

  CU-18             « 47 personnes à  **PASS**          La scission d'un
                    Dolé »                              rapprochement peut
                                                        affecter un RESULTAT
                                                        dynamique tandis qu'une
                                                        PUBLICATION figée conserve
                                                        l'ancien résultat ;
                                                        DIFF_CONNAISSANCE explique
                                                        le changement.

  CU-19             Témoignage sous   **PASS**          EMBARGO, RG-P02 et modes
                    embargo                             d'exposition permettent de
                                                        conserver une conclusion
                                                        sans exposer
                                                        illégitimement la trace.

  CU-20             Validation 2028,  **PASS**          L'acte d'évaluation
                    preuve disparue                     historique reste conservé
                    2035                                ; l'accessibilité actuelle
                                                        de la preuve est un état
                                                        distinct.

  CU-21             Arsène CHARBONNÉ  **PASS**          Deux espaces/objets locaux
                    dans deux Trees                     peuvent référencer ou
                                                        rapprocher la même
                                                        identité Core sans lien ni
                                                        synchronisation entre
                                                        utilisateurs.

  CU-22             Personne sans nom **PASS**          Une REQUETE peut produire
                                                        une liste de candidats
                                                        sans créer une PERSONNE
                                                        pour le profil recherché.

  CU-23             Première /        **PASS**          Ces bornes sont calculées
                    dernière                            sur les assertions et ne
                    attestation                         deviennent pas des
                                                        événements de vie.

  CU-24             Autorisation de   **PASS**          mode_realite distingue
                    voyage                              autorisation/intention de
                                                        la réalisation ; aucun
                                                        voyage réel n'est déduit.

  CU-25             Acte manquant     **PASS**          ANOMALIE_DOCUMENTAIRE,
                                                        INTERPRETATION et PISTE
                                                        distinguent anomalie,
                                                        hypothèse et travail à
                                                        poursuivre.
  --------------------------------------------------------------------------------

## 4. Réexécution des 50 critères de recette

Pour cette batterie, le MCD fournit lui-même la matrice de traçabilité
vers les mécanismes. J'ai vérifié que les mécanismes cités existent dans
le modèle et ne sont pas contredits par les règles consolidées.

  ---------------------------------------------------------------------------------
                       Critère Verdict               Mécanisme vérifié
  ---------------------------- --------------------- ------------------------------
                             1 **PASS**              etat_examen +
                                                     statut_validation +
                                                     nature/modalité/plausibilité

                             2 **PASS**              RG-D01 + VERSION_OBJET

                             3 **PASS**              RG-D03

                             4 **PASS**              RG-F04

                             5 **PASS**              RG-E02

                             6 **PASS**              RG-E02

                             7 **PASS**              RG-E02

                             8 **PASS**              RG-B01

                             9 **PASS**              RG-L02

                            10 **PASS**              RG-L03

                            11 **PASS**              RG-P02

                            12 **PASS**              RG-N01

                            13 **PASS**              RG-O01

                            14 **PASS**              RG-A06 + etat_examen

                            15 **PASS**              RG-A05

                            16 **PASS**              RG-H04

                            17 **PASS**              RG-C03 + RG-H02 +
                                                     CITATION_DOCUMENTAIRE +
                                                     TRANSMISSION

                            18 **PASS**              RG-Q02

                            19 **PASS**              RG-K01 + couverture de
                                                     RECHERCHE_EFFECTUEE

                            20 **PASS**              RG-K03

                            21 **PASS**              RG-K04

                            22 **PASS**              RG-E06

                            23 **PASS**              P7 + Tree en espace privé

                            24 **PASS**              RG-A03

                            25 **PASS**              RG-A04 + dépendance de droits

                            26 **PASS**              RG-D04

                            27 **PASS**              RG-E03 + RG-R02

                            28 **PASS**              RG-O05

                            29 **PASS**              RG-G06

                            30 **PASS**              RG-G06

                            31 **PASS**              RG-E05

                            32 **PASS**              RG-E05

                            33 **PASS**              RG-C05

                            34 **PASS**              RG-C06

                            35 **PASS**              RG-H06 ; BADGE jamais cible de
                                                     ETAYER

                            36 **PASS**              RG-H03

                            37 **PASS**              RG-B04 + RG-J07

                            38 **PASS**              RG-D04 + SIGNALER_CONTEXTE

                            39 **PASS**              FINANCEMENT sans effet sur
                                                     ACTE_EVALUATION

                            40 **PASS**              identité civile interne + mode
                                                     d'affichage public

                            41 **PASS**              RG-O03

                            42 **PASS**              RG-Q01

                            43 **PASS**              RG-Q02

                            44 **PASS**              RG-P07

                            45 **PASS**              RG-P05

                            46 **PASS**              RG-P06

                            47 **PASS**              RG-P03

                            48 **PASS**              P4 + validité des versions +
                                                     SNAPSHOT

                            49 **PASS**              RG-E02 ; densité documentaire
                                                     non pondérante

                            50 **PASS**              LACUNE + plausibilité
                                                     indéterminée + POSITION
                                                     ouverte
  ---------------------------------------------------------------------------------

## 5. Réexécution détaillée des 20 tests canoniques de non-régression

  ---------------------------------------------------------------------------------------------------------
                     \# Scénario                  Verdict          Raisonnement de test
  --------------------- ------------------------- ---------------- ----------------------------------------
                      1 50 projets référencent la **PASS**         REFERENCE_INTER_ESPACE est précisément
                        même identité Core sans                    une référence sans copie ; RG-A08
                        copie                                      interdit copie, filiation et
                                                                   synchronisation implicites.

                      2 Un projet dérive un état  **PASS**         FILIATION crée un objet autonome pouvant
                        local divergent                            diverger (RG-A09), sans modifier
                                                                   l'amont.

                      3 Deux identités locales    **PASS**         RAPPROCHEMENT relève de l'hypothèse
                        rapprochées sans fusion                    identitaire ; il n'est ni une référence
                        irréversible                               ni une fusion physique.

                      4 Relation privée entre     **PASS**         RG-B11/B12 rendent l'arête elle-même
                        deux personnes publiques                   gouvernable et permettent de cacher son
                                                                   existence.

                      5 Preuve privée             **PASS**         DEPENDANCE_PRODUCTION et
                        historiquement utilisée,                   DEPENDANCE_JUSTIFICATION sont distinctes
                        conclusion désormais                       ; BASE_JUSTIFICATIVE est versionnée.
                        justifiée publiquement                     

                      6 Suppression d'un compte   **PASS**         COMPTE et ACTEUR_GENIIUS sont distincts
                        sans perte d'attribution                   ; RG-B08 conserve l'identité
                        scientifique                               scientifique lorsque légitime.

                      7 GEDCOM importé deux fois  **PASS**         IMPORT + ACQUISITION +
                        sans devenir deux                          RECONCILIATION_IMPORT reconnaissent lot,
                        ensembles de preuves                       IDs externes, empreinte et objets déjà
                                                                   acquis ; RG-A14 interdit de confondre
                                                                   import et preuve.

                      8 Scission d'une cible Core **PASS**         ETAT_REFERENCE_EXTERNE + RG-A11 font
                        sans réécriture                            évoluer la référence et déclenchent
                        silencieuse de Tree                        éventuellement un réexamen, sans
                                                                   modifier l'objet local.

                      9 Agrégat public sans       **PASS**         RG-B14 + CONTEXTE_EVALUATION + règle
                        révéler le nombre                          GRAPHE_ACCESSIBLE avant agrégation
                        d'éléments secrets                         empêchent le comptage des éléments
                                                                   invisibles.

                     10 Notification sans révéler **PASS**         La notification est calculée sur le
                        une contradiction privée                   graphe accessible et n'est créée que si
                                                                   événement, existence et contenu sont
                                                                   communicables.

                     11 Export sans révéler une   **PASS**         Le manifeste, les références et les
                        dépendance interdite                       dépendances d'export sont eux-mêmes
                                                                   soumis au CONTEXTE_EVALUATION.

                     12 Traduction sans écraser   **PASS**         Les couches de transcription/traduction
                        la proposition originale                   et l'EXPRESSION_ASSERTION sont
                                                                   dérivées/versionnées ; l'original reste
                                                                   distinct.

                     13 Même fichier dans deux    **PASS**         RG-C07 limite la fusion aux doublons
                        contextes sans fusion                      techniques ; §5.5 dit explicitement
                        documentaire                               qu'une même ressource peut participer à
                                                                   plusieurs occurrences documentaires.

                     14 Raisonnement circulaire   **PASS**         DEPENDANCE_RAISONNEMENT représente les
                        non compté comme                           cycles ; RG-A13 interdit de les compter
                        corroboration                              comme justifications indépendantes.

                     15 Deux positions            **PASS**         POSITION_EPISTEMIQUE/ACTE_EVALUATION
                        scientifiques                              permettent des positions concurrentes
                        incompatibles coexistent                   sans écrasement.

                     16 Source importée non       **PASS**         Le MCD prévoit les états non
                        identifiée reste                           résolue/déclarée/rapprochée/identifiée
                        SOURCE_EXTERNE_DECLAREE                    et interdit de créer automatiquement un
                                                                   DOCUMENT identifié.

                     17 Nouvelle numérisation     **PASS**         §5.5 interdit explicitement de
                        exige nouvel alignement                    réutiliser automatiquement les
                                                                   coordonnées d'une ancienne reproduction.

                     18 Retrait de consentement   **PASS**         RG-B06 historise le retrait ; production
                        sans destruction                           et justification étant distinctes, une
                        automatique d'une                          conclusion indépendamment justifiée
                        conclusion indépendante                    n'est pas détruite mécaniquement.

                     19 Tree reste souverain      **PASS**         RG-A11 et la distinction
                        après évolution du Core                    référence/filiation empêchent toute
                                                                   réécriture silencieuse de l'espace Tree.

                     20 API indistinguable entre  **PASS**         RG-B11 protège l'existence ; le MCD
                        absence et existence                       impose que l'absence apparente via API
                        secrète quand requis                       ne révèle pas un objet caché.
  ---------------------------------------------------------------------------------------------------------

## 6. Tests les plus critiques

Les tests 4, 5, 7, 8, 9, 10, 11, 14, 18, 19 et 20 étaient les plus
susceptibles de révéler une faiblesse structurelle, car ils combinent
plusieurs domaines du modèle. Ils passent tous.

### 6.1 Confidentialité structurelle

Les tests 4, 9, 10, 11 et 20 passent parce que le MCD ne traite plus la
confidentialité comme un simple filtre d'affichage. Les arêtes et
l'existence peuvent être protégées, et l'opération est exécutée sur le
graphe accessible après évaluation du contexte.

### 6.2 Souveraineté des espaces

Les tests 1, 2, 8 et 19 passent grâce à la distinction désormais nette
entre REFERENCE_INTER_ESPACE, FILIATION et RAPPROCHEMENT, complétée par
ETAT_REFERENCE_EXTERNE. Une évolution du Core peut signaler un problème
à Tree, mais ne le réécrit pas.

### 6.3 Provenance et justification

Les tests 5, 7, 14 et 18 passent parce que le modèle distingue
acquisition, production, justification et raisonnement. C'est un point
majeur : l'origine technique d'une donnée n'est pas une preuve,
l'histoire de production d'une conclusion n'est pas sa justification
actuelle et une dépendance circulaire ne devient pas une corroboration.

## 7. Vérification des cinq points encore ouverts

Les cinq points ouverts du §25.3 ont été examinés pour déterminer s'ils
invalidaient un test.

  -----------------------------------------------------------------------
  Point ouvert            Impact sur les tests    Conclusion
  ----------------------- ----------------------- -----------------------
  Granularité des         Aucun test n'exige de   Non bloquant ;
  versions                trancher segment vs     dictionnaire/MLD
                          transcription entière   

  Prédicats initiaux      Les tests exigent       Non bloquant
                          l'extensibilité, déjà   
                          portée par les          
                          référentiels            

  Seuil                   Le modèle sait          Non bloquant ;
  d'individualisation     représenter mention,    gouvernance
  Core                    position et personne    
                          minimale                

  Indépendance des        Le concept est          Non bloquant ;
  sources calculée ou     représentable dans les  MLD/optimisation
  matérialisée            deux cas                

  Périmètre détaillé de   Aucun test structurel   Non bloquant ;
  Connect                 ne dépend d'un          conception applicative
                          catalogue définitif de  
                          jeux                    
  -----------------------------------------------------------------------

## 8. Recherche de faux positifs

J'ai spécifiquement cherché les situations où le document aurait pu
déclarer un test sans fournir le mécanisme correspondant. Aucun faux
PASS structurel n'a été trouvé dans les 95 contrôles.

Quelques mécanismes devront cependant être rendus exécutables au stade
suivant : contraintes d'intégrité, stratégie de versionnement physique,
calcul du graphe accessible, RLS/ACL, détection de cycles,
réconciliation d'import, résolution des identifiants et calcul des
agrégats sûrs. Ce sont des obligations d'implémentation issues du MCD,
pas des lacunes du MCD.

## 9. Verdict de gel

### Résultat final : **95 PASS / 95 --- 0 PASS sous condition --- 0 FAIL**

Sur la batterie de tests explicitement présente dans la version V1.1, je
ne trouve plus de raison conceptuelle de produire un V1.2 avant le
dictionnaire de données.

> **Le MCD V1.1 passe intégralement sa batterie actuelle de tests et
> peut être gelé comme baseline conceptuelle.**

Le point de vigilance change désormais de nature : le risque principal
n'est plus l'insuffisance du MCD, mais une traduction trop naïve en
modèle logique ou en règles d'accès qui détruirait les distinctions
qu'il vient précisément de sécuriser.

## 10. Condition de maintien du gel

À partir de maintenant, un futur FAIL ne doit rouvrir le MCD que s'il
démontre qu'un scénario métier ne peut pas être représenté avec les
concepts existants. Une difficulté SQL, Supabase, API, RLS, performance
ou UX doit d'abord être traitée au dictionnaire, au MLD, au MPD ou dans
l'architecture.

**Prochaine étape recommandée : Dictionnaire de données GENIIUS V1.0.**
