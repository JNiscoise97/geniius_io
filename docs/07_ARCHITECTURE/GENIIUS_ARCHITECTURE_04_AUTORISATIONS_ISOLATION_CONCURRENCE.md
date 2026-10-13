# GENIIUS — Autorisations, isolation et concurrence V0.1

**13 octobre 2026 — architecture candidate, non gelée.** Dossier 2 du [cadrage](GENIIUS_ARCHITECTURE_01_CADRAGE.md), après les [modules et transactions](GENIIUS_ARCHITECTURE_02_CORE_MODULES_TRANSACTIONS.md). Références : [contrat V1.6](../04_CONTRAT_AUTORISATION/GENIIUS_CONTRAT_AUTORISATION.md) §§ 13–15/A6, [MLD V1.1-g](../05_MLD/GENIIUS_MLD.md) CP-11/12/24/26/40/46/49/50/51, [CDC V1.2](../06_CDC_TECHNIQUE/GENIIUS_CDC_TECHNIQUE.md) TECH-011/016/018/027 et § 14. Décisions instruites : DEC-ARCH-01/05, MPD-02/03/06. Aucune technologie n’est sélectionnée ; aucun comportement amont n’est modifié.

## 1. ADR-CORE-002 — Une autorité, isolation par capacités

M02 évalue toutes les permissions sur l’état canonique, avec identité/personne établie par M01. L’interface, le module métier, le worker et la projection ne calculent aucune permission autonome. Le partage, la titularité, l’administration et la propriété sont des fondements distincts ; un rattachement de projet ne constitue jamais un droit.

L’accès aux dépôts d’écriture est privé au module propriétaire. Les services métier reçoivent un contexte authentifié et appellent M02 avant toute consultation révélatrice ou mutation. Les consultations de plusieurs espaces construisent leur graphe accessible, sans agréger l’univers interdit. L’isolation ne se limite pas à un filtre `espace_id` : références interespaces, copies, droits personnels, dérogations et protections d’ascendants requièrent le moteur canonique.

**Alternative écartée :** autorisations calculées indépendamment par chaque module/application, ou contrôle basé uniquement sur appartenance/rôle administratif. Une défense de couche données est requise pour les frontières qui peuvent contourner le Core ; sa forme (politiques de base, vues/capacités ou combinaison) reste MPD-06. Un compte technique ne reçoit pas une lecture scientifique globale ; ses primitives techniques sont séparées de toute sortie de contenu.

## 2. Contrat d’évaluation

`ÉvaluerAccès(contexte, cible, opération, finalité, instant_serveur)` retourne une décision interne et sa justification protégée. Le contexte comporte acteur/personne, compte/session actifs, espaces concernés et contexte de gouvernance ; le client ne fournit pas l’époque ni ses propres fondements. L’autorité applique exactement l’ordre V1.6 :

| Étape | Contrôle | Conséquence |
|---|---|---|
| 0 | Cible existante non purgée | Sinon introuvable. |
| 1 | Non-levables propres et de tous ascendants | Aucune dérogation ne passe. Réponse conforme à la connaissance d’existence autorisée au § 14. |
| 2 | Dérogation active bornée et approbations/gardes actuels | Seulement cible/opération/finalité/durée autorisées, journalisée ; aucun droit ni réplication dérivé. |
| 3 | Protection d’existence frappant la personne | Introuvable. |
| 4 | Restriction interne de l’opération | Refus ou introuvable selon § 14, sans divulgation. |
| 5 | Titularité, rôles scientifiques, HI/HP effectives et admissions | Fondements propres, expirations/suspensions et personne tous comptes ; règles d’archivage/clôture du contrat. |
| 6 | Visibilité par défaut | Voir public/communauté selon conditions ; aucune action scientifique supplémentaire. |
| 7 | Rendu et liens | Extrémités accessibles, inclusion, masquage, filiation, sensibilité ; compteur/rang après exclusion. |

Un échec de vérification donne introuvable **sans mutation** ; il ne clôt aucun fondement ni ne retire un gardien. Une opération refusée ne devient détaillée qu’avec la connaissance d’existence que le contrat permet. La justification interne (fondements, identifiants protégés, autorités) n’est jamais le corps d’erreur envoyé au client. P-3 est une voie séparée : identifiant opaque de protection et fait d’orphelinage, à la seule autorité, sans cible/espace ni pouvoir implicite.

Les références fournies sont contrôlées avant FK/UQ observables. Un accès à un lien requiert ses deux extrémités. La réception différée privée est l’exception procédurale CP-27 : références client opaques reçues sans résolution de cible, puis intégration contrôlée par T09 ; son accusé n’est pas un oracle d’existence.

## 3. ADR-CORE-003 — Garde commune et époque canonique

La baseline proposée utilise **une garde logique d’autorisation commune à l’instance canonique** et une époque monotone. Ce choix privilégie une démonstration simple de l’ordre accès/révocation dans le monolithe ; ce n’est ni un verrou en mémoire local à un processus, ni une file globale de toutes les opérations métier.

La garde doit fonctionner entre toutes les instances API/workers et être coordonnée avec les transactions de la base. Les opérations ordinaires prennent une garde partagée ; toute modification de faits susceptibles d’affecter un accès prend une garde exclusive. Les écritures métier indépendantes peuvent donc rester concurrentes. Les verrous/revisions d’objet protègent ensuite leurs propres agrégats. Le mécanisme physique doit être démontré dans MPD-02/06 ; l’ADR ne prétend pas qu’un simple entier d’époque réalise cette exclusion.

| Fait modifié | Unité de travail sous garde exclusive |
|---|---|
| Droit, admission, rôle, groupe, clôture, dérogation | Nouvel état/fermetures prescrites + époque + résultat de commande + travail de projection, même commit. |
| Identité, statut de compte/personne, approbateur/gardien pertinent | T17/M01 + effets prescrits M02 + époque, même commit ; indépendance par personne. |
| Protection, consentement, sensibilité, visibilité, filiation/copie | État opposable et barrières nécessaires + époque ; aucune copie nouvelle hors du périmètre de propagation. |
| Purge/transfert et gels de présentation/succession | Transactions T06/T14 et changements d’autorité opposables, avant ouverture des résultats. |

Toute commande pouvant affecter ces faits est classifiée **avant acquisition de la garde** ; aucune promotion d’une garde partagée en exclusive au milieu de la transaction. En cas de doute, reprendre sous exclusive sans exposer d’état intermédiaire. Le commit rend la modification effective ; époque et faits ne peuvent pas être validés séparément. Expiration temporelle ne nécessite pas un worker ponctuel : elle est évaluée avec l’instant serveur à chaque décision, même sans nouvelle époque.

**Écriture ordinaire :** garde partagée → identité/instant actuel → permissions et références → gardes d’agrégat → validations/écritures → contrôle d’échéance au point de validation → commit avant relâchement. Si l’échéance est dépassée, la mutation est annulée. Un mécanisme incapable de garantir l’ordre validation/commit/échéance ne satisfait pas A6 et reste bloquant pour l’implémentation ; le MPD doit définir son point de linéarisation et ses preuves.

**Révocation :** garde exclusive → état actuel/acte autorisé → fermeture prescrite/époque/barrières → commit → relâchement. Une écriture antérieure qui a commité sous partage est ordonnée avant la prise d’effet ; une écriture postérieure réévalue l’état révoqué. Le choix de file/timeout des gardes doit empêcher la famine des révocations. Une panne libère les gardes transactionnelles sans produire un demi-commit.

**Lecture/sortie :** chaque page/reprise/portion de flux prend une garde partagée courte, lit l’état canonique courant, évalue puis calcule le rendu filtré. Le point de divulgation côté serveur appartient à cette section protégée. Aucun résultat préparé n’est placé dans une file de diffusion dépourvue de vérification actuelle ; une section bornée ne couvre pas un téléchargement complet ou un appel externe long. Les octets déjà remis au transport avant prise d’effet ne sont pas rappelables ; les portions suivantes sont contrôlées à nouveau. Le mécanisme exact de remise au transport, taille des portions et échéance pendant une portion constituent une preuve obligatoire, sans durée arbitraire adoptée ici.

**Alternative étudiée :** gardes/époques par espace, objet ou domaine. Elles pourront réduire la contention, mais doivent couvrir les ensembles ouverts, la personne tous comptes, les copies/ascendants et les relations entre espaces sans fenêtre de fuite. Aucun remplacement n’est autorisé sans scénario de concurrence démontrant le même ordre. Une barrière multi-espaces est une option d’architecture à instruire, pas une autorisation de projection temporairement permissive.

## 4. ADR-CORE-004 — Caches et projections sans permission autonome

Le contrat exige une décision à **l’époque courante et au même instant de calcul**. Un TTL seul, une époque égale seule ou l’absence d’un message de révocation ne suffisent donc pas à réutiliser un accord ancien. La baseline recalcule l’autorisation à chaque opération/page/portion, avec un instant canonique unique pour son évaluation.

Les caches portent des faits/projections reconstructibles ou des représentations candidates, pas des permissions durablement positives. Leur clé inclut contexte acteur/personne/session, opération/finalité, objets/versions, epoch et régime de rendu pertinent. Ils sont confrontés à l’autorité courante avant usage ; la plus proche échéance est une borne supplémentaire, jamais une dispense de contrôle au même instant. Un cache partagé hors contexte ou une réponse ancienne d’idempotence n’est jamais servi comme accord.

Le serveur ne lit pas l’autorité sur une réplique retardée. Une projection dispose d’un numéro de génération et d’un watermark vérifiable ; à la moindre insuffisance, retour à la source canonique ou refus fermé. Révocation/protection devient opposable au commit avant reconstruction ; les messages servent la mise à jour, pas la permission. Un index technique global peut exister, mais recherche/suggestions/facettes/compteurs sont calculés sur le graphe admissible avant sortie, et non calculés globalement puis masqués.

Une protection ultérieure sur un ascendant : M02 pose au commit une barrière couvrant toutes copies concernées ; l’évaluateur traverse les ascendants et applique les non-levables déjà opposables. La matérialisation des protections héritées peut être reprise en lots uniquement si la barrière ferme toute exposition affectée jusqu’à complétude prouvée. La levée de l’original ne lève pas automatiquement les copies. Purger un contenu d’ascendant ne détruit pas les faits nécessaires à opposer ses restrictions, sous minimisation et procédure amont.

## 5. Ordre de concurrence et discipline de transaction

Ordre logique : garde d’autorisation → agrégats ordonnés par identité stable → fondements/manifestes associés → validation finale → commit. Les créations utilisent une réservation d’identité avant garde d’agrégat, sans révéler un conflit d’unicité sur cible invisible. Une reprise après interblocage ou version dépassée reprend toute l’évaluation ; elle ne poursuit pas sur une décision d’accès conservée.

Les conflits scientifiques conservent les deux contributions et demandent une décision humaine ; les conflits de version purement techniques ne déclenchent pas une « dernière écriture gagnante ». Les workers M14 emploient les mêmes commandes/gardes que les requêtes interactives. Leurs identités d’exécution et l’acteur/finalité métier restent distincts ; aucun fondement de l’acteur disparu n’est remplacé par les droits techniques du worker.

En interne, tout état préparé/non validé reste fermé. Les frontières API n’exposent que des états autorisés après commit. Les variations de charge/gardes/index ne doivent pas devenir un canal de découverte d’une cible cachée : présent et absent suivent les mêmes voies observables admissibles, y compris pagination/UQ. Le protocole statistique MPD-03/CDC NF10 doit éprouver distributions, files, erreurs et répétition ; aucun égaliseur de délai ni seuil de petit effectif chiffré n’est présumé satisfaire cette obligation sans preuve.

## 6. Scénarios de concurrence et verdicts

| ID | Ordonnancement / attaque | Verdict exigé |
|---|---|---|
| AC01 | Écriture prend garde partagée ; révocation demande exclusive | Écriture finit avant révocation effective, ou annulation/reprise ; aucune écriture ultérieure sur droits révoqués. |
| AC02 | Révocation commite ; ancien worker/cache reprend | Relecture actuelle, refus ou rendu filtré ; pas d’accord issu de l’ancienne époque. |
| AC03 | Même époque, passage de l’échéance entre pages/avant commit | Nouveau calcul temporel ; portion suivante refusée et mutation expirée annulée. |
| AC04 | Consentement/protection change sur ascendant ; copies sur autre espace | Barrière opposable au commit, aucun descendant consultable sur projection retardée. |
| AC05 | Identité relie deux comptes pendant approbation/transfert | Sérialisation T17/T06 ; aucune auto-approbation ni double indépendance par compte. |
| AC06 | Cible cachée/absente dans FK, UQ, recherche, notification et cache | Mêmes sorties autorisées, pas de compteur/indice ni détail de validation ; distributions temporelles à éprouver. |
| AC07 | Transaction avorte après écriture d’époque mais avant commit | Ni état partiel ni époque effective orpheline ; aucune tâche annoncée commise. |
| AC08 | Plusieurs instances API/workers + panne détenteur de garde | Exclusion canonique partagée entre instances ; reprise sûre, pas verrou local insuffisant. |
| AC09 | Flux export, révocation entre deux portions | Point de divulgation identifié, aucune portion ultérieure non autorisée ; octets antérieurs non rappelés. |
| AC10 | Charge de lectures continue pendant révocation urgente | Absence de famine à démontrer, délai de prise d’effet mesuré ; aucune disponibilité obtenue en ignorant une révocation effective. |
| AC11 | Copie créée pendant propagation de protection ; original purgé ensuite | Filiation et protections opposables complètes, barrières/reprise couvrant nouvelles copies. |
| AC12 | Dérogation expire/perd approbation pendant une tâche | Niveau/garde/finalité actuels réévalués ; aucune continuation ni réplication sur ancien accord. |

Chaque scénario exige un corpus versionné, ordonnance forcée, traces d’acquisition/validation/commit/divulgation et comparaison des résultats avec V1.6. Les tests du modèle amont n’exercent pas ces mécanismes physiques. Ces douze scénarios sont **spécifiés, non exécutés** ; aucune propriété de verrou SQL, latence ou OS n’est prétendue démontrée.

## 7. Points à démontrer avant validation

| ID | Responsable | Preuve / étape |
|---|---|---|
| SEC-01 | Architecture/Core + sécurité | Garde canonique interinstances et point de linéarisation/échéance : choix MPD-02/06, traces AC01/03/07/08. |
| SEC-02 | Architecture/exploitation | Famine, transactions longues, volume copies et coût de garde globale : mesure NF01/02/03/10 et AC10 ; alternative segmentée si nécessaire. |
| SEC-03 | API/stockage + sécurité | Point de sortie des pages/portions, URL de téléchargement, échéance pendant envoi : protocole et traces AC09/12 avant livraison. |
| SEC-04 | Sécurité/recherche | Graphe avant calcul, statistiques et attaques de délais/différenciation : MPD-03, protocole CDC NF10, AC06. |
| SEC-05 | Core/synchronisation | Époque, ascendants, copies et watermark/barrières : AC02/04/11, mêmes obligations après restauration. |

Ces points sont les limites concrètes de la proposition. DEC-ARCH-01/05 et MPD-02/03/06 sont **instruits, pas clos par une preuve d’implémentation**. La validation de l’architecture doit les résoudre ou encadrer explicitement les reports ; aucun report ne peut affaiblir A6 ou la non-divulgation. Le dossier suivant traitera synchronisation, compatibilité et horloge locale à partir de ces contrats.
