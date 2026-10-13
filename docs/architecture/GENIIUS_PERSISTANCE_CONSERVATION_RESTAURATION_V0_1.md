# GENIIUS — Persistance, conservation et restauration V0.1

**13 octobre 2026 — architecture candidate, non gelée.** Dossier 4 du [cadrage](GENIIUS_CADRAGE_ARCHITECTURE_V0_1.md), après les [transactions du Core](GENIIUS_CORE_MODULES_TRANSACTIONS_V0_1.md), la [sécurité/concurrence](GENIIUS_AUTORISATIONS_ISOLATION_CONCURRENCE_V0_1.md) et la [synchronisation](GENIIUS_SYNCHRONISATION_COMPATIBILITE_HORLOGE_V0_1.md). Références : [CDC V1.2](../GENIIUS_CDC_TECHNIQUE_V1_0.md) TECH-006/012/019/020/026 et AUDIT-TECH-002/005/006/007/012, [MLD V1.1-g](../GENIIUS_MLD_V1_0.md) CP-01/02/16/17/22/41/43/52 et ST-12/13, [contrat V1.6](../GENIIUS_CONTRAT_AUTORISATION_V1.md) A6, § 13.11 et § 15. Dossiers instruits : DEC-ARCH-02/06/14/15, MPD-01/05 et obligations de SYN-03. Aucun SGBD, stockage ni fournisseur n’est choisi.

## 1. ADR-CORE-008 — Trois classes de persistance

| Classe | Autorité / propriétaire | Garanties |
|---|---|---|
| Relationnel canonique | Modules propriétaires, versions communes M03 | Écritures scientifiques atomiques, historiques et FK réelles ; continuité et unicités du MLD ; jamais seconde vérité dans cache/index. |
| Stockage documentaire | M05 pour disponibilité/conservation, adaptateur pour octets | Originaux distincts des dérivés, empreinte/intégrité, état réel ; aucune référence déclarée exploitable avant conservation confirmée. |
| Schéma technique durable | M14/M13/M01 selon contrats | Commandes/idempotence, outbox/tâches, appareils/sessions, curseurs/accusés, transferts et registres de reprise ; pas objets scientifiques supplémentaires implicites. |

Les index, caches, miniatures dispensables et vues matérialisées sont reconstructibles ; leur perte ne perd ni connaissance, ni autorité, ni identités de commandes déjà intégrées. Les transcriptions ou résultats scientifiquement intégrés ne sont pas des caches jetables, même lorsqu’ils proviennent d’un traitement technique.

L’état canonique d’un objet versionné suit CP-01/02/22 : activité, nouvelle version, courant/historiques, associations et manifeste aux jalons, empreinte d’état et impacts directs dans le même commit. Une migration de stockage ne réattribue ni identifiant ni auteur. Les référentiels sont versionnés indépendamment du schéma et du logiciel. Les index physiques nécessaires restent MPD-01 ; aucune option de partitionnement n’est ratifiée ici.

Les garanties du stockage technique sont classifiées par donnée. Perdre un cache de progression peut être réparé ; perdre la preuve qu’une consommation ou une contribution a déjà été intégrée ne peut pas être traité comme une simple reconstruction de cache.

## 2. ADR-CORE-009 — Dépôt et intégrité sans transaction fictive base/fichiers

T10 possède plusieurs étapes durables ; aucune transaction distribuée avec le stockage objet n’est présumée. L’identité d’opération/dépôt et les empreintes permettent reprise, tandis que les états relationnels contrôlent ce qui peut être présenté scientifiquement.

| Phase | Écriture et preuve | État exposable |
|---|---|---|
| P01 — Réception | Dépôt privé identifié, provenance déclarée, chunks/tailles/empreintes et permissions ; fichiers non fiables isolés | En réception, pas original scientifiquement disponible. |
| P02 — Contrôle | Taille/format/intégrité et analyse isolée ; original reçu jamais altéré par le traitement | Contrôle en cours/échec explicite ; aucune validation historique déduite de l’import. |
| P03 — Conservation | Stockage confirme une copie complète dont identité et empreinte sont vérifiables ; résultat de conservation durable lié au dépôt | Binaire conservé, encore non publié si métadonnées non commises. |
| P04 — Canonisation | Transaction M05/M03 : métadonnées, liens, provenance, état `confirmé`, manifeste, activité/version et travail dérivé | Exploitable seulement si conservation confirmée et droits actuels. |
| P05 — Dérivation | Tâche durable, original/référentiel identifiés ; produit nouveau fichier/objet traçable et contrôle de résultat | Dérivé distinct, statut d’examen et restrictions conservés. |

Le succès P03 n’est pas une publication ; le succès P04 ne garantit pas éternellement la santé du stockage. Les contrôles périodiques et toute lecture détectant un défaut actualisent la disponibilité conformément à CP-41. Une zone ou transcription d’appui ne contourne pas l’exigence de conservation de son fichier support. Un défaut produit un état temporairement inaccessible ou manquant après contrôle, jamais une source supposée disponible.

Reprise : après P03 sans P04, retrouver le dépôt par identité, vérifier octets/preuve et refaire P04 sans doublon. Un P04 sans preuve admissible de P03 doit être impossible ; en anomalie détectée, fermer l’usage scientifique concerné et qualifier, sans fabriquer une confirmation. Un nettoyage ne supprime pas un binaire parce qu’une transaction n’a pas encore créé sa référence : il consulte les dépôts/tâches en cours, le manifeste et les obligations de conservation.

Les chunks corrompus ou répétés ne remplacent pas silencieusement l’original. Une empreinte identique établit une identité binaire, pas un même document historique ni une preuve indépendante. Les transformations/miniatures/OCR génèrent leurs propres identités, versions/outils et relations de provenance ; les originaux sont immuables sous réserve de la purge autorisée.

## 3. Déduplication, confidentialité et récupération

La mutualisation physique peut être étudiée, mais chaque dépôt scientifique conserve identité, propriétaire, espace, provenance, disponibilité et politique de droits propres. Aucun API, compteur, coût observable ou temps de dépôt ne confirme à un utilisateur qu’un tiers possède le même fichier. Une empreinte brute d’un contenu sensible peut être révélatrice ; elle n’est pas un identifiant public ni un oracle de recherche.

Un effacement ne supprime pas aveuglément les octets requis par un autre dépôt légitimement conservé, et une autre référence ne sert pas à maintenir accessible un contenu qui doit être effacé dans le périmètre concerné. Les filiations et restrictions non levables des copies restent opposables selon V1.6, même si le binaire est mutualisé. Le MPD doit démontrer référencement physique, isolation de clés et portée d’effacement ; si cela ne peut être garanti, la mutualisation entre ces périmètres est écartée.

Un fichier perdu n’est pas remplacé par un fichier « ressemblant ». Une récupération vérifie empreinte, provenance et état ; le retour d’une copie saine ne restaure jamais un droit retiré ou une résolution légalement neutralisée. Une conversion avec perte garde le rapport et n’écrase pas la source. Le paquet patrimonial complet reste documenté, versionné, filtré et reconstructible sans GENIIUS ; il ne constitue pas une copie autorisée de toutes les données du système.

## 4. ADR-CORE-010 — Registres durables de non-résurrection

ST-12 exige un registre de purges hors du périmètre des sauvegardes restaurées. La proposition ajoute à l’étude un registre minimal des actes de sécurité opposables et des identités d’effets déjà intégrés, car restaurer une base plus ancienne ne doit ni réactiver une habilitation close ni réexécuter une commande/consommation. Ces registres ne sont ni un historique de contenu scientifique ni une projection de permissions autonome.

| Registre logique | Information nécessaire / accès | Réconciliation |
|---|---|---|
| Effacement/purge | Identifiant opaque ou résolution contrôlée, ordre/date et fondement minimal autorisé, périmètre technique nécessaire ; aucun contenu, titre ou détail reconstructif | Réappliquer CP-16 et DD-27 avant toute réouverture ; minimisation et obligations de conservation du registre lui-même. |
| Autorité opposable | Actes/révisions/époques et échéances nécessaires à reconstituer fermetures/protections/état actuel, sous accès strict | Vérifier droits actuels, pas simplement ceux de la sauvegarde ; aucune ouverture si complétude/fraîcheur non prouvées. |
| Effets intégrés | Identité d’origine/commande/consommation, empreinte protégée, preuve de statut/révision et correspondance minimale autorisée | Détecter replays et effets perdus avec la sauvegarde ; empêcher double intégration/double imputation. |

Les registres disposent de leur propre durabilité, intégrité, ordre/checkpoint et sauvegarde, dans un périmètre qui ne régresse pas avec la restauration de la base. Une copie dans le même domaine de panne ou restaurée au même instant ancien ne prouve pas cette indépendance. Aucun nombre de copies/régions ni fournisseur n’est adopté avant étude.

**Protocole à démontrer :** avant un effet irréversible de purge/sécurité, consigner durablement une intention idempotente ; appliquer l’effet relationnel et un reçu de commit ; rapprocher intention/reçu et statut externe. Une intention ne donne pas la preuve d’un commit, et son abandon ne réactive aucun droit. Si le crash rend l’issue incertaine, le périmètre reste fermé pendant réconciliation. Aucune ouverture ne peut dépendre d’un accusé externe dont la durabilité n’a pas été démontrée.

Il n’existe pas de commit atomique implicite entre base et registre indépendant : ordre des écritures, preuve d’accusé, reprise de chaque interruption et point de prise d’effet doivent être établis au MPD/exploitation. Une alternative transactionnelle journalisée avec copie durable indépendante peut être retenue si elle prouve la même non-régression. Le choix constitue PER-03, pas une propriété déjà obtenue.

La rétention des reçus d’intégration ne peut expirer avant que toute répétition admissible soit neutralisée par une autre preuve durable. Après une restauration qui a perdu un effet pourtant confirmé, cet effet ne doit être ni simplement ignoré parce que son reçu subsiste, ni exécuté une seconde fois aveuglément : réconcilier/reconstruire sous contrôle lorsque possible, sinon garder une anomalie explicite et le delta récupérable. Les identités des commandes ne permettent pas de reconstituer un contenu purgé. Durées, minimisation et compatibilité avec effacement sont des décisions à instruire (SYN-03/PER-03/04).

## 5. Purge et fermeture des dérivés

T14 commence par le dossier/acte autorisé selon la procédure amont ; ni l’administrateur technique ni une demande non vérifiée ne déclenchent un effacement métier. M02 et les propriétaires fixent le périmètre, les effets et les fondements ; M03 coordonne la neutralisation. La garde d’autorisation empêche toute nouvelle exposition pendant cette transition.

La transaction pose l’état opposable/barrière, neutralise courants, toutes versions et associations concernés, ajuste résolution et unicités du MLD, activités et références reconstructives selon CP-16/DD-27, et enregistre le travail durable pour les dérivés. Un `objet.version_courante` conservé comme compteur technique n’est pas une résolution de contenu effacé. Une trace publique de suppression n’est permise que dans les limites CP-43 ; cible cachée et inexistante restent indistinguables.

Les workers purgent binaires/miniatures, index/caches et autres sorties sous suivi d’accusés. Les appareils appliquent les retraits non qualifiés à reconnexion/échéance ; les deltas personnels sont conservés selon la procédure et ne servent pas à réintégrer un contenu interdit. Les sauvegardes ont une rétention bornée et sont soumises aux règles de réapplication ; elles ne sont pas une permission de republier après restauration.

Un historique immuable de sauvegarde n’est pas une conservation éternelle. Les durées/fondements juridiques et cas de conservation distincte restent à fixer avec les responsables compétents. Une suppression cryptographique seule ne prouve pas l’effacement : clés, copies, sauvegardes, métadonnées, dérivés et possibilité de reconstitution doivent être couverts. Le statut « purge complète » demande les preuves du périmètre et de ses obligations résiduelles, pas seulement le succès d’un UPDATE.

## 6. ADR-CORE-011 — Sauvegarde et restauration sous barrière

Les sauvegardes couvrent base, documents et schéma technique critique ; elles sont chiffrées, avec copie critique isolée et portion immuable pendant une durée définie. Les secrets de restauration sont récupérables par procédure contrôlée distincte, sans clé laissée près des données. Politique de rétention, fréquence, régions/copies et outillage restent DEC-ARCH-14 et PER-01/05.

Chaque génération porte un manifeste protégé : identités/versions de base/schéma/référentiels, checkpoint/ordre de commit, état des binaires/empreintes, tâches en cours, reçu/checkpoint des registres indépendants et limites connues. Un manifeste est lui-même soumis aux autorisations ; son inventaire n’est pas public. Base et stockage à instants différents ne sont pas considérés cohérents sans procédure de rapprochement.

| Phase | Étape de restauration | Porte de sortie |
|---|---|---|
| R01 — Isoler | Authentifier l’opération, geler toute sortie scientifique et toute exécution automatique de tâches | Environnement fermé, identités et secrets d’exploitation contrôlés. |
| R02 — Restaurer | Génération/manifeste vérifiés, schéma/référentiel et base/médias rétablis | Pas de sortie tant que cohérence n’est pas établie. |
| R03 — Réconcilier autorité | Charger registres indépendants actuels, réappliquer purges/restrictions/fermetures et expirations ; rendre anciennes sessions/pages invalides selon contexte | Fraîcheur/complétude opposable prouvée ; une nouvelle génération d’époque n’accorde aucun droit. |
| R04 — Réconcilier effets | Commandes, consommations, reçus et tâches ; qualifier les résultats externes incertains et versions perdues | Pas de double effet, pas de faux accusé intégré ni tâche relancée sur ancien droit. |
| R05 — Vérifier patrimoine | FK/historiques/associations/manifeste, fichiers réels/empreintes/provenance, dépendances et effets de purge | Aucun original manquant présenté disponible, aucune connaissance réinterprétée silencieusement. |
| R06 — Reconstruire dérivés | Index/caches sous droits actuels et barrière, contexte/époque/génération ; signalements d’impact conservés | Pas de résultat obsolète ou interdit diffusé. |
| R07 — Ouvrir et reprendre | Validation explicite des contrôles, sondes des parcours et ouverture autorisée ; resynchronisation par génération nouvelle | Service cohérent, droits actuels et retraits applicables ; reprise progressive des tâches. |

Si le registre de purge ou l’autorité actuels sont absents/incertains, la barrière reste fermée. Un système restauré n’utilise pas une source d’autorisation retardée pour tenir son RTO. Les opérations de maintenance et de support restent soumises à moindre privilège et procédures de dérogation lorsqu’un contenu est nécessaire ; pas d’accès scientifique global de circonstance.

## 7. Objectifs et conditions de mesure

**RPO structuré ≤ 5 minutes** et **RTO ≤ 4 heures** sont conservés du CDC. Le RPO mesure l’écart entre dernier commit canonique avant incident et état réellement récupéré ; le RTO mesure incident → service effectivement cohérent/autorisé. Les exigences de non-résurrection des droits/purges ne deviennent pas une perte admissible de cinq minutes : les actes opposables doivent être réconciliés avec leur état actuel.

Les binaires ont un objectif RPO distinct encore ouvert (DEC-ARCH-15), ainsi que les modalités de restauration des gros patrimoines. Détecter un original perdu ne remplace pas son objectif de récupération. Une ouverture limitée avec certains fichiers temporairement indisponibles n’atteste pas automatiquement RTO atteint pour le périmètre complet : préciser à l’avance les parcours/périmètres du service rétabli et démontrer les garanties du CDC. Une base revenue en quatre heures avec sources incohérentes échoue.

L’exercice utilise un corpus/version/manifeste, une chronologie de commits/effacements/droits, un scénario de catastrophe, le coût/capacité de restauration, les secrets et responsables, les sorties observables et anomalies. Le profil programme amont reste 50 sous-projets/500 contributeurs/un million d’objets ; les patrimoines médias complémentaires sont à valider. Aucun résultat NF05 n’est revendiqué sans exercice exécuté et ses preuves.

## 8. Scénarios de crash-test

| ID | Incident / attaque | Verdict requis |
|---|---|---|
| PR01 | Binaire confirmé, transaction canonique perdue | Dépôt retrouvé et vérifié, canonisation idempotente ; pas suppression aveugle. |
| PR02 | Métadonnées prétendent confirmé mais binaire absent/corrompu | Anomalie détectée, usage scientifique fermé, état réel ; pas source inventée. |
| PR03 | Original modifié par outil de conversion/OCR | Original préservé, dérivé distinct et traçable ; modification illicite détectée. |
| PR04 | Même binaire déposé dans deux espaces, un dépôt purgé | Aucun oracle de déduplication ; effacement du périmètre et conservation légitime distincte prouvés. |
| PR05 | Purge puis restauration d’une génération antérieure | Purge réappliquée avant toute lecture/index/tâche ; aucune trace reconstructive. |
| PR06 | Révocation/protection après sauvegarde puis reprise serveur | État d’autorité actuel ; aucune permission ressuscitée par ancien epoch/cache/session. |
| PR07 | Panne entre intention, commit et accusé de registre | Issue réconciliée ou périmètre fermé ; aucune intention présentée comme commit certain. |
| PR08 | Contribution/consommation confirmée, perdue par restauration, puis rejouée | Un effet reconstruit contrôlé ou anomalie récupérable ; aucun double effet ni perte silencieuse de delta. |
| PR09 | Retour de snapshot local/curseur ancien après restauration | Génération et retraits nouveaux, droits actuels, journal personnel conservé. |
| PR10 | Clés indisponibles, registre de purge ancien, sauvegarde compromis | Ouverture refusée tant que validité/confidentialité/intégrité ne sont pas prouvées. |
| PR11 | Worker externe avait produit un effet, accusé perdu | État incertain suivi ; recherche/reconciliation ou clé d’idempotence du prestataire avant nouvelle exécution, pas promesse générale d’effet externe unique. |
| PR12 | Exercice complet à volume/capacité déclarés | RPO/RTO mesurés avec cohérence et droits, écarts binaires distincts, coût/temps et anomalies versionnés. |

Les douze scénarios sont **spécifiés, non exécutés**. Les contrôles documentaires de présence/liaison ne prouvent ni durabilité du stockage, ni récupération de clés, ni indépendance des registres, ni RPO/RTO d’une infrastructure.

## 9. Décisions à instruire avant validation

| ID | Responsable | Preuve / étape |
|---|---|---|
| PER-01 — Conservation et sauvegardes | Exploitation/architecture + données | DEC-ARCH-06/14 : générations, fréquences/rétention, domaines de panne, formats, copie isolée/immuable, contrôle d’intégrité ; PR01/02/03/12. |
| PER-02 — Stockage et RPO médias | Architecture/M05 + exploitation | DEC-ARCH-15 : contrat de confirmation, reprise, intégrité, coût/capacité de récupération, objectifs binaires ; PR01/02/12. |
| PER-03 — Registres indépendants | Core/sécurité/exploitation | Ordre intention/commit/accusé, checkpoints et fraîcheur hors restauration ; PR05/06/07/10. |
| PER-04 — Effets/idempotence et rétention | Core/M13/M14 + produit/données | SYN-03 : durée de reconnexion, preuves après restauration, commandes/consommations, minimisation et purges ; PR08/09/11. |
| PER-05 — Secrets et reprise | Sécurité/exploitation | MPD-05 : accès/rotation/récupération des clés, chiffrement et séparation ; PR10, aucun mécanisme cryptographique maison. |
| PER-06 — Mutualisation/effacement | Architecture/M05 + sécurité/juridique | Portée d’effacement, droits/copies, isolation de clés et absence d’oracle ; PR04/05. |
| PER-07 — Procédure PRA et verdict | Exploitation/qualité + porteur | R01 à R07, responsables d’ouverture, périmètre/service, manifestes et mesure NF05 ; PR12 et anomalies connues. |

Ces points restent ouverts et encadrés, sans durées légales ni garanties fournisseur inventées. ADR-CORE-008 à 011 sont des propositions candidates. Le dossier suivant précisera l’exécution asynchrone, la propagation scientifique et le dimensionnement, avec les dépendances SEC/SYN/PER et MPD-04.
