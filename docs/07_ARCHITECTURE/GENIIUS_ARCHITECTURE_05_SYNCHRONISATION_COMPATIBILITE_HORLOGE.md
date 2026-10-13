# GENIIUS — Synchronisation, compatibilité et horloge locale V0.1

**13 octobre 2026 — architecture candidate, non gelée.** Dossier 3 du [cadrage](GENIIUS_ARCHITECTURE_01_CADRAGE.md), après les [modules du Core](GENIIUS_ARCHITECTURE_02_CORE_MODULES_TRANSACTIONS.md) et les [gardes d’autorisation](GENIIUS_ARCHITECTURE_04_AUTORISATIONS_ISOLATION_CONCURRENCE.md). Références : [CDC V1.2](../06_CDC_TECHNIQUE/GENIIUS_CDC_TECHNIQUE.md) TECH-002/003/005/007/018/019/031, [contrat V1.6](../04_CONTRAT_AUTORISATION/GENIIUS_CONTRAT_AUTORISATION.md) §§ 13.8/13.9 et A6, [MLD V1.1-g](../05_MLD/GENIIUS_MLD.md) CP-27/28/40/50 et ST-01 à ST-08/ST-12 à ST-14, CDCF V1.3 § 122.2/critère 55. Les valeurs de durées, budgets et versions supportées restent à fixer ; aucun fournisseur ni protocole de transport n’est sélectionné.

## 1. ADR-CORE-005 — Deux magasins locaux et une autorité serveur

La réplique locale contient les données canoniques visibles par accès ordinaire et sélectionnées pour consultation hors ligne. Le journal de travail local contient uniquement les créations/deltas de l’auteur, leurs références client et versions de base, et les fichiers nouvellement collectés. Ces magasins sont distincts logiquement et chiffrés ; le client ne conserve pas une seconde vérité scientifique.

Une suppression/expiration de réplique ne détruit pas le journal personnel. Le journal ne sert pas à conserver une copie du contenu canonique retiré : édition sous forme de delta typé, sans snapshot de la base ni copie automatique des sources/objets référencés. Le client peut distinguer une création nouvelle d’une modification d’un objet répliqué. Une saisie humaine peut reprendre une information déjà consultée ; l’architecture ne prétend pas effacer les copies sorties du contrôle du logiciel.

La V1 n’est pas une fusion multi-utilisateur offline-first sans serveur. Les opérations hors ligne peuvent être proposées localement ; leur intégration attend la décision du Core. Le client distingue : enregistré localement, réception serveur confirmée, réconciliation requise, intégré, refusé et validation scientifique. Un succès de réception n’affirme jamais que la cible existe, que les droits sont conservés ou que la contribution est scientifiquement validée.

Les fichiers lourds ont une politique distincte de transfert/cache, configurable selon réseau et préférence. Aucun téléchargement binaire ne contourne l’échéance de consultation ou l’autorisation actuelle.

## 2. Enveloppes et identités d’opérations

Chaque opération locale possède un `operation_origine_id` stable, un auteur/compte et appareil, une version du format de delta, les versions client/schéma/référentiel à création, la version de base connue, ses dépendances locales, une empreinte de contenu et sa date locale informative. Les noms de champs sont des contrats logiques, pas des ajouts au MLD. Le serveur résout lui-même identité, temps d’intégration, droits et correspondances vers les références canoniques.

Les identifiants créés localement sont des références opaques dans l’espace de noms de l’auteur/appareil ; ils ne prouvent aucun droit ni existence serveur. La correspondance vers l’identité canonique est produite après résolution admissible et reste privée. Une référence à une cible cachée ne provoque pas une erreur FK détaillée. Les dépendances entre créations locales sont intégrées dans un ordre compatible ; un cycle ou une dépendance non résolue reste en attente, sans objet partiellement valide exposé.

L’idempotence porte sur auteur/compte, origine et empreinte : un même delta rejoué crée une seule réception et un seul effet métier. La même origine avec une autre empreinte produit un conflit non révélateur, sans remplacement silencieux. L’accusé repris est filtré sous droits actuels ; une ancienne réponse n’est pas une copie accessible après révocation. La date locale ne devient ni date d’autorisation ni ordre canonique de validation.

## 3. Session de reconnexion et reprises

| Phase | Action et frontière | Condition avant phase suivante |
|---|---|---|
| S01 — Identifier | Authentification, compte/appareil/session, versions et capacités ; contexte d’évaluation de canal local | Identité établie selon le cas ; appareil/session admissibles ; négociation de transport sûr. |
| S02 — Sécuriser le local | Mettre en attente les consultations de réplique pendant réconciliation des retraits ; conserver le journal privé et ses pièces nouvelles | Aucune lecture d’une réplique dont la fraîcheur ou l’échéance n’est plus vérifiable. |
| S03 — Appliquer les retraits | Le serveur livre les retraits non qualifiés ; le client les applique aux objets/liens, représentations, index/cache/miniatures concernés | Accusé durable de la génération de retraits ; aucun ajout avant cela. |
| S04 — Recevoir les deltas | T08 : réception technique privée, delta seul, sans FK de cible avant résolution ; accusé durable | Succès de réception distinct de l’intégration ; référence/raison cachée non divulguée. |
| S05 — Résoudre et intégrer | T09 et commande du propriétaire : références/versions/droits actuels, contraintes et commit atomique | Intégré, en attente, conflit ou refus ; delta privé conservé selon procédure, pas de faux succès. |
| S06 — Répliquer les ajouts | Construire le graphe courant sous garde, pages autorisées, manifeste/versions et échéance opposable | Chaque page/reprise réévaluée ; aucun objet issu seulement d’une dérogation. |
| S07 — Confirmer | Résultats d’intégration par opération et progression technique par page/lot | Curseurs avancés seulement après application durable ; distinguer réussite partielle et achèvement. |

Une phase interrompue reprend sur son propre accusé ; le serveur reprend S03 dès qu’une nouvelle génération de droits rend le contexte précédent insuffisant. La négociation initiale n’accorde pas des droits pour toute la session. Le client n’intègre pas des ajouts d’une page à une réplique validée sous une autre génération de retraits sans nouveau contrôle. Les pages en préparation restent isolées du magasin consultable.

S04 peut protéger les deltas avant une résolution longue, mais jamais par un canal d’appareil révoqué ou sans authentification admissible. Si aucun serveur compatible/admissible ne peut recevoir, le journal reste sur le terminal avec possibilité de récupération autorisée ; aucune suppression ne sert de traitement d’erreur.

Pour un appareil révoqué, la synchronisation métier est refusée (ST-01). Un éventuel échange de contrôle sert uniquement à faire appliquer le retrait local, sans données scientifiques nouvelles ni activation des deltas ; son authentification/anti-rejeu est un contrat distinct à démontrer. Le prochain contact ou l’échéance peuvent fermer une réplique ; aucun effacement distant immédiat d’un appareil déconnecté n’est promis.

## 4. ADR-CORE-006 — Curseurs, retraits et absence d’oracle

Le schéma technique porte appareil, session, curseurs par appareil/espace, génération de réconciliation, journal d’accusés et transferts. M13 coordonne ; M14 assure durabilité/idempotence ; M02 décide le graphe et les retraits. Le MLD conserve `reception_differee`, puis `contribution_differee` à références validées : aucune FK de cible n’est ajoutée à la première.

Un curseur opaque et authentifié est lié au compte/appareil, contexte de réplication, versions de protocole et génération de droits. Il n’est ni un compteur global d’objets ni une permission ; il ne peut être transféré à un autre compte/espace. Sa durée de conservation et celle du journal serveur sont des paramètres ouverts. Un curseur trop ancien déclenche une reconstruction contrôlée de réplique, après retraits et sans destruction des deltas ; il ne fait pas rejouer indéfiniment toute mutation historique.

Les retraits visent seulement des références que ce terminal avait légitimement reçues, ou ferment un périmètre de réplique déjà connu. Ils ne donnent pas le motif : révocation, purge, changement de visibilité, expiration ou fin de rattachement ne sont pas distingués. Ils ne listent ni ne comptent des cibles qui n’avaient jamais été délivrées à l’acteur. Les tombstones internes ne deviennent pas des objets de recherche ou des preuves d’existence pour d’autres lecteurs.

Toute restriction nouvelle peut réduire le graphe même si aucun contenu scientifique n’a changé : la réplication est déclenchée aussi par changements d’autorisation/protection/personne, et pas seulement par version d’objet. Les retraits précèdent les ajouts. Si leur exhaustivité ne peut pas être démontrée, une barrière ferme le périmètre concerné jusqu’à reconstruction ; aucune ancienne projection n’est utilisée comme autorisation permissive.

Un accusé durable associe page/génération et état effectivement appliqué ; réception réseau seule ne fait pas avancer le curseur. Rejouer retraits et pages est idempotent. Une remise complète vérifie manifeste et intégrité, pas seulement nombre de lignes. L’unicité/rang/page ne révèle rien hors graphe ; les tests temporels du dossier sécurité s’appliquent aussi à ce canal.

## 5. Compatibilité à quatre niveaux

La matrice publiée distingue logiciel client, format du protocole/delta, schéma de données et référentiel scientifique. La capacité à décoder un message ne prouve pas la capacité à préserver son sens ou à appliquer une nouvelle protection.

| Situation | Décision de session/intégration | Données de l’auteur |
|---|---|---|
| Versions compatibles, sémantique inchangée | Synchronisation normale, droits actuels et versions de base vérifiés | Aucun écrasement silencieux. |
| Conversion déterministe documentée | Adaptation versionnée, état/contenu initial et provenance conservés | Ancien sens reconstituable ; conversion ≠ nouvelle validation scientifique. |
| Référentiel scindé, ambiguïté scientifique | Recevoir si format admissible ; isoler pour décision de réconciliation | Pas de choix automatique ; delta lisible par seul auteur sous règles applicables. |
| Client incapable d’appliquer les retraits/échéances/protections courantes | Suspendre les ajouts et l’usage protégé ; mise à jour requise | Journal privé conservé ; réception seulement si son format et canal sont sûrs. |
| Client hors fenêtre de support mais format de réception sûr | Pas de promesse de fonctionnement complet ; chemin de dépôt/récupération contrôlé si disponible | Deltas préservés, aucun contournement des droits par ancien client. |
| Format de delta inconnu/invalide ou session non admissible | Pas d’intégration ; réception seulement comme dépôt isolé si une procédure explicitement sûre est définie, sinon refus | Conservation locale ; aucune promesse d’interprétation du brut reçu. |

Un convertisseur annonce ses versions d’entrée/sortie, les champs interprétés, les transformations et les limites. Il ne supprime pas les champs inconnus puis déclare le résultat conforme. Les fragments incompris restent isolés ; ils ne doivent pas être réexportés comme une vérité structurée. Le plan de migration vérifie répliques et journaux locaux, prévoit espace disque/récupération, et ne transforme pas une incompatibilité en purge de contributions.

La fenêtre de support est ouverte (PAR-CDC-03) ; son choix doit préciser versions garanties, capacités minimales de sécurité, annonce de dépréciation et voie de récupération. Aucune valeur « deux versions » ou « six mois » n’est adoptée. Un ancien client insuffisant ne reste jamais autorisé à exposer des données protégées au seul motif que la fenêtre produit n’est pas encore fixée.

## 6. ADR-CORE-007 — Échéance opposable sans dépendre de l’heure murale

L’heure serveur fait autorité sur accès/intégration. Toute donnée qui n’est pas simultanément publique et librement redistribuable porte une échéance opposable, objets personnels compris. Sa borne vient du minimum plateforme/espace/habilitant prévu au contrat et des limites applicables du fondement ; elle n’est ni renouvelée par une dérogation ni prolongée par modification de l’heure du terminal. Aucun renouvellement hors connexion n’est possible.

Le serveur remet une autorisation de consultation locale authentifiée, liée au compte/appareil, périmètre/manifeste, génération et échéance serveur. Elle permet une consultation de réplique sous résidu borné ; elle n’autorise jamais une écriture serveur future et ne promet pas la connaissance des révocations survenues après déconnexion. Une nouvelle connexion exige une nouvelle décision, pas une prolongation du seul certificat ancien.

**Ancrage proposé :** heure serveur authentifiée `Ts`, mesure locale monotone de requête/réponse, génération de démarrage et borne vérifiée d’incertitude. À réception, une borne supérieure conservative de l’heure serveur vaut `U0 = Ts + durée aller-retour + incertitude`. Ensuite, `U = U0 + durée monotone écoulée + borne de dérive`. Consultation protégée seulement si `U < échéance`. La prise en compte de tout l’aller-retour ferme éventuellement plus tôt ; elle évite de prolonger par hypothèse optimiste sur la latence. Les bornes d’incertitude/dérive ne sont pas des constantes inventées : elles nécessitent une source de temps et des mesures prouvées.

| Événement local | Comportement requis |
|---|---|
| Heure murale reculée, fuseau ou date modifiés | Aucun prolongement ; l’affichage local peut changer, pas la borne de consultation. |
| Veille/hibernation ou pause d’application | La durée réellement écoulée compte. Si la source monotone ne couvre pas l’intervalle, consultation protégée fermée jusqu’à nouvel ancrage. |
| Redémarrage sans preuve de continuité temporelle | Échéance non prouvable : réplique protégée fermée jusqu’à reconnexion ; journal privé conservé. |
| Retour d’une sauvegarde locale/snapshot ou certificat ancien | Anti-rejeu/rollback à démontrer ; sans preuve de génération/continuité, fermer la consultation protégée. |
| Échéance atteinte pendant navigation/lecture | Fermer les consultations suivantes et dérivés locaux concernés ; ne pas détruire les créations/deltas propres. |
| Ancrage incohérent, dérive non bornée ou contrôle d’intégrité en échec | Refus de consultation protégée ; aucun « mode dégradé » qui prolonge l’échéance. |

Le choix de source monotone/stockage protégé et des capacités de confiance par OS reste à démontrer. La baseline prudente ferme après redémarrage si elle ne dispose pas de preuve suffisante, même avec l’heure murale apparemment correcte. Cela peut limiter la consultation hors ligne sur certains terminaux ; la fiche de compatibilité doit l’indiquer. L’architecture ne garantit pas l’effacement de contenus déjà copiés par une personne ou par un terminal compromis ; cette limite n’allonge pas l’échéance du client conforme.

## 7. Conflits, objets retirés et reconstruction

À intégration, le serveur compare version de base, versions de référentiel et droits courants. Une évolution susceptible de modifier le sens garde les propositions concurrentes et demande un arbitrage humain ; une fusion déterministe purement technique doit être prouvée, documentée et conserver provenance. Une base inconnue/purgée ne doit pas être reconstruite à partir du delta pour ressusciter un contenu interdit. Les différences exposées au client sont elles-mêmes autorisées.

Les créations dans un espace devenu fermé ou inaccessible ne sont pas déplacées silencieusement dans le Core partagé. Elles restent des deltas privés à réconcilier selon l’autorité actuelle ; une destination nouvelle exige un acte explicite admissible. Refus de contribution n’efface pas paternité ni delta, et ne fournit aucune cible privée par message d’erreur.

Une reconstruction de réplique après curseur obsolète, purge, restauration serveur ou migration utilise une génération nouvelle. Les données préparées sont séparées de celles consultables ; retraits/barrière, manifeste, autorisation et échéance précèdent leur activation. Le journal local survit à la reconstruction, avec correspondances d’identité traitées sans supposer une intégration passée. Le serveur vérifie les purges et droits actuellement opposables avant réindexation et ouverture ; ST-12 s’applique.

## 8. Schéma technique et frontières transactionnelles

| Structure logique | Propriétaire | Atomicité / frontière |
|---|---|---|
| Appareil/session et révocation | M01/M02 selon leurs écritures | Statut d’appareil/session et faits de sécurité opposables coordonnés ; aucune reprise sur session révoquée. |
| Session sync, curseur/génération, pages et accusés | M13 avec primitives durables M14 | Avancement serveur après accusé durable, lié au contexte ; jamais un indicateur d’autorisation autonome. |
| Réception privée | M13, `reception_differee` | T08 atomique avec identité d’opération, empreinte et accusé ; références client opaques. |
| Contribution résolue et effet métier | M13 puis propriétaire métier | T09 : correspondance, droits courants, mutation/versions et état intégré dans un même commit. |
| Préparation page sortante | M13/M02, lecteur métier | Garde courante et point de divulgation du dossier sécurité ; cache/page préparée jamais permission. |
| Chunks/transfert de fichiers | M14/M05 | Réseau hors transaction longue ; chunks identifiés/empreintes, reprise puis conservation confirmée avant usage scientifique. |
| Activation/retrait côté client | Client local, journal séparé | Commit local durable de génération/manifeste ; aucun ajout consultable avant retrait requis ; récupération après panne. |

Ces structures techniques ne sont pas de nouvelles tables scientifiques du MLD. Le MPD devra préciser PK/FK, uniques d’idempotence, chiffrage, anti-rejeu, rétention, index et protocole d’accusé. Aucun moteur local, format de transport ou algorithme cryptographique propriétaire n’est choisi ici.

## 9. Matrice de couverture des obligations techniques

| Obligation | Disposition | Vérification |
|---|---|---|
| ST-01 | § 3/8, appareil révocable et retrait de réplique au contact admissible | SY01/SY10 |
| ST-02 | § 2/4, curseurs contextualisés et accusés durables | SY02/SY03/SY11 |
| ST-03 | § 3, contexte de canal local et graphe actuel par page | SY01/SY04 |
| ST-04 | § 3/4, retraits non qualifiés avant ajouts | SY04/SY05 |
| ST-05 | § 2/5, quatre versions et provenance de conversion | SY06/SY07 |
| ST-06 | § 1/6, stockage chiffré et aucune biométrie conservée | SY08/SY09, preuve OS à fournir |
| ST-07 | § 1/3/5/7, deltas non supprimés par cache/mise à jour/expiration | SY05/SY07/SY11 |
| ST-08 | § 1/8, binaires à politique de réseau et reprise propres | SY12 |
| ST-12 | § 7, purges réappliquées avant reprise serveur/réplique | SY11 |
| ST-13 | § 3/8, tâches techniques durables, manifestes et résultats scientifiques distincts | SY02/SY12 |
| ST-14 | § 3/8, identité/session/appareil, réauthentification selon sensibilité ; pas biométrie stockée | SY01/SY10 ; modalités du dossier identité |

ST-09 (invitation), ST-10 (imputation), ST-11 (diffusion) et ST-15 (exploitation) restent dans leurs dossiers propriétaires. Leur absence de cette matrice ne les supprime pas. CP-27/28/40/50 sont transversales aux phases décrites et aux transactions T08/T09/T17.

## 10. Scénarios de crash-test

| ID | Situation | Verdict requis |
|---|---|---|
| SY01 | Deux comptes/appareils, mauvais contexte ou identité périmée | Aucune réplique ni correspondance révélée par autre compte/appareil. |
| SY02 | Réception/intégration, panne à chaque frontière puis rejeu | Un delta reçu, un effet intégré ou état privé en attente ; aucun faux succès. |
| SY03 | Même origine avec contenu différent ; réponse perdue | Conflit sûr, ancien delta conservé, idempotence sans fuite d’une réponse ancienne. |
| SY04 | Révocation entre deux pages, nouveau droit pendant retrait | Nouvelle génération/évaluation ; retraits opposables avant ajouts, pas mélange permissif. |
| SY05 | Objet caché/purgé/retiré et création non synchronisée | Retrait non qualifié, delta intact, aucune reconstitution ni révélation de motif/cible. |
| SY06 | Nouveau référentiel à conversion certaine puis ambiguë | Provenance/contexte conservés ; ambiguïté en attente sans décision scientifique automatique. |
| SY07 | Client trop ancien, migration locale en panne/disque plein | Réplique protégée fermée si nécessaire ; journal récupérable ; aucun delta effacé. |
| SY08 | Heure reculée, fuseau changé, veille de longue durée | Borne de consultation jamais prolongée ; refus si temps écoulé non prouvable. |
| SY09 | Redémarrage/rollback d’un snapshot local ou certificat | Pas renouvellement ni réactivation de réplique ; preuve de continuité ou reconnexion exigée. |
| SY10 | Session/appareil révoqué puis reconnexion avec ancien curseur | Pas de synchronisation métier ; retrait de contrôle sûr sans ajouts ni intégration par appareil révoqué. |
| SY11 | Curseur expiré et serveur restauré avant purge/intégration passée | Reconstruction autorisée après purges, droits actuels et manifeste ; deltas privés non perdus, aucune double intégration. |
| SY12 | Gros fichier coupé, chunk corrompu, reprise sur réseau autorisé | Intégrité et politique réseau, reprise idempotente ; pas de disponibilité confirmée d’un original incomplet. |

Les douze scénarios sont **spécifiés, non exécutés**. Ils demandent corpus/version, appareil et OS, ordonnance de panne/concurrence, traces de réception/commit/accusé/horloge et sorties filtrées. Les preuves du modèle V1.6 ne démontrent pas les primitives locales, le stockage ou la continuité d’horloge.

## 11. Décisions ouvertes et responsables

| Point | Responsable | Décision / preuve avant utilisation |
|---|---|---|
| SYN-01 — Plafonds hors ligne | Produit/gouvernance + sécurité | PAR-CDC-05 : valeurs plateforme/espace/habilitant et conséquences terrain ; aucune durée d’exemple adoptée. |
| SYN-02 — Fenêtre de compatibilité | Produit + architecture | PAR-CDC-03/DEC-ARCH-03 : versions/capacités garanties, annonce et récupération ; SY06/07. |
| SYN-03 — Rétention de curseurs/accusés | Architecture/exploitation + données | Délai de reconnexion attendu, coûts et reconstruction ; unicité durable empêchant double effet après expiration technique, SY02/11. |
| SYN-04 — Temps et anti-rollback | Clients/sécurité + architecture | Source monotone par OS, veille/redémarrage, incertitude/dérive, stockage/génération et ancrage authentifié ; SY08/09. |
| SYN-05 — Canal appareil révoqué | Identité/sécurité | Contrôle de retrait séparé, sans accès métier ; récupération de journal sur compte/appareil admissible, SY10. |
| SYN-06 — Capacités et budgets | Architecture/clients/exploitation | Tailles de pages/deltas/chunks, espace disque, concurrence et politique réseau, mesures NF du CDC ; SY04/07/12. |
| SYN-07 — Adoption physique du protocole | Architecture/Core/MPD | Schéma technique, transport, garanties d’accusé et points de divulgation SEC-01/03/05 ; tous scénarios. |

ADR-CORE-005 à 007 instruisent le protocole et ses exigences ; ils restent candidats. Les décisions numériques ne sont pas nécessaires à la rédaction de ces contrats, mais devront être arrêtées avant recette/livraison. Le prochain dossier précisera persistance, stockage documentaire, conservation et restauration, notamment la survie des identités d’opération et du registre de purges.
