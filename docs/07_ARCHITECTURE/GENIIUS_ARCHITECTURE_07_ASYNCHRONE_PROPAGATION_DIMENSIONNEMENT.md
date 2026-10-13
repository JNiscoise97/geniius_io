# GENIIUS — Exécution asynchrone, propagation et dimensionnement V0.1

**13 octobre 2026 — architecture candidate, non gelée.** Dossier 5 du [cadrage](GENIIUS_ARCHITECTURE_01_CADRAGE.md). Entrées : [modules/transactions](GENIIUS_ARCHITECTURE_02_CORE_MODULES_TRANSACTIONS.md), [sécurité](GENIIUS_ARCHITECTURE_04_AUTORISATIONS_ISOLATION_CONCURRENCE.md), [synchronisation](GENIIUS_ARCHITECTURE_05_SYNCHRONISATION_COMPATIBILITE_HORLOGE.md), [persistance/PRA](GENIIUS_ARCHITECTURE_06_PERSISTANCE_CONSERVATION_RESTAURATION.md), [CDC V1.2](../06_CDC_TECHNIQUE/GENIIUS_CDC_TECHNIQUE.md) TECH-009/013/014/015/021/028/029 et § 14.3, [MLD V1.1-g](../05_MLD/GENIIUS_MLD.md) CP-09/18/21/39/40/42 et ST-10/11/13. Décisions instruites : MPD-04, DEC-ARCH-07/11/13 et PAR-CDC-01/02/06/07/08. Aucun produit de file, quantité de workers, délai ou budget commercial n’est adopté.

## 1. ADR-CORE-012 — Travail durable, livraison répétable

ST-13 porte les tâches techniques et manifestes ; ST-10 porte l’identité de consommation et ST-11 les envois. Ces obligations gardent leurs propriétaires et s’appliquent aux effets asynchrones décrits ici.

M14 porte les tâches, tentatives, accusés et enregistrements de travail à délivrer. Le module métier possède le résultat scientifique et ses écritures ; un worker appelle ses contrats et ne modifie pas directement ses tables. Une requête ne répond « travail enregistré » qu’après le commit durable de la commande et de l’outbox logique dans la même unité de travail. Une outbox n’est pas un résultat de calcul ni une preuve d’effet externe terminé.

La livraison peut se répéter. L’unicité de l’effet relationnel vient de l’identité d’événement/commande, de l’empreinte/version d’entrée et du reçu atomique avec l’effet. Un réseau ou un prestataire ne reçoit pas une garantie universelle d’exécution unique : résultat externe incertain est qualifié/réconcilié selon PER-04 avant nouvelle exécution. Une clé d’idempotence externe est utilisable seulement si son contrat a été vérifié.

| Phase | Opération | Atomicité / reprise |
|---|---|---|
| A01 — Programmer | Commande métier, activité/version si requise, travail durable/identité et référence au contexte | Un seul commit ; rollback ne laisse aucune tâche prétendue commise. |
| A02 — Délivrer | Dispatcher lit l’outbox et publie/enregistre une tentative | Publication répétable ; panne après publication avant accusé ne perd pas la tâche. |
| A03 — Réserver | Worker prend un bail borné avec numéro de tentative/génération | Réservation atomique ; une ancienne tentative ne peut finaliser après perte de son bail. |
| A04 — Exécuter | Vérifier droits/consentements et versions avant accès/envoi ; traiter une unité bornée | Appel externe hors transaction longue ; checkpoint durable après unité validée. |
| A05 — Intégrer | Revalider autorité/base/bail, appeler le propriétaire et produire effet + reçu/checkpoint | Même commit ; résultat périmé ne remplace pas un résultat récent. |
| A06 — Terminer/reprendre | État final ou attente/échec, observabilité et reprises | Rejeu sur checkpoint/identité ; aucune annulation silencieuse d’effet déjà intégré. |

Un bail est un droit technique de tentative, pas une habilitation scientifique. Le numéro de tentative agit comme jeton d’exclusion : l’écriture finale vérifie dans sa transaction qu’elle est toujours la tentative active ; comparer seulement l’heure d’expiration puis écrire sans coordination ne suffit pas. Une tentative perdant son bail s’arrête ou voit sa finalisation refusée. L’identité métier de l’acteur, l’identité du processus, la finalité et le contexte sont distincts et tracés.

## 2. États, erreurs et commande d’arrêt

| État | Signification | Transition admissible |
|---|---|---|
| attente | Travail durable accepté, pas d’exécution active | exécution ; suspension/annulation avant effet selon contrat. |
| exécution | Tentative active, progression uniquement si mesurable | réussite, réussite partielle, suspension, annulation ou échec avec bilan. |
| suspension | Motif de ressources, contrôle humain, panne ou politique ; checkpoint conservé | Reprise sous droits actuels, pas reprise de l’ancienne autorisation. |
| réussite | Tous les effets requis sont confirmés et résultat admissible | Aucun succès fictif fondé sur seul appel externe. |
| réussite partielle | Sous-ensemble confirmé et liste protégée des restes | Reprise ciblée idempotente ou décision explicite, jamais présenté comme complet. |
| annulation | Aucune nouvelle unité lancée ; effets passés recensés | Retour sur effets par opération métier distincte autorisée. |
| échec | Erreur permanente ou reprise bornée épuisée, état récupérable | Investigation/rejeu explicite ou nouvel acte, sans perdre contribution/source. |

Erreurs temporaires : reprise bornée avec attente et dispersion ; permanentes : arrêt/diagnostic ; répétées non qualifiées : mise à l’écart. Les valeurs de délais/nombre d’essais restent ASY-01. Une tâche isolée ne bloque pas la file. Suspendre/annuler vérifie le bail au checkpoint ; aucun processus ancien ne peut inscrire un succès après annulation devenue opposable.

La fermeture du client ne termine pas la tâche serveur. Départ de l’acteur, nouvelle protection ou retrait de consentement sont réévalués avant étapes révélatrices, intégration et sortie. Si l’acteur n’a plus le droit de traiter, suspendre/refuser selon contrat ; ne pas substituer les droits du worker. Les états, erreurs et logs transmis au demandeur sont filtrés : pas liste d’objets cachés, taille de corpus interdite ou résultat ancien divulgué par un accusé.

## 3. ADR-CORE-013 — Propagation scientifique sans faux état à jour

Lors du commit d’une nouvelle version scientifique, M03 marque toutes les dépendances **directes** `potentiellement affecté` avec signalement, dans la même transaction (CP-21). Il écrit aussi un travail durable de propagation et un état canonique « propagation non terminée » lié à l’amont/version. Si le travail durable ou le marquage direct ne peut être garanti, l’écriture ne commite pas partiellement.

Le transitif est parcouru en unités bornées, avec frontière de parcours et accusés durables. Chaque effet est idempotent sur cause/version, dépendance et nature de signalement. La file technique ne devient pas la vérité scientifique : résultat/conclusion n’est ni validé ni invalidé automatiquement. Une propagation terminée signifie que les impacts prescrits sont signalés, pas que les chercheurs ont réexaminé toutes les conclusions.

**Barrière de lecture avant complétude :** tout lecteur de résultat aval doit consulter l’état canonique d’impact et de propagation avant de présenter un état définitivement à jour. Si l’appartenance au périmètre transitif n’est pas encore prouvable, la baseline propose un indicateur conservatif par périmètre de calcul ; un résultat éventuellement concerné reste « réexamen/propagation en cours ». L’indicateur ne révèle pas l’identité, le nombre ou le contenu des causes cachées. Le choix physique et le périmètre exact sont ASY-02, à démontrer avec SEC-04/05 ; aucun cache de fraîcheur ne peut contourner cette barrière.

Si le graphe change pendant le parcours, les nouvelles dépendances rejoignent la génération d’impact pertinente ou sont reprises avant fermeture ; un balayage d’un ancien snapshot ne suffit pas à annoncer la complétude. La fermeture d’une génération est conditionnée par frontier vide et absence d’ajouts non traités, dans une coordination démontrée avec les écritures de dépendance. Deux causes concurrentes restent distinctes ; terminer l’ancienne ne supprime ni un impact nouveau ni une propagation encore active.

Un échec ne remet jamais `etat_impact` à `inchangé`. Le signalement disparaît seulement par décision/réexamen ou recalcul explicitement admissible et tracé selon CP-21. Une publication historique demeure figée et distinguée de l’état courant ; une nouvelle diffusion exige les droits actuels. Les cycles de production sont refusés ; les cycles de raisonnement permis sont détectés, marqués et exclus des justifications indépendantes (CP-09), avec suivi de parcours évitant boucle infinie.

La propagation technique d’invariant peut porter sur des dépendances non lisibles par l’acteur initial. Elle utilise une capacité interne étroite de M03 pour marquer identités d’impact, sans lire/divulguer les contenus ni exécuter une décision scientifique. Elle n’habilite pas ce demandeur à consulter les cibles aval. Tout traitement qui lit une source, calcule un contenu ou produit une sortie repasse par les droits/consentements actuels des contrats propriétaires ; cette distinction doit être démontrée, pas remplacée par un compte scientifique global.

## 4. Délai MPD-04 et observabilité

Le délai maximal transitif reste **à fixer**, sans valeur d’exemple adoptée. Il se mesure du commit scientifique initial au moment où tous les signalements transitifs prescrits de sa génération sont enregistrés et la complétude est démontrée. Mesurer l’entrée dans une file, la fin du seul worker ou la disparition d’un message n’est pas cette mesure. Direct : même transaction, sans délai asynchrone accepté.

Le manifeste mesure volume/forme du graphe, profondeur/fan-out, générations concurrentes, taux de modifications, unités traitées, reprises/cycles et contention avec requêtes interactives. Publier distributions et maximum observé, les générations encore ouvertes et le taux d’échec ; un percentile favorable ne satisfait pas à lui seul un délai **maximal**. Définir profil, incidents/exclusions et réponse au dépassement avant recette.

En cas de dépassement, alerter et conserver le résultat non définitivement à jour ; ne pas lever la barrière pour tenir le délai. Les unités en attente ne disparaissent pas parce qu’une tâche est mise à l’écart. L’objectif, la capacité et les mesures compensatoires sont arbitrés par architecture/exploitation/données, avec produit pour l’impact de livraison (ASY-02).

M14 expose profondeur/âge de file, durée d’attente/exécution, retries, baux perdus, reprises, jobs isolés et coût par catégorie. M03 expose l’état des générations d’impact ; M02 contrôle la consultation des métriques contextualisées. Diagnostics techniques, audit de sécurité et historique scientifique restent distincts, sous rétention adaptée et minimisation.

## 5. ADR-CORE-014 — Admission, priorités et capacité

| Classe | Exemple | Politique proposée |
|---|---|---|
| Intégrité/sécurité | Propagation d’impact, retrait/purge, vérification de conservation | Capacité réservée et supervision ; aucune tâche de confort ne retarde une protection déjà opposable. |
| Interactive différée | Transcription attendue, petit export/import, page de recherche dérivée | Temps d’attente observé, admission contrôlée ; éviter famine derrière migration massive. |
| Patrimoniale volumineuse | Migration de dossiers, reconstruction/indexation complète, gros export | Découpage reprenable, débit/concurrence limités, capacité isolée du service interactif. |
| Facultative/coûteuse | IA, miniatures secondaires, enrichissement | Budgets explicites, estimation/confirmation si requise, suspension sûre. |

Les classes n’altèrent pas la criticité des invariants : une sécurité opposable n’attend pas son worker de confort. Équité par acteur/espace, quota de travaux admis, limites de concurrence et d’octets, et protection contre épuisement des ressources doivent être explicites. Une priorité absolue sans dispositif d’équité risquerait une famine ; le choix de répartition/pondérations est ASY-03, pas une propriété supposée de la file.

L’admission peut différer/refuser un nouveau traitement avant création de travail coûteux ; le retour conserve les données déjà sécurisées et indique un état explicite. La saturation ne supprime pas un delta, un original ou un résultat scientifique. Le blocage d’un prestataire déclenche limitation et reprise bornée, sans avalanche de retries ni panne du Core. Une consommation réelle est imputée par M12 à date effective et avec identité unique (CP-39/ST-10), distincte du nombre de tentatives techniques.

## 6. Plan de dimensionnement mesurable

Le profil programme validé est **50 sous-projets, 500 contributeurs, un million d’objets**. Les profils courant/avancé/expert de TECH-009 restent indicatifs jusqu’à validation (PAR-CDC-01). Un million d’objets n’est pas un million de lignes : historiques, associations, segments, dépendances et générations doivent être comptés séparément. Les volumes médias, graphes, distribution de droits et simultanéité restent à caractériser.

| Mesure | Méthode / verdict |
|---|---|
| Lectures ordinaires | Temps serveur autorisation comprise, hors réseau : p95 ≤ 1 s ; retour perceptible client séparé, < 1 s nominal selon CDC. |
| Recherche | Premiers résultats p95 ≤ 2 s dans profil déclaré ; exactitude, filtrage et non-divulgation restent exigés. |
| Propagation | Marquage direct au commit ; maximum transitif comparé à MPD-04 après fixation, générations incomplètes recensées. |
| Tâches | Débit utile, attente/durée, reprise, coût, échecs et consommation effective par classe ; pas succès déduit de tentatives. |
| Persistance/reprise | CPU/mémoire/IO, croissance courant/historiques/outbox/reçus, sauvegarde/PRA et coût ; PER-01 à 07 demeurent. |
| Concurrence/sécurité | Gardes interinstances, famine, copies/ascendants, flux et attaques sous chaque palier ; SEC-01 à 05. |

Campagne : baseline et corpus versionnés, versions de schéma/référentiel, configuration/hardware/réseau, warmup et caches froids/chauds, taux d’arrivée et concurrence, durée/répétitions/graines, travaux concurrents, incidents/exclusions et traces. Faire monter progressivement la charge, provoquer saturation, retirer capacité/worker/prestataire puis mesurer récupération. Aucune extrapolation de capacité depuis un unique petit jeu ou une moyenne seule.

L’étude commence par mesurer les coûts unitaires et goulets, puis estime capacité initiale et réserve. La stabilité demande que le débit utile sur la durée dépasse les arrivées admises ; la capacité brute ne suffit pas en présence de garde globale, skew des graphes, variabilité externe et reprises. Nombre de workers, mémoire par tâche, taille de lots, stockage, marge et seuils d’alerte ne sont fixés qu’après mesure représentative. Le plan distingue minimum de fonctionnement, profil nominal, charge maximale testée et seuil de refus/admission.

Les coûts couvrent calcul, médias/transfert, historiques, index, registres critiques, rétention, sauvegarde et exploitation. Les quotas restent non destructifs et ne donnent aucun droit scientifique. Disponibilité, latence, délai de propagation et RPO/RTO sont des objectifs distincts ; aucun budget d’erreur ne permet une fuite ou perte patrimoniale.

## 7. Scénarios de crash-test

| ID | Panne / concurrence | Verdict requis |
|---|---|---|
| AS01 | Commit annulé après préparation du travail | Aucun job prétendu accepté ni effet partiel. |
| AS02 | Publication répétée et accusé perdu | Livraison répétable, un effet intégré et checkpoint durable. |
| AS03 | Bail expiré, deux workers finissent la même unité | Seule tentative active finalise ; aucune seconde version ni écrasement. |
| AS04 | Révocation/consentement retiré pendant traitement | Nouvelle lecture/envoi/intégration/sortie contrôlés ; pas droits de substitution du worker. |
| AS05 | Correction de preuve, worker transitif perdu | Direct marqué au commit ; aucun aval éventuellement concerné présenté définitivement à jour. |
| AS06 | Deux causes concurrentes, ancienne génération termine après nouvelle | Pas d’effacement d’impact récent ni fausse complétude. |
| AS07 | Nouvelle dépendance créée pendant balayage transitif | Génération/reprise couvre l’ajout avant clôture ; pas descendant ignoré. |
| AS08 | Cycle de raisonnement et production cyclique tentée | Parcours termine sans boucle ; production refusée, raisonnement marqué sans indépendance fabriquée. |
| AS09 | Annulation/suspension après effets partiels et fermeture du client | Effets acquis conservés, aucun succès ancien après arrêt, reprise ciblée sous droits. |
| AS10 | Migration massive + transcription interactive + panne prestataire | Pas famine des garanties/usage prioritaire, retries bornés et saturation visible ; données sécurisées intactes. |
| AS11 | Dépassement de MPD-04 sous charge déclarée | Alerte/écart, barrières conservées ; pas requalification du maximum en percentile favorable. |
| AS12 | Montée/saturation/récupération, replay de consommation | Mesures NF et sécurité au même profil, pas double imputation ni perte par quota. |

Les douze scénarios sont **spécifiés, non exécutés**. Ils exigent ordonnance forcée, corpus/configuration, traces de commit/bail/checkpoint/impact, sorties autorisées et coûts. Aucun débit, délai ou dimensionnement de production n’est déclaré atteint par un contrôle documentaire.

## 8. Décisions ouvertes et preuves

| ID | Responsable | Décision / preuve avant validation concernée |
|---|---|---|
| ASY-01 — Exécution et reprise | Architecture/M14 + exploitation | File/dispatcher, bail et jeton de tentative, durée/renouvellement, retries et isolement ; AS01/02/03/09. |
| ASY-02 — Propagation et MPD-04 | Core/données + architecture/exploitation | Périmètre de barrière, frontier/générations et ajouts concurrents, délai maximal/profils, alerte ; AS05/06/07/08/11. |
| ASY-03 — Admission et équité | Architecture/exploitation + produit | Classes, capacité réservée, quotas/concurrence, attente et refus non destructif ; AS10/12, PAR-CDC-06/07. |
| ASY-04 — Profil et mesure | Produit/données/qualité + architecture | PAR-CDC-01/02 : corpus, graphes/médias/versions, concurrence et lots ; campagne reproductible selon CDC. |
| ASY-05 — Autorité et effets externes | Sécurité/Core + exploitant | SEC-01 à 05/PER-04 : revalidation, capacités internes étroites, point de sortie, résultat externe incertain ; AS04. |
| ASY-06 — Capacité et coût | Architecture/exploitation + porteur | Capacité mesurée, marge/paliers/coût total, seuils et croissance, preuve NF01/02/03/09/10 ; AS12. |
| ASY-07 — Observabilité et conservation | Exploitation/sécurité + données | Métriques/alertes, rétention/jobs/checkpoints, purge des traces et reprise après PRA ; PER-03/04, SYN-03, AS02/05/11. |

ADR-CORE-012 à 014 restent candidats. Le prochain jalon consolidera les décisions et dépendances ouvertes, les vues de déploiement et le choix des technologies avec alternatives/preuves de faisabilité. Le présent dossier fixe les contrats de travail et le plan de mesure ; il ne clôt pas MPD-04 par une valeur non instruite.
